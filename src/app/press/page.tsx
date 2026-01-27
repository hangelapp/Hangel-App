
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, Rss, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PressPage() {
  const router = useRouter();

  const pressItems = [
    {
      icon: Newspaper,
      title: 'Basın Bültenleri',
      description: 'En son duyurularımız ve basın bültenlerimiz.',
      link: '#',
      linkText: 'Tüm Bültenler'
    },
    {
      icon: Rss,
      title: 'Haberler',
      description: 'Hakkımızda çıkan haberler ve medya yansımaları.',
      link: '#',
      linkText: 'Medyada Hangel'
    },
    {
      icon: Download,
      title: 'Medya Kiti',
      description: 'Logolarımız, görsellerimiz ve marka kimliği kılavuzumuz.',
      link: '#',
      linkText: 'Kiti İndir'
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in-0">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-headline">Basın</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Medya mensupları için kaynaklar, basın bültenleri ve haberler.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pressItems.map((item) => (
          <Card key={item.title} className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
              <item.icon className="h-8 w-8 text-primary" />
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground">{item.description}</p>
            </CardContent>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={item.link}>{item.linkText}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
