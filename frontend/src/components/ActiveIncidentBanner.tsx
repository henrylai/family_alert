import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCheck } from 'lucide-react';
import { EmergencyIncident } from '../types/index.js';

interface ActiveIncidentBannerProps {
  incident: EmergencyIncident;
  onOpenAlarm: () => void;
  onResolve: () => void;
}

export const ActiveIncidentBanner: React.FC<ActiveIncidentBannerProps> = ({
  incident,
  onOpenAlarm,
  onResolve
}) => {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    const start = new Date(incident.startedAt).getTime();
    const update = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [incident.startedAt]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white rounded-2xl p-4 shadow-xl mb-4 border border-red-400/40 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider">
              EMERGENCY ACTIVE: {incident.senderName}
            </h4>
            <p className="text-xs text-red-100 font-mono">
              Elapsed: {formatTimer(elapsed)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onOpenAlarm}
            className="px-3 py-1.5 bg-white text-red-700 font-bold text-xs rounded-xl shadow hover:bg-slate-100"
          >
            View Alarm
          </button>
          <button
            type="button"
            onClick={onResolve}
            className="p-1.5 bg-red-950/60 hover:bg-red-950 text-white rounded-xl text-xs"
            title="Mark Resolved"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
