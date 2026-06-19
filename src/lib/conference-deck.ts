/**
 * Konferans sunumu — paylaşılan slayt tipleri + varsayılan içerik.
 *
 * Sunum (/gelir-modeli-konferanslari/sunum) ve süper-admin editörü
 * (/super-admin/conference-deck) bu modülü paylaşır. Slaytlar Firestore'da
 * `presentations/{DECK_ID}` doc'unda `slides` alanında saklanır; yoksa
 * DEFAULT_SLIDES kullanılır. Böylece sunum kod değişikliği olmadan düzenlenebilir.
 */

export type Slide =
  | { kind: 'title'; eyebrow: string; title: string; sub: string }
  | { kind: 'section'; num: string; name: string }
  | { kind: 'body'; eyebrow?: string; title: string; lines: string[] }
  | { kind: 'stats'; title: string; intro?: string; stats: { big: string; label: string }[]; foot?: string }
  | { kind: 'list'; title: string; intro?: string; items: string[]; foot?: string }
  | { kind: 'flow'; title: string; intro?: string; steps: string[] }
  | { kind: 'research'; n: number; paper: string; year: string; authors: string[]; unis: string[]; finding: string[] }
  | { kind: 'closing'; title: string; lines: string[] };

export type SlideKind = Slide['kind'];

export const DECK_ID = 'gelir-modeli-konferanslari';
// Firestore konumu: siteSettings public-read + super-admin-write (yeni rule gerekmez).
export const DECK_COLLECTION = 'siteSettings';
export const DECK_DOC = 'conferenceDeck';

export const SLIDE_KIND_LABEL: Record<SlideKind, string> = {
  title: 'Başlık',
  section: 'Bölüm Geçişi',
  body: 'Metin',
  stats: 'Rakamlar',
  list: 'Liste',
  flow: 'Akış Şeması',
  research: 'Akademik Araştırma',
  closing: 'Kapanış',
};

export const DEFAULT_SLIDES: Slide[] = [
  { kind: 'title', eyebrow: 'Sivil Toplum Kuruluşlarında', title: 'Gelir Modeli\nOluşturma ve\nSürdürülebilirlik', sub: 'Sosyal Etki İçin Yeni Nesil Modeller' },

  { kind: 'section', num: '01', name: 'Social Business Global' },
  { kind: 'body', eyebrow: 'Social Business Global', title: 'Sosyal etki odaklı\nbir yapı', lines: ['Sosyal sorunlara girişimcilik bakışıyla, sosyal inovasyonla; yenilikçi ve kalıcı çözümler üretmek amacıyla çalışmalar yürütüyoruz.'] },
  { kind: 'stats', title: 'Uluslararası Sosyal Girişimcilik Çalıştayları', intro: 'Her yıl farklı şehirlerde, 20 farklı ülkeden katılımcı bir araya geliyor.', stats: [{ big: '54', label: 'farklı ülkeden katılımcı ağı' }, { big: '639', label: 'sürdürülebilir etki girişimcisi incelendi' }, { big: '20', label: 'ülkeden her yıl katılım' }], foot: 'Amaç: Dünyadaki başarılı sosyal girişim modellerini inceleyip Türkiye’ye uyarlanabilir modeller geliştirmek.' },
  { kind: 'stats', title: 'Sosyal Girişimcilik Eğitimleri ve Konferanslar', stats: [{ big: '29', label: 'farklı üniversite' }, { big: '161', label: 'konferans' }, { big: '300+', label: 'eğitim ve konferans' }], foot: 'Belediye ve ticaret odaları iş birlikleriyle.' },
  { kind: 'list', title: 'Sosyal Girişimcilik Kanun Teklifi', intro: 'Türkiye’de sosyal girişimcilik ekosisteminin gelişmesi için hazırlanan çalışmalar:', items: ['Sosyal girişimlerin hukuki tanımı', 'Sosyal fayda ölçümü', 'Kamu destek mekanizmaları', 'Denetim ve sürdürülebilirlik modelleri'] },
  { kind: 'flow', title: 'Gönüllülük Temelli İstihdam Protokolü', intro: 'Gönüllülük deneyimlerinin iş dünyasında görünür hale gelmesi.', steps: ['STK deneyimi', 'Yetkinlik kazanımı', 'İş başvurularında değerlendirme', 'Sosyal katkı odaklı istihdam'] },
  { kind: 'list', title: 'STK Gelir Modeli Oluşturma Konferansları', intro: 'Amaç:', items: ['Tek kaynağa bağımlılığı azaltmak', 'Gelir çeşitliliği oluşturmak', 'Profesyonel ve sürdürülebilir yapılar kurmak'] },

  { kind: 'section', num: '02', name: 'STK Problemi' },
  { kind: 'list', title: 'STK’ların Temel Problemi', intro: 'STK’lar sosyal fayda üretemediği için değil; sürdürülebilir gelir modeli ve profesyonel iş gücü oluşturamadığı için zorlanır. İki temel ihtiyaç:', items: ['Düzenli gelir', 'Profesyonel ekip'] },

  { kind: 'section', num: '03', name: 'Akademik Araştırmalar' },
  { kind: 'research', n: 1, paper: 'Structural Embeddedness and the Liability of Newness among Nonprofit Organizations', year: '2004', authors: ['Mark A. Hager', 'Joseph Galaskiewicz', 'Jeff A. Larson'], unis: ['University of Arizona · ABD', 'Arizona State University · ABD'], finding: ['Yeni kurulan STK’ların kapanma riski daha yüksektir.', 'Gelir çeşitliliği ve kurumsal yapı, uzun ömürlülüğü artırır.'] },
  { kind: 'research', n: 2, paper: 'Financial Resilience, Income Dependence and Organisational Survival in UK Charities', year: '2021', authors: ['Elizabeth Green', 'Felix Ritchie', 'Peter Bradley', 'Glenn Parry'], unis: ['University of the West of England · İngiltere', 'University of Surrey · İngiltere'], finding: ['Risk, gelir azlığı değil — tek gelir kaynağına bağımlılıktır.'] },
  { kind: 'research', n: 3, paper: 'Simmer Down Now! A Study of Revenue Volatility and Dissolution in Nonprofit Organizations', year: '2023', authors: ['Duncan J. Mayer'], unis: ['Case Western Reserve University · ABD'], finding: ['Gelir dalgalanması arttıkça STK kapanma riski yükselir.'] },

  { kind: 'section', num: '04', name: 'Sosyal Girişimcilik' },
  { kind: 'body', title: 'Sosyal Girişimcilik\nNedir?', lines: ['Sosyal sorunlara girişimcilik bakışıyla, sosyal inovasyonla; yenilikçi ve kalıcı çözümler üretmektir.'] },
  { kind: 'flow', title: 'Sosyal Girişim Modeli', steps: ['Sorun', 'Yenilikçi çözüm', 'Ürün / Hizmet', 'Gelir modeli', 'Sürdürülebilir sosyal etki'] },
  { kind: 'list', title: 'Dünya ve Türkiye’den Örnekler', items: ['Muhammad Yunus — Grameen Bank', 'Askıda Ne Var', 'TOMS', 'WeWork', 'Ortimo'] },

  { kind: 'section', num: '05', name: 'Gelir Modelleri' },
  { kind: 'list', title: 'STK Gelir Modelleri', items: ['Bireysel bağış', 'Düzenli bağışçı sistemi', 'Kurumsal destek', 'Sponsorluk', 'Üyelik modeli', 'Hibe programları', 'Kamu destekleri', 'Danışmanlık', 'Eğitim programları', 'Sosyal girişim modeli'] },
  { kind: 'list', title: 'Sosyal Girişim: Ürün ve Hizmet Geliştirme', intro: 'STK’lar uzmanlık alanlarından gelir oluşturabilir:', items: ['Hizmet', 'Çözüm', 'Platform', 'Ürün'] },

  { kind: 'section', num: '06', name: 'Destek Ekosistemi' },
  { kind: 'list', title: 'Google Destekleri', intro: 'STK’lar için:', items: ['Google Workspace', 'Kurumsal e-posta altyapısı', 'Google Meet', '100 TB bulut depolama', 'Google Ads reklam desteği (10.000 USD/ay)'], foot: 'Dijital kapasiteyi artırma imkânı.' },
  { kind: 'list', title: 'Canva Destekleri', intro: 'STK’lar için:', items: ['Canva Pro', 'Tasarım araçları', 'Sunum hazırlama', 'Sosyal medya içerikleri'], foot: 'STK başına belirli sürelerle ücretsiz kullanım.' },
  { kind: 'list', title: 'Microsoft Destekleri', intro: 'STK’lar için:', items: ['Microsoft 365', 'Dijital çalışma araçları', 'Kurumsal yazılımlar'], foot: 'Uygunluk kriterlerine göre ücretsiz veya indirimli.' },
  { kind: 'flow', title: 'hangel', intro: 'Sosyal ticaret ve gönüllülük platformu.', steps: ['Kullanıcı', 'Marka alışverişi', 'Gelir oluşumu', 'STK desteği', 'Sosyal etki'] },
  { kind: 'body', title: 'AbilityPool', lines: ['STK’ların gönüllülük ilanı açabildiği, kurumsal şirket çalışanlarının gönüllülük yaparak sosyal projelere katılabildiği dijital platform.', 'Amaç: Yeteneği sosyal faydaya dönüştürmek.'] },
  { kind: 'body', title: 'HelpSteps', lines: ['Günlük hareketleri sosyal faydaya dönüştüren dijital sosyal etki modeli.'] },

  { kind: 'closing', title: 'Geleceğin\nSTK Modeli', lines: ['Sadece bağış bekleyen değil;', 'gelir üreten, teknoloji kullanan ve sürdürülebilir etki oluşturan STK’lar.'] },
];

/** Firestore'dan gelen ham veriyi güvenli Slide[]'a çevir (yoksa default). */
export function normalizeSlides(raw: unknown): Slide[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SLIDES;
  const valid = raw.filter((s): s is Slide =>
    !!s && typeof s === 'object' && typeof (s as { kind?: unknown }).kind === 'string',
  );
  return valid.length > 0 ? valid : DEFAULT_SLIDES;
}
