/**
 * Client-side: super-admin API çağrıları için ID token taşıyan fetch wrapper'ı.
 */

import { getAuth } from 'firebase/auth';

export async function messagingFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Oturum açılmamış');

  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const res = await fetch(path, { ...init, headers });
  const text = await res.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  return payload as T;
}
