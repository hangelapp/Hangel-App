/**
 * POST /api/super-admin/messaging/test-email
 *
 * Kolay Mail sihirbazının "kendine test gönder" butonu. Kampanya/kuyruk
 * oluşturmadan, e-posta sağlayıcısıyla TEK adrese anında gerçek mail yollar.
 * {ad} gibi değişkenler örnek değerlerle doldurulur, konuya [TEST] eklenir.
 *
 * Auth: super-admin (Bearer ID token).
 * Body: { to: string, subject: string, body: string, fromEmail?, fromName? }
 * Yanıt: { ok: true, driver } | { errorCode, message }
 */
import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/messaging/server-auth';
import { getEmailProvider } from '@/lib/messaging/providers/email';
import { getEmailProviderForNgo } from '@/lib/messaging/providers/email/ngo-provider';
import { render } from '@/lib/messaging/template';
import { normalizeEmail, isValidEmail } from '@/lib/messaging/email';
import { htmlToPlainText } from '@/lib/messaging/html-to-text';

export const runtime = 'nodejs';

// Önizleme/test için örnek kişiselleştirme değerleri (resolver'daki user vars ile aynı adlar).
const SAMPLE_VARS: Record<string, string> = {
  ad: 'Ayşe',
  tam_ad: 'Ayşe Yılmaz',
  kullanici: 'ayse',
  sehir: 'İstanbul',
  ilce: 'Kadıköy',
  meslek: 'Öğretmen',
};

export async function POST(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;

  let body: { to?: unknown; subject?: unknown; body?: unknown; fromEmail?: unknown; fromName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 });
  }

  const to = normalizeEmail(typeof body.to === 'string' ? body.to : null);
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const html = typeof body.body === 'string' ? body.body : '';
  const fromEmail = typeof body.fromEmail === 'string' && body.fromEmail.trim() ? body.fromEmail.trim() : 'merhaba@hangel.org';
  const fromName = typeof body.fromName === 'string' && body.fromName.trim() ? body.fromName.trim() : 'hangel';

  if (!to || !isValidEmail(to)) {
    return NextResponse.json({ errorCode: 'INVALID_TO', message: 'Geçerli bir e-posta adresi girin.' }, { status: 400 });
  }
  if (!subject) {
    return NextResponse.json({ errorCode: 'MISSING_SUBJECT', message: 'Konu boş olamaz.' }, { status: 400 });
  }
  if (!html.trim()) {
    return NextResponse.json({ errorCode: 'MISSING_BODY', message: 'Mesaj gövdesi boş olamaz.' }, { status: 400 });
  }

  try {
    // Test maili gerçek gönderimle AYNI yoldan gitmeli (deliverability eşleşsin):
    // önce platform Workspace SMTP (mailAccounts/__platform), bağlı değilse Resend'e düş.
    const renderedHtml = render(html, SAMPLE_VARS);
    const text = htmlToPlainText(renderedHtml);
    const workspace = await getEmailProviderForNgo('__platform').catch(() => null);
    const provider = workspace ? workspace.provider : getEmailProvider();
    const result = await provider.send({
      to,
      subject: `[TEST] ${render(subject, SAMPLE_VARS)}`,
      html: renderedHtml,
      text,
      // Workspace bağlıysa gönderen adres o hesaptan zorlanır; değilse wizard değeri.
      fromEmail: workspace ? workspace.fromEmail : fromEmail,
      fromName: workspace ? workspace.fromName : fromName,
      useCase: 'transactional', // test maili işlemseldir; unsubscribe footer eklenmez
      tags: { kind: 'wizard-test' },
    });
    if (!result.ok) {
      console.error('[test-email] provider error', result.errorCode, result.errorMessage);
      return NextResponse.json(
        { errorCode: 'PROVIDER_ERROR', message: 'Test maili gönderilemedi. Sağlayıcı ayarlarını kontrol edin.' },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, driver: provider.driver });
  } catch (e) {
    console.error('[test-email] internal error', e);
    return NextResponse.json({ errorCode: 'INTERNAL', message: 'Beklenmeyen hata.' }, { status: 500 });
  }
}
