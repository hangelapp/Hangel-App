'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Heart, ArrowLeft, Loader2, Droplet, UserPlus, Sparkles, CheckCircle2, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  'invitation': UserPlus,
  'emergency-blood': Droplet,
  'volunteer': Heart,
  'donation': Sparkles,
};

const typeColor: Record<string, string> = {
  'invitation': 'text-blue-600 bg-blue-100',
  'emergency-blood': 'text-red-600 bg-red-100',
  'volunteer': 'text-green-600 bg-green-100',
  'donation': 'text-amber-600 bg-amber-100',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser } = useUser();

  const notifQuery = useMemoFirebase(() => {
    if (!db || !authUser?.uid) return null;
    return query(
      collection(db, 'notifications'),
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
    data?: { requestId?: string; bloodType?: string; hospitalName?: string };
  }
  const { data: notifications, isLoading } = useCollection<NotifItem>(notifQuery);

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
      await updateDoc(doc(db, 'notifications', id), {
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
      await addDoc(collection(db, 'emergencyResponses'), {
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
      await updateDoc(doc(db, 'notifications', notif.id), {
        read: true,
        readAt: new Date().toISOString(),
        responseStatus: status,
        respondedAt: new Date().toISOString(),
      });

      toast({
        title: status === 'positive' ? '🙏 Teşekkürler!' : 'Yanıtınız Alındı',
        description: status === 'positive'
          ? 'Hastane sizinle iletişime geçecektir.'
          : 'Yanıtınız kaydedildi.',
      });
    } catch (e: unknown) {
      console.error('Response failed:', e);
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata.';
      toast({
        variant: 'destructive',
        title: 'Yanıt gönderilemedi',
        description: message,
      });
    }
  };

  const unreadCount = (notifications || []).filter(n => !n.read).length;

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
          Bildirimler
          {unreadCount > 0 && (
            <Badge className="bg-primary">{unreadCount} yeni</Badge>
          )}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">Henüz bildirimin yok</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Davetler, acil kan talepleri ve diğer güncellemeler burada görünecek.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const Icon = (n.type ? typeIcon[n.type] : undefined) || Bell;
            const colorClass = (n.type ? typeColor[n.type] : undefined) || 'text-gray-600 bg-gray-100';
            const invitationLink = n.type === 'invitation' ? '/my-applications' : null;
            return (
              <Card
                key={n.id}
                className={cn(
                  'transition-all cursor-pointer hover:shadow-md',
                  !n.read && 'border-primary/30 bg-primary/5',
                )}
                onClick={() => !n.read && handleMarkRead(n.id)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={cn('p-2.5 rounded-full shrink-0', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{n.body}</p>
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
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
                              🩸 Yardım Edebilirim
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleEmergencyResponse(n, 'negative'); }}
                            >
                              Maalesef Edemiyorum
                            </Button>
                          </>
                        )}
                        {n.type === 'emergency-blood' && n.responseStatus === 'positive' && (
                          <Badge className="bg-green-600 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Yardım Edebilirim
                          </Badge>
                        )}
                        {n.type === 'emergency-blood' && n.responseStatus === 'negative' && (
                          <Badge variant="secondary" className="text-[10px]">
                            Maalesef Edemiyorum
                          </Badge>
                        )}
                        {invitationLink && (
                          <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                            <Link href={invitationLink}>Detay</Link>
                          </Button>
                        )}
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Okundu
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
