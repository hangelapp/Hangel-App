/**
 * CSV parse endpoint — file content gönderilir, columns + sample dönülür.
 * Persist edilmez; UI mapping seçer, sonra /csv/save'e gönderilir.
 */

import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/messaging/server-auth';
import { parseCsv } from '@/lib/messaging/csv';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;

  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  if (!body.content || typeof body.content !== 'string') {
    return NextResponse.json({ error: 'content gerekli' }, { status: 400 });
  }
  if (body.content.length > MAX_SIZE) {
    return NextResponse.json({ error: 'Dosya çok büyük (max 10MB)' }, { status: 413 });
  }

  try {
    const result = parseCsv(body.content);
    return NextResponse.json({
      columns: result.columns,
      rowCount: result.rowCount,
      invalidLines: result.invalidLines,
      sample: result.rows.slice(0, 5),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
