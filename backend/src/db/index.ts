import fs from 'fs';
import path from 'path';
import { FamilyGroup, GroupMember, EmergencyIncident, IncidentAcknowledgment } from '../types/index.js';

interface DatabaseSchema {
  groups: FamilyGroup[];
  members: GroupMember[];
  incidents: EmergencyIncident[];
  acknowledgments: IncidentAcknowledgment[];
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'family_alert_store.json');

class DatabaseService {
  private data: DatabaseSchema = {
    groups: [],
    members: [],
    incidents: [],
    acknowledgments: []
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
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.persist();
      }
    } catch (err) {
      console.error('[DB] Failed to load data, starting with fresh in-memory store:', err);
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to persist data:', err);
    }
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

  public updateMemberPushSubscription(memberId: string, subscription: any): boolean {
    const member = this.getMemberById(memberId);
    if (member) {
      member.pushSubscription = subscription;
      this.persist();
      return true;
    }
    return false;
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
    if (incident) {
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
    // Upsert acknowledgment by member
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
