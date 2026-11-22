import React, { useState } from 'react';
import { Users, Copy, Check, ShieldCheck, User } from 'lucide-react';
import { FamilyGroup, GroupMember } from '../types/index.js';

interface MemberRosterProps {
  group: FamilyGroup;
  members: GroupMember[];
  currentMemberId: string;
}

export const MemberRoster: React.FC<MemberRosterProps> = ({ group, members, currentMemberId }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
      {/* Group Header & Invite Code */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-red-500" />
            <span>{group.name}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{members.length} members connected</p>
        </div>

        {/* Invite Code Pill */}
        <button
          type="button"
          onClick={copyCode}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono tracking-wider transition-all"
          title="Click to copy invite code"
        >
          <span className="font-bold text-red-400">{group.inviteCode}</span>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
        </button>
      </div>

      {/* Members List */}
      <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
        {members.map((member) => {
          const isMe = member.id === currentMemberId;
          const isAdmin = member.role === 'admin';

          return (
            <div
              key={member.id}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                isMe ? 'bg-slate-800/80 border border-slate-700' : 'bg-slate-950/40'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                  {isAdmin ? <ShieldCheck className="w-4 h-4 text-amber-400" /> : <User className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <span className="font-medium text-slate-200">
                    {member.displayName} {isMe && <span className="text-xs text-slate-400">(You)</span>}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-2xs text-slate-400 font-mono">Active</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
