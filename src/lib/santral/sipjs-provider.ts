/**
 * src/lib/santral/sipjs-provider.ts
 *
 * SIP.js tabanlı WebRTC SantralProvider iskeleti — Faz 3.
 *
 * AMAÇ
 * ====
 * Hangel SIP provider tarafında WebRTC WSS endpoint hazır olunca (firma henüz
 * vermedi), bu adapter doğrudan tarayıcı/Node taraflı WebRTC oturumu açar ve
 * çağrı kurar. Şimdilik **iskelet + TODO**: gerçek media akışı, ICE/STUN ve
 * registration Faz 3'te tamamlanacak.
 *
 * AKTİVASYON
 * ==========
 * Faz 3 — firma WSS endpoint gelir gelmez `santralProviders/{id}` doc'una
 *   { providerType: 'sipjs', wssUrl: 'wss://...', sipServer: 'sip:...' }
 * yazılır ve `index.ts` switch'i bu provider'ı otomatik döndürür. Stub davranışı
 * korunur (config eksikse fail-safe stub).
 *
 * KVKK
 * ====
 * - WebRTC media byte'ı asla log'a / Firestore'a düşmez.
 * - Recording sunucu (SIP proxy / B2BUA) tarafında alınır; bu modül sadece
 *   `recording.ready` webhook'una bel bağlar — `listRecordings` boş döner.
 *
 * TASARIM KARARI
 * ==============
 * `SantralProvider` arayüzü "originate" + "hangup" + "listRecordings" üçünden
 * ibaret. SIP.js bu üçü için sırasıyla `Inviter`, `Session.bye()` ve no-op
 * sağlar. Adapter session'ları `providerCallId → Inviter` map'inde tutar ki
 * hangup çağrıldığında doğru oturum kapatılsın.
 *
 * Bu modül **Node + Browser** ortamlarında çalışacak şekilde defansif yazıldı;
 * `UserAgent` instantiation'ını lazy yapıyoruz çünkü Node'da WebRTC stack
 * (wrtc / @roamhq/wrtc) ayrıca enjekte edilmeli — Faz 3 TODO.
 */
// NOT: `sip.js` SADECE tarayıcıda (WebRTC) çalışır ve server bundle'a
// girerse build kilitlenir (dünkü prod hatası). Bu yüzden burada YALNIZCA
// tip-only import yapıyoruz; runtime sınıfları hem server provider hem de
// client hook tarafında `await import('sip.js')` ile DİNAMİK yüklenir.
import type {
  Inviter as InviterType,
  Session as SessionType,
  UserAgent as UserAgentType,
  UserAgentOptions,
  Invitation as InvitationType,
} from 'sip.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CallSessionStatus } from './types';
import type {
  OriginateCallOptions,
  OriginateCallResult,
  RecordingDescriptor,
  SantralProvider,
} from './types';

/**
 * Provider constructor opts — Firestore'daki santralProviders/{id} doc'undan
 * `index.ts` tarafından doldurulur.
 */
export interface SIPjsProviderOptions {
  /** Provider doc id (santralProviders/{id}). */
  id?: string;
  /** Human readable display name. */
  name?: string;
  /** SIP server URI ("sip:sip-185-77-91-103.example:5060"). */
  sipServer: string;
  /** WSS endpoint — firma henüz vermedi; boş gelirse provider hata döner. */
  wssUrl: string;
  /** Caller ID / from header'da görünecek isim. */
  displayName: string;
  /** SIP auth username (opsiyonel — registration için Faz 3). */
  authorizationUsername?: string;
  /** SIP auth password (opsiyonel — registration için Faz 3). */
  authorizationPassword?: string;
}

/**
 * Inviter referansını tutan minimal kayıt — hangup için lookup yapılır.
 */
interface ActiveSessionEntry {
  inviter: InviterType;
  session: SessionType;
  createdAt: number;
}

/**
 * Crypto-safe rastgele id — providerCallId olarak kullanılır.
 */
function randomRequestUuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // Fallback: yalnızca test ortamında düşer; production Node 18+ randomUUID var.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class SIPjsProvider implements SantralProvider {
  public readonly id: string;
  public readonly name: string;

  private readonly sipServer: string;
  private readonly wssUrl: string;
  private readonly displayName: string;
  private readonly authorizationUsername?: string;
  private readonly authorizationPassword?: string;

  /** providerCallId → ActiveSessionEntry — hangup lookup için. */
  private readonly activeSessions = new Map<string, ActiveSessionEntry>();

  /** Lazy-init UserAgent — ilk originate çağrısında kurulur. */
  private userAgent: UserAgentType | null = null;

  constructor(opts: SIPjsProviderOptions) {
    this.id = opts.id ?? 'sipjs';
    this.name = opts.name ?? 'SIP.js WebRTC Provider';
    this.sipServer = opts.sipServer;
    this.wssUrl = opts.wssUrl;
    this.displayName = opts.displayName;
    this.authorizationUsername = opts.authorizationUsername;
    this.authorizationPassword = opts.authorizationPassword;
  }

  /**
   * Outbound çağrı başlat. Faz 3 iskeleti:
   *   1. UserAgent lazy init,
   *   2. Inviter oluştur,
   *   3. invite() çağır,
   *   4. state listener'ı çağrıyı `ringing → in-progress → completed` map'leyecek
   *      (Faz 3'te webhook event'i de tetiklenebilir),
   *   5. providerCallId = requestUUID döndür.
   */
  async originateCall(opts: OriginateCallOptions): Promise<OriginateCallResult> {
    // Faz 3 guard: WSS endpoint yoksa fail-fast — kullanıcı dial tuşuna
    // bastığında net hata görsün, sessizce kuyruğa atılmasın.
    if (!this.wssUrl || !this.sipServer) {
      return {
        providerCallId: `sipjs-unconfigured-${randomRequestUuid()}`,
        status: CallSessionStatus.Failed,
        error: 'SIPjs provider WSS/SIP server config eksik (Faz 3 bekleniyor).',
      };
    }

    const providerCallId = randomRequestUuid();

    try {
      const { Inviter, UserAgent } = await import('sip.js');
      const ua = await this.ensureUserAgent();

      // SIP URI hedef: tel:+90... formatı yerine sip:E164@server kullanıyoruz
      // (SIP proxy "@server" host'unu tanır, kullanıcı E.164 numarayı user
      // kısmında alır). Faz 3'te proxy'nin tercih ettiği format'a göre değişir.
      const sanitizedTo = opts.to.replace(/[^\d+]/g, '');
      const targetUri = UserAgent.makeURI(`sip:${sanitizedTo}@${this.serverHost()}`);
      if (!targetUri) {
        return {
          providerCallId,
          status: CallSessionStatus.Failed,
          error: 'Hedef SIP URI üretilemedi (geçersiz numara).',
        };
      }

      // Inviter — outbound INVITE temsilcisi. Faz 3 TODO: SDP/codec options,
      // ICE configuration, recording metadata header'ları.
      const inviter = new Inviter(ua, targetUri, {
        // TODO Faz 3: sessionDescriptionHandlerOptions ile codec ve
        // STUN/TURN ICE config'i geç.
      });

      // State akışını dinle — Faz 3'te bu listener kanonik
      // SantralWebhookEventType ('call.answered' / 'call.ended') tetikler.
      inviter.stateChange.addListener((state) => {
        this.handleSessionStateChange(providerCallId, state);
      });

      // INVITE gönder. Bu Promise INVITE'ın network'e ulaşmasıyla resolve olur;
      // karşı tarafın cevaplaması ayrı bir state event'i (Established) tetikler.
      await inviter.invite({
        // TODO Faz 3: requestDelegate ile 18x/200/4xx response handler ekle.
      });

      this.activeSessions.set(providerCallId, {
        inviter,
        session: inviter,
        createdAt: Date.now(),
      });

      return {
        providerCallId,
        status: CallSessionStatus.Ringing,
      };
    } catch (err) {
      return {
        providerCallId,
        status: CallSessionStatus.Failed,
        error: err instanceof Error ? err.message : 'SIPjs originate hata',
      };
    }
  }

  /**
   * Recording listesi. SIP.js client-side recording yapmaz; recording SIP
   * proxy / B2BUA tarafında oluşur ve `recording.ready` webhook'u ile gelir.
   * Bu yüzden burası KVKK gereği boş döner.
   */
  async listRecordings(_providerCallId: string): Promise<RecordingDescriptor[]> {
    return [];
  }

  /**
   * Aktif çağrıyı sonlandır — `SessionState.Terminated` transition tetikler.
   * Inviter henüz Established değilse `cancel()`, sonrasındaysa `bye()` kullanır.
   */
  async hangup(providerCallId: string): Promise<void> {
    const entry = this.activeSessions.get(providerCallId);
    if (!entry) return;

    const { session, inviter } = entry;
    try {
      const { SessionState } = await import('sip.js');
      switch (session.state) {
        case SessionState.Initial:
        case SessionState.Establishing:
          await inviter.cancel();
          break;
        case SessionState.Established:
          await session.bye();
          break;
        case SessionState.Terminating:
        case SessionState.Terminated:
          // Zaten kapatılıyor / kapatıldı — no-op.
          break;
        default:
          // Defensive: bilinmeyen state'te cancel dene.
          await inviter.cancel().catch(() => undefined);
      }
    } finally {
      this.activeSessions.delete(providerCallId);
    }
  }

  /**
   * UserAgent lazy init — sadece ilk originate'te kurulur. Faz 3'te transport
   * options + register flow buraya eklenecek.
   */
  private async ensureUserAgent(): Promise<UserAgentType> {
    if (this.userAgent) return this.userAgent;

    const { UserAgent } = await import('sip.js');
    const fromUri = UserAgent.makeURI(`sip:${this.displayName}@${this.serverHost()}`);
    if (!fromUri) {
      throw new Error('Caller URI üretilemedi.');
    }

    const uaOptions: UserAgentOptions = {
      uri: fromUri,
      displayName: this.displayName,
      transportOptions: {
        server: this.wssUrl,
      },
      // TODO Faz 3: SDP/ICE servers, autoReconnect, keepAlive interval.
      authorizationUsername: this.authorizationUsername,
      authorizationPassword: this.authorizationPassword,
    };

    const ua = new UserAgent(uaOptions);
    await ua.start();
    this.userAgent = ua;
    return ua;
  }

  /**
   * Session state değişimlerini provider seviyesinde temizle. Faz 3'te bu
   * callback'ten kanonik webhook event tipleri ('call.answered', 'call.ended')
   * tetiklenecek; şimdilik sadece session map temizliği.
   */
  private handleSessionStateChange(providerCallId: string, state: SessionType['state']): void {
    // SessionState.Terminated enum değeri = 'Terminated' string'i. Sync callback
    // olduğu için runtime enum import etmeden string literal ile karşılaştırıyoruz.
    if (state === 'Terminated') {
      this.activeSessions.delete(providerCallId);
    }
    // TODO Faz 3: state → SantralWebhookEventType map'i + internal event bus
    // (webhook route'u gibi callSessions doc'una yazsın).
  }

  /**
   * sip:user@HOST → HOST kısmını sipServer config'inden çıkarır.
   */
  private serverHost(): string {
    return this.sipServer.replace(/^sips?:/, '').split(':')[0] || 'invalid';
  }
}

export default SIPjsProvider;

/* ===========================================================================
 * TARAYICI HOOK — useSipPhone
 *
 * STK santral panelinin TARAYICIDAN gerçek WebRTC arama yapması için React
 * hook'u. hangel WebRTC geçidine (Asterisk, wss://santral.hangel.org.tr) SIP
 * endpoint olarak kaydolur, giden/gelen aramaları yönetir.
 *
 * GATE: `wssUrl` + `username` + `password` + `domain` config'inden herhangi
 * biri eksikse hook PASİF kalır (state='unconfigured'). Çağıran taraf bu
 * durumda mevcut mock/UI davranışını korur — panel ASLA kırılmaz.
 *
 * `sip.js` SADECE tarayıcıda çalışır ve DİNAMİK import edilir
 * (`await import('sip.js')`), böylece SSR/server bundle'a girmez.
 * =========================================================================== */

/** useSipPhone telefon durumları. */
export type SipPhoneState =
  | 'unconfigured' // Gerekli config eksik — özellik pasif.
  | 'connecting' // WSS/registration kuruluyor.
  | 'registered' // Geçide kayıtlı, hazır.
  | 'calling' // Giden arama gönderildi, karşı taraf çalıyor.
  | 'incoming' // Gelen arama bekliyor (cevapla/reddet).
  | 'in-call' // Görüşme aktif.
  | 'ended' // Son görüşme sonlandı.
  | 'failed'; // Registration/çağrı hatası.

export interface UseSipPhoneConfig {
  /** WebRTC geçidi WSS URL'i (wss://...). Yoksa hook pasif. */
  wssUrl?: string | null;
  /** Geçidin browser SIP endpoint kullanıcı adı. Yoksa hook pasif. */
  username?: string | null;
  /** Geçidin browser SIP endpoint şifresi. Yoksa hook pasif. */
  password?: string | null;
  /** SIP domain (sip:user@DOMAIN). Yoksa hook pasif. */
  domain?: string | null;
}

export interface UseSipPhoneApi {
  /** Mevcut telefon durumu. */
  state: SipPhoneState;
  /** Aktif/son çağrının saniye cinsinden süresi (in-call boyunca artar). */
  durationSeconds: number;
  /** Mikrofon mute durumu. */
  muted: boolean;
  /** Gelen arama varsa karşı tarafın görünen adı/numarası. */
  remoteIdentity: string | null;
  /** Son hata mesajı (state='failed' iken). */
  error: string | null;
  /** Config eksik → false; özellik kullanılabiliyor mu. */
  ready: boolean;
  /** Remote ses elementine bağlanacak ref. <audio ref={...} autoPlay /> */
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
  /** Giden arama başlat. Pasifse no-op. */
  call: (number: string) => Promise<void>;
  /** Gelen aramayı cevapla. */
  answer: () => Promise<void>;
  /** Aktif/gelen/giden çağrıyı sonlandır veya reddet. */
  hangup: () => Promise<void>;
  /** Mikrofonu aç/kapat. */
  mute: () => void;
}

/**
 * E.164 / serbest girişten SIP user kısmı üret (sadece rakam + baştaki +).
 */
function sanitizeNumber(input: string): string {
  return input.replace(/[^\d+]/g, '');
}

/**
 * STK santral paneli için tarayıcı SIP.js telefonu.
 *
 * Config tam değilse `ready=false`, `state='unconfigured'` döner ve hiçbir
 * yan etki üretmez (mevcut panel mock akışı korunur).
 */
export function useSipPhone(config: UseSipPhoneConfig): UseSipPhoneApi {
  const { wssUrl, username, password, domain } = config;

  // GATE: tüm credential'lar dolu mu? Biri eksikse özellik pasif.
  const ready = Boolean(wssUrl && username && password && domain);

  const [state, setState] = useState<SipPhoneState>(ready ? 'connecting' : 'unconfigured');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [remoteIdentity, setRemoteIdentity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const uaRef = useRef<UserAgentType | null>(null);
  const sessionRef = useRef<SessionType | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Strict-mode / hızlı unmount koruması — async init bitince hâlâ mount'ta mıyız?
  const mountedRef = useRef(true);

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    stopTick();
    setDurationSeconds(0);
    tickRef.current = setInterval(() => {
      setDurationSeconds((s) => s + 1);
    }, 1000);
  }, [stopTick]);

  /**
   * Bir session'ı (Inviter veya Invitation) state akışına bağla: remote medya
   * attach, süre sayacı, mute reset.
   */
  const wireSession = useCallback(
    (session: SessionType) => {
      sessionRef.current = session;

      session.stateChange.addListener((newState) => {
        if (!mountedRef.current) return;
        // SessionState enum değerleri string'tir: 'Established' / 'Terminated' vb.
        if (newState === 'Established') {
          // Remote ses akışını <audio> elementine bağla.
          const sdh = session.sessionDescriptionHandler as
            | { remoteMediaStream?: MediaStream }
            | undefined;
          const remoteStream = sdh?.remoteMediaStream;
          if (remoteStream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            void remoteAudioRef.current.play().catch(() => undefined);
          }
          setState('in-call');
          setMuted(false);
          startTick();
        } else if (newState === 'Terminated') {
          stopTick();
          sessionRef.current = null;
          setRemoteIdentity(null);
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
          }
          // Registered isek tekrar hazır; değilse ended.
          setState((cur) => (cur === 'failed' ? 'failed' : 'ended'));
        }
      });
    },
    [startTick, stopTick],
  );

  // Registration / UserAgent yaşam döngüsü.
  useEffect(() => {
    mountedRef.current = true;

    if (!ready || !wssUrl || !username || !password || !domain) {
      setState('unconfigured');
      return () => {
        mountedRef.current = false;
      };
    }

    let registerer: { unregister: () => Promise<unknown> } | null = null;

    void (async () => {
      try {
        setState('connecting');
        // DİNAMİK import — sip.js sadece tarayıcıda çalışır, SSR'a sızmaz.
        const { UserAgent, Registerer } = await import('sip.js');

        const uri = UserAgent.makeURI(`sip:${username}@${domain}`);
        if (!uri) {
          throw new Error('SIP URI üretilemedi.');
        }

        const uaOptions: UserAgentOptions = {
          uri,
          authorizationUsername: username,
          authorizationPassword: password,
          transportOptions: { server: wssUrl },
          delegate: {
            onInvite: (invitation: InvitationType) => {
              if (!mountedRef.current) {
                void invitation.reject().catch(() => undefined);
                return;
              }
              wireSession(invitation);
              const display =
                invitation.remoteIdentity?.displayName ||
                invitation.remoteIdentity?.uri?.user ||
                'Bilinmeyen';
              setRemoteIdentity(display);
              setState('incoming');
            },
          },
        };

        const ua = new UserAgent(uaOptions);
        uaRef.current = ua;
        await ua.start();
        if (!mountedRef.current) {
          await ua.stop().catch(() => undefined);
          return;
        }

        const reg = new Registerer(ua);
        registerer = reg;
        await reg.register();
        if (!mountedRef.current) return;
        setState('registered');
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Santral bağlantı hatası.');
        setState('failed');
      }
    })();

    return () => {
      mountedRef.current = false;
      stopTick();
      const session = sessionRef.current;
      if (session) {
        // En iyi-çaba kapatma; state'e göre cancel/bye.
        const s = session as SessionType & {
          cancel?: () => Promise<unknown>;
          bye?: () => Promise<unknown>;
          reject?: () => Promise<unknown>;
        };
        if (session.state === 'Established') {
          void s.bye?.().catch(() => undefined);
        } else {
          void s.cancel?.().catch(() => undefined);
          void s.reject?.().catch(() => undefined);
        }
        sessionRef.current = null;
      }
      void registerer?.unregister().catch(() => undefined);
      void uaRef.current?.stop().catch(() => undefined);
      uaRef.current = null;
    };
  }, [ready, wssUrl, username, password, domain, wireSession, stopTick]);

  const call = useCallback(
    async (number: string) => {
      if (!ready) return;
      const ua = uaRef.current;
      if (!ua || !domain) return;
      try {
        const { Inviter, UserAgent } = await import('sip.js');
        const target = UserAgent.makeURI(`sip:${sanitizeNumber(number)}@${domain}`);
        if (!target) {
          throw new Error('Geçersiz hedef numara.');
        }
        const inviter = new Inviter(ua, target, {
          sessionDescriptionHandlerOptions: {
            constraints: { audio: true, video: false },
          },
        });
        wireSession(inviter);
        setRemoteIdentity(sanitizeNumber(number));
        setState('calling');
        await inviter.invite();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Arama başlatılamadı.');
        setState('failed');
      }
    },
    [ready, domain, wireSession],
  );

  const answer = useCallback(async () => {
    const session = sessionRef.current as
      | (SessionType & { accept?: (opts?: unknown) => Promise<unknown> })
      | null;
    if (!session || typeof session.accept !== 'function') return;
    try {
      await session.accept({
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });
      // 'Established' state listener'ı in-call'a geçirir + medya bağlar.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Çağrı cevaplanamadı.');
      setState('failed');
    }
  }, []);

  const hangup = useCallback(async () => {
    const session = sessionRef.current as
      | (SessionType & {
          cancel?: () => Promise<unknown>;
          bye?: () => Promise<unknown>;
          reject?: () => Promise<unknown>;
        })
      | null;
    if (!session) return;
    try {
      if (session.state === 'Established') {
        await session.bye?.();
      } else if (state === 'incoming') {
        await session.reject?.();
      } else {
        await session.cancel?.();
      }
    } catch {
      // Yarış durumu (zaten kapanmış) — yut; state listener temizler.
    }
  }, [state]);

  const mute = useCallback(() => {
    const session = sessionRef.current;
    const sdh = session?.sessionDescriptionHandler as
      | { enableSenderTracks?: (enable: boolean) => void }
      | undefined;
    if (!sdh?.enableSenderTracks) return;
    setMuted((prev) => {
      const next = !prev;
      sdh.enableSenderTracks?.(!next); // next=true → mute → track disable
      return next;
    });
  }, []);

  return useMemo(
    () => ({
      state,
      durationSeconds,
      muted,
      remoteIdentity,
      error,
      ready,
      remoteAudioRef,
      call,
      answer,
      hangup,
      mute,
    }),
    [state, durationSeconds, muted, remoteIdentity, error, ready, call, answer, hangup, mute],
  );
}
