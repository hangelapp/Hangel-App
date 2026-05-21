'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Eye, Loader2, Save } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

type EntityKind = 'ngo' | 'brand' | 'club';

interface PanelSettings {
  notifyNewMessage?: boolean;
  notifyNewVolunteerApplication?: boolean;
  notifyNewDonation?: boolean;
  publicListing?: boolean;
}

interface ManagedEntityDoc {
  id: string;
  name?: string;
  shortName?: string;
  adminUserId?: string;
  panelSettings?: PanelSettings;
}

interface UserDocData {
  id: string;
  managedNgoId?: string;
  managedBrandId?: string;
  managedClubId?: string;
}

const COLLECTION_BY_KIND: Record<EntityKind, string> = {
  ngo: COLLECTIONS.ngos,
  brand: COLLECTIONS.brands,
  club: COLLECTIONS.clubs,
};

const defaultPanelSettings: Required<PanelSettings> = {
  notifyNewMessage: true,
  notifyNewVolunteerApplication: true,
  notifyNewDonation: true,
  publicListing: true,
};

export default function SettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  // ---- Resolve managed entity (NGO / brand / club) — mirrors posts/page.tsx ----
  const adminNgosQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.ngos), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const adminBrandsQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.brands), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const adminClubsQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, COLLECTIONS.clubs), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const { data: adminNgos } = useCollection<ManagedEntityDoc>(adminNgosQ);
  const { data: adminBrands } = useCollection<ManagedEntityDoc>(adminBrandsQ);
  const { data: adminClubs } = useCollection<ManagedEntityDoc>(adminClubsQ);

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser?.uid ? doc(firestore, COLLECTIONS.users, authUser.uid) : null),
    [firestore, authUser?.uid],
  );
  const { data: userData } = useDoc<UserDocData>(userDocRef);

  const fallbackNgoRef = useMemoFirebase(
    () => (firestore && userData?.managedNgoId ? doc(firestore, COLLECTIONS.ngos, userData.managedNgoId) : null),
    [firestore, userData?.managedNgoId],
  );
  const fallbackBrandRef = useMemoFirebase(
    () => (firestore && userData?.managedBrandId ? doc(firestore, COLLECTIONS.brands, userData.managedBrandId) : null),
    [firestore, userData?.managedBrandId],
  );
  const fallbackClubRef = useMemoFirebase(
    () => (firestore && userData?.managedClubId ? doc(firestore, COLLECTIONS.clubs, userData.managedClubId) : null),
    [firestore, userData?.managedClubId],
  );
  const { data: fallbackNgo } = useDoc<ManagedEntityDoc>(fallbackNgoRef);
  const { data: fallbackBrand } = useDoc<ManagedEntityDoc>(fallbackBrandRef);
  const { data: fallbackClub } = useDoc<ManagedEntityDoc>(fallbackClubRef);

  const selfNgoRef = useMemoFirebase(
    () => (firestore && authUser?.uid ? doc(firestore, COLLECTIONS.ngos, authUser.uid) : null),
    [firestore, authUser?.uid],
  );
  const { data: selfNgo } = useDoc<ManagedEntityDoc>(selfNgoRef);

  const activeEntity = useMemo<{ kind: EntityKind; data: ManagedEntityDoc } | null>(() => {
    const ngo = (adminNgos && adminNgos[0]) || fallbackNgo || selfNgo;
    if (ngo?.id) return { kind: 'ngo', data: ngo };
    const brand = (adminBrands && adminBrands[0]) || fallbackBrand;
    if (brand?.id) return { kind: 'brand', data: brand };
    const club = (adminClubs && adminClubs[0]) || fallbackClub;
    if (club?.id) return { kind: 'club', data: club };
    return null;
  }, [adminNgos, adminBrands, adminClubs, fallbackNgo, fallbackBrand, fallbackClub, selfNgo]);

  const [settings, setSettings] = useState<Required<PanelSettings>>(defaultPanelSettings);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Hydrate switches from the entity doc once it resolves.
  useEffect(() => {
    if (activeEntity?.data?.panelSettings) {
      setSettings({ ...defaultPanelSettings, ...activeEntity.data.panelSettings });
    }
  }, [activeEntity?.data?.panelSettings]);

  const handleToggle = (key: keyof PanelSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const entityRef = useMemo(() => {
    if (!firestore || !activeEntity?.data?.id) return null;
    return doc(firestore, COLLECTION_BY_KIND[activeEntity.kind], activeEntity.data.id);
  }, [firestore, activeEntity?.kind, activeEntity?.data?.id]);

  const handleSave = async () => {
    if (!entityRef) {
      toast({ variant: 'destructive', title: 'Kuruluş bulunamadı', description: 'Ayarlar kaydedilemedi. Lütfen oturumunuzu yenileyin.' });
      return;
    }
    setSaving(true);
    try {
      await updateDoc(entityRef, {
        panelSettings: {
          notifyNewMessage: settings.notifyNewMessage,
          notifyNewVolunteerApplication: settings.notifyNewVolunteerApplication,
          notifyNewDonation: settings.notifyNewDonation,
          publicListing: settings.publicListing,
        },
      });
      toast({ title: 'Ayarlar kaydedildi', description: 'Panel tercihleriniz güncellendi.' });
    } catch (error) {
      console.error('Panel settings save failed:', error);
      const err = error as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: 'Ayarlar kaydedilemedi',
        description: err?.code === 'permission-denied' ? 'Sunucu izin vermedi.' : (err?.message || 'Beklenmeyen bir hata oluştu.'),
      });
    } finally {
      setSaving(false);
    }
  };

  // Danger zone: record a request doc (no direct destructive entity write).
  const handleAccountRequest = async (action: 'freeze' | 'delete') => {
    if (!authUser?.uid || !activeEntity?.data?.id) {
      toast({ variant: 'destructive', title: 'İşlem yapılamadı', description: 'Kuruluş bulunamadı. Lütfen oturumunuzu yenileyin.' });
      return;
    }
    setRequesting(true);
    try {
      await addDoc(collection(firestore, COLLECTIONS.userRequests), {
        type: action === 'freeze' ? 'entity-freeze' : 'entity-delete',
        userId: authUser.uid,
        entityId: activeEntity.data.id,
        entityKind: activeEntity.kind,
        entityName: activeEntity.data.name || activeEntity.data.shortName || '',
        status: 'pending',
        createdAt: Timestamp.now(),
      });
      toast({
        title: 'Talebiniz alındı',
        description: action === 'freeze'
          ? 'Profil dondurma talebiniz ekibimize iletildi.'
          : 'Hesap silme talebiniz ekibimize iletildi. En kısa sürede sizinle iletişime geçeceğiz.',
      });
    } catch (error) {
      console.error('Account request failed:', error);
      const err = error as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: 'Talep gönderilemedi',
        description: err?.code === 'permission-denied' ? 'Sunucu izin vermedi.' : (err?.message || 'Beklenmeyen bir hata oluştu.'),
      });
    } finally {
      setRequesting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Bu sayfayı görüntülemek için oturum açmalısınız.</p>
        </CardContent>
      </Card>
    );
  }

  if (!activeEntity) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Yönettiğiniz bir kuruluş bulunamadı.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Panel ayarları yalnızca kuruluş yöneticileri için kullanılabilir.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel Ayarları</h1>
        <p className="text-muted-foreground">
          {activeEntity.data.name || activeEntity.data.shortName || 'Kuruluşunuz'} için bildirim ve görünürlük tercihlerini yönetin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" /> Bildirim Tercihleri
          </CardTitle>
          <CardDescription>Kuruluşunuzla ilgili hangi durumlarda bildirim almak istediğinizi seçin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="notify-message" className="font-medium">Yeni mesaj bildirimi</Label>
              <p className="text-sm text-muted-foreground">Size yeni bir mesaj geldiğinde bildirim al.</p>
            </div>
            <Switch id="notify-message" checked={settings.notifyNewMessage} onCheckedChange={() => handleToggle('notifyNewMessage')} />
          </div>
          <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="notify-volunteer" className="font-medium">Yeni gönüllü başvurusu bildirimi</Label>
              <p className="text-sm text-muted-foreground">İlanlarınıza yeni bir gönüllü başvurusu geldiğinde bildirim al.</p>
            </div>
            <Switch id="notify-volunteer" checked={settings.notifyNewVolunteerApplication} onCheckedChange={() => handleToggle('notifyNewVolunteerApplication')} />
          </div>
          <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="notify-donation" className="font-medium">Yeni bağış bildirimi</Label>
              <p className="text-sm text-muted-foreground">Kuruluşunuza yeni bir bağış yapıldığında bildirim al.</p>
            </div>
            <Switch id="notify-donation" checked={settings.notifyNewDonation} onCheckedChange={() => handleToggle('notifyNewDonation')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-muted-foreground" /> Görünürlük
          </CardTitle>
          <CardDescription>Kuruluşunuzun platformda nasıl listeleneceğini yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="public-listing" className="font-medium">Herkese açık listeleme</Label>
              <p className="text-sm text-muted-foreground">Kapatıldığında kuruluşunuz keşfet ve arama sonuçlarında gösterilmez.</p>
            </div>
            <Switch id="public-listing" checked={settings.publicListing} onCheckedChange={() => handleToggle('publicListing')} />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Kaydet
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Tehlikeli Bölge</CardTitle>
          <CardDescription>Bu işlemler ekibimiz tarafından gözden geçirilir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Profili Geçici Olarak Dondur</h3>
            <p className="text-sm text-muted-foreground">Profiliniz platformda görünmez olur, ancak verileriniz silinmez.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" className="mt-2" disabled={requesting}>Profili Dondur</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Profili dondurmak istediğinizden emin misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Profiliniz platformda görünmez olur. Talebiniz ekibimize iletilir ve verileriniz silinmez.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleAccountRequest('freeze')}>Talep Gönder</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div>
            <h3 className="font-medium text-destructive">Hesabı Kalıcı Olarak Sil</h3>
            <p className="text-sm text-muted-foreground">Bu işlem geri alınamaz. Talebiniz onaylandığında tüm verileriniz kalıcı olarak silinir.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-2" disabled={requesting}>Hesabı Sil</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hesabı silmek istediğinizden emin misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz. Silme talebiniz ekibimize iletilir; onaylandığında tüm verileriniz kalıcı olarak silinir.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                  <AlertDialogAction
                    className={cn(buttonVariants({ variant: 'destructive' }))}
                    onClick={() => handleAccountRequest('delete')}
                  >
                    Evet, Sil Talebi Gönder
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
