'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, HandCoins, FileText, UserPlus, Bell, Inbox, LogIn, Clock, Loader2, Timer } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, orderBy, query, limit } from 'firebase/firestore';
import Link from 'next/link';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

type RoleCategory = 'admin' | 'user' | 'super-admin';

interface ActivityEntry {
  id: string;
  kind: 'donation' | 'application' | 'invitation' | 'notification';
  roleCategory: RoleCategory;
  title: string;
  subtitle: string;
  timestamp: Date | null;
  userId?: string;
  actor?: string;
  href?: string;
}

interface DonationRow { id: string; status?: string; brandName?: string; brand?: string; userName?: string; userId?: string; donationAmount?: string; createdAt?: { toDate?: () => Date; seconds?: number } | string; }
interface ApplicationRow { id: string; name?: string; entityType?: string; status?: string; createdAt?: { toDate?: () => Date; seconds?: number } | string; }
interface InvitationRow { id: string; inviteeName?: string; role?: string; ngoId?: string; brandId?: string; invitedBy?: string; invitedByName?: string; invitedAt?: { toDate?: () => Date; seconds?: number } | string; }
interface NotificationRow { id: string; title?: string; body?: string; userId?: string; createdBy?: string; createdByName?: string; createdAt?: { toDate?: () => Date; seconds?: number } | string; }

const toDate = (val: unknown): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  const v = val as { toDate?: () => Date; seconds?: number };
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const formatTs = (d: Date | null) => {
  if (!d) return '-';
  return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
};

const KIND_META: Record<ActivityEntry['kind'], { label: string; icon: typeof HandCoins; color: string }> = {
  donation: { label: 'BAĞIŞ', icon: HandCoins, color: 'bg-green-100 text-green-700' },
  application: { label: 'BAŞVURU', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  invitation: { label: 'YETKİLENDİRME', icon: UserPlus, color: 'bg-purple-100 text-purple-700' },
  notification: { label: 'BİLDİRİM', icon: Bell, color: 'bg-amber-100 text-amber-700' },
};

// Each source collection lacks a uniform actor-role field, so the actor
// category is derived best-effort from the activity kind:
//  - donation     → regular user (a user makes a donation)
//  - application  → org admin (NGO / marka / kulüp başvurusu)
//  - invitation   → super-admin (rol ataması yapan süper admin)
//  - notification → super-admin (platform bildirimi gönderen süper admin)
const KIND_ROLE: Record<ActivityEntry['kind'], RoleCategory> = {
  donation: 'user',
  application: 'admin',
  invitation: 'super-admin',
  notification: 'super-admin',
};

const ROLE_TABS: { value: 'all' | RoleCategory; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'admin', label: 'Yönetici işlemleri' },
  { value: 'user', label: 'Kullanıcı işlemleri' },
  { value: 'super-admin', label: 'Süper admin işlemleri' },
];

export default function SuperAdminActivityPage() {
  const db = useFirestore();

  const donationsQuery = useMemoFirebase(() => (db ? query(collection(db, COLLECTIONS.donations), orderBy('createdAt', 'desc'), limit(50)) : null), [db]);
  const appsQuery = useMemoFirebase(() => (db ? query(collection(db, COLLECTIONS.applications), orderBy('createdAt', 'desc'), limit(50)) : null), [db]);
  const invitationsQuery = useMemoFirebase(() => (db ? query(collection(db, COLLECTIONS.userInvitations), orderBy('invitedAt', 'desc'), limit(50)) : null), [db]);
  const notificationsQuery = useMemoFirebase(() => (db ? query(collection(db, COLLECTIONS.notifications), orderBy('createdAt', 'desc'), limit(50)) : null), [db]);

  const { data: donations } = useCollection<DonationRow>(donationsQuery);
  const { data: applications } = useCollection<ApplicationRow>(appsQuery);
  const { data: invitations } = useCollection<InvitationRow>(invitationsQuery);
  const { data: notifications } = useCollection<NotificationRow>(notificationsQuery);

  // İşlemi yapan kullanıcının adını çözmek için uid→ad haritası.
  const usersQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.users) : null), [db]);
  const { data: usersData } = useCollection<{ id: string; name?: string; displayName?: string; email?: string }>(usersQuery);
  const userNameById = useMemo(() => {
    const m = new Map<string, string>();
    (usersData || []).forEach(u => m.set(u.id, u.name || u.displayName || u.email || ''));
    return m;
  }, [usersData]);
  const entries: ActivityEntry[] = useMemo(() => {
    const SYSTEM_ACTORS: Record<string, string> = { 'hangel-system': 'Sistem', 'emergency-system': 'Acil Sistemi', 'affiliate-webhook': 'Affiliate Webhook' };
    const resolveActor = (uid?: string, name?: string): string | undefined =>
      name || (uid ? (SYSTEM_ACTORS[uid] || userNameById.get(uid) || undefined) : undefined);
    const list: ActivityEntry[] = [];

    (donations || []).forEach(d => {
      list.push({
        id: `donation-${d.id}`,
        kind: 'donation',
        roleCategory: KIND_ROLE.donation,
        title: `${d.userName || 'Kullanıcı'} → ${d.brandName || d.brand || 'Marka'}`,
        subtitle: `${d.status || 'İşleme Alındı'} · ${d.donationAmount || '0'} ₺`,
        timestamp: toDate(d.createdAt),
        userId: d.userId,
        href: '/super-admin/donations',
      });
    });

    (applications || []).forEach(a => {
      list.push({
        id: `app-${a.id}`,
        kind: 'application',
        roleCategory: KIND_ROLE.application,
        title: `${a.name || 'İsimsiz'} (${a.entityType || 'Başvuru'})`,
        subtitle: a.status || 'Beklemede',
        timestamp: toDate(a.createdAt),
        href: '/super-admin/applications',
      });
    });

    (invitations || []).forEach(i => {
      list.push({
        id: `inv-${i.id}`,
        kind: 'invitation',
        roleCategory: KIND_ROLE.invitation,
        title: `${i.inviteeName || 'Kullanıcı'} ${i.role || 'rol'} olarak atandı`,
        subtitle: i.ngoId ? `STK: ${i.ngoId}` : i.brandId ? `Marka: ${i.brandId}` : '—',
        timestamp: toDate(i.invitedAt),
        actor: resolveActor(i.invitedBy, i.invitedByName),
        href: i.ngoId ? '/super-admin/ngos' : '/super-admin/brands',
      });
    });

    (notifications || []).forEach(n => {
      list.push({
        id: `notif-${n.id}`,
        kind: 'notification',
        roleCategory: KIND_ROLE.notification,
        title: n.title || 'Bildirim',
        subtitle: n.body || '—',
        timestamp: toDate(n.createdAt),
        userId: n.userId,
        actor: resolveActor(n.createdBy, n.createdByName),
      });
    });

    list.sort((a, b) => {
      const ta = a.timestamp?.getTime() ?? 0;
      const tb = b.timestamp?.getTime() ?? 0;
      return tb - ta;
    });

    return list.slice(0, 200);
  }, [donations, applications, invitations, notifications, userNameById]);

  const [activeTab, setActiveTab] = useState<'all' | RoleCategory | 'oturum'>('all');

  const counts = useMemo(() => {
    const c: Record<'all' | RoleCategory, number> = { all: entries.length, admin: 0, user: 0, 'super-admin': 0 };
    entries.forEach(e => { c[e.roleCategory] += 1; });
    return c;
  }, [entries]);

  const visibleEntries = useMemo(
    () => (activeTab === 'all' ? entries : entries.filter(e => e.roleCategory === activeTab)),
    [entries, activeTab],
  );

  return (
    <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f] flex items-center gap-2">
          <Activity className="h-7 w-7 text-primary" /> Aktiviteler & İşlem Logu
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Platform genelinde son 200 aktivite — bağışlar, başvurular, yetkilendirmeler ve gönderilen bildirimler.
        </p>
      </div>

      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Son Aktiviteler ({visibleEntries.length})</CardTitle>
          <CardDescription>En yeni işlemler üstte. Tıklayarak ilgili yönetim sayfasına gidebilirsin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'all' | RoleCategory | 'oturum')}>
            <TabsList className="mb-4 flex flex-wrap h-auto">
              {ROLE_TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label} ({counts[t.value]})
                </TabsTrigger>
              ))}
              <TabsTrigger value="oturum" className="gap-1.5"><LogIn className="h-3.5 w-3.5" /> Giriş / Çıkış</TabsTrigger>
            </TabsList>
            {ROLE_TABS.map(t => (
              <TabsContent key={t.value} value={t.value}>
                {visibleEntries.length === 0 ? (
                  <div className="py-16 flex flex-col items-center text-center gap-2">
                    <Inbox className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm italic">Henüz aktivite kaydı bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {visibleEntries.map(e => {
                      const meta = KIND_META[e.kind];
                      const Icon = meta.icon;
                      const inner = (
                        <div className="flex items-center gap-3 py-3 hover:bg-muted/30 transition-colors -mx-2 px-2 rounded-lg">
                          <Avatar className="h-10 w-10 bg-muted">
                            <AvatarImage src="" alt="" />
                            <AvatarFallback className={meta.color}>
                              <Icon className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={`${meta.color} text-[9px] font-black uppercase border-0`}>
                                {meta.label}
                              </Badge>
                              <p className="font-bold text-sm truncate">{e.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{e.subtitle}</p>
                            {e.actor && <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">👤 {e.actor} tarafından</p>}
                          </div>
                          <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">{formatTs(e.timestamp)}</span>
                        </div>
                      );
                      return e.href ? (
                        <Link key={e.id} href={e.href} className="block">{inner}</Link>
                      ) : (
                        <div key={e.id}>{inner}</div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
            <TabsContent value="oturum">
              <SessionsPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface SessionRow {
  sessionId: string;
  userId: string;
  userName: string;
  role: 'super-admin' | 'admin' | 'user';
  roleLabel: string;
  loginAt: string | null;
  lastActiveAt: string | null;
  deviceName: string;
  browserName: string;
  deviceType: string;
}

// Giriş/Çıkış tabı — /api/admin/sessions (collectionGroup sessions + kullanıcı rolü).
function SessionsPanel() {
  const { user: authUser } = useUser();
  const [items, setItems] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'super-admin' | 'admin' | 'user'>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!authUser) return;
      setLoading(true);
      setError(null);
      try {
        const token = await authUser.getIdToken();
        const res = await fetch('/api/admin/sessions', { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json().catch(() => null);
        if (!res.ok) { if (!cancelled) { setError(json?.message || 'Yüklenemedi.'); setItems([]); } }
        else if (!cancelled) setItems(Array.isArray(json.items) ? json.items : []);
      } catch {
        if (!cancelled) setError('Bağlantı hatası.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authUser]);

  const filtered = roleFilter === 'all' ? items : items.filter(i => i.role === roleFilter);
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
  const fmtDuration = (a: string | null, b: string | null): string | null => {
    if (!a || !b) return null;
    const ms = new Date(b).getTime() - new Date(a).getTime();
    if (!Number.isFinite(ms) || ms < 0) return null;
    const mins = Math.round(ms / 60000);
    if (mins < 1) return '1 dk\'dan az';
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h} sa ${m} dk` : `${m} dk`;
  };
  const roleBadge = (role: string) => role === 'super-admin' ? 'bg-purple-100 text-purple-700' : role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground';

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="py-12 text-center text-sm text-destructive">{error}</div>;
  if (items.length === 0) return (
    <div className="py-16 flex flex-col items-center text-center gap-2">
      <LogIn className="h-12 w-12 text-muted-foreground/30" />
      <p className="text-muted-foreground text-sm italic">Henüz oturum kaydı yok.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'super-admin', 'admin', 'user'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={cn('text-xs rounded-full px-3 py-1 border transition-colors', roleFilter === r ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent')}
          >
            {r === 'all' ? 'Tümü' : r === 'super-admin' ? 'Süper Admin' : r === 'admin' ? 'Yönetici' : 'Kullanıcı'}
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} oturum</span>
      </div>
      <div className="divide-y">
        {filtered.map(s => (
          <div key={s.sessionId} className="flex items-center gap-3 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm truncate">{s.userName}</p>
                <Badge variant="outline" className={cn('text-[9px] font-black uppercase border-0', roleBadge(s.role))}>{s.roleLabel}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{[s.deviceName, s.browserName].filter(Boolean).join(' · ') || 'Cihaz bilinmiyor'}</p>
            </div>
            <div className="text-right text-[11px] text-muted-foreground whitespace-nowrap">
              <p className="inline-flex items-center gap-1"><LogIn className="h-3 w-3 text-green-600" /> Giriş: {fmt(s.loginAt)}</p>
              <p className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Son: {fmt(s.lastActiveAt)}</p>
              {fmtDuration(s.loginAt, s.lastActiveAt) && (
                <p className="inline-flex items-center gap-1 font-semibold text-foreground/70"><Timer className="h-3 w-3" /> {fmtDuration(s.loginAt, s.lastActiveAt)} online</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
