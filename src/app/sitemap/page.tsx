
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
        { label: "3. DERNEK - hangel derneği", href: "/hangelassociation" },
    ];

    const allPagesSections = [
        {
            title: "1- WEB (Bilgi içerikli, tanıtım ve kurumsal portal)",
            links: [
                { label: "1.1 Ana Sayfa", href: "/login" },
                { label: "1.2 Kurumsal", href: "/about" },
                { label: "1.2.1 Biz Kimiz?", href: "/about", indent: 1 },
                { label: "1.2.2 Sürdürülebilirlik", href: "/social-impact", indent: 1 },
                { label: "1.2.3 Basın Odası", href: "/press", indent: 1 },
                { label: "1.2.4 Yatırımcı İlişkileri", href: "/yatirimci-iliskileri", indent: 1 },
                { label: "1.2.5 Kariyer", href: "/careers", indent: 1 },
                { label: "1.2.6 Sosyal Girişimcilik", href: "/social-entrepreneurship", indent: 1 },
                { label: "1.2.7 Bilgi Toplumu Hizmetleri", href: "/bilgi-toplumu-hizmetleri", indent: 1 },
                { label: "1.2.8 Erişilebilirlik Beyanı", href: "/accessibility", indent: 1 },
                { label: "1.2.9 Standartlar", href: "/standards", indent: 1 },
                { label: "1.2.10 Logo Kullanımı", href: "/logo-usage", indent: 1 },
                { label: "1.3 Bilgi & Destek", href: "/support" },
                { label: "1.3.1 Destek Merkezi", href: "/support", indent: 1 },
                { label: "1.3.2 Uygulama Desteği", href: "/support/app-support", indent: 1 },
                { label: "1.3.3 Geri Bildirim", href: "/feedback", indent: 1 },
                { label: "1.4 İş Birlikleri", href: "/corporate" },
                { label: "1.4.1 Üye İşyeri Ol", href: "/merchant", indent: 1 },
                { label: "1.4.2 STK Kaydı", href: "/ngo-onboarding", indent: 1 },
                { label: "1.4.3 Kulüp Kaydı", href: "/campus-advantages", indent: 1 },
                { label: "1.4.4 Kamu İş Birlikleri", href: "/corporate", indent: 1 },
            ]
        },
        {
            title: "2- APP (İşlemlerin yapıldığı kullanıcı ve yönetim portalı)",
            links: [
                { label: "2.1 Ana Gezinti & Keşfet", href: "/timeline" },
                { label: "2.1.1 Zaman Tüneli (Ana Akış)", href: "/timeline", indent: 1 },
                { label: "2.1.2 Market (Alışverişle Bağış)", href: "/market", indent: 1 },
                { label: "2.1.3 Gönüllülük – İmece", href: "/volunteering", indent: 1 },
                { label: "2.1.4 Öğrenci Kulüpleri", href: "/clubs", indent: 1 },
                { label: "2.1.5 Etkinlikler", href: "/events", indent: 1 },
                { label: "2.1.6 Cüzdanım (QR Ödeme)", href: "/qr-payment", indent: 1 },
                { label: "2.1.7 Acil Durum Merkezi", href: "/emergency", indent: 1 },
                { label: "2.1.8 Liderlik Tablosu", href: "/leaderboard", indent: 1 },
                { label: "2.1.9 Etki Hikayeleri (Stories)", href: "/stories", indent: 1 },
                { label: "2.1.10 Arkadaş Davet Et", href: "/invite", indent: 1 },
                { label: "2.2 Kütüphane", href: "/library" },
                { label: "2.2.1 Veri Kütüphanesi", href: "/library", indent: 1 },
                { label: "2.2.2 Sosyal Etki Raporları", href: "/library", indent: 1 },
                { label: "2.2.3 Akademik Yayınlar", href: "/library", indent: 1 },
                { label: "2.2.4 Filmler", href: "/library", indent: 1 },
                { label: "2.2.5 Kitaplar", href: "/library", indent: 1 },
                { label: "2.2.6 Sivil Toplum Sözlüğü", href: "/library", indent: 1 },
                { label: "2.2.7 Hangel Sözlük", href: "/library", indent: 1 },
                { label: "2.3 Kullanıcı Hesabı", href: "/profile" },
                { label: "2.3.1 Bağışlarım", href: "/my-donations", indent: 1 },
                { label: "2.3.2 Başvurularım", href: "/my-applications", indent: 1 },
                { label: "2.3.3 Rozetler ve Sertifikalar", href: "/my-badges", indent: 1 },
                { label: "2.3.4 Mesajlarım", href: "/messages", indent: 1 },
                { label: "2.4 Ayarlar", href: "/settings" },
                { label: "2.4.1 Kişisel Bilgileri Düzenle", href: "/settings/profile", indent: 1 },
                { label: "2.4.2 Gönüllülük Bilgilerini Düzenle", href: "/settings/volunteer", indent: 1 },
                { label: "2.4.3 Cüzdan ve Ödeme Yöntemleri", href: "/settings/wallet", indent: 1 },
                { label: "2.4.4 Güvenlik ve Şifre", href: "/settings/security", indent: 1 },
                { label: "2.4.5 Bağışçısı Olduğun STK’ları Değiştir", href: "/settings/ngo-selection", indent: 1 },
                { label: "2.4.6 Gönüllüsü Olduğun STK’ları Değiştir", href: "/settings/volunteer-ngo-selection", indent: 1 },
                { label: "2.4.7 Bildirim Ayarları", href: "/settings/notifications", indent: 1 },
                { label: "2.4.8 Tema Ayarları", href: "/settings/theme", indent: 1 },
                { label: "2.4.9 Dil Ayarları", href: "/settings/language", indent: 1 },
                { label: "2.4.10 Erişilebilirlik", href: "/settings/accessibility", indent: 1 },
                { label: "2.4.11 Gizlilik ve Etkileşim", href: "/settings/privacy", indent: 1 },
                { label: "2.4.12 Sözleşmeler ve Politikalar", href: "/settings/contracts", indent: 1 },
                { label: "2.4.12.1 Kullanıcı Sözleşmesi", href: "/settings/contracts/kullanici-sozlesmesi", indent: 2 },
                { label: "2.4.12.2 Kuruluş Sözleşmesi", href: "/settings/contracts/kurulus-sozlesmesi", indent: 2 },
                { label: "2.4.12.3 Gönüllülük Sözleşmesi", href: "/settings/contracts/gonulluluk-sozlesmesi", indent: 2 },
                { label: "2.4.12.4 Gönüllü Hakları Beyannamesi", href: "/settings/contracts/gonullu-haklari-beyannamesi", indent: 2 },
                { label: "2.4.12.5 Gizlilik Politikası", href: "/settings/contracts/gizlilik-politikasi", indent: 2 },
                { label: "2.4.12.6 KVKK Aydınlatma Metni", href: "/settings/contracts/kvkk-aydinlatma-metni", indent: 2 },
                { label: "2.4.12.7 Açık Rıza Metni", href: "/settings/contracts/acik-riza-metni", indent: 2 },
                { label: "2.4.12.8 Veri Saklama ve İmha Politikası", href: "/settings/contracts/veri-saklama-ve-imha-politikasi", indent: 2 },
                { label: "2.4.12.9 GDPR Uyum Politikası", href: "/settings/contracts/gdpr-uyum-politikasi", indent: 2 },
                { label: "2.4.12.10 Veri İşleme Amaçları Beyanı", href: "/settings/contracts/veri-isleme-amaclar-beyani", indent: 2 },
                { label: "2.4.12.11 Kullanıcı Hakları Politikası", href: "/settings/contracts/kullanici-haklari-politikasi", indent: 2 },
                { label: "2.4.12.12 Veri Koruma Görevlisi (DPO) Tanımı", href: "/settings/contracts/dpo-tanimi", indent: 2 },
                { label: "2.4.12.13 Veri İhlali Bildirim Prosedürü", href: "/settings/contracts/veri-ihlali-bildirim-proseduru", indent: 2 },
                { label: "2.4.12.14 Veri Transferi ve Hosting Beyanı", href: "/settings/contracts/veri-transferi-ve-hosting-beyani", indent: 2 },
                { label: "2.4.12.15 Çerez Politikası", href: "/settings/contracts/cerez-politikasi", indent: 2 },
                { label: "2.4.12.16 Bilgi Güvenliği Politikası", href: "/settings/contracts/bilgi-guvenligi-politikasi", indent: 2 },
                { label: "2.4.12.17 COPPA Uyumu", href: "/settings/contracts/cocuklarin-verilerinin-korunmasi", indent: 2 },
                { label: "2.4.12.18 CCPA/CPRA Politikası", href: "/settings/contracts/abd-eyalet-bazli-veri-politikasi", indent: 2 },
                { label: "2.4.12.19 Ülke Bazlı Veri Koruma Uyum Beyanı", href: "/settings/contracts/ulke-bazli-veri-koruma-uyum-beyani", indent: 2 },
                { label: "2.4.12.20 LGPD Veri Koruma Beyanı", href: "/settings/contracts/lgpd-veri-koruma-beyani", indent: 2 },
                { label: "2.4.12.21 Yapay Zekâ Şeffaflık Beyanı", href: "/settings/contracts/yapay-zeka-seffaflik-beyani", indent: 2 },
                { label: "2.4.12.22 Sosyal Etki Politikası", href: "/settings/contracts/sosyal-etki-politikasi", indent: 2 },
                { label: "2.4.12.23 Sosyal Etki Metodolojisi", href: "/settings/contracts/sosyal-etki-metodolojisi", indent: 2 },
                { label: "2.4.12.24 Açık Sosyal Girişim Beyanı", href: "/settings/contracts/acik-sosyal-girisim-beyani", indent: 2 },
                { label: "2.4.12.25 Bağış ve Yardım Politikası", href: "/settings/contracts/bagis-ve-yardim-politikasi", indent: 2 },
                { label: "2.4.12.26 Bağışçı Hakları Beyannamesi", href: "/settings/contracts/bagisci-haklari-beyannamesi", indent: 2 },
                { label: "2.4.12.27 Bağış Gelirlerinin Denetlenmesi Politikası", href: "/settings/contracts/bagis-gelirlerinin-denetlenmesi-politikasi", indent: 2 },
                { label: "2.4.12.28 Finansal Şeffaflık Politikası", href: "/settings/contracts/finansal-seffaflik-ve-hesap-verebilirlik-politikasi", indent: 2 },
                { label: "2.4.12.29 Kâr Dağıtım Politikası", href: "/settings/contracts/kar-dagitim-politikasi", indent: 2 },
                { label: "2.4.12.30 Ücret Politikası", href: "/settings/contracts/ucret-politikasi", indent: 2 },
                { label: "2.4.12.31 ABD IRS Bağış Beyanı", href: "/settings/contracts/abd-irs-bagis-beyani", indent: 2 },
                { label: "2.4.12.32 Çevresel Sorumluluk Politikası", href: "/settings/contracts/cevresel-sorumluluk-politikasi", indent: 2 },
                { label: "2.4.12.33 AML / CFT Uyum Beyanı", href: "/settings/contracts/aml-cft-uyum-beyani", indent: 2 },
                { label: "2.4.12.34 Etik Bağış ve Fon Kullanımı Beyanı", href: "/settings/contracts/etik-bagis-ve-fon-kullanimi-beyani", indent: 2 },
                { label: "2.4.12.35 Açık Veri ve Etki Paylaşım Politikası", href: "/settings/contracts/acik-veri-ve-etki-verisi-paylasim-politikasi", indent: 2 },
                { label: "2.4.12.36 Etik İlkeler", href: "/settings/contracts/etik-ilkeler", indent: 2 },
                { label: "2.4.12.37 Çıkar Çatışması Politikası", href: "/settings/contracts/cikar-catismasi-politikasi", indent: 2 },
                { label: "2.4.12.38 Whistleblower (İhbarcı) Politikası", href: "/settings/contracts/whistleblower-politikasi", indent: 2 },
                { label: "2.4.12.39 Kurumsal Yönetişim İlkeleri", href: "/settings/contracts/yonetim-ve-kurumsal-yonetisim-ilkeleri", indent: 2 },
                { label: "2.4.12.40 Kamu Yararı ve Sosyal Fayda Beyanı", href: "/settings/contracts/kamu-yarari-ve-sosyal-fayda-beyani", indent: 2 },
                { label: "2.4.12.41 İnsan Hakları Politikası", href: "/settings/contracts/insan-haklari-politikasi", indent: 2 },
                { label: "2.4.12.42 DEI Politikası", href: "/settings/contracts/dei-politikasi", indent: 2 },
                { label: "2.4.12.43 Risk ve Kriz Yönetimi Politikası", href: "/settings/contracts/risk-yonetimi-ve-kriz-mudahale-politikasi", indent: 2 },
                { label: "2.4.12.44 Erişilebilirlik Politikası", href: "/settings/contracts/erisilebilirlik-politikasi", indent: 2 },
                { label: "2.4.12.45 Bilgilendirme Politikası", href: "/settings/contracts/bilgilendirme-politikasi", indent: 2 },
                { label: "2.4.12.46 Çok Dilli Sözleşmeler Politikası", href: "/settings/contracts/cok-dilli-sozlesmeler-politikasi", indent: 2 },
                { label: "2.4.12.47 Yerel Bağış Mevzuatları Uyum Beyanı", href: "/settings/contracts/yerel-bagis-mevzuatlarina-uyum-beyani", indent: 2 },
                { label: "2.4.12.48 Gelişim Yol Haritası Beyanı", href: "/settings/contracts/gelisim-yol-haritasi-ve-standartlar", indent: 2 },
                { label: "2.4.12.49 ISO 27001 Uyum Beyanı", href: "/settings/contracts/iso-27001-uyum-beyani", indent: 2 },
                { label: "2.4.12.50 ISO 22301 Uyum Beyanı", href: "/settings/contracts/iso-22301-uyum-beyani", indent: 2 },
                { label: "2.4.12.51 ISO / IEC 25010 Uyum Beyanı", href: "/settings/contracts/iso-25010-en-301-549-uyum-beyani", indent: 2 },
                { label: "2.4.12.52 Bağımsız Mali Denetim Beyanı", href: "/settings/contracts/bagimsiz-mali-denetim-ve-ifrs-gaap-beyani", indent: 2 },
                { label: "2.4.12.53 Sızma ve Güvenlik Testleri Beyanı", href: "/settings/contracts/sizma-ve-guvenlik-testleri-beyani", indent: 2 },
                { label: "2.4.12.54 UX ve Kullanıcı Deneyimi Testleri Beyanı", href: "/settings/contracts/ux-ve-kullanici-deneyimi-testleri-beyani", indent: 2 },
                { label: "2.4.12.55 Felaket Kurtarma ve Yedekleme Beyanı", href: "/settings/contracts/felaket-kurtarma-ve-yedekleme-testleri-beyani", indent: 2 },
                { label: "2.5 Yönetim Paneli (Yetkili)", href: "/ngo-admin/dashboard" },
                { label: "2.5.1 STK Dashboard", href: "/ngo-admin/dashboard", indent: 1 },
                { label: "2.5.2 Profili Güncelle", href: "/ngo-admin/manage-profile", indent: 1 },
                { label: "2.5.3 STK Profil QR Kodu", href: "/ngo-admin/qr", indent: 1 },
                { label: "2.5.4 Gelen Kutusu", href: "/ngo-admin/notifications", indent: 1 },
                { label: "2.5.5 Gönderiler", href: "/ngo-admin/posts", indent: 1 },
                { label: "2.5.6 Etki Hikayem", href: "/ngo-admin/impact-story", indent: 1 },
                { label: "2.5.7 Şeffaflık Endeksi", href: "/ngo-admin/transparency", indent: 1 },
                { label: "2.5.8 Gönüllülük Yönetimi", href: "/ngo-admin/volunteer", indent: 1 },
                { label: "2.5.9 Demografi Analizi", href: "/ngo-admin/demographics", indent: 1 },
                { label: "2.5.10 Bağış Takibi", href: "/ngo-admin/donations", indent: 1 },
                { label: "2.5.11 Hibeler ve Fonlar", href: "/ngo-admin/funds", indent: 1 },
                { label: "2.5.12 Web Sitesi Yönetimi", href: "/ngo-admin/website", indent: 1 },
                { label: "2.5.13 SMS Gönderimi", href: "/ngo-admin/sms", indent: 1 },
                { label: "2.5.14 Mail Gönderimi", href: "/ngo-admin/mail", indent: 1 },
                { label: "2.5.15 Reklam Yönetimi", href: "/ngo-admin/ads", indent: 1 },
                { label: "2.5.16 Etkinlik Yönetimi", href: "/ngo-admin/events", indent: 1 },
                { label: "2.5.17 Online Eğitim / Toplantı Araçları", href: "/ngo-admin/online-meeting", indent: 1 },
                { label: "2.5.18 Tasarım Programları", href: "/ngo-admin/design-tools", indent: 1 },
                { label: "2.5.19 POS & Ödeme Sistemleri", href: "/ngo-admin/payment-systems", indent: 1 },
                { label: "2.5.20 Pazarlama İletişimi", href: "/ngo-admin/marketing", indent: 1 },
                { label: "2.5.21 Ön Muhasebe Yönetimi", href: "/ngo-admin/accounting", indent: 1 },
                { label: "2.5.22 CRM Yönetimi", href: "/ngo-admin/crm", indent: 1 },
                { label: "2.5.23 Sanal Santral Yönetimi", href: "/ngo-admin/virtual-pbx", indent: 1 },
                { label: "2.5.24 Sanal ve Fiziki Ofis", href: "/ngo-admin/virtual-office", indent: 1 },
                { label: "2.5.25 Üniversite Gönüllülük Dersi", href: "/ngo-admin/university-volunteering", indent: 1 },
                { label: "2.5.26 Saha Ekip Yönetimi", href: "/ngo-admin/field-team", indent: 1 },
                { label: "2.5.27 DM Mesajlaşma Yönetimi", href: "/ngo-admin/dm", indent: 1 },
                { label: "2.5.28 İktisadi İşletme Yönetimi", href: "/ngo-admin/ecommerce", indent: 1 },
                { label: "2.5.29 İK Şirketleri Entegrasyonu", href: "/ngo-admin/hr-integration", indent: 1 },
                { label: "2.5.30 Gönüllülük Portalı Entegrasyonu", href: "/ngo-admin/volunteer-portal", indent: 1 },
                { label: "2.5.31 Web Analiz Araçları", href: "/ngo-admin/analytics-tools", indent: 1 },
                { label: "2.5.32 Yetkili Yönetimi", href: "/ngo-admin/users", indent: 1 },
                { label: "2.5.33 Panel Ayarları", href: "/ngo-admin/settings", indent: 1 },
                { label: "2.5.34 STK Yönetim Destek", href: "/ngo-admin/support", indent: 1 },
                { label: "2.6 Admin Paneli (Super)", href: "/super-admin" },
                { label: "2.6.1 Genel Bakış", href: "/super-admin", indent: 1 },
                { label: "2.6.2 Gelen Kutusu", href: "/super-admin/inbox", indent: 1 },
                { label: "2.6.3 Başvuru Yönetimi", href: "/super-admin/applications", indent: 1 },
                { label: "2.6.4 Kullanıcı Yönetimi", href: "/super-admin/users", indent: 1 },
                { label: "2.6.5 STK Yönetimi", href: "/super-admin/ngos", indent: 1 },
                { label: "2.6.6 Marka Yönetimi", href: "/super-admin/brands", indent: 1 },
                { label: "2.6.7 Kulüp Yönetimi", href: "/super-admin/clubs", indent: 1 },
                { label: "2.6.8 Gönüllülük Yönetimi", href: "/super-admin/volunteer", indent: 1 },
                { label: "2.6.9 Gönderi Yönetimi", href: "/super-admin/posts", indent: 1 },
                { label: "2.6.10 İstatistik ve Analizler", href: "/super-admin/analytics", indent: 1 },
                { label: "2.6.11 Şeffaflık Yönetimi", href: "/super-admin/transparency", indent: 1 },
                { label: "2.6.12 Kütüphane Yönetimi", href: "/super-admin/library", indent: 1 },
                { label: "2.6.13 Bildirimler ve Bülten", href: "/super-admin/communications", indent: 1 },
                { label: "2.6.14 Reklam Yönetimi", href: "/super-admin/ads", indent: 1 },
                { label: "2.6.15 Kamu İlişkileri", href: "/super-admin/public-relations", indent: 1 },
                { label: "2.6.16 Panel Ayarları", href: "/super-admin/settings", indent: 1 },
                { label: "2.6.17 Destek Talepleri", href: "/super-admin/support", indent: 1 },
                { label: "2.6.18 Yardım Merkezi", href: "/super-admin/help", indent: 1 },
            ]
        },
        {
            title: "3- DERNEK (Hangel Derneği resmî sayfaları)",
            links: [
                { label: "3.1 Dernek Ana Sayfa", href: "/hangelassociation" },
                { label: "3.2 Dernek Hakkında", href: "/hangelassociation/about" },
                { label: "3.2.1 Hakkında", href: "/hangelassociation/about", indent: 1 },
                { label: "3.2.2 Vizyon ve Misyon", href: "/hangelassociation/about", indent: 1 },
                { label: "3.3 Dernek Etkinlikleri", href: "/hangelassociation/events" },
                { label: "3.3.1 Uluslararası Çalıştaylar", href: "/hangelassociation/workshop", indent: 1 },
                { label: "3.3.2 Konferanslar ve Seminerler", href: "/hangelassociation/events", indent: 1 },
                { label: "3.4 Projeler", href: "/hangelassociation/projects/etki-atlasi" },
                { label: "3.4.1 Girişimcilik Kütüphanesi", href: "/hangelassociation/workshop", indent: 1 },
                { label: "3.4.2 Sosyal Etki Atlası", href: "/hangelassociation/projects/etki-atlasi", indent: 1 },
                { label: "3.4.3 Etki Odaklı İstihdam Protokolü", href: "/hangelassociation/projects/istihdam-protokolu", indent: 1 },
                { label: "3.4.4 Mevzuat Taslağı", href: "/hangelassociation/legislation", indent: 1 },
                { label: "3.5 Komiteler", href: "/hangelassociation/committees/mevzuat" },
                { label: "3.5.1 Mevzuat Komitesi", href: "/hangelassociation/committees/mevzuat", indent: 1 },
                { label: "3.5.2 Akademik Kurul", href: "/hangelassociation/committees/akademik", indent: 1 },
                { label: "3.5.3 İnsan ve Kültür Komitesi", href: "/hangelassociation/committees/insan-kultur", indent: 1 },
                { label: "3.5.4 İnovasyon Komitesi", href: "/hangelassociation/committees/inovasyon", indent: 1 },
                { label: "3.6 Raporlar", href: "/hangelassociation/reports/5-yillik-etki" },
                { label: "3.6.1 5 Yıllık Etki Raporu", href: "/hangelassociation/reports/5-yillik-etki", indent: 1 },
                { label: "3.6.2 Etkinlik Raporu", href: "/hangelassociation/reports/etkinlikler", indent: 1 },
                { label: "3.6.3 Afet Müdahale Raporu", href: "/hangelassociation/reports/afet-mudahale", indent: 1 },
                { label: "3.7 İletişim", href: "/hangelassociation/contact" },
                { label: "3.7.1 Bize Ulaşın", href: "/hangelassociation/contact", indent: 1 },
                { label: "3.7.2 Geri Bildirim", href: "/hangelassociation/feedback", indent: 1 },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Nav */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
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
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium">Tüm platformun yapısını hiyerarşik olarak inceleyin.</p>
                </div>

                <Tabs defaultValue="main-pages" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="main-pages">Ana Sayfalar</TabsTrigger>
                        <TabsTrigger value="all-pages">Tüm Sayfalar (Hiyerarşik Liste)</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="main-pages" className="mt-8">
                        <SitemapGroup title="Platform Temelleri" links={mainPages} />
                    </TabsContent>
                    
                    <TabsContent value="all-pages" className="mt-8">
                        <div className="grid grid-cols-1 gap-16">
                            {allPagesSections.map((section) => (
                                <SitemapGroup key={section.title} {...section} />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <PublicFooter currentPageLabel="Site Haritası" />
        </div>
    );
}
