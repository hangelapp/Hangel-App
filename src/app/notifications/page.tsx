'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, Heart, ArrowLeft, Loader2, Droplet, UserPlus, Sparkles, CheckCircle2, AlertCircle, ShieldCheck, MessageSquare, Ticket } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';
import { formatDistanceToNow } from 'date-fns';
import { startEmergencyBloodActivity } from '@/lib/native-live-activity';
import { DistanceBadge } from '@/components/shared/distance-badge';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { COLLECTIONS } from '@/firebase/collections';
import { contractsData } from '@/lib/contracts';
import { sanitizeHtml } from '@/lib/sanitize-html';

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  'invitation': UserPlus,
  'emergency-blood': Droplet,
  'emergency-blood-contact': Droplet,
  'emergency-blood-received': Droplet,
  'emergency-blood-thanks': Heart,
  // Bağışçıya giden hatırlatma (1s/2s/3s) — "Kan verdim" aksiyonunu taşır.
  'emergency-blood-reminder': Droplet,
  // İhtiyaç sahibine giden onay isteği (bağışçı "verdim" dedi → geldi/gelmedi).
  'emergency-blood-confirm': Heart,
  'volunteer': Heart,
  'donation': Sparkles,
  'authorization': ShieldCheck,
  'message': MessageSquare,
  'badge_earned': Ticket,
};

const typeColor: Record<string, string> = {
  'invitation': 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30',
  'emergency-blood': 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30',
  'emergency-blood-contact': 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20',
  'emergency-blood-received': 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30',
  'emergency-blood-thanks': 'text-primary bg-primary/10',
  'volunteer': 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30',
  'donation': 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30',
  'authorization': 'text-indigo-600 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30',
  'message': 'text-primary bg-primary/10',
  'badge_earned': 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const db = useFirestore();
  const { user: authUser } = useUser();

  const notifQuery = useMemoFirebase(() => {
    if (!db || !authUser?.uid) return null;
    return query(
      collection(db, COLLECTIONS.notifications),
      where('userId', '==', authUser.uid),
      orderBy('createdAt', 'desc'),
    );
  }, [db, authUser?.uid]);

  interface NotifItem {
    id: string;
    type?: string;
    title?: string;
    message?: string;
    body?: string;
    createdAt?: { toDate?: () => Date } | string | null;
    read?: boolean;
    responseStatus?: 'positive' | 'negative' | 'accepted' | 'rejected';
    /** notifyUser doc'u link'i TOP-LEVEL yazar (data içinde değil). */
    link?: string;
    data?: {
      requestId?: string;
      bloodType?: string;
      hospitalName?: string;
      hospitalAddress?: string;
      contactName?: string;
      contactPhone?: string;
      link?: string;
      href?: string;
      contractSlug?: string;
      version?: string;
      coordinates?: { lat: number; lng: number } | null;
    };
  }
  const { data: notifications, isLoading, error: notifError } = useCollection<NotifItem>(notifQuery);

  const formatTime = (createdAt: NotifItem['createdAt']) => {
    try {
      const fromObj = typeof createdAt === 'object' && createdAt !== null && 'toDate' in createdAt && typeof createdAt.toDate === 'function'
        ? createdAt.toDate()
        : null;
      const fromStr = !fromObj && typeof createdAt === 'string' ? new Date(createdAt) : null;
      const d = fromObj || fromStr;
      if (!d) return '';
      return formatDistanceToNow(d, { addSuffix: true, locale: tr });
    } catch { return ''; }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.notifications, id), {
        read: true,
        readAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Mark read failed:', e);
    }
  };

  const handleEmergencyResponse = async (notif: NotifItem, status: 'positive' | 'negative') => {
    if (!authUser) return;
    try {
      // 1. Yanıt kaydı oluştur
      await addDoc(collection(db, COLLECTIONS.emergencyResponses), {
        requestId: notif.data?.requestId || notif.id,
        notificationId: notif.id,
        userId: authUser.uid,
        userName: authUser.displayName || authUser.email || 'Kullanıcı',
        userEmail: authUser.email || null,
        status,
        bloodType: notif.data?.bloodType || null,
        hospitalName: notif.data?.hospitalName || null,
        respondedAt: serverTimestamp(),
      });

      // 2. Bildirimi okundu olarak işaretle + yanıt durumunu kaydet
      await updateDoc(doc(db, COLLECTIONS.notifications, notif.id), {
        read: true,
        readAt: new Date().toISOString(),
        responseStatus: status,
        respondedAt: new Date().toISOString(),
      });

      // 3. Olumlu yanıtta — kan talebinin iletişim bilgilerini içeren bir takip
      //    bildirimi yaz (hastane, ad-soyad, telefon). Böylece kullanıcı /messages
      //    yerine /notifications akışında bu bilgiyi her zaman geri okuyabilir.
      if (status === 'positive') {
        // Kan Talebi Detayları'nı /messages gelen kutusuna mesaj olarak ilet (hastane konumu dahil).
        let detailMessageId: string | null = null;
        try {
          const token = await authUser.getIdToken();
          const res = await fetch('/api/emergency/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ requestId: notif.data?.requestId || notif.id, data: notif.data }),
          });
          if (res.ok) {
            const payload = await res.json().catch(() => null);
            if (payload?.messageId) detailMessageId = payload.messageId as string;
          }
        } catch { /* mesaj iletilemese de yanıt kaydı oluştu */ }

        // Detay bilgileri (hastane/hasta/kan/irtibat) BİLDİRİME yazılmaz — kullanıcı
        // isteği: detay yalnızca /messages'a gider (yukarıdaki respond route yazdı).
        // Bildirimlere yalnızca KALICI bir teşekkür bildirimi düşer.
        try {
          await addDoc(collection(db, COLLECTIONS.notifications), {
            userId: authUser.uid,
            type: 'emergency-blood-thanks',
            title: 'Teşekkürler 🧡',
            body: 'Yardım çağrısına yanıt verdiğin için teşekkürler. Kan talebinin tüm detayları (hastane, irtibat, kan grubu, yol tarifi) için bu bildirime dokun.',
            // Detaylı mesaj oluştuysa doğrudan ona, yoksa Mesajlarım gelen kutusuna yönlendir.
            data: { requestId: notif.data?.requestId || notif.id, link: detailMessageId ? `/messages/${detailMessageId}` : '/messages' },
            read: false,
            pushSent: true,
            createdAt: serverTimestamp(),
            createdBy: 'emergency-system',
          });
        } catch (notifErr) {
          // Teşekkür bildirimi yazılamasa da yanıt + mesaj zaten kaydedildi.
          console.warn('emergency thanks notification failed:', notifErr);
        }

        // iOS Live Activity başlat — kullanıcı hastaneye giderken Lock
        // Screen + Dynamic Island'da süreç görünür. Cloud Function
        // (onEmergencyBloodUpdate) emergencyBloodCalls/{requestId} doc'unda
        // değişiklik olduğunda APNs push ile state günceller.
        const requestId = notif.data?.requestId || notif.id;
        const liveActivityHospital = (notif.data as { hospitalName?: string })?.hospitalName || 'Hastane';
        const liveActivityCity = (notif.data as { city?: string })?.city || 'Konum bilinmiyor';
        const liveActivityBloodType = (notif.data as { bloodType?: string })?.bloodType || 'Genel';
        try {
          await startEmergencyBloodActivity({
            bloodType: liveActivityBloodType,
            city: liveActivityCity,
            requestId,
            hospitalName: liveActivityHospital,
            distance: (notif.data as { distance?: string })?.distance,
            matchedDonors: (notif.data as { matchedDonors?: number })?.matchedDonors,
            minutesLeft: 60,
            status: 'Yolda',
          });
        } catch (liveActErr) {
          // Live Activity başlatılamasa da yanıt zaten kaydedildi — sessiz.
          console.warn('[live-activity] startEmergencyBlood failed', liveActErr);
        }
      }

      toast({
        title: status === 'positive' ? t('dashboard.notifications.toastThanksTitle') : t('dashboard.notifications.toastReceivedTitle'),
        description: status === 'positive'
          ? t('dashboard.notifications.toastThanksDesc')
          : t('dashboard.notifications.toastReceivedDesc'),
      });
    } catch (e: unknown) {
      console.error('Response failed:', e);
      const message = e instanceof Error ? e.message : t('dashboard.notifications.toastUnknownError');
      toast({
        variant: 'destructive',
        title: t('dashboard.notifications.toastFailTitle'),
        description: message,
      });
    }
  };

  // Acil durum kişisi daveti: Kabul / Reddet. Kabul edilirse davet edenin
  // acil kişi kaydına ad + hangel puanı yazılır (server tarafı).
  const handleEmergencyContactResponse = async (notif: NotifItem, accept: boolean) => {
    if (!authUser || !db) return;
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/emergency-contacts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: notif.data?.requestId || notif.id, accept }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'İşlem başarısız', description: data?.message || 'Yanıt kaydedilemedi.' });
        return;
      }
      await updateDoc(doc(db, COLLECTIONS.notifications, notif.id), {
        read: true,
        responseStatus: accept ? 'accepted' : 'rejected',
      });
      toast({
        title: accept ? 'Kabul edildi 🧡' : 'Reddedildi',
        description: accept ? 'Adın ve hangel puanın paylaşıldı.' : 'Davet reddedildi.',
      });
    } catch {
      toast({ variant: 'destructive', title: 'Bağlantı hatası', description: 'Yanıt kaydedilemedi, tekrar deneyin.' });
    }
  };

  const resolveNotificationHref = (n: NotifItem): string | null => {
    switch (n.type) {
      case 'invitation':
        return '/my-applications';
      case 'authorization':
        return '/admin';
      case 'donation':
        return '/my-donations';
      case 'emergency-blood-thanks':
        // Detaylı kan talebi mesajına doğrudan git (data.link = /messages/{id}).
        return n.data?.link || '/messages';
      case 'message':
      case 'welcome':
      case 'emergency-confirmation':
        return '/messages';
      case 'badge_earned':
        // Yaka kartı bildirimi — etkinlik linki (notifyUser top-level `link` yazar) varsa
        // oraya (/events/{slug}), yoksa rozetlere.
        return n.link || n.data?.link || '/my-badges';
      case 'badge':
        return n.link || '/my-badges';
      case 'event_created':
        return n.link || n.data?.link || '/events';
      case 'broadcast':
      case 'dm':
        return n.link || n.data?.link || null;
      case 'emergency-blood':
        return null;
      default:
        return n.link || n.data?.link || n.data?.href || null;
    }
  };

  const [contractDialog, setContractDialog] = useState<{ slug: string; title: string; version: string } | null>(null);

  const openContract = (n: NotifItem) => {
    const slug = n.data?.contractSlug || (n.data?.link || '').split('/').filter(Boolean).pop() || '';
    if (slug) setContractDialog({ slug, title: n.title || t('dashboard.notifications.contractFallbackTitle'), version: n.data?.version || '1.0' });
  };

  const handleNotificationClick = (n: NotifItem, href: string | null) => {
    if (!n.read) handleMarkRead(n.id);
    if (n.type === 'contract-update') { openContract(n); return; }
    if (href) router.push(href);
  };

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  return (
    <div className="p-4 space-y-3 animate-in fade-in-0 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('aria.back')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2 min-w-0">
          <span className="truncate">{t('dashboard.notifications.heading')}</span>
          {unreadCount > 0 && (
            <Badge className="bg-primary shrink-0">{unreadCount} {t('dashboard.notifications.newBadge')}</Badge>
          )}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifError ? (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive/60 mb-3" />
            <p className="text-destructive font-bold">{t('dashboard.notifications.loadErrorTitle')}</p>
            <p className="text-xs text-muted-foreground mt-1">{notifError.message || t('dashboard.notifications.loadErrorDesc')}</p>
          </CardContent>
        </Card>
      ) : !notifications || notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('dashboard.notifications.emptyTitle')}
          description={t('dashboard.notifications.emptyDesc')}
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = (n.type ? typeIcon[n.type] : undefined) || Bell;
            const colorClass = (n.type ? typeColor[n.type] : undefined) || 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-800';
            const href = resolveNotificationHref(n);
            return (
              <Card
                key={n.id}
                className={cn(
                  'transition-all cursor-pointer hover:shadow-md',
                  !n.read && 'border-primary/30 bg-primary/5',
                )}
                onClick={() => handleNotificationClick(n, href)}
              >
                <CardContent className="p-3 flex items-start gap-3">
                  <div className={cn('p-2 rounded-full shrink-0', colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn('text-sm leading-tight min-w-0 break-words', !n.read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground')}>{n.title}</p>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className={cn('text-[13px] leading-snug whitespace-pre-line break-words', !n.read ? 'text-foreground/80' : 'text-muted-foreground')}>{n.body}</p>
                    {(n.type === 'emergency-blood' || n.type === 'emergency-blood-received' || n.type === 'emergency-blood-contact') && n.data?.coordinates && (
                      <DistanceBadge target={{ lat: n.data.coordinates.lat, lon: n.data.coordinates.lng }} className="pt-0.5" />
                    )}
                    <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                      <p className="text-[10px] text-muted-foreground/70">{formatTime(n.createdAt)}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Acil kan talebi yanıt butonları (henüz cevap verilmediyse) */}
                        {n.type === 'emergency-blood' && !n.responseStatus && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-red-600 hover:bg-red-700"
                              onClick={(e) => { e.stopPropagation(); handleEmergencyResponse(n, 'positive'); }}
                            >
                              {t('dashboard.notifications.emergencyHelpYes')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleEmergencyResponse(n, 'negative'); }}
                            >
                              {t('dashboard.notifications.emergencyHelpNo')}
                            </Button>
                          </>
                        )}
                        {n.type === 'emergency-blood' && n.responseStatus === 'positive' && (
                          <Badge className="bg-green-600 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> {t('dashboard.notifications.emergencyHelpYes')}
                          </Badge>
                        )}
                        {n.type === 'emergency-blood' && n.responseStatus === 'negative' && (
                          <Badge variant="secondary" className="text-[10px]">
                            {t('dashboard.notifications.emergencyHelpNo')}
                          </Badge>
                        )}
                        {/* Acil durum kişisi daveti — Kabul / Reddet */}
                        {n.type === 'emergency-contact-invite' && !n.responseStatus && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleEmergencyContactResponse(n, true); }}
                            >
                              Kabul et
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleEmergencyContactResponse(n, false); }}
                            >
                              Reddet
                            </Button>
                          </>
                        )}
                        {n.type === 'emergency-contact-invite' && n.responseStatus === 'accepted' && (
                          <Badge className="bg-emerald-600 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Kabul edildi</Badge>
                        )}
                        {n.type === 'emergency-contact-invite' && n.responseStatus === 'rejected' && (
                          <Badge variant="secondary" className="text-[10px]">Reddedildi</Badge>
                        )}
                        {n.type === 'contract-update' ? (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); openContract(n); }}>
                            {t('dashboard.notifications.detailCta')}
                          </Button>
                        ) : href && (
                          <Button asChild variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                            <Link href={href}>{t('dashboard.notifications.detailCta')}</Link>
                          </Button>
                        )}
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> {t('dashboard.notifications.markRead')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {contractDialog && (
        <ContractApprovalDialog
          slug={contractDialog.slug}
          title={contractDialog.title}
          version={contractDialog.version}
          onClose={() => setContractDialog(null)}
        />
      )}
    </div>
  );
}

// Sözleşme/politika onay popup'ı — bildirim "Detay" tıklanınca açılır.
// Üst ve alttaki "Okudum, Kabul Ettim" → onaylandı; X / dışarı tıklama → reddedildi.
// Her iki sonuç da /api/contracts/approve ile Kullanıcı Onay Kayıtları'na düşer.
function ContractApprovalDialog({ slug, title, version, onClose }: { slug: string; title: string; version: string; onClose: () => void }) {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { t } = useTranslation();
  const docRef = useMemoFirebase(() => (db && slug ? doc(db, COLLECTIONS.contracts, slug) : null), [db, slug]);
  const { data: fsContract, isLoading } = useDoc<{ title?: string; content?: string; version?: string }>(docRef);
  const content = useMemo(() => {
    if (fsContract?.content) return fsContract.content;
    return contractsData.find(c => c.slug === slug)?.content || '';
  }, [fsContract, slug]);
  const effectiveVersion = fsContract?.version || version || '1.0';
  const [submitting, setSubmitting] = useState(false);
  const decidedRef = useRef(false);
  const startRef = useRef(0);
  const scrolledRef = useRef(false);
  useEffect(() => { startRef.current = Date.now(); }, []);

  const record = async (decision: 'approved' | 'rejected') => {
    if (decidedRef.current || !authUser) return;
    decidedRef.current = true;
    try {
      const token = await authUser.getIdToken();
      await fetch('/api/contracts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          contractSlug: slug, contractTitle: fsContract?.title || title, version: effectiveVersion,
          decision, method: 'popup',
          scrollCompleted: scrolledRef.current,
          readSeconds: Math.round((Date.now() - startRef.current) / 1000),
        }),
      });
    } catch { /* sessiz — kayıt başarısız olsa da popup kapanır */ }
  };

  const approve = async () => {
    setSubmitting(true);
    await record('approved');
    setSubmitting(false);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (!decidedRef.current) record('rejected'); // X / Esc / dışarı tıklama → reddedildi
      onClose();
    }
  };

  const ApproveBtn = (
    <Button onClick={approve} disabled={submitting || isLoading} className="w-full bg-green-600 hover:bg-green-700">
      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
      {t('dashboard.notifications.contractApproveBtn')}
    </Button>
  );

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="pr-8">{fsContract?.title || title}</DialogTitle>
        </DialogHeader>
        <div className="px-4 py-3 border-b shrink-0">{ApproveBtn}</div>
        <div
          className="flex-1 overflow-y-auto p-4 prose prose-sm dark:prose-invert max-w-none"
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) scrolledRef.current = true;
          }}
        >
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
          )}
        </div>
        <div className="p-4 border-t shrink-0">{ApproveBtn}</div>
      </DialogContent>
    </Dialog>
  );
}
