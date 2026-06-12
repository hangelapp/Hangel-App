'use client';

/**
 * /super-admin/call-center — hangel İç Ekibi Call Center Paneli
 *
 * Tüm STK'ların çağrı oturumları üzerinde merkezi gözlem paneli.
 *
 * KVKK / Güvenlik kısıtları:
 *   - Recording dosyalarına ERİŞİM YOKTUR. Tabloda sadece "kayıt var"
 *     işareti gösterilir.
 *   - API tüm metadata erişimini callAuditLog'a yazar (server-side).
 *   - PATCH/DELETE yoktur: super-admin yalnızca okur.
 *
 * Bölümler:
 *   1. KPI cards (bugün toplam, ort. süre, başarı oranı, aktif agent)
 *   2. Aktif aramalar listesi (status in [ringing, in-progress])
 *   3. Çağrı geçmişi tablosu (filtreli, son 50)
 *   4. Audit log mini-view
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Phone, PhoneCall, Clock, CheckCircle2, Users, RefreshCw, Filter, X, ShieldAlert,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { CallSessionsTable, type CallSessionRow } from './_components/CallSessionsTable';

interface ListResponse {
  sessions: CallSessionRow[];
  totalCount: number;
}

interface Filters {
  from: string;
  to: string;
  ngoId: string;
  agentUid: string;
  status: string; // '' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'cancelled'
}

const EMPTY_FILTERS: Filters = {
  from: '',
  to: '',
  ngoId: '',
  agentUid: '',
  status: '',
};

function todayIsoStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function buildQuery(f: Partial<Filters> & { limit?: number }): string {
  const sp = new URLSearchParams();
  if (f.from) sp.set('from', f.from);
  if (f.to) sp.set('to', f.to);
  if (f.ngoId) sp.set('ngoId', f.ngoId);
  if (f.agentUid) sp.set('agentUid', f.agentUid);
  if (f.status) sp.set('status', f.status);
  if (f.limit) sp.set('limit', String(f.limit));
  return sp.toString();
}

export default function CallCenterPage() {
  const { user, isUserLoading } = useUser();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);

  const [history, setHistory] = useState<CallSessionRow[]>([]);
  const [active, setActiveSessions] = useState<CallSessionRow[]>([]);
  const [today, setToday] = useState<CallSessionRow[]>([]);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingToday, setLoadingToday] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJson = useCallback(async <T,>(url: string): Promise<T> => {
    if (!user) throw new Error('Oturum yok');
    const token = await user.getIdToken();
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }, [user]);

  const loadHistory = useCallback(async (f: Filters) => {
    setLoadingHistory(true);
    setError(null);
    try {
      const qs = buildQuery({ ...f, limit: 50 });
      const data = await fetchJson<ListResponse>(`/api/super-admin/call-sessions/list?${qs}`);
      setHistory(data.sessions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Liste yüklenemedi');
    } finally {
      setLoadingHistory(false);
    }
  }, [fetchJson]);

  const loadActive = useCallback(async () => {
    setLoadingActive(true);
    try {
      // status=in-progress + status=ringing — iki ayrı sorgu (Firestore OR
      // single-collection inequality kısıtı nedeniyle birleştirilemez).
      const [a, b] = await Promise.all([
        fetchJson<ListResponse>(`/api/super-admin/call-sessions/list?${buildQuery({ status: 'in-progress', limit: 100 })}`),
        fetchJson<ListResponse>(`/api/super-admin/call-sessions/list?${buildQuery({ status: 'ringing', limit: 100 })}`),
      ]);
      const merged = [...a.sessions, ...b.sessions]
        .sort((x, y) => (y.startedAt || '').localeCompare(x.startedAt || ''));
      setActiveSessions(merged);
    } catch {
      setActiveSessions([]);
    } finally {
      setLoadingActive(false);
    }
  }, [fetchJson]);

  const loadToday = useCallback(async () => {
    setLoadingToday(true);
    try {
      const data = await fetchJson<ListResponse>(
        `/api/super-admin/call-sessions/list?${buildQuery({ from: todayIsoStart(), limit: 200 })}`,
      );
      setToday(data.sessions);
    } catch {
      setToday([]);
    } finally {
      setLoadingToday(false);
    }
  }, [fetchJson]);

  // İlk yükleme — kullanıcı hazır olunca
  useEffect(() => {
    if (isUserLoading || !user) return;
    void loadHistory(EMPTY_FILTERS);
    void loadActive();
    void loadToday();
  }, [user, isUserLoading, loadHistory, loadActive, loadToday]);

  // Aktif aramaları 15 sn'de bir tazele
  useEffect(() => {
    if (!user) return;
    const t = window.setInterval(() => { void loadActive(); }, 15_000);
    return () => window.clearInterval(t);
  }, [user, loadActive]);

  const onApplyFilters = () => {
    setAppliedFilters(filters);
    void loadHistory(filters);
  };

  const onClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    void loadHistory(EMPTY_FILTERS);
  };

  // KPI hesaplama — bugünkü oturumlardan
  const kpis = useMemo(() => {
    const totalToday = today.length;
    const completed = today.filter((s) => s.status === 'completed');
    const failed = today.filter((s) => s.status === 'failed' || s.status === 'cancelled');
    const finishedCount = completed.length + failed.length;
    const successRate = finishedCount > 0
      ? Math.round((completed.length / finishedCount) * 100)
      : null;
    const durations = today.map((s) => s.duration || 0).filter((d) => d > 0);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    const activeAgents = new Set(active.map((s) => s.agentUid).filter(Boolean)).size;
    return { totalToday, successRate, avgDuration, activeAgents };
  }, [today, active]);

  const auditEvents = useMemo(() => {
    // Audit log mini-view — server-side log Firestore'a yazılıyor; burada
    // client-side basit bir "son işlem akışı" gösterimi: son yüklenen
    // sayfanın özet hareketleri.
    return [
      appliedFilters !== EMPTY_FILTERS && {
        action: 'Filtre uygulandı',
        details: `${Object.entries(appliedFilters).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(', ') || '—'}`,
      },
      { action: 'Aktif arama tazelendi', details: `${active.length} aktif oturum` },
      { action: 'Bugün toplam çağrı', details: `${today.length} kayıt` },
      { action: 'Geçmiş listesi yenilendi', details: `${history.length} kayıt döndü` },
    ].filter(Boolean) as { action: string; details: string }[];
  }, [active.length, today.length, history.length, appliedFilters]);

  if (isUserLoading) {
    return (
      <div className="p-8 text-muted-foreground">Yetki kontrol ediliyor…</div>
    );
  }
  if (!user) {
    return (
      <div className="p-8">
        <Card><CardContent className="py-8 text-center">Lütfen giriş yapın.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <PhoneCall className="h-6 w-6" /> Call Center
          </h1>
          <p className="text-sm text-muted-foreground">
            hangel iç ekibi paneli — tüm STK çağrı oturumlarının merkezi gözlemi.
            <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
              <ShieldAlert className="h-3 w-3" />
              KVKK: yalnızca metadata erişimi, ses kayıtlarına erişim yoktur.
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { void loadHistory(appliedFilters); void loadActive(); void loadToday(); }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tazele
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> Bugün Toplam Çağrı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loadingToday ? '—' : kpis.totalToday}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Ortalama Süre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {kpis.avgDuration > 0
                ? `${Math.floor(kpis.avgDuration / 60)}:${(kpis.avgDuration % 60).toString().padStart(2, '0')}`
                : '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Başarı Oranı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {kpis.successRate === null ? '—' : `% ${kpis.successRate}`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Aktif Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{kpis.activeAgents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Aktif aramalar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Aktif Aramalar
            <Badge variant="outline">{active.length}</Badge>
          </CardTitle>
          <span className="text-xs text-muted-foreground">15 sn'de bir tazelenir</span>
        </CardHeader>
        <CardContent>
          <CallSessionsTable
            rows={active}
            isLoading={loadingActive && active.length === 0}
            emptyMessage="Şu anda aktif arama yok."
          />
        </CardContent>
      </Card>

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Başlangıç</label>
              <Input
                type="datetime-local"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Bitiş</label>
              <Input
                type="datetime-local"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">STK ID</label>
              <Input
                placeholder="ngoId"
                value={filters.ngoId}
                onChange={(e) => setFilters({ ...filters, ngoId: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Agent UID</label>
              <Input
                placeholder="agentUid"
                value={filters.agentUid}
                onChange={(e) => setFilters({ ...filters, agentUid: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Durum</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}
              >
                <SelectTrigger><SelectValue placeholder="Hepsi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Hepsi</SelectItem>
                  <SelectItem value="ringing">Çalıyor</SelectItem>
                  <SelectItem value="in-progress">Görüşmede</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="failed">Başarısız</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={onApplyFilters} size="sm">Filtrele</Button>
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" /> Temizle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Çağrı geçmişi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Çağrı Geçmişi (Son 50)</CardTitle>
        </CardHeader>
        <CardContent>
          <CallSessionsTable
            rows={history}
            isLoading={loadingHistory}
            emptyMessage="Kayıt bulunamadı."
          />
        </CardContent>
      </Card>

      {/* Audit log mini-view */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Audit Log (Oturum Akışı)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            {auditEvents.map((ev, i) => (
              <li key={i} className="flex justify-between border-b last:border-b-0 py-1">
                <span>{ev.action}</span>
                <span className="text-muted-foreground text-xs">{ev.details}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            Tam audit log Firestore'da <code>callAuditLog</code> koleksiyonundadır.
            Her metadata erişimi (list / read) server-side olarak kalıcı kaydedilir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
