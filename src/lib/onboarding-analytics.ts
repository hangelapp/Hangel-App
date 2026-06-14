/**
 * Onboarding funnel analytics — kayıt sonrası kullanıcının onboarding
 * adımlarında nerede terk ettiğini ölçmek için fire-and-forget event toplayıcı.
 *
 * Her çağrı `onboardingEvents` koleksiyonuna tek bir doc yazar:
 *   { step, action, uid (varsa, yoksa null), ts: serverTimestamp(), ...meta }
 *
 * Tasarım notları:
 * - ASLA throw etmez ve await gerektirmez (UI akışını kırmamalı). addDoc'un
 *   döndürdüğü promise await edilmez; reject olursa .catch ile sessizce yutulur.
 * - Pre-register adımlar (register / verify_sent / intent) anonim olabilir;
 *   bu yüzden auth zorunlu değildir. uid sırasıyla şu kaynaklardan alınır:
 *     1) meta.uid (çağıran açıkça verirse — string ise)
 *     2) auth.currentUser?.uid (oturum açıksa)
 *     3) null (anonim)
 * - db null/undefined ise sessizce no-op (henüz init olmamış SSR/erken render).
 *
 * Süper-admin görüntüleme: /super-admin/onboarding-funnel.
 */
import { addDoc, collection, serverTimestamp, type Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { COLLECTIONS } from '@/firebase/collections';

export type OnboardingStep =
  | 'register'
  | 'verify_sent'
  | 'intent'
  | 'ngo_selection'
  | 'profile'
  | 'volunteer_prefs'
  | 'completed';

export type OnboardingAction = 'view' | 'complete' | 'skip';

/**
 * Onboarding adımı olayını kaydeder. Fire-and-forget: çağıran await ETMEZ ve
 * bu fonksiyon hiçbir koşulda throw etmez.
 *
 * @param db        Firestore örneği (useFirestore() / initializeFirebase().firestore). null ise no-op.
 * @param step      Hangi onboarding adımı.
 * @param action    'view' (adım görüntülendi) | 'complete' (tamamlandı) | 'skip' (atlandı).
 * @param meta      Opsiyonel ek alanlar; `meta.uid` verilirse uid olarak kullanılır.
 */
export function trackOnboardingStep(
  db: Firestore | null | undefined,
  step: OnboardingStep,
  action: OnboardingAction,
  meta?: Record<string, unknown>,
): void {
  // db yoksa sessizce çık — erken render / SSR.
  if (!db) return;

  try {
    // uid çözümü: meta.uid > auth.currentUser > null.
    let uid: string | null = null;
    if (meta && typeof meta.uid === 'string' && meta.uid) {
      uid = meta.uid;
    } else {
      try {
        uid = getAuth().currentUser?.uid ?? null;
      } catch {
        uid = null;
      }
    }

    // meta.uid'i payload'a iki kez yazmamak için ayır.
    const rest: Record<string, unknown> = { ...(meta ?? {}) };
    delete rest.uid;

    // addDoc'u AWAIT ETME — void promise, reject'i yut.
    void addDoc(collection(db, COLLECTIONS.onboardingEvents), {
      step,
      action,
      uid,
      ts: serverTimestamp(),
      ...rest,
    }).catch(() => {
      /* analytics best-effort — sessizce yut, UI akışını kırma */
    });
  } catch {
    /* hiçbir koşulda throw etme */
  }
}
