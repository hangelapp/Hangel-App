'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronRight, BookOpen, FileText, HeartHandshake, Building, Film, GraduationCap, BookCopy, Search, Filter, ArrowDownUp } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const librarySections = [
    {
        title: "Sosyal Etki Raporları",
        description: "Hangel'in ve paydaşlarının yarattığı etkiyi inceleyin.",
        icon: FileText,
        links: [
            { title: "2023 Yıllık Sosyal Etki Raporu", href: "#" },
            { title: "Çevre Projeleri Etki Analizi", href: "#" },
            { title: "Eğitimde Fırsat Eşitliği Raporu", href: "#" },
        ]
    },
    {
        title: "Gönüllülük Rehberleri",
        description: "Gönüllülük yolculuğunuzda size yardımcı olacak kaynaklar.",
        icon: HeartHandshake,
        links: [
            { title: "Etkili Bir Gönüllü Olmanın Yolları", href: "#" },
            { title: "Afet Durumlarında Gönüllülük", href: "#" },
            { title: "Uzaktan Gönüllülük Nasıl Yapılır?", href: "#" },
        ]
    },
    {
        title: "STK'lar için Kaynaklar",
        description: "STK'ların kapasitelerini geliştirmelerine yönelik kılavuzlar.",
        icon: Building,
        links: [
            { title: "Dijital Kaynak Geliştirme Yöntemleri", href: "#" },
            { title: "Gönüllü Yönetimi ve Motivasyon", href: "#" },
            { title: "Şeffaflık ve Hesap Verebilirlik İlkeleri", href: "#" },
        ]
    },
    {
        title: "Kitaplar",
        description: "Sosyal etki ve sivil toplum alanında ilham veren kitaplar.",
        icon: BookCopy,
        links: [
            { title: "Sapiens: İnsan Türünün Kısa Bir Tarihi", href: "#" },
            { title: "Etkili İnsanların 7 Alışkanlığı", href: "#" },
            { title: "Factfulness: Dünya Hakkında Yanıldığımız 10 Neden", href: "#" },
        ]
    },
    {
        title: "Filmler ve Belgeseller",
        description: "Ufkunuzu genişletecek, farkındalık yaratan filmler ve belgeseller.",
        icon: Film,
        links: [
            { title: "The Social Dilemma", href: "#" },
            { title: "Cowspiracy: Sürdürülebilirlik Sırrı", href: "#" },
            { title: "Minimalism: A Documentary About the Important Things", href: "#" },
        ]
    },
    {
        title: "Akademik Makaleler",
        description: "Sivil toplum ve sosyal etki üzerine bilimsel çalışmalar.",
        icon: GraduationCap,
        links: [
            { title: "Sosyal Girişimcilikte İnovasyonun Rolü", href: "#" },
            { title: "Gönüllü Motivasyonunu Etkileyen Faktörler", href: "#" },
            { title: "Dijital Platformların STK Kapasitesine Etkisi", href: "#" },
        ]
    },
    {
        title: "Hangel Sözlük",
        description: "Platforma özgü terimlerin ve kavramların açıklamaları.",
        icon: BookOpen,
        links: [
            { title: "Sosyal Etki Puanı Nedir?", href: "#" },
            { title: "Şeffaflık Endeksi Nasıl Hesaplanır?", href: "#" },
            { title: "Adil Ticaret ve Sosyal Girişimcilik", href: "#" },
        ]
    }
];


export default function LibraryPage() {
  const { toast } = useToast();

  const handleAction = (actionName: string) => {
    toast({
        title: 'Özellik Yakında!',
        description: `${actionName} özelliği yakında aktif olacaktır.`
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Kütüphane</h1>
        <p className="mt-2 text-muted-foreground">Sosyal etki, gönüllülük ve sivil toplum hakkında kaynakları keşfedin.</p>
      </div>

       <div className="p-0 flex gap-2 items-center max-w-lg mx-auto">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Kaynaklarda ara..."
                    className="pl-10 h-11"
                />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => handleAction('Filtreleme')}>
                <Filter className="h-5 w-5" />
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11">
                        <ArrowDownUp className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAction('Tarihe göre sıralama')}>Tarihe Göre (En Yeni)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('Popülerliğe göre sıralama')}>Popülerliğe Göre</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('Alfabetik sıralama')}>Alfabetik (A-Z)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
      </div>

      <div className="space-y-6">
        {librarySections.map((section) => {
            const Icon = section.icon;
            return (
                <Card key={section.title}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Icon className="h-6 w-6 text-primary" />
                            <span>{section.title}</span>
                        </CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {section.links.map(link => (
                                <Link href={link.href} key={link.title} className="block">
                                    <div className="flex items-center justify-between p-3 -mx-3 hover:bg-accent rounded-md transition-colors">
                                        <span className="font-medium text-sm">{link.title}</span>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )
        })}
      </div>
    </div>
  );
}
