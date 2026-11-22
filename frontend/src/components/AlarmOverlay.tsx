import React, { useState } from 'react';
import { VolumeX, CheckCircle, Navigation, PhoneCall, AlertOctagon, Users } from 'lucide-react';
import { EmergencyIncident, IncidentAcknowledgment } from '../types/index.js';

interface AlarmOverlayProps {
  incident: EmergencyIncident;
  acknowledgments: IncidentAcknowledgment[];
  isSender: boolean;
  onAcknowledge: (status: 'safe' | 'on_my_way' | 'calling_911' | 'seen') => void;
  onResolve: () => void;
  onMuteSiren: () => void;
  isMuted: boolean;
}

export const AlarmOverlay: React.FC<AlarmOverlayProps> = ({
  incident,
  acknowledgments,
  isSender,
  onAcknowledge,
  onResolve,
  onMuteSiren,
  isMuted
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const handleAction = (status: 'safe' | 'on_my_way' | 'calling_911' | 'seen') => {
    setSelectedStatus(status);
    onAcknowledge(status);
    onMuteSiren();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-red-950 text-white animate-flash overflow-y-auto">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between pt-4">
        <div className="flex items-center space-x-2 bg-red-900/80 px-3 py-1.5 rounded-full border border-red-500/50">
          <span className="w-3 h-3 rounded-full bg-red-400 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-widest text-red-100">Live Incident</span>
        </div>

        <button
          type="button"
          onClick={onMuteSiren}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-all ${
            isMuted
              ? 'bg-slate-800 text-slate-300 border border-slate-700'
              : 'bg-white text-red-900 hover:bg-slate-100 animate-bounce'
          }`}
        >
          <VolumeX className="w-5 h-5" />
          <span>{isMuted ? 'SIREN MUTED' : 'MUTE SIREN'}</span>
        </button>
      </div>

      {/* Main Alert Message */}
      <div className="my-auto text-center max-w-sm px-4">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-600 flex items-center justify-center shadow-2xl border-4 border-red-400">
          <AlertOctagon className="w-14 h-14 text-white" />
        </div>

        <h1 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
          {incident.senderName}
        </h1>
        <p className="text-lg font-bold text-red-200 mt-1 uppercase tracking-wide">
          Has Triggered An Emergency Alert
        </p>
        <p className="text-xs text-red-300 mt-2 font-mono bg-red-900/40 py-1 px-3 rounded-lg inline-block">
          Started: {new Date(incident.startedAt).toLocaleTimeString()}
        </p>

        {acknowledgments.length > 0 && (
          <div className="mt-4 p-3 bg-slate-900/80 border border-red-500/30 rounded-2xl text-left max-h-32 overflow-y-auto">
            <p className="text-2xs font-bold uppercase tracking-wider text-red-300 mb-1 flex items-center space-x-1">
              <Users className="w-3.5 h-3.5" />
              <span>Responses ({acknowledgments.length})</span>
            </p>
            <div className="space-y-1">
              {acknowledgments.map((ack) => (
                <div key={ack.id} className="text-xs flex items-center justify-between text-slate-200">
                  <span className="font-semibold">{ack.memberName}:</span>
                  <span className="capitalize font-mono text-2xs text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded">
                    {ack.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action / Response Buttons */}
      <div className="w-full max-w-md space-y-3 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-red-300 text-center mb-2">
          Respond to Family
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleAction('on_my_way')}
            className={`flex items-center justify-center space-x-2 py-4 px-4 rounded-2xl font-bold text-sm border transition-all ${
              selectedStatus === 'on_my_way'
                ? 'bg-emerald-600 border-emerald-400 text-white'
                : 'bg-slate-900/90 border-slate-700 hover:bg-slate-800 text-white'
            }`}
          >
            <Navigation className="w-5 h-5 text-emerald-400" />
            <span>On My Way</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('safe')}
            className={`flex items-center justify-center space-x-2 py-4 px-4 rounded-2xl font-bold text-sm border transition-all ${
              selectedStatus === 'safe'
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-slate-900/90 border-slate-700 hover:bg-slate-800 text-white'
            }`}
          >
            <CheckCircle className="w-5 h-5 text-blue-400" />
            <span>I'm Safe</span>
          </button>
        </div>

        <a
          href="tel:911"
          onClick={() => handleAction('calling_911')}
          className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm border border-amber-400 shadow-lg text-center"
        >
          <PhoneCall className="w-5 h-5" />
          <span>Call 911 Emergency Services</span>
        </a>

        {/* Resolve Incident Option */}
        <button
          type="button"
          onClick={onResolve}
          className="w-full py-3 text-xs font-bold uppercase tracking-widest text-red-300 hover:text-white underline text-center pt-2"
        >
          {isSender ? 'End Emergency & Mark All Clear' : 'Mark Emergency Resolved'}
        </button>
      </div>
    </div>
  );
};
