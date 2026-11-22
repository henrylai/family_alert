import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { EmergencyIncident, IncidentAcknowledgment } from '../types/index.js';
import { sendEmergencyPushToMembers } from '../services/pushService.js';
import { getSocketServer } from '../socket/index.js';

export async function triggerEmergency(req: Request, res: Response): Promise<void> {
  try {
    const { groupId, senderId, senderName, notes } = req.body;
    if (!groupId || !senderId || !senderName) {
      res.status(400).json({ error: 'Missing required parameters.' });
      return;
    }

    const group = db.getGroupById(groupId);
    if (!group) {
      res.status(404).json({ error: 'Group not found.' });
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
      senderName,
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

    // Trigger Web Push to all members asynchronously
    const members = db.getMembersByGroupId(groupId);
    sendEmergencyPushToMembers(members, incident).catch(err => {
      console.error('[Incident] Push dispatch error:', err);
    });

    res.status(201).json({ incident });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function acknowledgeIncident(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { memberId, memberName, status, message } = req.body;

    const incident = db.getIncidentById(id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found.' });
      return;
    }

    const ack: IncidentAcknowledgment = {
      id: crypto.randomUUID(),
      incidentId: id,
      memberId,
      memberName,
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function resolveIncident(req: Request, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { resolvedBy } = req.body;

    const incident = db.resolveIncident(id, resolvedBy || 'Family Member');
    if (!incident) {
      res.status(404).json({ error: 'Incident not found or already resolved.' });
      return;
    }

    const io = getSocketServer();
    if (io) {
      io.to(`group_${incident.groupId}`).emit('alert_resolved', incident);
    }

    res.status(200).json({ incident });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
