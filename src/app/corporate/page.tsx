'use client';

/**
 * /corporate — STK, dernek, vakıf ve kulüp yöneticileri için "Daha Fazla Bilgi Al".
 * Apple/iOS kimliği, tek aksan rengi narçiçeği (#f34723). hangel'in BUGÜN sunduğu
 * ücretsiz kurumsal değeri (panel, çağrı merkezi, reklam, CRM, AI raporlar, sertifika,
 * şeffaflık, kurumsal site, ürün feed) vitrine çıkarır. İçerik inline TR/EN; hero CMS
 * (slug='corporate') üzerinden override edilebilir. Koyu tema güvenli token'lar.
 */

import {
  Sparkles,
  PhoneCall,
  Megaphone,
  UsersRound,
  Mail,
  Bot,
  Award,
  ShieldCheck,
  Globe,
  PackageSearch,
  LayoutDashboard,
  Calculator,
  FileText,
  CalendarHeart,
  HeartHandshake,
  Wallet,
  Lock,
  Cloud,
  KeyRound,
  BarChart3,
  BadgeCheck,
  Landmark,
} from 'lucide-react';
import {
  MarketingNav,
  AppleSection,
  SectionHeading,
  FeatureGrid,
  CompareNote,
  type FeatureItem,
} from '@/components/marketing/apple-kit';
import { PublicFooter } from '@/components/layout/public-footer';
import { useWebPage } from '@/hooks/use-site-content';
import { useTranslation } from '@/components/providers/language-provider';

const SLUG = 'corporate';

/** Kurumsal kayıt — STK/dernek/vakıf/kulüp yöneticisi buradan katılır. */
const REGISTER_HREF = '/register-organization';
const PANEL_HREF = '/ngo-admin/dashboard';
const ADS_HREF = '/ngo-admin/ads';
const CALL_HREF = '/ngo-admin/call-center';
const REPORTS_HREF = '/ngo-admin/reports';
const TRANSPARENCY_HREF = '/ngo-admin/transparency';
const WEBSITE_HREF = '/ngo-admin/website';
const EVENTS_HREF = '/events';
const VOLUNTEERING_HREF = '/volunteering';

const TR = {
  navLabel: 'STK & Kulüpler',
  navCta: 'STK Olarak Katıl',
  back: 'Ana Sayfa',

  heroEyebrow: 'STK · Dernek · Vakıf · Kulüp için',
  heroTitle: 'Umudu birlikte büyütüyoruz.',
  heroSubtitle: 'Kurumunuzu yöneten her şey tek panelde — ve tamamen ücretsiz.',
  heroDescription:
    'hangel; STK, dernek, vakıf ve kulüpler için panel, çağrı merkezi, reklam yönetimi, CRM, toplu mail/SMS, AI raporlar, sertifika ve şeffaflık skorunu tek çatıda toplar. Yok öyle yalnız başına mücadele etmek — toplumsal sorunlar için birlikte çalışıyoruz. 🧡',
  heroImage:
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2070&auto=format&fit=crop',
  heroCtaPrimary: 'STK Olarak Katıl',
  heroCtaSecondary: 'Paneli keşfet',

  freeEyebrow: 'Neden hangel · Ücretsiz',
  freeTitle: 'Tek kuruş ödemeden, kurumsal güçte.',
  freeSubtitle: 'Kurulum ücreti yok, aylık abonelik yok, gizli kalem yok.',
  freeDescription:
    'Diğer kurumlar ayrı ayrı çağrı merkezi, reklam ajansı, CRM, e-posta aracı ve raporlama yazılımı için bütçe ayırır. hangel’de bunların tamamı kurumunuza ücretsiz açılır. Kütük numaranızı girin, eşleştirin; panel dakikalar içinde hazır.',
  freeImage:
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2074&auto=format&fit=crop',
  freeBadge: 'Ücretsiz',

  callEyebrow: 'Çağrı Merkezi / Santral',
  callTitle: 'Tarayıcıdan gerçek arama yapın.',
  callSubtitle: 'Kendi SIP geçidimiz üzerinden WebRTC ile sesli görüşme.',
  callDescription:
    'Bağışçınızı, gönüllünüzü ya da paydaşınızı tarayıcıdan, kulaklıkla arayın — ek santral donanımı olmadan. Panel içindeki çağrı merkezi panosundan ekibinizin görüşmelerini tek yerden yürütün.',
  callImage:
    'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?q=80&w=2070&auto=format&fit=crop',

  adsEyebrow: 'Reklam Yönetimi',
  adsTitle: 'Google, Meta ve TikTok tek panelden.',
  adsSubtitle: 'Hesabınızı bağlayın, kampanyanızı yayınlayın.',
  adsDescription:
    'Google Ad Grants, Meta ve TikTok reklam hesaplarınızı panelden bağlayın; kampanyalarınızı hangel üzerinden yayınlayıp yönetin. Ulaşmak istediğiniz kitleye, davanız için doğru mecradan ulaşın.',
  adsImage:
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',

  aiEyebrow: 'AI Asistan',
  aiTitle: 'Sürdürülebilirlik raporu ve proje yazma asistanı.',
  aiSubtitle: 'Apple standardında çıktı, yapay zekâ desteğiyle.',
  aiDescription:
    'AI sürdürülebilirlik raporu, kurumunuzun etkisini düzenli ve sunulabilir bir belgeye dönüştürür. Proje yazma asistanı ise hibe ve fon başvurularınız için metni birlikte oluşturmanıza yardım eder.',
  aiImage:
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop',
  aiBadge: 'AI',

  liveEyebrow: 'Bugün Hazır',
  liveTitle: 'Kurumunuzun bugün kullanabileceği araçlar.',
  liveDescription:
    'Hepsi üretimde çalışıyor, hepsi tek panelde ve hepsi ücretsiz. Kaydolduğunuz an aktif olur.',

  trustEyebrow: 'Güven & Şeffaflık',
  trustTitle: 'Şeffaflık skorunuzla öne çıkın.',
  trustDescription:
    'Kütük/dernek otomatik eşleştirme ile profiliniz hızlıca doğrulanır; coral onay tikiyle listede güven verirsiniz. Şeffaflık skoru, kurumunuzun açıklığını bağışçı ve gönüllüye gösterir.',
  trustCta: 'Şeffaflık panelini gör',

  reachEyebrow: 'Topluluğa Ulaş',
  reachTitle: 'Gönüllünüz, bağışçınız ve kitleniz burada.',
  reachSubtitle: 'Etkinlik, gönüllülük ve pazar; hepsi hazır bir toplulukla.',
  reachDescription:
    'Etkinlik ve gönüllülük ilanlarınızı yayınlayın, QR/NFC ile katılımcı alın, otomatik sertifika verin. Markalarla bağış oranlı ürün feed’i üzerinden “tıkla-alışveriş” bağışı toplayın. Kullanıcı ödeme yapmaz; bağış marka ve kurum aracılığıyla büyür.',
  reachImage:
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop',
  reachCtaPrimary: 'Etkinlikleri gör',
  reachCtaLink: 'Gönüllülük ilanları',

  compare:
    'Dünyada STK’lara ayrı ayrı araçlar satan platformlar var; hangel’de panel, çağrı merkezi, reklam, CRM, AI rapor ve şeffaflık tek çatıda, Türkiye’ye özel ve ücretsiz. Siz davanıza odaklanın; altyapıyı biz taşıyalım.',

  firstEyebrow: 'Türkiye’de bir ilk',
  firstTitle: 'Kamu ve sivil toplum, aynı veride buluşuyor.',
  firstSubtitle: 'Belediye ve bakanlıklar için veriyle planlanan, şeffaf yönetilen işbirliği.',
  firstDescription:
    'Belediye ve bakanlıkların sosyal projelerini veriyle planlayıp şeffaf biçimde yönetebildiği öncü bir kamu-STK işbirliği altyapısı. Kurumlar, STK’lar ve gönüllüler tek çatı altında buluşur; her adım ölçülebilir, her sonuç raporlanabilir.',
  firstImage:
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=2074&auto=format&fit=crop',

  secEyebrow: 'Güvenlik & Teknoloji',
  secTitle: 'Kurumsal veriniz güvende.',
  secSubtitle: 'KVKK uyumlu, şifreli ve rol-bazlı bir altyapı.',
  secDescription:
    'hangel; kurumunuzun ve topluluğunuzun verisini güvenli Google Cloud altyapısında, KVKK’ya uygun ve şifreli biçimde işler. Rol-bazlı yetkilendirmeyle her ekip üyesi yalnızca yetkili olduğu alana erişir. Kamu işbirliklerinde beklenen güven, baştan tasarlanmıştır.',
  secImage:
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',

  secGridEyebrow: 'Güven veren altyapı',
  secGridTitle: 'Verileriniz için kurumsal düzeyde güvence.',
  secGridDescription:
    'KVKK uyumundan rol-bazlı yetkiye — her katman, kamu ve sivil toplum işbirliğinin gerektirdiği güven için tasarlandı.',

  docsEyebrow: 'Belgeler & Etki Raporları',
  docsTitle: 'Şeffaflığınız, belgelerle konuşsun.',
  docsDescription:
    'Şeffaflık skoru, AI sürdürülebilirlik raporu ve etki raporları; kurumunuzun açıklığını bağışçıya, gönüllüye ve kamu paydaşına belgeyle gösterir. Otomatik sertifikalarla katkı sağlayan herkesin emeği görünür olur.',

  evolveNote:
    'hangel sürekli gelişiyor; yeni kamu entegrasyonları, raporlar ve işbirliği araçları eklendikçe bu sayfa güncellenir.',

  finalEyebrow: '#wearehangel',
  finalTitle: 'Kurumunuzu iyiliğin merkezine taşıyın.',
  finalSubtitle: 'Kayıt ücretsiz, kurulum hızlı.',
  finalDescription:
    'Kütük numaranızla eşleşin, taslak profilinizi oluşturun ve onaylanın. Yok öyle yalnız başına mücadele etmek — birlikte çalışıyoruz. 🧡',
  finalCtaPrimary: 'STK Olarak Katıl',
  finalCtaSecondary: 'Paneli keşfet',

  footer: 'STK & Kulüpler',
};

const EN = {
  navLabel: 'NGOs & Clubs',
  navCta: 'Join as an NGO',
  back: 'Home',

  heroEyebrow: 'For NGOs · Associations · Foundations · Clubs',
  heroTitle: 'We grow hope together.',
  heroSubtitle: 'Everything that runs your organization in one panel — and entirely free.',
  heroDescription:
    'hangel brings the panel, call center, ad management, CRM, bulk mail/SMS, AI reports, certificates and a transparency score together for NGOs, associations, foundations and clubs. No more struggling alone — we work together for social causes. 🧡',
  heroImage:
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2070&auto=format&fit=crop',
  heroCtaPrimary: 'Join as an NGO',
  heroCtaSecondary: 'Explore the panel',

  freeEyebrow: 'Why hangel · Free',
  freeTitle: 'Enterprise-grade, without paying a cent.',
  freeSubtitle: 'No setup fee, no monthly subscription, no hidden line items.',
  freeDescription:
    'Other organizations budget separately for a call center, an ad agency, a CRM, an email tool and reporting software. On hangel all of these open up to your organization for free. Enter your registry number, match it, and your panel is ready in minutes.',
  freeImage:
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2074&auto=format&fit=crop',
  freeBadge: 'Free',

  callEyebrow: 'Call Center / Switchboard',
  callTitle: 'Make real calls from your browser.',
  callSubtitle: 'Voice calls over WebRTC through our own SIP gateway.',
  callDescription:
    'Call your donor, volunteer or stakeholder from the browser with a headset — no extra switchboard hardware. Run your team’s conversations from a single call-center dashboard inside the panel.',
  callImage:
    'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?q=80&w=2070&auto=format&fit=crop',

  adsEyebrow: 'Ad Management',
  adsTitle: 'Google, Meta and TikTok from one panel.',
  adsSubtitle: 'Connect your account, publish your campaign.',
  adsDescription:
    'Connect your Google Ad Grants, Meta and TikTok ad accounts from the panel; publish and manage your campaigns through hangel. Reach the audience you want, for your cause, through the right channel.',
  adsImage:
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',

  aiEyebrow: 'AI Assistant',
  aiTitle: 'Sustainability report and project-writing assistant.',
  aiSubtitle: 'Apple-grade output, with AI support.',
  aiDescription:
    'The AI sustainability report turns your organization’s impact into a tidy, presentable document. The project-writing assistant helps you draft the text for your grant and fund applications together.',
  aiImage:
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop',
  aiBadge: 'AI',

  liveEyebrow: 'Ready Today',
  liveTitle: 'Tools your organization can use today.',
  liveDescription:
    'All running in production, all in one panel and all free. They go live the moment you register.',

  trustEyebrow: 'Trust & Transparency',
  trustTitle: 'Stand out with your transparency score.',
  trustDescription:
    'Automatic registry/association matching verifies your profile quickly; the coral verified tick builds trust in the list. The transparency score shows your organization’s openness to donors and volunteers.',
  trustCta: 'See the transparency panel',

  reachEyebrow: 'Reach the Community',
  reachTitle: 'Your volunteers, donors and audience are here.',
  reachSubtitle: 'Events, volunteering and a market; all with a ready community.',
  reachDescription:
    'Publish your event and volunteering listings, take attendance via QR/NFC, issue automatic certificates. Collect “shop-to-donate” support through a donation-rated product feed with brands. The user never pays; donations grow through brands and organizations.',
  reachImage:
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop',
  reachCtaPrimary: 'See events',
  reachCtaLink: 'Volunteering listings',

  compare:
    'There are platforms around the world that sell tools to NGOs one by one; on hangel the panel, call center, ads, CRM, AI reports and transparency are under one roof, built for Türkiye and free. You focus on your cause; we carry the infrastructure.',

  firstEyebrow: 'A first in Türkiye',
  firstTitle: 'Public sector and civil society, meeting on the same data.',
  firstSubtitle: 'Collaboration planned with data and managed transparently — for municipalities and ministries.',
  firstDescription:
    'A pioneering public–NGO collaboration infrastructure where municipalities and ministries can plan their social projects with data and manage them transparently. Institutions, NGOs and volunteers meet under one roof; every step is measurable, every outcome reportable.',
  firstImage:
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=2074&auto=format&fit=crop',

  secEyebrow: 'Security & Technology',
  secTitle: 'Your organizational data is safe.',
  secSubtitle: 'A KVKK-compliant, encrypted and role-based infrastructure.',
  secDescription:
    'hangel processes your organization’s and community’s data on secure Google Cloud infrastructure, in a KVKK-compliant and encrypted way. With role-based authorization, each team member accesses only what they are authorized to. The trust expected in public collaborations is designed in from the start.',
  secImage:
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',

  secGridEyebrow: 'Infrastructure you can trust',
  secGridTitle: 'Enterprise-grade assurance for your data.',
  secGridDescription:
    'From KVKK compliance to role-based access — every layer is designed for the trust that public and civil-society collaboration requires.',

  docsEyebrow: 'Documents & Impact Reports',
  docsTitle: 'Let your transparency speak through documents.',
  docsDescription:
    'A transparency score, an AI sustainability report and impact reports show your organization’s openness to donors, volunteers and public stakeholders with real documents. Automatic certificates make everyone’s contribution visible.',

  evolveNote:
    'hangel keeps evolving; this page is updated as new public integrations, reports and collaboration tools are added.',

  finalEyebrow: '#wearehangel',
  finalTitle: 'Move your organization to the heart of good.',
  finalSubtitle: 'Registration is free, setup is fast.',
  finalDescription:
    'Match with your registry number, create your draft profile and get approved. No more struggling alone — we work together. 🧡',
  finalCtaPrimary: 'Join as an NGO',
  finalCtaSecondary: 'Explore the panel',

  footer: 'NGOs & Clubs',
};

export default function CorporateShowcasePage() {
  const { language } = useTranslation();
  const en = language === 'en';
  const C = en ? EN : TR;
  const cms = useWebPage(SLUG);

  const liveFeatures: FeatureItem[] = en
    ? [
        {
          icon: LayoutDashboard,
          title: 'Free Management Panel',
          description:
            'Profile, QR, community invite and everything that runs your organization in one place — completely free.',
          badge: { kind: 'hangel' },
        },
        {
          icon: PhoneCall,
          title: 'Call Center / Switchboard',
          description:
            'Make real calls from your browser over WebRTC through our own SIP gateway, with a team call dashboard.',
        },
        {
          icon: Megaphone,
          title: 'Ad Management (Google · Meta · TikTok)',
          description:
            'Connect your ad accounts and publish campaigns on Google Ad Grants, Meta and TikTok from the panel.',
        },
        {
          icon: UsersRound,
          title: 'CRM, Team & Accounting',
          description:
            'Manage your CRM, team and roles, accounting integration and payout tracking from a single screen.',
        },
        {
          icon: Mail,
          title: 'Bulk Mail & SMS',
          description:
            'Workspace bulk mail with a per-organization SMTP and an SMS/mail quota system, throttled and gated.',
        },
        {
          icon: Bot,
          title: 'AI Sustainability Report & Project Assistant',
          description:
            'An Apple-grade sustainability report and a project-writing assistant for your grant and fund applications.',
          badge: { kind: 'hangel' },
        },
        {
          icon: Award,
          title: 'Certificate Generator',
          description:
            'Issue redesigned certificates automatically to your event and volunteering participants.',
        },
        {
          icon: ShieldCheck,
          title: 'Transparency Score & Registry Matching',
          description:
            'Automatic registry/association matching, a coral verified tick and a transparency score that builds trust.',
        },
        {
          icon: Globe,
          title: 'Your Own Corporate Website',
          description:
            'Publish your organization’s own website on a *.hangel.org address, ready to share.',
        },
        {
          icon: PackageSearch,
          title: 'Product Feed / PIM (donation-rated)',
          description:
            'List products with a donation rate via the product feed, so brands and supporters can shop to donate.',
        },
        {
          icon: CalendarHeart,
          title: 'Events & Volunteering Listings',
          description:
            'Create and manage events and volunteering listings; live mode, countdown, QR/NFC check-in and evaluation.',
        },
        {
          icon: HeartHandshake,
          title: 'Payment-free Donations',
          description:
            'Donations grow through brands and organizations — shop-to-donate or download-to-use, never a card payment.',
          badge: { kind: 'hangel' },
        },
      ]
    : [
        {
          icon: LayoutDashboard,
          title: 'Ücretsiz Yönetim Paneli',
          description:
            'Profil, QR, topluluk daveti ve kurumunuzu yöneten her şey tek yerde — tamamen ücretsiz.',
          badge: { kind: 'hangel' },
        },
        {
          icon: PhoneCall,
          title: 'Çağrı Merkezi / Santral',
          description:
            'Kendi SIP geçidimiz üzerinden WebRTC ile tarayıcıdan gerçek arama; ekip için çağrı panosu.',
        },
        {
          icon: Megaphone,
          title: 'Reklam Yönetimi (Google · Meta · TikTok)',
          description:
            'Reklam hesaplarınızı bağlayın; Google Ad Grants, Meta ve TikTok kampanyalarını panelden yayınlayın.',
        },
        {
          icon: UsersRound,
          title: 'CRM, Ekip & Muhasebe',
          description:
            'CRM, ekip ve rol yönetimi, muhasebe entegrasyonu ve hak ediş/ödeme takibini tek ekrandan yönetin.',
        },
        {
          icon: Mail,
          title: 'Toplu Mail & SMS',
          description:
            'Workspace toplu mail, kuruma özel SMTP ve SMS/mail kota sistemi; throttle’lı ve kontrollü.',
        },
        {
          icon: Bot,
          title: 'AI Sürdürülebilirlik Raporu & Proje Asistanı',
          description:
            'Apple standardında sürdürülebilirlik raporu ve hibe/fon başvuruları için proje yazma asistanı.',
          badge: { kind: 'hangel' },
        },
        {
          icon: Award,
          title: 'Sertifika Üreteci',
          description:
            'Etkinlik ve gönüllülük katılımcılarınıza yeniden tasarlanmış sertifikaları otomatik verin.',
        },
        {
          icon: ShieldCheck,
          title: 'Şeffaflık Skoru & Kütük Eşleştirme',
          description:
            'Otomatik kütük/dernek eşleştirme, coral onay tiki ve güven veren şeffaflık skoru.',
        },
        {
          icon: Globe,
          title: 'Kendi Kurumsal Siteniz',
          description:
            'Kurumunuzun kendi sitesini *.hangel.org adresinde yayınlayın; paylaşmaya hazır.',
        },
        {
          icon: PackageSearch,
          title: 'Ürün Feed / PIM (bağış oranlı)',
          description:
            'Ürün feed ile bağış oranlı ürün listeleyin; markalar ve destekçiler alışverişle bağış yapsın.',
        },
        {
          icon: CalendarHeart,
          title: 'Etkinlik & Gönüllülük İlanları',
          description:
            'Etkinlik ve gönüllülük ilanları oluşturup yönetin; canlı mod, geri sayım, QR/NFC check-in ve değerlendirme.',
        },
        {
          icon: HeartHandshake,
          title: 'Ödemesiz Bağış',
          description:
            'Bağış marka ve kurum aracılığıyla büyür — tıkla-alışveriş ya da indir-kullan; klasik kart bağışı yok.',
          badge: { kind: 'hangel' },
        },
      ];

  const opsFeatures: FeatureItem[] = en
    ? [
        {
          icon: Calculator,
          title: 'Accounting & Payout',
          description: 'Accounting integration plus earnings and payout tracking, transparent end to end.',
        },
        {
          icon: FileText,
          title: 'Project & Grant Drafting',
          description: 'Draft the text for your grant and fund applications with the AI project assistant.',
        },
        {
          icon: Wallet,
          title: 'Funds & Grants Discovery',
          description: 'Bring your funds and grant workflow into the panel alongside your impact reporting.',
        },
        {
          icon: Sparkles,
          title: 'Community Invite',
          description: 'Invite your community with shared codes and match them to existing hangel users.',
        },
      ]
    : [
        {
          icon: Calculator,
          title: 'Muhasebe & Hak Ediş',
          description: 'Muhasebe entegrasyonu ve hak ediş/ödeme (payout) takibi; baştan sona şeffaf.',
        },
        {
          icon: FileText,
          title: 'Proje & Hibe Yazımı',
          description: 'Hibe ve fon başvurularınızın metnini AI proje asistanıyla birlikte oluşturun.',
        },
        {
          icon: Wallet,
          title: 'Fon & Hibe Keşfi',
          description: 'Fon ve hibe akışınızı etki raporlamanızla aynı panelde toplayın.',
        },
        {
          icon: Sparkles,
          title: 'Topluluk Daveti',
          description: 'Topluluğunuzu paylaşılan kodlarla davet edin; mevcut hangel kullanıcılarıyla eşleştirin.',
        },
      ];

  const secFeatures: FeatureItem[] = en
    ? [
        {
          icon: ShieldCheck,
          title: 'KVKK-Compliant Data Processing',
          description: 'Personal and organizational data processed in a KVKK-compliant, purpose-limited and transparent way.',
        },
        {
          icon: Cloud,
          title: 'Secure Cloud Infrastructure',
          description: 'Runs on Google Cloud; scalable, continuously updated and resilient under load.',
        },
        {
          icon: KeyRound,
          title: 'Role-Based Authorization',
          description: 'Each team member accesses only what they are authorized to; every action is auditable.',
        },
        {
          icon: Lock,
          title: 'Encrypted Communication',
          description: 'Encrypted in transit and at rest; your data and your community are protected.',
        },
        {
          icon: BarChart3,
          title: 'Data-Driven Planning',
          description: 'Plan social projects with data and public datasets; measure every step.',
        },
        {
          icon: BadgeCheck,
          title: 'Verified & Transparent',
          description: 'Registry matching, a coral verified tick and a transparency score public stakeholders can trust.',
        },
      ]
    : [
        {
          icon: ShieldCheck,
          title: 'KVKK Uyumlu Veri İşleme',
          description: 'Kişisel ve kurumsal veriler KVKK’ya uygun, amaçla sınırlı ve şeffaf biçimde işlenir.',
        },
        {
          icon: Cloud,
          title: 'Güvenli Bulut Altyapısı',
          description: 'Google Cloud üzerinde çalışır; ölçeklenir, sürekli güncellenir ve yük altında dayanıklıdır.',
        },
        {
          icon: KeyRound,
          title: 'Rol-Bazlı Yetkilendirme',
          description: 'Her ekip üyesi yalnızca yetkili olduğu alana erişir; her işlem denetlenebilir.',
        },
        {
          icon: Lock,
          title: 'Şifreli İletişim',
          description: 'Aktarımda ve saklamada şifreli; verileriniz ve topluluğunuz korunur.',
        },
        {
          icon: BarChart3,
          title: 'Veriyle Planlama',
          description: 'Sosyal projeleri veri ve kamu veri setleriyle planlayın; her adımı ölçün.',
        },
        {
          icon: BadgeCheck,
          title: 'Doğrulanmış & Şeffaf',
          description: 'Kütük eşleştirme, coral onay tiki ve kamu paydaşının güvenebileceği şeffaflık skoru.',
        },
      ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <MarketingNav
        label={C.navLabel}
        ctaLabel={C.navCta}
        ctaHref={REGISTER_HREF}
        backLabel={C.back}
      />

      {/* Hero — STK/kulüp için kurumsal değer */}
      <AppleSection
        eyebrow={C.heroEyebrow}
        title={cms.title || C.heroTitle}
        subtitle={cms.subtitle || C.heroSubtitle}
        description={cms.description || C.heroDescription}
        image={{ url: cms.heroImageUrl || C.heroImage, hint: 'volunteers collaborating community nonprofit' }}
        actions={[
          { label: C.heroCtaPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.heroCtaSecondary, href: PANEL_HREF, variant: 'link' },
        ]}
      />

      {/* Neden hangel — ücretsiz vurgusu */}
      <AppleSection
        theme="dark"
        eyebrow={C.freeEyebrow}
        title={C.freeTitle}
        subtitle={C.freeSubtitle}
        description={C.freeDescription}
        image={{ url: C.freeImage, hint: 'team meeting nonprofit office collaboration' }}
        badges={[{ kind: 'hangel', label: C.freeBadge }]}
        actions={[{ label: C.heroCtaPrimary, href: REGISTER_HREF, variant: 'secondary' }]}
      />

      {/* Çağrı merkezi / santral */}
      <AppleSection
        eyebrow={C.callEyebrow}
        title={C.callTitle}
        subtitle={C.callSubtitle}
        description={C.callDescription}
        image={{ url: C.callImage, hint: 'call center headset agent browser' }}
        actions={[{ label: C.heroCtaSecondary, href: CALL_HREF, variant: 'link' }]}
      />

      {/* Reklam yönetimi */}
      <AppleSection
        theme="dark"
        eyebrow={C.adsEyebrow}
        title={C.adsTitle}
        subtitle={C.adsSubtitle}
        description={C.adsDescription}
        image={{ url: C.adsImage, hint: 'analytics campaign dashboard advertising' }}
        actions={[{ label: C.heroCtaSecondary, href: ADS_HREF, variant: 'link' }]}
      />

      {/* AI sürdürülebilirlik + proje asistanı */}
      <AppleSection
        eyebrow={C.aiEyebrow}
        title={C.aiTitle}
        subtitle={C.aiSubtitle}
        description={C.aiDescription}
        image={{ url: C.aiImage, hint: 'ai assistant document report writing' }}
        badges={[{ kind: 'hangel', label: C.aiBadge }]}
        actions={[{ label: C.trustCta, href: REPORTS_HREF, variant: 'link' }]}
      />

      {/* Türkiye'de bir ilk — kamu-STK işbirliği */}
      <AppleSection
        eyebrow={C.firstEyebrow}
        title={C.firstTitle}
        subtitle={C.firstSubtitle}
        description={C.firstDescription}
        image={{ url: C.firstImage, hint: 'city hall public building civic collaboration daylight' }}
        badges={[{ kind: 'hangel' }]}
        actions={[{ label: C.heroCtaPrimary, href: REGISTER_HREF, variant: 'secondary' }]}
      />

      {/* Canlı kurumsal araçlar ızgarası */}
      <AppleSection compact theme="light">
        <SectionHeading
          eyebrow={C.liveEyebrow}
          title={C.liveTitle}
          description={C.liveDescription}
        />
        <FeatureGrid items={liveFeatures} columns={3} />
        <CompareNote>{C.compare}</CompareNote>
      </AppleSection>

      {/* Operasyon araçları (ikincil ızgara) */}
      <AppleSection compact theme="dark">
        <SectionHeading
          theme="dark"
          eyebrow="Operasyon & Büyüme"
          title={en ? 'Operations & growth, in one flow.' : 'Operasyon ve büyüme, tek akışta.'}
          description={
            en
              ? 'Accounting, project drafting, funds and community invite — alongside your impact reporting.'
              : 'Muhasebe, proje yazımı, fonlar ve topluluk daveti — etki raporlamanızla yan yana.'
          }
        />
        <FeatureGrid items={opsFeatures} columns={2} theme="dark" />
      </AppleSection>

      {/* Güven & şeffaflık bloğu */}
      <AppleSection
        compact
        eyebrow={C.trustEyebrow}
        title={C.trustTitle}
        description={C.trustDescription}
        actions={[
          { label: C.trustCta, href: TRANSPARENCY_HREF, variant: 'link' },
          { label: en ? 'Publish your website' : 'Kurumsal siteni yayınla', href: WEBSITE_HREF, variant: 'link' },
        ]}
      >
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
        </div>
      </AppleSection>

      {/* Güvenlik & teknoloji — statement */}
      <AppleSection
        theme="dark"
        eyebrow={C.secEyebrow}
        title={C.secTitle}
        subtitle={C.secSubtitle}
        description={C.secDescription}
        image={{ url: C.secImage, hint: 'secure cloud data protection abstract calm' }}
        badges={[{ kind: 'hangel' }]}
      />

      {/* Güven veren altyapı ızgarası */}
      <AppleSection compact theme="light">
        <SectionHeading
          eyebrow={C.secGridEyebrow}
          title={C.secGridTitle}
          description={C.secGridDescription}
        />
        <FeatureGrid items={secFeatures} columns={3} />
      </AppleSection>

      {/* Belgeler & etki raporları */}
      <AppleSection
        compact
        eyebrow={C.docsEyebrow}
        title={C.docsTitle}
        description={C.docsDescription}
        actions={[
          { label: C.trustCta, href: TRANSPARENCY_HREF, variant: 'link' },
          { label: en ? 'See AI reports' : 'AI raporları gör', href: REPORTS_HREF, variant: 'link' },
        ]}
      >
        <div className="flex justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
            <BarChart3 className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
            <Landmark className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
            <Award className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
        </div>
        <CompareNote>{C.evolveNote}</CompareNote>
      </AppleSection>

      {/* Topluluğa ulaş — etkinlik / gönüllülük / pazar */}
      <AppleSection
        id="topluluk"
        theme="dark"
        eyebrow={C.reachEyebrow}
        title={C.reachTitle}
        subtitle={C.reachSubtitle}
        description={C.reachDescription}
        image={{ url: C.reachImage, hint: 'community event volunteers gathering' }}
        actions={[
          { label: C.reachCtaPrimary, href: EVENTS_HREF, variant: 'secondary' },
          { label: C.reachCtaLink, href: VOLUNTEERING_HREF, variant: 'link' },
        ]}
      />

      {/* Final CTA — STK olarak katıl */}
      <AppleSection
        eyebrow={C.finalEyebrow}
        title={C.finalTitle}
        subtitle={C.finalSubtitle}
        description={C.finalDescription}
        actions={[
          { label: C.finalCtaPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.finalCtaSecondary, href: PANEL_HREF, variant: 'secondary' },
        ]}
      />

      <PublicFooter currentPageLabel={C.footer} />
    </div>
  );
}
