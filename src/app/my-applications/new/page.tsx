
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Store, School, HeartHandshake, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * @fileOverview Yeni Başvuru Seçim Sayfası
 * Kullanıcıların Gönüllülük, Kulüp, STK veya Marka kategorilerinde yeni bir başvuru başlatmasını sağlar.
 */

export default function NewApplicationPage() {
  const router = useRouter();

  const applicationTypes = [
    {
      title: "Gönüllülük",
      description: "Aktif ilanları keşfedin ve bir projenin parçası olun.",
      icon: HeartHandshake,
      href: "/volunteering",
      color: "bg-rose-500"
    },
    {
      title: "Öğrenci Kulübü",
      description: "Kampüsünüzdeki veya lisenizdeki kulübü sisteme kaydedin.",
      icon: School,
      href: "/login/selection?action=register&type=corporate&entity=CLUB",
      color: "bg-blue-500"
    },
    {
      title: "Sivil Toplum Kuruluşu (STK)",
      description: "Dernek veya vakfınızı hangel ekosistemine dahil edin.",
      icon: Building2,
      href: "/login/selection?action=register&type=corporate&entity=NGO",
      color: "bg-orange-500"
    },
    {
      title: "Marka / İşletme",
      description: "Alışverişle bağış sistemine veya QR ödeme ağına katılın.",
      icon: Store,
      href: "/login/selection?action=register&type=corporate&entity=BRAND",
      color: "bg-green-500"
    }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in-0">
      <div className="flex items-center gap-2">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold font-headline tracking-tight text-[#1d1d1f]">Yeni Başvuru</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {applicationTypes.map((type) => (
          <Link href={type.href} key={type.title} className="block group">
            <Card className="rounded-[2rem] border-black/5 hover:shadow-xl hover:border-primary/20 transition-all duration-300 bg-white overflow-hidden shadow-sm">
              <CardContent className="p-6 flex items-center gap-6">
                <div className={cn("p-4 rounded-2xl text-white shadow-lg shrink-0", type.color)}>
                  <type.icon className="h-8 w-8" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-xl font-bold text-[#1d1d1f] group-hover:text-primary transition-colors">{type.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{type.description}</p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="pt-8 text-center border-t border-dashed border-black/10">
        <p className="text-sm text-muted-foreground font-medium">
          Farklı bir talebiniz mi var? <Link href="/contact" className="text-primary font-bold hover:underline">İletişim Merkezi</Link> üzerinden bize ulaşabilirsiniz.
        </p>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
