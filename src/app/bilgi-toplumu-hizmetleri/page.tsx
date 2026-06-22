
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users, FileText, Eye, UserCheck, ChevronRight, ArrowLeft, HeartHandshake, Droplet, ShoppingBag, Sparkles, Watch } from 'lucide-react';
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
    { name: 'İsmail Hilmi Adıgüzel', role: t('marketing.info.boardRoleChair') },
    { name: 'Ayşe Yılmaz', role: t('marketing.info.boardRoleViceChair') },
    { name: 'Mehmet Öztürk', role: t('marketing.info.boardRoleMember') },
  ];

  const legalDocuments = [
    { name: t('marketing.info.legalDocTicaret'), url: '#' },
    { name: t('marketing.info.legalDocVergi'), url: '#' },
    { name: t('marketing.info.legalDocFaaliyet'), url: '#' },
  ];

  // Bireysel kullanıcı değer vitrini — bugün canlı özellikler, ilgili sayfalara link.
  const platformFeatures = [
    { icon: HeartHandshake, title: t('marketing.info.platformVolunteeringTitle'), desc: t('marketing.info.platformVolunteeringDesc'), href: '/volunteering', cta: t('marketing.info.platformVolunteeringCta') },
    { icon: Droplet, title: t('marketing.info.platformEmergencyTitle'), desc: t('marketing.info.platformEmergencyDesc'), href: '/emergency', cta: t('marketing.info.platformEmergencyCta') },
    { icon: ShoppingBag, title: t('marketing.info.platformDonationTitle'), desc: t('marketing.info.platformDonationDesc'), href: '/market', cta: t('marketing.info.platformDonationCta') },
    { icon: Sparkles, title: t('marketing.info.platformImpactTitle'), desc: t('marketing.info.platformImpactDesc'), href: '/library', cta: t('marketing.info.platformImpactCta') },
    { icon: Watch, title: t('marketing.info.platformAppleTitle'), desc: t('marketing.info.platformAppleDesc'), href: '/login/selection?action=register', cta: t('marketing.info.platformJoinCta') },
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border">
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
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">{cms.title || t('marketing.info.heroTitleFallback')}</h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl">
            {cms.description || t('marketing.info.heroDescriptionFallback')}
          </p>
          {cms.body && (
            <div className="prose prose-lg max-w-3xl mt-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(cms.body) }} />
          )}
        </div>

        {/* Bireysel kullanıcı değer vitrini — hangel'in bugün sunduğu canlı özellikler. */}
        <section className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{t('marketing.info.platformTitle')}</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl">{t('marketing.info.platformDescription')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {platformFeatures.map((f) => (
              <Link key={f.title} href={f.href} className="group block h-full">
                <Card className="rounded-3xl border-border bg-card p-6 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-3 bg-primary/10 rounded-2xl w-fit mb-4">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-card-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 flex-1">{f.desc}</p>
                  <span className="mt-4 text-sm font-semibold text-primary flex items-center">
                    {f.cta} <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
          <div>
            <Button asChild size="lg" className="rounded-full px-8 h-12 font-bold shadow-lg shadow-primary/20">
              <Link href="/login/selection?action=register">{t('marketing.info.platformJoinCta')}</Link>
            </Button>
          </div>
        </section>

        <Card className="rounded-[2.5rem] border-border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Building2 className="h-5 w-5 text-primary" />
              {t('marketing.info.commercialTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>{t('marketing.info.labelCommercialName')}</strong> {t('marketing.info.valueCommercialName')}</p>
            <p><strong>{t('marketing.info.labelMersis')}</strong> {t('marketing.info.valueMersis')}</p>
            <p><strong>{t('marketing.info.labelAddress')}</strong> {t('marketing.info.valueAddress')}</p>
            <p><strong>{t('marketing.info.labelContactPerson')}</strong> {t('marketing.info.valueContactPerson')}</p>
            <p><strong>{t('marketing.info.labelKep')}</strong> {t('marketing.info.valueKep')}</p>
            <p><strong>{t('marketing.info.labelHosting')}</strong> {t('marketing.info.valueHosting')}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Users className="h-5 w-5 text-primary" />
              {t('marketing.info.boardTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {boardMembers.map((member) => (
              <div key={member.name} className="flex items-center gap-3 p-4 rounded-2xl border bg-accent/50 transition-colors hover:bg-card">
                <UserCheck className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">{member.name}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{member.role}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card className="rounded-[2.5rem] border-border shadow-xl overflow-hidden">
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

