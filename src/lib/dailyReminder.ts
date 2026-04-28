import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type ScheduleOptions } from '@capacitor/local-notifications';

/**
 * Daily reminder helpers. Backed by @capacitor/local-notifications, which
 * agenda no proprio device (sem servidor). Funciona em iOS e Android.
 *
 * Use a fixed notification id so re-scheduling overwrites the previous one.
 */

const DAILY_REMINDER_ID = 1001;

const STORAGE_KEY = 'uberlingen-reminder-settings';

export interface ReminderSettings {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
}

const DEFAULTS: ReminderSettings = {
  enabled: true,
  hour: 20,
  minute: 0,
};

export function getReminderSettings(): ReminderSettings {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULTS.enabled,
      hour: clampHour(parsed.hour),
      minute: clampMinute(parsed.minute),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveReminderSettings(settings: ReminderSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        enabled: settings.enabled,
        hour: clampHour(settings.hour),
        minute: clampMinute(settings.minute),
      }),
    );
  } catch {
    // ignore quota / private-mode errors
  }
}

export function clearReminderSettings(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function clampHour(value: unknown): number {
  const n = typeof value === 'number' ? value : DEFAULTS.hour;
  return Math.min(23, Math.max(0, Math.round(n)));
}

function clampMinute(value: unknown): number {
  const n = typeof value === 'number' ? value : DEFAULTS.minute;
  return Math.min(59, Math.max(0, Math.round(n)));
}

export async function ensurePermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return true;
    if (status.display === 'denied') return false;
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleDailyReminder(settings: ReminderSettings): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!settings.enabled) {
    await cancelDailyReminder();
    return;
  }

  const granted = await ensurePermission();
  if (!granted) return;

  // Always cancel before scheduling to avoid stacking notifications across re-runs
  await cancelDailyReminder();

  const options: ScheduleOptions = {
    notifications: [
      {
        id: DAILY_REMINDER_ID,
        title: 'Hora de registrar suas metas',
        body: 'Abra o Uberlingen e confira seu progresso de hoje.',
        schedule: {
          on: { hour: settings.hour, minute: settings.minute },
          allowWhileIdle: true,
          repeats: true,
        },
        smallIcon: 'ic_launcher',
      },
    ],
  };

  try {
    await LocalNotifications.schedule(options);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to schedule daily reminder:', err);
  }
}

export async function cancelDailyReminder(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: DAILY_REMINDER_ID }],
    });
  } catch {
    // ignore -- nothing to cancel
  }
}
