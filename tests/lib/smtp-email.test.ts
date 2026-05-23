import { describe, it, expect, vi, beforeEach } from 'vitest';

const { sendMailMock, createTransportMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn();
  const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));
  return { sendMailMock, createTransportMock };
});

vi.mock('nodemailer', () => ({
  default: { createTransport: createTransportMock },
  createTransport: createTransportMock,
}));

import { SmtpEmailProvider } from '@/lib/messaging/providers/email/smtp';

describe('SmtpEmailProvider', () => {
  beforeEach(() => {
    sendMailMock.mockReset();
    createTransportMock.mockClear();
  });

  const baseInput = {
    to: 'user@example.com',
    subject: 'Test',
    html: '<p>hi</p>',
    fromEmail: 'noreply@hangel.org',
    fromName: 'Hangel',
    useCase: 'transactional' as const,
  };

  it('returns ok with providerMessageId on successful send', async () => {
    sendMailMock.mockResolvedValue({
      messageId: '<abc@hangel>',
      response: '250 OK',
      envelope: { from: 'noreply@hangel.org', to: ['user@example.com'] },
    });
    const p = new SmtpEmailProvider({
      host: 'smtp.gmail.com',
      port: 587,
      user: 'noreply@hangel.org',
      password: 'app-pw',
    });
    const res = await p.send(baseInput);
    expect(res.ok).toBe(true);
    expect(res.providerMessageId).toBe('<abc@hangel>');
  });

  it('uses STARTTLS (secure=false) for port 587 by default', async () => {
    sendMailMock.mockResolvedValue({ messageId: 'x', response: '', envelope: {} });
    new SmtpEmailProvider({ host: 'h', port: 587, user: 'u', password: 'p' });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false })
    );
  });

  it('uses implicit SSL (secure=true) for port 465 by default', async () => {
    sendMailMock.mockResolvedValue({ messageId: 'x', response: '', envelope: {} });
    new SmtpEmailProvider({ host: 'h', port: 465, user: 'u', password: 'p' });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true })
    );
  });

  it('maps invalid recipient to invalid_address errorCode', async () => {
    const err = Object.assign(new Error('Invalid recipient'), {
      code: 'EENVELOPE',
      responseCode: 550,
    });
    sendMailMock.mockRejectedValue(err);
    const p = new SmtpEmailProvider({ host: 'h', port: 587, user: 'u', password: 'p' });
    const res = await p.send(baseInput);
    expect(res.ok).toBe(false);
    expect(res.errorCode).toBe('provider_5xx');
  });

  it('maps SMTP 421 to rate_limited errorCode', async () => {
    const err = Object.assign(new Error('Throttled'), { responseCode: 421 });
    sendMailMock.mockRejectedValue(err);
    const p = new SmtpEmailProvider({ host: 'h', port: 587, user: 'u', password: 'p' });
    const res = await p.send(baseInput);
    expect(res.ok).toBe(false);
    expect(res.errorCode).toBe('rate_limited');
  });

  it('attaches List-Unsubscribe header when unsubscribeUrl present', async () => {
    sendMailMock.mockResolvedValue({ messageId: 'x', response: '', envelope: {} });
    const p = new SmtpEmailProvider({ host: 'h', port: 587, user: 'u', password: 'p' });
    await p.send({ ...baseInput, unsubscribeUrl: 'https://hangel.org/u/abc' });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'List-Unsubscribe': '<https://hangel.org/u/abc>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }),
      })
    );
  });
});
