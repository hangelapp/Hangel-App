'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, TrendingUp, Calendar, Download, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function InvestorRelationsPage() {
  const router = useRouter();

  const financialReports = [
    { name: '2023 Yıllık Faaliyet Raporu', url: '#' },
    { name: '2024 1. Çeyrek Finansal Raporu', url: '#' },
    { name: '2024 2. Çeyrek Finansal Raporu', url: '#' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in-0">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-headline">Yatırımcı İlişkileri</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Hangel'in finansal performansı, sosyal etki metrikleri ve gelecek vizyonu hakkında şeffaf bilgilere buradan ulaşabilirsiniz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-primary" />
            Finansal Performans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Hangel, sosyal etkiyi önceliklendiren bir iş modeline sahiptir. Finansal sürdürülebilirliğimizi sağlarken, elde edilen gelirin büyük bir kısmını platformu geliştirmek ve sosyal fayda projelerini büyütmek için yeniden yatırıma dönüştürüyoruz.
          </p>
          {/* Placeholder for charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
             <div className="p-4 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Toplam Gelir (2023)</p>
                <p className="text-2xl font-bold">1.2 Milyon ₺</p>
            </div>
             <div className="p-4 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Sosyal Etkiye Yeniden Yatırım</p>
                <p className="text-2xl font-bold">%85</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Finansal Raporlar ve Sunumlar
          </CardTitle>
          <CardDescription>
            Detaylı finansal tablolarımıza ve yatırımcı sunumlarımıza erişin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {financialReports.map((doc) => (
            <a key={doc.name} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{doc.name}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </a>
          ))}
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            Yatırımcı Takvimi
          </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Yaklaşan önemli bir etkinlik bulunmamaktadır.</p>
        </CardContent>
      </Card>
    </div>
  );
}
