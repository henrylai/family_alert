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

export async function resolveAlert(incidentId: string, resolvedBy: string) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolvedBy })
  });
  if (!res.ok) throw new Error('Failed to resolve alert');
  return res.json();
}

export async function registerPushSubscription(memberId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const keyRes = await fetch(`${API_BASE}/push/public-key`);
    const { publicKey } = await keyRes.json();
    if (!publicKey) return false;

    // Convert base64 public key to Uint8Array
    const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
    const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: outputArray
    });

    await fetch(`${API_BASE}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, subscription })
    });

    return true;
  } catch (err) {
    console.warn('[Push] Push registration notice:', err);
    return false;
  }
}
