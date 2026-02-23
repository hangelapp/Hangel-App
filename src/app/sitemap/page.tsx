
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PublicFooter } from '@/components/layout/public-footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SitemapGroup = ({ title, links }: { title: string, links: { label: string, href: string, indent?: number }[] }) => (
    <div className="space-y-6">
        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#1d1d1f] border-b border-black/5 pb-2">{title}</h3>
        <nav className="flex flex-col gap-y-3">
            {links.map((link) => (
                <Link 
                    key={link.label} 
                    href={link.href} 
                    className={cn(
                        "text-sm md:text-base text-[#1d1d1f]/70 hover:text-primary transition-colors flex items-center group",
                        link.indent === 1 && "ml-6",
                        link.indent === 2 && "ml-12",
                        link.indent === 3 && "ml-16",
                        link.indent === 4 && "ml-20"
                    )}
                >
                    <span dangerouslySetInnerHTML={{ __html: link.label.replace(/ /g, '&nbsp;') }} />
                    <ChevronRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
            ))}
        </nav>
    </div>
);

export default function SitemapPage() {
    const router = useRouter();

    const mainPages = [
        { label: "1. WEB - Karşılama ve Kurumsal", href: "/login" },
        { label: "2. APP - Zaman Tüneli (Ana Akış)", href: "/timeline" },
        { label: "2. APP - Market (Alışverişle Bağış)", href: "/market" },
        { label: "2. APP - Gönüllülük (İmece)", href: "/volunteering" },
        { label: "2. APP - Etkinlikler", href: "/events" },
        { label: "2. APP - Cüzdanım (QR Ödeme)", href: "/qr-payment" },
        { label: "2. APP - Acil Durum Merkezi", href: "/emergency" },
        { label: "2. APP - Kütüphane", href: "/library" },
        { label: "3. NGO ADMIN - Kontrol Paneli", href: "/ngo-admin/dashboard" },
        { label: "4. SUPER ADMIN - Ana Sayfa", href: "/super-admin" },
        { label: "5. DERNEK - hangel derneği", href: "/hangelassociation" },
    ];

    const allPagesSections = [
        {
            title: "1- WEB (Bilgi İçerikli ve Kurumsal Portal)",
            links: [
                { label: "1.1 Ana Sayfa", href: "/login" },
                { label: "1.2 Kurumsal", href: "/about" },
                { label: "1.2.1 Biz Kimiz?", href: "/about", indent: 1 },
                { label: "1.2.2 Sürdürülebilirlik (Sosyal Etki)", href: "/social-impact", indent: 1 },
                { label: "1.2.3 Basın Odası", href: "/press", indent: 1 },
                { label: "1.2.4 Yatırımcı İlişkileri", href: "/yatirimci-iliskileri", indent: 1 },
                { label: "1.2.5 Kariyer", href: "/careers", indent: 1 },
                { label: "1.2.6 Sosyal Girişimcilik", href: "/social-entrepreneurship", indent: 1 },
                { label: "1.3 Yasal & Standartlar", href: "/bilgi-toplumu-hizmetleri" },
                { label: "1.3.1 Bilgi Toplumu Hizmetleri", href: "/bilgi-toplumu-hizmetleri", indent: 1 },
                { label: "1.3.2 Erişilebilirlik Beyanı", href: "/accessibility", indent: 1 },
                { label: "1.3.3 Kalite Standartlarımız", href: "/standards", indent: 1 },
                { label: "1.3.4 Logo ve Marka Kullanımı", href: "/logo-usage", indent: 1 },
                { label: "1.3.5 Site Haritası", href: "/sitemap", indent: 1 },
                { label: "1.4 Bilgi & Destek", href: "/support" },
                { label: "1.4.1 Destek Merkezi", href: "/support", indent: 1 },
                { label: "1.4.2 Uygulama Desteği (SSS)", href: "/support/app-support", indent: 1 },
                { label: "1.4.3 Geri Bildirim", href: "/feedback", indent: 1 },
                { label: "1.5 İş Birlikleri (Kayıt ve Bilgi)", href: "/corporate" },
                { label: "1.5.1 Üye İşyeri Avantajları", href: "/merchant", indent: 1 },
                { label: "1.5.2 STK Kayıt Bilgileri", href: "/ngo-onboarding", indent: 1 },
                { label: "1.5.3 Kampüs Avantajları (Kulüpler)", href: "/campus-advantages", indent: 1 },
                { label: "1.5.4 Kamu İş Birliği Modelleri", href: "/corporate", indent: 1 },
                { label: "1.6 Kayıt & Giriş İşlemleri", href: "/login/selection" },
                { label: "1.6.1 Giriş Yap / Kayıt Ol", href: "/login/selection", indent: 1 },
                { label: "1.6.2 Tanıtım Turu (Onboarding)", href: "/onboarding", indent: 1 },
            ]
        },
        {
            title: "2- APP (Kullanıcı Deneyimi ve Sosyal Etki)",
            links: [
                { label: "2.1 Ana Gezinti", href: "/timeline" },
                { label: "2.1.1 Zaman Tüneli (Akış)", href: "/timeline", indent: 1 },
                { label: "2.1.2 Market (Markalar)", href: "/market", indent: 1 },
                { label: "2.1.3 Gönüllülük (İmece)", href: "/volunteering", indent: 1 },
                { label: "2.1.4 Öğrenci Kulüpleri", href: "/clubs", indent: 1 },
                { label: "2.1.5 Etkinlik Takvimi", href: "/events", indent: 1 },
                { label: "2.1.6 Cüzdanım (Ödemeler)", href: "/qr-payment", indent: 1 },
                { label: "2.1.7 Acil Durum Merkezi", href: "/emergency", indent: 1 },
                { label: "2.1.8 Liderlik Tablosu", href: "/leaderboard", indent: 1 },
                { label: "2.1.9 Etki Hikayeleri", href: "/stories", indent: 1 },
                { label: "2.1.10 Arkadaş Davet Et", href: "/invite", indent: 1 },
                { label: "2.2 Kütüphane & Kaynaklar", href: "/library" },
                { label: "2.2.1 Veri Kütüphanesi", href: "/library", indent: 1 },
                { label: "2.2.2 Sosyal Etki Raporları", href: "/library", indent: 1 },
                { label: "2.2.3 Akademik Yayınlar", href: "/library", indent: 1 },
                { label: "2.2.4 Filmler & Belgeseller", href: "/library", indent: 1 },
                { label: "2.2.5 Kitaplar", href: "/library", indent: 1 },
                { label: "2.2.6 Sivil Toplum Sözlüğü", href: "/library", indent: 1 },
                { label: "2.2.7 Hangel Sözlük", href: "/library", indent: 1 },
                { label: "2.3 Kullanıcı Hesabı", href: "/profile" },
                { label: "2.3.1 Profilim (Etki & Puan)", href: "/profile", indent: 1 },
                { label: "2.3.2 Bağış Geçmişim", href: "/my-donations", indent: 1 },
                { label: "2.3.3 Başvurularım", href: "/my-applications", indent: 1 },
                { label: "2.3.4 Rozetlerim & Sertifikalarım", href: "/my-badges", indent: 1 },
                { label: "2.3.5 Mesajlarım", href: "/messages", indent: 1 },
                { label: "2.4 Ayarlar ve Tercihler", href: "/settings" },
                { label: "2.4.1 Kişisel Bilgi Ayarları", href: "/settings/profile", indent: 1 },
                { label: "2.4.2 Gönüllülük Yetkinlikleri", href: "/settings/volunteer", indent: 1 },
                { label: "2.4.3 Cüzdan & Kart Yönetimi", href: "/settings/wallet", indent: 1 },
                { label: "2.4.4 Güvenlik & Şifre", href: "/settings/security", indent: 1 },
                { label: "2.4.5 Desteklenen STK Seçimi", href: "/settings/ngo-selection", indent: 1 },
                { label: "2.4.6 Gönüllü Olunan STK Seçimi", href: "/settings/volunteer-ngo-selection", indent: 1 },
                { label: "2.4.7 Bildirim Ayarları", href: "/settings/notifications", indent: 1 },
                { label: "2.4.8 Görünüm & Tema", href: "/settings/theme", indent: 1 },
                { label: "2.4.9 Dil Seçimi", href: "/settings/language", indent: 1 },
                { label: "2.4.10 Erişilebilirlik Ayarları", href: "/settings/accessibility", indent: 1 },
                { label: "2.4.11 Gizlilik Ayarları", href: "/settings/privacy", indent: 1 },
                { label: "2.4.12 Sözleşmeler & Politikalar", href: "/settings/contracts", indent: 1 },
                { label: "2.4.12.1 Kullanıcı Sözleşmesi", href: "/settings/contracts/kullanici-sozlesmesi", indent: 2 },
                { label: "2.4.12.2 Kuruluş Sözleşmesi", href: "/settings/contracts/kurulus-sozlesmesi", indent: 2 },
                { label: "2.4.12.3 Gönüllülük Sözleşmesi", href: "/settings/contracts/gonulluluk-sozlesmesi", indent: 2 },
                { label: "2.4.12.4 Gönüllü Hakları Beyanı", href: "/settings/contracts/gonullu-haklari-beyannamesi", indent: 2 },
                { label: "2.4.12.5 Gizlilik Politikası", href: "/settings/contracts/gizlilik-politikasi", indent: 2 },
                { label: "2.4.12.6 KVKK Aydınlatma Metni", href: "/settings/contracts/kvkk-aydinlatma-metni", indent: 2 },
                { label: "2.4.12.7 Açık Rıza Metni", href: "/settings/contracts/acik-riza-metni", indent: 2 },
                { label: "2.4.12.8 Veri Saklama ve İmha", href: "/settings/contracts/veri-saklama-ve-imha-politikasi", indent: 2 },
                { label: "2.4.12.9 GDPR Uyum Politikası", href: "/settings/contracts/gdpr-uyum-politikasi", indent: 2 },
                { label: "2.4.12.10 Veri İşleme Beyanı", href: "/settings/contracts/veri-isleme-amaclar-beyani", indent: 2 },
                { label: "2.4.12.11 Kullanıcı Hakları Politikası", href: "/settings/contracts/kullanici-haklari-politikasi", indent: 2 },
                { label: "2.4.12.12 DPO Tanımı", href: "/settings/contracts/dpo-tanimi", indent: 2 },
                { label: "2.4.12.13 Veri İhlali Prosedürü", href: "/settings/contracts/veri-ihlali-bildirim-proseduru", indent: 2 },
                { label: "2.4.12.14 Hosting Beyanı", href: "/settings/contracts/veri-transferi-ve-hosting-beyani", indent: 2 },
                { label: "2.4.12.15 Çerez Politikası", href: "/settings/contracts/cerez-politikasi", indent: 2 },
                { label: "2.4.12.16 Bilgi Güvenliği Politikası", href: "/settings/contracts/bilgi-guvenligi-politikasi", indent: 2 },
                { label: "2.4.12.17 COPPA Uyumu", href: "/settings/contracts/cocuklarin-verilerinin-korunmasi", indent: 2 },
                { label: "2.4.12.18 CCPA/CPRA Politikası", href: "/settings/contracts/abd-eyalet-bazli-veri-politikasi", indent: 2 },
                { label: "2.4.12.19 Ülke Bazlı Veri Uyumu", href: "/settings/contracts/ulke-bazli-veri-koruma-uyum-beyani", indent: 2 },
                { label: "2.4.12.20 LGPD Veri Koruma Beyanı", href: "/settings/contracts/lgpd-veri-koruma-beyani", indent: 2 },
                { label: "2.4.12.21 AI Şeffaflık Beyanı", href: "/settings/contracts/yapay-zeka-seffaflik-beyani", indent: 2 },
                { label: "2.4.12.22 Sosyal Etki Politikası", href: "/settings/contracts/sosyal-etki-politikasi", indent: 2 },
                { label: "2.4.12.23 Sosyal Etki Metodolojisi", href: "/settings/contracts/sosyal-etki-metodolojisi", indent: 2 },
                { label: "2.4.12.24 Açık Sosyal Girişim Beyanı", href: "/settings/contracts/acik-sosyal-girisim-beyani", indent: 2 },
                { label: "2.4.12.25 Bağış ve Yardım Politikası", href: "/settings/contracts/bagis-ve-yardim-politikasi", indent: 2 },
                { label: "2.4.12.26 Bağışçı Hakları Beyannamesi", href: "/settings/contracts/bagisci-haklari-beyannamesi", indent: 2 },
                { label: "2.4.12.27 Bağış Denetimi Politikası", href: "/settings/contracts/bagis-gelirlerinin-denetlenmesi-politikasi", indent: 2 },
                { label: "2.4.12.28 Finansal Şeffaflık Politikası", href: "/settings/contracts/finansal-seffaflik-ve-hesap-verebilirlik-politikasi", indent: 2 },
                { label: "2.4.12.29 Kâr Dağıtım Politikası", href: "/settings/contracts/kar-dagitim-politikasi", indent: 2 },
                { label: "2.4.12.30 Ücret Politikası", href: "/settings/contracts/ucret-politikasi", indent: 2 },
                { label: "2.4.12.31 ABD IRS Bağış Beyanı", href: "/settings/contracts/abd-irs-bagis-beyani", indent: 2 },
                { label: "2.4.12.32 Çevresel Sorumluluk", href: "/settings/contracts/cevresel-sorumluluk-politikasi", indent: 2 },
                { label: "2.4.12.33 AML / CFT Uyum Beyanı", href: "/settings/contracts/aml-cft-uyum-beyani", indent: 2 },
                { label: "2.4.12.34 Etik Bağış Beyanı", href: "/settings/contracts/etik-bagis-ve-fon-kullanimi-beyani", indent: 2 },
                { label: "2.4.12.35 Açık Veri Politikası", href: "/settings/contracts/acik-veri-ve-etki-verisi-paylasim-politikasi", indent: 2 },
                { label: "2.4.12.36 Etik İlkeler", href: "/settings/contracts/etik-ilkeler", indent: 2 },
                { label: "2.4.12.37 Çıkar Çatışması Politikası", href: "/settings/contracts/cikar-catismasi-politikasi", indent: 2 },
                { label: "2.4.12.38 Whistleblower Politikası", href: "/settings/contracts/whistleblower-politikasi", indent: 2 },
                { label: "2.4.12.39 Yönetişim İlkeleri", href: "/settings/contracts/yonetim-ve-kurumsal-yonetisim-ilkeleri", indent: 2 },
                { label: "2.4.12.40 Kamu Yararı Beyanı", href: "/settings/contracts/kamu-yarari-ve-sosyal-fayda-beyani", indent: 2 },
                { label: "2.4.12.41 İnsan Hakları Politikası", href: "/settings/contracts/insan-haklari-politikasi", indent: 2 },
                { label: "2.4.12.42 DEI Politikası", href: "/settings/contracts/dei-politikasi", indent: 2 },
                { label: "2.4.12.43 Risk & Kriz Politikası", href: "/settings/contracts/risk-yonetimi-ve-kriz-mudahale-politikasi", indent: 2 },
                { label: "2.4.12.44 Erişilebilirlik Politikası", href: "/settings/contracts/erisilebilirlik-politikasi", indent: 2 },
                { label: "2.4.12.45 Bilgilendirme Politikası", href: "/settings/contracts/bilgilendirme-politikasi", indent: 2 },
                { label: "2.4.12.46 Çok Dilli Erişim Politikası", href: "/settings/contracts/cok-dilli-sozlesmeler-politikasi", indent: 2 },
                { label: "2.4.12.47 Yerel Bağış Mevzuat Uyumu", href: "/settings/contracts/yerel-bagis-mevzuatlarina-uyum-beyani", indent: 2 },
                { label: "2.4.12.48 Gelişim Yol Haritası", href: "/settings/contracts/gelisim-yol-haritasi-ve-standartlar", indent: 2 },
                { label: "2.4.12.49 ISO 27001 Uyum Beyanı", href: "/settings/contracts/iso-27001-uyum-beyani", indent: 2 },
                { label: "2.4.12.50 ISO 22301 Uyum Beyanı", href: "/settings/contracts/iso-22301-uyum-beyani", indent: 2 },
                { label: "2.4.12.51 ISO 25010 / EN 301 549 Uyum", href: "/settings/contracts/iso-25010-en-301-549-uyum-beyani", indent: 2 },
                { label: "2.4.12.52 Bağımsız Mali Denetim Beyanı", href: "/settings/contracts/bagimsiz-mali-denetim-ve-ifrs-gaap-beyani", indent: 2 },
                { label: "2.4.12.53 Sızma Testleri Beyanı", href: "/settings/contracts/sizma-ve-guvenlik-testleri-beyani", indent: 2 },
                { label: "2.4.12.54 UX Testleri Beyanı", href: "/settings/contracts/ux-ve-kullanici-deneyimi-testleri-beyani", indent: 2 },
                { label: "2.4.12.55 Felaket Kurtarma Beyanı", href: "/settings/contracts/felaket-kurtarma-ve-yedekleme-testleri-beyani", indent: 2 },
            ]
        },
        {
            title: "3- NGO ADMIN (Kurumsal Yönetim Paneli)",
            links: [
                { label: "3.1 Yönetim Paneli (Ana Sayfa)", href: "/ngo-admin/dashboard" },
                { label: "3.2 Kurumsal Profil & Görünürlük", href: "/ngo-admin/manage-profile" },
                { label: "3.2.1 Profili Güncelle", href: "/ngo-admin/manage-profile", indent: 1 },
                { label: "3.2.2 Profil QR Kodu", href: "/ngo-admin/qr", indent: 1 },
                { label: "3.2.3 Web Sitesi Oluşturucu", href: "/ngo-admin/website", indent: 1 },
                { label: "3.2.4 Web Sitesi Önizleme", href: "/ngo-admin/website/preview", indent: 1 },
                { label: "3.3 İletişim & Pazarlama", href: "/ngo-admin/notifications" },
                { label: "3.3.1 Gelen Kutusu (Mesajlar)", href: "/ngo-admin/notifications", indent: 1 },
                { label: "3.3.2 Yeni İletişim Oluştur", href: "/ngo-admin/notifications/new", indent: 1 },
                { label: "3.3.3 Gönderi (Mini Blog) Yönetimi", href: "/ngo-admin/posts", indent: 1 },
                { label: "3.3.4 Etki Hikayem (Story) Paneli", href: "/ngo-admin/impact-story", indent: 1 },
                { label: "3.3.5 SMS Gönderim Paneli", href: "/ngo-admin/sms", indent: 1 },
                { label: "3.3.6 E-Bülten / Mail Paneli", href: "/ngo-admin/mail", indent: 1 },
                { label: "3.3.7 Reklam & Görünürlük Yönetimi", href: "/ngo-admin/ads", indent: 1 },
                { label: "3.3.8 DM Mesajlaşma Merkezi", href: "/ngo-admin/dm", indent: 1 },
                { label: "3.4 Gönüllülük & Operasyon", href: "/ngo-admin/volunteer" },
                { label: "3.4.1 Gönüllülük Yönetimi", href: "/ngo-admin/volunteer", indent: 1 },
                { label: "3.4.2 Yeni Gönüllü İlanı", href: "/ngo-admin/volunteer/new", indent: 1 },
                { label: "3.4.3 Etkinlik & Mekan Yönetimi", href: "/ngo-admin/events", indent: 1 },
                { label: "3.4.4 Saha Ekip Yönetimi", href: "/ngo-admin/field-team", indent: 1 },
                { label: "3.4.5 Üniversite Gönüllülük Dersi", href: "/ngo-admin/university-volunteering", indent: 1 },
                { label: "3.4.6 Gönüllülük Portalı Entegrasyonu", href: "/ngo-admin/volunteer-portal", indent: 1 },
                { label: "3.5 Finans & Analiz", href: "/ngo-admin/donations" },
                { label: "3.5.1 Bağış Takibi (Hak Edişler)", href: "/ngo-admin/donations", indent: 1 },
                { label: "3.5.2 Hibeler ve Fonlar", href: "/ngo-admin/funds", indent: 1 },
                { label: "3.5.3 Ön Muhasebe & ERP Entegrasyonu", href: "/ngo-admin/accounting", indent: 1 },
                { label: "3.5.4 CRM Entegrasyonu", href: "/ngo-admin/crm", indent: 1 },
                { label: "3.5.5 İktisadi İşletme / Pazar Yeri", href: "/ngo-admin/ecommerce", indent: 1 },
                { label: "3.5.6 POS & Ödeme Sistemleri", href: "/ngo-admin/payment-systems", indent: 1 },
                { label: "3.5.7 Pazarlama İletişimi Araçları", href: "/ngo-admin/marketing", indent: 1 },
                { label: "3.5.8 Demografi ve Etki Analizi", href: "/ngo-admin/demographics", indent: 1 },
                { label: "3.5.9 Web Analiz Araçları (GA4/Pixel)", href: "/ngo-admin/analytics-tools", indent: 1 },
                { label: "3.5.10 Şeffaflık Endeksi (Belgeler)", href: "/ngo-admin/transparency", indent: 1 },
                { label: "3.6 Sistem & Destek", href: "/ngo-admin/users" },
                { label: "3.6.1 Yetkili (Personel) Yönetimi", href: "/ngo-admin/users", indent: 1 },
                { label: "3.6.2 Yeni Yetkili Davet Et", href: "/ngo-admin/users/new", indent: 1 },
                { label: "3.6.3 Panel Ayarları", href: "/ngo-admin/settings", indent: 1 },
                { label: "3.6.4 Kurumsal Destek", href: "/ngo-admin/support", indent: 1 },
            ]
        },
        {
            title: "4- SUPER ADMIN (Sistem ve Platform Denetimi)",
            links: [
                { label: "4.1 Genel Bakış (Main Dashboard)", href: "/super-admin" },
                { label: "4.2 Operasyonel Denetim", href: "/super-admin/inbox" },
                { label: "4.2.1 Gelen Kutusu & Bildirimler", href: "/super-admin/inbox", indent: 1 },
                { label: "4.2.2 Başvuru Yönetimi (STK/Marka/Kulüp)", href: "/super-admin/applications", indent: 1 },
                { label: "4.2.3 Kullanıcı Yönetimi (Bireysel)", href: "/super-admin/users", indent: 1 },
                { label: "4.2.4 STK Yönetimi (Onaylılar)", href: "/super-admin/ngos", indent: 1 },
                { label: "4.2.5 Marka Yönetimi (Pazar Yeri)", href: "/super-admin/brands", indent: 1 },
                { label: "4.2.6 Kulüp Yönetimi (Kampüs)", href: "/super-admin/clubs", indent: 1 },
                { label: "4.2.7 Gönüllülük İlan Denetimi", href: "/super-admin/volunteer", indent: 1 },
                { label: "4.2.8 Gönderi Denetimi", href: "/super-admin/posts", indent: 1 },
                { label: "4.2.9 Şeffaflık Belge Onayı", href: "/super-admin/transparency", indent: 1 },
                { label: "4.3 Platform Geliştirme", href: "/super-admin/library" },
                { label: "4.3.1 Kütüphane İçerik Yönetimi", href: "/super-admin/library", indent: 1 },
                { label: "4.3.2 Reklam Alanları Yönetimi", href: "/super-admin/ads", indent: 1 },
                { label: "4.3.3 İletişim & Bülten Paneli", href: "/super-admin/communications", indent: 1 },
                { label: "4.3.4 İstatistik ve Analizler", href: "/super-admin/analytics", indent: 1 },
                { label: "4.3.5 Kamu İlişkileri Yönetimi", href: "/super-admin/public-relations", indent: 1 },
                { label: "4.4 Sistem Ayarları", href: "/super-admin/settings" },
                { label: "4.4.1 Global Panel Ayarları", href: "/super-admin/settings", indent: 1 },
                { label: "4.4.2 Destek Talebi Yönetimi", href: "/super-admin/support", indent: 1 },
                { label: "4.4.3 Admin Yardım Merkezi", href: "/super-admin/help", indent: 1 },
            ]
        },
        {
            title: "5- DERNEK (Hangel Derneği Resmî Sayfaları)",
            links: [
                { label: "5.1 Dernek Ana Sayfası", href: "/hangelassociation" },
                { label: "5.2 Hakkımızda & Vizyon", href: "/hangelassociation/about" },
                { label: "5.3 Dernek Etkinlikleri", href: "/hangelassociation/events" },
                { label: "5.4 Uluslararası Çalıştay", href: "/hangelassociation/workshop" },
                { label: "5.5 Mevzuat Çalışmaları", href: "/hangelassociation/legislation" },
                { label: "5.6 Proje Detayları", href: "/hangelassociation/projects/etki-atlasi" },
                { label: "5.7 Kurumsal Yapı (Komiteler)", href: "/hangelassociation/committees/mevzuat" },
                { label: "5.8 Şeffaflık & Etki Raporları", href: "/hangelassociation/reports/5-yillik-etki" },
                { label: "5.9 İletişim Kanalları", href: "/hangelassociation/contact" },
                { label: "5.10 Dernek Geri Bildirim", href: "/hangelassociation/feedback" },
            ]
        },
        {
            title: "6- KAMPÜS & KULÜP YÖNETİMİ (Kampüs Paneli)",
            links: [
                { label: "6.1 Kulüp Listesi & Arama", href: "/admin/clubs" },
                { label: "6.2 Kulüp Profil Yönetimi", href: "/admin/clubs/profile/1" },
                { label: "6.3 Kampüs Etkinlik Yönetimi", href: "/admin/events" },
                { label: "6.4 Temsilci Profil Sayfaları", href: "/admin/temsilciler/rep1" },
            ]
        }
    ];

    const totalAllPagesCount = allPagesSections.reduce((acc, section) => acc + section.links.length, 0);

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-4xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri Dön
                    </Button>
                    <span className="text-[12px] font-bold tracking-tight uppercase">Site Haritası</span>
                    <div className="w-20" />
                </div>
            </header>

            <main className="container mx-auto px-4 pt-32 pb-32 max-w-4xl space-y-12">
                <div className="text-left space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f]">Navigasyon.</h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium">Platformdaki tüm erişim noktalarını hiyerarşik olarak inceleyin.</p>
                </div>

                <Tabs defaultValue="all-pages" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
                        <TabsTrigger value="main-pages" className="rounded-lg text-sm font-semibold">Ana Sayfalar ({mainPages.length})</TabsTrigger>
                        <TabsTrigger value="all-pages" className="rounded-lg text-sm font-semibold">Tüm Sayfalar ({totalAllPagesCount})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="main-pages" className="mt-8 animate-in fade-in-0 duration-500">
                        <SitemapGroup title="Platform Temelleri" links={mainPages} />
                    </TabsContent>
                    
                    <TabsContent value="all-pages" className="mt-8 animate-in fade-in-0 duration-500">
                        <div className="grid grid-cols-1 gap-16">
                            {allPagesSections.map((section) => (
                                <SitemapGroup key={section.title} title={section.title} links={section.links} />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <PublicFooter currentPageLabel="Site Haritası" />
        </div>
    );
}
