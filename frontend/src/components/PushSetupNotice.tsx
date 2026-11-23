import React, { useEffect, useState } from 'react';
import { BellRing, Smartphone, CheckCircle } from 'lucide-react';
import { syncExistingPushSubscription } from '../lib/push.js';
import { isIos, isStandalone } from '../lib/pwa.js';
import { usePush } from '../hooks/usePush.js';

interface PushSetupNoticeProps {
  memberId: string;
  groupId: string;
  onRegistered?: () => void;
}

export const PushSetupNotice: React.FC<PushSetupNoticeProps> = ({
  memberId,
  groupId,
  onRegistered
}) => {
  const { permission, loading, error, register } = usePush(memberId, groupId);
  const [hasRegisteredDevice, setHasRegisteredDevice] = useState<boolean | null>(null);
  const [requiresIosInstall, setRequiresIosInstall] = useState(false);

  useEffect(() => {
    let active = true;

    // Check iOS PWA status
    if (isIos() && !isStandalone()) {
      setRequiresIosInstall(true);
      setHasRegisteredDevice(false);
      return;
    }

    // Auto-sync if permission is already granted
    syncExistingPushSubscription(memberId, groupId)
      .then((isRegistered) => {
        if (active) {
          setHasRegisteredDevice(isRegistered);
          if (isRegistered && onRegistered) onRegistered();
        }
      })
      .catch(() => {
        if (active) setHasRegisteredDevice(false);
      });

    return () => {
      active = false;
    };
  }, [memberId, groupId, onRegistered]);

  if (hasRegisteredDevice) return null;

  // iOS Safari requires Add to Home Screen first
  if (requiresIosInstall) {
    return (
      <div className="w-full mb-4 p-4 rounded-2xl bg-amber-950/60 border border-amber-600/40 text-left shadow-lg">
        <div className="flex items-start space-x-3">
          <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-200 uppercase tracking-wide">
              Install to Enable iPhone Alerts
            </h4>
            <p className="text-amber-100/90 mt-1">
              Apple iOS only allows push notifications from Home Screen apps.
            </p>
            <ol className="list-decimal pl-4 mt-2 space-y-1 text-amber-200">
              <li>Tap the <strong>Share</strong> button in Safari (box with up arrow).</li>
              <li>Select <strong>Add to Home Screen</strong>.</li>
              <li>Open <strong>Family Alert</strong> from your home screen and enable notifications.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const enableNotifications = async () => {
    const success = await register(true);
    if (success) {
      setHasRegisteredDevice(true);
      if (onRegistered) onRegistered();
    }
  };

  return (
    <div className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-red-950/80 to-slate-900 border border-red-500/40 text-left shadow-xl">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-red-600/20 text-red-400 rounded-xl shrink-0 mt-0.5">
          <BellRing className="w-5 h-5 animate-bounce" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5">
            <span>Enable Emergency Push Alerts</span>
          </h4>
          <p className="text-2xs text-slate-300 mt-1">
            {permission === 'denied'
              ? 'Notifications are blocked in your browser. Tap site settings to allow notifications so you never miss an alert.'
              : 'Required to sound the emergency alarm and notify you when your phone screen is locked.'}
          </p>

          {permission !== 'denied' && (
            <button
              type="button"
              onClick={enableNotifications}
              disabled={loading}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Activating Alerts...' : 'Turn On Emergency Notifications'}</span>
            </button>
          )}

          {error && <p className="text-2xs text-red-300 mt-2 font-medium">{error}</p>}
        </div>
      </div>
    </div>
  );
};
