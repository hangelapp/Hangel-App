'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Copy, Code2, Rss, Link2 } from "lucide-react";
import React, { useMemo, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Volunteering, Application as UserApplication } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { VolunteerApplicants } from '@/components/volunteering/volunteer-applicants';


const VolunteerApplicationsTab = ({ opportunities }: { opportunities: Volunteering[] }) => {
    const { toast } = useToast();
    const db = useFirestore();
    const { user: authUser } = useUser();

    const opportunityIds = useMemo(() => opportunities.map(o => o.id), [opportunities]);

    const applicationsQuery = useMemoFirebase(() => {
        if (!db || opportunityIds.length === 0) return null;
        // SADECE bu STK'nın ilanlarına gelen başvuruları çek. Eskiden tüm
        // 'Gönüllülük' başvuruları çekilip client'ta filtreleniyordu — bu hem
        // gizlilik sızıntısıydı (başka STK'ların başvuruları client'a iniyordu)
        // hem de gereksiz okuma. Firestore 'in' en fazla 30 değer alır; tipik
        // STK ilan sayısı bunun çok altında. 30+ ilanı olan nadir durumda
        // ilk 30 ile sorgulanır, kalan client filtresiyle gizlenir.
        const ids = opportunityIds.slice(0, 30);
        return query(collection(db, COLLECTIONS.applications), where('entityId', 'in', ids));
    }, [db, opportunityIds]);

    const { data: allApps, isLoading } = useCollection<UserApplication>(applicationsQuery);

    const applications = useMemo(() => {
        if (!allApps) return [];
        return allApps.filter(app => opportunityIds.includes(app.entityId || ''));
    }, [allApps, opportunityIds]);

    const handleApplication = async (application: UserApplication, decision: 'approved' | 'rejected') => {
        const status = decision === 'approved' ? 'Onaylandı' : 'Reddedildi';
        try {
            await updateDoc(doc(db, COLLECTIONS.applications, application.id), {
                status,
                reviewedAt: serverTimestamp(),
                reviewedBy: authUser?.uid ?? null,
            });

            if (application.userId) {
                await addDoc(collection(db, COLLECTIONS.notifications), {
                    userId: application.userId,
                    type: 'volunteer-application',
                    title: decision === 'approved' ? 'Başvurun Onaylandı' : 'Başvurun Reddedildi',
                    body: decision === 'approved'
                        ? `"${application.title}" gönüllülük başvurunuz onaylandı.`
                        : `"${application.title}" gönüllülük başvurunuz reddedildi.`,
                    read: false,
                    createdAt: serverTimestamp(),
                });
            }

            // 3 tarafa (kullanıcı + STK yöneticisi + süper-admin) fan-out bildirim.
            // Best-effort: hata UI akışını bozmaz.
            try {
                const token = await authUser?.getIdToken();
                if (token) {
                    await fetch('/api/volunteer/application-notify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            applicationId: application.id,
                            stage: decision === 'approved' ? 'approved' : 'rejected',
                        }),
                    });
                }
            } catch (notifyErr) {
                console.error('[ngo-admin/volunteer] application-notify failed', notifyErr);
            }

            toast({
                title: `Başvuru ${status}`,
                description: decision === 'approved'
                    ? 'Gönüllü bilgilendirildi.'
                    : 'Başvuru reddedildi ve gönüllü bilgilendirildi.',
            });
        } catch (err) {
            console.error('[ngo-admin/volunteer] handleApplication failed', err);
            toast({
                variant: 'destructive',
                title: 'İşlem başarısız',
                description: 'Başvuru güncellenirken bir hata oluştu. Lütfen tekrar deneyin.',
            });
        }
    };

    const groupedApplications = useMemo(() => {
        return applications.reduce((acc, app) => {
            const key = app.title;
            if (!acc[key]) acc[key] = [];
            acc[key].push(app);
            return acc;
        }, {} as Record<string, UserApplication[]>);
    }, [applications]);

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;

    return (
        <div className="space-y-6">
            {Object.keys(groupedApplications).length > 0 ? Object.entries(groupedApplications).map(([opportunityTitle, apps]) => (
                <Card key={opportunityTitle}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2">
                        <div>
                            <CardTitle>{opportunityTitle}</CardTitle>
                            <CardDescription>{apps.length} başvuru</CardDescription>
                        </div>
                        {/* Başvuran listesi: indir / yazdır / paylaş (etkinliklerdeki gibi) */}
                        <VolunteerApplicants
                            title={opportunityTitle}
                            applicants={apps.map((a) => ({ name: a.userName || 'Gönüllü', status: a.status, date: a.date }))}
                        />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {apps.map((app) => (
                            <div key={app.id} className="p-3 border rounded-lg flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>{app.userName?.charAt(0) || 'G'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{app.userName || 'Gönüllü'}</p>
                                        <p className="text-xs text-muted-foreground">{app.date}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 basis-full sm:basis-auto justify-end">
                                  <Button variant="outline" size="sm" className="flex-1 sm:flex-grow-0" asChild>
                                    <Link href={`/profile/${app.userId}`}>Profil</Link>
                                  </Button>
                                  <Button variant="secondary" size="sm" className="flex-1 sm:flex-grow-0 text-green-600 border-green-600 hover:bg-green-100" onClick={() => handleApplication(app, 'approved')}>Onayla</Button>
                                  <Button variant="destructive" size="sm" className="flex-1 sm:flex-grow-0" onClick={() => handleApplication(app, 'rejected')}>Reddet</Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )) : <p className="text-center text-muted-foreground p-8">Henüz başvuru bulunmuyor.</p>}
        </div>
    );
};


const OpportunityManagementTab = ({ opportunities, isLoading }: { opportunities: Volunteering[], isLoading: boolean }) => {
    const { toast } = useToast();
    const db = useFirestore();

    const handleToggleStatus = async (opp: Volunteering) => {
        const isActive = (opp as Volunteering & { status?: string }).status !== 'Pasif';
        const nextStatus = isActive ? 'Pasif' : 'Aktif';
        try {
            await updateDoc(doc(db, COLLECTIONS.volunteering, opp.id), {
                status: nextStatus,
                ...(isActive ? { deactivatedAt: serverTimestamp() } : { reactivatedAt: serverTimestamp() }),
            });
            toast({
                title: isActive ? 'İlan Pasife Alındı' : 'İlan Yayına Alındı',
                description: isActive
                    ? 'Gönüllülük ilanı yayından kaldırıldı.'
                    : 'Gönüllülük ilanı yeniden yayınlandı.',
            });
        } catch (err) {
            console.error('[ngo-admin/volunteer] handleToggleStatus failed', err);
            toast({
                variant: 'destructive',
                title: 'İşlem başarısız',
                description: 'İlan durumu güncellenirken bir hata oluştu. Lütfen tekrar deneyin.',
            });
        }
    };

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;

    return (
        <div className="space-y-4">
            {opportunities.length > 0 ? opportunities.map((opp) => {
              const isPassive = (opp as Volunteering & { status?: string }).status === 'Pasif';
              return (
              // Yayındaki (Aktif) ilan renkli/vurgulu; yayında olmayan (Pasif) gri/soluk.
              <Card key={opp.id} className={isPassive ? 'opacity-60 grayscale' : 'border-primary/30 ring-1 ring-primary/10'}>

                <CardHeader className='pb-4'>
                  <CardTitle className="text-base">{opp.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center text-sm">
                    <div>
                        <p><strong>Durum:</strong> <Badge variant={isPassive ? 'secondary' : 'default'}>{isPassive ? 'Pasif' : 'Aktif'}</Badge></p>
                        <p><strong>Başvurular:</strong> {opp.volunteerCount?.applications || 0}</p>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button asChild variant="secondary" size="sm" className='flex-1'>
                        <Link href={`/volunteering/${opp.id}`}>Görüntüle</Link>
                    </Button>
                    {isPassive ? (
                        <Button variant="default" size="sm" className='flex-1' onClick={() => handleToggleStatus(opp)}>Yayına Al</Button>
                    ) : (
                        <Button variant="destructive" size="sm" className='flex-1' onClick={() => handleToggleStatus(opp)}>Pasife Al</Button>
                    )}
                </CardFooter>
              </Card>
              );
            }) : <p className="text-center p-8 text-muted-foreground">Aktif ilanınız bulunmuyor.</p>}
        </div>
    );
};


// Tek kod bloğu kartı (iframe/API/RSS) — kopyalanabilir.
const PublishCodeBlock = ({ icon: Icon, title, desc, value, label, onCopy }: {
  icon: React.ElementType; title: string; desc: string; value: string; label: string;
  onCopy: (text: string, label: string) => void;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {title}</CardTitle>
      <CardDescription className="text-xs">{desc}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
      <pre className="text-[11px] bg-muted rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono">{value}</pre>
      <Button size="sm" variant="outline" onClick={() => onCopy(value, label)}><Copy className="h-3.5 w-3.5 mr-1.5" /> Kopyala</Button>
    </CardContent>
  </Card>
);

// Web'de Yayınla — STK kendi sitesinde gönüllülük ilanlarını göstersin diye
// iframe / JSON API / RSS kodları (tek ilan veya tümü). Tüm uçlar public + CORS.
const PublishTab = ({ ngoId, opportunities }: { ngoId: string | null; opportunities: Volunteering[] }) => {
  const { toast } = useToast();
  const [selected, setSelected] = React.useState<string>('all');
  if (!ngoId) return <p className="text-center text-muted-foreground p-8">Kurum bulunamadı.</p>;

  const base = 'https://hangel.org.tr';
  const embedUrl = selected === 'all'
    ? `${base}/api/public/volunteering/${ngoId}/embed`
    : `${base}/api/public/volunteering/${ngoId}/embed?listing=${selected}`;
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" style="border:0;border-radius:16px" loading="lazy" title="Gönüllülük İlanları"></iframe>`;
  const apiUrl = `${base}/api/public/volunteering/${ngoId}`;
  const rssUrl = `${base}/api/public/volunteering/${ngoId}/rss`;

  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); toast({ title: `${label} kopyalandı` }); }
    catch { toast({ variant: 'destructive', title: 'Kopyalanamadı', description: 'Metni elle seçip kopyalayın.' }); }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 text-xs text-muted-foreground leading-relaxed">
          Gönüllülük ilanlarını kendi web sitende göster. Aşağıdaki kodları sitene yapıştır — ilanlar otomatik güncellenir. Tek bir ilanı yayınlamak için aşağıdan seç.
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Hangi ilan(lar)?</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full h-11 rounded-xl border bg-card px-3 text-sm"
        >
          <option value="all">Tüm yayındaki ilanlar</option>
          {opportunities.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
      </div>

      <PublishCodeBlock icon={Code2} title="iframe (web sitesine göm)" desc="HTML sayfanın istediğin yerine yapıştır." value={iframeCode} label="iframe kodu" onCopy={copy} />
      <PublishCodeBlock icon={Link2} title="JSON API" desc="Geliştirici için: ilanları JSON olarak çek (CORS açık)." value={apiUrl} label="API adresi" onCopy={copy} />
      <PublishCodeBlock icon={Rss} title="RSS akışı" desc="RSS okuyucu / site beslemesi için." value={rssUrl} label="RSS adresi" onCopy={copy} />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Canlı Önizleme</CardTitle></CardHeader>
        <CardContent>
          <iframe src={embedUrl} className="w-full h-[420px] rounded-xl border" loading="lazy" title="Önizleme" />
        </CardContent>
      </Card>
    </div>
  );
};

const VolunteerPage = () => {
  const db = useFirestore();
  // Aktif kurumu tek kaynaktan (ActiveEntityProvider) çöz. Eski kod
  // `searchParams.get('id') || authUser.uid` kullanıyordu: ?id yoksa kullanıcı
  // uid'sine düşüyor ve yanlış/boş scope üretiyordu. useActiveEntity URL →
  // localStorage → managedNgoId → adminUserId önceliğiyle doğru STK id'sini verir,
  // böylece STK yalnızca KENDİ ilanlarını ve onlara gelen başvuruları görür.
  const { id: activeId, isLoading: entityLoading } = useActiveEntity();

  const oppsQuery = useMemoFirebase(() => {
    if (!db || !activeId) return null;
    return query(collection(db, COLLECTIONS.volunteering), where('ngoId', '==', activeId));
  }, [db, activeId]);

  const { data: opportunities, isLoading: oppsLoading } = useCollection<Volunteering>(oppsQuery);
  const isLoading = entityLoading || oppsLoading;

  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h1 className="text-2xl font-bold">Gönüllülük Yönetimi</h1>
            <Button asChild>
              <Link href="/ngo-admin/volunteer/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Yeni İlan Oluştur
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="applications">Başvurular</TabsTrigger>
              <TabsTrigger value="opportunities">İlan Yönetimi</TabsTrigger>
              <TabsTrigger value="publish">Web'de Yayınla</TabsTrigger>
            </TabsList>
            <TabsContent value="applications" className="mt-4">
                <VolunteerApplicationsTab opportunities={opportunities || []} />
            </TabsContent>
            <TabsContent value="opportunities" className="mt-4">
                <OpportunityManagementTab opportunities={opportunities || []} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="publish" className="mt-4">
                <PublishTab ngoId={activeId} opportunities={opportunities || []} />
            </TabsContent>
          </Tabs>
        </div>
    </Suspense>
  );
};

export default function Page() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <VolunteerPage />
        </Suspense>
    );
}
