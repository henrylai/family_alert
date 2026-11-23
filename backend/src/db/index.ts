import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import webpush from 'web-push';
import {
  FamilyGroup,
  GroupMember,
  EmergencyIncident,
  IncidentAcknowledgment,
  DeviceSubscription
} from '../types/index.js';

interface DatabaseSchema {
  groups: FamilyGroup[];
  members: GroupMember[];
  incidents: EmergencyIncident[];
  acknowledgments: IncidentAcknowledgment[];
  devices: DeviceSubscription[];
  vapidKeys?: {
    publicKey: string;
    privateKey: string;
  };
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'family_alert_store.json');

class DatabaseService {
  private data: DatabaseSchema = {
    groups: [],
    members: [],
    incidents: [],
    acknowledgments: [],
    devices: []
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_PATH)) {
        try {
          const raw = fs.readFileSync(DB_PATH, 'utf-8');
          this.data = JSON.parse(raw);
        } catch (parseErr) {
          // Main store is unreadable; fall back to the last good backup
          // written by persist() rather than starting empty.
          const bakPath = `${DB_PATH}.bak`;
          if (!fs.existsSync(bakPath)) throw parseErr;
          console.error('[DB] Main store corrupt, recovering from backup:', parseErr);
          this.data = JSON.parse(fs.readFileSync(bakPath, 'utf-8'));
          this.persist();
        }
        if (!this.data.devices) this.data.devices = [];
      } else {
        this.persist();
      }
    } catch (err) {
      console.error('[DB] Failed to load data, starting with fresh store:', err);
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      // Atomic write: write to a temp file in the same directory, keep
      // the previous good file as .bak, then rename over the live file.
      // A crash mid-write can no longer corrupt the only copy of every
      // group, device subscription, and the VAPID keys.
      const tmpPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      if (fs.existsSync(DB_PATH)) {
        fs.copyFileSync(DB_PATH, `${DB_PATH}.bak`);
      }
      fs.renameSync(tmpPath, DB_PATH);
    } catch (err) {
      console.error('[DB] Failed to persist data:', err);
    }
  }

  // Persistent VAPID Key Management
  public getOrCreateVapidKeys(): { publicKey: string; privateKey: string } {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      return {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY
      };
    }

    if (this.data.vapidKeys?.publicKey && this.data.vapidKeys?.privateKey) {
      return this.data.vapidKeys;
    }

    // Generate once and store permanently in database
    const generated = webpush.generateVAPIDKeys();
    this.data.vapidKeys = {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey
    };
    this.persist();
    console.log('[DB] Generated and saved permanent VAPID keys into database.');
    return this.data.vapidKeys;
  }

  // Group Operations
  public createGroup(group: FamilyGroup): FamilyGroup {
    this.data.groups.push(group);
    this.persist();
    return group;
  }

  public getGroupById(id: string): FamilyGroup | undefined {
    return this.data.groups.find(g => g.id === id);
  }

  public getGroupByInviteCode(code: string): FamilyGroup | undefined {
    const normalized = code.trim().toUpperCase();
    return this.data.groups.find(g => g.inviteCode.toUpperCase() === normalized);
  }

  // Member Operations
  public addMember(member: GroupMember): GroupMember {
    this.data.members.push(member);
    this.persist();
    return member;
  }

  public getMemberById(id: string): GroupMember | undefined {
    return this.data.members.find(m => m.id === id);
  }

  public getMembersByGroupId(groupId: string): GroupMember[] {
    return this.data.members.filter(m => m.groupId === groupId);
  }

  // Device Push Subscription Operations (matching self_push_notifications pattern)
  public registerDevice(params: {
    memberId: string;
    groupId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
  }): DeviceSubscription {
    const existingIndex = this.data.devices.findIndex(d => d.endpoint === params.endpoint);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      this.data.devices[existingIndex] = {
        ...this.data.devices[existingIndex],
        memberId: params.memberId,
        groupId: params.groupId,
        p256dh: params.p256dh,
        auth: params.auth,
        userAgent: params.userAgent || this.data.devices[existingIndex].userAgent,
        isActive: true,
        updatedAt: now
      };
      this.persist();
      return this.data.devices[existingIndex];
    }

    const device: DeviceSubscription = {
      id: crypto.randomUUID(),
      memberId: params.memberId,
      groupId: params.groupId,
      endpoint: params.endpoint,
      p256dh: params.p256dh,
      auth: params.auth,
      userAgent: params.userAgent,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    this.data.devices.push(device);
    this.persist();
    return device;
  }

  public unregisterDevice(endpoint: string): boolean {
    const device = this.data.devices.find(d => d.endpoint === endpoint);
    if (device) {
      device.isActive = false;
      device.updatedAt = new Date().toISOString();
      this.persist();
      return true;
    }
    return false;
  }

  public getActiveDevicesByGroupId(groupId: string): DeviceSubscription[] {
    return this.data.devices.filter(d => d.groupId === groupId && d.isActive);
  }

  public deactivateDevice(endpoint: string): void {
    const device = this.data.devices.find(d => d.endpoint === endpoint);
    if (device) {
      device.isActive = false;
      this.persist();
    }
  }

  // Incident Operations
  public createIncident(incident: EmergencyIncident): EmergencyIncident {
    this.data.incidents.push(incident);
    this.persist();
    return incident;
  }

  public getActiveIncident(groupId: string): EmergencyIncident | undefined {
    return this.data.incidents.find(i => i.groupId === groupId && i.status === 'active');
  }

  public getIncidentById(id: string): EmergencyIncident | undefined {
    return this.data.incidents.find(i => i.id === id);
  }

  public resolveIncident(id: string, resolvedBy: string): EmergencyIncident | undefined {
    const incident = this.getIncidentById(id);
    if (incident && incident.status === 'active') {
      incident.status = 'resolved';
      incident.resolvedAt = new Date().toISOString();
      incident.resolvedBy = resolvedBy;
      this.persist();
      return incident;
    }
    return undefined;
  }

  // Acknowledgment Operations
  public addAcknowledgment(ack: IncidentAcknowledgment): IncidentAcknowledgment {
    const existingIndex = this.data.acknowledgments.findIndex(
      a => a.incidentId === ack.incidentId && a.memberId === ack.memberId
    );
    if (existingIndex >= 0) {
      this.data.acknowledgments[existingIndex] = ack;
    } else {
      this.data.acknowledgments.push(ack);
    }
    this.persist();
    return ack;
  }

  public getAcknowledgmentsByIncidentId(incidentId: string): IncidentAcknowledgment[] {
    return this.data.acknowledgments.filter(a => a.incidentId === incidentId);
  }
}

export const db = new DatabaseService();
