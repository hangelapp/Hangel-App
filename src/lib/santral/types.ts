/**
 * src/lib/santral/types.ts
 *
 * Sanal santral (call-center / virtual PBX) adapter katmanının provider
 * agnostik tipleri. Gerçek sağlayıcı (NetGSM Sesli, Twilio, Plivo, vb.) henüz
 * seçilmedi — bu yüzden tüm provider implementasyonları aynı interface'i
 * uygular ve daha sonra plug edilebilir.
 *
 * KVKK kritik: bu modül asla recording byte tutmaz, sadece URL referansları
 * + metadata. Recording dosyaları Firebase Storage'a yazılır, byte log'a asla
 * düşmez.
 *
 * Bu dosya pure type definitions — runtime side effect yok, browser-safe.
 */

/**
 * callSessions/{id}.status — bir çağrı oturumunun lifecycle durumu.
 * - `ringing`     : Provider dial başlattı, karşı taraf çalıyor.
 * - `in-progress` : Karşı taraf cevapladı, görüşme devam ediyor.
 * - `completed`   : Görüşme normal sonlandı.
 * - `failed`      : Provider hata verdi veya çağrı kurulamadı.
 * - `cancelled`   : Agent başlamadan iptal etti.
 * - `no-answer`   : Karşı taraf cevap vermedi (timeout).
 * - `busy`        : Karşı taraf meşgul.
 */
export enum CallSessionStatus {
  Ringing = 'ringing',
  InProgress = 'in-progress',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
  NoAnswer = 'no-answer',
  Busy = 'busy',
}

/**
 * Provider webhook'una gönderilecek üst-seviye event tipleri.
 * Adapter implementasyonları kendi çiğ event'lerini bu kanonik tiplere map'ler.
 */
export type SantralWebhookEventType =
  | 'call.started'
  | 'call.answered'
  | 'call.ended'
  | 'recording.ready';

/**
 * originateCall çağrısının input'u — provider agnostik.
 */
export interface OriginateCallOptions {
  /** Caller ID olarak gösterilecek STK numarası (E.164 format, +90...). */
  from: string;
  /** Aranan numara (E.164 format, +90...). */
  to: string;
  /** Çağrıyı başlatan agent'in Firebase Auth uid'i. */
  agentUid: string;
  /** Multi-tenant ngo izolasyonu için STK id'si. */
  ngoId: string;
  /** Provider event'lerini geri göndereceği webhook URL'i. */
  webhookUrl: string;
  /** Pre-allocated callSessions/{id} doc id — callback'lerle eşleşir. */
  callSessionId?: string;
}

/**
 * originateCall sonucu — provider'in döndüğü kimlik + ilk status.
 */
export interface OriginateCallResult {
  /** Provider'in çağrıya verdiği kendi id'si (Twilio CallSid, NetGSM jobId vb.). */
  providerCallId: string;
  /** Provider'in ilk anki çağrı durumu. */
  status: CallSessionStatus;
  /** Hata varsa human-readable mesaj. */
  error?: string;
}

/**
 * Recording listesi item'i — bytes ASLA içermez, sadece referans.
 */
export interface RecordingDescriptor {
  /** Provider tarafındaki recording id'si. */
  providerRecordingId: string;
  /** Provider'in recording'i indirmek için verdiği URL (ephemeral / signed). */
  downloadUrl: string;
  /** Saniye cinsinden kayıt süresi. */
  durationSeconds?: number;
  /** Recording oluşturma zamanı (provider tarafı). */
  createdAt?: Date;
  /** Mime type (audio/mpeg, audio/wav, vb.). */
  mimeType?: string;
}

/**
 * SantralProvider — tüm provider implementasyonlarının uyduğu interface.
 *
 * Kural: her metot saf data alır + saf data döner. Storage / Firestore yazımı
 * route handler'ın sorumluluğudur (separation of concerns). Bu sayede
 * Stub provider testte birebir aynı çalışır.
 */
export interface SantralProvider {
  /** Provider tekil id'si — santralProviders/{providerId} ile eşleşir. */
  readonly id: string;
  /** Human readable ad ("NetGSM Sesli", "Twilio", vb.). */
  readonly name: string;

  /**
   * Outbound çağrı başlat. Başarılı dönüş = provider çağrıyı kuyrukladı veya
   * dial başlattı; gerçek "cevaplandı" sinyali webhook ile gelir.
   */
  originateCall(opts: OriginateCallOptions): Promise<OriginateCallResult>;

  /**
   * Provider'da o callId için hazır kayıtları listele. Recording byte'ı bu
   * metoddan ASLA dönmez — sadece descriptor (URL + metadata).
   */
  listRecordings(providerCallId: string): Promise<RecordingDescriptor[]>;

  /**
   * Aktif çağrıyı sonlandır. No-op döner stub'da; gerçek provider canlı
   * bağlantıyı keser.
   */
  hangup(providerCallId: string): Promise<void>;
}
