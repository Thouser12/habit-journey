import { Capacitor } from '@capacitor/core';

/**
 * Returns the origin URL that Supabase auth emails should link back to.
 * On native platforms, uses the production domain so Universal / App Links
 * can open the installed app. On web, uses the current origin.
 */
export function getAppOrigin(): string {
  if (Capacitor.isNativePlatform()) {
    return 'https://uberlingen.app';
  }
  return window.location.origin;
}

export const isNative = () => Capacitor.isNativePlatform();
