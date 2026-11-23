import { useState, useCallback } from 'react';
import {
  registerServiceWorker,
  subscribeToPush,
  getPushPermissionStatus
} from '../lib/push.js';

export function usePush(memberId: string | null, groupId: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? getPushPermissionStatus() : 'default'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const register = useCallback(
    async (replaceExisting = false) => {
      if (!memberId || !groupId) {
        setError('Missing member session');
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        const granted = await requestPermission();
        if (!granted) {
          setError('Notification permission was denied. Please allow notifications in browser settings.');
          return false;
        }

        const registration = await registerServiceWorker();
        await subscribeToPush(registration, memberId, groupId, replaceExisting);
        return true;
      } catch (err: any) {
        setError(err instanceof Error ? err.message : 'Failed to register push notifications');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [memberId, groupId, requestPermission]
  );

  return { permission, loading, error, register, requestPermission };
}
