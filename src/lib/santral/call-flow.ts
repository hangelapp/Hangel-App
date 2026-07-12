/**
 * Santral çağrı akışı (call flow) veri modeli — panelden yönetici düzenler,
 * Asterisk gelen çağrıda /api/santral/call-flow-resolve ile bunu okuyup uygular.
 *
 * TASARIM: Her özellik `enabled` bayrağıyla; hepsi varsayılan KAPALI. Hiçbiri
 * açık değilse santral "normal telefon" gibi davranır: gelen çağrı doğrudan
 * webrtc panelini + varsa dahilileri çaldırır. Yönetici Ayarlar'dan tek tek açar.
 *
 * Saf TS (Firebase importu yok) — hem API route hem UI paylaşır.
 */

export interface WorkingHoursDay {
  /** O gün açık mı (mesai var mı). Kapalıysa gün boyu "mesai dışı" akışı. */
  open: boolean;
  /** "HH:mm" — mesai başlangıç. */
  from: string;
  /** "HH:mm" — mesai bitiş. */
  to: string;
}

/** Cevapsız / mesai-dışı durumunda ne yapılacağı. */
export type FallbackAction = 'voicemail' | 'forward' | 'hangup';

export interface IvrOption {
  /** Basılacak tuş: "1".."9", "0". */
  digit: string;
  /** Menüde okunacak/gösterilecek etiket ("Kullanıcı İlişkileri"). */
  label: string;
  /** Bu tuş hangi dahiliye/gruba gider. Boşsa ana gruba düşer. */
  target: string; // dahili ext (ör. "100") veya "queue" (sıra)
}

export interface CallFlow {
  /** IVR / sesli karşılama menüsü. */
  ivr: {
    enabled: boolean;
    /** Karşılama metni (TTS için) — ses dosyası yoksa bu okunur. */
    greetingText: string;
    /** Yüklenen karşılama ses dosyası (Storage URL). Varsa greetingText yerine çalar. */
    greetingAudioUrl: string | null;
    options: IvrOption[];
    /** Geçersiz/tuşsuz seçimde saniye sonra ana akışa düş. */
    timeoutSeconds: number;
  };
  /** Çoklu temsilci / sıra. */
  queue: {
    enabled: boolean;
    /** Çaldırılacak dahililer (ör. ["100","101","102"]). */
    members: string[];
    /** 'ringall' = hepsi aynı anda, 'linear' = sırayla. */
    strategy: 'ringall' | 'linear';
    /** Her temsilci kaç saniye çalsın. */
    ringSeconds: number;
  };
  /** Cevapsız kalınca ne olacağı. */
  noAnswer: {
    action: FallbackAction; // voicemail | forward | hangup
    /** forward ise yönlendirilecek numara (E.164). */
    forwardNumber: string | null;
    /** voicemail ise anons metni. */
    voicemailPrompt: string;
    /** voicemail için yüklenen anons ses dosyası (opsiyonel). */
    voicemailAudioUrl: string | null;
  };
  /** Çalışma saatleri. Kapalı saatlerde noAnswer akışı (veya mesai-dışı anonsu). */
  workingHours: {
    enabled: boolean;
    /** IANA tz — TR için 'Europe/Istanbul'. */
    timezone: string;
    /** 0=Pazar .. 6=Cumartesi. */
    days: WorkingHoursDay[];
    /** Mesai dışı anons metni. */
    closedPrompt: string;
    closedAudioUrl: string | null;
  };
}

/** Varsayılan (ilk kurulum): HER ŞEY KAPALI → normal telefon gibi. */
export function defaultCallFlow(): CallFlow {
  const day = (): WorkingHoursDay => ({ open: true, from: '09:00', to: '18:00' });
  return {
    ivr: {
      enabled: false,
      greetingText: 'hangel çağrı merkezine hoş geldiniz.',
      greetingAudioUrl: null,
      options: [],
      timeoutSeconds: 7,
    },
    queue: {
      enabled: false,
      members: [],
      strategy: 'ringall',
      ringSeconds: 25,
    },
    noAnswer: {
      action: 'hangup',
      forwardNumber: null,
      voicemailPrompt: 'Şu an size ulaşamıyoruz. Lütfen sinyal sesinden sonra mesajınızı bırakın.',
      voicemailAudioUrl: null,
    },
    workingHours: {
      enabled: false,
      timezone: 'Europe/Istanbul',
      days: [day(), day(), day(), day(), day(), day(), { open: false, from: '09:00', to: '18:00' }],
      closedPrompt: 'Şu an çalışma saatleri dışındayız. Lütfen daha sonra tekrar arayın.',
      closedAudioUrl: null,
    },
  };
}

/** Gelen (kısmi/eski) veriyi güvenli tam CallFlow'a normalize eder. */
export function normalizeCallFlow(raw: unknown): CallFlow {
  const d = defaultCallFlow();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  const asBool = (v: unknown, dv: boolean) => (typeof v === 'boolean' ? v : dv);
  const asStr = (v: unknown, dv: string) => (typeof v === 'string' ? v : dv);
  const asNum = (v: unknown, dv: number) => (typeof v === 'number' && Number.isFinite(v) ? v : dv);
  const clampSec = (v: unknown, dv: number) => Math.min(120, Math.max(3, asNum(v, dv)));

  const ivr = (r.ivr || {}) as Record<string, unknown>;
  const queue = (r.queue || {}) as Record<string, unknown>;
  const noAnswer = (r.noAnswer || {}) as Record<string, unknown>;
  const wh = (r.workingHours || {}) as Record<string, unknown>;

  return {
    ivr: {
      enabled: asBool(ivr.enabled, d.ivr.enabled),
      greetingText: asStr(ivr.greetingText, d.ivr.greetingText).slice(0, 500),
      greetingAudioUrl: typeof ivr.greetingAudioUrl === 'string' ? ivr.greetingAudioUrl : null,
      options: Array.isArray(ivr.options)
        ? ivr.options
            .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object')
            .map((o) => ({
              digit: asStr(o.digit, '').replace(/[^0-9]/g, '').slice(0, 1),
              label: asStr(o.label, '').slice(0, 80),
              target: asStr(o.target, '').slice(0, 40),
            }))
            .filter((o) => o.digit)
            .slice(0, 10)
        : [],
      timeoutSeconds: clampSec(ivr.timeoutSeconds, d.ivr.timeoutSeconds),
    },
    queue: {
      enabled: asBool(queue.enabled, d.queue.enabled),
      members: Array.isArray(queue.members)
        ? queue.members.filter((m): m is string => typeof m === 'string').map((m) => m.replace(/[^0-9]/g, '').slice(0, 6)).filter(Boolean).slice(0, 20)
        : [],
      strategy: queue.strategy === 'linear' ? 'linear' : 'ringall',
      ringSeconds: clampSec(queue.ringSeconds, d.queue.ringSeconds),
    },
    noAnswer: {
      action: noAnswer.action === 'voicemail' || noAnswer.action === 'forward' ? noAnswer.action : 'hangup',
      forwardNumber: typeof noAnswer.forwardNumber === 'string' && noAnswer.forwardNumber ? noAnswer.forwardNumber : null,
      voicemailPrompt: asStr(noAnswer.voicemailPrompt, d.noAnswer.voicemailPrompt).slice(0, 500),
      voicemailAudioUrl: typeof noAnswer.voicemailAudioUrl === 'string' ? noAnswer.voicemailAudioUrl : null,
    },
    workingHours: {
      enabled: asBool(wh.enabled, d.workingHours.enabled),
      timezone: asStr(wh.timezone, d.workingHours.timezone),
      days: Array.isArray(wh.days) && wh.days.length === 7
        ? wh.days.map((x) => {
            const o = (x || {}) as Record<string, unknown>;
            return { open: asBool(o.open, true), from: asStr(o.from, '09:00'), to: asStr(o.to, '18:00') };
          })
        : d.workingHours.days,
      closedPrompt: asStr(wh.closedPrompt, d.workingHours.closedPrompt).slice(0, 500),
      closedAudioUrl: typeof wh.closedAudioUrl === 'string' ? wh.closedAudioUrl : null,
    },
  };
}
