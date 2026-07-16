import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/messaging/server-auth';
import { resolveRecipients } from '@/lib/messaging/resolver';
import type { RecipientSourceSpec } from '@/lib/messaging/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;

  let body: RecipientSourceSpec;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  if (!body.channel || !body.useCase) {
    return NextResponse.json({ error: 'channel ve useCase gerekli' }, { status: 400 });
  }

  // ?list=1 → gidecek alıcıların TAM listesini (slim projeksiyon) döndür.
  // Super-admin gönderim öncesi "kimlere gidiyor" görüp tek tek çıkarabilsin diye.
  // PII yüzeyini daraltmak için yalnız ad/e-posta/STK adı/şehir döner; büyük
  // listelerde (>2000) yalnız ilk 2000 satır (maliyet + payload sınırı).
  const wantsList = new URL(req.url).searchParams.get('list') === '1';

  try {
    const result = await resolveRecipients(body);
    if (wantsList) {
      const LIST_CAP = 2000;
      const rows = result.recipients.slice(0, LIST_CAP).map((r) => ({
        userId: r.userId,
        email: r.channelAddress,
        name: r.vars?.tam_ad || r.vars?.ad || '',
        ngo: r.vars?.stk_adi || '',
        city: r.vars?.sehir || r.vars?.stk_sehir || '',
      }));
      return NextResponse.json({
        summary: result.summary,
        recipients: rows,
        truncated: result.recipients.length > LIST_CAP,
        total: result.recipients.length,
      });
    }
    // Tam recipients listesi büyük olabilir — UI'ya sadece summary + sample dön
    return NextResponse.json({
      summary: result.summary,
      sample: result.sample,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/messaging/resolve-recipients]', message);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', error: 'Internal server error' }, { status: 500 });
  }
}
