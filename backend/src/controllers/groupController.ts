import { Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db/index.js';
import { FamilyGroup, GroupMember } from '../types/index.js';
import { getSocketServer } from '../socket/index.js';

const createGroupInput = z.object({
  name: z.string().trim().min(1).max(80),
  creatorName: z.string().trim().min(1).max(60)
});

const joinGroupInput = z.object({
  inviteCode: z.string().trim().min(1).max(20),
  displayName: z.string().trim().min(1).max(60)
});

function generateInviteCode(): string {
  // Cryptographically random 6-char alphanumeric uppercase code
  // e.g. "K7PX-492". Uniqueness is checked by the caller.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(4);
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  const digits = 100 + (crypto.randomInt(900));
  return `${code}-${digits}`;
}

function uniqueInviteCode(): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateInviteCode();
    if (!db.getGroupByInviteCode(code)) return code;
  }
  // Vanishingly unlikely; fall back to a longer code rather than ever
  // handing out a code that already belongs to another family.
  return `${generateInviteCode()}-${crypto.randomInt(100)}`;
}

export async function createGroup(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createGroupInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Group name and creator name are required (max 80 / 60 characters).' });
      return;
    }
    const { name, creatorName } = parsed.data;

    const groupId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    const inviteCode = uniqueInviteCode();

    const group: FamilyGroup = {
      id: groupId,
      name,
      inviteCode,
      adminId,
      createdAt: new Date().toISOString()
    };

    const adminMember: GroupMember = {
      id: adminId,
      groupId,
      displayName: creatorName,
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
  } catch {
    res.status(500).json({ error: 'Could not create the group. Try again.' });
  }
}

export async function joinGroup(req: Request, res: Response): Promise<void> {
  try {
    const parsed = joinGroupInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invite code and display name are required (max 60 characters).' });
      return;
    }
    const { inviteCode, displayName } = parsed.data;

    const group = db.getGroupByInviteCode(inviteCode);
    if (!group) {
      res.status(404).json({ error: 'Invalid invite code. Family group not found.' });
      return;
    }

    const memberId = crypto.randomUUID();
    const member: GroupMember = {
      id: memberId,
      groupId: group.id,
      displayName,
      role: 'member',
      joinedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString()
    };

    db.addMember(member);

    const io = getSocketServer();
    if (io) {
      io.to(`group_${group.id}`).emit('member_joined', member);
    }

    res.status(200).json({
      group,
      member,
      token: `${group.id}:${memberId}`
    });
  } catch {
    res.status(500).json({ error: 'Could not join the group. Try again.' });
  }
}

export async function getGroupDetails(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const group = db.getGroupById(id);
    if (!group) {
      res.status(404).json({ error: 'Group not found.' });
      return;
    }

    const members = db.getMembersByGroupId(id);
    const activeIncident = db.getActiveIncident(id);
    const acknowledgments = activeIncident ? db.getAcknowledgmentsByIncidentId(activeIncident.id) : [];

    res.status(200).json({
      group,
      members,
      activeIncident: activeIncident || null,
      acknowledgments
    });
  } catch {
    res.status(500).json({ error: 'Could not load the group. Try again.' });
  }
}
