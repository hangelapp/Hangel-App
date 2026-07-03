'use client';

/**
 * Süper-admin › Rozet & Sertifika Yönetimi.
 *  - Özel/Dönemsel rozet tanımları oluştur/sil (specialBadges).
 *  - Kullanıcıya özel rozet ver (e-posta/telefon/uid ile).
 *  - Kullanıcıya alan bazında özel puan ver → rozet yeniden hesaplanır.
 *  - Kullanıcı özeti: rozetleri, alan puanları, sertifika sayısı.
 * Tüm mutasyonlar /api/super-admin/badges (yalnız super-admin) üzerinden.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Loader2, Plus, Trash2, Gift, Coins, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { badges as BADGE_DEFS } from '@/lib/data';
import { SPECIAL_BADGE_STATUSES, type SpecialBadgeDef } from '@/lib/special-badges';

const AREAS = Array.from(new Set(BADGE_DEFS.map((b) => b.socialArea))).sort();

type UserInfo = {
  uid: string;
  displayName: string;
  areaPoints: Record<string, number>;
  badges: { id: string; name: string; kind: string; level: string; emoji: string }[];
  certificateCount: number;
};

export default function SuperAdminBadgesPage() {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [defs, setDefs] = useState<SpecialBadgeDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const api = useCallback(
    async (method: 'GET' | 'POST', body?: unknown) => {
      if (!authUser) throw new Error('Giriş gerekli.');
      const token = await authUser.getIdToken();
      const res = await fetch('/api/super-admin/badges', {
        method,
        headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'İşlem başarısız.');
      return data;
    },
    [authUser],
  );

  const loadDefs = useCallback(async () => {
    try {
      const data = await api('GET');
      setDefs(data.defs || []);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Rozetler yüklenemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => {
    if (authUser) loadDefs();
  }, [authUser, loadDefs]);

  // --- Yeni rozet tanımı formu ---
  const [form, setForm] = useState({ name: '', emoji: '🏅', description: '', status: 'Özel', colorHex: '', priority: '100' });
  const createDef = async () => {
    if (!form.name.trim()) return toast({ variant: 'destructive', title: 'Rozet adı gerekli' });
    setBusy('create');
    try {
      await api('POST', {
        action: 'createDef',
        def: {
          name: form.name.trim(),
          emoji: form.emoji.trim() || '🏅',
          description: form.description.trim(),
          status: form.status,
          colorHex: form.colorHex.trim() || null,
          priority: Number(form.priority) || 100,
          active: true,
        },
      });
      toast({ title: 'Rozet oluşturuldu 🎉' });
      setForm({ name: '', emoji: '🏅', description: '', status: 'Özel', colorHex: '', priority: '100' });
      await loadDefs();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Oluşturulamadı', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  };

  const deleteDef = async (id: string) => {
    setBusy(`del-${id}`);
    try {
      await api('POST', { action: 'deleteDef', id });
      setDefs((d) => d.filter((x) => x.id !== id));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Silinemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  };

  // --- Rozet verme / puan verme / kullanıcı özeti ---
  const [target, setTarget] = useState('');
  const [grantBadgeId, setGrantBadgeId] = useState('');
  const [pointsArea, setPointsArea] = useState(AREAS[0] || '');
  const [pointsVal, setPointsVal] = useState('50');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const targetBody = useMemo(() => {
    const t = target.trim();
    if (!t) return null;
    if (t.includes('@')) return { email: t };
    if (/^\+?\d[\d\s]{6,}$/.test(t)) return { phone: t.replace(/\s/g, '') };
    return { uid: t };
  }, [target]);

  // İşlem sonrası açık kullanıcı panelini sessizce tazele (bayat kalmasın).
  const refreshUserInfo = async () => {
    if (!targetBody || !userInfo) return;
    try {
      const r = await api('POST', { action: 'userInfo', ...targetBody });
      setUserInfo(r as UserInfo);
    } catch { /* sessiz */ }
  };

  const grant = async () => {
    if (!targetBody) return toast({ variant: 'destructive', title: 'Kullanıcı (e-posta/telefon/uid) gir' });
    if (!grantBadgeId) return toast({ variant: 'destructive', title: 'Rozet seç' });
    setBusy('grant');
    try {
      await api('POST', { action: 'grant', badgeId: grantBadgeId, ...targetBody });
      toast({ title: 'Rozet verildi 🎖️', description: 'Kullanıcıya bildirim gönderildi.' });
      await refreshUserInfo();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Verilemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  };

  const awardPoints = async () => {
    if (!targetBody) return toast({ variant: 'destructive', title: 'Kullanıcı gir' });
    setBusy('points');
    try {
      const r = await api('POST', { action: 'awardPoints', area: pointsArea, points: Number(pointsVal) || 0, ...targetBody });
      toast({ title: 'Puan verildi', description: `${pointsVal} puan · ${r.newBadges} yeni rozet` });
      await refreshUserInfo();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Verilemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  };

  const fetchUser = async () => {
    if (!targetBody) return toast({ variant: 'destructive', title: 'Kullanıcı gir' });
    setBusy('user');
    try {
      const r = await api('POST', { action: 'userInfo', ...targetBody });
      setUserInfo(r as UserInfo);
    } catch (e) {
      setUserInfo(null);
      toast({ variant: 'destructive', title: 'Bulunamadı', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/super-admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Award className="h-6 w-6 text-primary" /> Rozet & Sertifika Yönetimi</h1>
          <p className="text-sm text-muted-foreground">Özel/dönemsel rozet oluştur, kullanıcılara rozet ve özel puan ver.</p>
        </div>
      </div>

      {/* Kullanıcı işlemleri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Search className="h-5 w-5" /> Kullanıcı işlemleri</CardTitle>
          <CardDescription>E-posta, telefon veya kullanıcı ID’si ile hedef seç.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Kullanıcı (e-posta / telefon / uid)</Label>
            <div className="flex gap-2 mt-1">
              <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="ornek@mail.com" />
              <Button variant="outline" onClick={fetchUser} disabled={busy === 'user'}>
                {busy === 'user' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Getir'}
              </Button>
            </div>
          </div>

          {userInfo && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-2">
              <p className="font-semibold">{userInfo.displayName} <span className="text-xs text-muted-foreground">({userInfo.uid})</span></p>
              <p className="text-xs text-muted-foreground">Sertifika: {userInfo.certificateCount} · Kayıtlı rozet: {userInfo.badges.length}</p>
              {userInfo.badges.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {userInfo.badges.map((b) => (
                    <Badge key={b.id} variant="outline" className="text-[10px]">{b.emoji} {b.name}{b.level ? ` · ${b.level}` : ''}</Badge>
                  ))}
                </div>
              )}
              {Object.keys(userInfo.areaPoints).length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Puanlar: {Object.entries(userInfo.areaPoints).filter(([, v]) => v > 0).map(([a, v]) => `${a}: ${v}`).join(' · ') || '—'}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Rozet ver */}
            <div className="rounded-lg border p-3 space-y-2">
              <p className="font-semibold text-sm flex items-center gap-1.5"><Gift className="h-4 w-4 text-primary" /> Özel rozet ver</p>
              <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={grantBadgeId} onChange={(e) => setGrantBadgeId(e.target.value)}>
                <option value="">Rozet seç…</option>
                {defs.map((d) => <option key={d.id} value={d.id}>{d.emoji} {d.name} ({d.status})</option>)}
              </select>
              <Button className="w-full" onClick={grant} disabled={busy === 'grant'}>
                {busy === 'grant' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rozeti Ver'}
              </Button>
            </div>

            {/* Puan ver */}
            <div className="rounded-lg border p-3 space-y-2">
              <p className="font-semibold text-sm flex items-center gap-1.5"><Coins className="h-4 w-4 text-primary" /> Özel puan ver</p>
              <div className="flex gap-2">
                <select className="flex-1 h-9 rounded-md border bg-background px-2 text-sm" value={pointsArea} onChange={(e) => setPointsArea(e.target.value)}>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <Input type="number" className="w-24" value={pointsVal} onChange={(e) => setPointsVal(e.target.value)} />
              </div>
              <Button className="w-full" onClick={awardPoints} disabled={busy === 'points'}>
                {busy === 'points' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Puanı Ver'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yeni özel/dönemsel rozet */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5" /> Yeni Özel / Dönemsel Rozet</CardTitle>
          <CardDescription>Örn. "Deprem Kahramanı" (Özel) veya "Yaz Gönüllüsü 2026" (Dönemsel). Özel rozetler kullanıcı profilinde EN ÜSTTE görünür.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Ad</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Deprem Kahramanı" /></div>
            <div><Label>Emoji</Label><Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🦸" /></div>
          </div>
          <div><Label>Açıklama</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deprem döneminde üstün katkı." /></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Tür</Label>
              <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {SPECIAL_BADGE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><Label>Renk (hex)</Label><Input value={form.colorHex} onChange={(e) => setForm({ ...form, colorHex: e.target.value })} placeholder="#E34234" /></div>
            <div><Label>Öncelik</Label><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></div>
          </div>
          <Button onClick={createDef} disabled={busy === 'create'}>
            {busy === 'create' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Rozet Oluştur
          </Button>
        </CardContent>
      </Card>

      {/* Mevcut tanımlar */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Tanımlı Özel Rozetler</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : defs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Henüz özel rozet yok.</p>
          ) : (
            <div className="space-y-2">
              {defs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: (d.colorHex || '#E34234') + '22' }}>{d.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{d.name} <Badge variant="outline" className="ml-1 text-[10px]">{d.status}</Badge></p>
                    <p className="text-xs text-muted-foreground truncate">{d.description || '—'} · öncelik {d.priority}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteDef(d.id)} disabled={busy === `del-${d.id}`} aria-label="Sil">
                    {busy === `del-${d.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
