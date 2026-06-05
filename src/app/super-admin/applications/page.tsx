'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, Clock, ShieldCheck, Building, Store, School, Mail, MapPin, User } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

// Map entityType values from the form to Turkish labels
const entityTypeLabels: Record<string, string> = {
  'NGO': 'STK',
  'BRAND': 'Marka',
  'CLUB': 'Kulüp',
};

const entityTypeIcons: Record<string, React.ElementType> = {
  'NGO': Building,
  'BRAND': Store,
  'CLUB': School,
};

interface ApplicationDoc {
  id: string;
  name?: string;
  org?: string;
  entityType?: string;
  type?: string;
  date?: string;
  city?: string;
  district?: string;
  location?: string;
  status?: string;
  userId?: string;
  about?: string;
  logoUrl?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  email?: string;
  phone?: string;
  phoneCode?: string;
  website?: string;
  social?: { instagram?: string; twitter?: string; linkedin?: string; facebook?: string };
  shortName?: string;
  country?: string;
  neighborhood?: string;
  addressLine?: string;
  communicationAddress?: string;
  sector?: string;
  category?: string;
  brandStatus?: string;
  donationCategories?: Array<{ customCategory?: string; category?: string; rate?: string | number }>;
  clubType?: string;
  universityName?: string;
  clubCategory?: string;
  orgSubType?: string;
  registryNo?: string;
  legalTitle?: string;
  slogan?: string;
  selectedBeneficiaries?: string[];
  selectedServiceAreas?: string[];
  authorized?: { name?: string; role?: string; email?: string; phone?: string; phoneCode?: string };
}

// Helper to get display name from application data
const getAppName = (app: ApplicationDoc): string => app.name || app.org || 'Bilinmeyen Kuruluş';
const getAppType = (app: ApplicationDoc): string => entityTypeLabels[app.entityType as string] || app.entityType || app.type || 'Belirtilmemiş';
const _getAppDate = (app: ApplicationDoc): string => app.date || '';
const getAppLocation = (app: ApplicationDoc): string => {
  if (app.city && app.district) return `${app.district}, ${app.city}`;
  if (app.city) return app.city;
  return app.location || '';
};

const InfoField = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start py-2 text-sm border-b border-dashed last:border-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="font-semibold text-right max-w-[60%] break-words">{value}</span>
    </div>
  );
};

const ApplicationDetailsDialog = ({ application: app }: { application: ApplicationDoc }) => {
  const name = getAppName(app);
  const type = getAppType(app);
  const _location = getAppLocation(app);
  const EntityIcon = entityTypeIcons[app.entityType as string] || Building;

  return (
    <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <EntityIcon className="h-5 w-5 text-primary" />
          {name}
        </DialogTitle>
        <DialogDescription>
          {type} Başvurusu • {app.date || 'Tarih Yok'}
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
        {/* Kuruluş Bilgileri */}
        <Card className="rounded-2xl border-black/5 bg-muted/30">
          <CardHeader><CardTitle className="text-base">Kuruluş Bilgileri</CardTitle></CardHeader>
          <CardContent className="space-y-0">
            <InfoField label="Kuruluş Adı" value={name} />
            <InfoField label="Kısa Adı" value={app.shortName} />
            <InfoField label="Kuruluş Türü" value={type} />
            <InfoField label="Alt Tür" value={app.orgSubType} />
            <InfoField label="Kütük No" value={app.registryNo} />
            <InfoField label="Yasal Ünvan" value={app.legalTitle} />
            <InfoField label="Slogan" value={app.slogan} />
            <InfoField label="Sektör" value={app.sector} />
            <InfoField label="Ülke" value={app.country} />
            {app.entityType === 'CLUB' && (
              <>
                <InfoField label="Kulüp Türü" value={app.clubType === 'university' ? 'Üniversite' : app.clubType === 'highschool' ? 'Lise' : app.clubType} />
                <InfoField label="Üniversite" value={app.universityName} />
                <InfoField label="Kulüp Kategorisi" value={app.clubCategory} />
              </>
            )}
            {app.entityType === 'BRAND' && (
              <InfoField label="İşletme Statüsü" value={app.brandStatus} />
            )}
          </CardContent>
        </Card>

        {/* Adres Bilgileri */}
        {(app.city || app.addressLine) && (
          <Card className="rounded-2xl border-black/5">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Adres</CardTitle></CardHeader>
            <CardContent className="space-y-0">
              <InfoField label="İl" value={app.city} />
              <InfoField label="İlçe" value={app.district} />
              <InfoField label="Mahalle" value={app.neighborhood} />
              <InfoField label="Adres" value={app.addressLine || app.communicationAddress} />
            </CardContent>
          </Card>
        )}

        {/* İletişim */}
        <Card className="rounded-2xl border-black/5">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> İletişim</CardTitle></CardHeader>
          <CardContent className="space-y-0">
            <InfoField label="E-posta" value={app.email} />
            <InfoField label="Telefon" value={app.phone ? `+${app.phoneCode || '90'} ${app.phone}` : undefined} />
            <InfoField label="Web Sitesi" value={app.website} />
            <InfoField label="Instagram" value={app.social?.instagram} />
            <InfoField label="LinkedIn" value={app.social?.linkedin} />
            <InfoField label="X (Twitter)" value={app.social?.twitter} />
          </CardContent>
        </Card>

        {/* Yetkili Kişi */}
        {app.authorized?.name && (
          <Card className="rounded-2xl border-black/5">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Yetkili Kişi</CardTitle></CardHeader>
            <CardContent className="space-y-0">
              <InfoField label="Ad Soyad" value={app.authorized.name} />
              <InfoField label="Görev" value={app.authorized.role} />
              <InfoField label="E-posta" value={app.authorized.email} />
              <InfoField label="Telefon" value={app.authorized.phone ? `+${app.authorized.phoneCode || '90'} ${app.authorized.phone}` : undefined} />
            </CardContent>
          </Card>
        )}

        {/* Bağış Kategorileri */}
        {app.donationCategories && app.donationCategories.length > 0 && (
          <Card className="rounded-2xl border-black/5">
            <CardHeader><CardTitle className="text-base">Bağış Kategorileri</CardTitle></CardHeader>
            <CardContent className="space-y-0">
              {app.donationCategories.map((cat, i: number) => (
                <InfoField key={i} label={cat.customCategory || cat.category || `Kategori ${i + 1}`} value={cat.rate ? `%${cat.rate}` : 'Oran Belirtilmemiş'} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Faydalanıcı & Hizmet Alanları */}
        {((app.selectedBeneficiaries?.length ?? 0) > 0 || (app.selectedServiceAreas?.length ?? 0) > 0) && (
          <Card className="rounded-2xl border-black/5">
            <CardHeader><CardTitle className="text-base">Faaliyet Alanları</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(app.selectedBeneficiaries?.length ?? 0) > 0 && (
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Faydalanıcılar:</p>
                  <p className="font-semibold">{app.selectedBeneficiaries!.join(', ')}</p>
                </div>
              )}
              {(app.selectedServiceAreas?.length ?? 0) > 0 && (
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Hizmet Alanları:</p>
                  <p className="font-semibold">{app.selectedServiceAreas!.join(', ')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Durum */}
        <Card className="rounded-2xl border-black/5">
          <CardHeader><CardTitle className="text-base">Durum Takibi</CardTitle></CardHeader>
          <CardContent className="space-y-0">
            <InfoField label="Mevcut Durum" value={app.status} />
            <InfoField label="Başvuru Tarihi" value={app.date} />
            {app.userId && <InfoField label="Başvuran Kullanıcı ID" value={app.userId} />}
          </CardContent>
        </Card>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" className="rounded-xl">Kapat</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};

const PendingApplicationCard = ({ item, onApprove, onReject }: { item: ApplicationDoc, onApprove: (id: string, userId?: string) => void, onReject: (id: string) => void }) => {
  const name = getAppName(item);
  const type = getAppType(item);
  const date = item.date || '';
  const location = getAppLocation(item);
  const EntityIcon = entityTypeIcons[item.entityType as string] || Building;

  return (
    <Card className="rounded-2xl border-black/5 hover:shadow-md transition-all group">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <EntityIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              {date} • {type} {location && `• ${location}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="flex-1 sm:flex-grow-0 rounded-xl font-bold">İncele</Button>
            </DialogTrigger>
            <ApplicationDetailsDialog application={item} />
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-grow-0 text-green-600 border-green-600 hover:bg-green-50 rounded-xl font-bold"
            onClick={() => onApprove(item.id, item.userId)}
          >
            Onayla
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 sm:flex-grow-0 text-destructive hover:bg-destructive/10 rounded-xl font-bold"
            onClick={() => onReject(item.id)}
          >
            Reddet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ApplicationsPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const appsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.applications), [db]);
  const { data: applications, isLoading } = useCollection(appsQuery);

  const slugify = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const createEntityFromApp = async (app: ApplicationDoc): Promise<string | null> => {
    const entityType = app.entityType;
    const name = app.name || app.org || 'Yeni Kuruluş';

    const common = {
      name,
      slug: slugify(name),
      about: app.about || '',
      logoUrl: app.logoUrl || '',
      avatarUrl: app.avatarUrl || app.logoUrl || '',
      coverPhotoUrl: app.coverPhotoUrl || '',
      contact: {
        email: app.email || '',
        phone: app.phone || '',
        website: app.website || '',
        social: app.social || {},
      },
      location: {
        country: app.country || 'Türkiye',
        city: app.city || '',
        district: app.district || '',
        neighborhood: app.neighborhood || '',
        fullAddress: app.addressLine || app.communicationAddress || '',
      },
      status: 'Aktif',
      createdAt: serverTimestamp(),
      sourceApplicationId: app.id,
    };

    try {
      if (entityType === 'BRAND') {
        const ref = await addDoc(collection(db, COLLECTIONS.brands), {
          ...common,
          type: 'brand',
          category: app.sector || app.category || '',
          brandStatus: app.brandStatus || '',
          donationRate: 0,
          donationCategories: app.donationCategories || [],
          link: app.website || '',
        });
        return ref.id;
      }
      if (entityType === 'CLUB') {
        const ref = await addDoc(collection(db, COLLECTIONS.clubs), {
          ...common,
          type: app.clubType || 'university',
          university: app.universityName || '',
          category: app.clubCategory || '',
          members: 0,
          points: 0,
          // Kayıt formunda başkan olarak başvuran kullanıcı kulübün doğal yöneticisi.
          adminUserId: app.userId || '',
        });
        return ref.id;
      }
      if (entityType === 'NGO') {
        const ref = await addDoc(collection(db, COLLECTIONS.ngos), {
          ...common,
          type: app.orgSubType || 'Dernek',
          category: app.sector || '',
          registryNo: app.registryNo || '',
          // Kanonik kütük alanı: /k/<kutukNo> kısa linki bunu sorgular.
          kutukNo: app.registryNo || '',
          legalTitle: app.legalTitle || '',
          slogan: app.slogan || '',
          transparencyScore: 0,
          selectedBeneficiaries: app.selectedBeneficiaries || [],
          selectedServiceAreas: app.selectedServiceAreas || [],
          stats: { followers: 0, volunteers: 0, projects: 0 },
        });
        return ref.id;
      }
    } catch (err) {
      console.error('Failed to create entity from application:', err);
      throw err;
    }
    return null;
  };

  const handleUpdateStatus = async (id: string, newStatus: 'Beklemede' | 'Onaylandı' | 'Reddedildi', userId?: string) => {
    const appRef = doc(db, COLLECTIONS.applications, id);
    const app = (applications || []).find((a) => (a as ApplicationDoc).id === id) as ApplicationDoc | undefined;

    if (newStatus === 'Onaylandı' && app) {
      try {
        const entityId = await createEntityFromApp(app);
        updateDocumentNonBlocking(appRef, {
          status: newStatus,
          approvedAt: serverTimestamp(),
          createdEntityId: entityId,
        });

        if (userId) {
          const userRef = doc(db, COLLECTIONS.users, userId);
          // Super-admin'in rolünü ngo-admin'e düşürme; sadece henüz super-admin olmayanları yükselt.
          try {
            const userSnap = await getDoc(userRef);
            const currentRole = userSnap.exists() ? (userSnap.data() as { role?: string }).role : null;
            if (currentRole !== 'super-admin') {
              updateDocumentNonBlocking(userRef, { role: 'ngo-admin' });
            }
          } catch {
            // Hata durumunda yine de ngo-admin yap (eski davranış)
            updateDocumentNonBlocking(userRef, { role: 'ngo-admin' });
          }
        }

        // Kulüp başvurusu: başkan olarak kayıt olan kullanıcıyı kulübün doğal
        // yöneticisi (Kulüp Başkanı) yap. adminUserId zaten club doc'unda set edildi;
        // burada userInvitations kaydı + kullanıcı doc rol başlığı yazılır.
        // Super-admin bu rolü /super-admin/clubs üzerinden sonradan değiştirebilir.
        if (entityId && app.entityType === 'CLUB' && userId) {
          const presidentName =
            (app as { clubPresidentName?: string }).clubPresidentName ||
            app.authorized?.name ||
            app.name ||
            'Kulüp Başkanı';
          try {
            await addDoc(collection(db, COLLECTIONS.userInvitations), {
              clubId: entityId,
              inviteeUserId: userId,
              inviteeName: presidentName,
              role: 'Kulüp Başkanı',
              status: 'accepted',
              invitedBy: 'system-approval',
              invitedAt: serverTimestamp(),
              autoAcceptedBy: 'system-approval',
            });
            updateDocumentNonBlocking(doc(db, COLLECTIONS.users, userId), {
              managedClubId: entityId,
              clubRoleTitle: 'Kulüp Başkanı',
              roleTitle: 'Kulüp Başkanı',
            });
          } catch (e) {
            console.error('Kulüp başkanı atama başarısız:', e);
          }
        }

        const entityTypeLabel = entityTypeLabels[app.entityType as string] || 'Kuruluş';
        toast({
          title: 'Başvuru Onaylandı',
          description: entityId
            ? `${entityTypeLabel} yayına alındı. ${userId ? 'Kullanıcıya yönetici yetkisi verildi.' : ''}`
            : 'Başvuru onaylandı ancak kuruluş oluşturulamadı. Manuel kontrol gerekli.',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Kuruluş oluşturulurken bir hata oluştu.';
        toast({
          variant: 'destructive',
          title: 'Onay Başarısız',
          description: message,
        });
      }
      return;
    }

    updateDocumentNonBlocking(appRef, { status: newStatus });
    toast({
      title: newStatus === 'Reddedildi' ? 'Başvuru Reddedildi' : 'Başvuru Beklemeye Alındı',
      description: 'İşlem başarıyla kaydedildi.',
    });
  };

  const sortedApps = useMemo(() => {
    if (!applications) return { pending: [], approved: [], rejected: [] };
    const safeSorter = (a: ApplicationDoc, b: ApplicationDoc) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    };
    const apps = applications as ApplicationDoc[];
    return {
      pending: apps.filter((a) => a.status === 'Beklemede').sort(safeSorter),
      approved: apps.filter((a) => a.status === 'Onaylandı').sort(safeSorter),
      rejected: apps.filter((a) => a.status === 'Reddedildi').sort(safeSorter),
    };
  }, [applications]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Başvurular Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Başvuru Yönetimi</h1>
        <p className="text-muted-foreground text-sm font-medium">STK, Marka ve Kulüp başvurularını gerçek zamanlı denetleyin.</p>
      </div>

      <div className="p-4 bg-primary/5 border border-primary/10 rounded-[2rem] flex items-start gap-4">
        <ShieldCheck className="h-6 w-6 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold text-sm">Otomatik Yetkilendirme Sistemi Aktif</p>
          <p className="text-xs text-muted-foreground leading-relaxed">Onaylanan kurumsal başvuruların sahiplerine otomatik olarak "Yönetici" (ngo-admin) yetkisi tanımlanır ve "Yönetim Paneli" menüsü görünür hale gelir.</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 rounded-2xl bg-muted/50 p-1.5 backdrop-blur-xl">
          <TabsTrigger value="pending" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <Clock className="mr-2 h-4 w-4" /> Bekleyenler ({sortedApps.pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <CheckCircle className="mr-2 h-4 w-4" /> Onaylananlar
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <XCircle className="mr-2 h-4 w-4" /> Reddedilenler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-8 space-y-4">
          {sortedApps.pending.length > 0 ? (
            sortedApps.pending.map((app) => (
              <PendingApplicationCard
                key={app.id}
                item={app}
                onApprove={(id, userId) => handleUpdateStatus(id, 'Onaylandı', userId)}
                onReject={(id) => handleUpdateStatus(id, 'Reddedildi')}
              />
            ))
          ) : (
            <div className="text-center py-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-black/5">
              <CheckCircle className="h-12 w-12 text-green-500/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Bekleyen başvuru bulunmuyor.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-8 space-y-4">
          {sortedApps.approved.length > 0 ? sortedApps.approved.map((app) => {
            const name = getAppName(app);
            const type = getAppType(app);
            const EntityIcon = entityTypeIcons[app.entityType as string] || Building;
            return (
              <Card key={app.id} className="rounded-2xl border-black/5 bg-green-50/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
                      <EntityIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold">{name}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{type} • ONAYLANDI • {app.date}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(app.id, 'Beklemede')}>Geri Al</Button>
                </CardContent>
              </Card>
            );
          }) : (
            <div className="text-center py-12 text-muted-foreground text-sm">Henüz onaylanmış başvuru yok.</div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-8 space-y-4">
          {sortedApps.rejected.length > 0 ? sortedApps.rejected.map((app) => {
            const name = getAppName(app);
            const type = getAppType(app);
            return (
              <Card key={app.id} className="rounded-2xl border-black/5 opacity-60">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-bold">
                      {name[0]}
                    </div>
                    <div>
                      <p className="font-bold">{name}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{type} • REDDEDİLDİ • {app.date}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(app.id, 'Beklemede')}>Yeniden Değerlendir</Button>
                </CardContent>
              </Card>
            );
          }) : (
            <div className="text-center py-12 text-muted-foreground text-sm">Henüz reddedilmiş başvuru yok.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
