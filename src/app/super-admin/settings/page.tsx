'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import {
  Handshake,
  ChevronRight,
  ShieldCheck,
  Bell,
  Loader2,
  Save,
  Play,
  Square,
  SlidersHorizontal,
  Sparkles,
  ImageIcon,
  Layers,
  Brain,
  CreditCard,
  Link2,
  DatabaseBackup,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';
import {
  NOTIFICATION_SOUNDS,
  SOUND_ID_DEFAULT,
  SOUND_ID_SILENT,
  type NotificationSound,
} from '@/lib/notification-sounds';
import { AiIntegrationSection } from './_components/ai-integration-section';

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
// Sound preference state: event → sound id ('__silent__' | '__default__' | catalog id).
type SoundsState = Record<NotificationEventKey, string>;

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

// Tüm event'ler için ses varsayılanı = system default. Süper-admin tek tek
// override edebilir; "Sessiz" no-audio, catalog id specific dosya.
const DEFAULT_SOUND_SETTINGS: SoundsState = {
  new_ngo_application:       SOUND_ID_DEFAULT,
  new_brand_application:     SOUND_ID_DEFAULT,
  payment_received:          SOUND_ID_DEFAULT,
  payment_failed:            SOUND_ID_DEFAULT,
  system_error:              SOUND_ID_DEFAULT,
  new_user_signup:           SOUND_ID_DEFAULT,
  emergency_request_created: SOUND_ID_DEFAULT,
  weekly_summary:            SOUND_ID_DEFAULT,
};

// Firestore doc shape (superAdminSettings/{adminUid}).
// notifications.{event}.{channel} → bool (mevcut switch matrisi)
// notifications.{event}.sound     → string|null (yeni ses tercihi, null = sessiz)
type SuperAdminSettingsDoc = {
  notifications?: Partial<
    Record<NotificationEventKey, Partial<EventChannelMap> & { sound?: string | null }>
  >;
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

function mergeSoundDefaults(
  remote: SuperAdminSettingsDoc['notifications'] | undefined,
): SoundsState {
  const out = {} as SoundsState;
  for (const ev of NOTIFICATION_EVENTS) {
    const remoteSound = remote?.[ev]?.sound;
    // null → kullanıcı bilinçli olarak "Sessiz" seçmiş; undefined → henüz set edilmemiş.
    if (remoteSound === null) {
      out[ev] = SOUND_ID_SILENT;
    } else if (typeof remoteSound === 'string' && remoteSound.length > 0) {
      out[ev] = remoteSound;
    } else {
      out[ev] = DEFAULT_SOUND_SETTINGS[ev];
    }
  }
  return out;
}

// Catalog'da web-playable path bul. Web yoksa /sounds/{filename} dene;
// fakat .caf gibi browser'ın çalamadığı format'ları es geç (preview disable).
function resolveWebPath(sound: NotificationSound): string | null {
  if (sound.paths.web && sound.paths.web.length > 0) return sound.paths.web;
  // iOS-only .caf'lar browser'da decode edilemez; web asset eklenene dek preview yok.
  if (!sound.filename) return null;
  const lower = sound.filename.toLowerCase();
  if (lower.endsWith('.caf') || lower.endsWith('.aiff') || lower.endsWith('.aif')) {
    return null;
  }
  return `/sounds/${sound.filename}`;
}

// Ayarlar menüsü — iki tip item:
//   1) section: sağ panelde bir bölüm render eder (id var, href yok)
//   2) link: ayrı bir sayfaya navigate eder (id+href var)
// Bildirimler altına Yetkili & Rol Yönetimi, Gönüllülük Puantajı, App Storlar
// link'lerini direkt menüden erişilebilir hale getirdik (eski "Alt Modüller"
// sekmesi kaldırıldı).
// Her item süper-admin ana sayfa pattern'ına göre: renkli icon + description.
// href varsa Link olarak başka sayfaya navigate, yoksa bu sayfada inline render.
const SETTINGS_SECTIONS = [
  { id: 'notifications', label: 'Bildirimler', icon: Bell, color: 'bg-amber-500',
    description: 'Olay başına in-app + e-posta + SMS kanal seçimi ve bildirim sesi.' },
  { id: 'access-control', label: 'Yetkili & Rol Yönetimi', icon: ShieldCheck, color: 'bg-emerald-600',
    href: '/super-admin/set-superadmin',
    description: 'Kullanıcı bul, süper admin yetkilerini sayfa sayfa atayarak ekibi delege et.' },
  { id: 'volunteer-scoring', label: 'Gönüllülük Puantajı', icon: Handshake, color: 'bg-rose-500',
    href: '/super-admin/settings/volunteer-scoring',
    description: 'İlan iş kalemleri, saat başı etki puanı ve adam-saat maliyeti.' },
  { id: 'app-stores', label: 'App Storlar — Görsel Üreteç', icon: ImageIcon, color: 'bg-violet-500',
    href: '/super-admin/app-stores',
    description: '8 mağaza (App Store, Play, AppGallery, Watch, Mac, Vision, MS, Chrome) için AI ile ekran görüntüsü.' },
  { id: 'messaging-quota', label: 'SMS / E-Posta Kota', icon: Layers, color: 'bg-blue-500',
    href: '/super-admin/messaging-quota',
    description: 'Bayilik havuzu, STK kota tahsisi, kontör paketleri ve bekleyen siparişler.' },
  { id: 'messaging-providers', label: 'SMS / E-Posta Sağlayıcıları', icon: Mail, color: 'bg-violet-500',
    href: '/super-admin/settings/messaging-providers',
    description: 'NetGSM + Resend mevcut. Yeni anlaşma yapıldığında API key + sender + şablon buradan girilir.' },
  { id: 'ai-management', label: 'Yapay Zeka Yönetimi', icon: Brain, color: 'bg-indigo-600',
    href: '/super-admin/ai-management',
    description: 'Kütüphane AI Asistanı ve Proje Yazma Asistanı yapay zekalarını eğit ve yönet.' },
  { id: 'payment-providers', label: 'Ödeme Sağlayıcı Yönetimi', icon: CreditCard, color: 'bg-green-600',
    href: '/super-admin/settings/payment-providers',
    description: 'N-Kolay (mevcut) + İyzico/Stripe/PayTR alternatifleri, komisyon ayarları, A/B test.' },
  { id: 'asset-links', label: 'Digital Asset Links', icon: Link2, color: 'bg-sky-500',
    href: '/super-admin/settings/asset-links',
    description: 'Android Play Store ↔ hangel.org.tr ilişkilendirmesi (assetlinks.json).' },
  { id: 'backup-export', label: 'Yedekleme & Dışa Aktarma', icon: DatabaseBackup, color: 'bg-orange-600',
    href: '/super-admin/settings/backup-export',
    description: 'Firestore + Storage + tüm hangel altyapısının yedeği — tek butonla indir.' },
  { id: 'email-templates', label: 'E-posta Şablonları', icon: Mail, color: 'bg-pink-500',
    href: '/super-admin/settings/email-templates',
    description: 'Resend ile gönderilen tüm e-postaların görsel düzenleyici (KVKK, davet, hoş geldin).' },
  { id: 'general', label: 'Genel Platform', icon: SlidersHorizontal, color: 'bg-slate-600',
    description: 'Platform genel parametreleri.' },
  { id: 'ai', label: 'Yapay Zeka Entegrasyonu', icon: Sparkles, color: 'bg-fuchsia-600',
    description: 'AI provider entegrasyonu (Genkit + Google AI).' },
] as const;
// Eski sol-nav kaldırıldı; tüm bölümler tek sayfada akış halinde gösterilir.
// SETTINGS_SECTIONS yalnızca üstteki link kartlarını üretmek için kullanılır.

export default function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();
  // (eski) activeSection state kaldırıldı — tüm bölümler tek sayfada akış halinde.

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, COLLECTIONS.superAdminSettings, authUser.uid);
  }, [firestore, authUser]);

  const { data: settingsDoc, isLoading: isSettingsLoading } =
    useDoc<SuperAdminSettingsDoc>(settingsRef);

  const [notifications, setNotifications] = useState<NotificationsState>(DEFAULT_EVENT_SETTINGS);
  const [sounds, setSounds] = useState<SoundsState>(DEFAULT_SOUND_SETTINGS);
  const [saving, setSaving] = useState(false);
  // Hangi event'in preview'ı şu an oynuyor — UI feedback için.
  const [playingEvent, setPlayingEvent] = useState<NotificationEventKey | null>(null);
  // Tek bir paylaşılan HTMLAudioElement; preview'lar birbirini kesebilsin diye.
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Hydrate from Firestore as soon as the doc resolves (covers "doc yok" case
  // by falling back to defaults).
  useEffect(() => {
    if (isSettingsLoading) return;
    setNotifications(mergeNotificationDefaults(settingsDoc?.notifications));
    setSounds(mergeSoundDefaults(settingsDoc?.notifications));
  }, [settingsDoc, isSettingsLoading]);

  // Unmount'ta playing audio'yu kes — leaked event handler / sound olmasın.
  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.src = '';
      }
    };
  }, []);

  const handleToggle = (ev: NotificationEventKey, channel: NotificationChannel) => {
    setNotifications((prev) => ({
      ...prev,
      [ev]: { ...prev[ev], [channel]: !prev[ev][channel] },
    }));
  };

  const handleSoundChange = (ev: NotificationEventKey, soundId: string) => {
    setSounds((prev) => ({ ...prev, [ev]: soundId }));
    // Tercih değişti — şu an çalmakta olan preview varsa onu durdur.
    if (playingEvent === ev && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingEvent(null);
    }
  };

  const stopPreview = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setPlayingEvent(null);
  }, []);

  const handlePreview = (ev: NotificationEventKey) => {
    // Aynı event'in preview'ı çalıyorsa → toggle (stop).
    if (playingEvent === ev) {
      stopPreview();
      return;
    }
    const soundId = sounds[ev];
    // Silent / default için preview yapma — "Sessiz" zaten ses yok, "Varsayılan"
    // sistemin native bildirim sesi olduğu için browser'da çalabileceğimiz
    // bir dosya yok.
    if (soundId === SOUND_ID_SILENT || soundId === SOUND_ID_DEFAULT) return;

    const sound = NOTIFICATION_SOUNDS.find((s) => s.id === soundId);
    if (!sound) return;
    const url = resolveWebPath(sound);
    if (!url) return;

    // Önceki preview'ı kes ve yeni source ile başlat.
    let a = audioRef.current;
    if (!a) {
      a = new Audio();
      audioRef.current = a;
    }
    a.pause();
    // eslint-disable-next-line react-hooks/immutability -- audio element ref; preview UX requires source swap on toggle
    a.src = url;
    a.currentTime = 0;
    // onended / onerror — playing state'i reset etmeyi unutma.
    a.onended = () => setPlayingEvent(null);
    a.onerror = () => setPlayingEvent(null);
    setPlayingEvent(ev);
    void a.play().catch(() => setPlayingEvent(null));
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
      // Notifications switch matrisini ses tercihiyle birleştir; aynı event
      // doc'unda { inApp, email, sms, sound } olarak yazılır. Geriye uyumlu —
      // mevcut sender'lar sound field'ını sessizce ignore eder.
      const payloadNotifications: Record<
        string,
        EventChannelMap & { sound: string | null }
      > = {};
      for (const ev of NOTIFICATION_EVENTS) {
        const chosen = sounds[ev];
        const soundValue: string | null =
          chosen === SOUND_ID_SILENT ? null : chosen;
        payloadNotifications[ev] = { ...notifications[ev], sound: soundValue };
      }
      await setDoc(
        settingsRef,
        { notifications: payloadNotifications, updatedAt: serverTimestamp() },
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
  // Dropdown'da gösterilecek sıralı liste — locale'a göre name çek.
  const soundOptions = useMemo(() => {
    return NOTIFICATION_SOUNDS.map((s) => ({ id: s.id, label: s.name, labelEn: s.nameEn }));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Panel Ayarları</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Platformun konfigürasyonu, bildirim politikaları, AI entegrasyonu ve alt modüller.
        </p>
      </div>

      {/* Hızlı erişim link kartları — super-admin ana sayfa pattern'ı */}
      <Card className="rounded-2xl border-black/5 shadow-sm overflow-hidden">
        <div className="px-6 pt-6 pb-2 bg-muted/20 border-b border-black/5">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Alt Sayfalar</p>
        </div>
        <div className="divide-y divide-black/5">
          {SETTINGS_SECTIONS.filter((s) => 'href' in s && s.href).map((s) => {
            const SIcon = s.icon;
            const href = (s as { href: string }).href;
            const color = (s as { color?: string }).color || 'bg-primary';
            const description = (s as { description?: string }).description || '';
            return (
              <Link key={s.id} href={href} className="flex items-center p-6 hover:bg-muted/30 transition-all group">
                <div className={cn('h-12 w-12 flex items-center justify-center mr-6 rounded-2xl shadow-sm transition-transform group-hover:scale-110', color)}>
                  <SIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-0.5 min-w-0">
                  <p className="font-bold text-lg text-[#1d1d1f] group-hover:text-primary transition-colors">{s.label}</p>
                  {description && (
                    <p className="text-sm text-muted-foreground font-medium leading-tight">{description}</p>
                  )}
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-1 shrink-0 ml-3" />
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Bölümler — hep birlikte sayfada akış halinde, sol nav yok */}
      <div className="space-y-6 min-w-0">
          <div>
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
              <div className="hidden md:grid grid-cols-[1fr_repeat(3,72px)_minmax(180px,1fr)] gap-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div>{t('super_admin_settings.colEvent')}</div>
                <div className="text-center">{t('super_admin_settings.colInApp')}</div>
                <div className="text-center">{t('super_admin_settings.colEmail')}</div>
                <div className="text-center">{t('super_admin_settings.colSms')}</div>
                <div>{t('super_admin_settings.colSound')}</div>
              </div>
              <div className="space-y-2">
                {NOTIFICATION_EVENTS.map((ev) => {
                  const currentSoundId = sounds[ev];
                  const isPlaying = playingEvent === ev;
                  // Preview disable: silent / default / catalog'da yok / web-playable
                  // path çıkmıyorsa (ör. .caf gibi browser'ın decode edemediği format).
                  const currentSoundEntry = NOTIFICATION_SOUNDS.find(
                    (s) => s.id === currentSoundId,
                  );
                  const previewable =
                    currentSoundId !== SOUND_ID_SILENT &&
                    currentSoundId !== SOUND_ID_DEFAULT &&
                    !!currentSoundEntry &&
                    resolveWebPath(currentSoundEntry) !== null;
                  return (
                  <div
                    key={ev}
                    className="grid grid-cols-1 md:grid-cols-[1fr_repeat(3,72px)_minmax(180px,1fr)] gap-3 md:gap-2 items-center p-3 border rounded-lg"
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
                    {/* Sound picker + preview — mobilde dikey stack, desktop'ta yan yana */}
                    <div className="flex items-center gap-2 md:gap-1.5">
                      <span className="md:hidden text-xs text-muted-foreground shrink-0">
                        {t('super_admin_settings.colSound')}
                      </span>
                      <Select
                        value={currentSoundId}
                        onValueChange={(v) => handleSoundChange(ev, v)}
                        disabled={saving || isSettingsLoading}
                      >
                        <SelectTrigger
                          className="h-9 flex-1 text-sm"
                          aria-label={`${ev} sound`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SOUND_ID_SILENT}>
                            {t('super_admin_settings.soundSilent')}
                          </SelectItem>
                          <SelectItem value={SOUND_ID_DEFAULT}>
                            {t('super_admin_settings.soundDefault')}
                          </SelectItem>
                          {soundOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => handlePreview(ev)}
                        disabled={!previewable || saving || isSettingsLoading}
                        aria-label={t('super_admin_settings.previewLabel')}
                        title={t('super_admin_settings.previewLabel')}
                      >
                        {isPlaying ? (
                          <Square className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  );
                })}
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
          </div>

          <div>
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
          </div>

          <div>
            <AiIntegrationSection />
          </div>
      </div>
    </div>
  );
}
