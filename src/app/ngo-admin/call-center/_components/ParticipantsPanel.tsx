'use client';

/**
 * ParticipantsPanel — santralin "Etkinlik Katılımcıları" / "Gönüllü
 * Katılımcıları" sekmesi.
 *
 * Katılımcılar, RSVP + gönüllü başvurularından santralContacts'a senkronlanır
 * (/api/ngo-admin/participants/sync) ve buradan listelenir
 * (/api/ngo-admin/participants). Her katılımcı zaten bir santral kişisi
 * olduğundan "Ara" → mevcut /call-center/call/[contactId] sayfasına gider:
 * tek-tuş arama, kalıcı not, arama sonucu (disposition), WhatsApp — hepsi hazır.
 *
 * Adım 2: seçim + toplu SMS/e-posta (kotalı messaging/send'e proxy), yoklama
 * (geldi/gelmedi manuel + otomatik check-in), tek kişi WhatsApp/SMS, CSV.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Phone, RefreshCw, Search, Loader2, Users, AlertCircle, ChevronRight, Calendar, HeartHandshake,
  MessageSquare, MessageCircle, Mail, Download, CheckCircle2, XCircle, Send, MoreVertical, Smartphone,
  UserPlus, UserX,
} from 'lucide-react';

type Source = 'event' | 'volunteer';

interface ParticipantRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  attempts: number;
  lastDisposition: string | null;
  attendance: 'attended' | 'absent' | null;
  assignedToName: string | null;
  sources: { label: string; refId: string; when: string }[];
}

const DISPOSITION: Record<string, { label: string; cls: string }> = {
  answered: { label: 'Görüşüldü', cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  'no-answer': { label: 'Ulaşılamadı', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  busy: { label: 'Meşgul', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  rejected: { label: 'Reddetti', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  voicemail: { label: 'Sesli mesaj', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  'wrong-number': { label: 'Yanlış numara', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  'callback-requested': { label: 'Geri aranacak', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
};

// wa.me deep-link — tek kişiye WhatsApp (şablon/WABA gerektirmez, cihazda açılır).
function waLink(phoneE164: string, text: string): string {
  const num = phoneE164.replace(/[^0-9]/g, '');
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
function smsLink(phoneE164: string, text: string): string {
  return `sms:${phoneE164}?&body=${encodeURIComponent(text)}`;
}

function toCsv(rows: ParticipantRow[]): string {
  const header = ['Ad Soyad', 'Telefon', 'E-posta', 'Yoklama', 'Son Arama Sonucu', 'Arama Denemesi', 'Kaynak'];
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const attLabel = (a: ParticipantRow['attendance']) => (a === 'attended' ? 'Geldi' : a === 'absent' ? 'Gelmedi' : '');
  const lines = rows.map((r) => [
    r.name, r.phone, r.email || '', attLabel(r.attendance),
    r.lastDisposition ? (DISPOSITION[r.lastDisposition]?.label || r.lastDisposition) : '',
    String(r.attempts), r.sources.map((s) => s.label).filter(Boolean).join(' | '),
  ].map(esc).join(','));
  return '﻿' + [header.map(esc).join(','), ...lines].join('\n'); // BOM → Excel TR karakter
}

export function ParticipantsPanel({ source, ngoId }: { source: Source; ngoId?: string }) {
  const { user } = useUser();
  // super-admin üst switcher'dan başka STK'ya bakarken API'ye o ngoId'yi geçir;
  // ngo-admin'de boş kalır, sunucu kendi managedNgoId'sine düşer.
  const ngoQ = ngoId ? `&ngoId=${encodeURIComponent(ngoId)}` : '';
  const { toast } = useToast();
  const [rows, setRows] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Toplu mesaj diyalogu
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgChannel, setMsgChannel] = useState<'sms' | 'mail'>('sms');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sending, setSending] = useState(false);

  // Ekip üyeleri (sorumlu atama için)
  const [team, setTeam] = useState<{ userId: string; name: string }[]>([]);

  const load = useCallback(async (query = '') => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const url = `/api/ngo-admin/participants?source=${source}${ngoQ}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
      const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Liste yüklenemedi.');
      setRows(data.participants || []);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Beklenmeyen hata.');
    } finally {
      setLoading(false);
    }
  }, [user, source, ngoQ]);

  useEffect(() => { void load(); }, [load]);

  // Ekip üyelerini bir kez çek (sorumlu atama menüsü için).
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/ngo-admin/users/managers', { headers: { authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data.managers)) {
          setTeam(data.managers.map((m: { userId: string; name: string }) => ({ userId: m.userId, name: m.name })));
        }
      } catch { /* ekip yoksa atama menüsü sadece 'kaldır' gösterir */ }
    })();
    return () => { active = false; };
  }, [user]);

  const assign = async (ids: string[], member: { userId: string; name: string } | null) => {
    if (!user || ids.length === 0) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/participants/actions', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'assign', ids, assignedToUid: member?.userId ?? null, assignedToName: member?.name, ...(ngoId ? { ngoId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Atama başarısız.');
      setRows((prev) => prev.map((r) => ids.includes(r.id) ? { ...r, assignedToName: member?.name ?? null } : r));
      toast({ title: member ? 'Sorumlu atandı' : 'Sorumlu kaldırıldı', description: member ? `${member.name} → ${ids.length} kişi` : undefined });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Atama başarısız', description: e instanceof Error ? e.message : 'Hata.' });
    }
  };

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/participants/sync', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ source, ...(ngoId ? { ngoId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Senkronizasyon başarısız.');
      toast({
        title: 'Katılımcılar güncellendi',
        description: `${data.synced} kişi (${data.created} yeni, ${data.matched} mevcut)${data.skippedNoPhone > 0 ? ` · telefonsuz ${data.skippedNoPhone} kişi atlandı` : ''}.`,
      });
      await load(q);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Senkron başarısız', description: e instanceof Error ? e.message : 'Hata.' });
    } finally {
      setSyncing(false);
    }
  };

  // Yoklama işaretle (tekil ya da seçili toplu).
  const markAttendance = async (ids: string[], value: 'attended' | 'absent' | 'clear') => {
    if (!user || ids.length === 0) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/participants/actions', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'attendance', ids, value, ...(ngoId ? { ngoId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Yoklama kaydedilemedi.');
      // Optimistik güncelle — yeniden fetch etmeden.
      setRows((prev) => prev.map((r) => ids.includes(r.id)
        ? { ...r, attendance: value === 'clear' ? null : value } : r));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Yoklama başarısız', description: e instanceof Error ? e.message : 'Hata.' });
    }
  };

  const sendBroadcast = async () => {
    if (!user) return;
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!msgBody.trim()) { toast({ variant: 'destructive', title: 'Mesaj boş', description: 'Lütfen bir mesaj yaz.' }); return; }
    setSending(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/participants/actions', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'broadcast', ids, channel: msgChannel, message: msgBody, subject: msgSubject, ...(ngoId ? { ngoId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Gönderim başarısız.');
      toast({
        title: 'Mesaj gönderildi',
        description: `${data.sent ?? data.recipientsTargeted ?? ids.length} alıcıya ${msgChannel === 'sms' ? 'SMS' : 'e-posta'} gitti.`,
      });
      setMsgOpen(false); setMsgBody(''); setMsgSubject('');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: e instanceof Error ? e.message : 'Hata.' });
    } finally {
      setSending(false);
    }
  };

  const exportCsv = () => {
    const data = selected.size > 0 ? rows.filter((r) => selected.has(r.id)) : rows;
    const blob = new Blob([toCsv(data)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${source === 'event' ? 'etkinlik' : 'gonullu'}-katilimcilari.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch { /* yok say */ } }, 1500);
  };

  const toggle = (id: string) => setSelected((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));

  const attendedCount = useMemo(() => rows.filter((r) => r.attendance === 'attended').length, [rows]);

  // Etkinliğe/gönüllülüğe göre grupla: her kişi KATILDIĞI HER kaynağın altında
  // görünür (aynı kişi 2 etkinlikteyse iki grupta çıkar → grup başına sayı gerçek
  // katılım). Ayrı zaman filtresi YOK: geçmiş+gelecek TEK listede, kronolojik
  // (en yeni/yaklaşan üstte → eskiye) sıralı. Kaynaksız kişiler "Kaynağı belirsiz"
  // grubunda en üstte. now çizgisi, geçmiş/gelecek rozeti için kullanılır.
  const groups = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- geçmiş/gelecek rozeti için anlık zaman; rows değişince yeniden hesaplanır
    const now = Date.now();
    type Group = { key: string; label: string; when: string; ts: number; isPast: boolean; rows: ParticipantRow[] };
    const map = new Map<string, Group>();
    const NO_SRC = '__no_src__';
    for (const r of rows) {
      const srcs = r.sources.length > 0 ? r.sources : [{ label: '', refId: NO_SRC, when: '' }];
      for (const s of srcs) {
        const t = s.when ? Date.parse(s.when) : NaN;
        const key = s.refId || NO_SRC;
        if (!map.has(key)) {
          map.set(key, {
            key,
            label: s.label || (key === NO_SRC ? 'Kaynağı belirsiz' : 'İsimsiz'),
            when: s.when || '',
            ts: Number.isFinite(t) ? (t as number) : Number.MAX_SAFE_INTEGER, // tarihsiz en üstte
            isPast: Number.isFinite(t) ? (t as number) < now : false,
            rows: [],
          });
        }
        map.get(key)!.rows.push(r);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.ts - a.ts);
  }, [rows]);

  // Toplamlar: benzersiz kişi, grup sayısı, toplam katılım (grup satırları).
  const totals = useMemo(() => {
    const uniquePeople = new Set(rows.map((r) => r.id)).size;
    const participations = groups.reduce((n, g) => n + g.rows.length, 0);
    return { groupCount: groups.length, uniquePeople, participations };
  }, [groups, rows]);

  // Katlanır gruplar — varsayılan hepsi AÇIK (kullanıcı istediğini kapatır).
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleGroup = (key: string) => setCollapsed((prev) => {
    const n = new Set(prev);
    if (n.has(key)) n.delete(key); else n.add(key);
    return n;
  });

  const SourceIcon = source === 'event' ? Calendar : HeartHandshake;
  const title = source === 'event' ? 'Etkinlik Katılımcıları' : 'Gönüllü Katılımcıları';
  const shareText = `${title.replace(' Katılımcıları', '')} hakkında hangel üzerinden ulaşıyoruz. 🧡`;

  return (
    <div className="space-y-4">
      {/* Üst şerit */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <SourceIcon className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-sm leading-tight">{title}</h2>
            <p className="text-xs text-muted-foreground">
              {`${totals.uniquePeople} kişi`}
              {source === 'event' && attendedCount > 0 ? ` · ${attendedCount} geldi` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={exportCsv} disabled={rows.length === 0} variant="outline" size="sm" className="rounded-xl min-h-[44px]">
            <Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">CSV</span>
          </Button>
          <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm" className="rounded-xl min-h-[44px]">
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Güncelle
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void load(q); }}
          placeholder="Ad, telefon veya e-posta ara"
          className="pl-9 rounded-xl min-h-[44px]"
        />
      </div>

      {/* Toplam rakamlar — etkinlik/gönüllülük sayısı · benzersiz kişi · katılım.
          Geçmiş+gelecek tek listede kronolojik; ayrı zaman filtresi yok. */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-muted/40 px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5">
            <SourceIcon className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold tabular-nums">{totals.groupCount}</span>
            <span className="text-muted-foreground">{source === 'event' ? 'etkinlik' : 'gönüllülük'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold tabular-nums">{totals.uniquePeople}</span>
            <span className="text-muted-foreground">benzersiz kişi</span>
          </span>
          {totals.participations !== totals.uniquePeople && (
            <span className="flex items-center gap-1.5">
              <span className="font-bold tabular-nums">{totals.participations}</span>
              <span className="text-muted-foreground">toplam katılım</span>
            </span>
          )}
          {source === 'event' && attendedCount > 0 && (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="font-bold tabular-nums">{attendedCount}</span>
              <span className="text-muted-foreground">geldi</span>
            </span>
          )}
        </div>
      )}

      {/* Seçim + toplu aksiyon çubuğu */}
      {rows.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap rounded-xl bg-muted/40 px-3 py-2">
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} /> Tümünü seç
          </label>
          {selected.size > 0 && (
            <>
              <span className="text-xs text-muted-foreground">{selected.size} seçili</span>
              <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                <Button onClick={() => setMsgOpen(true)} size="sm" className="rounded-lg h-9">
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Toplu Mesaj
                </Button>
                <Button onClick={() => markAttendance(Array.from(selected), 'attended')} size="sm" variant="outline" className="rounded-lg h-9">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Geldi
                </Button>
                <Button onClick={() => markAttendance(Array.from(selected), 'absent')} size="sm" variant="outline" className="rounded-lg h-9">
                  <XCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" /> Gelmedi
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="rounded-lg h-9">
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Sorumlu Ata
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {team.length === 0 ? (
                      <DropdownMenuItem disabled>Ekip üyesi yok</DropdownMenuItem>
                    ) : team.map((m) => (
                      <DropdownMenuItem key={m.userId} onClick={() => assign(Array.from(selected), m)}>
                        <UserPlus className="mr-2 h-4 w-4" /> {m.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => assign(Array.from(selected), null)}>
                      <UserX className="mr-2 h-4 w-4" /> Sorumluyu kaldır
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground space-y-2 px-6">
          <Users className="h-10 w-10 mx-auto opacity-30" />
          <p className="font-medium">Henüz katılımcı yok</p>
          <p className="text-xs">
            {source === 'event'
              ? 'Etkinliklerine katılan kişileri görmek için "Güncelle"ye bas.'
              : 'Kuruluşuna gönüllü başvurusu yapan kişileri görmek için "Güncelle"ye bas.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const isCollapsed = collapsed.has(g.key);
            // Grubun tarihi (varsa) — "10 Tem 2026 14:00" gibi kısa TR gösterim.
            let dateLabel = '';
            if (g.when) {
              const d = new Date(g.when.replace(' ', 'T'));
              if (!Number.isNaN(d.getTime())) {
                dateLabel = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
              }
            }
            // Bu gruptaki kişilerin kaçı seçili — grup toplu-seçim için.
            const groupIds = g.rows.map((r) => r.id);
            const groupAllSel = groupIds.length > 0 && groupIds.every((id) => selected.has(id));
            const toggleGroupSel = () => setSelected((prev) => {
              const n = new Set(prev);
              if (groupAllSel) groupIds.forEach((id) => n.delete(id));
              else groupIds.forEach((id) => n.add(id));
              return n;
            });
            return (
              <div key={g.key} className="rounded-2xl border border-border overflow-hidden">
                {/* Grup başlığı — etkinlik/gönüllülük adı + kişi sayısı + tarih + geçmiş/gelecek */}
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(g.key)}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                    aria-expanded={!isCollapsed}
                  >
                    <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                    <SourceIcon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="font-bold text-sm leading-tight break-words">{g.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        <span className="font-semibold tabular-nums">{g.rows.length}</span> kişi
                        {dateLabel ? ` · ${dateLabel}` : ''}
                        {g.key !== '__no_src__' ? ` · ${g.isPast ? 'geçmiş' : 'yaklaşan'}` : ''}
                      </span>
                    </span>
                  </button>
                  <label className="flex items-center shrink-0 cursor-pointer pl-1" title="Bu grubu seç">
                    <Checkbox checked={groupAllSel} onCheckedChange={toggleGroupSel} />
                  </label>
                </div>
                {!isCollapsed && (
                  <div className="space-y-2 p-2">
                    {g.rows.map((p) => renderCard(p, g.key))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Toplu mesaj diyalogu */}
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Toplu mesaj — {selected.size} kişi</DialogTitle>
            <DialogDescription>SMS ya da e-posta ile seçili katılımcılara gönder. Kota santral mesaj cüzdanından düşer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button type="button" variant={msgChannel === 'sms' ? 'default' : 'outline'} size="sm" className="rounded-xl flex-1" onClick={() => setMsgChannel('sms')}>
                <Smartphone className="h-4 w-4 mr-1.5" /> SMS
              </Button>
              <Button type="button" variant={msgChannel === 'mail' ? 'default' : 'outline'} size="sm" className="rounded-xl flex-1" onClick={() => setMsgChannel('mail')}>
                <Mail className="h-4 w-4 mr-1.5" /> E-posta
              </Button>
            </div>
            {msgChannel === 'mail' && (
              <Input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} placeholder="Konu" className="rounded-xl" />
            )}
            <Textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="Mesajınız…" rows={5} className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsgOpen(false)} className="rounded-xl">Vazgeç</Button>
            <Button onClick={sendBroadcast} disabled={sending} className="rounded-xl">
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderCard(p: ParticipantRow, keyPrefix: string) {
    const disp = p.lastDisposition ? DISPOSITION[p.lastDisposition] : null;
    const isSel = selected.has(p.id);
    return (
              <Card key={`${keyPrefix}:${p.id}`} className={`rounded-2xl transition-colors ${isSel ? 'ring-2 ring-primary/40' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isSel} onCheckedChange={() => toggle(p.id)} className="mt-1 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm leading-tight break-words">{p.name}</p>
                        {p.attendance === 'attended' && <Badge className="rounded-full text-[11px] font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Geldi</Badge>}
                        {p.attendance === 'absent' && <Badge className="rounded-full text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Gelmedi</Badge>}
                        {disp && <Badge className={`rounded-full text-[11px] font-semibold ${disp.cls}`}>{disp.label}</Badge>}
                        {p.attempts > 0 && !disp && <Badge variant="outline" className="rounded-full text-[11px]">{p.attempts} deneme</Badge>}
                        {p.assignedToName && <Badge variant="outline" className="rounded-full text-[11px]">👤 {p.assignedToName}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 tabular-nums break-words">{p.phone}{p.email ? ` · ${p.email}` : ''}</p>
                      {p.sources.length > 0 && (
                        <p className="text-xs text-muted-foreground/80 mt-1 break-words">
                          {p.sources.map((s) => s.label).filter(Boolean).slice(0, 3).join(' · ')}
                          {p.sources.length > 3 ? ` +${p.sources.length - 3}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button asChild size="sm" className="rounded-xl min-h-[44px]">
                        <Link href={`/ngo-admin/call-center/call/${p.id}`}>
                          <Phone className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Ara</span>
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="outline" className="rounded-xl min-h-[44px] min-w-[44px]" aria-label="Diğer">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/ngo-admin/call-center/call/${p.id}`}>
                              <MessageSquare className="mr-2 h-4 w-4" /> Not & Detay
                            </Link>
                          </DropdownMenuItem>
                          {p.phone && (
                            <DropdownMenuItem asChild>
                              <a href={waLink(p.phone, shareText)} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                              </a>
                            </DropdownMenuItem>
                          )}
                          {p.phone && (
                            <DropdownMenuItem asChild>
                              <a href={smsLink(p.phone, shareText)}>
                                <Smartphone className="mr-2 h-4 w-4" /> SMS
                              </a>
                            </DropdownMenuItem>
                          )}
                          {p.email && (
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${p.email}`}>
                                <Mail className="mr-2 h-4 w-4" /> E-posta
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => markAttendance([p.id], p.attendance === 'attended' ? 'clear' : 'attended')}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> {p.attendance === 'attended' ? 'Yoklamayı kaldır' : 'Geldi işaretle'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => markAttendance([p.id], p.attendance === 'absent' ? 'clear' : 'absent')}>
                            <XCircle className="mr-2 h-4 w-4 text-red-500" /> {p.attendance === 'absent' ? 'Yoklamayı kaldır' : 'Gelmedi işaretle'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <UserPlus className="mr-2 h-4 w-4" /> {p.assignedToName ? `Sorumlu: ${p.assignedToName}` : 'Sorumlu ata'}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {team.length === 0 ? (
                                <DropdownMenuItem disabled>Ekip üyesi yok</DropdownMenuItem>
                              ) : team.map((m) => (
                                <DropdownMenuItem key={m.userId} onClick={() => assign([p.id], m)}>
                                  <UserPlus className="mr-2 h-4 w-4" /> {m.name}
                                </DropdownMenuItem>
                              ))}
                              {p.assignedToName && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => assign([p.id], null)}>
                                    <UserX className="mr-2 h-4 w-4" /> Sorumluyu kaldır
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button asChild variant="ghost" size="sm" className="rounded-xl w-full justify-start h-9 text-muted-foreground">
                      <Link href={`/ngo-admin/call-center/call/${p.id}`}>
                        <MessageSquare className="h-4 w-4 mr-1.5" />
                        <span className="text-xs font-semibold">Açıklama / not ekle</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
    );
  }
}
