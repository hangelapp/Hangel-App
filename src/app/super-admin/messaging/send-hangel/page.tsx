'use client';

/**
 * /super-admin/messaging/send-hangel
 *
 * hangel adına (sender: PASIFIK_FROM) doğrudan Pasifik üzerinden toplu SMS.
 * - Test SMS, manuel / CSV / liste üzerinden alıcı seçimi, segment + maliyet
 *   ön-izlemesi, sonuç tablosu.
 * - STK adına gönderim için /ngo-admin/sms kullanılır.
 *
 * Auth: super-admin only. Layout zaten role gate'i yapıyor; sayfa içinde de
 * defansif kontrol var.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { messagingFetch } from '@/lib/messaging/client';
import { segmentInfo } from '@/lib/messaging/sms-segments';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  AlertTriangle,
  CheckCircle2,
  Coins,
  FileUp,
  Loader2,
  RefreshCw,
  Send,
  TestTube2,
  Users,
  XCircle,
} from 'lucide-react';

type RecipientTab = 'manual' | 'csv' | 'list';
type UseCase = 'transactional' | 'marketing';

interface BalanceResponse {
  credits: number;
  raw?: unknown;
}

interface ListRow {
  id: string;
  name: string;
  description: string;
  totalContacts: number;
  importedAt: string | null;
  status: string;
}

interface SendResultRow {
  to: string;
  providerMessageId: string | null;
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
}

interface SendNowResponse {
  jobId: string;
  sent: number;
  failed: number;
  results?: SendResultRow[];
}

interface TestSendResponse {
  ok: boolean;
  providerMessageId?: string | null;
  errorCode?: string;
  errorMessage?: string;
}

interface ContactRow {
  id: string;
  phone?: string;
  fullName?: string;
}

interface ContactsResponse {
  contacts: ContactRow[];
  total: number;
}

interface CsvState {
  fileName: string;
  totalRows: number;
  phoneColumn: string | null;
  phones: string[];
}

const UNIT_COST_TRY = 0.3;
const SEND_DELAY_HINT_MS = 100;
const MAX_RECIPIENTS = 5000;
const CSV_MAX_BYTES = 5 * 1024 * 1024;

function normalizePhoneE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (digits.length < 10 || digits.length > 15) return null;
  // 10 haneli (Türkiye yerel, baştaki 0 atılmış) → 90 prefix
  if (digits.length === 10 && digits.startsWith('5')) {
    return '90' + digits;
  }
  // 11 haneli ve 0 ile başlıyor (05XX...)
  if (digits.length === 11 && digits.startsWith('0')) {
    return '90' + digits.slice(1);
  }
  return digits;
}

function detectPhoneColumn(columns: string[]): string | null {
  const lc = columns.map((c) => c.toLowerCase().trim());
  const keys = ['telefon', 'phone', 'tel', 'gsm', 'mobile', 'cep', 'numara'];
  for (const k of keys) {
    const idx = lc.findIndex((c) => c.includes(k));
    if (idx >= 0) return columns[idx];
  }
  return columns[0] ?? null;
}

function formatTRY(value: number): string {
  return value.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function maskPhone(p: string): string {
  if (p.length <= 6) return p;
  return p.slice(0, 4) + '***' + p.slice(-3);
}

export default function SendHangelPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [claimsRole, setClaimsRole] = useState<string | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      setClaimsRole(null);
      setRoleChecked(!isUserLoading);
      return;
    }
    let cancelled = false;
    user
      .getIdTokenResult()
      .then((res) => {
        if (cancelled) return;
        const role = (res.claims as { role?: unknown }).role;
        setClaimsRole(typeof role === 'string' ? role : null);
        setRoleChecked(true);
      })
      .catch(() => {
        if (cancelled) return;
        setClaimsRole(null);
        setRoleChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isUserLoading]);

  const isSuperAdmin = claimsRole === 'super-admin';

  // ---- Bakiye ----
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const data = await messagingFetch<BalanceResponse>(
        '/api/super-admin/messaging/pasifik/balance',
        { cache: 'no-store' },
      );
      setBalance(typeof data?.credits === 'number' ? data.credits : null);
    } catch (e) {
      setBalanceError(e instanceof Error ? e.message : 'Bakiye sorgulanamadı.');
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) void fetchBalance();
  }, [isSuperAdmin, fetchBalance]);

  // ---- Test SMS ----
  const [testTo, setTestTo] = useState('');
  const [testBody, setTestBody] = useState('');
  const [testSending, setTestSending] = useState(false);

  const handleTestSend = async () => {
    const to = normalizePhoneE164(testTo);
    if (!to) {
      toast({
        variant: 'destructive',
        title: 'Geçersiz numara',
        description: '+90 ile başlayan veya 10 haneli mobil numara girin.',
      });
      return;
    }
    if (!testBody.trim()) {
      toast({
        variant: 'destructive',
        title: 'Mesaj boş',
        description: 'Test SMS için mesaj girmeniz gerekir.',
      });
      return;
    }
    setTestSending(true);
    try {
      const r = await messagingFetch<TestSendResponse>(
        '/api/super-admin/messaging/pasifik/test-send',
        {
          method: 'POST',
          body: JSON.stringify({ to, body: testBody }),
        },
      );
      if (r.ok) {
        toast({
          title: 'Test SMS gönderildi',
          description: r.providerMessageId
            ? 'Mesaj ID: ' + r.providerMessageId
            : 'Pasifik kabul etti.',
        });
        void fetchBalance();
      } else {
        toast({
          variant: 'destructive',
          title: 'Test başarısız',
          description: r.errorMessage ?? r.errorCode ?? 'Bilinmeyen hata.',
        });
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Test gönderilemedi',
        description: e instanceof Error ? e.message : 'Beklenmeyen hata.',
      });
    } finally {
      setTestSending(false);
    }
  };

  // ---- Toplu gönderim ----
  const [recipientTab, setRecipientTab] = useState<RecipientTab>('manual');
  const [manualText, setManualText] = useState('');
  const [csv, setCsv] = useState<CsvState | null>(null);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [listContacts, setListContacts] = useState<ContactRow[]>([]);
  const [listContactsLoading, setListContactsLoading] = useState(false);

  const [bulkBody, setBulkBody] = useState('');
  const [useCase, setUseCase] = useState<UseCase>('transactional');

  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ total: number; done: number } | null>(null);
  const [sendResults, setSendResults] = useState<SendResultRow[]>([]);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const recipients = useMemo<string[]>(() => {
    let raw: string[];
    if (recipientTab === 'manual') {
      raw = manualText
        .split(/\r?\n|,|;/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else if (recipientTab === 'csv') {
      raw = csv?.phones ?? [];
    } else {
      raw = listContacts.map((c) => c.phone ?? '').filter((p) => p.length > 0);
    }
    const normalized: string[] = [];
    for (const r of raw) {
      const n = normalizePhoneE164(r);
      if (n) normalized.push(n);
    }
    return Array.from(new Set(normalized));
  }, [recipientTab, manualText, csv, listContacts]);

  const seg = useMemo(() => segmentInfo(bulkBody), [bulkBody]);
  const totalCost = useMemo(
    () => recipients.length * Math.max(seg.segments, 1) * UNIT_COST_TRY,
    [recipients.length, seg.segments],
  );

  // ---- Liste yükle ----
  const fetchLists = useCallback(async () => {
    setListsLoading(true);
    try {
      const data = await messagingFetch<{ lists: ListRow[] }>(
        '/api/ngo-admin/call-center/lists',
        { cache: 'no-store' },
      );
      setLists(Array.isArray(data?.lists) ? data.lists : []);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Listeler alınamadı',
        description: e instanceof Error ? e.message : 'Beklenmeyen hata.',
      });
    } finally {
      setListsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (recipientTab === 'list' && lists.length === 0 && !listsLoading) {
      void fetchLists();
    }
  }, [recipientTab, lists.length, listsLoading, fetchLists]);

  // ---- Liste kişilerini yükle ----
  useEffect(() => {
    if (!selectedListId) {
      setListContacts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setListContactsLoading(true);
      try {
        const url =
          '/api/ngo-admin/call-center/contacts?listId=' +
          encodeURIComponent(selectedListId) +
          '&limit=' +
          String(MAX_RECIPIENTS);
        const data = await messagingFetch<ContactsResponse>(url, {
          cache: 'no-store',
        });
        if (cancelled) return;
        setListContacts(Array.isArray(data?.contacts) ? data.contacts : []);
      } catch (e) {
        if (cancelled) return;
        setListContacts([]);
        toast({
          variant: 'destructive',
          title: 'Liste kişileri alınamadı',
          description: e instanceof Error ? e.message : 'Beklenmeyen hata.',
        });
      } finally {
        if (!cancelled) setListContactsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedListId, toast]);

  // ---- CSV ----
  const handleCsvChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > CSV_MAX_BYTES) {
      toast({
        variant: 'destructive',
        title: 'Dosya çok büyük',
        description: 'En fazla 5 MB CSV dosyası yükleyebilirsiniz.',
      });
      e.target.value = '';
      return;
    }
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const rows = parsed.data || [];
        const columns = parsed.meta.fields ?? [];
        const phoneColumn = detectPhoneColumn(columns);
        const phones: string[] = [];
        if (phoneColumn) {
          for (const r of rows) {
            const raw = r[phoneColumn];
            if (typeof raw !== 'string') continue;
            const p = normalizePhoneE164(raw);
            if (p) phones.push(p);
          }
        }
        const uniquePhones = Array.from(new Set(phones));
        setCsv({
          fileName: file.name,
          totalRows: rows.length,
          phoneColumn,
          phones: uniquePhones,
        });
        if (!phoneColumn) {
          toast({
            variant: 'destructive',
            title: 'Telefon kolonu bulunamadı',
            description: 'CSV başlıklarında telefon/phone/tel kolonu olmalı.',
          });
        } else if (uniquePhones.length === 0) {
          toast({
            variant: 'destructive',
            title: 'Geçerli numara yok',
            description: 'CSV içindeki numaralar tanınamadı.',
          });
        } else {
          toast({
            title: 'CSV yüklendi',
            description: uniquePhones.length + ' geçerli numara hazır.',
          });
        }
      },
      error: (err) => {
        toast({
          variant: 'destructive',
          title: 'CSV okunamadı',
          description: err.message,
        });
      },
    });
    e.target.value = '';
  };

  // ---- Toplu gönder ----
  const handleBulkSend = async () => {
    if (recipients.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Alıcı yok',
        description: 'En az bir geçerli numara gerekli.',
      });
      return;
    }
    if (recipients.length > MAX_RECIPIENTS) {
      toast({
        variant: 'destructive',
        title: 'Çok fazla alıcı',
        description: 'Tek seferde en fazla ' + MAX_RECIPIENTS + ' numara.',
      });
      return;
    }
    if (!bulkBody.trim()) {
      toast({
        variant: 'destructive',
        title: 'Mesaj boş',
        description: 'Gönderilecek mesaj metni gerekli.',
      });
      return;
    }
    const confirmed = window.confirm(
      recipients.length +
        ' kişiye, ' +
        seg.segments +
        ' segmentlik mesaj gönderilecek.\nTahmini maliyet: ' +
        formatTRY(totalCost) +
        '\n\nDevam edilsin mi?',
    );
    if (!confirmed) return;

    setSending(true);
    setSendResults([]);
    setSentCount(0);
    setFailedCount(0);
    setSendProgress({ total: recipients.length, done: 0 });

    try {
      const r = await messagingFetch<SendNowResponse>(
        '/api/super-admin/messaging/send-now',
        {
          method: 'POST',
          body: JSON.stringify({
            recipients,
            body: bulkBody,
            useCase,
          }),
        },
      );
      setSentCount(r.sent ?? 0);
      setFailedCount(r.failed ?? 0);
      setSendResults(Array.isArray(r.results) ? r.results : []);
      setSendProgress({
        total: recipients.length,
        done: (r.sent ?? 0) + (r.failed ?? 0),
      });
      toast({
        title: 'Gönderim tamamlandı',
        description:
          (r.sent ?? 0) + ' başarılı, ' + (r.failed ?? 0) + ' başarısız.',
      });
      void fetchBalance();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Toplu gönderim başarısız',
        description: e instanceof Error ? e.message : 'Beklenmeyen hata.',
      });
    } finally {
      setSending(false);
    }
  };

  // ---- Render ----
  if (!roleChecked || isUserLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-2xl">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Yetki yok</AlertTitle>
          <AlertDescription className="mt-2 flex items-center justify-between gap-3">
            <span>Bu sayfayı yalnızca süper-admin kullanıcılar görebilir.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.replace('/super-admin')}
            >
              Panele dön
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const overLimit = recipients.length > MAX_RECIPIENTS;
  const insufficientBalance =
    balance !== null &&
    Math.max(seg.segments, 1) * recipients.length > balance;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">
          hangel Adına Toplu SMS Gönder
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gönderici sender ID hangel (PASIFIK_FROM). STK adına gönderim için
          ilgili STK panelini kullanın.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Dikkat — kurumsal gönderim</AlertTitle>
        <AlertDescription>
          Bu sayfa SMS gönderimini hangel adına yapar. STK için göndermek
          isterseniz ilgili STK panelinden (/ngo-admin/sms) yapın. Tüm gönderimler
          messageJobs koleksiyonuna kayıt düşer ve audit log'a girer.
        </AlertDescription>
      </Alert>

      {/* Bakiye */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Pasifik Bakiye</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchBalance()}
            disabled={balanceLoading}
          >
            {balanceLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" /> Yenile
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {balanceError ? (
            <p className="text-sm text-destructive">{balanceError}</p>
          ) : balance === null ? (
            <p className="text-sm text-muted-foreground">
              {balanceLoading ? 'Yükleniyor…' : 'Bakiye bilgisi yok.'}
            </p>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">
                {balance.toLocaleString('tr-TR')}
              </span>
              <span className="text-sm text-muted-foreground">kredi (SMS)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test SMS */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5 text-violet-500" />
            <CardTitle className="text-base">Test SMS</CardTitle>
          </div>
          <CardDescription>
            Canlıya açmadan önce tek bir numaraya test SMS gönderin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <Label htmlFor="test-to">Telefon</Label>
              <Input
                id="test-to"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="+905XX..."
                inputMode="tel"
                autoComplete="off"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="test-body">Mesaj</Label>
              <Textarea
                id="test-body"
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                rows={3}
                maxLength={612}
                placeholder="Test mesajınız…"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {testBody.length} karakter
                {testBody.length > 160 ? ' (uzun mesaj)' : ''}
              </p>
            </div>
          </div>
          <Button onClick={handleTestSend} disabled={testSending}>
            {testSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube2 className="h-4 w-4 mr-2" />
            )}
            Test Gönder
          </Button>
        </CardContent>
      </Card>

      {/* Toplu gönderim */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Toplu Gönderim</CardTitle>
          </div>
          <CardDescription>
            Alıcı listesi seçin, mesajı yazın, gönderin. Gönderim ardışık ve
            yaklaşık {SEND_DELAY_HINT_MS}ms throttle ile yapılır.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Alıcılar</Label>
            <Tabs
              value={recipientTab}
              onValueChange={(v) => setRecipientTab(v as RecipientTab)}
            >
              <TabsList className="grid grid-cols-3 w-full md:w-[480px]">
                <TabsTrigger value="manual">Manuel</TabsTrigger>
                <TabsTrigger value="csv">CSV Yükle</TabsTrigger>
                <TabsTrigger value="list">Liste Seç</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-3">
                <Textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  rows={6}
                  placeholder={
                    '+905001234567\n+905001234568\n+905001234569\n\nHer satıra bir numara (virgül veya noktalı virgül de olur).'
                  }
                />
              </TabsContent>

              <TabsContent value="csv" className="mt-3 space-y-2">
                <label className="block">
                  <span className="sr-only">CSV dosyası seç</span>
                  <Input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvChange}
                  />
                </label>
                {csv && (
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <FileUp className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{csv.fileName}</span>
                      <Badge variant="outline">{csv.totalRows} satır</Badge>
                    </div>
                    {csv.phoneColumn ? (
                      <p className="text-xs text-muted-foreground">
                        Tespit edilen telefon kolonu:{' '}
                        <code className="bg-muted px-1 rounded">
                          {csv.phoneColumn}
                        </code>{' '}
                        — geçerli numara: {csv.phones.length}
                      </p>
                    ) : (
                      <p className="text-xs text-destructive">
                        Telefon kolonu bulunamadı.
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="list" className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedListId}
                    onValueChange={(v) => setSelectedListId(v)}
                  >
                    <SelectTrigger className="md:w-[420px]">
                      <SelectValue
                        placeholder={
                          listsLoading ? 'Listeler yükleniyor…' : 'Liste seçin'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          {listsLoading ? 'Yükleniyor…' : 'Liste yok'}
                        </SelectItem>
                      ) : (
                        lists.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name} · {l.totalContacts} kişi
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void fetchLists()}
                    disabled={listsLoading}
                  >
                    {listsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Yalnızca hangel kurumsal hesabına bağlı çağrı merkezi
                  listeleri görünür.
                </p>
                {selectedListId && (
                  <div className="text-xs text-muted-foreground">
                    {listContactsLoading
                      ? 'Kişiler yükleniyor…'
                      : listContacts.length +
                        ' kişi seçili listede (telefonu olanlar gönderime dahil).'}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Özet */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground">Geçerli alıcı</p>
              <p className="text-xl font-bold tabular-nums">
                {recipients.length.toLocaleString('tr-TR')}
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground">Segment</p>
              <p className="text-xl font-bold tabular-nums">{seg.segments}</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground">Encoding</p>
              <p className="text-xl font-bold">
                <Badge
                  variant={seg.encoding === 'GSM7' ? 'secondary' : 'outline'}
                >
                  {seg.encoding}
                </Badge>
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground">Tahmini Maliyet</p>
              <p className="text-xl font-bold tabular-nums">
                {formatTRY(totalCost)}
              </p>
            </div>
          </div>

          {/* Mesaj */}
          <div>
            <Label htmlFor="bulk-body">Mesaj</Label>
            <Textarea
              id="bulk-body"
              value={bulkBody}
              onChange={(e) => setBulkBody(e.target.value)}
              rows={5}
              placeholder="Gönderilecek SMS metni…"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
              <span className="text-muted-foreground">
                {seg.chars} karakter · {seg.segments} segment
              </span>
              {seg.encoding === 'UCS2' && (
                <span className="text-amber-700">
                  Türkçe karakter kullanıldı — kapasite 160→70 düştü.
                </span>
              )}
            </div>
          </div>

          {/* Kullanım amacı */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="use-case">Kullanım amacı</Label>
              <Select
                value={useCase}
                onValueChange={(v) => setUseCase(v as UseCase)}
              >
                <SelectTrigger id="use-case">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactional">
                    Transactional (işlemsel / bilgilendirme)
                  </SelectItem>
                  <SelectItem value="marketing">
                    Marketing (pazarlama — İYS gerekli)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              {useCase === 'marketing' && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Pazarlama amaçlı gönderim için alıcıların İYS onayı olmalı.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {overLimit && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {MAX_RECIPIENTS} alıcı sınırı aşıldı. Listeyi bölün.
              </AlertDescription>
            </Alert>
          )}

          {insufficientBalance && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Pasifik bakiyesi bu gönderim için yetersiz görünüyor (
                {Math.max(seg.segments, 1) * recipients.length} kredi gerek,{' '}
                {balance ?? 0} mevcut).
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleBulkSend}
            disabled={
              sending ||
              recipients.length === 0 ||
              overLimit ||
              !bulkBody.trim()
            }
            size="lg"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Send className="h-5 w-5 mr-2" />
            )}
            {sending
              ? 'Gönderiliyor…'
              : 'Gönder (' + recipients.length + ' kişi)'}
          </Button>

          {sendProgress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  İlerleme: {sendProgress.done}/{sendProgress.total}
                </span>
                <span>
                  {sentCount} başarılı · {failedCount} başarısız
                </span>
              </div>
              <Progress
                value={
                  sendProgress.total === 0
                    ? 0
                    : (sendProgress.done / sendProgress.total) * 100
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sonuçlar */}
      {sendResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-500" />
              <CardTitle className="text-base">Gönderim Sonuçları</CardTitle>
            </div>
            <CardDescription>
              Her alıcı için Pasifik yanıtı. Numaralar log için maskelenmiştir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Mesaj ID</TableHead>
                    <TableHead>Hata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sendResults.map((r, idx) => (
                    <TableRow key={idx + '-' + r.to}>
                      <TableCell className="text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {maskPhone(r.to)}
                      </TableCell>
                      <TableCell>
                        {r.ok ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" /> Hata
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.providerMessageId ?? '-'}
                      </TableCell>
                      <TableCell className="text-xs text-destructive">
                        {r.ok ? '' : r.errorMessage ?? r.errorCode ?? ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
