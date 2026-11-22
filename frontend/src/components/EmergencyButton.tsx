import React, { useState, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface EmergencyButtonProps {
  onTrigger: () => void;
  disabled?: boolean;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ onTrigger, disabled }) => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const startHold = () => {
    if (disabled) return;
    setHolding(true);
    setProgress(0);

    const startTime = Date.now();
    const duration = 1200; // 1.2 seconds hold

    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);
    }, 20);

    timerRef.current = window.setTimeout(() => {
      cleanup();
      onTrigger();
    }, duration);
  };

  const cancelHold = () => {
    cleanup();
    setHolding(false);
    setProgress(0);
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 my-4 select-none">
      <div className="relative flex items-center justify-center">
        {/* Animated glowing backdrops */}
        <div className={`absolute w-64 h-64 rounded-full bg-red-600/20 blur-xl transition-all duration-300 ${holding ? 'scale-125 bg-red-600/40' : 'animate-pulse'}`} />

        {/* Circular SVG Progress Ring */}
        <svg className="w-60 h-60 -rotate-90 pointer-events-none absolute">
          <circle
            cx="120"
            cy="120"
            r="110"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-800"
            fill="transparent"
          />
          {holding && (
            <circle
              cx="120"
              cy="120"
              r="110"
              stroke="currentColor"
              strokeWidth="8"
              className="text-red-500 transition-all duration-75"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 110}
              strokeDashoffset={2 * Math.PI * 110 * (1 - progress / 100)}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Main Press Button */}
        <button
          type="button"
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          onTouchCancel={cancelHold}
          disabled={disabled}
          className={`relative z-10 w-52 h-52 rounded-full flex flex-col items-center justify-center bg-gradient-to-b from-red-500 to-red-700 text-white font-extrabold shadow-2xl transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
            holding ? 'scale-95 from-red-600 to-red-800' : 'hover:from-red-400 hover:to-red-600'
          }`}
          style={{ boxShadow: '0 0 50px rgba(239, 68, 68, 0.4)' }}
        >
          <AlertTriangle className={`w-14 h-14 mb-1 ${holding ? 'animate-bounce' : ''}`} />
          <span className="text-xl tracking-wider uppercase font-black">
            {holding ? 'HOLDING...' : 'EMERGENCY'}
          </span>
          <span className="text-xs text-red-200 mt-1 font-semibold uppercase tracking-wider">
            {holding ? `${progress}%` : 'HOLD 1.2S TO ALERT'}
          </span>
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-6 text-center max-w-xs">
        Press and hold to prevent accidental alerts. All family group devices will alarm immediately.
      </p>
    </div>
  );
};
