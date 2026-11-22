import React, { useState } from 'react';
import { Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { audioAlarm } from '../services/audioAlarm.js';
import { startUrgentVibration, stopUrgentVibration } from '../services/deviceControls.js';

export const SirenTestCard: React.FC = () => {
  const [testing, setTesting] = useState(false);

  const toggleTest = () => {
    if (testing) {
      audioAlarm.stopSiren();
      stopUrgentVibration();
      setTesting(false);
    } else {
      audioAlarm.unlockAudio();
      audioAlarm.startSiren(5); // 5-second sample
      startUrgentVibration();
      setTesting(true);

      setTimeout(() => {
        setTesting(false);
        stopUrgentVibration();
      }, 5000);
    }
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <div className={`p-2.5 rounded-xl ${testing ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300'}`}>
          {testing ? <Volume2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-200">Test Alarm Siren (5s)</h4>
          <p className="text-2xs text-slate-400">Verify speaker volume & vibration</p>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleTest}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
          testing
            ? 'bg-red-700 text-white'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
        }`}
      >
        {testing ? 'Stop Test' : 'Play Test'}
      </button>
    </div>
  );
};
