/**
 * Konferans sunumu — paylaşılan slayt tipleri + varsayılan içerik.
 *
 * Sunum (/gelir-modeli-konferanslari/sunum) ve süper-admin editörü
 * (/super-admin/conference-deck) bu modülü paylaşır. Slaytlar Firestore'da
 * `siteSettings/conferenceDeck` doc'unda `slides` alanında saklanır; yoksa
 * DEFAULT_SLIDES kullanılır. Böylece sunum kod değişikliği olmadan düzenlenebilir.
 */

export type Slide =
  | { kind: 'title'; eyebrow: string; title: string; sub: string }
  | { kind: 'section'; num: string; name: string }
  | { kind: 'body'; eyebrow?: string; title: string; lines: string[] }
  // row: true → rakamlar tek yatay satırda (mobilde de yan yana).
  | { kind: 'stats'; title: string; intro?: string; stats: { big: string; label: string }[]; foot?: string; row?: boolean }
  // reveal: true → başlık önce gelir, maddeler bir sonraki tıklamada açılır.
  | { kind: 'list'; title: string; intro?: string; items: string[]; foot?: string; reveal?: boolean }
  | { kind: 'flow'; title: string; intro?: string; steps: string[] }
  // highlight: en vurucu bulgu / örneklem; source: kaynak linki (en altta).
  | { kind: 'research'; n: number; paper: string; year: string; authors: string[]; unis: string[]; finding: string[]; highlight?: string; source?: string }
  // qr: verilen URL'in QR kodu gösterilir (yoksa Kayıt Ol butonu).
  | { kind: 'closing'; title: string; lines: string[]; qr?: string }
  | { kind: 'thanks'; title: string; sub?: string; qr?: string };

export type SlideKind = Slide['kind'];

export const DECK_ID = 'gelir-modeli-konferanslari';
// Firestore konumu: siteSettings public-read + super-admin-write (yeni rule gerekmez).
export const DECK_COLLECTION = 'siteSettings';
export const DECK_DOC = 'conferenceDeck';
// Kapanış/teşekkür QR'ının yönlendireceği hangel sayfası.
export const DECK_QR_URL = 'https://hangel.org.tr/gelir-modeli-konferanslari';

export const SLIDE_KIND_LABEL: Record<SlideKind, string> = {
  title: 'Başlık',
  section: 'Bölüm Geçişi',
  body: 'Metin',
  stats: 'Rakamlar',
  list: 'Liste',
  flow: 'Akış Şeması',
  research: 'Akademik Araştırma',
  closing: 'Kapanış',
  thanks: 'Teşekkürler',
};

export const DEFAULT_SLIDES: Slide[] = [
  { kind: 'title', eyebrow: 'Sivil Toplum Kuruluşlarında', title: 'Gelir Modeli\nOluşturma ve\nSürdürülebilirlik', sub: 'Sosyal Etki İçin Yeni Nesil Modeller' },

  { kind: 'section', num: '01', name: 'Social Business Global' },
  { kind: 'body', eyebrow: 'Social Business Global', title: 'Sosyal etki odaklı\nbir yapı', lines: ['Sosyal sorunlara girişimcilik bakışıyla, sosyal inovasyonla; yenilikçi ve kalıcı çözümler üretmek amacıyla çalışmalar yürütüyoruz.'] },
  { kind: 'stats', title: 'Uluslararası Sosyal Girişimcilik Çalıştayları', intro: 'Her yıl farklı şehirlerde, 20 farklı ülkeden katılımcı bir araya geliyor.', stats: [{ big: '54', label: 'farklı ülkeden katılımcı ağı' }, { big: '639', label: 'sürdürülebilir etki girişimcisi incelendi' }, { big: '20', label: 'ülkeden her yıl katılım' }], foot: 'Amaç: Dünyadaki başarılı sosyal girişim modellerini inceleyip Türkiye’ye uyarlanabilir modeller geliştirmek.' },
  { kind: 'stats', title: 'Sosyal Girişimcilik Eğitimleri ve Konferanslar', stats: [{ big: '29', label: 'farklı üniversite' }, { big: '161', label: 'konferans' }, { big: '300+', label: 'eğitim ve konferans' }], foot: '18 belediye · 12 ticaret odası · onlarca lise iş birliğiyle.', row: true },
  { kind: 'list', title: 'Sosyal Girişimcilik Kanun Teklifi', intro: 'TBMM’ye sunulmak üzere hazırladık. Mevzuata sahip 16 ülkeyi inceledik; Ticaret Kanunu’nda değişiklik öngören 29 maddelik teklif.', items: ['Sosyal girişimlerin hukuki tanımı', 'Sosyal fayda ölçümü', 'Kamu destek mekanizmaları', 'Denetim ve sürdürülebilirlik modelleri'], foot: '16 ülke incelendi · 29 madde · TBMM’ye sunulmak üzere.' },
  { kind: 'flow', title: 'Gönüllülük Temelli İstihdam Protokolü', intro: 'Gönüllülük deneyimlerinin iş dünyasında görünür hale gelmesi.', steps: ['STK deneyimi', 'Yetkinlik kazanımı', 'İş başvurularında değerlendirme', 'Sosyal katkı odaklı istihdam'] },
  { kind: 'list', title: 'STK Gelir Modeli Oluşturma Konferansları', intro: 'Amaç: STK’ların tek kaynağa bağımlılığını azaltmak ve profesyonel, sürdürülebilir yapılar kurmak.', items: ['Tek kaynağa bağımlılığı azaltmak', 'Gelir çeşitliliği oluşturmak', 'Profesyonel ve sürdürülebilir yapılar kurmak'], foot: 'Türkiye’de 100.967 dernek · 6.680 vakıf · 22.566 spor kulübü.' },

  { kind: 'section', num: '02', name: 'STK Problemi' },
  { kind: 'list', title: 'STK’ların Temel Problemi', intro: 'STK’lar sosyal fayda üretemediği için değil; sürdürülebilir gelir modeli ve profesyonel iş gücü oluşturamadığı için zorlanır. İki temel ihtiyaç:', items: ['Düzenli gelir', 'Profesyonel ekip'], reveal: true },

  { kind: 'section', num: '03', name: 'Akademik Araştırmalar' },
  { kind: 'research', n: 1, paper: 'Structural Embeddedness and the Liability of Newness among Nonprofit Organizations', year: '2004', authors: ['Mark A. Hager', 'Joseph Galaskiewicz', 'Jeff A. Larson'], unis: ['University of Arizona · ABD', 'Arizona State University · ABD'], finding: ['Yeni kurulan STK’ların kapanma riski daha yüksektir.', 'Gelir çeşitliliği ve kurumsal yapı, uzun ömürlülüğü artırır.'], highlight: 'En vurucu bulgu: STK’yı kapatan “yeni olmak” değil; bağışçı ve kurum ağına yeterince gömülü olamamak.', source: 'https://scholar.google.com/scholar?q=Structural+Embeddedness+and+the+Liability+of+Newness+among+Nonprofit+Organizations' },
  { kind: 'research', n: 2, paper: 'Financial Resilience, Income Dependence and Organisational Survival in UK Charities', year: '2021', authors: ['Elizabeth Green', 'Felix Ritchie', 'Peter Bradley', 'Glenn Parry'], unis: ['University of the West of England · İngiltere', 'University of Surrey · İngiltere'], finding: ['Risk, gelir azlığı değil — tek gelir kaynağına bağımlılıktır.'], highlight: 'En vurucu bulgu: Hayatta kalmanın anahtarı gelirin büyüklüğü değil, kaynakların çeşitliliği.', source: 'https://scholar.google.com/scholar?q=Financial+Resilience+Income+Dependence+and+Organisational+Survival+in+UK+Charities' },
  { kind: 'research', n: 3, paper: 'Simmer Down Now! A Study of Revenue Volatility and Dissolution in Nonprofit Organizations', year: '2023', authors: ['Duncan J. Mayer'], unis: ['Case Western Reserve University · ABD'], finding: ['Gelir dalgalanması arttıkça STK kapanma riski yükselir.'], highlight: 'En vurucu bulgu: Yüksek gelir bile dalgalanıyorsa korumaz — istikrar, miktardan önemli.', source: 'https://scholar.google.com/scholar?q=Simmer+Down+Now+Revenue+Volatility+and+Dissolution+in+Nonprofit+Organizations' },

  { kind: 'section', num: '04', name: 'Sosyal Girişimcilik' },
  { kind: 'body', title: 'Sosyal Girişimcilik\nNedir?', lines: ['Sosyal sorunlara girişimcilik bakışıyla, sosyal inovasyonla; yenilikçi ve kalıcı çözümler üretmektir.'] },
  { kind: 'flow', title: 'Sosyal Girişim Modeli', steps: ['Sorun', 'Yenilikçi çözüm', 'Ürün / Hizmet', 'Gelir modeli', 'Sürdürülebilir sosyal etki'] },
  { kind: 'list', title: 'Dünya ve Türkiye’den Örnekler', items: ['Muhammad Yunus — Grameen Bank', 'Askıda Ne Var', 'TOMS', 'WeWork', 'Ortimo'] },

  { kind: 'section', num: '05', name: 'Gelir Modelleri' },
  { kind: 'list', title: 'STK Gelir Modelleri', items: ['Bireysel bağış', 'Düzenli bağışçı sistemi', 'Kurumsal destek', 'Sponsorluk', 'Üyelik modeli', 'Hibe programları', 'Kamu destekleri', 'Danışmanlık', 'Eğitim programları', 'Sosyal girişim modeli'] },

  { kind: 'section', num: '06', name: 'Destek Ekosistemi' },
  { kind: 'list', title: 'Google Destekleri', intro: 'STK’lar için:', items: ['Google Workspace (kurumsal e-posta + Takvim + Dokümanlar)', 'Google Drive (100 TB bulut depolama alanı)', 'Google Meet (sınırsız çevrimiçi toplantı)', 'Google Ad Grants (ayda 10.000 USD ücretsiz reklam)'], foot: 'Dijital kapasiteyi ücretsiz büyütme imkânı.' },
  { kind: 'list', title: 'Canva Destekleri', intro: 'STK’lar için:', items: ['Canva Pro (tüm premium tasarım özellikleri)', 'Tasarım Araçları (afiş, broşür, kart)', 'Sunum Hazırlama (hazır şablonlar)', 'Sosyal Medya (post + story setleri)'], foot: 'STK başına belirli sürelerle ücretsiz kullanım.' },
  { kind: 'list', title: 'Microsoft Destekleri', intro: 'STK’lar için:', items: ['Microsoft 365 (Word, Excel, PowerPoint, Outlook)', 'Teams (toplantı + ekip iletişimi)', 'Kurumsal Yazılımlar (uygunluğa göre)'], foot: 'Uygunluk kriterlerine göre ücretsiz veya indirimli.' },
  { kind: 'list', title: 'hangel', intro: 'STK’lar için sosyal ticaret ve gönüllülük platformu:', items: ['Alışverişle Bağış (destekçilerin alışverişi düzenli gelire döner)', 'Gönüllülük Yönetimi (ilan, başvuru, katılım, sertifika)', 'STK Paneli (bağış, üye, etkinlik, reklam, mesaj tek yerde)', 'Şeffaflık Endeksi (bağışçı güvenini artırır)'], foot: 'Kullanıcı → marka alışverişi → STK desteği → sosyal etki.' },
  { kind: 'body', title: 'AbilityPool', lines: ['STK’ların gönüllülük ilanı açabildiği, kurumsal şirket çalışanlarının gönüllülük yaparak sosyal projelere katılabildiği dijital platform.', 'Amaç: Yeteneği sosyal faydaya dönüştürmek.'] },
  { kind: 'body', title: 'HelpSteps', lines: ['Günlük hareketleri sosyal faydaya dönüştüren dijital sosyal etki modeli.'] },

  { kind: 'closing', title: 'Geleceğin\nSTK Modeli', lines: ['Sadece bağış bekleyen değil;', 'gelir üreten, teknoloji kullanan ve sürdürülebilir etki oluşturan STK’lar.'], qr: DECK_QR_URL },
  { kind: 'thanks', title: 'Teşekkürler', sub: 'hangel · Birlikte sürdürülebilir sosyal etki', qr: DECK_QR_URL },
];

/** Firestore'dan gelen ham veriyi güvenli Slide[]'a çevir (yoksa default). */
export function normalizeSlides(raw: unknown): Slide[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SLIDES;
  const valid = raw.filter((s): s is Slide =>
    !!s && typeof s === 'object' && typeof (s as { kind?: unknown }).kind === 'string',
  );
  return valid.length > 0 ? valid : DEFAULT_SLIDES;
}
