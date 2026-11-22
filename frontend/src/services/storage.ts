// Local storage persistence for family session

const STORAGE_KEYS = {
  GROUP_ID: 'fa_group_id',
  MEMBER_ID: 'fa_member_id',
  DISPLAY_NAME: 'fa_display_name',
  TOKEN: 'fa_token'
};

export function saveSession(groupId: string, memberId: string, displayName: string, token: string) {
  localStorage.setItem(STORAGE_KEYS.GROUP_ID, groupId);
  localStorage.setItem(STORAGE_KEYS.MEMBER_ID, memberId);
  localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, displayName);
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

export function getSession(): { groupId: string | null; memberId: string | null; displayName: string | null; token: string | null } {
  return {
    groupId: localStorage.getItem(STORAGE_KEYS.GROUP_ID),
    memberId: localStorage.getItem(STORAGE_KEYS.MEMBER_ID),
    displayName: localStorage.getItem(STORAGE_KEYS.DISPLAY_NAME),
    token: localStorage.getItem(STORAGE_KEYS.TOKEN)
  };
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.GROUP_ID);
  localStorage.removeItem(STORAGE_KEYS.MEMBER_ID);
  localStorage.removeItem(STORAGE_KEYS.DISPLAY_NAME);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
}
