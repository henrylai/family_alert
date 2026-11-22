export interface FamilyGroup {
  id: string;
  name: string;
  inviteCode: string;
  adminId: string;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  displayName: string;
  role: 'admin' | 'member';
  joinedAt: string;
  lastSeenAt: string;
}

export interface EmergencyIncident {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  status: 'active' | 'resolved' | 'cancelled';
  startedAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  notes?: string;
}

export interface IncidentAcknowledgment {
  id: string;
  incidentId: string;
  memberId: string;
  memberName: string;
  status: 'safe' | 'on_my_way' | 'calling_911' | 'seen';
  timestamp: string;
  message?: string;
}
