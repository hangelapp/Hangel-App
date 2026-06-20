export const meta = {
  name: 'learn-more-implement',
  description: 'Rewrite the 6 hangel Learn-More pages in Apple identity (coral-only) with accurate feature badges',
  phases: [{ title: 'Rewrite' }, { title: 'Polish' }, { title: 'Review' }],
}

const KIT_DOC = `
SHARED KIT — import from '@/components/marketing/apple-kit'. Use ONLY these for structure; do not invent a new design language.
Components:
- MarketingNav({ label, ctaLabel, ctaHref, backLabel? }) — fixed top bar (back-to-home + label + coral CTA). Render once at top.
- AppleSection({ eyebrow?, title, subtitle?, description?, badges?:[{kind,label?}], actions?:[{label,href,variant?:'primary'|'secondary'|'link',external?}], image?:{url,hint}, theme?:'light'|'dark', id?, compact?, children? }) — full-screen Apple slide (compact=padded section instead of min-h-screen). Use for hero + big statement slides. If you pass an image it renders a rounded framed image; if you pass children it renders them instead.
- SectionHeading({ eyebrow?, title, description?, theme? }) — centered heading block before a grid.
- FeatureGrid({ items:[{icon?,title,description,badge?:{kind,label?}}], columns?:2|3|4, theme? }) — feature cards; each card optional lucide icon + status badge.
- AppleBadge({ kind:'yeni'|'beta'|'yakinda'|'hangel', label? }) — standalone badge if needed.
- CompareNote({ children, theme? }) — tasteful "compare without naming competitors" callout.
Badge meaning (USE EXACTLY AS SPECIFIED PER FEATURE BELOW):
- kind 'yeni' = newly shipped & live.
- kind 'beta' = built but gated/in-testing (e.g. waiting credential/approval, partial UI).
- kind 'yakinda' = on the roadmap, labeled coming-soon in the admin panel (NOT yet usable).
- kind 'hangel' = "Sadece hangel'da" — a genuine differentiator vs typical platforms.
Lucide icons: import what you need from 'lucide-react' and pass as item.icon (the component, not JSX).
`

const RULES = `
GLOBAL DESIGN + CONTENT RULES (NON-NEGOTIABLE):
1. APPLE WEBSITE feel: huge bold headlines, calm confident copy, generous whitespace, full-screen alternating light/dark slides, then padded feature-grid sections. Smooth, premium, minimal.
2. SINGLE ACCENT COLOR = narçiçeği/coral (Tailwind 'text-primary' / 'bg-primary' / 'primary/10' etc. = #f34723). NO other accent color anywhere. No green/blue/red-destructive. Neutrals only: white, #1d1d1f, #f5f5f7, black (dark slaytlar). If the old page used a non-coral accent (e.g. destructive red), replace with coral.
3. ACCURACY IS PARAMOUNT. Describe each feature by WHAT IT ACTUALLY DOES (given below). Never claim a feature that is not in the provided list. Apply the EXACT badge given. Do NOT invent stats/percentages.
4. Tone: make the visitor HOPEFUL and EXCITED, but never hypey or dishonest. Audience-specific register (given per page).
5. Comparison WITHOUT naming competitors: where noted, add a CompareNote like "Dünyada benzer X platformları var; hangel'de bu, Türkiye'ye özel, ücretsiz ve tek panelde." Never name a real company as a competitor. Use AppleBadge kind 'hangel' (Sadece hangel'da) on the genuine differentiators listed.
6. Bilingual: build a TR content object and an EN content object; select with const C = (useTranslation().language === 'en') ? EN : TR. TR is primary and must be flawless Turkish Apple copy. EN is a faithful mirror. Keep "hangel" lowercase in all user-facing text. Never use the 🙏 icon.
7. Keep the page a 'use client' component. Keep MarketingNav at top and <PublicFooter currentPageLabel={...} /> at the bottom (import from '@/components/layout/public-footer'). Where the page used useWebPage CMS for the hero, keep it: const cms = useWebPage(SLUG); hero title/subtitle/description/image fall back to CMS then to content (cms.title || C.heroTitle, cms.heroImageUrl || C.heroImage).
8. Use real working hrefs (registration/onboarding links given per page). Keep existing route behavior.
9. VERIFY the file compiles: correct imports, no unused imports, valid JSX, no TypeScript errors. The page must pass eslint + tsc.
Return a concise report: sections built, badges used per feature, and anything you intentionally removed.
`

const pages = [
  {
    key: 'ngo',
    file: 'src/app/ngo-onboarding/page.tsx',
    slug: "'ngo-onboarding'",
    label: 'rewrite:stk',
    spec: `PAGE: /ngo-onboarding — AUDIENCE: STK yöneticileri (dernek/vakıf yöneticileri, kurucular). Tone: formal, profesyonel, operasyonel; "kurumunuz", "şeffaflık", "etki", "sürdürülebilir kaynak". Hopeful but credible. Register/onboard CTA href: '/login/selection?action=register&type=corporate&entity=NGO'. Apply CTA also '/login/selection?action=register&type=corporate&entity=NGO'.
LIVE features (describe accurately; badge as noted):
- Şeffaflık Endeksi — kurumun yasal belge/raporlarını yükleyerek 0–100 şeffaflık puanı kazanır, profilinde halka açık görünür. badge 'hangel'.
- hangel Bağışı (Alışverişle Bağış) — destekçilerin anlaşmalı markalardan alışverişi kuruma düzenli gelire döner; panelde marka/işlem/komisyon şeffaf takip. badge 'hangel'.
- Gönüllülük Yönetimi — yetenek bazlı ilan; gönüllüye otomatik % uyum eşleştirmesi; başvuru yönetimi. badge 'hangel'.
- Demografi Analizi — destekçi tabanının yaş/şehir/meslek/ilgi dağılımı canlı grafikler. (no badge)
- Mesajlaşma: SMS + E-posta gönderimi + Kontör Paketleri — segment/CSV alıcılara kotaya dayalı toplu SMS/mail; değişken kişiselleştirme. badge 'yeni'.
- Web Sitesi Yönetimi — kodsuz, markaya özel kurumsal web sitesi; ücretsiz veya özel alan adı. (no badge)
- Etkinlik Yönetimi — fiziksel/online etkinlik oluştur, kayıt/RSVP, yaka kartı, katılımcı yönetimi. badge 'yeni'.
- Etki Hikayesi — proje/etki anlatısı yayınla, hangel akışında görünür. (no badge)
- Gelen Kutusu & Destekçi Mesajlaşma — destekçilerle iki yönlü yazışma. (no badge)
- Topluluğunu Davet Et — cihaz rehberinden kişi içe aktar (native), toplu davet. (no badge)
- Yetkili Yönetimi — ekip üyelerine kapsam bazlı roller (Genel Yönetici, Gönüllü Koordinatörü, Mali İşler…). (no badge)
- STK Profil QR + Gönderiler (feed) + Bildirim Merkezi — (group, no badge).
- Reklam Yönetimi (Google/Meta/TikTok + Google Ad Grants) — STK için reklam kurulum sihirbazı; AI reklam metni/landing önerisi. ŞU AN onay/kredential bekliyor. badge 'beta'.
YAKINDA (yönetim panelinde "yakında" etiketli; kullanılamıyor henüz) — bir grid'de göster, hepsi badge 'yakinda': CRM Entegrasyonu, Ön Muhasebe Entegrasyonu, POS & Ödeme Sistemleri, Online Eğitim & Toplantı, Tasarım Programları, Hibeler & Fonlar, Pazarlama İletişimi, Web Analiz Araçları.
REMOVE (gündem dışı/temelsiz — koyma): "%40 müşteri artışı" gibi uydurma istatistikler; tamamen spekülatif stub'lar (Sanal Santral, Sanal & Fiziki Ofis, HR Entegrasyonu) — bunları yazma.
CompareNote: şeffaflık endeksi + alışverişle bağış için isim vermeden "global ölçekte ücretli/parçalı; hangel'de Türkiye'ye özel, ücretsiz, tek panelde" tonu.
Suggested flow: Hero (eyebrow 'hangel STK', büyük umut veren başlık, 'Ücretsiz Başvur' primary + 'Daha Fazla' link) → light/dark statement slaytları (Şeffaflık, hangel Bağışı, Gönüllülük) → FeatureGrid "Tek panelde her şey" (live araçlar, rozetleriyle) → "Yakında" FeatureGrid → CompareNote → final CTA slaytı (Dijital dönüşümü bugün başlatın).`,
  },
  {
    key: 'merchant',
    file: 'src/app/merchant/page.tsx',
    slug: "'merchant'",
    label: 'rewrite:marka',
    spec: `PAGE: /merchant — AUDIENCE: markalar/işletmeler (ticari + sosyal şirket). Tone: net, sonuç-odaklı, sakin güven; "markanız", "müşteri", "şeffaf komisyon", "etki". Register CTA href: '/login/selection?action=register&type=corporate&entity=BRAND'.
LIVE:
- Alışverişle Bağış & Kazanç Takibi — markadan yapılan alışveriş seçilen STK'ya bağışa döner; marka panelde oluşan bağış hacmini ve şeffaf komisyonu görür. badge 'hangel'.
- Marka Paneli (Dashboard) — tek panelde profil, iletişim, finans, destek. (no badge)
- Markalı QR Kod Üretici — merkezde hangel logolu QR (256–2048px, SVG/PNG). (no badge)
- Ürün Feed / PIM — GelirOrtakları Go Feed veya Google Merchant XML'den ürün kataloğu içe aktarımı; ürünler hangel pazarında listelenir. badge 'yeni'.
- Market Listeleme — marka hangel pazarında kategoriye göre listelenir, bağış oranıyla. (no badge)
- Demografi Analizi + Yetkili Yönetimi — (group, no badge).
GATED (beta):
- QR ile Temassız Ödeme (kasada QR ile ödeme + STK seçimi) — altyapı var, marka self-servis arayüzü yolda. badge 'beta'.
- Sürdürülebilirlik & KSS Raporları (ESG yayını) — badge 'beta'.
YAKINDA: Sadakat Programı (puan/kademe/ödül) — yapı kuruluyor. badge 'yakinda'. (Eski "%40 müşteri sadakati" istatistiğini KOYMA; sadakati dürüstçe "bilinçli tüketicinin tercihi olmak" diye anlat.)
REMOVE: uydurma %40 istatistiği; self-servis merchant QR onboarding iddiası (beta olarak işaretle, "var" deme).
CompareNote: alışverişle bağış + şeffaf komisyon için isim vermeden kıyas.
Flow: Hero ("Her satış, bir iyilik." veya benzeri) → dark/light statement slaytlar (Alışverişle bağış; Şeffaf komisyon & panel; Ürün feed YENİ) → FeatureGrid canlı araçlar → "Yakında/Beta" notu → CompareNote → final CTA.`,
  },
  {
    key: 'campus',
    file: 'src/app/campus-advantages/page.tsx',
    slug: "'campus-advantages'",
    label: 'rewrite:kulup',
    spec: `PAGE: /campus-advantages — AUDIENCE: üniversite/lise KULÜP başkanları & yöneticileri (genç, hevesli, kampüs). Tone: enerjik, ilham veren ama DÜRÜST; "kulübünüz", "üyeleriniz", "kampüs", "etki". Register CTA href: '/login/selection?action=register&type=corporate&entity=CLUB'.
LIVE (sayfayı bunların ETRAFINDA kur — gerçek değerler):
- Dijital Yönetim Paneli — profil, üyeler, QR, gelen kutusu, bildirim, gönderiler, etki hikayesi tek panelde. (no badge)
- Sosyal Etki Karnesi / Etki Hikayemiz — 7 slaytlık karne (üye sayısı, etkinlik/gönderi istatistikleri, gönüllü saatleri). badge 'hangel'.
- Etkinlik Yönetimi — kulüp etkinliği oluştur/yayınla, kayıt/RSVP, kapasite. badge 'yeni'.
- Demografi Analizi — üye dağılımı (şehir/okul/yetenek/ilgi) + etki puanı. (no badge)
- Gönderiler — haber/duyuru yayınla; toplulukta görünür. (no badge)
- Topluluğunu Davet Et & Üye/Rol Yönetimi — davet, roller (Kulüp Başkanı, Genel Yönetici…). (no badge)
- Gelen Kutusu + Bildirim Merkezi + Yetkili Yönetimi + Kulüp QR — (group, no badge).
BETA: Ücretsiz Kulüp Web Sitesi — markaya özel, otomatik güncellenen site; erişim kademeli açılıyor. badge 'beta'.
YAKINDA: Görünürlük/Reklam Desteği (etkinlik/gönderiyi öne çıkarma) badge 'yakinda'.
REMOVE (KESİNLİKLE YAZMA — kodda yok, uydurma): "Geniş Networking Ağı (STK/markalarla doğrudan iş birliği kanalları)", "Kariyer ve Staj Önceliği", "Sponsorluk Kanalları", "Akademik Kredi Desteği", "Resmi Sertifikasyon", kulüpler için "Şeffaflık Endeksi". Bu vaatleri TAMAMEN kaldır.
CompareNote: etki karnesi/etkinlik araçları için isim vermeden kıyas ("kampüs kulüpleri için böyle bütünleşik bir araç seti çoğu yerde yok; hangel'de ücretsiz").
Flow: Hero ("Kampüste başlar, dünyayı değiştirir.") → statement slaytlar (Dijital panel; Etki karnesi; Etkinlikler YENİ) → FeatureGrid canlı araçlar → Beta/Yakında notu → CompareNote → final CTA. Bu sayfanın eski içeriğinin ÇOĞU uydurmaydı; sadece gerçek canlı özelliklerle, yine de heyecan verici biçimde kur.`,
  },
  {
    key: 'library',
    file: 'src/app/library/about/page.tsx',
    slug: "'library'",
    label: 'rewrite:kutuphane',
    spec: `PAGE: /library/about — AUDIENCE: STK profesyonelleri (proje yöneticisi, fon yazarı, idari kadro). Tone: güvenilir danışman; kanıt-odaklı, sade, profesyonel; "kaynak", "kanıt", "fon başvurusu", "etki ölçümü". Open-library CTA href: '/library'.
LIVE (hepsi gerçek ve zengin — derinliği vurgula):
- AI Proje Yazarı — çok adımlı sihirbaz; proje özeti/hedef/kitle/faaliyet/bütçe girilir, kurum tipine göre fon başvuru taslağı üretir. badge 'hangel'.
- AI Kütüphane Asistanı — kütüphane kaynakları üzerine sohbet eden asistan (her yerden erişilebilir FAB). badge 'yeni'.
- Etki Envanteri — sektöre göre indekslenmiş 300+ küresel sosyal etki kuruluşu kataloğu. badge 'hangel'.
- Filmler — 500+ film/belgesel; kategori, dil, Türkçe altyazı + duygu/aksiyon etiketli. badge 'hangel'.
- Kitaplar — 65+ kitap (sosyal girişimcilik, STK liderliği, etki ölçümü; TR+EN). (no badge)
- Akademik Makaleler — 40+ hakemli makale/bölüm. (no badge)
- Sözlük — ikili sözlük: hangel Sözlüğü + Sivil Toplum Sözlüğü. (no badge)
- Şablonlar & Araçlar — indirilebilir proje/bütçe/etki ölçüm şablonları. (no badge)
- Veri Kütüphanesi (Açık Veri) — belediye/bakanlık/TÜİK vb. 50+ kamu veri seti kataloğu. (no badge)
REMOVE: "yakında sesli kitaplar / uzman eğitim serileri / topluluk atölyeleri" temelsiz vaatleri — KOYMA (gündem dışı). Bunun yerine gerçek zenginliği (300+ kuruluş, 500+ film, 65+ kitap, 40+ makale, 50+ veri seti, AI yazar+asistan) öne çıkar.
CompareNote: "Bir yanda küresel araştırma veritabanları, bir yanda AI yazı araçları — hangel bunları sivil topluma özel, Türkçe ve ücretsiz tek çatıda birleştirir."
Flow: Hero ("Bilgi, herkes için.") → statement slaytlar (AI Proje Yazarı; Etki Envanteri 300+; Açık Veri) → FeatureGrid tüm koleksiyon (sayılarla) → CompareNote → final CTA ('Kütüphaneyi Aç' → /library). Hero görseli cms.heroImageUrl || '/discovery/library.png'.`,
  },
  {
    key: 'emergency',
    file: 'src/app/emergency/about/page.tsx',
    slug: null,
    label: 'rewrite:acil',
    spec: `PAGE: /emergency/about — AUDIENCE: bireyler + STK + sağlık kuruluşları (acil & kan). Tone: sıcak, aceleci ama sakin, insani; "saniyeler içinde", "tam konumunuzda", "binlerce yürek". Hopeful, hayat kurtaran. Join CTA href: '/login/selection?action=register'. Bu sayfa eskiden kırmızı (destructive) kullanıyordu — TAMAMINI narçiçeği/coral'a çevir.
LIVE:
- Afet Bildirimi — süper-admin afet (deprem/sel/yangın/fırtına) çağrısı oluşturur; Cloud Function geofence ile yakındaki opt-in kullanıcılara otomatik anlık bildirim. badge 'hangel'.
- Kan Bağışçı Eşleşmesi — kan çağrısı oluşturulunca kan grubu uyumlu + yakın bağışçılara otomatik bildirim (akıllı kan grubu uyumu). badge 'hangel'.
- Kan İhtiyacı Bildirimi — kullanıcı /emergency formundan hastane/kan grubu/konum girip çağrı açar. (no badge)
- Konum Bazlı Çağrı — yalnızca bulunduğun bölgenin çağrıları (mesafe filtreli). (no badge)
- "Yardım Edebilirim" Yanıtı — bildirime tıkla → hastane iletişim/konum bilgisi gelen kutusuna düşer. (no badge)
- Acil Tercihler — kan grubu, bağışa uygunluk, trombosit/kök hücre ayarları. (no badge)
- Anlık Push (FCM/APNs) — tek kayıt yazımı otomatik cihaz bildirimi tetikler. (no badge)
REMOVE: "Zaman aralığı / gece sessiz mod" (kodda yok) ve "aynı çağrıya yanıt veren diğer gönüllüleri görün; koordine olun" (son kullanıcı göremiyor) — bu iki "Nasıl Çalışır" kartını KALDIR; yerlerine gerçek olanları (konum bazlı çağrı, akıllı eşleşme, yardım yanıtı) koy.
CompareNote: "Afet ve kan için ayrı ayrı uygulamalar var; hangel ikisini tek dayanışma ağında, konuma ve kan grubuna göre otomatik eşleştirerek birleştirir."
Flow: Apple slaytlarına çevir — Hero ("Bir hayat, bir bildirim uzağınızda."), Afet Bildirimi slaytı, Kan Eşleşmesi slaytı, FeatureGrid "Nasıl çalışır" (gerçek 3-4 madde), CompareNote, final CTA ("Sen de katıl"). useWebPage KULLANMA (bu sayfa CMS kullanmıyordu). PublicFooter EKLE (eskiden yoktu).`,
  },
  {
    key: 'corporate',
    file: 'src/app/corporate/page.tsx',
    slug: "'corporate'",
    label: 'rewrite:kamu',
    spec: `PAGE: /corporate — AUDIENCE: KAMU (belediyeler & bakanlıklar) — birincil; ayrıca üniversite & lise ortaklıkları. Tone: profesyonel, ölçülü, uzun-vadeli ortaklık; hype yok; kanıt + güven. "kurumunuz", "veriyle planlama", "şeffaf", "gönüllü mobilizasyonu". Partnership CTA href: '/contact/municipalities' (belediye iletişim) ve ana CTA '/login/selection?action=register&type=corporate'.
LIVE:
- Gönüllülük Koordinasyonu & Acil Mobilizasyon — yetenek/uygunluk/konum bilgisiyle kayıtlı gönüllüler; afet/acil durumda belediye için hızlı mobilizasyon. badge 'hangel'.
- Şeffaflık Endeksi — bölgedeki STK'ların şeffaflık puanı; kamu için güvenilir partner seçimi. (no badge)
- Sosyal Etkinin Mali Değeri — gönüllü saat + bağışların meslek/göreve göre "mali değer" ve "etki puanı" hesabı; bütçe/planlama için. badge 'hangel'.
- Öğrenci Kulüpleri & Üniversite/Lise Partnerlikleri — kampüs gönüllülüğü ve etkinlik koordinasyonu. (no badge)
- KVKK Uyumlu Gönüllü Doğrulama & Veri Koruma — kamu ortaklığı için güvenli vetting. (no badge)
- Kamu İşbirlikleri Portalı — iletişim/başvuru ile ortaklık başlatma (canlı form). (no badge)
YAKINDA / BETA:
- Sosyal Etki Atlası — şehir/ilçe bazında sosyal ihtiyaç + çözüm haritası. badge 'yakinda'.
- Etkinlik & Mekan Paylaşımı — belediye/iş ortağı mekanlarının kulüplere açılması. badge 'yakinda'.
- Hibeler & Fonlar — kurumlara uygun hibe/fon keşfi. badge 'yakinda'.
- Demografi & Sosyal Etki Raporlama (kamu planlama) badge 'beta'.
CREDIBILITY (özellik değil, güven unsuru — kısa bahset + link): Sosyal Girişimcilik Mevzuatı Taslağı (TBMM hedefli kanun teklifi) → link '/hangelassociation/legislation'. "Kırmızı/Turuncu/Sarı sosyal ihtiyaç kodları" mevzuat vizyonu olarak; ÜRÜN gibi sunma.
REMOVE: "Sosyal Etki Atlası canlı/launched" iddiası (yakında); açık veri portalını hangel ürünü gibi sunma (mevzuat gereği olarak anlat); belediyeler bölümündeki içi boş genel "sosyal fayda" lafları — somut, doğru kamu faydasıyla değiştir.
NOT: Bu sayfa /corporate; mevcut üniversite/lise/belediye/bakanlık bölümleri var — Apple kimliğine çevir, kamu (belediye+bakanlık) birincil olacak, üniversite & lise ortaklıkları ikincil bölüm olarak kalsın. corporatePage.* çevirilerine bağlı kalma; inline TR/EN içerik kullan.
CompareNote: "Kamu için sosyal projeleri veri, gönüllü ve şeffaflıkla aynı yerde yöneten bütünleşik bir kamu-STK altyapısı; Türkiye'ye özel."
Flow: Hero (kamu için ortaklık), Gönüllü mobilizasyonu slaytı, Şeffaflık & mali değer slaytı, FeatureGrid canlı kamu özellikleri, "Yakında" FeatureGrid, mevzuat güven bloğu (link), üniversite/lise ikincil bölüm, CompareNote, final CTA ('İşbirliği Kur' → /contact/municipalities).`,
  },
]

phase('Rewrite')

const results = await pipeline(
  pages,
  // Stage 1 — rewrite the page
  (p) =>
    agent(
      `Rewrite the hangel marketing page at ${p.file} so it is an Apple-identity, coral-only "Daha Fazla Bilgi Al" page with accurate feature badges.\n\n${KIT_DOC}\n\n${RULES}\n\nUse useWebPage slug = ${p.slug ?? '(do NOT use useWebPage on this page)'}.\n\n=== PAGE SPEC ===\n${p.spec}\n\nWrite the full new file content with the Write tool (overwrite ${p.file}). It must compile (correct imports from '@/components/marketing/apple-kit', '@/components/layout/public-footer', '@/components/providers/language-provider', lucide-react, '@/hooks/use-site-content'). Keep it 'use client'. Return a short report: sections, per-feature badges, removed claims.`,
      { label: p.label, phase: 'Rewrite' },
    ),
  // Stage 2 — polish/verify the same page
  (rewriteReport, p) =>
    agent(
      `You are the polish + correctness pass for the hangel marketing page ${p.file}. Read the current file. Verify and FIX in place (use Edit/Write):\n1) SINGLE accent color = coral (text-primary/bg-primary/#f34723). Find and replace ANY non-coral accent (green/blue/destructive-red/yellow, raw hex like #xxxxxx that isn't a neutral). Neutrals allowed: white, black, #1d1d1f, #f5f5f7, gray/muted.\n2) Badges EXACTLY match the spec below (yeni=newly live, beta=gated, yakinda=roadmap-coming-soon, hangel=differentiator). No feature claimed that isn't in the spec. No invented stats.\n3) Apple tone, hopeful, audience-appropriate, "hangel" lowercase, no 🙏.\n4) Imports valid, no unused imports, valid JSX, compiles (eslint + tsc clean). MarketingNav at top, PublicFooter at bottom.\n5) TR copy flawless; EN mirror present.\nThe rewrite stage reported:\n${typeof rewriteReport === 'string' ? rewriteReport.slice(0, 1500) : '(no report)'}\n\n=== SPEC (source of truth) ===\n${p.spec}\n\nFix everything needed, then return a short final report: issues found + fixes applied, and confirm coral-only + badge accuracy.`,
      { label: `polish:${p.key}`, phase: 'Polish' },
    ).then((polishReport) => ({ key: p.key, file: p.file, rewriteReport, polishReport })),
)

phase('Review')

// Final cross-page review: accuracy + consistency + coral-only.
const review = await agent(
  `Final review of the 6 rewritten hangel learn-more pages. Read all six files and judge them against the rules. Pages:\n${pages.map((p) => `- ${p.file} (${p.key})`).join('\n')}\n\nFor EACH page verify: (a) coral is the ONLY accent color; (b) every feature badge is justified (yeni/beta/yakinda/hangel used per the real status — no overclaiming a 'yakinda/stub' feature as live, no 'live' feature mislabeled); (c) no fabricated features or fake statistics; (d) Apple tone + audience fit + 'hangel' lowercase; (e) imports valid & file plausibly compiles; (f) MarketingNav + PublicFooter present. List any remaining problems per page with file:line and a concrete fix. If a page is clean, say so. Be adversarial — actively hunt for non-coral colors and overclaimed features.`,
  { label: 'final-review', phase: 'Review', agentType: 'Explore' },
)

return { results: results.filter(Boolean).map((r) => ({ key: r.key, polish: r.polishReport })), review }
