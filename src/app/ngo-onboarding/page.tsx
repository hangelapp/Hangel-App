'use client';

/**
 * /ngo-onboarding — STK yöneticileri için "Daha Fazla Bilgi Al" tanıtım sayfası.
 *
 * Apple marka kimliği, tek aksan rengi narçiçeği (#f34723). Tüm yapı
 * '@/components/marketing/apple-kit' bileşenleriyle kurulur. İçerik iki dilli
 * (TR birincil, EN ayna); rozetler özelliğin gerçek durumunu yansıtır.
 */

import React from 'react';
import {
  ShieldCheck,
  HandCoins,
  HeartHandshake,
  BarChart3,
  MessageSquare,
  Globe,
  CalendarDays,
  Sparkles,
  Inbox,
  UserPlus,
  Users,
  QrCode,
  Megaphone,
  Database,
  Calculator,
  CreditCard,
  Video,
  Palette,
  Landmark,
  Send,
  LineChart,
  PhoneCall,
  MessageCircle,
  IdCard,
  ListChecks,
  Copy,
  TrendingUp,
  Timer,
  Camera,
  MapPinned,
  Building2,
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
import { useTranslation } from '@/components/providers/language-provider';
import { useWebPage } from '@/hooks/use-site-content';

const SLUG = 'ngo-onboarding';
const REGISTER_HREF = '/login/selection?action=register&type=corporate&entity=NGO';

/* ----------------------------- TR içerik ----------------------------- */

const TR = {
  navLabel: 'hangel STK',
  navCta: 'Ücretsiz Başvur',
  back: 'Ana sayfa',

  heroEyebrow: 'hangel STK — STK Yönetim Yazılımı',
  heroTitle: 'Kurumunuzun en güçlü yanını dünyaya gösterin.',
  heroSubtitle: 'Güven, kaynak ve gönüllü gücü. Hepsi tek panelde, tamamen ücretsiz.',
  heroDescription:
    'hangel; dernek ve vakıflar için Türkiye’ye özel, bütünleşik STK yönetim yazılımıdır. Şeffaflık endeksiyle güveninizi kanıtlayın, hibe ve bağışla düzenli kaynak oluşturun, gönüllü yönetimiyle doğru insanları doğru göreve buluşturun, her emeği sertifikayla taçlandırın — hepsi tek panelden. Kurulum dakikalar sürer, verileriniz güvende, süreç baştan sona şeffaftır. Derneğinizin dijitalleşmesi bugün başlar.',
  heroImage:
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Ücretsiz Başvur',
  heroLink: 'Daha Fazla',

  transparencyEyebrow: 'Şeffaflık Endeksi',
  transparencyTitle: 'Güven, artık ölçülebilir.',
  transparencyDescription:
    'Yasal belgelerinizi ve faaliyet raporlarınızı yükleyin; kurumunuz 0–100 arası bir şeffaflık puanı kazansın. Bu puan profilinizde halka açık görünür, destekçilerinize güveni kanıtlar ve kurumunuzu bir adım öne taşır. Şeffaflık, en güçlü yönünüz olsun.',

  donationEyebrow: 'hangel Bağışı',
  donationTitle: 'Her alışveriş, düzenli bağışa dönüşür.',
  donationDescription:
    'Destekçileriniz anlaşmalı markalardan her alışveriş yaptığında kurumunuza gelir aktarılır — cebinden ek kuruş çıkmadan. Marka, işlem ve komisyon bilgilerini panelinizden şeffafça takip eder, kaynağınızı düzenli hale getirirsiniz.',

  volunteerEyebrow: 'Gönüllü Yönetimi',
  volunteerTitle: 'Doğru gönüllü, doğru görevle buluşur.',
  volunteerDescription:
    'Yetenek bazlı ilanlar yayınlayın. hangel her gönüllüye otomatik yüzde uyum eşleştirmesi yapar; en uygun adayları öne çıkarır, tüm başvuruları tek ekrandan yönetirsiniz. Gönüllü gücünüzü büyütün.',

  certificatesEyebrow: 'Sertifikalar & Rozetler',
  certificatesTitle: 'Her emek, bir belgeyle taçlansın.',
  certificatesDescription:
    'Gönüllülerinize tek tıkla, kurumunuzun logosuyla otomatik katılım ve başarı sertifikaları ile yaka kartları üretin. Kurumunuz her ay; toplam bağış, gönüllü saati ve sosyal etki değerini birleştiren otomatik bir etki sertifikası kazanır. Bu belge, güçlü yönlerinizi tek bakışta anlatan en somut kanıtınız olur. Rozetler ve size özel rozetlerle gönüllü sadakatini ödüllendirin.',

  compareTransparency:
    "Dünyada şeffaflık derecelendirmesi ve alışverişle bağış benzerleri çoğu zaman ücretli ve parçalıdır. hangel'de bu, Türkiye'ye özel, ücretsiz ve tek panelde.",

  toolsEyebrow: 'Tek Panel',
  toolsTitle: 'Derneğinizin her işi, tek panelde.',
  toolsDescription:
    'Bağış ve hibeden gönüllü yönetimine, şeffaflıktan etkinlik yönetimine kadar kurumunuzun tüm operasyonu için tasarlanmış, yayında olan araçlar. Dernek dijitalleşmesi için ihtiyacınız olan her şey.',

  soonEyebrow: 'Yol Haritası',
  soonTitle: 'Yakında panelinizde.',
  soonDescription:
    'Yönetim panelinde "yakında" etiketiyle hazırlığı süren modüller. Henüz kullanıma açılmadı; geldiğinde panelinizde otomatik görünecek.',

  finalEyebrow: 'Başlayın',
  finalTitle: 'Dijital dönüşümü bugün başlatın.',
  finalSubtitle: 'Başvuru ücretsiz. Kurulum dakikalar sürer. Kredi kartı gerekmez.',
  finalDescription:
    'Binlerce kurumun katıldığı harekete siz de katılın. Kurumunuzu hangel ile dakikalar içinde kaydedin; güveninizi, kaynağınızı, gönüllü gücünüzü ve etkinizi büyütmeye bugün başlayın. En güçlü yönlerinizi görünür kılın, en güzel yarınları birlikte kuralım.',
  finalPrimary: 'Ücretsiz Başvur',
  finalSecondary: 'Daha Fazla',

  footerLabel: 'STK Başvuru',

  tools: {
    grants: {
      title: 'Hibeler ve Fonlar',
      description:
        'hangel, yüzlerce hibe ve fon veren ulusal ve uluslararası kurumu sizin yerinize sürekli tarar, her 10 günde bir günceller ve kurumunuza en uygun fonları yüzdelik uyumla öne çıkarır. Tümü panelinizde listelenir; başvuru taslaklarınızı bile hazırlar.',
    },
    transparency: {
      title: 'Şeffaflık Endeksi',
      description:
        'Yasal belge ve raporlarınızı yükleyerek 0–100 şeffaflık puanı kazanın; profilinizde halka açık görünür.',
    },
    donation: {
      title: 'hangel Bağışı',
      description:
        'Destekçilerin anlaşmalı markalardan alışverişi düzenli gelire döner; marka, işlem ve komisyonu panelden takip edin.',
    },
    volunteer: {
      title: 'Gönüllülük Yönetimi',
      description:
        'Yetenek bazlı ilan açın; gönüllülere otomatik yüzde uyum eşleştirmesi yapılır, başvuruları tek ekrandan yönetin.',
    },
    demographics: {
      title: 'Demografi Analizi',
      description:
        'Destekçi tabanınızın yaş, şehir, meslek ve ilgi dağılımını canlı grafiklerle görün.',
    },
    messaging: {
      title: 'SMS ve E-posta Gönderimi',
      description:
        'Segment veya CSV alıcılara kotaya dayalı toplu SMS ve mail gönderin; değişkenlerle kişiselleştirin. Kontör paketleri dahil.',
    },
    website: {
      title: 'Web Sitesi Yönetimi',
      description:
        'Kodsuz, markanıza özel kurumsal web sitesi; ücretsiz alan adı ya da kendi alan adınızla yayınlayın.',
    },
    events: {
      title: 'Etkinlik Yönetimi',
      description:
        'Fiziksel veya online etkinlik oluşturun; kayıt ve RSVP alın, yaka kartı üretin, katılımcıları yönetin.',
    },
    impact: {
      title: 'Etki Hikayesi',
      description:
        'Proje ve etki anlatınızı yayınlayın; hangel akışında destekçilerinize görünür olun.',
    },
    inbox: {
      title: 'Gelen Kutusu ve Destekçi Mesajlaşma',
      description:
        'Destekçilerinizle iki yönlü yazışın; tüm sohbetleri tek gelen kutusunda toplayın.',
    },
    invite: {
      title: 'Topluluğunu Davet Et',
      description:
        'Cihaz rehberinizden kişileri içe aktarın (native) ve topluluğunuzu toplu davet edin.',
    },
    roles: {
      title: 'Yetkili Yönetimi',
      description:
        'Ekip üyelerine kapsam bazlı roller verin: Genel Yönetici, Gönüllü Koordinatörü, Mali İşler ve daha fazlası.',
    },
    presence: {
      title: 'STK Profili, Gönderiler ve Bildirimler',
      description:
        'Profil QR kodu, akış gönderileri ve bildirim merkezi ile kurumunuzu görünür ve güncel tutun.',
    },
    ads: {
      title: 'Reklam Yönetimi',
      description:
        'Google, Meta, TikTok ve Google Ad Grants için reklam kurulum sihirbazı; AI reklam metni ve landing önerisi. Onay sürecindedir.',
    },
    callCenter: {
      title: 'Çağrı Merkezi (Sanal Santral)',
      description:
        'Tarayıcıdan kulaklıkla arama yapın — kendi hattınızı bağlayın. Gelen/giden çağrı, görüşme notu, sonuç ve kayıt tek panelde; cevapsızlar listelenir.',
    },
    contactCenter: {
      title: "İletişim Merkezi (WhatsApp'tan Çağrıya)",
      description:
        "Gönüllülerinize hazır WhatsApp şablonlarıyla ulaşın; 'Evet' diyenler otomatik çağrı sırasına düşer, 'Hayır' diyene randevu kurulur, operatör tek tıkla arar.",
    },
    applicantProfile: {
      title: 'Başvuran İletişimi & Tam Profil',
      description:
        'Her başvuranın tam gönüllü profilini görün; telefon ya da e-postayla tek dokunuşla ulaşın. KVKK-uyumlu: yalnızca iletişim bilgisi paylaşılır.',
    },
    bulkApprove: {
      title: 'Toplu Onay & CSV Dışa Aktarım',
      description:
        'Onay kutularıyla yüzlerce başvuruyu aynı anda onaylayın ya da reddedin; başvuranları tek tıkla CSV/Excel olarak dışa aktarın.',
    },
    duplicateListing: {
      title: 'İlan Kopyalama',
      description:
        'Bir etkinliği ya da gönüllülük ilanını tek dokunuşla çoğaltın; kopyayı anında düzenleyip yayınlayın. Tekrarlayan ilanlar dakikalar yerine saniyeler.',
    },
    applicationAnalytics: {
      title: 'Başvuru Analitiği',
      description:
        'İlan bazında zaman içindeki başvuru grafiği ve dönüşüm mini-grafikleriyle hangi ilanın işe yaradığını canlı görün.',
    },
    hoursImpact: {
      title: 'Gönüllü Saat & Etki Raporu',
      description:
        'Gönüllü başına saatleri ve sosyal etki değerini (TL) izleyin; SROI-hazır raporlarla ürettiğiniz değeri sayısal olarak kanıtlayın.',
    },
    eventPhotos: {
      title: 'Etkinlik & Gönüllülük Fotoğrafları',
      description:
        'Yükle/indir/paylaş ve QR ile fotoğraf galerisi; "selfie ile bul" yüz eşleştirmesiyle katılımcılar kendi fotoğraflarını saniyeler içinde bulur.',
    },
    multiLocation: {
      title: 'Çok Noktalı Etkinlikler',
      description:
        'Tek etkinliğe ya da gönüllülüğe birden fazla konum ekleyin; her noktanın kendi QR kodu ve başvuru butonu olur. Şehir şehir tek panelden yönetin.',
    },
    corporateParticipants: {
      title: 'Kurumsal Katılımcılar',
      description:
        'Belediye, valilik, marka, üniversite ve STK\'lar etkinliğinize kurumsal katılımcı olarak başvurur; onayınızla profilinizde ve etkinlikte yayınlanır.',
    },
  },

  soon: {
    crm: {
      title: 'CRM Entegrasyonu',
      description: 'Destekçi ilişkilerini dış CRM sistemlerinizle bağlayın.',
    },
    accounting: {
      title: 'Ön Muhasebe Entegrasyonu',
      description: 'Mali kayıtlarınızı ön muhasebe araçlarıyla senkronize edin.',
    },
    pos: {
      title: 'POS ve Ödeme Sistemleri',
      description: 'Saha ve online tahsilat için POS ile ödeme altyapısı.',
    },
    meeting: {
      title: 'Online Eğitim ve Toplantı',
      description: 'Gönüllü ve ekip için online eğitim ile toplantı araçları.',
    },
    design: {
      title: 'Tasarım Programları',
      description: 'Kurumsal görseller için entegre tasarım araçları.',
    },
    marketing: {
      title: 'Pazarlama İletişimi',
      description: 'Kampanya ve pazarlama iletişimi için bütünleşik araçlar.',
    },
    analytics: {
      title: 'Web Analiz Araçları',
      description: 'Web sitenizin ziyaretçi ve performans analizini izleyin.',
    },
  },
};

/* ----------------------------- EN içerik ----------------------------- */

const EN: typeof TR = {
  navLabel: 'hangel NGO',
  navCta: 'Apply Free',
  back: 'Home',

  heroEyebrow: 'hangel NGO — NGO Management Software',
  heroTitle: 'Show the world your organization’s greatest strength.',
  heroSubtitle: 'Trust, resources and volunteer power. All in one panel, completely free.',
  heroDescription:
    'hangel is an integrated NGO management platform, tailored to Türkiye, for associations and foundations. Prove your trust with a transparency index, build steady resources through grants and donations, match the right people to the right roles with volunteer management, and crown every effort with a certificate — all from a single panel. Setup takes minutes, your data is safe, and the whole process is transparent end to end. Your organization’s digital transformation starts today.',
  heroImage:
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2400&auto=format&fit=crop',
  heroPrimary: 'Apply Free',
  heroLink: 'Learn More',

  transparencyEyebrow: 'Transparency Index',
  transparencyTitle: 'Trust, now measurable.',
  transparencyDescription:
    'Upload your legal documents and activity reports; let your organization earn a transparency score from 0 to 100. This score appears publicly on your profile, proves trust to your supporters and sets your organization apart. Make transparency your greatest strength.',

  donationEyebrow: 'hangel Donation',
  donationTitle: 'Every purchase turns into steady giving.',
  donationDescription:
    'Every time your supporters shop at partner brands, income flows to your organization — with nothing extra out of their pocket. Track brand, transaction and commission details transparently from your panel and turn your funding into a steady stream.',

  volunteerEyebrow: 'Volunteer Management',
  volunteerTitle: 'The right volunteer meets the right role.',
  volunteerDescription:
    'Post skill-based listings. hangel automatically computes a percentage match for each volunteer, surfaces the best candidates and lets you manage every application from a single screen. Grow your volunteer power.',

  certificatesEyebrow: 'Certificates & Badges',
  certificatesTitle: 'Let every effort be crowned with a certificate.',
  certificatesDescription:
    "Generate automatic participation and achievement certificates and name badges for your volunteers in one click, with your organization's logo. Every month your organization earns an automatic impact certificate combining total donations, volunteer hours and social impact value. This document becomes the clearest proof of your strengths at a single glance. Reward volunteer loyalty with badges and your own custom badges.",

  compareTransparency:
    'Worldwide, transparency ratings and shop-to-donate equivalents are often paid and fragmented. On hangel, this is tailored to Türkiye, free, and in a single panel.',

  toolsEyebrow: 'One Panel',
  toolsTitle: "Your organization's every job, in one panel.",
  toolsDescription:
    'Live tools designed for your entire operation — from donations and grants to volunteer management, transparency to event management. Everything you need to take your NGO digital.',

  soonEyebrow: 'Roadmap',
  soonTitle: 'Coming soon to your panel.',
  soonDescription:
    'Modules in preparation, marked "coming soon" in the admin panel. Not yet available; they will appear in your panel automatically once ready.',

  finalEyebrow: 'Get Started',
  finalTitle: 'Start your digital transformation today.',
  finalSubtitle: 'Applying is free. Setup takes minutes. No credit card required.',
  finalDescription:
    'Join the movement thousands of organizations are already part of. Register your organization with hangel in minutes; start growing your trust, resources, volunteer power and impact today. Make your greatest strengths visible, and let’s build brighter tomorrows, together.',
  finalPrimary: 'Apply Free',
  finalSecondary: 'Learn More',

  footerLabel: 'NGO Application',

  tools: {
    grants: {
      title: 'Grants and Funds',
      description:
        'hangel continuously scans hundreds of national and international grant- and fund-giving institutions for you, refreshes every 10 days and surfaces the funds best suited to your organization with a percentage match. All of them are listed in your panel — it even prepares your application drafts.',
    },
    transparency: {
      title: 'Transparency Index',
      description:
        'Upload legal documents and reports to earn a 0–100 transparency score; it appears publicly on your profile.',
    },
    donation: {
      title: 'hangel Donation',
      description:
        "Supporters' shopping at partner brands turns into steady income; track brand, transaction and commission from the panel.",
    },
    volunteer: {
      title: 'Volunteer Management',
      description:
        'Open skill-based listings; volunteers get an automatic percentage match, and you manage applications from one screen.',
    },
    demographics: {
      title: 'Demographic Analysis',
      description:
        "View your supporter base's age, city, profession and interest distribution with live charts.",
    },
    messaging: {
      title: 'SMS and Email Delivery',
      description:
        'Send quota-based bulk SMS and mail to segment or CSV recipients; personalize with variables. Credit packages included.',
    },
    website: {
      title: 'Website Management',
      description:
        'A code-free, brand-specific corporate website; publish with a free domain or your own domain.',
    },
    events: {
      title: 'Event Management',
      description:
        'Create physical or online events; collect registrations and RSVPs, generate name badges, manage attendees.',
    },
    impact: {
      title: 'Impact Story',
      description:
        'Publish your project and impact narrative; become visible to your supporters in the hangel feed.',
    },
    inbox: {
      title: 'Inbox and Supporter Messaging',
      description:
        'Exchange two-way messages with your supporters; collect all conversations in a single inbox.',
    },
    invite: {
      title: 'Invite Your Community',
      description:
        'Import contacts from your device address book (native) and bulk-invite your community.',
    },
    roles: {
      title: 'Authorization Management',
      description:
        'Give team members scope-based roles: General Manager, Volunteer Coordinator, Finance and more.',
    },
    presence: {
      title: 'NGO Profile, Posts and Notifications',
      description:
        'Keep your organization visible and up to date with a profile QR code, feed posts and a notification center.',
    },
    ads: {
      title: 'Ad Management',
      description:
        'A setup wizard for Google, Meta, TikTok and Google Ad Grants; AI ad copy and landing suggestions. Pending approval.',
    },
    callCenter: {
      title: 'Call Center (Virtual PBX)',
      description:
        'Call right from your browser with a headset — bring your own line. Inbound/outbound calls, notes, dispositions and recordings in one panel; missed calls tracked.',
    },
    contactCenter: {
      title: 'Contact Center (WhatsApp to Call)',
      description:
        "Reach volunteers with ready WhatsApp templates; 'Yes' replies drop into the call queue automatically, 'No' replies get a callback appointment, your operator calls in one click.",
    },
    applicantProfile: {
      title: 'Applicant Contact & Full Profile',
      description:
        "See each applicant's full volunteer profile and reach them by phone or email in one tap. KVKK-compliant: only contact details are shared.",
    },
    bulkApprove: {
      title: 'Bulk Approval & CSV Export',
      description:
        'Approve or reject hundreds of applications at once with checkboxes, and export applicants to CSV/Excel in a single click.',
    },
    duplicateListing: {
      title: 'Duplicate Listing',
      description:
        'Duplicate an event or volunteering listing in one tap, then edit and publish the copy instantly. Recurring listings in seconds, not minutes.',
    },
    applicationAnalytics: {
      title: 'Application Analytics',
      description:
        'See live applications-over-time charts and conversion mini-charts per listing, so you know which listing is actually working.',
    },
    hoursImpact: {
      title: 'Volunteer Hours & Impact Report',
      description:
        'Track hours and social impact value (TRY) per volunteer; prove the value you create in numbers with SROI-ready reports.',
    },
    eventPhotos: {
      title: 'Event & Volunteering Photos',
      description:
        'A photo gallery with upload/download/share and QR; with "find by selfie" face matching, participants find their own photos in seconds.',
    },
    multiLocation: {
      title: 'Multi-Location Events',
      description:
        'Add multiple locations to a single event or volunteering listing; each point gets its own QR code and apply button. Manage city by city from one panel.',
    },
    corporateParticipants: {
      title: 'Corporate Participants',
      description:
        'Municipalities, governorships, brands, universities and NGOs apply to your event as corporate participants; once you approve, they appear on your profile and the event.',
    },
  },

  soon: {
    crm: {
      title: 'CRM Integration',
      description: 'Connect supporter relations with your external CRM systems.',
    },
    accounting: {
      title: 'Pre-Accounting Integration',
      description: 'Sync your financial records with pre-accounting tools.',
    },
    pos: {
      title: 'POS and Payment Systems',
      description: 'POS and payment infrastructure for field and online collection.',
    },
    meeting: {
      title: 'Online Training and Meetings',
      description: 'Online training and meeting tools for volunteers and teams.',
    },
    design: {
      title: 'Design Programs',
      description: 'Integrated design tools for your corporate visuals.',
    },
    marketing: {
      title: 'Marketing Communication',
      description: 'Integrated tools for campaigns and marketing communication.',
    },
    analytics: {
      title: 'Web Analytics Tools',
      description: 'Monitor your website visitor and performance analytics.',
    },
  },
};

/* ----------------------------- Sayfa ----------------------------- */

export default function NgoOnboardingPage() {
  const { language } = useTranslation();
  const C = language === 'en' ? EN : TR;
  const cms = useWebPage(SLUG);

  const heroTitle = cms.title || C.heroTitle;
  const heroSubtitle = cms.subtitle || C.heroSubtitle;
  const heroDescription = cms.description || C.heroDescription;
  const heroImage = cms.heroImageUrl || C.heroImage;

  const liveTools: FeatureItem[] = [
    { icon: ShieldCheck, title: C.tools.transparency.title, description: C.tools.transparency.description, badge: { kind: 'hangel' }, href: '/features/seffaflik-endeksi' },
    { icon: HandCoins, title: C.tools.donation.title, description: C.tools.donation.description, badge: { kind: 'hangel' } },
    { icon: HeartHandshake, title: C.tools.volunteer.title, description: C.tools.volunteer.description, badge: { kind: 'hangel' }, href: '/features/gonulluluk-yonetimi' },
    { icon: Landmark, title: C.tools.grants.title, description: C.tools.grants.description, badge: { kind: 'yeni' } },
    { icon: BarChart3, title: C.tools.demographics.title, description: C.tools.demographics.description, href: '/features/demografi-analizi' },
    { icon: MessageSquare, title: C.tools.messaging.title, description: C.tools.messaging.description, badge: { kind: 'yeni' }, href: '/features/toplu-mesajlasma' },
    { icon: Globe, title: C.tools.website.title, description: C.tools.website.description, href: '/features/web-sitesi' },
    { icon: CalendarDays, title: C.tools.events.title, description: C.tools.events.description, badge: { kind: 'yeni' }, href: '/features/etkinlik-yonetimi' },
    { icon: Sparkles, title: C.tools.impact.title, description: C.tools.impact.description },
    { icon: Inbox, title: C.tools.inbox.title, description: C.tools.inbox.description },
    { icon: UserPlus, title: C.tools.invite.title, description: C.tools.invite.description },
    { icon: Users, title: C.tools.roles.title, description: C.tools.roles.description },
    { icon: QrCode, title: C.tools.presence.title, description: C.tools.presence.description },
    { icon: Megaphone, title: C.tools.ads.title, description: C.tools.ads.description, badge: { kind: 'beta' } },
    { icon: PhoneCall, title: C.tools.callCenter.title, description: C.tools.callCenter.description, badge: { kind: 'beta' }, href: '/features/sanal-santral' },
    { icon: MessageCircle, title: C.tools.contactCenter.title, description: C.tools.contactCenter.description, badge: { kind: 'beta' } },
    { icon: IdCard, title: C.tools.applicantProfile.title, description: C.tools.applicantProfile.description, badge: { kind: 'yeni' } },
    { icon: ListChecks, title: C.tools.bulkApprove.title, description: C.tools.bulkApprove.description, badge: { kind: 'yeni' } },
    { icon: Copy, title: C.tools.duplicateListing.title, description: C.tools.duplicateListing.description, badge: { kind: 'yeni' } },
    { icon: TrendingUp, title: C.tools.applicationAnalytics.title, description: C.tools.applicationAnalytics.description, badge: { kind: 'yeni' } },
    { icon: Timer, title: C.tools.hoursImpact.title, description: C.tools.hoursImpact.description, badge: { kind: 'yeni' } },
    { icon: Camera, title: C.tools.eventPhotos.title, description: C.tools.eventPhotos.description, badge: { kind: 'yeni' } },
    { icon: MapPinned, title: C.tools.multiLocation.title, description: C.tools.multiLocation.description, badge: { kind: 'yeni' } },
    { icon: Building2, title: C.tools.corporateParticipants.title, description: C.tools.corporateParticipants.description, badge: { kind: 'yeni' } },
  ];

  const soonTools: FeatureItem[] = [
    { icon: Database, title: C.soon.crm.title, description: C.soon.crm.description, badge: { kind: 'yakinda' } },
    { icon: Calculator, title: C.soon.accounting.title, description: C.soon.accounting.description, badge: { kind: 'yakinda' } },
    { icon: CreditCard, title: C.soon.pos.title, description: C.soon.pos.description, badge: { kind: 'yakinda' } },
    { icon: Video, title: C.soon.meeting.title, description: C.soon.meeting.description, badge: { kind: 'yakinda' } },
    { icon: Palette, title: C.soon.design.title, description: C.soon.design.description, badge: { kind: 'yakinda' } },
    { icon: Send, title: C.soon.marketing.title, description: C.soon.marketing.description, badge: { kind: 'yakinda' } },
    { icon: LineChart, title: C.soon.analytics.title, description: C.soon.analytics.description, badge: { kind: 'yakinda' } },
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
      <MarketingNav
        label={C.navLabel}
        ctaLabel={C.navCta}
        ctaHref={REGISTER_HREF}
        backLabel={C.back}
      />

      {/* Hero */}
      <AppleSection
        id="hero"
        eyebrow={C.heroEyebrow}
        title={heroTitle}
        subtitle={heroSubtitle}
        description={heroDescription}
        image={{ url: heroImage, hint: 'ngo team collaboration' }}
        actions={[
          { label: C.heroPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.heroLink, href: '#tek-panel', variant: 'link' },
        ]}
      />

      {/* Statement: Şeffaflık (dark) */}
      <AppleSection
        id="seffaflik"
        theme="dark"
        eyebrow={C.transparencyEyebrow}
        title={C.transparencyTitle}
        description={C.transparencyDescription}
        badges={[{ kind: 'hangel' }]}
        image={{ url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2400&auto=format&fit=crop', hint: 'transparent reports dashboard' }}
      />

      {/* Statement: hangel Bağışı (light) */}
      <AppleSection
        id="hangel-bagisi"
        eyebrow={C.donationEyebrow}
        title={C.donationTitle}
        description={C.donationDescription}
        badges={[{ kind: 'hangel' }]}
        image={{ url: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2400&auto=format&fit=crop', hint: 'shopping to donation flow' }}
      />

      {/* Statement: Gönüllülük (dark) */}
      <AppleSection
        id="gonulluluk"
        theme="dark"
        eyebrow={C.volunteerEyebrow}
        title={C.volunteerTitle}
        description={C.volunteerDescription}
        badges={[{ kind: 'hangel' }]}
        image={{ url: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?q=80&w=2400&auto=format&fit=crop', hint: 'volunteers matching skills' }}
      />

      {/* Statement: Sertifikalar & Rozetler (light) */}
      <AppleSection
        id="sertifikalar"
        eyebrow={C.certificatesEyebrow}
        title={C.certificatesTitle}
        description={C.certificatesDescription}
        badges={[{ kind: 'hangel' }]}
        image={{ url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2400&auto=format&fit=crop', hint: 'certificate award ceremony' }}
      />

      {/* Tek panelde her şey — live tools */}
      <section id="tek-panel" className="bg-[#f5f5f7] py-24 border-b border-black/5">
        <SectionHeading
          eyebrow={C.toolsEyebrow}
          title={C.toolsTitle}
          description={C.toolsDescription}
        />
        <FeatureGrid items={liveTools} columns={3} />
        <CompareNote>{C.compareTransparency}</CompareNote>
      </section>

      {/* Yakında */}
      <section id="yakinda" className="bg-white py-24 border-b border-black/5">
        <SectionHeading
          eyebrow={C.soonEyebrow}
          title={C.soonTitle}
          description={C.soonDescription}
        />
        <FeatureGrid items={soonTools} columns={4} />
      </section>

      {/* Final CTA (dark) */}
      <AppleSection
        id="basla"
        theme="dark"
        eyebrow={C.finalEyebrow}
        title={C.finalTitle}
        subtitle={C.finalSubtitle}
        description={C.finalDescription}
        actions={[
          { label: C.finalPrimary, href: REGISTER_HREF, variant: 'primary' },
          { label: C.finalSecondary, href: '#tek-panel', variant: 'secondary' },
        ]}
      />

      <PublicFooter currentPageLabel={C.footerLabel} />
    </div>
  );
}
