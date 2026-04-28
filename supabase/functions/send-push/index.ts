/// <reference lib="deno.ns" />
// deno-lint-ignore-file no-explicit-any

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

interface SendPushBody {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

const FCM_BASE = 'https://fcm.googleapis.com/v1/projects';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

async function signJwt(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  };
  const headerB64 = base64UrlEncode(utf8ToBytes(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(utf8ToBytes(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, utf8ToBytes(signingInput)),
  );
  return `${signingInput}.${base64UrlEncode(sigBytes)}`;
}

async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }
  const jwt = await signJwt(serviceAccount);
  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to fetch FCM access token: ${resp.status} ${text}`);
  }
  const json = await resp.json();
  cachedAccessToken = {
    token: json.access_token as string,
    expiresAt: Date.now() + (json.expires_in as number) * 1000,
  };
  return cachedAccessToken.token;
}

interface DeviceToken {
  id: string;
  token: string;
  platform: 'ios' | 'android';
}

async function sendToToken(
  projectId: string,
  accessToken: string,
  device: DeviceToken,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<{ ok: true } | { ok: false; remove: boolean; status: number; error: any }> {
  const stringData: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) stringData[k] = String(v);

  const message: any = {
    message: {
      token: device.token,
      notification: { title, body },
      data: stringData,
    },
  };
  if (device.platform === 'ios') {
    message.message.apns = {
      payload: { aps: { sound: 'default' } },
    };
  } else {
    message.message.android = { priority: 'HIGH' };
  }

  const resp = await fetch(`${FCM_BASE}/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (resp.ok) return { ok: true };

  const errJson = await resp.json().catch(() => ({}));
  const errCode = errJson?.error?.details?.[0]?.errorCode ?? errJson?.error?.status ?? '';
  const remove =
    errCode === 'UNREGISTERED' ||
    errCode === 'INVALID_ARGUMENT' ||
    errCode === 'NOT_FOUND';
  return { ok: false, remove, status: resp.status, error: errJson };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: SendPushBody;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  if (!payload.userId || !payload.title || !payload.body) {
    return new Response('userId, title and body are required', { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const fcmServiceAccountRaw = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON')!;

  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(fcmServiceAccountRaw);
  } catch {
    return Response.json({ error: 'FCM_SERVICE_ACCOUNT_JSON is invalid JSON' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: tokens, error } = await supabase
    .from('device_tokens')
    .select('id, token, platform')
    .eq('user_id', payload.userId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!tokens || tokens.length === 0) {
    return Response.json({ sent: 0, removed: 0 });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(serviceAccount);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  let sent = 0;
  const toRemove: string[] = [];

  for (const device of tokens as DeviceToken[]) {
    const result = await sendToToken(
      serviceAccount.project_id,
      accessToken,
      device,
      payload.title,
      payload.body,
      payload.data ?? {},
    );
    if (result.ok) {
      sent++;
    } else if (result.remove) {
      toRemove.push(device.id);
    } else {
      // eslint-disable-next-line no-console
      console.error(`FCM error for token ${device.id}:`, result.status, JSON.stringify(result.error));
    }
  }

  let removed = 0;
  if (toRemove.length > 0) {
    const { error: delError } = await supabase
      .from('device_tokens')
      .delete()
      .in('id', toRemove);
    if (delError) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete invalid tokens:', delError);
    } else {
      removed = toRemove.length;
    }
  }

  return Response.json({ sent, removed });
});
