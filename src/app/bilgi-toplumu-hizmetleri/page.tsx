
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users, FileText, Eye, UserCheck, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PublicFooter } from '@/components/layout/public-footer';
import { useWebPage } from '@/hooks/use-site-content';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { useTranslation } from '@/components/providers/language-provider';

export default function InformationSocietyServicesPage() {
  const router = useRouter();
  const cms = useWebPage('bilgi-toplumu-hizmetleri');
  const { t } = useTranslation();

  const boardMembers = [
    { name: 'İsmail Hilmi Adıgüzel', role: 'Yönetim Kurulu Başkanı' },
    { name: 'Ayşe Yılmaz', role: 'Yönetim Kurulu Başkan Yrd.' },
    { name: 'Mehmet Öztürk', role: 'Yönetim Kurulu Üyesi' },
  ];

  const legalDocuments = [
    { name: 'Ticaret Sicil Gazetesi', url: '#' },
    { name: 'Vergi Levhası', url: '#' },
    { name: 'Faaliyet Belgesi', url: '#' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
      <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
          <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
              <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('marketing.common.back')}
              </Button>
              <span className="text-[12px] font-bold tracking-tight">{t('marketing.info.navLabel')}</span>
              <div className="w-20" />
          </div>
      </header>

      <main className="container mx-auto px-4 pt-32 pb-32 max-w-4xl space-y-12">
        <div className="text-left space-y-4">
          {cms.subtitle && (
            <p className="text-sm font-bold uppercase tracking-widest text-primary">{cms.subtitle}</p>
          )}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f]">{cms.title || t('marketing.info.heroTitleFallback')}</h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl">
            {cms.description || t('marketing.info.heroDescriptionFallback')}
          </p>
          {cms.body && (
            <div className="prose prose-lg max-w-3xl mt-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cms.body) }} />
          )}
        </div>

        <Card className="rounded-[2.5rem] border-black/5 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Building2 className="h-5 w-5 text-primary" />
              {t('marketing.info.commercialTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Ticari Unvan:</strong> hangel teknoloji ve sosyal etki anonim şirketi</p>
            <p><strong>MERSİS Numarası:</strong> 0123456789101112</p>
            <p><strong>Merkez Adresi:</strong> Caferağa Mah. Moda Cad. No: 123 D:4, Kadıköy, İstanbul</p>
            <p><strong>Sorumlu Kişi:</strong> İsmail Hilmi Adıgüzel</p>
            <p><strong>Kayıtlı Elektronik Posta (KEP) Adresi:</strong> hangel@hs01.kep.tr</p>
            <p><strong>Yer Sağlayıcı:</strong> Google Cloud</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-black/5 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Users className="h-5 w-5 text-primary" />
              {t('marketing.info.boardTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {boardMembers.map((member) => (
              <div key={member.name} className="flex items-center gap-3 p-4 rounded-2xl border bg-accent/50 transition-colors hover:bg-white">
                <UserCheck className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">{member.name}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{member.role}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card className="rounded-[2.5rem] border-black/5 shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <FileText className="h-5 w-5 text-primary" />
              {t('marketing.info.legalTitle')}
            </CardTitle>
            <CardDescription>
              {t('marketing.info.legalDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            <div className="divide-y border-t">
              {legalDocuments.map((doc) => (
                <a key={doc.name} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 hover:bg-accent transition-colors">
                  <span className="font-bold text-sm">{doc.name}</span>
                  <Eye className="h-5 w-5 text-muted-foreground" />
                </a>
              ))}
              <Link href="/settings/contracts" className="flex items-center justify-between p-6 hover:bg-primary/5 transition-colors text-primary font-black uppercase text-xs tracking-widest">
                <span>{t('marketing.info.viewAllContracts')}</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <PublicFooter currentPageLabel={t('marketing.info.footerLabel')} />
    </div>
  );
}

