import { Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../db/index.js';
import { EmergencyIncident, IncidentAcknowledgment } from '../types/index.js';
import { sendEmergencyPushToGroup } from '../services/pushService.js';
import { getSocketServer } from '../socket/index.js';

const triggerInput = z.object({
  groupId: z.string().min(1).max(64),
  senderId: z.string().min(1).max(64),
  senderName: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(500).optional()
});

const acknowledgeInput = z.object({
  memberId: z.string().min(1).max(64),
  memberName: z.string().trim().min(1).max(60),
  status: z.enum(['safe', 'on_my_way', 'calling_911', 'seen']).optional(),
  message: z.string().trim().max(500).optional()
});

const resolveInput = z.object({
  resolvedBy: z.string().trim().min(1).max(60).optional(),
  memberId: z.string().min(1).max(64)
});

export async function triggerEmergency(req: Request, res: Response): Promise<void> {
  try {
    const parsed = triggerInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required parameters.' });
      return;
    }
    const { groupId, senderId, senderName, notes } = parsed.data;

    const group = db.getGroupById(groupId);
    if (!group) {
      res.status(404).json({ error: 'Group not found.' });
      return;
    }

    // The sender must actually be a member of this group, under the
    // name they claim — a group ID alone is not enough to cry wolf.
    const sender = db.getMemberById(senderId);
    if (!sender || sender.groupId !== groupId) {
      res.status(403).json({ error: 'Sender is not a member of this group.' });
      return;
    }

    // Check if an active incident already exists
    const existing = db.getActiveIncident(groupId);
    if (existing) {
      res.status(200).json({ incident: existing, message: 'Incident already active' });
      return;
    }

    const incident: EmergencyIncident = {
      id: crypto.randomUUID(),
      groupId,
      senderId,
      senderName: sender.displayName,
      status: 'active',
      startedAt: new Date().toISOString(),
      notes: notes || 'Emergency alert triggered'
    };

    db.createIncident(incident);

    // Broadcast via WebSocket
    const io = getSocketServer();
    if (io) {
      io.to(`group_${groupId}`).emit('alert_triggered', incident);
    }

    // Trigger Web Push to all active devices in group asynchronously
    sendEmergencyPushToGroup(groupId, incident).catch(err => {
      console.error('[Incident] Push dispatch error:', err);
    });

    res.status(201).json({ incident });
  } catch {
    res.status(500).json({ error: 'Could not trigger the alert. Try again.' });
  }
}

export async function acknowledgeIncident(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = acknowledgeInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required parameters.' });
      return;
    }
    const { memberId, status, message } = parsed.data;

    const incident = db.getIncidentById(id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found.' });
      return;
    }
    if (incident.status !== 'active') {
      res.status(409).json({ error: 'Incident is no longer active.' });
      return;
    }

    const member = db.getMemberById(memberId);
    if (!member || member.groupId !== incident.groupId) {
      res.status(403).json({ error: 'Member is not part of this incident\'s group.' });
      return;
    }

    const ack: IncidentAcknowledgment = {
      id: crypto.randomUUID(),
      incidentId: id,
      memberId,
      memberName: member.displayName,
      status: status || 'seen',
      timestamp: new Date().toISOString(),
      message
    };

    db.addAcknowledgment(ack);

    const io = getSocketServer();
    if (io) {
      io.to(`group_${incident.groupId}`).emit('member_acknowledged', ack);
    }

    res.status(200).json({ acknowledgment: ack });
  } catch {
    res.status(500).json({ error: 'Could not acknowledge the alert. Try again.' });
  }
}

export async function resolveIncident(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = resolveInput.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'A group member is required to resolve an incident.' });
      return;
    }
    const resolvedByName = parsed.data.resolvedBy;
    const memberId = parsed.data.memberId;

    const existing = db.getIncidentById(id);
    if (!existing) {
      res.status(404).json({ error: 'Incident not found.' });
      return;
    }
    if (existing.status !== 'active') {
      res.status(409).json({ error: 'Incident is already resolved.' });
      return;
    }
    const member = db.getMemberById(memberId);
    if (!member || member.groupId !== existing.groupId) {
      res.status(403).json({ error: 'Member is not part of this incident\'s group.' });
      return;
    }

    const incident = db.resolveIncident(id, member.displayName || resolvedByName || 'Family Member');
    if (!incident) {
      res.status(404).json({ error: 'Incident not found.' });
      return;
    }

    const io = getSocketServer();
    if (io) {
      io.to(`group_${incident.groupId}`).emit('alert_resolved', incident);
    }

    res.status(200).json({ incident });
  } catch {
    res.status(500).json({ error: 'Could not resolve the alert. Try again.' });
  }
}

export async function getActiveIncident(req: Request, res: Response): Promise<void> {
  try {
    const groupId = Array.isArray(req.params.groupId) ? req.params.groupId[0] : req.params.groupId;
    const incident = db.getActiveIncident(groupId);
    if (!incident) {
      res.status(200).json({ active: false });
      return;
    }

    const acknowledgments = db.getAcknowledgmentsByIncidentId(incident.id);
    res.status(200).json({
      active: true,
      incident,
      acknowledgments
    });
  } catch {
    res.status(500).json({ error: 'Could not load the active incident. Try again.' });
  }
}
