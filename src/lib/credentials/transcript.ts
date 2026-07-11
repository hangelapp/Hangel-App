/**
 * Sosyal Etki Transkripti — Doğrulanabilir Kimlik Bilgisi (Verifiable Credential)
 * üreteci.
 *
 * YENİ, bağımsız modül. Paylaşılan dosyalara (types.ts, volunteering/*,
 * passport/*, ngo-admin/*, nav/app-shell/layout) DOKUNMAZ. Tipler burada
 * yerel olarak tanımlıdır.
 *
 * Amaç: Bir gönüllünün onaylı tamamlamalarından ("volunteerCompletions")
 * Open Badges 3.0 / W3C Verifiable Credentials (VC) uyumlu birer kimlik
 * bilgisi (credential) objesi üretmek. ŞİMDİLİK KRİPTO-İMZA YOK: `proof: null`.
 * Gerçek imza (did:web / Sertifier) entegrasyonu SONRA takılacak; bu modülün
 * şekli imzaya hazır tasarlandı (yalnızca `proof` alanı doldurulacak).
 *
 * Referans:
 *  - Open Badges 3.0: https://www.imsglobal.org/spec/ob/v3p0
 *  - W3C VC Data Model 2.0: https://www.w3.org/TR/vc-data-model-2.0/
 *  - Europass EDCI (temel alanlar).
 *  - BM Sürdürülebilir Kalkınma Amaçları (SDG 1–17).
 */

// ---------------------------------------------------------------------------
// Girdi shape'i — types.ts'teki `VolunteerCompletion`'ın GEVŞEK, salt-okunur
// projeksiyonu. types.ts'e DOKUNMAMAK için burada yeniden bildirildi; tüm
// timestamp alanları Firestore round-trip'inin döndürdüğü ham objeye bırakıldı.
// ---------------------------------------------------------------------------

export type CompletionInput = {
  id: string;
  userId?: string;
  taskId?: string;
  ngoId?: string;
  /** Görev/ilan başlığı (join ile doldurulur; yoksa taskId'e düşer). */
  taskTitle?: string;
  /** Görevin sosyal alanı (SDG eşlemesi için). */
  socialArea?: string;
  /** Görevden snapshot'lanmış beceriler (varsa). */
  skills?: string[];
  hoursLogged?: number;
  /** STK admin saat düzeltmesi — varsa gerçek saat budur. */
  adjustedHours?: number;
  professionLabel?: string;
  impactValueTRY?: number;
  ngoApproved?: boolean;
  completedAt?: { seconds: number; nanoseconds: number } | null;
  approvedAt?: { seconds: number; nanoseconds: number } | null;
  notes?: string;
};

/** Kimlik bilgisini üretirken kullanılacak veren (issuer) meta bilgisi. */
export type IssuerInfo = {
  /** hangel STK profili / sitesi kimliği. did:web sonra buraya gelir. */
  id: string;
  name: string;
  url?: string;
};

// ---------------------------------------------------------------------------
// SDG (Sürdürülebilir Kalkınma Amaçları) — numara → TR etiket + tema rengi.
// Renkler resmî BM SDG palet kodlarıdır (UI'da karne için kullanılır).
// ---------------------------------------------------------------------------

export type SdgMeta = { no: number; label: string; color: string };

export const SDG_META: Record<number, SdgMeta> = {
  1: { no: 1, label: 'Yoksulluğa Son', color: '#E5243B' },
  2: { no: 2, label: 'Açlığa Son', color: '#DDA63A' },
  3: { no: 3, label: 'Sağlık ve Kaliteli Yaşam', color: '#4C9F38' },
  4: { no: 4, label: 'Nitelikli Eğitim', color: '#C5192D' },
  5: { no: 5, label: 'Toplumsal Cinsiyet Eşitliği', color: '#FF3A21' },
  6: { no: 6, label: 'Temiz Su ve Sıhhi Koşullar', color: '#26BDE2' },
  7: { no: 7, label: 'Erişilebilir ve Temiz Enerji', color: '#FCC30B' },
  8: { no: 8, label: 'İnsana Yakışır İş ve Ekonomik Büyüme', color: '#A21942' },
  9: { no: 9, label: 'Sanayi, Yenilikçilik ve Altyapı', color: '#FD6925' },
  10: { no: 10, label: 'Eşitsizliklerin Azaltılması', color: '#DD1367' },
  11: { no: 11, label: 'Sürdürülebilir Şehirler ve Topluluklar', color: '#FD9D24' },
  12: { no: 12, label: 'Sorumlu Üretim ve Tüketim', color: '#BF8B2E' },
  13: { no: 13, label: 'İklim Eylemi', color: '#3F7E44' },
  14: { no: 14, label: 'Sudaki Yaşam', color: '#0A97D9' },
  15: { no: 15, label: 'Karasal Yaşam', color: '#56C02B' },
  16: { no: 16, label: 'Barış, Adalet ve Güçlü Kurumlar', color: '#00689D' },
  17: { no: 17, label: 'Amaçlar için Ortaklıklar', color: '#19486A' },
};

/**
 * Sosyal alan (socialArea) → ilgili SDG numaraları.
 *
 * Anahtarlar, ngo-admin listing-form'daki kanonik SOCIAL_AREAS listesiyle
 * uyumludur. Eşleme normalize edilmiş (TR-küçük, boşluksuz) anahtar üzerinden
 * yapılır, böylece "Afet & Acil Yardım" ↔ "afet&acilyardım" gibi ufak
 * farklılıklar tolere edilir. Bir alan birden çok SDG'ye dokunabilir.
 */
const SOCIAL_AREA_TO_SDG: Record<string, number[]> = {
  egitim: [4],
  saglik: [3],
  cevre: [13, 15],
  hayvanhaklari: [15],
  'afet&acilyardim': [11],
  afetacilyardim: [11],
  sosyalyardim: [1, 10],
  'kultur&sanat': [4],
  kultursanat: [4],
  spor: [3],
  insanhaklari: [16],
  teknoloji: [9],
  'gida&beslenme': [2],
  gidabeslenme: [2],
  yaslibakimi: [3, 10],
  cocuk: [4, 3],
  kadin: [5],
  'multeci&goc': [10, 16],
  multecigoc: [10, 16],
  engellihaklari: [10],
  toplumsalcinsiyet: [5],
  genel: [17],
};

/**
 * TR-güvenli normalize: diakritikleri sadeleştirir, küçültür, boşluk/noktalama
 * atar. Eşleme anahtarlarıyla karşılaştırma için kullanılır.
 */
function normalizeArea(raw: string): string {
  return raw
    .toLocaleLowerCase('tr')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[\s\-_.]/g, '');
}

/**
 * Bir sosyal alandan ilgili SDG numaralarını çözer. Bilinmeyen alanlar için
 * "Amaçlar için Ortaklıklar" (17) döner ki karne asla boş kalmasın.
 */
export function sdgsForSocialArea(socialArea: string | undefined | null): number[] {
  if (!socialArea) return [17];
  const key = normalizeArea(socialArea);
  return SOCIAL_AREA_TO_SDG[key] ?? [17];
}

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

/** Tamamlamanın gerçek (etkin) saati: STK düzeltmesi öncelikli. */
export function effectiveHours(c: CompletionInput): number {
  const h = c.adjustedHours !== undefined ? c.adjustedHours : c.hoursLogged;
  const n = typeof h === 'number' ? h : Number(h);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Firestore Timestamp benzeri objeyi ISO tarihe çevirir (yoksa şimdi). */
function toIso(ts: { seconds: number; nanoseconds: number } | null | undefined): string {
  if (ts && typeof ts.seconds === 'number') {
    return new Date(ts.seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

/** Beceri adlarını benzersizleştirip ESCO uyumlu skill objelerine sarar. */
function toSkillObjects(names: string[] | undefined): { esco?: string; name: string }[] {
  if (!Array.isArray(names)) return [];
  const seen = new Set<string>();
  const out: { esco?: string; name: string }[] = [];
  for (const raw of names) {
    const name = (raw ?? '').trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase('tr');
    if (seen.has(key)) continue;
    seen.add(key);
    // ESCO id opsiyonel/boş — beceri adını taşıyoruz, id sonra eşlenir.
    out.push({ name });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Credential şekli — Open Badges 3.0 / VC uyumlu.
// ---------------------------------------------------------------------------

export type Achievement = {
  type: ['Achievement'];
  name: string;
  description: string;
  /** Başarı kriteri (nasıl kazanıldığı). */
  criteria: { narrative: string };
  /** Doğrulanmış gönüllülük saati. */
  hours: number;
  /** İlgili BM Sürdürülebilir Kalkınma Amaçları (1–17). */
  sdgs: number[];
  /** ESCO uyumlu beceriler (esco id opsiyonel). */
  skills: { esco?: string; name: string }[];
  /** Europass EDCI temel alanları. */
  europass?: {
    activityType: string;
    workload: string;
    startDate?: string;
    endDate?: string;
    awardingBody: string;
  };
};

export type SocialImpactCredential = {
  '@context': string[];
  /** Credential kimliği — verify sayfası bununla eşler (URN, tamamlama id'si). */
  id: string;
  type: ['VerifiableCredential', 'OpenBadgeCredential'];
  issuer: { id: string; type: ['Profile']; name: string; url?: string };
  /** VC 2.0 `validFrom` ~ OB 3.0 `issuanceDate`. İkisi de yazılır. */
  issuanceDate: string;
  validFrom: string;
  credentialSubject: {
    id: string;
    type: ['AchievementSubject'];
    achievement: Achievement;
  };
  /** STUB: kripto-imza SONRA. did:web / Sertifier ile doldurulacak. */
  proof: null;
};

/** Credential id'sinden tamamlama id'sini çıkarır (verify sayfası için). */
export const CREDENTIAL_URN_PREFIX = 'urn:hangel:credential:';

export function credentialIdForCompletion(completionId: string): string {
  return `${CREDENTIAL_URN_PREFIX}${completionId}`;
}

export function completionIdFromCredentialId(credId: string): string {
  return credId.startsWith(CREDENTIAL_URN_PREFIX)
    ? credId.slice(CREDENTIAL_URN_PREFIX.length)
    : credId;
}

const DEFAULT_ISSUER: IssuerInfo = {
  id: 'https://hangel.org',
  name: 'hangel',
  url: 'https://hangel.org',
};

/**
 * SAF fonksiyon: tek bir onaylı tamamlamadan OB 3.0 / VC uyumlu credential
 * objesi üretir. `proof: null` (imza SONRA).
 */
export function buildCredential(
  c: CompletionInput,
  opts?: { issuer?: IssuerInfo; subjectName?: string },
): SocialImpactCredential {
  const issuer = opts?.issuer ?? DEFAULT_ISSUER;
  const hours = effectiveHours(c);
  const sdgs = sdgsForSocialArea(c.socialArea);
  const skills = toSkillObjects(c.skills);
  const title = (c.taskTitle || c.socialArea || 'Gönüllülük Görevi').trim();
  const issued = toIso(c.approvedAt ?? c.completedAt);
  const startedIso = c.completedAt ? toIso(c.completedAt) : undefined;

  const description =
    `${c.socialArea ? `${c.socialArea} alanında ` : ''}` +
    `gönüllülük görevini başarıyla tamamladı` +
    `${hours > 0 ? ` (${hours} saat)` : ''}.`;

  return {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: credentialIdForCompletion(c.id),
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: {
      id: issuer.id,
      type: ['Profile'],
      name: issuer.name,
      url: issuer.url,
    },
    issuanceDate: issued,
    validFrom: issued,
    credentialSubject: {
      id: c.userId ? `urn:hangel:user:${c.userId}` : 'urn:hangel:user:anonymous',
      type: ['AchievementSubject'],
      achievement: {
        type: ['Achievement'],
        name: title,
        description,
        criteria: {
          narrative:
            'hangel üzerinden yürütülen doğrulanmış gönüllülük görevinin, ' +
            'ilgili sivil toplum kuruluşu tarafından onaylanmasıyla kazanılmıştır.',
        },
        hours,
        sdgs,
        skills,
        europass: {
          activityType: 'Volunteering',
          workload: hours > 0 ? `${hours} saat` : 'Belirtilmemiş',
          startDate: startedIso,
          endDate: issued,
          awardingBody: issuer.name,
        },
      },
    },
    proof: null,
  };
}

/** Birden çok tamamlamadan credential listesi (yalnız onaylı ve saatli). */
export function buildCredentials(
  completions: CompletionInput[],
  opts?: { issuer?: IssuerInfo; subjectName?: string },
): SocialImpactCredential[] {
  return completions
    .filter((c) => c.ngoApproved === true)
    .map((c) => buildCredential(c, opts));
}

// ---------------------------------------------------------------------------
// Transkript özeti — UI (transcript sayfası) için türetilmiş toplu görünüm.
// ---------------------------------------------------------------------------

export type SdgTally = SdgMeta & { hours: number; count: number };

export type SkillTally = { name: string; count: number };

export type TranscriptSummary = {
  totalHours: number;
  totalCompletions: number;
  totalImpactTRY: number;
  /** SDG karnesi — her SDG'ye kaç saat + kaç görev (saat büyükten küçüğe). */
  sdgTally: SdgTally[];
  /** Beceri listesi — kaç görevde kullanıldığı (çoktan aza). */
  skillTally: SkillTally[];
  /** Her başarı satırı için üretilmiş credential + saat. */
  credentials: SocialImpactCredential[];
};

/**
 * SAF fonksiyon: onaylı tamamlamalardan transkript özeti çıkarır.
 * Sadece `ngoApproved === true` olan kayıtlar sayılır.
 */
export function buildTranscript(
  completions: CompletionInput[],
  opts?: { issuer?: IssuerInfo; subjectName?: string },
): TranscriptSummary {
  const approved = completions.filter((c) => c.ngoApproved === true);

  let totalHours = 0;
  let totalImpactTRY = 0;
  const sdgMap = new Map<number, SdgTally>();
  const skillMap = new Map<string, SkillTally>();

  for (const c of approved) {
    const hours = effectiveHours(c);
    totalHours += hours;
    const impact = typeof c.impactValueTRY === 'number' ? c.impactValueTRY : 0;
    totalImpactTRY += Number.isFinite(impact) ? impact : 0;

    // SDG karnesi — bu görevin saatini ilgili tüm SDG'lere dağıt (say).
    for (const no of sdgsForSocialArea(c.socialArea)) {
      const meta = SDG_META[no];
      if (!meta) continue;
      const entry = sdgMap.get(no);
      if (entry) {
        entry.hours += hours;
        entry.count += 1;
      } else {
        sdgMap.set(no, { ...meta, hours, count: 1 });
      }
    }

    // Beceri listesi.
    for (const s of toSkillObjects(c.skills)) {
      const key = s.name.toLocaleLowerCase('tr');
      const entry = skillMap.get(key);
      if (entry) entry.count += 1;
      else skillMap.set(key, { name: s.name, count: 1 });
    }
  }

  const sdgTally = Array.from(sdgMap.values()).sort(
    (a, b) => b.hours - a.hours || a.no - b.no,
  );
  const skillTally = Array.from(skillMap.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr'),
  );

  return {
    totalHours,
    totalCompletions: approved.length,
    totalImpactTRY,
    sdgTally,
    skillTally,
    credentials: buildCredentials(approved, opts),
  };
}
