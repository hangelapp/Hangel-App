'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import { useTranslation } from '@/components/providers/language-provider';

const contractGroups = [
    {
        title: 'A. Ana Sözleşmeler',
        items: [
            { title: 'Kullanıcı Sözleşmesi', slug: 'kullanici-sozlesmesi' },
            { title: 'Kuruluş Sözleşmesi', slug: 'kurulus-sozlesmesi' },
            { title: 'Gönüllülük Sözleşmesi', slug: 'gonulluluk-sozlesmesi' },
            { title: 'Gönüllü Hakları ve Sorumlulukları Beyannamesi', slug: 'gonullu-haklari-beyannamesi' },
        ]
    },
    {
        title: 'B. Gizlilik, Veri Koruma ve Dijital Güvenlik Politikaları',
        items: [
            { title: 'Gizlilik Politikası', slug: 'gizlilik-politikasi' },
            { title: 'KVKK Aydınlatma Metni', slug: 'kvkk-aydinlatma-metni' },
            { title: 'Açık Rıza Metni', slug: 'acik-riza-metni' },
            { title: 'Veri Saklama ve İmha Politikası', slug: 'veri-saklama-ve-imha-politikasi' },
            { title: 'AB Genel Veri Koruma Tüzüğü (GDPR) Uyum Politikası', slug: 'gdpr-uyum-politikasi' },
            { title: 'Veri İşleme Amaçları ve Hukuki Dayanaklar Beyanı', slug: 'veri-isleme-amaclar-beyani' },
            { title: 'Kullanıcı Hakları Politikası', slug: 'kullanici-haklari-politikasi' },
            { title: 'Veri Koruma Görevlisi (DPO) Tanımı', slug: 'dpo-tanimi' },
            { title: 'Veri İhlali Bildirim Prosedürü', slug: 'veri-ihlali-bildirim-proseduru' },
            { title: 'Veri Transferi ve AB Merkezli Hosting Beyanı', slug: 'veri-transferi-ve-hosting-beyani' },
            { title: 'Çerez Politikası', slug: 'cerez-politikasi' },
            { title: 'Bilgi Güvenliği Politikası', slug: 'bilgi-guvenligi-politikasi' },
            { title: 'Çocukların Kişisel Verilerinin Korunması (COPPA Uyumu)', slug: 'cocuklarin-verilerinin-korunmasi' },
            { title: 'ABD Eyalet Bazlı Veri Koruma Politikası (CCPA/CPRA)', slug: 'abd-eyalet-bazli-veri-politikasi' },
            { title: 'Ülke Bazlı Veri Koruma Uyum Beyanı', slug: 'ulke-bazli-veri-koruma-uyum-beyani' },
            { title: 'LGPD (Latin Amerika) Veri Koruma Beyanı', slug: 'lgpd-veri-koruma-beyani' },
            { title: 'Yapay Zekâ ve Algoritmik Şeffaflık Beyanı', slug: 'yapay-zeka-seffaflik-beyani' },
        ]
    },
    {
        title: 'C. Sosyal Etki, Bağış ve Finansal Şeffaflık',
        items: [
            { title: 'Sosyal Etki Politikası', slug: 'sosyal-etki-politikasi' },
            { title: 'Sosyal Etki Ölçüm ve Raporlama Metodolojisi (SROI & Theory of Change)', slug: 'sosyal-etki-metodolojisi' },
            { title: 'Açık Sosyal Girişim Beyanı', slug: 'acik-sosyal-girisim-beyani' },
            { title: 'Bağış ve Yardım Politikası', slug: 'bagis-ve-yardim-politikasi' },
            { title: 'Bağışçı Hakları Beyannamesi', slug: 'bagisci-haklari-beyannamesi' },
            { title: 'Bağış Gelirlerinin Denetlenmesi ve Şeffaflık Raporu Politikası', slug: 'bagis-gelirlerinin-denetlenmesi-politikasi' },
            { title: 'Finansal Şeffaflık ve Hesap Verebilirlik Politikası', slug: 'finansal-seffaflik-ve-hesap-verebilirlik-politikasi' },
            { title: 'Kâr Dağıtım Politikası', slug: 'kar-dagitim-politikasi' },
            { title: 'Ücret Politikası', slug: 'ucret-politikasi' },
            { title: 'ABD IRS Uyumlu Bağış Beyanı', slug: 'abd-irs-bagis-beyani' },
            { title: 'Çevresel Sorumluluk ve Sürdürülebilirlik Politikası', slug: 'cevresel-sorumluluk-politikasi' },
            { title: 'AML / CFT Uyum Beyanı', slug: 'aml-cft-uyum-beyani' },
            { title: 'Etik Bağış ve Fon Kullanımı Beyanı', slug: 'etik-bagis-ve-fon-kullanimi-beyani' },
            { title: 'Açık Veri ve Etki Verisi Paylaşım Politikası', slug: 'acik-veri-ve-etki-verisi-paylasim-politikasi' },
        ]
    },
    {
        title: 'D. Kurumsal Yönetişim, Etik ve İç Denetim',
        items: [
            { title: 'Etik İlkeler', slug: 'etik-ilkeler' },
            { title: 'Çıkar Çatışması Politikası', slug: 'cikar-catismasi-politikasi' },
            { title: 'Whistleblower (İhbarcı) Politikası', slug: 'whistleblower-politikasi' },
            { title: 'Yönetim ve Kurumsal Yönetişim İlkeleri', slug: 'yonetim-ve-kurumsal-yonetisim-ilkeleri' },
            { title: 'Kamu Yararı ve Sosyal Fayda Statüsü Beyanı', slug: 'kamu-yarari-ve-sosyal-fayda-beyani' },
            { title: 'İnsan Hakları Politikası', slug: 'insan-haklari-politikasi' },
            { title: 'DEI Politikası', slug: 'dei-politikasi' },
            { title: 'Risk Yönetimi ve Kriz Müdahale Politikası', slug: 'risk-yonetimi-ve-kriz-mudahale-politikasi' },
        ]
    },
    {
        title: 'E. Erişilebilirlik, Bilgilendirme ve Diğer Politikalar',
        items: [
            { title: 'Erişilebilirlik Politikası', slug: 'erisilebilirlik-politikasi' },
            { title: 'Bilgilendirme Politikası', slug: 'bilgilendirme-politikasi' },
            { title: 'Çok Dilli Sözleşmeler ve Küresel Erişim Politikası', slug: 'cok-dilli-sozlesmeler-politikasi' },
            { title: 'Yerel Bağış Mevzuatlarına Uyum Beyanı', slug: 'yerel-bagis-mevzuatlarina-uyum-beyani' },
        ]
    },
    {
        title: 'F. Gelişim Yol Haritası ve Standartlar',
        items: [
            { title: 'Gelişim Yol Haritası ve Henüz Sağlanmamış Standartlar Beyanı', slug: 'gelisim-yol-haritasi-ve-standartlar' },
        ]
    },
    {
        title: 'G. ISO / Uluslararası Sertifikasyonlar',
        items: [
            { title: 'ISO 27001 Uyum Beyanı (Bilgi Güvenliği)', slug: 'iso-27001-uyum-beyani' },
            { title: 'ISO 22301 Uyum Beyanı (İş Sürekliliği)', slug: 'iso-22301-uyum-beyani' },
            { title: 'ISO / IEC 25010 / EN 301 549 Uyum Beyanı (Dijital Platform Standartları)', slug: 'iso-25010-en-301-549-uyum-beyani' },
        ]
    },
    {
        title: 'H. Dış Denetim / Mali ve Finansal Sertifikasyon',
        items: [
            { title: 'Bağımsız Mali Denetim ve IFRS / GAAP Beyanı', slug: 'bagimsiz-mali-denetim-ve-ifrs-gaap-beyani' },
        ]
    },
    {
        title: 'I. Sistematik Test ve Uygulama',
        items: [
            { title: 'Sızma Testleri ve Güvenlik Testleri Beyanı', slug: 'sizma-ve-guvenlik-testleri-beyani' },
            { title: 'UX ve Kullanıcı Deneyimi Testleri Beyanı', slug: 'ux-ve-kullanici-deneyimi-testleri-beyani' },
            { title: 'Felaket Kurtarma ve Yedekleme Testleri Beyanı', slug: 'felaket-kurtarma-ve-yedekleme-testleri-beyani' },
        ]
    },
    {
        title: 'J. Kurumsal Uyum / Risk Komitesi',
        items: [
            { title: 'Üçüncü Taraf Gözetim ve Etik Performans Beyanı', slug: 'ucuncu-taraf-gozetim-ve-etik-performans-beyani' },
            { title: 'Kurumsal Risk ve Uyum Komitesi Beyanı', slug: 'kurumsal-risk-ve-uyum-komitesi-beyani' },
        ]
    }
];


export default function ContractsPage() {
    const router = useRouter();
    const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      <main className="p-4 space-y-6 animate-in fade-in-0">
          <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label="Geri">
              <ArrowLeft className="h-6 w-6" />
          </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsContracts.heading')}</h1>
          <p className="text-muted-foreground text-sm">{t('dashboard.settingsContracts.subheading')}</p>
        </div>

        {contractGroups.map(group => (
          <Card key={group.title} className="rounded-2xl border-black/5 shadow-sm">
              <CardHeader>
                  <CardTitle className="text-lg font-bold">{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
              <div className="divide-y border-t">
                  {group.items.map((contract) => (
                      <Link href={`/settings/contracts/${contract.slug}`} key={contract.title} className="block">
                          <div className="flex items-center justify-between p-4 hover:bg-accent transition-colors">
                          <span className="font-medium text-sm">{contract.title}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                      </Link>
                  ))}
              </div>
              </CardContent>
          </Card>
        ))}
      </main>
      <PublicFooter currentPageLabel="Sözleşmeler, Politikalar ve Beyanlar" />
    </div>
  );
}
