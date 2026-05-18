import { NextResponse } from 'next/server';
import { render, extractVariables } from '@/lib/messaging/template';
import { segmentInfo } from '@/lib/messaging/sms-segments';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: { subject?: string; body?: string; vars?: Record<string, string>; channel?: 'sms' | 'email' };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const rawBody = body.body ?? '';
  const subject = body.subject ?? '';
  const vars = body.vars ?? {};
  const channel = body.channel ?? 'sms';

  const variables = [...new Set([...extractVariables(rawBody), ...extractVariables(subject)])];
  const rendered = {
    subject: render(subject, vars),
    body: render(rawBody, vars),
  };

  return NextResponse.json({
    rendered,
    variables,
    sms: channel === 'sms' ? segmentInfo(rendered.body) : null,
  });
}
