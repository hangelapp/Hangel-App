/**
 * Per-STK Workspace SMTP resolver — "STK Workspace Toplu Mail" özelliği.
 *
 * mailWorkspace=true olan kampanyaların job'ları, hangel'in ortak SMTP/Resend
 * sağlayıcısı yerine, STK'nın KENDİ Google Workspace SMTP hesabından gider.
 * Credential mailAccounts/{ngoId} doc'unda tutulur; smtpPasswordEnc AES-256-GCM
 * ile şifrelidir ve yalnız Admin SDK okur (client'a ASLA dönmez).
 *
 * Bağlama akışı (connect/disconnect) ve gate kontrolü bu lane'de DEĞİL — bu
 * resolver yalnız worker dispatch'inde okuma yapar. Doc yoksa null döner ve
 * dispatch job'u provider_4xx ('workspace_not_connected') ile başarısız sayar.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { decryptMailSecret } from '@/lib/mail/credential-crypto';
import type { EmailProvider } from '../../types';
import { SmtpEmailProvider } from './smtp';

interface MailAccountDoc {
  ngoId?: string;
  fromEmail?: string;
  fromName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPasswordEnc?: string;
}

export async function getEmailProviderForNgo(
  ngoId: string
): Promise<{ provider: EmailProvider; fromEmail: string; fromName: string } | null> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.mailAccounts).doc(ngoId).get();
  if (!snap.exists) return null;

  const acc = snap.data() as MailAccountDoc;
  if (!acc.smtpHost || !acc.smtpPort || !acc.smtpUser || !acc.fromEmail || !acc.smtpPasswordEnc) {
    return null;
  }

  const password = decryptMailSecret(acc.smtpPasswordEnc);
  if (!password) return null;

  const provider = new SmtpEmailProvider({
    host: acc.smtpHost,
    port: acc.smtpPort,
    secure: acc.smtpSecure ?? acc.smtpPort === 465,
    user: acc.smtpUser,
    password,
  });

  return {
    provider,
    fromEmail: acc.fromEmail,
    fromName: acc.fromName ?? acc.fromEmail,
  };
}
