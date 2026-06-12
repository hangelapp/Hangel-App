/**
 * src/lib/santral/stub-provider.ts
 *
 * Provider-agnostik stub implementasyonu. Gerçek bir santral entegrasyonu
 * seçilene kadar (NetGSM Sesli / Twilio / Plivo / Aircall) uygulama tüm flow'u
 * bu stub ile çalışır:
 *   - callSessions doc'u açılır,
 *   - originateCall stub callId döner,
 *   - webhook handler stub event akışıyla test edilir,
 *   - recording listesi boş döner.
 *
 * KVKK: stub asla gerçek arama yapmaz, recording byte tutmaz. Sadece in-memory
 * id üretir + log atar.
 */
import { CallSessionStatus } from './types';
import type {
  OriginateCallOptions,
  OriginateCallResult,
  RecordingDescriptor,
  SantralProvider,
} from './types';

/**
 * Crypto-safe rastgele id — Node 18+ globalThis.crypto.randomUUID kullanır,
 * yoksa Math.random fallback (sadece testte düşer).
 */
function randomId(prefix: string): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return `${prefix}-${c.randomUUID()}`;
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export class StubSantralProvider implements SantralProvider {
  public readonly id: string;
  public readonly name: string;

  constructor(id = 'stub', name = 'Stub Santral (Henüz Sağlayıcı Seçilmedi)') {
    this.id = id;
    this.name = name;
  }

  async originateCall(opts: OriginateCallOptions): Promise<OriginateCallResult> {
    // KVKK: input'larda telefon numaraları var — log'a SADECE maskelenmiş
    // hali yazılır (last 4). Bu module'de yazma yok, route handler audit
    // log atar. Burada sadece deterministic id üretip dönüyoruz.
    const providerCallId = randomId('stub-call');
    // Pre-allocated callSessionId varsa onu yansıt — webhook handler'ın
    // metadata eşleştirmesini test etmek için.
    const correlated = opts.callSessionId ? `${providerCallId}-${opts.callSessionId}` : providerCallId;
    return {
      providerCallId: correlated,
      status: CallSessionStatus.Ringing,
    };
  }

  async listRecordings(_providerCallId: string): Promise<RecordingDescriptor[]> {
    // Stub: hiç recording yok.
    return [];
  }

  async hangup(_providerCallId: string): Promise<void> {
    // Stub: no-op. Gerçek implementasyon REST/SIP komutu gönderir.
  }

  /**
   * Geri uyumluluk shim — src/app/api/ngo-admin/calls/originate/route.ts
   * dynamic import ile bu class'i çağırıyor ve aşağıdaki imzayı bekliyor.
   * Yeni kod doğrudan `originateCall(opts)` kullanmalı.
   */
  async originate(args: {
    fromNumber: string;
    toNumber: string;
    ngoId: string;
    agentUid: string;
    callSessionId: string;
  }): Promise<{ providerCallId: string; status: 'ringing' | 'queued' | 'failed'; error?: string }> {
    const result = await this.originateCall({
      from: args.fromNumber,
      to: args.toNumber,
      ngoId: args.ngoId,
      agentUid: args.agentUid,
      webhookUrl: '/api/integrations/santral/webhook',
      callSessionId: args.callSessionId,
    });
    // Map iç status'u route'un beklediği daraltılmış union'a.
    const status: 'ringing' | 'queued' | 'failed' =
      result.status === CallSessionStatus.Failed
        ? 'failed'
        : result.status === CallSessionStatus.Ringing
        ? 'ringing'
        : 'queued';
    return {
      providerCallId: result.providerCallId,
      status,
      error: result.error,
    };
  }
}

/**
 * Default export — `import StubSantralProvider from '@/lib/santral/stub-provider'`
 * şeklinde import edenler için.
 */
export default StubSantralProvider;
