import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Bell, BellRing, LogOut, ShieldAlert } from 'lucide-react';
import { getSession, clearSession } from './services/storage.js';
import { getGroupDetails, triggerAlert, acknowledgeAlert, resolveAlert, registerPushSubscription } from './services/api.js';
import { audioAlarm } from './services/audioAlarm.js';
import {
  requestScreenWakeLock,
  releaseScreenWakeLock,
  startUrgentVibration,
  stopUrgentVibration
} from './services/deviceControls.js';
import { FamilyGroup, GroupMember, EmergencyIncident, IncidentAcknowledgment } from './types/index.js';
import { EmergencyButton } from './components/EmergencyButton.js';
import { AlarmOverlay } from './components/AlarmOverlay.js';
import { GroupOnboardingModal } from './components/GroupOnboardingModal.js';
import { MemberRoster } from './components/MemberRoster.js';
import { ActiveIncidentBanner } from './components/ActiveIncidentBanner.js';
import { DNDSetupGuideModal } from './components/DNDSetupGuideModal.js';
import { SirenTestCard } from './components/SirenTestCard.js';

export const App: React.FC = () => {
  const [session, setSession] = useState(getSession());
  const [group, setGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activeIncident, setActiveIncident] = useState<EmergencyIncident | null>(null);
  const [acknowledgments, setAcknowledgments] = useState<IncidentAcknowledgment[]>([]);
  const [showAlarmOverlay, setShowAlarmOverlay] = useState(false);
  const [isSirenMuted, setIsSirenMuted] = useState(false);
  const [showDNDGuide, setShowDNDGuide] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!session.groupId || !session.memberId) return;

    // Fetch initial group state
    getGroupDetails(session.groupId)
      .then((data) => {
        setGroup(data.group);
        setMembers(data.members);
        if (data.activeIncident) {
          setActiveIncident(data.activeIncident);
          setShowAlarmOverlay(true);
          handleIncomingAlarm(data.activeIncident);
        }
      })
      .catch((err) => console.error('[App] Failed to load group:', err));

    const socketUrl = window.location.origin;
    const socket: Socket = io(socketUrl);

    socket.emit('join_group', {
      groupId: session.groupId,
      memberId: session.memberId
    });

    socket.on('alert_triggered', (incident: EmergencyIncident) => {
      setActiveIncident(incident);
      setShowAlarmOverlay(true);
      handleIncomingAlarm(incident);
    });

    socket.on('member_acknowledged', (ack: IncidentAcknowledgment) => {
      setAcknowledgments((prev) => {
        const idx = prev.findIndex((a) => a.memberId === ack.memberId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = ack;
          return updated;
        }
        return [...prev, ack];
      });
    });

    socket.on('alert_resolved', () => {
      setActiveIncident(null);
      setShowAlarmOverlay(false);
      stopAlarmAudio();
    });

    // Unlock Web Audio on any touch/click event on document
    const unlockListener = () => {
      audioAlarm.unlockAudio();
    };
    window.addEventListener('touchstart', unlockListener, { once: true });
    window.addEventListener('click', unlockListener, { once: true });

    return () => {
      socket.disconnect();
      window.removeEventListener('touchstart', unlockListener);
      window.removeEventListener('click', unlockListener);
    };
  }, [session.groupId, session.memberId]);

  const handleIncomingAlarm = (_incident?: EmergencyIncident) => {
    audioAlarm.unlockAudio();
    audioAlarm.startSiren();
    setIsSirenMuted(false);
    startUrgentVibration();
    requestScreenWakeLock();
  };

  const stopAlarmAudio = () => {
    audioAlarm.stopSiren();
    stopUrgentVibration();
    releaseScreenWakeLock();
    setIsSirenMuted(true);
  };

  const handleTriggerEmergency = async () => {
    if (!session.groupId || !session.memberId || !session.displayName) return;

    try {
      const data = await triggerAlert(
        session.groupId,
        session.memberId,
        session.displayName
      );
      setActiveIncident(data.incident);
      setShowAlarmOverlay(true);
      handleIncomingAlarm(data.incident);
    } catch (err) {
      console.error('[App] Error triggering alert:', err);
    }
  };

  const handleAcknowledge = async (status: 'safe' | 'on_my_way' | 'calling_911' | 'seen') => {
    if (!activeIncident || !session.memberId || !session.displayName) return;
    try {
      await acknowledgeAlert(activeIncident.id, session.memberId, session.displayName, status);
      stopAlarmAudio();
    } catch (err) {
      console.error('[App] Error acknowledging:', err);
    }
  };

  const handleResolve = async () => {
    if (!activeIncident || !session.displayName) return;
    try {
      await resolveAlert(activeIncident.id, session.displayName);
      setActiveIncident(null);
      setShowAlarmOverlay(false);
      stopAlarmAudio();
    } catch (err) {
      console.error('[App] Error resolving alert:', err);
    }
  };

  const handleEnablePush = async () => {
    if (!session.memberId) return;
    const ok = await registerPushSubscription(session.memberId);
    setPushEnabled(ok);
    if (ok) {
      alert('High-priority emergency push notifications enabled!');
    } else {
      setShowDNDGuide(true);
    }
  };

  const handleLogout = () => {
    clearSession();
    setSession({ groupId: null, memberId: null, displayName: null, token: null });
    setGroup(null);
    setMembers([]);
    setActiveIncident(null);
    stopAlarmAudio();
  };

  // If no group is set up, render the Onboarding Modal
  if (!session.groupId || !session.memberId) {
    return (
      <GroupOnboardingModal
        onSuccess={(groupId, memberId, displayName) => {
          setSession({ groupId, memberId, displayName, token: null });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-4 max-w-md mx-auto w-full">
      {/* Top Navigation Bar */}
      <header className="w-full flex items-center justify-between py-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shadow-md">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">
              {group?.name || 'Family Alert'}
            </h1>
            <p className="text-2xs text-slate-400">
              User: <span className="text-slate-200 font-semibold">{session.displayName}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleEnablePush}
            className={`p-2 rounded-xl text-xs transition-colors ${
              pushEnabled ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title="Enable Emergency Push Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowDNDGuide(true)}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-amber-400 border border-slate-800 text-xs"
            title="DND & Emergency Bypass Setup"
          >
            <BellRing className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-red-400 border border-slate-800 text-xs"
            title="Leave / Switch Group"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="w-full flex-1 flex flex-col items-center justify-center py-4">
        {/* Active Incident Warning Bar */}
        {activeIncident && (
          <ActiveIncidentBanner
            incident={activeIncident}
            onOpenAlarm={() => setShowAlarmOverlay(true)}
            onResolve={handleResolve}
          />
        )}

        {/* Big 1-Touch Emergency Button */}
        <EmergencyButton
          onTrigger={handleTriggerEmergency}
          disabled={activeIncident?.status === 'active'}
        />

        {/* Siren Sound Test Card */}
        <div className="w-full mt-2 mb-4">
          <SirenTestCard />
        </div>

        {/* Member Roster & Invite Code */}
        {group && (
          <MemberRoster
            group={group}
            members={members}
            currentMemberId={session.memberId}
          />
        )}
      </main>

      {/* Full-Screen Alarm Overlay during Active Incident */}
      {showAlarmOverlay && activeIncident && (
        <AlarmOverlay
          incident={activeIncident}
          acknowledgments={acknowledgments}
          isSender={activeIncident.senderId === session.memberId}
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
          onMuteSiren={stopAlarmAudio}
          isMuted={isSirenMuted}
        />
      )}

      {/* DND and Emergency Bypass Setup Modal */}
      {showDNDGuide && (
        <DNDSetupGuideModal onClose={() => setShowDNDGuide(false)} />
      )}
    </div>
  );
};
