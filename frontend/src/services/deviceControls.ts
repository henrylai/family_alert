// Screen Wake Lock & Vibration Device Controls

let wakeLockSentinel: any = null;
let vibrationInterval: number | null = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  if ('wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch (err: any) {
      console.warn('[WakeLock] Unable to acquire wake lock:', err.message);
    }
  }
  return false;
}

export function releaseScreenWakeLock() {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
    } catch (e) {
      // Ignored
    }
    wakeLockSentinel = null;
  }
}

export function startUrgentVibration() {
  if ('vibrate' in navigator) {
    // Vibrate pattern: 500ms on, 200ms off, 500ms on
    navigator.vibrate([500, 200, 500, 200, 500]);
    if (!vibrationInterval) {
      vibrationInterval = window.setInterval(() => {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }, 2000);
    }
  }
}

export function stopUrgentVibration() {
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}
