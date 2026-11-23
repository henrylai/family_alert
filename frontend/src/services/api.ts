const API_BASE = '/api';

export async function createGroup(name: string, creatorName: string) {
  const res = await fetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, creatorName })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create group');
  }
  return res.json();
}

export async function joinGroup(inviteCode: string, displayName: string) {
  const res = await fetch(`${API_BASE}/groups/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode, displayName })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to join group');
  }
  return res.json();
}

export async function getGroupDetails(groupId: string) {
  const res = await fetch(`${API_BASE}/groups/${groupId}`);
  if (!res.ok) throw new Error('Failed to fetch group details');
  return res.json();
}

export async function triggerAlert(groupId: string, senderId: string, senderName: string, notes?: string) {
  const res = await fetch(`${API_BASE}/incidents/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupId, senderId, senderName, notes })
  });
  if (!res.ok) throw new Error('Failed to trigger emergency alert');
  return res.json();
}

export async function acknowledgeAlert(incidentId: string, memberId: string, memberName: string, status: string) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId, memberName, status })
  });
  if (!res.ok) throw new Error('Failed to acknowledge alert');
  return res.json();
}

export async function resolveAlert(incidentId: string, resolvedBy: string, memberId?: string) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolvedBy, memberId })
  });
  if (!res.ok) throw new Error('Failed to resolve alert');
  return res.json();
}

export async function getActiveIncident(groupId: string) {
  const res = await fetch(`${API_BASE}/incidents/active/${groupId}`);
  if (!res.ok) throw new Error('Failed to fetch active incident');
  return res.json();
}

