import * as Notifications from 'expo-notifications';
import type { Scenario } from './scenarios';

// While the app is open we play the sound ourselves, so the OS notification stays silent and hidden.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED) return true;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return asked.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
}

/** Schedules the backup notification that plays the scenario sound if the app is closed or locked. */
export async function scheduleVisit(scenario: Scenario, seconds: number): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: scenario.notifTitle,
      body: scenario.notifBody,
      sound: scenario.file,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(seconds)),
      repeats: false,
    },
  });
}

export async function cancelVisit(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
