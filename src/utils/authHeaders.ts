import { auth } from '../firebase';

export async function authHeaders(extra: Record<string, string> = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  const token = await user.getIdToken();
  return { ...extra, Authorization: `Bearer ${token}` };
}
