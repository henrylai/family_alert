import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { createGroup, joinGroup } from '../services/api.js';
import { saveSession } from '../services/storage.js';

interface GroupOnboardingModalProps {
  onSuccess: (groupId: string, memberId: string, displayName: string) => void;
}

export const GroupOnboardingModal: React.FC<GroupOnboardingModalProps> = ({ onSuccess }) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [groupName, setGroupName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [memberName, setMemberName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !creatorName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await createGroup(groupName, creatorName);
      saveSession(data.group.id, data.member.id, data.member.displayName, data.token);
      onSuccess(data.group.id, data.member.id, data.member.displayName);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !memberName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await joinGroup(inviteCode.trim(), memberName.trim());
      saveSession(data.group.id, data.member.id, data.member.displayName, data.token);
      onSuccess(data.group.id, data.member.id, data.member.displayName);
    } catch (err: any) {
      setError(err.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        {/* App Title Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldAlert className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">Family Alert</h2>
          <p className="text-xs text-slate-400 mt-1">Instant emergency notification for your family</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('create'); setError(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'create' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Family Group
          </button>
          <button
            type="button"
            onClick={() => { setTab('join'); setError(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'join' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Join with Code
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Create Group Form */}
        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Family Group Name
              </label>
              <input
                type="text"
                placeholder="e.g. Lai Family"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Henry"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm rounded-xl shadow-lg transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating...' : 'Create Family Group'}
            </button>
          </form>
        ) : (
          /* Join Group Form */
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Invite Code
              </label>
              <input
                type="text"
                placeholder="e.g. FAM-4912"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white tracking-widest font-mono text-center uppercase focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Mom, Dad, Emma"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm rounded-xl shadow-lg transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Joining...' : 'Join Family Group'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
