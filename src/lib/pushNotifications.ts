import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  type PushNotificationSchema,
  type ActionPerformed,
  type Token,
} from '@capacitor/push-notifications';
import type { NavigateFunction } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const APP_NAME = 'patient';

let registered = false;
let removeListeners: (() => void) | null = null;

export async function setupPushNotifications(
  userId: string,
  navigate: NavigateFunction,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (registered) return;
  registered = true;

  const platform = Capacitor.getPlatform() as 'ios' | 'android';

  try {
    const status = await PushNotifications.checkPermissions();
    let display = status.receive;
    if (display === 'prompt' || display === 'prompt-with-rationale') {
      const requested = await PushNotifications.requestPermissions();
      display = requested.receive;
    }
    if (display !== 'granted') return;

    const tokenSub = await PushNotifications.addListener('registration', async (token: Token) => {
      try {
        await supabase
          .from('device_tokens')
          .upsert(
            {
              user_id: userId,
              token: token.value,
              platform,
              app: APP_NAME,
            },
            { onConflict: 'token' },
          );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to upsert device token:', err);
      }
    });

    const errorSub = await PushNotifications.addListener('registrationError', (err) => {
      // eslint-disable-next-line no-console
      console.error('Push registration error:', err);
    });

    const receivedSub = await PushNotifications.addListener(
      'pushNotificationReceived',
      (_notification: PushNotificationSchema) => {
        // Foreground notifications: iOS shows nothing by default; Android shows
        // the system tray. We rely on the system tray for visual cue and let
        // the user tap to navigate.
      },
    );

    const actionSub = await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        const data = action.notification.data as Record<string, string> | undefined;
        if (!data) return;
        if (data.type === 'message') {
          navigate('/chat');
        }
      },
    );

    removeListeners = () => {
      void tokenSub.remove();
      void errorSub.remove();
      void receivedSub.remove();
      void actionSub.remove();
    };

    await PushNotifications.register();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to set up push notifications:', err);
    registered = false;
  }
}

export async function teardownPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (removeListeners) {
    removeListeners();
    removeListeners = null;
  }
  registered = false;
}

/**
 * Best-effort cleanup of the current device token before sign-out so the
 * server stops pushing to a logged-out device.
 */
export async function deleteOwnDeviceTokens(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await supabase.from('device_tokens').delete().eq('user_id', userId).eq('app', APP_NAME);
  } catch {
    // ignore -- next push will fail and dispatcher will prune
  }
}
