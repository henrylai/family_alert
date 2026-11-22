import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { FamilyGroup, GroupMember } from '../types/index.js';

function generateInviteCode(): string {
  // Generate 6-char alphanumeric uppercase code e.g. "FAM-489" or "ALRT-89"
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const digits = Math.floor(100 + Math.random() * 900);
  return `${code}-${digits}`;
}

export async function createGroup(req: Request, res: Response): Promise<void> {
  try {
    const { name, creatorName } = req.body;
    if (!name || !creatorName) {
      res.status(400).json({ error: 'Group name and creator name are required.' });
      return;
    }

    const groupId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    const inviteCode = generateInviteCode();

    const group: FamilyGroup = {
      id: groupId,
      name: name.trim(),
      inviteCode,
      adminId,
      createdAt: new Date().toISOString()
    };

    const adminMember: GroupMember = {
      id: adminId,
      groupId,
      displayName: creatorName.trim(),
      role: 'admin',
      joinedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString()
    };

    db.createGroup(group);
    db.addMember(adminMember);

    res.status(201).json({
      group,
      member: adminMember,
      token: `${groupId}:${adminId}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function joinGroup(req: Request, res: Response): Promise<void> {
  try {
    const { inviteCode, displayName } = req.body;
    if (!inviteCode || !displayName) {
      res.status(400).json({ error: 'Invite code and display name are required.' });
      return;
    }

    const group = db.getGroupByInviteCode(inviteCode);
    if (!group) {
      res.status(404).json({ error: 'Invalid invite code. Family group not found.' });
      return;
    }

    const memberId = crypto.randomUUID();
    const member: GroupMember = {
      id: memberId,
      groupId: group.id,
      displayName: displayName.trim(),
      role: 'member',
      joinedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString()
    };

    db.addMember(member);

    res.status(200).json({
      group,
      member,
      token: `${group.id}:${memberId}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getGroupDetails(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const group = db.getGroupById(id);
    if (!group) {
      res.status(404).json({ error: 'Group not found.' });
      return;
    }

    const members = db.getMembersByGroupId(id);
    const activeIncident = db.getActiveIncident(id);

    res.status(200).json({
      group,
      members,
      activeIncident: activeIncident || null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
