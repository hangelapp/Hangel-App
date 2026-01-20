'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

const contracts = [
    { title: 'Kullanıcı Sözleşmesi', href: '#', external: false },
    { title: 'Kuruluş Sözleşmesi', href: '#', external: false },
    { title: 'Gönüllülük Sözleşmesi', href: '#', external: false },
    { title: 'Gizlilik Politikası', href: '#', external: false },
    { title: 'KVKK Aydınlatma Metni', href: '#', external: false },
    { title: 'AB Kişisel Veri Koruma Kanunu (GDPR)', href: '#', external: false },
    { title: 'Çerez Politikası', href: '#', external: false },
    { title: 'Sosyal Etki Politikası', href: '#', external: false },
    { title: 'Gelir Fazlası Dağıtım Politikası', href: '#', external: false },
    { title: 'Açık Açık Sosyal Girişim Beyanı', href: 'https://drive.google.com/file/d/1KPWRqn2Ej-7VbmQnnMoMZtTM_y76MEk6/view', external: true },
];


export default function ContractsPage() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <div>
        <h1 className="text-2xl font-bold font-headline">Sözleşmeler ve Politikalar</h1>
        <p className="text-muted-foreground text-sm">Uygulama kullanımına ilişkin yasal belgeler.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {contracts.map((contract) => {
                const linkContent = (
                    <div className="flex items-center justify-between p-4 hover:bg-accent transition-colors">
                    <span className="font-medium">{contract.title}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                );

                if (contract.external) {
                    return (
                    <a
                        href={contract.href}
                        key={contract.title}
                        className="block"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {linkContent}
                    </a>
                    );
                }
                
                return (
                    <Link href={contract.href} key={contract.title} className="block">
                        {linkContent}
                    </Link>
                );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
