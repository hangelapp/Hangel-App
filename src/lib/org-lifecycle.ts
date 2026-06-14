/**
 * org-lifecycle — kurumsal (STK/Kulüp/Marka) yaşam döngüsü bildirimleri.
 *
 * Bireysel kullanıcıya "hoş geldin" mesajı attığımız gibi, kurumlara da
 * kayıt / etkinlik / gönüllülük ilanı akışlarının her aşamasında hem in-app
 * bildirim (notify-user 3-kanal: notifications + push + opsiyonel messages)
 * hem de kurumsal telefon numarasına TRANSACTIONAL SMS göndeririz.
 *
 * Bu modül yalnızca metin şablonlarını ve dispatch'i içerir. Doküman yükleme,
 * yetki kontrolü ve telefon/alıcı çözümlemesi API route'ta yapılır
 * (src/app/api/org/lifecycle/route.ts) — böylece bu modül saf ve test edilebilir
 * kalır. Admin SDK gerektirdiği için yalnızca sunucudan çağrılır.
 */

import { getSmsProvider } from '@/lib/messaging/providers/sms';
import { notifyUser } from '@/lib/notify-user';

export type OrgLifecycleKind = 'ngo_registration' | 'event' | 'volunteer';
export type OrgLifecycleStage = 'received' | 'approved';

interface LifecycleTemplate {
  /** notify-user / push için tip (bildirim merkezi kategorisi + APNs sesi). */
  notifType: string;
  /** Bildirim başlığı. */
  title: string;
  /** In-app bildirim gövdesi. `{name}` kurum/etkinlik/ilan adıyla değişir. */
  body: string;
  /** Kurumsal numaraya gidecek SMS metni. `{name}` aynı şekilde değişir. */
  sms: string;
}

/**
 * Tüm metinler kurumsal (siz/iniz) dilinde. `{name}` placeholder'ı
 * dispatch sırasında ilgili kurum/etkinlik/ilan adıyla değiştirilir.
 */
const TEMPLATES: Record<`${OrgLifecycleKind}:${OrgLifecycleStage}`, LifecycleTemplate> = {
  'ngo_registration:received': {
    notifType: 'org_registration_received',
    title: 'Kaydınızı aldık',
    body: 'Merhaba {name}, hangel kurumsal kaydınızı aldık. Başvurunuz inceleme sürecinde; onaylandığında size haber vereceğiz.',
    sms: 'Merhaba {name}, hangel kurumsal kaydınızı aldık. Başvurunuz inceleme sürecinde; onaylandığında size haber vereceğiz. #wearehangel',
  },
  'ngo_registration:approved': {
    notifType: 'org_registration_approved',
    title: 'Kaydınız onaylandı',
    body: 'Tebrikler {name}! hangel kaydınız onaylandı ve profiliniz yayında. Yönetim panelinize giriş yaparak kurumunuzu yönetmeye başlayabilirsiniz.',
    sms: 'Tebrikler {name}! hangel kaydınız onaylandı ve profiliniz yayında. Yönetim panelinizden kurumunuzu yönetmeye başlayabilirsiniz. #wearehangel',
  },
  'event:received': {
    notifType: 'event_received',
    title: 'Etkinlik kaydınız alındı',
    body: '"{name}" etkinliğinizin kaydını aldık. Etkinliğiniz inceleme sürecinde; onaylandığında size haber vereceğiz.',
    sms: '"{name}" etkinliğinizin kaydini aldik. Etkinliginiz inceleme surecinde; onaylandiginda size haber verecegiz. #wearehangel',
  },
  'event:approved': {
    notifType: 'event_approved',
    title: 'Etkinliğiniz onaylandı ve yayında',
    body: 'Tebrikler! "{name}" etkinliğiniz onaylandı ve yayında. Artık sosyal medya hesaplarınızda paylaşabilirsiniz.',
    sms: 'Tebrikler! "{name}" etkinliginiz onaylandi ve yayinda. Artik sosyal medya hesaplarinizda paylasabilirsiniz. #wearehangel',
  },
  'volunteer:received': {
    notifType: 'volunteer_received',
    title: 'Gönüllülük ilanınızın kaydı alındı',
    body: '"{name}" gönüllülük ilanınızın kaydını aldık. İlanınız inceleme sürecinde; onaylandığında size haber vereceğiz.',
    sms: '"{name}" gonullu ilaninizin kaydini aldik. Ilaniniz inceleme surecinde; onaylandiginda size haber verecegiz. #wearehangel',
  },
  'volunteer:approved': {
    notifType: 'volunteer_approved',
    title: 'Gönüllülük ilanınız onaylandı ve yayında',
    body: 'Tebrikler! "{name}" gönüllülük ilanınız onaylandı ve yayında. Artık sosyal medya hesaplarınızda paylaşabilirsiniz.',
    sms: 'Tebrikler! "{name}" gonullu ilaniniz onaylandi ve yayinda. Artik sosyal medya hesaplarinizda paylasabilirsiniz. #wearehangel',
  },
};

/**
 * Kurumsal telefonu E.164'e çevir. Mobil/sabit hat fark etmeksizin
 * `phoneCountryCode` (+90 vb.) + yerel numarayı birleştirir.
 * Çözümlenemezse null döner (SMS atlanır).
 */
export function resolveCorporatePhone(
  phone: string | null | undefined,
  countryCode: string | null | undefined,
): string | null {
  const raw = (phone ?? '').trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (raw.startsWith('+')) return `+${digits}`;
  const cc = (countryCode ?? '+90').replace(/\D/g, '') || '90';
  const local = digits.replace(/^0+/, '');
  if (!local) return null;
  // Yerel numara zaten ülke koduyla başlıyorsa tekrar ekleme.
  if (local.startsWith(cc) && local.length > cc.length + 5) return `+${local}`;
  return `+${cc}${local}`;
}

export interface DispatchOrgLifecycleArgs {
  kind: OrgLifecycleKind;
  stage: OrgLifecycleStage;
  /** Kurum/etkinlik/ilan görünen adı (metinlerde {name}). */
  name: string;
  /** Bildirim yazılacak alıcı uid'leri (kurum entity id + yönetici uid). */
  recipientUserIds: string[];
  /** Kurumsal telefon (E.164). null ise SMS atlanır. */
  phoneE164: string | null;
  /** Bildirime tıklanınca açılacak panel linki. */
  link?: string;
}

export interface DispatchOrgLifecycleResult {
  ok: boolean;
  notified: number;
  smsSent: boolean;
  smsError?: string;
}

const SMS_SENDER_ID = 'HANGEL';

/**
 * Yaşam döngüsü bildirimini dağıt: tüm alıcılara in-app bildirim (+push) +
 * kurumsal numaraya transactional SMS. SMS best-effort'tur; başarısız olsa da
 * bildirimler yazılır (sonuç içinde raporlanır).
 */
export async function dispatchOrgLifecycle(
  args: DispatchOrgLifecycleArgs,
): Promise<DispatchOrgLifecycleResult> {
  const { kind, stage, name, recipientUserIds, phoneE164, link } = args;
  const tpl = TEMPLATES[`${kind}:${stage}`];
  if (!tpl) {
    return { ok: false, notified: 0, smsSent: false, smsError: 'unknown template' };
  }

  const safeName = (name || '').trim() || 'Kurumunuz';
  const title = tpl.title;
  const body = tpl.body.replace(/\{name\}/g, safeName);
  const smsText = tpl.sms.replace(/\{name\}/g, safeName);

  // 1) In-app bildirim (+push) — her benzersiz alıcıya.
  const uniqueIds = Array.from(new Set(recipientUserIds.filter(Boolean)));
  const notifResults = await Promise.allSettled(
    uniqueIds.map((userId) =>
      notifyUser({
        userId,
        type: tpl.notifType,
        title,
        body,
        ...(link ? { link, data: { link } } : {}),
        storeAsMessage: true,
        messageSubject: title,
        messageContent: body,
      }),
    ),
  );
  const notified = notifResults.filter(
    (r) => r.status === 'fulfilled' && r.value.ok,
  ).length;

  // 2) Kurumsal numaraya transactional SMS (best-effort).
  let smsSent = false;
  let smsError: string | undefined;
  if (phoneE164) {
    try {
      const provider = getSmsProvider();
      const res = await provider.send({
        to: phoneE164,
        body: smsText,
        senderId: SMS_SENDER_ID,
        useCase: 'transactional',
      });
      smsSent = res.ok;
      if (!res.ok) smsError = res.errorMessage || res.errorCode || 'sms failed';
    } catch (e) {
      smsError = e instanceof Error ? e.message : String(e);
    }
  } else {
    smsError = 'no phone';
  }

  return { ok: notified > 0, notified, smsSent, smsError };
}

export { TEMPLATES as ORG_LIFECYCLE_TEMPLATES };
