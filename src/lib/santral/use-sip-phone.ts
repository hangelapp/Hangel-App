'use client';

/**
 * src/lib/santral/use-sip-phone.ts
 * STK santral panelinin TARAYICIDAN gerçek WebRTC arama yapması için React hook.
 * hangel WebRTC geçidine (Asterisk wss://) kaydolur, giden/gelen arama yönetir.
 * sip.js DİNAMİK import edilir (SSR/server bundle'a girmez). Bu dosya SADECE
 * client; server provider class'ı sipjs-provider.ts'te (server-safe) kaldı.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Session as SessionType,
  UserAgent as UserAgentType,
  UserAgentOptions,
  Invitation as InvitationType,
} from 'sip.js';

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
  /** WebRTC ICE sunucuları (STUN + TURN). NAT arkasında ses için TURN şart. */
  iceServers?: RTCIceServer[] | null;
  /**
   * Gelen aramayı alacak kişinin uid'i. Doluysa yalnızca bu kişinin tarayıcısı
   * çalar; diğer tarayıcılar gelen INVITE'ı reddeder. Boş/null ise "herkes çalar"
   * (eski varsayılan davranış korunur).
   */
  inboundAgentUid?: string | null;
  /** Şu anki kullanıcının uid'i (atanmış kişi gate'i için karşılaştırılır). */
  selfUid?: string | null;
  /**
   * Gelen arama ÇALMAYA başladığında (state 'incoming' olmadan hemen önce)
   * çağrılır. callSessions doc'u oluşturmak için kullanılır.
   */
  onInbound?: (callerNumber: string) => void;
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
  // Yalnız rakam bırak. Asterisk dialplan `_X.` pattern'i '+' ile başlayan
  // numarayı EŞLEŞTİRMEZ → çağrı anında düşer ("1 sn'de görüşme bitti").
  // Türkiye trunk'ı 90XXXXXXXXXX bekler. '+' ve baştaki '00' soyulur;
  // baştaki tek '0' (0XXX...) da ulusal formattır → 90 önekine çevrilir.
  let n = input.replace(/[^\d]/g, '');
  if (n.startsWith('00')) n = n.slice(2);
  else if (n.startsWith('0')) n = '90' + n.slice(1);
  return n;
}

/**
 * Ham WSS/SIP bağlantı hatasını kullanıcıya anlaşılır Türkçe mesaja çevirir.
 * En sık senaryo: geçidin TLS sertifikası geçersiz/erişilemez → tarayıcı WSS
 * handshake'ini kapatır (kod 1006). Kullanıcı "başarısız" yerine ne yapacağını
 * bilsin (yeniden deneniyor).
 */
function friendlyConnError(err: unknown): string {
  const raw = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  if (raw.includes('1006') || raw.includes('websocket') || raw.includes('transport') || raw.includes('closed')) {
    return 'Santral geçidine bağlanılamadı (güvenli bağlantı kurulamadı). Yeniden deneniyor…';
  }
  if (raw.includes('cert') || raw.includes('tls') || raw.includes('ssl')) {
    return 'Santral güvenlik sertifikası doğrulanamadı. Yeniden deneniyor…';
  }
  if (raw.includes('register') || raw.includes('401') || raw.includes('403')) {
    return 'Santral kimlik doğrulaması başarısız. Ayarları kontrol edin.';
  }
  return 'Santral bağlantı hatası. Yeniden deneniyor…';
}

/**
 * Ses kalitesi için mikrofon (getUserMedia) constraints.
 * echoCancellation/noiseSuppression/autoGainControl = tarayıcının yankı+gürültü
 * bastırma ve otomatik seviye motorları. Bunlar açık olmadan çağrılarda yankı,
 * fon gürültüsü ve kısık/dalgalı ses olur. Opus zaten 48kHz'i destekler.
 */
const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  // Opus için ideal; tarayıcı desteklemezse yok sayar (ideal = zorunlu değil).
  sampleRate: 48000,
  channelCount: 1,
};

const SDH_OPTIONS = {
  constraints: { audio: AUDIO_CONSTRAINTS, video: false },
} as const;

/**
 * STK santral paneli için tarayıcı SIP.js telefonu.
 *
 * Config tam değilse `ready=false`, `state='unconfigured'` döner ve hiçbir
 * yan etki üretmez (mevcut panel mock akışı korunur).
 */
export function useSipPhone(config: UseSipPhoneConfig): UseSipPhoneApi {
  const { wssUrl, username, password, domain, iceServers, inboundAgentUid, selfUid, onInbound } = config;
  // ICE sunucularını stabil bir anahtara çevir (effect dep'i diziye bağlı kalmasın).
  const iceServersKey = useMemo(() => JSON.stringify(iceServers ?? []), [iceServers]);

  // GATE: tüm credential'lar dolu mu? Biri eksikse özellik pasif.
  const ready = Boolean(wssUrl && username && password && domain);

  const [state, setState] = useState<SipPhoneState>(ready ? 'connecting' : 'unconfigured');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [remoteIdentity, setRemoteIdentity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bağlantı koptuğunda otomatik yeniden-deneme sayacı; artışı effect'i yeniden
  // tetikler (backoff aşağıda). Santral geçidi geri gelince panel kendiliğinden
  // bağlanır — kullanıcı sayfayı yenilemek zorunda kalmaz.
  const [retryTick, setRetryTick] = useState(0);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const uaRef = useRef<UserAgentType | null>(null);
  const sessionRef = useRef<SessionType | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Strict-mode / hızlı unmount koruması — async init bitince hâlâ mount'ta mıyız?
  const mountedRef = useRef(true);
  // Gelen-arama gate'i live ref'lerden okunur: registration effect'i yeniden
  // KURMADAN güncel değerlere ulaşır (outbound/registration mantığı korunur).
  const inboundAgentUidRef = useRef<string | null | undefined>(inboundAgentUid);
  const selfUidRef = useRef<string | null | undefined>(selfUid);
  const onInboundRef = useRef<typeof onInbound>(onInbound);
  inboundAgentUidRef.current = inboundAgentUid;
  selfUidRef.current = selfUid;
  onInboundRef.current = onInbound;

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
            const el = remoteAudioRef.current;
            el.srcObject = remoteStream;
            el.volume = 1.0;
            // Bazı tarayıcılar ilk play()'i autoplay politikasıyla reddedebilir;
            // kısa bir retry karşıdan ses gelmeme sorununu azaltır.
            const tryPlay = () => el.play().catch(() => setTimeout(() => el.play().catch(() => undefined), 300));
            void tryPlay();
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

        const parsedIce: RTCIceServer[] = JSON.parse(iceServersKey);
        const uaOptions: UserAgentOptions = {
          uri,
          authorizationUsername: username,
          authorizationPassword: password,
          transportOptions: { server: wssUrl },
          // WebRTC ICE: STUN + TURN. Geçit ve tarayıcı NAT arkasında olduğu için
          // TURN olmadan ses akmaz. peerConnectionConfiguration tüm session'lara uygulanır.
          sessionDescriptionHandlerFactoryOptions: parsedIce.length
            ? { peerConnectionConfiguration: { iceServers: parsedIce } }
            : undefined,
          delegate: {
            onInvite: (invitation: InvitationType) => {
              if (!mountedRef.current) {
                void invitation.reject().catch(() => undefined);
                return;
              }
              const callerNumber = invitation.remoteIdentity?.uri?.user ?? '';
              // GATE: atanmış kişi varsa ve ben o değilsem reddet — bu tarayıcı
              // çalmasın. inboundAgentUid boşsa "herkes çalar" (eski davranış).
              const assigned = inboundAgentUidRef.current;
              const me = selfUidRef.current;
              if (assigned && me && me !== assigned) {
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
              // Gelen arama bu tarayıcıda çalıyor → callSessions doc'u oluştur.
              onInboundRef.current?.(callerNumber);
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
        retryCountRef.current = 0; // başarılı bağlantı → backoff sıfırlanır
        setState('registered');
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(friendlyConnError(err));
        setState('failed');
        // Otomatik yeniden-deneme: 3s, 6s, 12s, 24s… (maks 30s). Geçit geri
        // gelince kendiliğinden bağlanır. Timer unmount/yeniden-init'te temizlenir.
        const n = retryCountRef.current;
        const delay = Math.min(3000 * 2 ** n, 30000);
        retryCountRef.current = n + 1;
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(() => {
          if (mountedRef.current) setRetryTick((t) => t + 1);
        }, delay);
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
    // retryTick artışı → başarısız bağlantıdan sonra effect yeniden çalışır (backoff).
  }, [ready, wssUrl, username, password, domain, iceServersKey, wireSession, stopTick, retryTick]);

  // Unmount'ta bekleyen retry timer'ını temizle.
  useEffect(() => () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current); }, []);

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
          sessionDescriptionHandlerOptions: SDH_OPTIONS,
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
        sessionDescriptionHandlerOptions: SDH_OPTIONS,
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
