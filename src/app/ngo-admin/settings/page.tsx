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
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { useTranslation } from '@/components/providers/language-provider';

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
  const { t } = useTranslation();
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  // ---- Aktif kurum (ActiveEntityProvider) — layout banner ile tek kaynak ----
  const { id: activeId, kind: activeKind } = useActiveEntity();
  const { data: activeDoc } = useActiveEntityDoc<ManagedEntityDoc>();

  const activeEntity = useMemo<{ kind: EntityKind; data: ManagedEntityDoc } | null>(() => {
    if (!activeId || !activeKind || !activeDoc) return null;
    return { kind: activeKind, data: activeDoc };
  }, [activeId, activeKind, activeDoc]);

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
      toast({ variant: 'destructive', title: t('ngo_admin_settings.toastEntityMissing'), description: t('ngo_admin_settings.toastEntityMissingDesc') });
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
      toast({ title: t('ngo_admin_settings.toastSaved'), description: t('ngo_admin_settings.toastSavedDesc') });
    } catch (error) {
      console.error('Panel settings save failed:', error);
      const err = error as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: t('ngo_admin_settings.toastSaveFailed'),
        description: err?.code === 'permission-denied' ? t('ngo_admin_settings.toastPermDenied') : (err?.message || t('ngo_admin_settings.toastGenericErr')),
      });
    } finally {
      setSaving(false);
    }
  };

  // Danger zone: record a request doc (no direct destructive entity write).
  const handleAccountRequest = async (action: 'freeze' | 'delete') => {
    if (!authUser?.uid || !activeEntity?.data?.id) {
      toast({ variant: 'destructive', title: t('ngo_admin_settings.toastReqFailedTitle'), description: t('ngo_admin_settings.toastReqFailedDesc') });
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
        title: t('ngo_admin_settings.toastReqReceived'),
        description: action === 'freeze'
          ? t('ngo_admin_settings.toastReqReceivedFreeze')
          : t('ngo_admin_settings.toastReqReceivedDelete'),
      });
    } catch (error) {
      console.error('Account request failed:', error);
      const err = error as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: t('ngo_admin_settings.toastReqSendFailed'),
        description: err?.code === 'permission-denied' ? t('ngo_admin_settings.toastPermDenied') : (err?.message || t('ngo_admin_settings.toastGenericErr')),
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
          <p className="text-muted-foreground">{t('ngo_admin_settings.loadingLogin')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!activeEntity) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t('ngo_admin_settings.noEntityTitle')}</p>
          <p className="text-sm text-muted-foreground/70 mt-1">{t('ngo_admin_settings.noEntityDesc')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('ngo_admin_settings.title')}</h1>
        <p className="text-muted-foreground">
          {activeEntity.data.name || activeEntity.data.shortName || t('ngo_admin_settings.orgFallback')} {t('ngo_admin_settings.subtitleSuffix')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" /> {t('ngo_admin_settings.notifTitle')}
          </CardTitle>
          <CardDescription>{t('ngo_admin_settings.notifDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="notify-message" className="font-medium">{t('ngo_admin_settings.notifMessageLabel')}</Label>
              <p className="text-sm text-muted-foreground">{t('ngo_admin_settings.notifMessageDesc')}</p>
            </div>
            <Switch id="notify-message" checked={settings.notifyNewMessage} onCheckedChange={() => handleToggle('notifyNewMessage')} />
          </div>
          <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="notify-volunteer" className="font-medium">{t('ngo_admin_settings.notifVolunteerLabel')}</Label>
              <p className="text-sm text-muted-foreground">{t('ngo_admin_settings.notifVolunteerDesc')}</p>
            </div>
            <Switch id="notify-volunteer" checked={settings.notifyNewVolunteerApplication} onCheckedChange={() => handleToggle('notifyNewVolunteerApplication')} />
          </div>
          <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="notify-donation" className="font-medium">{t('ngo_admin_settings.notifDonationLabel')}</Label>
              <p className="text-sm text-muted-foreground">{t('ngo_admin_settings.notifDonationDesc')}</p>
            </div>
            <Switch id="notify-donation" checked={settings.notifyNewDonation} onCheckedChange={() => handleToggle('notifyNewDonation')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-muted-foreground" /> {t('ngo_admin_settings.visibilityTitle')}
          </CardTitle>
          <CardDescription>{t('ngo_admin_settings.visibilityDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="public-listing" className="font-medium">{t('ngo_admin_settings.publicListingLabel')}</Label>
              <p className="text-sm text-muted-foreground">{t('ngo_admin_settings.publicListingDesc')}</p>
            </div>
            <Switch id="public-listing" checked={settings.publicListing} onCheckedChange={() => handleToggle('publicListing')} />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t('ngo_admin_settings.btnSave')}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">{t('ngo_admin_settings.dangerTitle')}</CardTitle>
          <CardDescription>{t('ngo_admin_settings.dangerDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">{t('ngo_admin_settings.freezeTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('ngo_admin_settings.freezeDesc')}</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" className="mt-2" disabled={requesting}>{t('ngo_admin_settings.btnFreeze')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('ngo_admin_settings.freezeConfirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('ngo_admin_settings.freezeConfirmDesc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('ngo_admin_settings.btnCancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleAccountRequest('freeze')}>{t('ngo_admin_settings.btnSendRequest')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div>
            <h3 className="font-medium text-destructive">{t('ngo_admin_settings.deleteTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('ngo_admin_settings.deleteDesc')}</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-2" disabled={requesting}>{t('ngo_admin_settings.btnDelete')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('ngo_admin_settings.deleteConfirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('ngo_admin_settings.deleteConfirmDesc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('ngo_admin_settings.btnCancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    className={cn(buttonVariants({ variant: 'destructive' }))}
                    onClick={() => handleAccountRequest('delete')}
                  >
                    {t('ngo_admin_settings.btnConfirmDelete')}
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
