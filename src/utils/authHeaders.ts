import { auth } from '../firebase';

/**
 * Returns the correct bearer token for the current API context.
 * Standalone admin sessions must use the server-issued admin session token;
 * customer routes continue to use the Firebase ID token.
 */
export async function authHeaders(extra: Record<string, string> = {}) {
  if (typeof window !== 'undefined') {
    const adminToken = window.sessionStorage.getItem('axi_admin_token');
    if (adminToken) return { ...extra, Authorization: `Bearer ${adminToken}` };
  }

  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  const token = await user.getIdToken();
  return { ...extra, Authorization: `Bearer ${token}` };
}

/** Admin-only helper: never falls back to Firebase customer auth. */
export function adminAuthHeaders(extra: Record<string, string> = {}) {
  if (typeof window === 'undefined') throw new Error('Admin authentication unavailable');
  const token = window.sessionStorage.getItem('axi_admin_token');
  if (!token) throw new Error('Admin authentication required');
  return { ...extra, Authorization: `Bearer ${token}` };
}
