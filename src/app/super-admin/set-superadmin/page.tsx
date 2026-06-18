'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, type Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, Search, ShieldCheck, UserPlus, XCircle, Users, Pencil, ShieldOff, CalendarClock, Clock, ChevronDown, Activity } from 'lucide-react';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

const SUPER_ADMIN_PAGES: { slug: string; label: string }[] = [
  { slug: 'web-content', label: 'WEB İçerik Yönetimi' },
  { slug: 'association-content', label: 'Dernek Web Sitesi Yönetimi' },
  { slug: 'contracts', label: 'Sözleşmeler ve Politikalar' },
  { slug: 'pages', label: 'İçerik Sayfaları (Basın/Etkinlik vb.)' },
  { slug: 'marketing-kit', label: 'Tanıtım Araçları' },
  { slug: 'applications', label: 'Başvuru Yönetimi' },
  { slug: 'users', label: 'Kullanıcı Yönetimi' },
  { slug: 'ngos', label: 'STK Yönetimi' },
  { slug: 'brands', label: 'Marka Yönetimi' },
  { slug: 'clubs', label: 'Kulüp Yönetimi' },
  { slug: 'volunteer', label: 'Gönüllülük Yönetimi' },
  { slug: 'donations', label: 'Bağış Yönetimi' },
  { slug: 'funds', label: 'Fon & Hibe Programları' },
  { slug: 'emergency', label: 'Acil Durum Yönetimi' },
  { slug: 'posts', label: 'Gönderi Yönetimi' },
  { slug: 'surveys', label: 'Anket & Değerlendirmeler' },
  { slug: 'analytics', label: 'İstatistik, Analizler & Demografi' },
  { slug: 'activity', label: 'Aktiviteler & İşlem Logu' },
  { slug: 'transparency', label: 'Şeffaflık Yönetimi' },
  { slug: 'communications', label: 'DM & Bildirim' },
  { slug: 'messaging', label: 'Toplu SMS & E-Posta' },
  { slug: 'ads', label: 'Reklam Yönetimi' },
  { slug: 'public-relations', label: 'Kamu İlişkileri' },
  { slug: 'settings', label: 'Panel Ayarları' },
  { slug: 'support', label: 'Destek Talepleri' },
];

interface AdminCandidateUser {
  id: string;
  name?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  superAdminPermissions?: string[];
  personalInfo?: { phone?: string; email?: string };
  phoneNumber?: string;
  email?: string;
}

const normalize = (s: string) => s.replace(/[^0-9a-zA-Z@._-]/g, '').toLowerCase();

export default function SetSuperAdminPage() {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();

  // Çalışma çizelgesi açık olan yönetici
  const [scheduleUserId, setScheduleUserId] = useState<string | null>(null);

  // Yeni kullanıcı yetkilendirme
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const usersQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.users) : null), [db]);
  const { data: usersData } = useCollection<AdminCandidateUser>(usersQuery);

  const matchedUsers = useMemo(() => {
    const q = normalize(searchTerm);
    if (q.length < 3) return [];
    return (usersData || []).filter(u => {
      const hay = [
        normalize(u.personalInfo?.phone || ''),
        normalize(u.phoneNumber || ''),
        normalize(u.personalInfo?.email || ''),
        normalize(u.email || ''),
        normalize(u.name || ''),
        normalize(u.displayName || ''),
      ].join(' ');
      return hay.includes(q);
    }).slice(0, 5);
  }, [usersData, searchTerm]);

  const selectedUser = useMemo(
    () => (usersData || []).find(u => u.id === selectedUserId) || null,
    [usersData, selectedUserId],
  );

  // Mevcut süper adminler (rol = super-admin)
  const superAdmins = useMemo(
    () => (usersData || []).filter(u => u.role === 'super-admin'),
    [usersData],
  );
  const [revokingId, setRevokingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedUser) {
      setPermissions(selectedUser.superAdminPermissions || SUPER_ADMIN_PAGES.map(p => p.slug));
    }
  }, [selectedUser]);

  const togglePermission = (slug: string) =>
    setPermissions(prev => (prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]));

  const handleAssignSuperAdmin = async () => {
    if (!selectedUser) return;
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Oturum bulunamadı', description: 'Lütfen yeniden giriş yapın.' });
      return;
    }
    setAssigning(true);
    try {
      // Custom claim yalnızca Admin SDK ile set edilebilir → server route üzerinden.
      const token = await authUser.getIdToken();
      const res = await fetch('/api/admin/users/set-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: selectedUser.id, permissions }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Atama başarısız', description: json?.message || 'İşlem tamamlanamadı.' });
        return;
      }
      toast({
        title: 'Süper Admin Atandı',
        description: `${selectedUser.name || selectedUser.displayName || selectedUser.id} ${permissions.length} sayfa yetkisiyle süper admin yapıldı. Kişi bir kez çıkış yapıp tekrar giriş yaptığında panel açılır.`,
      });
      setSelectedUserId(null);
      setSearchTerm('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({ variant: 'destructive', title: 'Atama başarısız', description: message });
    } finally {
      setAssigning(false);
    }
  };

  const handleRevoke = async (u: AdminCandidateUser) => {
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Oturum bulunamadı', description: 'Lütfen yeniden giriş yapın.' });
      return;
    }
    setRevokingId(u.id);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/admin/users/set-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: u.id, revoke: true }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Kaldırılamadı', description: json?.message || 'İşlem tamamlanamadı.' });
        return;
      }
      toast({ title: 'Yetki Kaldırıldı', description: `${u.name || u.displayName || u.id} artık süper admin değil.` });
      if (selectedUserId === u.id) setSelectedUserId(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Kaldırılamadı', description: e instanceof Error ? e.message : 'Bilinmeyen hata' });
    } finally {
      setRevokingId(null);
    }
  };

  const startEditPermissions = (u: AdminCandidateUser) => {
    setSelectedUserId(u.id);
    setSearchTerm('');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4 animate-in fade-in-0">
      <div>
        <h1 className="text-3xl font-black tracking-tighter">Süper Admin Yetkilendirme</h1>
        <p className="text-muted-foreground text-sm font-medium">
          Yeni bir süper admin ata veya mevcut süper adminlerin sayfa bazlı yetkilerini düzenle.
        </p>
      </div>

      {/* Yeni süper admin ataması */}
      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Yeni Süper Admin Ataması
          </CardTitle>
          <CardDescription>
            Telefon, e-posta veya isimle bir kullanıcı bul, sayfa bazlı yetkilerini seç ve süper admin yap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Telefon, e-posta veya isim ara (en az 3 karakter)"
              className="pl-10 h-11 rounded-xl"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setSelectedUserId(null);
              }}
            />
          </div>

          {searchTerm.length >= 3 && !selectedUser && (
            <div className="border rounded-xl divide-y">
              {matchedUsers.length === 0 ? (
                <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground italic">
                  <XCircle className="h-4 w-4" />
                  Eşleşen kullanıcı bulunamadı
                </div>
              ) : (
                matchedUsers.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUserId(u.id)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-muted/40 text-left"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={u.avatarUrl} alt={u.name || ''} />
                      <AvatarFallback>{(u.name || u.displayName || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{u.name || u.displayName || 'İsimsiz'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.personalInfo?.phone || u.phoneNumber || u.personalInfo?.email || u.email || u.id}
                      </p>
                    </div>
                    {u.role === 'super-admin' && (
                      <Badge variant="outline" className="text-[10px] font-black uppercase">Mevcut Süper Admin</Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {selectedUser && (
            <div className="border-2 border-primary/30 rounded-2xl p-4 bg-primary/5 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.name || ''} />
                  <AvatarFallback className="font-black">{(selectedUser.name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm">{selectedUser.name || selectedUser.displayName || 'İsimsiz'}</p>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedUser.personalInfo?.phone || selectedUser.phoneNumber} · {selectedUser.personalInfo?.email || selectedUser.email}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedUserId(null)}>Değiştir</Button>
              </div>

              <div>
                <Label className="text-xs font-black uppercase tracking-wider">Sayfa Yetkileri ({permissions.length}/{SUPER_ADMIN_PAGES.length})</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
                  {SUPER_ADMIN_PAGES.map(p => (
                    <label key={p.slug} className="flex items-center gap-2 px-2 py-1.5 hover:bg-background rounded-lg cursor-pointer">
                      <Checkbox
                        checked={permissions.includes(p.slug)}
                        onCheckedChange={() => togglePermission(p.slug)}
                      />
                      <span className="text-xs font-medium">{p.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setPermissions(SUPER_ADMIN_PAGES.map(p => p.slug))}>
                    Tümünü seç
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPermissions([])}>
                    Tümünü temizle
                  </Button>
                </div>
              </div>

              <Button
                disabled={assigning || permissions.length === 0}
                onClick={handleAssignSuperAdmin}
                className="w-full h-12 rounded-xl font-bold"
              >
                {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ShieldCheck className="mr-2 h-4 w-4" />
                {selectedUser.role === 'super-admin' ? 'Yetkileri Güncelle' : 'Süper Admin Olarak Ata'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mevcut süper adminler */}
      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Mevcut Süper Adminler
            <Badge variant="secondary" className="ml-1 text-[10px]">{superAdmins.length}</Badge>
          </CardTitle>
          <CardDescription>
            Yetkilendirilmiş kullanıcılar. Yetkilerini düzenle veya süper admin yetkisini tamamen kaldır.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {superAdmins.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground italic py-10">Henüz süper admin yok.</p>
          ) : (
            <div className="divide-y border-t">
              {superAdmins.map(u => {
                const isSelf = u.id === authUser?.uid;
                const permCount = u.superAdminPermissions?.length ?? SUPER_ADMIN_PAGES.length;
                return (
                  <div key={u.id} className="p-3 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatarUrl} alt={u.name || ''} />
                        <AvatarFallback className="font-black">{(u.name || u.displayName || 'U').charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold truncate">{u.name || u.displayName || 'İsimsiz'}</p>
                          <Badge variant="outline" className="text-[9px]">{permCount}/{SUPER_ADMIN_PAGES.length} yetki</Badge>
                          {isSelf && <Badge className="text-[9px] bg-primary/10 text-primary">Sen</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.personalInfo?.phone || u.phoneNumber || u.personalInfo?.email || u.email || u.id}
                        </p>
                      </div>
                      <Button
                        variant={scheduleUserId === u.id ? 'secondary' : 'outline'}
                        size="sm"
                        className="gap-1.5 shrink-0"
                        onClick={() => setScheduleUserId(scheduleUserId === u.id ? null : u.id)}
                      >
                        <CalendarClock className="h-3.5 w-3.5" /> Çalışma Çizelgesi
                        <ChevronDown className={cn('h-3 w-3 transition-transform', scheduleUserId === u.id && 'rotate-180')} />
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => startEditPermissions(u)}>
                        <Pencil className="h-3.5 w-3.5" /> Yetkileri Düzenle
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isSelf || revokingId === u.id} title={isSelf ? 'Kendi yetkini kaldıramazsın' : 'Yetkiyi kaldır'}
                            className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0">
                            {revokingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Süper admin yetkisi kaldırılsın mı?</AlertDialogTitle>
                            <AlertDialogDescription>
                              &quot;{u.name || u.displayName || u.id}&quot; kullanıcısının tüm süper admin yetkileri kaldırılacak ve rolü normal kullanıcıya düşürülecek. Kişi panele erişimini kaybeder.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                            <AlertDialogAction className={cn('bg-destructive text-destructive-foreground hover:bg-destructive/90')} onClick={() => handleRevoke(u)}>
                              Yetkiyi Kaldır
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {scheduleUserId === u.id && <AdminSchedule uid={u.id} />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

interface ActivityEvent {
  id: string;
  type?: 'open' | 'close';
  at?: Timestamp;
  deviceName?: string;
  browserName?: string;
  sessionId?: string;
}

// Bir yöneticinin giriş/çıkış olaylarını (users/{uid}/activity) gün gün gruplayıp
// "kaçta açtı → son aktivite" çalışma çizelgesi olarak gösterir.
function AdminSchedule({ uid }: { uid: string }) {
  const db = useFirestore();
  const activityQuery = useMemoFirebase(
    () => query(collection(db, COLLECTIONS.users, uid, 'activity'), orderBy('at', 'desc'), limit(500)),
    [db, uid],
  );
  const { data: events, isLoading } = useCollection<ActivityEvent>(activityQuery);

  const days = useMemo(() => {
    const map = new Map<string, { dateKey: string; label: string; first: number; last: number; count: number; sessions: Set<string>; devices: Set<string> }>();
    for (const e of events || []) {
      const d = e.at?.toDate?.();
      if (!d) continue;
      const ms = d.getTime();
      const dateKey = d.toLocaleDateString('tr-TR');
      const label = d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      let g = map.get(dateKey);
      if (!g) { g = { dateKey, label, first: ms, last: ms, count: 0, sessions: new Set(), devices: new Set() }; map.set(dateKey, g); }
      g.first = Math.min(g.first, ms);
      g.last = Math.max(g.last, ms);
      g.count += 1;
      if (e.sessionId) g.sessions.add(e.sessionId);
      if (e.deviceName) g.devices.add(e.deviceName);
    }
    return Array.from(map.values()).sort((a, b) => b.last - a.last);
  }, [events]);

  const fmtTime = (ms: number) => new Date(ms).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const fmtDur = (ms: number) => {
    const min = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
  };

  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : days.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground">
          <Activity className="h-6 w-6 mx-auto mb-1 opacity-30" />
          Henüz giriş/çıkış kaydı yok. Bu özellik yeni — kişi giriş yaptıkça çizelge buradan dolacak.
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" /> Çalışma Çizelgesi · giriş → son aktivite ({days.length} gün)
          </p>
          {days.map(d => (
            <div key={d.dateKey} className="flex items-center justify-between gap-2 rounded-lg bg-background border px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold capitalize">{d.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{Array.from(d.devices).join(', ') || '—'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 text-emerald-600" /> {fmtTime(d.first)} <span className="text-muted-foreground">→</span> {fmtTime(d.last)}
                </p>
                <p className="text-[10px] text-muted-foreground">{fmtDur(d.last - d.first)} · {d.sessions.size || 1} oturum</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
