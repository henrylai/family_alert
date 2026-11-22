import React, { useState } from 'react';
import { BellRing, Smartphone, Shield, X, CheckCircle2 } from 'lucide-react';

interface DNDSetupGuideModalProps {
  onClose: () => void;
}

export const DNDSetupGuideModal: React.FC<DNDSetupGuideModalProps> = ({ onClose }) => {
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android'>('ios');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Do Not Disturb & Ringer Setup</h3>
              <p className="text-xs text-slate-400">Ensure emergency alerts break through silent mode</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl my-4 border border-slate-800">
          <button
            type="button"
            onClick={() => setActivePlatform('ios')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activePlatform === 'ios' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Apple iPhone (iOS)
          </button>
          <button
            type="button"
            onClick={() => setActivePlatform('android')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activePlatform === 'android' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Android
          </button>
        </div>

        {/* iOS Guide */}
        {activePlatform === 'ios' ? (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 font-bold text-red-400 text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Step 1: Add App to Home Screen</span>
              </div>
              <p className="text-slate-400">
                In Safari, tap the <strong>Share</strong> button (box with up arrow) and select <strong>"Add to Home Screen"</strong>. This activates Apple Web Push capabilities.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-400 text-sm">
                <Shield className="w-4 h-4" />
                <span>Step 2: Enable Emergency Bypass on Contacts</span>
              </div>
              <p className="text-slate-400">
                iOS allows emergency contacts to ring even in Do Not Disturb and Silent switch mode:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                <li>Open the <strong>Contacts</strong> app on your iPhone.</li>
                <li>Select your family member's contact card and tap <strong>Edit</strong>.</li>
                <li>Tap <strong>Ringtone</strong> and toggle <strong>"Emergency Bypass" to ON</strong>.</li>
                <li>Tap <strong>Text Tone</strong> and also toggle <strong>"Emergency Bypass" to ON</strong>.</li>
              </ol>
            </div>

            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-2xs text-red-300">
              💡 <strong>How Web MVP Alerts Work:</strong> When an alert triggers, you receive an urgent Web Push. Tapping the push immediately opens the app and sounds a loud European dual-tone siren at 100% volume with Screen Wake Lock.
            </div>
          </div>
        ) : (
          /* Android Guide */
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 font-bold text-red-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Step 1: Allow High-Priority Notifications</span>
              </div>
              <p className="text-slate-400">
                When prompted by Chrome, tap <strong>"Allow Notifications"</strong>. Then in Android Settings &gt; Apps &gt; Chrome &gt; Notifications, ensure <strong>"High Priority"</strong> is enabled.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 font-bold text-emerald-400 text-sm">
                <Shield className="w-4 h-4" />
                <span>Step 2: Set Starred Family Contacts in DND</span>
              </div>
              <p className="text-slate-400">
                Configure Android's Do Not Disturb exceptions:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                <li>Open <strong>Settings &gt; Sound &gt; Do Not Disturb</strong>.</li>
                <li>Tap <strong>People / Calls</strong> and select <strong>"Starred Contacts Only"</strong>.</li>
                <li>Star your family members in your Android Contacts app.</li>
              </ol>
            </div>

            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-2xs text-red-300">
              💡 <strong>Foreground Alarm:</strong> Once tapped or opened, the web app triggers the Web Audio API on Android's media stream and locks the display awake.
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all"
        >
          Got It, Done
        </button>
      </div>
    </div>
  );
};
