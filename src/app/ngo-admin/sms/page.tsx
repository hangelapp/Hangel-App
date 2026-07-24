'use client';

/**
 * STK SMS — Toplu SMS Gönderim sayfası.
 *
 * 3 sekme: Yeni Gönderim · Geçmiş Gönderim · Şablonlar.
 *
 * Veri akışı:
 *  - Wallet (TRY bakiye): ngoMessagingWallets/{ngoId} → real-time onSnapshot
 *  - Geçmiş job'lar: GET /api/ngo-admin/messaging/jobs
 *  - Şablonlar: GET/POST /api/ngo-admin/messaging/templates
 *  - Listeler: GET /api/ngo-admin/call-center/lists (santralContactLists)
 *  - Gönderim: POST /api/ngo-admin/messaging/send-now (TRY-debit, jobId döner)
 *
 * Maliyet preview: client-side detectEncoding + segment hesabı × 0.30 TRY × KDV (×1.20).
 * Server son sözü söyler; preview yalnız gösterimdir.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import {
  ArrowLeft,
  Send,
  Loader2,
  Wallet,
  AlertTriangle,
  Upload,
  Users,
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  ListChecks,
} from 'lucide-react';
import { doc } from 'firebase/firestore';

import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { useToast } from '@/hooks/use-toast';
import { detectEncoding } from '@/lib/messaging/sms-segments';
import { toE164TR } from '@/lib/messaging/phone';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const SMS_UNIT_PRICE_TRY = 0.3;
const KDV = 1.2;

type UseCase = 'transactional' | 'marketing';
type SourceMode = 'manual' | 'csv' | 'list';

interface WalletDoc {
  balance?: number;
  reserved?: number;
}

interface JobRow {
  id: string;
  channel: string;
  status: string;
  total: number;
  sent: number;
  failed: number;
  bodySnippet: string;
  segments: number;
  actualCostTry: number;
  createdAt: string | null;
}

interface TemplateRow {
  id: string;
  name: string;
  body: string;
  category: string;
  createdAt: string | null;
}

interface ListRow {
  id: string;
  name: string;
  description: string;
  totalContacts: number;
  importedAt: string | null;
  status: string;
}

function parseRecipientsText(raw: string): string[] {
  const parts = raw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  return Array.from(new Set(parts));
}

function segmentsFor(body: string): number {
  if (!body) return 0;
  const enc = detectEncoding(body);
  if (enc === 'GSM7') {
    return body.length <= 160 ? 1 : Math.ceil(body.length / 153);
  }
  return body.length <= 70 ? 1 : Math.ceil(body.length / 67);
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function statusBadge(status: string): React.ReactNode {
  if (status === 'sent') return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Tamamlandı</Badge>;
  if (status === 'partial') return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Kısmi</Badge>;
  if (status === 'failed') return <Badge variant="destructive">Başarısız</Badge>;
  if (status === 'sending') return <Badge variant="secondary">Gönderiliyor</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function categoryLabel(c: string): string {
  switch (c) {
    case 'transactional': return 'İşlemsel';
    case 'marketing': return 'Pazarlama';
    case 'volunteer': return 'Gönüllülük';
    case 'donation': return 'Bağış';
    default: return 'Diğer';
  }
}

export default function NgoAdminBulkSmsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { id: ngoId, withEntityHeaders } = useActiveEntity();

  // Wallet (TRY balance) — real-time
  const walletRef = useMemoFirebase(
    () => (db && ngoId ? doc(db, COLLECTIONS.ngoMessagingWallets, ngoId) : null),
    [db, ngoId],
  );
  const { data: wallet } = useDoc<WalletDoc>(walletRef);
  const balance = useMemo(() => Number(wallet?.balance ?? 0), [wallet]);

  // Compose state
  const [messageBody, setMessageBody] = useState('');
  const [useCase, setUseCase] = useState<UseCase>('transactional');
  const [sourceMode, setSourceMode] = useState<SourceMode>('manual');
  const [manualText, setManualText] = useState('');
  const [csvRecipients, setCsvRecipients] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [listRecipientCount, setListRecipientCount] = useState<number>(0);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
    balanceAfter: number;
    invalidSkipped?: number;
  } | null>(null);

  // Contact lists
  const [lists, setLists] = useState<ListRow[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  // History
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [tplDialogOpen, setTplDialogOpen] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplBody, setTplBody] = useState('');
  const [tplCategory, setTplCategory] = useState<string>('marketing');
  const [tplSaving, setTplSaving] = useState(false);

  // Recipients derived
  const recipients = useMemo(() => {
    if (sourceMode === 'manual') return parseRecipientsText(manualText);
    if (sourceMode === 'csv') return csvRecipients;
    return [];
  }, [sourceMode, manualText, csvRecipients]);

  const validRecipients = useMemo(
    () => recipients.filter((r) => toE164TR(r) !== null),
    [recipients],
  );
  const invalidCount = recipients.length - validRecipients.length;
  const effectiveRecipientCount =
    sourceMode === 'list' ? listRecipientCount : validRecipients.length;

  const segments = segmentsFor(messageBody);
  const estimatedCost = useMemo(
    () =>
      Number(
        (effectiveRecipientCount * segments * SMS_UNIT_PRICE_TRY * KDV).toFixed(2),
      ),
    [effectiveRecipientCount, segments],
  );
  const insufficient = estimatedCost > balance;

  // Load lists
  useEffect(() => {
    let cancelled = false;
    async function loadLists() {
      if (!authUser) return;
      setListsLoading(true);
      try {
        const token = await authUser.getIdToken();
        const res = await fetch('/api/ngo-admin/call-center/lists', withEntityHeaders({
          headers: { Authorization: `Bearer ${token}` },
        }));
        const data = (await res.json()) as { lists?: ListRow[] };
        if (!cancelled) setLists(Array.isArray(data.lists) ? data.lists : []);
      } catch {
        // sessizce
      } finally {
        if (!cancelled) setListsLoading(false);
      }
    }
    loadLists();
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  // Load history
  const refreshJobs = React.useCallback(async () => {
    if (!authUser) return;
    setJobsLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/ngo-admin/messaging/jobs?limit=50', withEntityHeaders({
        headers: { Authorization: `Bearer ${token}` },
      }));
      const data = (await res.json()) as { jobs?: JobRow[] };
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch {
      // sessizce
    } finally {
      setJobsLoading(false);
    }
  }, [authUser]);

  // Load templates
  const refreshTemplates = React.useCallback(async () => {
    if (!authUser) return;
    setTemplatesLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/ngo-admin/messaging/templates', withEntityHeaders({
        headers: { Authorization: `Bearer ${token}` },
      }));
      const data = (await res.json()) as { templates?: TemplateRow[] };
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch {
      // sessizce
    } finally {
      setTemplatesLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    refreshJobs();
    refreshTemplates();
  }, [refreshJobs, refreshTemplates]);

  // CSV upload — telefon kolonu auto-detect
  function handleCsvFile(file: File): void {
    setCsvError(null);
    setCsvFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data;
        if (rows.length === 0) {
          setCsvError('CSV boş veya okunamadı.');
          setCsvRecipients([]);
          return;
        }
        const columns = result.meta.fields ?? [];
        const phoneColCandidates = ['telefon', 'phone', 'gsm', 'mobile', 'tel', 'numara'];
        const phoneCol =
          columns.find((c) => phoneColCandidates.includes(c.toLowerCase().trim())) ??
          columns.find((c) => /tel|phone|gsm/i.test(c)) ??
          columns[0];
        if (!phoneCol) {
          setCsvError('Telefon sütunu bulunamadı.');
          setCsvRecipients([]);
          return;
        }
        const numbers = new Set<string>();
        for (const row of rows) {
          const v = (row[phoneCol] ?? '').toString().trim();
          if (v) numbers.add(v);
        }
        setCsvRecipients(Array.from(numbers));
      },
      error: () => {
        setCsvError('CSV ayrıştırma hatası.');
        setCsvRecipients([]);
      },
    });
  }

  // Liste seçilince — telefon sayısını çek (server filtresinde +90 normalize ile sayar)
  useEffect(() => {
    let cancelled = false;
    async function loadListPhones() {
      if (sourceMode !== 'list' || !selectedListId || !authUser) {
        setListRecipientCount(0);
        return;
      }
      try {
        const token = await authUser.getIdToken();
        const res = await fetch(
          `/api/ngo-admin/messaging/list-phones?listId=${encodeURIComponent(selectedListId)}`,
          withEntityHeaders({ headers: { Authorization: `Bearer ${token}` } }),
        );
        if (!res.ok) {
          if (!cancelled) setListRecipientCount(0);
          return;
        }
        const data = (await res.json()) as { phones?: string[] };
        const valid = (data.phones ?? []).filter((p) => toE164TR(p) !== null);
        if (!cancelled) setListRecipientCount(new Set(valid).size);
      } catch {
        if (!cancelled) setListRecipientCount(0);
      }
    }
    loadListPhones();
    return () => {
      cancelled = true;
    };
  }, [sourceMode, selectedListId, authUser]);

  // Send
  async function handleSend(): Promise<void> {
    if (!ngoId) {
      toast({ variant: 'destructive', title: 'Aktif kurum bulunamadı' });
      return;
    }
    if (!messageBody.trim()) {
      toast({ variant: 'destructive', title: 'Mesaj boş olamaz' });
      return;
    }
    if (effectiveRecipientCount === 0) {
      toast({ variant: 'destructive', title: 'En az bir geçerli alıcı girin' });
      return;
    }
    if (insufficient) {
      toast({
        variant: 'destructive',
        title: 'Bakiye yetersiz',
        description: `Gereken ${estimatedCost.toFixed(2)} TRY, mevcut ${balance.toFixed(2)} TRY.`,
      });
      return;
    }

    let recipientsToSend: string[];
    if (sourceMode === 'list' && selectedListId && authUser) {
      try {
        const token = await authUser.getIdToken();
        const res = await fetch(
          `/api/ngo-admin/messaging/list-phones?listId=${encodeURIComponent(selectedListId)}`,
          withEntityHeaders({ headers: { Authorization: `Bearer ${token}` } }),
        );
        const data = (await res.json()) as { phones?: string[] };
        recipientsToSend = Array.from(new Set((data.phones ?? []).filter((p) => p)));
      } catch {
        toast({ variant: 'destructive', title: 'Liste alınamadı' });
        return;
      }
    } else {
      recipientsToSend = recipients;
    }

    setIsSending(true);
    setSendResult(null);
    try {
      const token = await authUser?.getIdToken();
      const res = await fetch('/api/ngo-admin/messaging/send-now', withEntityHeaders({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipients: recipientsToSend,
          body: messageBody.trim(),
          useCase,
        }),
      }));
      const data = (await res.json()) as {
        jobId?: string;
        sent?: number;
        failed?: number;
        balanceAfter?: number;
        invalidSkipped?: number;
        errorCode?: string;
        message?: string;
      };
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Gönderim başarısız',
          description: data?.message ?? 'Bilinmeyen hata.',
        });
        return;
      }
      setSendResult({
        sent: data.sent ?? 0,
        failed: data.failed ?? 0,
        balanceAfter: data.balanceAfter ?? balance,
        invalidSkipped: data.invalidSkipped,
      });
      toast({
        title: 'Gönderim tamamlandı',
        description: `${data.sent ?? 0} başarılı, ${data.failed ?? 0} başarısız.`,
      });
      setMessageBody('');
      setManualText('');
      setCsvRecipients([]);
      setCsvFileName(null);
      refreshJobs();
    } catch {
      toast({ variant: 'destructive', title: 'Bağlantı hatası', description: 'Tekrar deneyin.' });
    } finally {
      setIsSending(false);
    }
  }

  async function handleCreateTemplate(): Promise<void> {
    if (!tplName.trim() || !tplBody.trim()) {
      toast({ variant: 'destructive', title: 'Ad ve içerik zorunludur' });
      return;
    }
    setTplSaving(true);
    try {
      const token = await authUser?.getIdToken();
      const res = await fetch('/api/ngo-admin/messaging/templates', withEntityHeaders({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: tplName.trim(),
          body: tplBody.trim(),
          category: tplCategory,
        }),
      }));
      const data = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Şablon kaydedilemedi',
          description: data?.message ?? 'Bilinmeyen hata.',
        });
        return;
      }
      toast({ title: 'Şablon kaydedildi' });
      setTplDialogOpen(false);
      setTplName('');
      setTplBody('');
      setTplCategory('marketing');
      refreshTemplates();
    } catch {
      toast({ variant: 'destructive', title: 'Bağlantı hatası' });
    } finally {
      setTplSaving(false);
    }
  }

  function applyTemplate(t: TemplateRow): void {
    setMessageBody(t.body);
    toast({ title: 'Şablon uygulandı', description: t.name });
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
      {/* Header + breadcrumb */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => router.push('/ngo-admin')}
            className="hover:text-foreground"
          >
            Ana Sayfa
          </button>
          <span>/</span>
          <span>Mesajlaşma</span>
          <span>/</span>
          <span className="text-foreground">Toplu SMS</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="icon"
            className="-ml-2"
            aria-label="Geri"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-headline">Toplu SMS Gönderim</h1>
            <p className="text-muted-foreground text-sm">
              STK adınıza tanımlı sender ile toplu SMS gönderin. Maliyet wallet&apos;ınızdan düşülür.
            </p>
          </div>
        </div>
      </div>

      {/* Wallet kartı */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Kalan Bakiye</p>
              <p className="text-xl font-black">{balance.toFixed(2)} TRY</p>
              {wallet?.reserved ? (
                <p className="text-[10px] text-muted-foreground">
                  Rezerve: {Number(wallet.reserved).toFixed(2)} TRY
                </p>
              ) : null}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/ngo-admin/messaging-packages')}
          >
            Bakiye Yükle
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">Yeni Gönderim</TabsTrigger>
          <TabsTrigger value="history">Geçmiş Gönderim</TabsTrigger>
          <TabsTrigger value="templates">Şablonlar</TabsTrigger>
        </TabsList>

        {/* === SEKME 1: Yeni Gönderim === */}
        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mesaj</CardTitle>
              <CardDescription>
                Maksimum 1000 alıcı. Türkçe karakter UCS-2 ile 70 char/segment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="msg-body">Mesaj İçeriği</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {messageBody.length} karakter · {segments} segment ·{' '}
                    {detectEncoding(messageBody)}
                  </span>
                </div>
                <Textarea
                  id="msg-body"
                  rows={5}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Kullanım Amacı</Label>
                  <Select value={useCase} onValueChange={(v) => setUseCase(v as UseCase)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transactional">İşlemsel (bildirim, onay)</SelectItem>
                      <SelectItem value="marketing">Pazarlama (kampanya, duyuru)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alıcılar</CardTitle>
              <CardDescription>Manuel, CSV ya da kayıtlı liste seçin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={sourceMode} onValueChange={(v) => setSourceMode(v as SourceMode)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="manual">
                    <Users className="h-4 w-4 mr-1" />
                    Manuel
                  </TabsTrigger>
                  <TabsTrigger value="csv">
                    <Upload className="h-4 w-4 mr-1" />
                    CSV
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <ListChecks className="h-4 w-4 mr-1" />
                    Liste
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-2 pt-3">
                  <Label>Numaralar</Label>
                  <Textarea
                    rows={5}
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="05XX XXX XX XX, 05XX XXX XX XX"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {validRecipients.length} geçerli
                    {invalidCount > 0 ? ` · ${invalidCount} geçersiz atılacak` : ''}
                  </p>
                </TabsContent>

                <TabsContent value="csv" className="space-y-2 pt-3">
                  <Label>CSV Dosyası</Label>
                  <Input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCsvFile(f);
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Otomatik tespit edilen kolon adları: telefon, phone, gsm, mobile, tel, numara.
                  </p>
                  {csvFileName ? (
                    <p className="text-xs">
                      <span className="font-medium">{csvFileName}</span> —{' '}
                      {csvRecipients.length} numara yüklendi · {validRecipients.length} geçerli
                    </p>
                  ) : null}
                  {csvError ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>CSV hatası</AlertTitle>
                      <AlertDescription>{csvError}</AlertDescription>
                    </Alert>
                  ) : null}
                </TabsContent>

                <TabsContent value="list" className="space-y-2 pt-3">
                  <Label>Kayıtlı Liste</Label>
                  <Select
                    value={selectedListId ?? ''}
                    onValueChange={(v) => setSelectedListId(v || null)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          listsLoading
                            ? 'Yükleniyor...'
                            : lists.length === 0
                              ? 'Henüz liste yok'
                              : 'Liste seçin'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name} ({l.totalContacts} kişi)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedListId ? (
                    <p className="text-[10px] text-muted-foreground">
                      {listRecipientCount} geçerli numara alıcı listesine eklendi.
                    </p>
                  ) : null}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Maliyet preview + Gönder */}
          <Card>
            <CardHeader>
              <CardTitle>Maliyet Önizleme</CardTitle>
              <CardDescription>Birim 0.30 TRY × segment × KDV (%20). Server son sözü söyler.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-xl border p-3">
                  <p className="text-[10px] text-muted-foreground">Alıcı</p>
                  <p className="text-lg font-bold">{effectiveRecipientCount}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-[10px] text-muted-foreground">Segment</p>
                  <p className="text-lg font-bold">{segments}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-[10px] text-muted-foreground">Birim</p>
                  <p className="text-lg font-bold">{SMS_UNIT_PRICE_TRY.toFixed(2)} ₺</p>
                </div>
                <div
                  className={`rounded-xl border p-3 ${insufficient ? 'border-destructive bg-destructive/5' : 'bg-primary/5'}`}
                >
                  <p className="text-[10px] text-muted-foreground">Toplam (KDV dahil)</p>
                  <p className="text-lg font-bold">{estimatedCost.toFixed(2)} ₺</p>
                </div>
              </div>

              {insufficient ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Bakiye yetersiz</AlertTitle>
                  <AlertDescription>
                    Gereken {estimatedCost.toFixed(2)} TRY için bakiyeniz ({balance.toFixed(2)} TRY)
                    yetmiyor. Bakiye yükleyin.
                  </AlertDescription>
                </Alert>
              ) : null}

              {sendResult ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Son gönderim sonucu</AlertTitle>
                  <AlertDescription>
                    {sendResult.sent} başarılı · {sendResult.failed} başarısız ·{' '}
                    {sendResult.invalidSkipped
                      ? `${sendResult.invalidSkipped} geçersiz atıldı · `
                      : ''}
                    Yeni bakiye: {sendResult.balanceAfter.toFixed(2)} TRY
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button
                className="w-full"
                onClick={handleSend}
                disabled={isSending || insufficient || effectiveRecipientCount === 0 || !messageBody.trim()}
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {effectiveRecipientCount} Alıcıya Gönder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === SEKME 2: Geçmiş === */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geçmiş Gönderim</CardTitle>
              <CardDescription>Son 50 toplu gönderim.</CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 text-sm">
                  Henüz toplu SMS gönderiminiz yok.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">Toplam</TableHead>
                        <TableHead className="text-right">Gönderildi</TableHead>
                        <TableHead className="text-right">Başarısız</TableHead>
                        <TableHead className="text-right">Maliyet</TableHead>
                        <TableHead>Mesaj</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((j) => (
                        <TableRow key={j.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {fmtDate(j.createdAt)}
                          </TableCell>
                          <TableCell>{statusBadge(j.status)}</TableCell>
                          <TableCell className="text-right tabular-nums">{j.total}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">
                            {j.sent}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-destructive">
                            {j.failed}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {j.actualCostTry.toFixed(2)} ₺
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {j.bodySnippet}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === SEKME 3: Şablonlar === */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Şablonlar</CardTitle>
                <CardDescription>
                  Sık gönderdiğiniz mesajları şablon olarak saklayın.
                </CardDescription>
              </div>
              <Dialog open={tplDialogOpen} onOpenChange={setTplDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Yeni Şablon
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yeni Şablon</DialogTitle>
                    <DialogDescription>
                      Şablonu kaydedip ileride tek tıkla mesaj kutusuna yükleyin.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Ad</Label>
                      <Input
                        value={tplName}
                        onChange={(e) => setTplName(e.target.value)}
                        placeholder="Örn: Bağış teşekkür"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>İçerik</Label>
                      <Textarea
                        rows={5}
                        value={tplBody}
                        onChange={(e) => setTplBody(e.target.value)}
                        placeholder="Şablon mesajını yazın..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Kategori</Label>
                      <Select value={tplCategory} onValueChange={setTplCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transactional">İşlemsel</SelectItem>
                          <SelectItem value="marketing">Pazarlama</SelectItem>
                          <SelectItem value="volunteer">Gönüllülük</SelectItem>
                          <SelectItem value="donation">Bağış</SelectItem>
                          <SelectItem value="other">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setTplDialogOpen(false)}
                      disabled={tplSaving}
                    >
                      Vazgeç
                    </Button>
                    <Button onClick={handleCreateTemplate} disabled={tplSaving}>
                      {tplSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kaydet'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 text-sm">
                  Henüz şablonunuz yok. &quot;Yeni Şablon&quot; ile ilkini ekleyin.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((t) => (
                    <Card key={t.id} className="border">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <p className="font-semibold text-sm">{t.name}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {categoryLabel(t.category)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3">{t.body}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {fmtDate(t.createdAt)}
                          </span>
                          <Button size="sm" variant="outline" onClick={() => applyTemplate(t)}>
                            <Send className="h-3 w-3 mr-1" />
                            Kullan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer info */}
      <Card className="bg-muted/30">
        <CardContent className="p-3 text-[10px] text-muted-foreground flex items-start gap-2">
          <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Senkron gönderim sınırı 1000 alıcı. Daha büyük gönderim için kampanya oluşturun.
            Pasifik Telekom üzerinden iletilir; durum sorgulaması job ID ile yapılır.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
