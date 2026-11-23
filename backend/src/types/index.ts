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
  pushSubscription?: PushSubscriptionJSON | null;
  joinedAt: string;
  lastSeenAt: string;
}

export interface DeviceSubscription {
  id: string;
  memberId: string;
  groupId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
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
