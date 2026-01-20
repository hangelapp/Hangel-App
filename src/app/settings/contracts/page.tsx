'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

const contracts = [
    { title: 'Kullanıcı Sözleşmesi', href: '#' },
    { title: 'Gizlilik Politikası', href: '#' },
    { title: 'Çerez Politikası', href: '#' },
    { title: 'KVKK Aydınlatma Metni', href: '#' },
    { title: 'Sosyal Etki Politikası', href: '#' },
    { title: 'Gönüllülük Sözleşmesi', href: '#' },
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
            {contracts.map((contract) => (
              <Link href={contract.href} key={contract.title} className="block">
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
