'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { FileText, Loader2, CheckCircle, XCircle, Clock, ShieldCheck, Building, Store, School, Mail, Phone, Globe, MapPin, User } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, getDocs } from 'firebase/firestore';

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

// Helper to get display name from application data
const getAppName = (app: any): string => app.name || app.org || 'Bilinmeyen Kuruluş';
const getAppType = (app: any): string => entityTypeLabels[app.entityType] || app.entityType || app.type || 'Belirtilmemiş';
const getAppDate = (app: any): string => app.date || '';
const getAppLocation = (app: any): string => {
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

const ApplicationDetailsDialog = ({ application: app }: { application: any }) => {
  const name = getAppName(app);
  const type = getAppType(app);
  const location = getAppLocation(app);
  const EntityIcon = entityTypeIcons[app.entityType] || Building;

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
              {app.donationCategories.map((cat: any, i: number) => (
                <InfoField key={i} label={cat.customCategory || cat.category || `Kategori ${i + 1}`} value={cat.rate ? `%${cat.rate}` : 'Oran Belirtilmemiş'} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Faydalanıcı & Hizmet Alanları */}
        {(app.selectedBeneficiaries?.length > 0 || app.selectedServiceAreas?.length > 0) && (
          <Card className="rounded-2xl border-black/5">
            <CardHeader><CardTitle className="text-base">Faaliyet Alanları</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {app.selectedBeneficiaries?.length > 0 && (
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Faydalanıcılar:</p>
                  <p className="font-semibold">{app.selectedBeneficiaries.join(', ')}</p>
                </div>
              )}
              {app.selectedServiceAreas?.length > 0 && (
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Hizmet Alanları:</p>
                  <p className="font-semibold">{app.selectedServiceAreas.join(', ')}</p>
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

const PendingApplicationCard = ({ item, onApprove, onReject }: { item: any, onApprove: (id: string, userId?: string, app?: any) => void, onReject: (id: string) => void }) => {
  const name = getAppName(item);
  const type = getAppType(item);
  const date = getAppDate(item);
  const location = getAppLocation(item);
  const EntityIcon = entityTypeIcons[item.entityType] || Building;

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
            onClick={() => onApprove(item.id, item.userId, item)}
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

  const appsQuery = useMemoFirebase(() => collection(db, 'applications'), [db]);
  const { data: applications, isLoading } = useCollection(appsQuery);

  const handleUpdateStatus = (id: string, newStatus: 'Beklemede' | 'Onaylandı' | 'Reddedildi', userId?: string, application?: any) => {
    const appRef = doc(db, 'applications', id);
    updateDocumentNonBlocking(appRef, { status: newStatus });

    if (newStatus === 'Onaylandı' && userId && application) {
      // Only create NGO if it doesn't already exist
      if (application.entityType === 'NGO') {
        // Create NGO entry
        const ngoData = {
          name: application.name,
          shortName: application.shortName || application.name,
          category: application.sector || 'Diğer',
          type: application.orgSubType || 'Dernek',
          avatarUrl: '',
          coverPhotoUrl: '',
          stats: {
            followers: 0,
            donors: 0,
            volunteers: 0,
            volunteerHours: 0,
            projects: 0,
            totalDonation: 0,
            donationCount: 0,
            avgDonation: 0,
            highestSingleDonation: 0,
            peopleReached: 0,
          },
          transparencyScore: 0,
          about: '',
          joinDate: new Date().toLocaleDateString('tr-TR'),
          supportedSDGs: [],
          beneficiaryGroups: application.selectedBeneficiaries || [],
          memberOf: [],
          contact: {
            email: application.email || '',
            website: application.website || '',
            social: application.social || { instagram: '', linkedin: '', twitter: '' },
          },
          donationByCategory: application.donationCategories || [],
          registryNo: application.registryNo,
          legalTitle: application.legalTitle,
          slogan: application.slogan,
          userId: userId,
          city: application.city,
          district: application.district,
          neighborhood: application.neighborhood,
          addressLine: application.addressLine,
          phone: application.phone,
          authorized: application.authorized,
          status: 'Aktif',
          createdAt: new Date().toISOString(),
        };

        addDocumentNonBlocking(collection(db, 'ngos'), ngoData);
      }

      // Update user role
      const userRef = doc(db, 'users', userId);
      updateDocumentNonBlocking(userRef, { role: 'ngo-admin' });
      toast({
        title: "Başvuru Onaylandı ✓",
        description: application.entityType === 'NGO' ? "STK profili oluşturuldu ve yönetim paneli erişimi verildi." : "Yetkilendirme yapıldı.",
      });
    }

    if (newStatus !== 'Onaylandı') {
      toast({
        title: newStatus === 'Reddedildi' ? "Başvuru Reddedildi" : "Başvuru Beklemeye Alındı",
        description: "İşlem başarıyla Firestore üzerine yansıtıldı.",
      });
    }
  };

  const sortedApps = useMemo(() => {
    if (!applications) return { pending: [], approved: [], rejected: [] };
    const safeSorter = (a: any, b: any) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    };
    return {
      pending: applications.filter((a: any) => a.status === 'Beklemede').sort(safeSorter),
      approved: applications.filter((a: any) => a.status === 'Onaylandı').sort(safeSorter),
      rejected: applications.filter((a: any) => a.status === 'Reddedildi').sort(safeSorter),
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
            sortedApps.pending.map((app: any) => (
              <PendingApplicationCard
                key={app.id}
                item={app}
                onApprove={(id, userId, application) => handleUpdateStatus(id, 'Onaylandı', userId, application)}
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
          {sortedApps.approved.length > 0 ? sortedApps.approved.map((app: any) => {
            const name = getAppName(app);
            const type = getAppType(app);
            const EntityIcon = entityTypeIcons[app.entityType] || Building;
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
          {sortedApps.rejected.length > 0 ? sortedApps.rejected.map((app: any) => {
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
