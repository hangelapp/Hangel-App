/**
 * POST /api/bergama/basvuru
 *
 * Bergama girişimi (Sosyal İnovasyon Yerleşkesi + Pergamon İnovasyon Mirası
 * Forumu) başvuru/iletişim formu. Public — auth yok. Başvurular
 * ismailhilmi@hangel.org adresine mail olarak iletilir.
 *
 * Mail yolu: platform Workspace SMTP (mailAccounts/__platform); bağlı değilse
 * varsayılan sağlayıcıya (Resend) düşer. Basit anti-spam: honeypot alanı +
 * alan uzunluk sınırları. Kayıt ayrıca Firestore'a (bergamaBasvurular) yazılır.
 */
import { NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/messaging/providers/email';
import { getEmailProviderForNgo } from '@/lib/messaging/providers/email/ngo-provider';
import { isValidEmail, normalizeEmail } from '@/lib/messaging/email';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const BASVURU_ALICI = 'ismailhilmi@hangel.org';

// Başvurunun geldiği bölüm — mail konusunu netleştirir.
type Kaynak = 'yerleske' | 'forum' | 'genel';
const KAYNAK_ETIKET: Record<Kaynak, string> = {
  yerleske: 'Sosyal İnovasyon Yerleşkesi',
  forum: 'Pergamon İnovasyon Mirası Forumu',
  genel: 'Bergama',
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  // Honeypot: botlar bu gizli alanı doldurur; doluysa sessizce "başarılı" dön.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const ad = typeof body.ad === 'string' ? body.ad.trim().slice(0, 120) : '';
  const email = normalizeEmail(typeof body.email === 'string' ? body.email : null);
  const telefon = typeof body.telefon === 'string' ? body.telefon.trim().slice(0, 40) : '';
  const kurum = typeof body.kurum === 'string' ? body.kurum.trim().slice(0, 160) : '';
  const mesaj = typeof body.mesaj === 'string' ? body.mesaj.trim().slice(0, 3000) : '';
  const ilgi = typeof body.ilgi === 'string' ? body.ilgi.trim().slice(0, 120) : '';
  const kaynak: Kaynak = body.kaynak === 'yerleske' || body.kaynak === 'forum' ? body.kaynak : 'genel';

  if (!ad) return NextResponse.json({ error: 'Ad Soyad gerekli.' }, { status: 400 });
  if (!email || !isValidEmail(email)) return NextResponse.json({ error: 'Geçerli bir e-posta girin.' }, { status: 400 });
  if (!mesaj && !ilgi) return NextResponse.json({ error: 'Lütfen mesaj veya ilgi alanı belirtin.' }, { status: 400 });

  const etiket = KAYNAK_ETIKET[kaynak];
  const subject = `Bergama · ${etiket} başvurusu — ${ad}`;
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1d1d1f">
      <h2 style="color:#f34723;margin:0 0 4px">Yeni Bergama başvurusu</h2>
      <p style="color:#6b7280;margin:0 0 16px;font-size:14px">${esc(etiket)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;width:120px;color:#6b7280">Ad Soyad</td><td style="padding:6px 0"><strong>${esc(ad)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">E-posta</td><td style="padding:6px 0"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
        ${telefon ? `<tr><td style="padding:6px 0;color:#6b7280">Telefon</td><td style="padding:6px 0">${esc(telefon)}</td></tr>` : ''}
        ${kurum ? `<tr><td style="padding:6px 0;color:#6b7280">Kurum</td><td style="padding:6px 0">${esc(kurum)}</td></tr>` : ''}
        ${ilgi ? `<tr><td style="padding:6px 0;color:#6b7280">İlgi alanı</td><td style="padding:6px 0">${esc(ilgi)}</td></tr>` : ''}
      </table>
      ${mesaj ? `<div style="margin-top:16px;padding:14px;background:#f5f5f7;border-radius:12px;white-space:pre-wrap;font-size:14px">${esc(mesaj)}</div>` : ''}
      <p style="margin-top:20px;color:#9ca3af;font-size:12px">Bu başvuru hangel.org/bergama üzerinden gönderildi.</p>
    </div>`;
  const text = `Yeni Bergama başvurusu — ${etiket}\n\nAd Soyad: ${ad}\nE-posta: ${email}\n${telefon ? `Telefon: ${telefon}\n` : ''}${kurum ? `Kurum: ${kurum}\n` : ''}${ilgi ? `İlgi alanı: ${ilgi}\n` : ''}${mesaj ? `\nMesaj:\n${mesaj}\n` : ''}\n— hangel.org/bergama`;

  // Firestore'a kaydet (best-effort; mail asıl kanal).
  try {
    const db = getAdminFirestore();
    await db.collection('bergamaBasvurular').add({
      ad, email, telefon: telefon || null, kurum: kurum || null, ilgi: ilgi || null,
      mesaj: mesaj || null, kaynak, createdAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('[bergama/basvuru] firestore', e);
  }

  // Mail gönder — platform Workspace SMTP, yoksa varsayılan sağlayıcı.
  try {
    const workspace = await getEmailProviderForNgo('__platform').catch(() => null);
    const provider = workspace ? workspace.provider : getEmailProvider();
    const result = await provider.send({
      to: BASVURU_ALICI,
      subject,
      html,
      text,
      fromEmail: workspace ? workspace.fromEmail : 'merhaba@hangel.org',
      fromName: workspace ? workspace.fromName : 'Bergama',
      replyTo: email, // yanıtla → başvurana gitsin
      useCase: 'transactional',
      tags: { kind: 'bergama-basvuru', kaynak },
    });
    if (!result.ok) {
      console.error('[bergama/basvuru] provider', result.errorCode, result.errorMessage);
      return NextResponse.json({ error: 'Başvuru alınamadı, lütfen tekrar deneyin.' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[bergama/basvuru] internal', e);
    return NextResponse.json({ error: 'Beklenmeyen hata.' }, { status: 500 });
  }
}
