'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const contracts = [
    // Core Agreements
    { title: 'Kullanıcı Sözleşmesi', slug: 'kullanici-sozlesmesi' },
    { title: 'Kuruluş Sözleşmesi', slug: 'kurulus-sozlesmesi' },
    { title: 'Gönüllülük Sözleşmesi', slug: 'gonulluluk-sozlesmesi' },
    
    // Privacy & Data
    { title: 'Gizlilik Politikası', slug: 'gizlilik-politikasi' },
    { title: 'KVKK Aydınlatma Metni', slug: 'kvkk-aydinlatma-metni' },
    { title: 'AB Kişisel Veri Koruma Kanunu (GDPR)', slug: 'gdpr' },
    { title: 'Çerez Politikası', slug: 'cerez-politikasi' },
    { title: 'Bilgi Güvenliği Politikası', slug: 'bilgi-guvenligi-politikasi' },

    // Social Impact & Financials
    { title: 'Sosyal Etki Politikası', slug: 'sosyal-etki-politikasi' },
    { title: 'Açık Açık Sosyal Girişim Beyanı', slug: 'acik-acik-sosyal-girisim-beyani' },
    { title: 'Bağış ve Yardım Politikası', slug: 'bagis-ve-yardim-politikasi' },
    { title: 'Kâr Dağıtım Politikası', slug: 'kar-dagitim-politikasi' },
    { title: 'Ücret Politikamız', slug: 'ucret-politikasi' },
    
    // Other
    { title: 'Erişilebilirlik Politikası', slug: 'erisilebilirlik-politikasi' },
    { title: 'Etik İlkeler', slug: 'etik-ilkeler' },
    { title: 'Bilgilendirme Politikası', slug: 'bilgilendirme-politikasi' },
];


export default function ContractsPage() {
    const router = useRouter();
  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
        </Button>
      <div>
        <h1 className="text-2xl font-bold font-headline">Sözleşmeler ve Politikalar</h1>
        <p className="text-muted-foreground text-sm">Uygulama kullanımına ilişkin yasal belgeler.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {contracts.map((contract) => (
                <Link href={`/settings/contracts/${contract.slug}`} key={contract.title} className="block">
                    <div className="flex items-center justify-between p-4 hover:bg-accent transition-colors">
                    <span className="font-medium">{contract.title}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
