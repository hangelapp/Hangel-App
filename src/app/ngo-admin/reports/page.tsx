'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, Share2 } from 'lucide-react';
import React from 'react';
import { Tabs, TabsTrigger, TabsList, TabsContent } from '@/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

type ReportType = 'Finansal' | 'Gönüllülük' | 'Sosyal Etki';

interface Report {
  id: number;
  title: string;
  type: ReportType;
  date: string; // YYYY-MM-DD
}

const allReports: Report[] = [
  // Financial Reports
  { id: 1, title: 'Temmuz 2024 Hak Ediş Raporu', type: 'Finansal', date: '2024-08-01' },
  { id: 2, title: 'Haziran 2024 Hak Ediş Raporu', type: 'Finansal', date: '2024-07-01' },
  { id: 3, title: '2024 İkinci Çeyrek Finansal Raporu', type: 'Finansal', date: '2024-07-05' },
  { id: 4, title: 'Mayıs 2024 Hak Ediş Raporu', type: 'Finansal', date: '2024-06-01' },
  { id: 5, title: '2023 Yıllık Finansal Tablolar', type: 'Finansal', date: '2024-01-15' },

  // Volunteer Reports
  { id: 6, title: 'Temmuz 2024 Gönüllü Listesi', type: 'Gönüllülük', date: '2024-08-02' },
  { id: 7, title: 'Gönüllü Demografi Raporu - Q2 2024', type: 'Gönüllülük', date: '2024-07-10' },
  { id: 8, title: 'Haziran 2024 Gönüllü Faaliyet Özeti', type: 'Gönüllülük', date: '2024-07-03' },
  { id: 9, title: '2023 Yıllık Gönüllülük Raporu', type: 'Gönüllülük', date: '2024-01-20' },

  // Social Impact Reports
  { id: 10, title: 'Ağaçlandırma Projesi Etki Raporu - Temmuz 2024', type: 'Sosyal Etki', date: '2024-07-25' },
  { id: 11, title: 'Eğitim Desteği Programı Etki Analizi - Q2 2024', type: 'Sosyal Etki', date: '2024-07-15' },
  { id: 12, title: '2023 Yıllık Sosyal Etki Raporu', type: 'Sosyal Etki', date: '2024-02-01' },
];

const ReportList = ({ type }: { type: ReportType }) => {
    const reports = allReports
        .filter(report => report.type === type)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const groupedReports = reports.reduce((acc, report) => {
        const yearMonth = format(parseISO(report.date), 'MMMM yyyy', { locale: tr });
        if (!acc[yearMonth]) {
            acc[yearMonth] = [];
        }
        acc[yearMonth].push(report);
        return acc;
    }, {} as Record<string, Report[]>);

    if (reports.length === 0) {
        return <div className="text-center text-muted-foreground p-8">Bu kategoride rapor bulunmuyor.</div>
    }

    return (
        <div className="space-y-6">
            {Object.entries(groupedReports).map(([monthYear, reportsInMonth]) => (
                <div key={monthYear}>
                    <h3 className="text-lg font-semibold mb-3 capitalize">{monthYear}</h3>
                    <Card>
                        <CardContent className="p-2 space-y-1">
                            {reportsInMonth.map(report => (
                                <div key={report.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                                   <div className='flex-1'>
                                     <p className="font-medium text-sm">{report.title}</p>
                                     <p className="text-xs text-muted-foreground">{new Date(report.date).toLocaleDateString('tr-TR')}</p>
                                   </div>
                                   <div className="flex gap-1">
                                       <Button size="icon" variant="ghost"><Eye className="h-4 w-4"/></Button>
                                       <Button size="icon" variant="ghost"><Share2 className="h-4 w-4"/></Button>
                                       <Button size="icon" variant="ghost"><Download className="h-4 w-4"/></Button>
                                   </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    )
}


export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Raporlar</h1>
        <p className="text-muted-foreground">
          Kuruluşunuzun faaliyetleri, finansalları ve etkisiyle ilgili tüm raporlara buradan erişin.
        </p>
      </div>

       <Tabs defaultValue="Finansal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="Finansal">Finansal</TabsTrigger>
          <TabsTrigger value="Gönüllülük">Gönüllülük</TabsTrigger>
          <TabsTrigger value="Sosyal Etki">Sosyal Etki</TabsTrigger>
        </TabsList>
        <TabsContent value="Finansal" className="mt-6">
          <ReportList type="Finansal" />
        </TabsContent>
        <TabsContent value="Gönüllülük" className="mt-6">
          <ReportList type="Gönüllülük" />
        </TabsContent>
        <TabsContent value="Sosyal Etki" className="mt-6">
          <ReportList type="Sosyal Etki" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
