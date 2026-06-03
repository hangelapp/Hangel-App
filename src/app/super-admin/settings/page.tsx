'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { Handshake, ChevronRight, ShieldCheck, Bell, Loader2, Save } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';

// Bildirim kanalları — Switch column'larında gösterilir.
const NOTIFICATION_CHANNELS = ['inApp', 'email', 'sms'] as const;
type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

// Süper-admin'in karar verdiği event kataloğu. Yeni event eklemek için
// DEFAULT_EVENT_SETTINGS'e bir satır + translations.ts (super_admin_settings.events).
const NOTIFICATION_EVENTS = [
  'new_ngo_application',
  'new_brand_application',
  'payment_received',
  'payment_failed',
  'system_error',
  'new_user_signup',
  'emergency_request_created',
  'weekly_summary',
] as const;
type NotificationEventKey = (typeof NOTIFICATION_EVENTS)[number];

type EventChannelMap = Record<NotificationChannel, boolean>;
type NotificationsState = Record<NotificationEventKey, EventChannelMap>;

// Kritik event'ler ON (yeni başvuru, ödeme başarısız, sistem hatası, acil kan);
// informational OFF (yeni kayıt, ödeme alındı detay push, haftalık özet sadece email).
const DEFAULT_EVENT_SETTINGS: NotificationsState = {
  new_ngo_application:        { inApp: true,  email: true,  sms: false },
  new_brand_application:      { inApp: true,  email: true,  sms: false },
  payment_received:           { inApp: false, email: false, sms: false },
  payment_failed:             { inApp: true,  email: true,  sms: false },
  system_error:               { inApp: true,  email: true,  sms: true  },
  new_user_signup:            { inApp: false, email: false, sms: false },
  emergency_request_created:  { inApp: true,  email: true,  sms: true  },
  weekly_summary:             { inApp: false, email: true,  sms: false },
};

// Firestore doc shape (superAdminSettings/{adminUid}).
type SuperAdminSettingsDoc = {
  notifications?: Partial<Record<NotificationEventKey, Partial<EventChannelMap>>>;
};

function mergeNotificationDefaults(
  remote: SuperAdminSettingsDoc['notifications'] | undefined,
): NotificationsState {
  const out = {} as NotificationsState;
  for (const ev of NOTIFICATION_EVENTS) {
    const defaults = DEFAULT_EVENT_SETTINGS[ev];
    const remoteEv = remote?.[ev] ?? {};
    out[ev] = {
      inApp: typeof remoteEv.inApp === 'boolean' ? remoteEv.inApp : defaults.inApp,
      email: typeof remoteEv.email === 'boolean' ? remoteEv.email : defaults.email,
      sms:   typeof remoteEv.sms   === 'boolean' ? remoteEv.sms   : defaults.sms,
    };
  }
  return out;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, COLLECTIONS.superAdminSettings, authUser.uid);
  }, [firestore, authUser]);

  const { data: settingsDoc, isLoading: isSettingsLoading } =
    useDoc<SuperAdminSettingsDoc>(settingsRef);

  const [notifications, setNotifications] = useState<NotificationsState>(DEFAULT_EVENT_SETTINGS);
  const [saving, setSaving] = useState(false);

  // Hydrate from Firestore as soon as the doc resolves (covers "doc yok" case
  // by falling back to defaults).
  useEffect(() => {
    if (isSettingsLoading) return;
    setNotifications(mergeNotificationDefaults(settingsDoc?.notifications));
  }, [settingsDoc, isSettingsLoading]);

  const handleToggle = (ev: NotificationEventKey, channel: NotificationChannel) => {
    setNotifications((prev) => ({
      ...prev,
      [ev]: { ...prev[ev], [channel]: !prev[ev][channel] },
    }));
  };

  const handleSaveNotifications = async () => {
    if (!settingsRef) {
      toast({
        variant: 'destructive',
        title: t('super_admin_settings.toastSaveFailed'),
        description: t('super_admin_settings.loadingLogin'),
      });
      return;
    }
    setSaving(true);
    try {
      await setDoc(
        settingsRef,
        { notifications, updatedAt: serverTimestamp() },
        { merge: true },
      );
      toast({
        title: t('super_admin_settings.toastSaved'),
        description: t('super_admin_settings.toastSavedDesc'),
      });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: t('super_admin_settings.toastSaveFailed'),
        description:
          err.code === 'permission-denied'
            ? t('super_admin_settings.toastPermDenied')
            : t('super_admin_settings.toastGenericErr'),
      });
    } finally {
      setSaving(false);
    }
  };

  const isAuthBlocked = isUserLoading || !authUser;
  const channels = useMemo(() => NOTIFICATION_CHANNELS, []);

  return (
    <>
      <h1 className="text-lg font-semibold md:text-2xl">Panel Ayarları</h1>

      <Card>
        <CardHeader>
          <CardTitle>Alt Modüller</CardTitle>
          <CardDescription>Belirli alanlara özel ayar sayfaları.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link
            href="/super-admin/set-superadmin"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Yetkili & Rol Yönetimi</p>
              <p className="text-xs text-muted-foreground">
                Kullanıcı adı veya telefon ile kişi bul, süper admin yetkilerini sayfa sayfa
                işaretleyerek ata. Ekip kurarken herkese tüm yetkiyi vermeden delege et.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link
            href="/super-admin/settings/volunteer-scoring"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Gönüllülük Puantajı</p>
              <p className="text-xs text-muted-foreground">
                İlan iş kalemleri, saat başı etki puanı ve adam-saat maliyeti.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle>{t('super_admin_settings.notifTitle')}</CardTitle>
              <CardDescription>{t('super_admin_settings.notifDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthBlocked ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[1fr_repeat(3,90px)] gap-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div>{t('super_admin_settings.colEvent')}</div>
                <div className="text-center">{t('super_admin_settings.colInApp')}</div>
                <div className="text-center">{t('super_admin_settings.colEmail')}</div>
                <div className="text-center">{t('super_admin_settings.colSms')}</div>
              </div>
              <div className="space-y-2">
                {NOTIFICATION_EVENTS.map((ev) => (
                  <div
                    key={ev}
                    className="grid grid-cols-1 md:grid-cols-[1fr_repeat(3,90px)] gap-3 md:gap-2 items-center p-3 border rounded-lg"
                  >
                    <div className="space-y-0.5">
                      <Label className="font-medium text-sm">
                        {t(`super_admin_settings.events.${ev}`)}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t(`super_admin_settings.events.${ev}_desc`)}
                      </p>
                    </div>
                    {channels.map((channel) => (
                      <div
                        key={channel}
                        className="flex items-center md:justify-center justify-between gap-2 md:gap-0"
                      >
                        <span className="md:hidden text-xs text-muted-foreground">
                          {t(
                            channel === 'inApp'
                              ? 'super_admin_settings.colInApp'
                              : channel === 'email'
                              ? 'super_admin_settings.colEmail'
                              : 'super_admin_settings.colSms',
                          )}
                        </span>
                        <Switch
                          checked={notifications[ev][channel]}
                          onCheckedChange={() => handleToggle(ev, channel)}
                          disabled={saving || isSettingsLoading}
                          aria-label={`${ev} ${channel}`}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveNotifications} disabled={saving || isSettingsLoading}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saving ? t('super_admin_settings.saving') : t('super_admin_settings.btnSave')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Genel Platform Ayarları</CardTitle>
          <CardDescription>
            hangel platformunun temel ayarlarını buradan yapılandırın.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Puanlama Katsayıları</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="donation-multiplier">Bağış Puanı Çarpanı</Label>
                <Input id="donation-multiplier" type="number" defaultValue="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volunteer-multiplier">Gönüllülük Puanı Çarpanı</Label>
                <Input id="volunteer-multiplier" type="number" defaultValue="10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-multiplier">Davet Puanı</Label>
                <Input id="invite-multiplier" type="number" defaultValue="100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="badge-multiplier">Rozet Puanı</Label>
                <Input id="badge-multiplier" type="number" defaultValue="250" />
              </div>
            </div>
          </div>
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold">Özellik Yönetimi</h3>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Label htmlFor="feature-story" className="font-medium text-sm flex-1">Etki Hikayem (Yapay Zeka)</Label>
              <Switch id="feature-story" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Label htmlFor="feature-market-ai" className="font-medium text-sm flex-1">Market Asistanı (Yapay Zeka)</Label>
              <Switch id="feature-market-ai" defaultChecked />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button>Değişiklikleri Kaydet</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
