/**
 * Lightweight per-user cache for profile fields the UI shows immediately
 * (name, avatar, level). Backed by localStorage, which Capacitor's WebView
 * persists across sessions on iOS, Android and the web.
 *
 * The cache is best-effort: read failures return null, write failures are
 * swallowed. The Supabase fetch is still the source of truth.
 */

const KEY_PREFIX = 'uberlingen-profile-cache-';

export interface CachedProfile {
  name: string;
  avatarUrl: string | null;
  level: string;
  cachedAt: number;
}

type ProfilePatch = Partial<Omit<CachedProfile, 'cachedAt'>>;

function key(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export function getCachedProfile(userId: string): CachedProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedProfile;
    if (typeof parsed?.name !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCachedProfile(userId: string, patch: ProfilePatch): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCachedProfile(userId);
    const merged: CachedProfile = {
      name: patch.name ?? existing?.name ?? '',
      avatarUrl:
        patch.avatarUrl !== undefined ? patch.avatarUrl : existing?.avatarUrl ?? null,
      level: patch.level ?? existing?.level ?? 'bronze',
      cachedAt: Date.now(),
    };
    window.localStorage.setItem(key(userId), JSON.stringify(merged));
  } catch {
    // ignore quota / private-mode errors
  }
}

export function clearCachedProfile(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key(userId));
  } catch {
    // ignore
  }
}

export function clearAllCachedProfiles(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(window.localStorage);
    for (const k of keys) {
      if (k.startsWith(KEY_PREFIX)) window.localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}
