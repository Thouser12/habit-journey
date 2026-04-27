import { Capacitor } from '@capacitor/core';

export const NATIVE_URL_SCHEME = 'uberlingen';
export const NATIVE_AUTH_HOST = 'auth';

/**
 * Returns the origin URL that Supabase auth emails should link back to.
 * On native, uses the custom URL scheme so the OS opens the app instead
 * of the browser. On web, uses the current origin.
 */
export function getAppOrigin(): string {
  if (Capacitor.isNativePlatform()) {
    return `${NATIVE_URL_SCHEME}://${NATIVE_AUTH_HOST}`;
  }
  return window.location.origin;
}

export const isNative = () => Capacitor.isNativePlatform();
