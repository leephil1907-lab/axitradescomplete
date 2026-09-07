import { auth } from '../firebase';

const ADMIN_KEY = 'axi_admin_token';

function readAdminToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ADMIN_KEY) || window.sessionStorage.getItem(ADMIN_KEY);
}

export async function authHeaders(extra: Record<string,string> = {}) {
  const adminToken = readAdminToken();
  if (adminToken) return { ...extra, Authorization: `Bearer ${adminToken}` };
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  const token = await user.getIdToken();
  return { ...extra, Authorization: `Bearer ${token}` };
}

export function adminAuthHeaders(extra: Record<string,string> = {}) {
  const token = readAdminToken();
  if (!token) return { ...extra };
  return { ...extra, Authorization: `Bearer ${token}` };
}
