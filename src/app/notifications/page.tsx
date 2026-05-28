'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Heart, ArrowLeft, Loader2, Droplet, UserPlus, Sparkles, CheckCircle2, AlertCircle, ShieldCheck, MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { COLLECTIONS } from '@/firebase/collections';

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  'invitation': UserPlus,
  'emergency-blood': Droplet,
  'emergency-blood-contact': Droplet,
  'volunteer': Heart,
  'donation': Sparkles,
  'authorization': ShieldCheck,
  'message': MessageSquare,
};

const typeColor: Record<string, string> = {
  'invitation': 'text-blue-600 bg-blue-100',
  'emergency-blood': 'text-red-600 bg-red-100',
  'emergency-blood-contact': 'text-red-700 bg-red-50',
  'volunteer': 'text-green-600 bg-green-100',
  'donation': 'text-amber-600 bg-amber-100',
  'authorization': 'text-indigo-600 bg-indigo-100',
  'message': 'text-primary bg-primary/10',
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
    responseStatus?: 'positive' | 'negative';
    data?: {
      requestId?: string;
      bloodType?: string;
      hospitalName?: string;
      hospitalAddress?: string;
      contactName?: string;
      contactPhone?: string;
      link?: string;
      href?: string;
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
        const hospital = notif.data?.hospitalName || '';
        const address = notif.data?.hospitalAddress || '';
        const contactName = notif.data?.contactName || '';
        const contactPhone = notif.data?.contactPhone || '';
        const bodyParts: string[] = [];
        if (hospital) bodyParts.push(`Hastane: ${hospital}`);
        if (address) bodyParts.push(`Adres: ${address}`);
        if (contactName) bodyParts.push(`Yetkili: ${contactName}`);
        if (contactPhone) bodyParts.push(`Telefon: ${contactPhone}`);
        // Hiç iletişim verisi yoksa sessizce geç — sadece toast yeterli olur.
        if (bodyParts.length > 0) {
          try {
            await addDoc(collection(db, COLLECTIONS.notifications), {
              userId: authUser.uid,
              type: 'emergency-blood-contact',
              title: '🩸 Kan Talebi İletişim Bilgileri',
              body: bodyParts.join(' · '),
              data: {
                requestId: notif.data?.requestId || notif.id,
                hospitalName: hospital,
                hospitalAddress: address,
                contactName,
                contactPhone,
                bloodType: notif.data?.bloodType || null,
              },
              read: false,
              createdAt: serverTimestamp(),
              createdBy: 'emergency-system',
            });
          } catch (notifErr) {
            // Takip bildirimi yazılamasa da yanıt kaydı oluştu — sessiz bırak.
            console.warn('emergency contact notification failed:', notifErr);
          }
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

  const resolveNotificationHref = (n: NotifItem): string | null => {
    switch (n.type) {
      case 'invitation':
        return '/my-applications';
      case 'authorization':
        return '/admin';
      case 'donation':
        return '/my-donations';
      case 'message':
      case 'welcome':
      case 'emergency-confirmation':
        return '/messages';
      case 'badge':
      case 'badge_earned':
        return '/my-badges';
      case 'event_created':
        return n.data?.link || '/events';
      case 'broadcast':
      case 'dm':
        return n.data?.link || null;
      case 'emergency-blood':
        return null;
      default:
        return n.data?.link || n.data?.href || null;
    }
  };

  const handleNotificationClick = (n: NotifItem, href: string | null) => {
    if (!n.read) handleMarkRead(n.id);
    if (href) router.push(href);
  };

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  return (
    <div className="p-4 space-y-3 animate-in fade-in-0 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('aria.back')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
          {t('dashboard.notifications.heading')}
          {unreadCount > 0 && (
            <Badge className="bg-primary">{unreadCount} {t('dashboard.notifications.newBadge')}</Badge>
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
            const colorClass = (n.type ? typeColor[n.type] : undefined) || 'text-gray-600 bg-gray-100';
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
                      <p className={cn('text-sm leading-tight', !n.read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground')}>{n.title}</p>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className={cn('text-[13px] leading-snug', !n.read ? 'text-foreground/80' : 'text-muted-foreground')}>{n.body}</p>
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
                        {href && (
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
    </div>
  );
}
