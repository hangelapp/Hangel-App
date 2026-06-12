'use client';

/**
 * CallDashboard — STK çağrı merkezi dashboard.
 *
 * - Aktif çağrılar (status: ringing | in-progress) — canlı liveQuery
 * - Geçmiş kayıtlar — kendi ngoId'si ile filtreli, recording link dahil
 * - KPI kartları (bugünkü çağrı, ortalama süre, kalan kota)
 * - Outbound çağrı başlatma formu (concurrent limit 2)
 *
 * KVKK: recording linki yalnızca STK kendi kayıtlarını dinler. Super-admin'e
 * gösterilmez (super-admin route'unda recordingStorageUrl alanı düşürülür).
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PhoneCall, Phone, Mic, Activity, Clock, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { messagingFetch } from '@/lib/messaging/client';

const CALL_SESSIONS = 'callSessions';
const ACTIVE_STATUSES = ['ringing', 'in-progress'] as const;

interface CallSessionRow {
  id: string;
  agentUid?: string;
  ngoId?: string;
  contactId?: string;
  calledNumber?: string;
  callerNumber?: string;
  startedAt?: { toDate?: () => Date };
  endedAt?: { toDate?: () => Date };
  duration?: number;
  outcome?: string;
  recordingStorageUrl?: string | null;
  status?: string;
  direction?: 'inbound' | 'outbound';
  notes?: string;
}

interface NgoCallCenterDoc {
  status?: 'pending' | 'active' | 'suspended' | 'rejected';
  callerIdNumber?: string;
  packageId?: string;
  providerId?: string;
  monthlyMinutesQuota?: number;
  currentMonthUsage?: number;
}

interface CallDashboardProps {
  ngoId: string;
  ccDoc: NgoCallCenterDoc;
}

function formatDuration(sec?: number): string {
  if (!sec || sec < 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTime(ts?: { toDate?: () => Date }): string {
  const d = ts?.toDate?.();
  if (!d) return '—';
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const STATUS_BADGE: Record<string, string> = {
  ringing: 'bg-amber-100 text-amber-800 border-amber-200',
  'in-progress': 'bg-violet-100 text-violet-800 border-violet-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  failed: 'bg-rose-100 text-rose-800 border-rose-200',
};

export function CallDashboard({ ngoId, ccDoc }: CallDashboardProps) {
  const db = useFirestore();
  const { toast } = useToast();

  const [dialPhone, setDialPhone] = useState('');
  const [dialContactId, setDialContactId] = useState('');
  const [dialNotes, setDialNotes] = useState('');
  const [dialing, setDialing] = useState(false);

  // Aktif çağrılar — STK kendi ngoId + ACTIVE_STATUSES.
  const activeQuery = useMemoFirebase(
    () =>
      query(
        collection(db, CALL_SESSIONS),
        where('ngoId', '==', ngoId),
        where('status', 'in', [...ACTIVE_STATUSES]),
        orderBy('startedAt', 'desc'),
        limit(20),
      ),
    [db, ngoId],
  );
  const { data: activeCalls, isLoading: activeLoading } = useCollection<CallSessionRow>(activeQuery);

  // Geçmiş çağrılar — sadece bu STK.
  const historyQuery = useMemoFirebase(
    () =>
      query(
        collection(db, CALL_SESSIONS),
        where('ngoId', '==', ngoId),
        orderBy('startedAt', 'desc'),
        limit(50),
      ),
    [db, ngoId],
  );
  const { data: history, isLoading: historyLoading } = useCollection<CallSessionRow>(historyQuery);

  // KPI hesapları — geçmiş üzerinden client-side (50 doc).
  const stats = useMemo(() => {
    const list = history ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let todayCount = 0;
    let totalDur = 0;
    let durCount = 0;
    for (const c of list) {
      const t = c.startedAt?.toDate?.();
      if (t && t >= today) todayCount++;
      if (typeof c.duration === 'number' && c.duration > 0) {
        totalDur += c.duration;
        durCount++;
      }
    }
    const avg = durCount > 0 ? Math.round(totalDur / durCount) : 0;
    return { todayCount, avg };
  }, [history]);

  const monthlyQuota = ccDoc.monthlyMinutesQuota ?? 0;
  const usage = ccDoc.currentMonthUsage ?? 0;
  const remainingMinutes = Math.max(0, monthlyQuota - usage);
  const activeCount = activeCalls?.length ?? 0;
  const concurrentFull = activeCount >= 2;

  async function handleOriginate() {
    if (!dialPhone || !dialContactId) {
      toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Telefon ve kontak id gerekli.' });
      return;
    }
    setDialing(true);
    try {
      const result = await messagingFetch<{ ok: boolean; callSessionId: string; status: string }>(
        '/api/ngo-admin/calls/originate',
        {
          method: 'POST',
          body: JSON.stringify({
            contactPhone: dialPhone,
            contactId: dialContactId,
            notes: dialNotes || undefined,
          }),
        },
      );
      toast({ title: 'Arama başlatıldı', description: `Oturum: ${result.callSessionId}` });
      setDialPhone('');
      setDialContactId('');
      setDialNotes('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Arama başlatılamadı', description: msg });
    } finally {
      setDialing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" /> Aktif Çağrı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount} / 2</div>
            <div className="text-xs text-muted-foreground mt-1">Eş zamanlı limit</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <PhoneCall className="h-3 w-3" /> Bugün
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Toplam çağrı</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Ort. Süre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.avg)}</div>
            <div className="text-xs text-muted-foreground mt-1">Son 50 görüşme</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Kalan Kota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remainingMinutes} dk</div>
            <div className="text-xs text-muted-foreground mt-1">
              {usage} / {monthlyQuota} dk kullanıldı
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dial Pad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4 text-emerald-600" /> Yeni Arama
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dial-phone">Telefon (+90...)</Label>
            <Input
              id="dial-phone"
              value={dialPhone}
              onChange={(e) => setDialPhone(e.target.value)}
              placeholder="+905551112233"
              disabled={dialing || concurrentFull}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dial-contact">Kontak ID</Label>
            <Input
              id="dial-contact"
              value={dialContactId}
              onChange={(e) => setDialContactId(e.target.value)}
              placeholder="CRM contact doc id"
              disabled={dialing || concurrentFull}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="dial-notes">Notlar (opsiyonel)</Label>
            <Textarea
              id="dial-notes"
              value={dialNotes}
              onChange={(e) => setDialNotes(e.target.value)}
              rows={2}
              disabled={dialing || concurrentFull}
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Caller ID: <span className="font-mono">{ccDoc.callerIdNumber ?? '—'}</span>
            </p>
            <Button onClick={handleOriginate} disabled={dialing || concurrentFull}>
              {dialing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {concurrentFull ? 'Eş zamanlı limit dolu' : 'Aramayı Başlat'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Aktif Çağrılar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktif Görüşmeler</CardTitle>
        </CardHeader>
        <CardContent>
          {activeLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
            </div>
          ) : !activeCalls || activeCalls.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Şu anda aktif görüşme yok.</p>
          ) : (
            <div className="space-y-2">
              {activeCalls.map((c) => (
                <div key={c.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-mono text-sm">{c.calledNumber ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      Başlama: {formatTime(c.startedAt)} · Yön: {c.direction ?? '—'}
                    </div>
                  </div>
                  <Badge className={STATUS_BADGE[c.status ?? ''] ?? ''}>{c.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geçmiş */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Görüşme Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Henüz görüşme kaydı yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 px-2">Tarih</th>
                    <th className="text-left py-2 px-2">Aranan</th>
                    <th className="text-left py-2 px-2">Yön</th>
                    <th className="text-left py-2 px-2">Süre</th>
                    <th className="text-left py-2 px-2">Durum</th>
                    <th className="text-left py-2 px-2">Kayıt</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 px-2 whitespace-nowrap">{formatTime(c.startedAt)}</td>
                      <td className="py-2 px-2 font-mono">{c.calledNumber ?? '—'}</td>
                      <td className="py-2 px-2">{c.direction ?? '—'}</td>
                      <td className="py-2 px-2">{formatDuration(c.duration)}</td>
                      <td className="py-2 px-2">
                        <Badge className={STATUS_BADGE[c.status ?? ''] ?? ''} variant="outline">
                          {c.status ?? '—'}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        {c.recordingStorageUrl ? (
                          <a
                            href={c.recordingStorageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                          >
                            <Mic className="h-3 w-3" /> Dinle
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
