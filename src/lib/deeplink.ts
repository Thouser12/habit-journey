import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { NavigateFunction } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NATIVE_AUTH_HOST, NATIVE_URL_SCHEME } from './platform';

/**
 * Registers a deep-link listener that catches custom-scheme URLs
 * (uberlingen://...) coming from Supabase auth emails and routes
 * them to the right screen after restoring the session.
 *
 * Works on both iOS and Android — Capacitor's @capacitor/app plugin
 * normalizes the appUrlOpen event across platforms.
 */
export function setupDeepLinkHandler(navigate: NavigateFunction): () => void {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  const handler = async (event: URLOpenListenerEvent) => {
    const raw = event.url;
    if (!raw || !raw.startsWith(`${NATIVE_URL_SCHEME}://`)) return;

    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return;
    }

    if (parsed.host !== NATIVE_AUTH_HOST) return;

    // Supabase puts auth tokens in the URL fragment: #access_token=...&refresh_token=...&type=...
    const fragment = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
    const params = new URLSearchParams(fragment || parsed.search.replace(/^\?/, ''));

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');
    const errorCode = params.get('error_code') || params.get('error');

    if (errorCode) {
      // eslint-disable-next-line no-console
      console.error('Auth deep link error:', errorCode, params.get('error_description'));
      navigate('/login');
      return;
    }

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to set Supabase session from deep link:', error);
        navigate('/login');
        return;
      }
    }

    // Decide where to land
    const path = parsed.pathname.replace(/^\/+/, '');
    if (type === 'recovery' || path === 'reset-password') {
      navigate('/reset-password');
    } else {
      navigate('/');
    }
  };

  const subscriptionPromise = App.addListener('appUrlOpen', handler);

  return () => {
    void subscriptionPromise.then((sub) => sub.remove());
  };
}
