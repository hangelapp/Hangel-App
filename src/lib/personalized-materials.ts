// Kuruma özel tanıtım materyalleri — sosyal alana göre söylem kütüphanesi.
// STK'nın socialArea'sına göre başlık + alt metin seçilir; materyaller kurumun
// logosu, profil QR'ı ve bu söylemlerle ÜRETİLİR (personalized-materials.tsx).

export type AreaSlogan = { headline: string; sub: string };

const AREA_SLOGANS: { keys: string[]; headline: string; sub: string }[] = [
  { keys: ['çevre', 'doğa', 'iklim', 'orman', 'deniz', 'geri dönüş', 'ekoloji', 'sürdürüleb'], headline: 'Alışverişin çevreye nefes olsun', sub: 'Her alışverişin bir fidan, bir damla su, bir temiz gelecek.' },
  { keys: ['sağlık', 'hasta', 'tıp', 'kan', 'engelsiz sağlık'], headline: 'Alışverişin bir şifa olsun', sub: 'Harcadığın her kuruş bir hastaya umut taşısın.' },
  { keys: ['çocuk', 'eğitim', 'öğrenci', 'okul', 'burs', 'genç'], headline: 'Alışverişin bir çocuğun geleceği olsun', sub: 'Her alışverişin bir öğrenciye kitap, umut ve fırsat.' },
  { keys: ['hayvan', 'sokak', 'barınak', 'pati', 'can dost'], headline: 'Alışverişin bir cana dokunsun', sub: 'Her alışverişin bir yuva, bir tabak mama, bir sıcak yürek.' },
  { keys: ['afet', 'deprem', 'acil', 'yardım', 'dayanışma'], headline: 'Alışverişin bir yaraya merhem olsun', sub: 'Her alışverişin afet bölgesine umut ve dayanışma taşısın.' },
  { keys: ['kadın', 'engelli', 'mülteci', 'göç', 'yaşlı', 'insan hak', 'eşitlik'], headline: 'Alışverişin bir hayata umut olsun', sub: 'Her alışverişin eşitliği ve dayanışmayı büyütsün.' },
  { keys: ['kültür', 'sanat', 'tarih', 'miras'], headline: 'Alışverişin kültürü yaşatsın', sub: 'Her alışverişin bir eseri, bir hikâyeyi geleceğe taşısın.' },
  { keys: ['gıda', 'açlık', 'beslenme', 'aşevi'], headline: 'Alışverişin bir sofraya bereket olsun', sub: 'Her alışverişin bir tabak sıcak yemek olsun.' },
  { keys: ['spor', 'gençlik'], headline: 'Alışverişin bir hayali sahaya taşısın', sub: 'Her alışverişin bir gence spor, disiplin ve umut.' },
];

export function areaSlogan(area?: string): AreaSlogan {
  const a = (area || '').toLocaleLowerCase('tr');
  for (const s of AREA_SLOGANS) {
    if (s.keys.some((k) => a.includes(k))) return { headline: s.headline, sub: s.sub };
  }
  return { headline: 'Alışverişin iyiliğe dönüşsün', sub: 'Sevdiğin markalardan alışveriş yap, bağış senin STK’na gelsin.' };
}

// Üretilecek materyal boyutları (px @ ~150dpi baskı kalitesi).
export type MaterialSpec = { key: string; title: string; w: number; h: number; kind: 'poster' | 'social' | 'card' };

export const PERSONALIZED_SPECS: MaterialSpec[] = [
  { key: 'poster-a4', title: 'Mağaza Posteri (A4)', w: 1240, h: 1754, kind: 'poster' },
  { key: 'sosyal-kare', title: 'Sosyal Medya Postu (Kare)', w: 1080, h: 1080, kind: 'social' },
  { key: 'kasa-a5', title: 'Kasa Önü Kart (A5)', w: 874, h: 1240, kind: 'card' },
];
