/**
 * hangel Sertifika Kodu — ULUSLARARASI, YAPISAL ve okunabilir doğrulama kodu.
 *
 * Biçim (tireli, kolay okunur/yazılır):
 *     H-{ÜLKE}-{ŞEHİR}-{TÜR}-{TARİH}-{BENZERSİZ}
 * Örnek:  H-90-07-1-2606-K9X
 *
 *   H        → hangel
 *   ÜLKE     → uluslararası arama kodu (Türkiye 90, ABD 1, Almanya 49, BK 44 …)
 *   ŞEHİR    → Türkiye plaka kodu (İstanbul 34, Ankara 06, Antalya 07 …); yurtdışı 00
 *   TÜR      → 1 = Etkinlik, 2 = Gönüllülük
 *   TARİH    → YYAA (yıl+ay): 2606 = Haziran 2026
 *   BENZERSİZ→ 2 karakter sertifikaya özel imza + 1 karakter sağlama (checksum)
 *
 * Kod hem gözle okunur (ülke/şehir/tür ayırt edilir) hem de programla çözülür
 * (decodeCertCode). Kısa link: https://hangel.org.tr/c/{KOD}
 * Saf TS (Firebase importu yok) — client (PDF) + server (API/route) ortak kullanır.
 */

const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford (I/L/O/U yok)

export const CERT_VERIFY_BASE = 'https://hangel.org.tr/c/';

export type CertKind = 'event' | 'volunteer';

// Türkiye plaka kodları (81 il) — şehir adı → plaka.
const TR_PLATES: Record<string, string> = {
  adana: '01', adiyaman: '02', afyonkarahisar: '03', afyon: '03', agri: '04', amasya: '05',
  ankara: '06', antalya: '07', artvin: '08', aydin: '09', balikesir: '10', bilecik: '11',
  bingol: '12', bitlis: '13', bolu: '14', burdur: '15', bursa: '16', canakkale: '17',
  cankiri: '18', corum: '19', denizli: '20', diyarbakir: '21', edirne: '22', elazig: '23',
  erzincan: '24', erzurum: '25', eskisehir: '26', gaziantep: '27', giresun: '28',
  gumushane: '29', hakkari: '30', hatay: '31', isparta: '32', mersin: '33', icel: '33',
  istanbul: '34', izmir: '35', kars: '36', kastamonu: '37', kayseri: '38', kirklareli: '39',
  kirsehir: '40', kocaeli: '41', konya: '42', kutahya: '43', malatya: '44', manisa: '45',
  kahramanmaras: '46', maras: '46', mardin: '47', mugla: '48', mus: '49', nevsehir: '50',
  nigde: '51', ordu: '52', rize: '53', sakarya: '54', samsun: '55', siirt: '56', sinop: '57',
  sivas: '58', tekirdag: '59', tokat: '60', trabzon: '61', tunceli: '62', sanliurfa: '63',
  urfa: '63', usak: '64', van: '65', yozgat: '66', zonguldak: '67', aksaray: '68',
  bayburt: '69', karaman: '70', kirikkale: '71', batman: '72', sirnak: '73', bartin: '74',
  ardahan: '75', igdir: '76', yalova: '77', karabuk: '78', kilis: '79', osmaniye: '80', duzce: '81',
};
const PLATE_TO_CITY: Record<string, string> = {
  '01': 'Adana', '02': 'Adıyaman', '03': 'Afyonkarahisar', '04': 'Ağrı', '05': 'Amasya',
  '06': 'Ankara', '07': 'Antalya', '08': 'Artvin', '09': 'Aydın', '10': 'Balıkesir',
  '11': 'Bilecik', '12': 'Bingöl', '13': 'Bitlis', '14': 'Bolu', '15': 'Burdur', '16': 'Bursa',
  '17': 'Çanakkale', '18': 'Çankırı', '19': 'Çorum', '20': 'Denizli', '21': 'Diyarbakır',
  '22': 'Edirne', '23': 'Elazığ', '24': 'Erzincan', '25': 'Erzurum', '26': 'Eskişehir',
  '27': 'Gaziantep', '28': 'Giresun', '29': 'Gümüşhane', '30': 'Hakkâri', '31': 'Hatay',
  '32': 'Isparta', '33': 'Mersin', '34': 'İstanbul', '35': 'İzmir', '36': 'Kars', '37': 'Kastamonu',
  '38': 'Kayseri', '39': 'Kırklareli', '40': 'Kırşehir', '41': 'Kocaeli', '42': 'Konya',
  '43': 'Kütahya', '44': 'Malatya', '45': 'Manisa', '46': 'Kahramanmaraş', '47': 'Mardin',
  '48': 'Muğla', '49': 'Muş', '50': 'Nevşehir', '51': 'Niğde', '52': 'Ordu', '53': 'Rize',
  '54': 'Sakarya', '55': 'Samsun', '56': 'Siirt', '57': 'Sinop', '58': 'Sivas', '59': 'Tekirdağ',
  '60': 'Tokat', '61': 'Trabzon', '62': 'Tunceli', '63': 'Şanlıurfa', '64': 'Uşak', '65': 'Van',
  '66': 'Yozgat', '67': 'Zonguldak', '68': 'Aksaray', '69': 'Bayburt', '70': 'Karaman',
  '71': 'Kırıkkale', '72': 'Batman', '73': 'Şırnak', '74': 'Bartın', '75': 'Ardahan', '76': 'Iğdır',
  '77': 'Yalova', '78': 'Karabük', '79': 'Kilis', '80': 'Osmaniye', '81': 'Düzce',
};
// Sık ülkeler — arama kodu → ülke adı.
const DIALING_TO_COUNTRY: Record<string, string> = {
  '90': 'Türkiye', '1': 'ABD/Kanada', '44': 'Birleşik Krallık', '49': 'Almanya', '33': 'Fransa',
  '39': 'İtalya', '34': 'İspanya', '31': 'Hollanda', '32': 'Belçika', '41': 'İsviçre', '43': 'Avusturya',
  '7': 'Rusya', '380': 'Ukrayna', '48': 'Polonya', '46': 'İsveç', '47': 'Norveç', '45': 'Danimarka',
  '358': 'Finlandiya', '30': 'Yunanistan', '40': 'Romanya', '36': 'Macaristan', '420': 'Çekya',
  '971': 'BAE', '966': 'S. Arabistan', '974': 'Katar', '965': 'Kuveyt', '973': 'Bahreyn', '968': 'Umman',
  '20': 'Mısır', '212': 'Fas', '216': 'Tunus', '213': 'Cezayir', '218': 'Libya', '964': 'Irak',
  '963': 'Suriye', '962': 'Ürdün', '961': 'Lübnan', '98': 'İran', '92': 'Pakistan', '91': 'Hindistan',
  '86': 'Çin', '81': 'Japonya', '82': 'G. Kore', '60': 'Malezya', '62': 'Endonezya', '994': 'Azerbaycan',
  '995': 'Gürcistan', '996': 'Kırgızistan', '998': 'Özbekistan', '992': 'Tacikistan', '993': 'Türkmenistan',
  '61': 'Avustralya', '64': 'Y. Zelanda', '55': 'Brezilya', '52': 'Meksika', '54': 'Arjantin',
  '27': 'G. Afrika', '234': 'Nijerya', '254': 'Kenya', '880': 'Bangladeş',
};

const onlyAZ09 = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .replace(/[^a-z]/g, '');

/** Şehir adı → Türkiye plaka kodu (bulunamazsa '00'). */
export function cityToPlate(cityName?: string | null): string {
  if (!cityName) return '00';
  return TR_PLATES[onlyAZ09(cityName)] || '00';
}

function hash2(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return B32[Math.floor(h / 32) % 32] + B32[h % 32];
}

function dateYYAA(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '0000';
  const yy = String(d.getFullYear() % 100).padStart(2, '0');
  const aa = String(d.getMonth() + 1).padStart(2, '0');
  return yy + aa;
}

export interface CertCodeInput {
  date: string;
  kind?: CertKind;
  idSeed?: string;
  country?: string; // arama kodu (varsayılan '90' = Türkiye)
  city?: string; // şehir adı (Türkiye plakası türetilir) VEYA 2 haneli plaka
}

function normCountry(c?: string): string {
  const v = (c || '90').replace(/[^0-9]/g, '');
  return v || '90';
}
function normCity(city?: string): string {
  if (!city) return '00';
  const raw = city.trim();
  if (/^\d{1,2}$/.test(raw)) return raw.padStart(2, '0'); // zaten plaka verilmiş
  return cityToPlate(raw);
}

/** Yapısal, okunabilir sertifika kodu üretir (tireli). */
export function buildCertCode(input: CertCodeInput): string {
  const country = normCountry(input.country);
  const city = normCity(input.city);
  const type = input.kind === 'volunteer' ? '2' : '1';
  const dt = dateYYAA(input.date);
  const uniq = hash2(input.idSeed || `${input.date}|${type}|${city}`);
  const core = `H-${country}-${city}-${type}-${dt}-${uniq}`;
  // checksum: core'daki tüm alfasayısal karakterlerin B32 indeks toplamı.
  let sum = 0;
  for (const ch of core.replace(/[^0-9A-Z]/gi, '').toUpperCase()) {
    const i = B32.indexOf(ch);
    sum += i < 0 ? 0 : i;
  }
  return core + B32[sum % 32];
}

export interface DecodedCertCode {
  valid: boolean;
  kind?: CertKind;
  country?: string; // arama kodu
  countryName?: string;
  city?: string; // plaka
  cityName?: string;
  date?: string; // "YYYY-MM"
}

/** Kodu çöz + checksum doğrula. */
export function decodeCertCode(raw: string): DecodedCertCode {
  const code = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
  const parts = code.split('-');
  if (parts.length !== 6 || parts[0] !== 'H') return { valid: false };
  const [, country, city, type, dt, lastRaw] = parts;
  if (lastRaw.length < 3) return { valid: false };
  const uniq = lastRaw.slice(0, 2);
  const chk = lastRaw.slice(2);
  const core = `H-${country}-${city}-${type}-${dt}-${uniq}`;
  let sum = 0;
  for (const ch of core.replace(/[^0-9A-Z]/gi, '').toUpperCase()) {
    const i = B32.indexOf(ch);
    sum += i < 0 ? 0 : i;
  }
  if (B32[sum % 32] !== chk) return { valid: false };
  if (!/^\d{1,3}$/.test(country) || !/^\d{2}$/.test(city) || !/^[12]$/.test(type) || !/^\d{4}$/.test(dt)) {
    return { valid: false };
  }
  const yy = 2000 + Number(dt.slice(0, 2));
  const mm = dt.slice(2, 4);
  return {
    valid: true,
    kind: type === '2' ? 'volunteer' : 'event',
    country,
    countryName: DIALING_TO_COUNTRY[country],
    city,
    cityName: city === '00' ? undefined : PLATE_TO_CITY[city],
    date: `${yy}-${mm}`,
  };
}

export function certVerifyUrl(code: string): string {
  return CERT_VERIFY_BASE + code;
}
