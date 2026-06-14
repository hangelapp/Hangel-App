/**
 * org-lifecycle-client — kurumsal yaşam döngüsü bildirimini tetikleyen
 * istemci yardımcı. /api/org/lifecycle'a fire-and-forget POST atar; UX'i
 * bloklamaz ve hata fırlatmaz (bildirim/SMS best-effort).
 */

export type OrgLifecycleKind = 'ngo_registration' | 'event' | 'volunteer';
export type OrgLifecycleStage = 'received' | 'approved';

export async function fireOrgLifecycle(
  idToken: string | null | undefined,
  payload: { kind: OrgLifecycleKind; stage: OrgLifecycleStage; refId: string },
): Promise<void> {
  if (!idToken || !payload.refId) return;
  try {
    await fetch('/api/org/lifecycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(payload),
    });
  } catch {
    /* best-effort — yaşam döngüsü bildirimi başarısız olsa da ana akış sürer */
  }
}
