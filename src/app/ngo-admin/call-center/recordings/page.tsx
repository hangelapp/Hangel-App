'use client';

/**
 * /ngo-admin/call-center/recordings
 *
 * STK admin'in çağrı kaydı arşivi. Tarih + disposition + kişi adı filtreli,
 * sayfalı tablo. Bir kaydı dinlemek için modal açılır; modalda native HTML
 * audio player + kişi bilgileri + STK içi notlar (callSessions/{id}/notes).
 *
 * KVKK: kayıt linki yalnızca STK kendi tenant'ı için API tarafında oluşur.
 * Super-admin bu sayfaya gelse bile API ngoId == kendi managedNgoId
 * koşuluyla filtrelediği için cross-tenant erişim verilmez.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Mic,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { messagingFetch } from '@/lib/messaging/client';

const PAGE_SIZE = 50;
const ALL_VALUE = '__all__';

interface RecordingRow {
  id: string;
  contactId: string | null;
  contactName: string;
  calledNumber: string | null;
  callerNumber: string | null;
  direction: 'inbound' | 'outbound' | null;
  duration: number;
  disposition: string | null;
  outcome: string | null;
  status: string | null;
  recordingUrl: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string | null;
}

interface RecordingsResponse {
  recordings: RecordingRow[];
  total: number;
}

interface NoteRow {
  id: string;
  agentUid: string | null;
  agentName: string | null;
  text: string;
  timestamp: number | null;
}

interface NotesResponse {
  notes: NoteRow[];
}

const DISPOSITION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'answered', label: 'Görüşüldü' },
  { value: 'no-answer', label: 'Cevapsız' },
  { value: 'busy', label: 'Meşgul' },
  { value: 'rejected', label: 'Reddedildi' },
  { value: 'voicemail', label: 'Sesli mesaj' },
  { value: 'wrong-number', label: 'Yanlış numara' },
  { value: 'callback-requested', label: 'Geri arama istendi' },
];

const DISPOSITION_LABEL: Record<string, string> = {
  answered: 'Görüşüldü',
  'no-answer': 'Cevapsız',
  busy: 'Meşgul',
  rejected: 'Reddedildi',
  voicemail: 'Sesli mesaj',
  'wrong-number': 'Yanlış numara',
  'callback-requested': 'Geri arama istendi',
};

const DISPOSITION_BADGE: Record<string, string> = {
  answered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'no-answer': 'bg-amber-100 text-amber-800 border-amber-200',
  busy: 'bg-orange-100 text-orange-800 border-orange-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  voicemail: 'bg-sky-100 text-sky-800 border-sky-200',
  'wrong-number': 'bg-rose-100 text-rose-800 border-rose-200',
  'callback-requested': 'bg-violet-100 text-violet-800 border-violet-200',
};

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(sec: number): string {
  if (!sec || sec < 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatNoteTime(ms: number | null): string {
  if (!ms) return '—';
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RecordingsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [disposition, setDisposition] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const [recordings, setRecordings] = useState<RecordingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeRecording, setActiveRecording] = useState<RecordingRow | null>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // AI döküm & özet dialog'u
  const [transcriptRow, setTranscriptRow] = useState<RecordingRow | null>(null);
  const [transcript, setTranscript] = useState<{ transcript: string; summary: string; sentiment: string } | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  const openTranscript = useCallback((r: RecordingRow) => {
    setTranscriptRow(r);
    setTranscript(null);
    setTranscriptError(null);
    setTranscriptLoading(true);
    messagingFetch<{ transcript: string; summary: string; sentiment: string }>(
      `/api/ngo-admin/call-center/sessions/${r.id}/transcribe`,
      { method: 'POST', body: JSON.stringify({}) },
    )
      .then((res) => setTranscript({ transcript: res.transcript, summary: res.summary, sentiment: res.sentiment }))
      .catch((e: unknown) => setTranscriptError(e instanceof Error ? e.message : 'Döküm üretilemedi.'))
      .finally(() => setTranscriptLoading(false));
  }, []);

  // Arama input debounce — 300ms.
  useEffect(() => {
    if (searchInput === q) return;
    const t = setTimeout(() => {
      setQ(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, q]);

  // Kayıtları yükle.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (disposition) params.set('disposition', disposition);
    if (from) {
      const d = new Date(`${from}T00:00:00`);
      if (!Number.isNaN(d.getTime())) params.set('from', d.toISOString());
    }
    if (to) {
      const d = new Date(`${to}T23:59:59`);
      if (!Number.isNaN(d.getTime())) params.set('to', d.toISOString());
    }
    params.set('page', String(page));
    params.set('limit', String(PAGE_SIZE));
    messagingFetch<RecordingsResponse>(
      `/api/ngo-admin/call-center/recordings?${params.toString()}`,
    )
      .then((res) => {
        if (cancelled) return;
        setRecordings(res.recordings);
        setTotal(res.total);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setRecordings([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : 'Kayıtlar yüklenemedi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, disposition, from, to, page]);

  // Notları modal açıldıkça yükle.
  useEffect(() => {
    if (!activeRecording) {
      setNotes([]);
      setNotesError(null);
      return;
    }
    let cancelled = false;
    setNotesLoading(true);
    setNotesError(null);
    messagingFetch<NotesResponse>(
      `/api/ngo-admin/call-center/sessions/${activeRecording.id}/notes`,
    )
      .then((res) => {
        if (cancelled) return;
        setNotes(res.notes);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setNotes([]);
        setNotesError(e instanceof Error ? e.message : 'Notlar yüklenemedi.');
      })
      .finally(() => {
        if (!cancelled) setNotesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeRecording]);

  const handleDispositionChange = useCallback((value: string) => {
    setDisposition(value === ALL_VALUE ? '' : value);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    setQ('');
    setDisposition('');
    setFrom('');
    setTo('');
    setPage(1);
  }, []);

  const totalPages = useMemo(
    () => (total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1),
    [total],
  );
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, page * PAGE_SIZE);

  const filtersActive = Boolean(q || disposition || from || to);

  // Görüntülenen kayıtları CSV olarak indir (Excel-uyumlu, BOM'lu Türkçe).
  const handleExportCsv = useCallback(() => {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['Tarih', 'Kişi', 'Arayan', 'Aranan', 'Yön', 'Süre (sn)', 'Sonuç'];
    const dirTr = (d: string | null) => (d === 'inbound' ? 'Gelen' : d === 'outbound' ? 'Giden' : '');
    const rows = recordings.map((r) => [
      r.startedAt || r.createdAt || '', r.contactName || '', r.callerNumber || '', r.calledNumber || '',
      dirTr(r.direction), String(r.duration ?? 0), DISPOSITION_LABEL[r.disposition ?? ''] || r.disposition || '',
    ].map(esc).join(','));
    const csv = '﻿' + [header.map(esc).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cagri-gecmisi.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch { /* yok say */ } }, 1500);
  }, [recordings]);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-4">
      <Link
        href="/ngo-admin/call-center"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Çağrı Merkezi
      </Link>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/ngo-admin">Yönetim Paneli</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/ngo-admin/call-center">Çağrı Merkezi</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Kayıt Arşivi</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
          <Mic className="h-6 w-6 text-emerald-600" /> Kayıt Arşivi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          STK'nızın çağrı kayıtlarını arayın, dinleyin ve indirin.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-amber-700" />
        <div>
          <strong>KVKK Uyarı:</strong> Bu kayıtlar yalnızca STK yetkilileri
          tarafından dinlenebilir. Süper-admin erişimi YOK. Kaydı paylaşmadan
          önce kayıt sahibinin rızasını doğrulayın.
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="rec-search" className="text-xs text-muted-foreground">
              Kişi veya numara
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="rec-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ad veya telefon"
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Sonuç</label>
            <Select value={disposition || ALL_VALUE} onValueChange={handleDispositionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Tümü</SelectItem>
                {DISPOSITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="rec-from" className="text-xs text-muted-foreground">
              Başlangıç
            </label>
            <Input
              id="rec-from"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="rec-to" className="text-xs text-muted-foreground">
              Bitiş
            </label>
            <Input
              id="rec-to"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="md:col-span-4 flex justify-end gap-2">
            {filtersActive ? (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Filtreleri temizle
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={recordings.length === 0}>
              <Download className="h-4 w-4 mr-1.5" /> CSV indir
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">
            Kayıtlar{' '}
            {total > 0 ? (
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {total} kayıt
              </span>
            ) : null}
          </CardTitle>
          {total > 0 ? (
            <span className="text-xs text-muted-foreground">
              {rangeStart}–{rangeEnd} / {total}
            </span>
          ) : null}
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Mic className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {filtersActive
                  ? 'Filtrelere uygun kayıt bulunamadı.'
                  : 'Henüz kayıt yok. Çağrı merkezi aktif olduğunda kayıtlar burada görünecek.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Kişi</TableHead>
                    <TableHead>Numara</TableHead>
                    <TableHead className="text-right">Süre</TableHead>
                    <TableHead>Sonuç</TableHead>
                    <TableHead className="text-right">Aksiyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordings.map((r) => {
                    const dispKey = r.disposition ?? '';
                    const dispLabel = dispKey ? DISPOSITION_LABEL[dispKey] ?? dispKey : '—';
                    const dispBadgeClass = dispKey ? DISPOSITION_BADGE[dispKey] ?? '' : '';
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDateTime(r.startedAt ?? r.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {r.contactName || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.calledNumber ?? r.callerNumber ?? '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDuration(r.duration)}
                        </TableCell>
                        <TableCell>
                          {dispKey ? (
                            <Badge className={dispBadgeClass} variant="outline">
                              {dispLabel}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveRecording(r)}
                            >
                              <Play className="h-3.5 w-3.5 mr-1" /> Dinle
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-primary"
                              title="AI döküm & özet"
                              onClick={() => openTranscript(r)}
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1" /> Döküm
                            </Button>
                            <Button
                              asChild
                              size="sm"
                              variant="ghost"
                              title="İndir"
                            >
                              <a
                                href={r.recordingUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && !error && total > 0 ? (
            <div className="flex items-center justify-between gap-2 pt-4 border-t mt-4">
              <span className="text-xs text-muted-foreground">
                Sayfa {page} / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!canPrev}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Önceki
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!canNext}
                >
                  Sonraki <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={!!activeRecording}
        onOpenChange={(open) => {
          if (!open) setActiveRecording(null);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-emerald-600" />
              {activeRecording?.contactName || 'Çağrı Kaydı'}
            </DialogTitle>
            <DialogDescription>
              {activeRecording
                ? `${formatDateTime(activeRecording.startedAt ?? activeRecording.createdAt)} · ${formatDuration(activeRecording.duration)}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {activeRecording ? (
            <div className="grid gap-4 md:grid-cols-5">
              <div className="md:col-span-3 space-y-3">
                <div className="rounded-md border bg-background/60 p-3">
                  <audio
                    controls
                    src={activeRecording.recordingUrl}
                    className="w-full"
                    preload="metadata"
                  >
                    Tarayıcınız ses oynatmayı desteklemiyor.
                  </audio>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={activeRecording.recordingUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> Kaydı İndir
                    </a>
                  </Button>
                </div>

                <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                  <strong>KVKK Uyarı:</strong> Bu kayıt sadece STK yetkilileri
                  tarafından dinlenebilir. Süper-admin erişimi YOK. Üçüncü
                  kişilerle paylaşmayın.
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Notlar</h3>
                  {notesLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Notlar yükleniyor...
                    </div>
                  ) : notesError ? (
                    <p className="text-xs text-rose-700">{notesError}</p>
                  ) : notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Bu çağrı için not eklenmemiş.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {notes.map((n) => (
                        <li
                          key={n.id}
                          className="rounded-md border bg-background/40 p-2 text-xs"
                        >
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>{n.agentName || 'Agent'}</span>
                            <span>{formatNoteTime(n.timestamp)}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-foreground">
                            {n.text}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <aside className="md:col-span-2 space-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Kişi</div>
                  <div className="font-medium">
                    {activeRecording.contactName || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Numara</div>
                  <div className="font-mono text-xs">
                    {activeRecording.calledNumber ?? activeRecording.callerNumber ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Yön</div>
                  <div className="text-xs">
                    {activeRecording.direction === 'inbound'
                      ? 'Gelen çağrı'
                      : activeRecording.direction === 'outbound'
                        ? 'Giden çağrı'
                        : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Süre</div>
                  <div className="text-xs">{formatDuration(activeRecording.duration)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Sonuç</div>
                  <div>
                    {activeRecording.disposition ? (
                      <Badge
                        className={DISPOSITION_BADGE[activeRecording.disposition] ?? ''}
                        variant="outline"
                      >
                        {DISPOSITION_LABEL[activeRecording.disposition] ??
                          activeRecording.disposition}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                {activeRecording.outcome ? (
                  <div>
                    <div className="text-xs text-muted-foreground">Outcome notu</div>
                    <p className="text-xs whitespace-pre-wrap">
                      {activeRecording.outcome}
                    </p>
                  </div>
                ) : null}
                {activeRecording.contactId ? (
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/ngo-admin/call-center/contacts?q=${encodeURIComponent(activeRecording.contactName || '')}`}>
                      Kişi rehberinde aç
                    </Link>
                  </Button>
                ) : null}
              </aside>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* AI Döküm & Özet dialog'u */}
      <Dialog open={!!transcriptRow} onOpenChange={(o) => { if (!o) setTranscriptRow(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Döküm & Özet
            </DialogTitle>
            <DialogDescription>
              {transcriptRow?.contactName || transcriptRow?.callerNumber || 'Çağrı kaydı'} — kayıttan otomatik üretildi.
            </DialogDescription>
          </DialogHeader>
          {transcriptLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Ses işleniyor, bir dakika sürebilir…</p>
            </div>
          ) : transcriptError ? (
            <p className="text-sm text-destructive py-4">{transcriptError}</p>
          ) : transcript ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Özet</p>
                <p className="text-sm">{transcript.summary || '—'}</p>
                <span className="inline-block mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {transcript.sentiment}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Konuşma dökümü</p>
                <div className="max-h-72 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-3 text-sm whitespace-pre-wrap">
                  {transcript.transcript || '—'}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
