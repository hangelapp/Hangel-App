'use client';

/**
 * /ngo-admin/whatsapp-business/send
 *
 * 4 adımlı toplu WhatsApp gönderim sihirbazı.
 *
 *  Step 1 — Gönderici WABA numarası (sadece status='active' &&
 *           displayNameStatus='approved').
 *  Step 2 — Onaylı şablon (status='approved', seçilen numaraya bağlı).
 *  Step 3 — Alıcılar: 3 sekme (Liste, Kişi, CSV).
 *  Step 4 — Değişken kaynak haritası + maliyet + KVKK onay → POST /send.
 *
 * Tüm metinler Türkçe, shadcn/ui bileşenleri.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { messagingFetch } from '@/lib/messaging/client';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Inbox,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  Send,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';

// -- API türleri --

interface NumberRow {
  id: string;
  phoneNumber: string;
  wabaPhoneNumberId: string;
  displayName: string;
  displayNameStatus: string;
  qualityRating: string | null;
  status: string;
}

interface TemplateRow {
  id: string;
  wabaPhoneNumberId: string;
  name: string;
  category: 'utility' | 'marketing' | 'authentication' | string;
  language: string;
  bodyText: string;
  headerText: string | null;
  footerText: string | null;
  buttons: unknown[];
  variables: string[];
  status: string;
}

interface ListRow {
  id: string;
  name: string;
  description: string;
  totalContacts: number;
  status: string;
}

interface ContactRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface SendResponse {
  ok?: boolean;
  sent?: number;
  failed?: number;
  total?: number;
  recipientsTruncated?: boolean;
  provider?: string;
  errorCode?: string;
  message?: string;
}

// -- Yardımcılar --

type RecipientTab = 'list' | 'contacts' | 'csv';

type RecipientMode = 'list' | 'contactIds' | 'phones';

type VariableSource =
  | { kind: 'contact_name' }
  | { kind: 'static'; value: string }
  | { kind: 'custom'; field: string };

interface CsvPreview {
  fileName: string;
  totalRows: number;
  phoneColumn: string | null;
  columns: string[];
  preview: Array<Record<string, string>>;
  phones: string[];
}

const MAX_RECIPIENTS = 1000;
const CSV_MAX_BYTES = 5 * 1024 * 1024;

const CATEGORY_PRICE: Record<string, number> = {
  utility: 0.25,
  authentication: 0.25,
  marketing: 0.75,
};

const CATEGORY_LABEL: Record<string, string> = {
  utility: 'Bilgilendirme',
  marketing: 'Pazarlama',
  authentication: 'Doğrulama',
};

function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (!digits.startsWith('+')) {
    if (digits.length < 7) return null;
    return '+' + digits;
  }
  if (digits.length < 8) return null;
  return digits;
}

function detectPhoneColumn(columns: string[]): string | null {
  const lc = columns.map((c) => c.toLowerCase().trim());
  const keys = ['telefon', 'phone', 'tel', 'gsm', 'mobile', 'cep'];
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

function formatCount(n: number): string {
  return n.toLocaleString('tr-TR');
}

// -- Şablon önizleme: {{n}} placeholder'larını variables array'ine göre işaretle --
function renderTemplatePreview(
  body: string,
  variables: string[],
): React.ReactNode {
  if (!body) return null;
  const parts = body.split(/(\{\{\d+\}\})/g);
  return parts.map((part, idx) => {
    const m = /^\{\{(\d+)\}\}$/.exec(part);
    if (m) {
      const i = Number.parseInt(m[1], 10) - 1;
      const name = variables[i] ?? `değişken_${i + 1}`;
      return (
        <span
          key={idx}
          className="rounded bg-amber-100 px-1 py-0.5 text-xs font-medium text-amber-800"
        >
          {`{${name}}`}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

// -- Ana bileşen --

export default function WhatsAppBulkSendPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  // wizard step
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // data
  const [numbers, setNumbers] = useState<NumberRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // selections
  const [selectedNumberId, setSelectedNumberId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // recipients
  const [recipientTab, setRecipientTab] = useState<RecipientTab>('list');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  // contact picker
  const [contactQuery, setContactQuery] = useState('');
  const [contactsResult, setContactsResult] = useState<ContactRow[]>([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  // CSV
  const [csv, setCsv] = useState<CsvPreview | null>(null);

  // variable mapping (per variable name)
  const [variableSources, setVariableSources] = useState<
    Record<string, VariableSource>
  >({});
  const [kvkkConfirmed, setKvkkConfirmed] = useState(false);

  // submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [result, setResult] = useState<SendResponse | null>(null);

  // -- ilk yükleme: numbers + lists --
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setIsLoadingNumbers(true);
      setIsLoadingLists(true);
      setLoadError(null);
      try {
        const [n, l] = await Promise.all([
          messagingFetch<{ numbers: NumberRow[] }>(
            '/api/ngo-admin/whatsapp-business/numbers',
            { cache: 'no-store' },
          ),
          messagingFetch<{ lists: ListRow[] }>(
            '/api/ngo-admin/call-center/lists',
            { cache: 'no-store' },
          ),
        ]);
        if (cancelled) return;
        setNumbers(Array.isArray(n?.numbers) ? n.numbers : []);
        setLists(Array.isArray(l?.lists) ? l.lists : []);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Veriler yüklenemedi.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingNumbers(false);
          setIsLoadingLists(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // -- numara seçildiğinde şablonları çek --
  useEffect(() => {
    if (!user || !selectedNumberId) {
      setTemplates([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoadingTemplates(true);
      try {
        const t = await messagingFetch<{ templates: TemplateRow[] }>(
          '/api/ngo-admin/whatsapp-business/templates?status=approved',
          { cache: 'no-store' },
        );
        if (cancelled) return;
        const all = Array.isArray(t?.templates) ? t.templates : [];
        const filtered = all.filter(
          (tpl) => tpl.wabaPhoneNumberId === selectedNumberId,
        );
        setTemplates(filtered);
      } catch (e) {
        if (!cancelled) {
          toast({
            title: 'Şablonlar alınamadı',
            description: e instanceof Error ? e.message : 'Beklenmeyen hata.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setIsLoadingTemplates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, selectedNumberId, toast]);

  // -- şablon değiştiğinde variable kaynak default'larını ayarla --
  useEffect(() => {
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    if (!tpl) {
      setVariableSources({});
      return;
    }
    const next: Record<string, VariableSource> = {};
    for (const v of tpl.variables) {
      // mevcut kaynak varsa koru; yoksa varsayılan "Kişi adı" eğer ad benziyorsa, aksi halde "Sabit metin" boş.
      const existing = variableSources[v];
      if (existing) {
        next[v] = existing;
        continue;
      }
      const looksLikeName = /(ad|isim|name)/i.test(v);
      next[v] = looksLikeName ? { kind: 'contact_name' } : { kind: 'static', value: '' };
    }
    setVariableSources(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId, templates]);

  // -- kişi arama --
  const runContactSearch = useCallback(
    async (q: string) => {
      if (!user) return;
      setIsSearchingContacts(true);
      try {
        const url = new URL('/api/ngo-admin/call-center/contacts', window.location.origin);
        if (q.trim()) url.searchParams.set('q', q.trim());
        url.searchParams.set('limit', '50');
        const data = await messagingFetch<{ contacts: ContactRow[]; total: number }>(
          url.pathname + url.search,
          { cache: 'no-store' },
        );
        setContactsResult(Array.isArray(data?.contacts) ? data.contacts : []);
        setContactsTotal(typeof data?.total === 'number' ? data.total : 0);
      } catch (e) {
        toast({
          title: 'Kişiler aranamadı',
          description: e instanceof Error ? e.message : 'Beklenmeyen hata.',
          variant: 'destructive',
        });
      } finally {
        setIsSearchingContacts(false);
      }
    },
    [user, toast],
  );

  useEffect(() => {
    if (recipientTab !== 'contacts') return;
    if (!user) return;
    const handle = window.setTimeout(() => {
      void runContactSearch(contactQuery);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [recipientTab, contactQuery, user, runContactSearch]);

  // -- CSV yükleme --
  const handleCsvChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > CSV_MAX_BYTES) {
      toast({
        title: 'Dosya çok büyük',
        description: 'En fazla 5 MB CSV dosyası yükleyebilirsiniz.',
        variant: 'destructive',
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
            const p = normalizePhone(raw);
            if (p) phones.push(p);
          }
        }
        const uniquePhones = Array.from(new Set(phones));
        setCsv({
          fileName: file.name,
          totalRows: rows.length,
          phoneColumn,
          columns,
          preview: rows.slice(0, 10),
          phones: uniquePhones,
        });
        if (!phoneColumn) {
          toast({
            title: 'Telefon kolonu bulunamadı',
            description: 'CSV başlıklarında telefon/phone/tel kolonu olmalı.',
            variant: 'destructive',
          });
        }
      },
      error: (err) => {
        toast({
          title: 'CSV okunamadı',
          description: err.message,
          variant: 'destructive',
        });
      },
    });
  };

  // -- hesaplanmış değerler --

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  const selectedNumber = useMemo(
    () => numbers.find((n) => n.id === selectedNumberId) ?? null,
    [numbers, selectedNumberId],
  );

  const eligibleNumbers = useMemo(
    () =>
      numbers.filter(
        (n) => n.status === 'active' && n.displayNameStatus === 'approved',
      ),
    [numbers],
  );

  const selectedListContactsCount = useMemo(() => {
    if (!selectedListId) return 0;
    const row = lists.find((l) => l.id === selectedListId);
    return row?.totalContacts ?? 0;
  }, [selectedListId, lists]);

  const targetCount = useMemo(() => {
    if (recipientTab === 'list') return selectedListContactsCount;
    if (recipientTab === 'contacts') return selectedContactIds.length;
    return csv?.phones.length ?? 0;
  }, [recipientTab, selectedListContactsCount, selectedContactIds.length, csv]);

  const recipientMode: RecipientMode = useMemo(() => {
    if (recipientTab === 'list') return 'list';
    if (recipientTab === 'contacts') return 'contactIds';
    return 'phones';
  }, [recipientTab]);

  const truncatedTarget = Math.min(targetCount, MAX_RECIPIENTS);

  const estimatedCost = useMemo(() => {
    if (!selectedTemplate) return 0;
    const unit = CATEGORY_PRICE[selectedTemplate.category] ?? 0.25;
    return unit * truncatedTarget;
  }, [selectedTemplate, truncatedTarget]);

  // -- adım gating --

  const canGoStep2 = !!selectedNumberId;
  const canGoStep3 = !!selectedTemplateId;
  const canGoStep4 = targetCount > 0 && targetCount <= MAX_RECIPIENTS;
  const allVariablesFilled = useMemo(() => {
    if (!selectedTemplate) return true;
    for (const v of selectedTemplate.variables) {
      const src = variableSources[v];
      if (!src) return false;
      if (src.kind === 'static' && !src.value.trim()) return false;
      if (src.kind === 'custom' && !src.field.trim()) return false;
    }
    return true;
  }, [selectedTemplate, variableSources]);

  const canSubmit = canGoStep4 && allVariablesFilled && kvkkConfirmed && !isSubmitting;

  // -- gönderim --

  const buildVariablesPayload = useCallback((): Record<string, string[]> | null => {
    if (!selectedTemplate || selectedTemplate.variables.length === 0) return null;

    // Sunucu, recipient index'ine göre value array'i bekliyor.
    // CSV ve liste için contactId/contactName sunucu tarafında map'lenmiyor;
    // bu yüzden burada uzunluk değil ortak placeholder gönderiyoruz —
    // sunucu boş string olarak işliyor.
    //
    // POC: "Kişi adı" ve "Custom field" için client tarafında karşılığı
    // yoksa boş gönderiyoruz; sunucu tarafında contact join Faz 2'ye bırakıldı.
    // "Sabit metin" tüm alıcılara aynı değeri gönderir.
    const len = truncatedTarget;
    const out: Record<string, string[]> = {};
    for (const v of selectedTemplate.variables) {
      const src = variableSources[v];
      if (!src) {
        out[v] = new Array(len).fill('');
        continue;
      }
      if (src.kind === 'static') {
        out[v] = new Array(len).fill(src.value);
      } else {
        // contact_name / custom — POC: boş; gerçek değer sunucu join'i ile gelecek
        out[v] = new Array(len).fill('');
      }
    }
    return out;
  }, [selectedTemplate, truncatedTarget, variableSources]);

  const handleSubmit = async () => {
    if (!user || !selectedNumberId || !selectedTemplateId) return;
    setIsSubmitting(true);
    setSubmitProgress(15);
    setResult(null);

    // Progress simülasyonu (gerçek progress backend tek istekte döner)
    const ticker = window.setInterval(() => {
      setSubmitProgress((p) => Math.min(90, p + 7));
    }, 600);

    try {
      let recipients: unknown;
      if (recipientMode === 'list') {
        recipients = { listId: selectedListId };
      } else if (recipientMode === 'contactIds') {
        recipients = { contactIds: selectedContactIds };
      } else {
        recipients = csv?.phones ?? [];
      }

      const variablesPayload = buildVariablesPayload();
      const body: Record<string, unknown> = {
        wabaPhoneNumberId: selectedNumberId,
        templateId: selectedTemplateId,
        recipients,
      };
      if (variablesPayload) body.variables = variablesPayload;

      const res = await messagingFetch<SendResponse>(
        '/api/ngo-admin/whatsapp-business/send',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );

      setSubmitProgress(100);
      setResult(res);
      toast({
        title: 'Gönderim tamamlandı',
        description: `${formatCount(res.sent ?? 0)} başarılı, ${formatCount(res.failed ?? 0)} başarısız.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gönderim başarısız.';
      setResult({ errorCode: 'SEND_FAILED', message: msg });
      toast({
        title: 'Gönderim başarısız',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      window.clearInterval(ticker);
      setIsSubmitting(false);
    }
  };

  // -- render --

  if (isUserLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Bu sayfayı görüntülemek için giriş yapın.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sonuç sayfası
  if (result && !result.errorCode) {
    const sent = result.sent ?? 0;
    const failed = result.failed ?? 0;
    const total = result.total ?? sent + failed;
    return (
      <div className="container max-w-2xl py-10">
        <Card>
          <CardContent className="space-y-6 py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Gönderim tamamlandı</h2>
              <p className="text-muted-foreground">
                {formatCount(sent)} kişiye gönderildi. {formatCount(failed)} başarısız.
                Konuşmalar Gelen Kutusu'na düştü.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border bg-emerald-50 p-3">
                <div className="text-2xl font-bold text-emerald-700">
                  {formatCount(sent)}
                </div>
                <div className="text-muted-foreground">Başarılı</div>
              </div>
              <div className="rounded-lg border bg-rose-50 p-3">
                <div className="text-2xl font-bold text-rose-700">
                  {formatCount(failed)}
                </div>
                <div className="text-muted-foreground">Başarısız</div>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="text-2xl font-bold text-slate-700">
                  {formatCount(total)}
                </div>
                <div className="text-muted-foreground">Toplam</div>
              </div>
            </div>
            {result.recipientsTruncated && (
              <p className="text-xs text-amber-700">
                Alıcı listesi {formatCount(MAX_RECIPIENTS)} kişiyle sınırlandı.
                Kalanlar için yeni bir gönderim başlatın.
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/ngo-admin/whatsapp-business">
                  <Inbox className="mr-2 h-4 w-4" />
                  Gelen Kutusu'na dön
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setSubmitProgress(0);
                  setStep(1);
                  setSelectedTemplateId(null);
                  setSelectedListId(null);
                  setSelectedContactIds([]);
                  setCsv(null);
                  setKvkkConfirmed(false);
                }}
              >
                Yeni gönderim
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl space-y-6 py-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/ngo-admin">Yönetim</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/ngo-admin/whatsapp-business">
              WhatsApp İş
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Toplu Gönderim</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Send className="h-6 w-6 text-emerald-600" />
            Toplu WhatsApp Gönderimi
          </h1>
          <p className="text-sm text-muted-foreground">
            Onaylı şablonlarla seçtiğiniz alıcılara mesaj gönderin.
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/ngo-admin/whatsapp-business">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Link>
        </Button>
      </div>

      <StepBar current={step} />

      {loadError && (
        <Card className="border-rose-300 bg-rose-50">
          <CardContent className="py-4 text-sm text-rose-800">
            {loadError}
          </CardContent>
        </Card>
      )}

      {/* STEP 1 — Numara */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-600" />
              Gönderici numara seçin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingNumbers ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : eligibleNumbers.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                Aktif ve onaylı WABA numaranız yok.{' '}
                <Link
                  className="font-medium text-emerald-700 underline"
                  href="/ngo-admin/whatsapp-business"
                >
                  Numara bağla
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {eligibleNumbers.map((n) => {
                  const active = n.id === selectedNumberId;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setSelectedNumberId(n.id)}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-4 text-left transition',
                        active
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                          : 'border-border hover:border-emerald-300 hover:bg-muted/40',
                      )}
                    >
                      <div
                        className={cn(
                          'mt-1 flex h-9 w-9 items-center justify-center rounded-full',
                          active ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{n.displayName}</span>
                          {active && (
                            <Check className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {n.phoneNumber}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant="outline" className="text-[10px]">
                            Onaylı
                          </Badge>
                          {n.qualityRating && (
                            <Badge variant="outline" className="text-[10px]">
                              Kalite: {n.qualityRating}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 2 — Şablon */}
      {step === 2 && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Onaylı şablon seçin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingTemplates ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  Bu numara için onaylı şablon yok.{' '}
                  <Link
                    className="font-medium text-emerald-700 underline"
                    href="/ngo-admin/whatsapp-business"
                  >
                    Şablon oluştur
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => {
                    const active = t.id === selectedTemplateId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition',
                          active
                            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                            : 'border-border hover:border-emerald-300 hover:bg-muted/40',
                        )}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{t.name}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {CATEGORY_LABEL[t.category] ?? t.category}
                            </Badge>
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {t.bodyText}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{t.language.toUpperCase()}</span>
                            {t.variables.length > 0 && (
                              <span>{t.variables.length} değişken</span>
                            )}
                          </div>
                        </div>
                        {active && <Check className="mt-1 h-4 w-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Önizleme</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                <div className="space-y-3 rounded-lg border bg-emerald-50/40 p-3 text-sm">
                  {selectedTemplate.headerText && (
                    <div className="font-semibold">
                      {selectedTemplate.headerText}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {renderTemplatePreview(
                      selectedTemplate.bodyText,
                      selectedTemplate.variables,
                    )}
                  </div>
                  {selectedTemplate.footerText && (
                    <div className="text-xs text-muted-foreground">
                      {selectedTemplate.footerText}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sol taraftan bir şablon seçin.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3 — Alıcılar */}
      {step === 3 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Alıcıları belirleyin
            </CardTitle>
            <div className="text-right">
              <div className="text-3xl font-bold leading-none text-emerald-700">
                {formatCount(targetCount)}
              </div>
              <div className="text-xs text-muted-foreground">hedef alıcı</div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={recipientTab}
              onValueChange={(v) => setRecipientTab(v as RecipientTab)}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="list">Liste seç</TabsTrigger>
                <TabsTrigger value="contacts">Kişi seç</TabsTrigger>
                <TabsTrigger value="csv">CSV yükle</TabsTrigger>
              </TabsList>

              {/* LIST */}
              <TabsContent value="list" className="pt-4">
                {isLoadingLists ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : lists.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    Henüz bir kişi listeniz yok.{' '}
                    <Link
                      className="font-medium text-emerald-700 underline"
                      href="/ngo-admin/call-center/lists"
                    >
                      Liste oluştur
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lists.map((l) => {
                      const active = l.id === selectedListId;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setSelectedListId(l.id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition',
                            active
                              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                              : 'border-border hover:border-emerald-300 hover:bg-muted/40',
                          )}
                        >
                          <div className="flex-1 space-y-1">
                            <div className="font-medium">{l.name}</div>
                            {l.description && (
                              <div className="text-xs text-muted-foreground">
                                {l.description}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {formatCount(l.totalContacts)} kişi
                          </Badge>
                          {active && <Check className="h-4 w-4 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* CONTACTS */}
              <TabsContent value="contacts" className="space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={contactQuery}
                      onChange={(e) => setContactQuery(e.target.value)}
                      placeholder="Ad, telefon veya e-posta ile ara…"
                      className="pl-9"
                    />
                  </div>
                  <Badge variant="outline">
                    {formatCount(selectedContactIds.length)} seçili
                  </Badge>
                </div>

                {selectedContactIds.length > MAX_RECIPIENTS && (
                  <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
                    En fazla {formatCount(MAX_RECIPIENTS)} kişi seçebilirsiniz.
                  </div>
                )}

                <div className="max-h-96 space-y-1 overflow-y-auto rounded-lg border p-2">
                  {isSearchingContacts ? (
                    <div className="flex h-24 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : contactsResult.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Sonuç yok.
                    </div>
                  ) : (
                    contactsResult.map((c) => {
                      const checked = selectedContactIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition hover:bg-muted/60',
                            checked && 'bg-emerald-50',
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(state) => {
                              setSelectedContactIds((prev) => {
                                if (state) {
                                  if (prev.includes(c.id)) return prev;
                                  if (prev.length >= MAX_RECIPIENTS) return prev;
                                  return [...prev, c.id];
                                }
                                return prev.filter((id) => id !== c.id);
                              });
                            }}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {c.name || '(adsız)'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {c.phone}
                              {c.email && (
                                <span className="ml-2">· {c.email}</span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Toplam {formatCount(contactsTotal)} kişi içinden arıyorsunuz. En
                  fazla {formatCount(MAX_RECIPIENTS)} kişi seçilebilir.
                </p>
              </TabsContent>

              {/* CSV */}
              <TabsContent value="csv" className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor="csv-file"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm hover:bg-muted"
                  >
                    <Upload className="h-4 w-4" />
                    CSV dosyası seç
                  </Label>
                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvChange}
                    className="hidden"
                  />
                  {csv && (
                    <span className="text-sm text-muted-foreground">
                      {csv.fileName}
                    </span>
                  )}
                </div>

                {csv && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-lg border bg-muted/40 p-3">
                        <div className="text-xs text-muted-foreground">Satır</div>
                        <div className="text-lg font-semibold">
                          {formatCount(csv.totalRows)}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-muted/40 p-3">
                        <div className="text-xs text-muted-foreground">
                          Telefon kolonu
                        </div>
                        <div className="truncate text-sm font-medium">
                          {csv.phoneColumn ?? '—'}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-emerald-50 p-3">
                        <div className="text-xs text-muted-foreground">
                          Geçerli E.164
                        </div>
                        <div className="text-lg font-semibold text-emerald-700">
                          {formatCount(csv.phones.length)}
                        </div>
                      </div>
                    </div>

                    {csv.columns.length > 0 && csv.preview.length > 0 && (
                      <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/60">
                            <tr>
                              {csv.columns.map((c) => (
                                <th
                                  key={c}
                                  className={cn(
                                    'whitespace-nowrap px-3 py-2 text-left font-medium',
                                    c === csv.phoneColumn && 'text-emerald-700',
                                  )}
                                >
                                  {c}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csv.preview.map((row, i) => (
                              <tr key={i} className="border-t">
                                {csv.columns.map((c) => (
                                  <td
                                    key={c}
                                    className="whitespace-nowrap px-3 py-2 text-muted-foreground"
                                  >
                                    {row[c] ?? ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      İlk 10 satır gösteriliyor. Toplam {formatCount(csv.phones.length)} geçerli
                      telefon işleme alınacak.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {targetCount > MAX_RECIPIENTS && (
              <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Tek seferde en fazla {formatCount(MAX_RECIPIENTS)} alıcı
                gönderilebilir. Listenin ilk {formatCount(MAX_RECIPIENTS)} kişisi
                işlenecek.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 4 — Değişken + onay */}
      {step === 4 && selectedTemplate && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
                Değişkenleri doldurun
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTemplate.variables.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Bu şablonda değişken yok. Doğrudan gönderebilirsiniz.
                </p>
              ) : (
                selectedTemplate.variables.map((v) => {
                  const src = variableSources[v] ?? { kind: 'static', value: '' };
                  return (
                    <div
                      key={v}
                      className="space-y-2 rounded-lg border bg-muted/30 p-3"
                    >
                      <Label className="font-medium">{`{${v}}`}</Label>
                      <div className="grid gap-2 md:grid-cols-[180px,1fr]">
                        <Select
                          value={src.kind}
                          onValueChange={(kind) => {
                            setVariableSources((prev) => {
                              const next: VariableSource =
                                kind === 'contact_name'
                                  ? { kind: 'contact_name' }
                                  : kind === 'custom'
                                  ? { kind: 'custom', field: '' }
                                  : { kind: 'static', value: '' };
                              return { ...prev, [v]: next };
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contact_name">Kişi adı</SelectItem>
                            <SelectItem value="static">Sabit metin</SelectItem>
                            <SelectItem value="custom">Custom field</SelectItem>
                          </SelectContent>
                        </Select>
                        {src.kind === 'static' && (
                          <Input
                            value={src.value}
                            onChange={(e) =>
                              setVariableSources((prev) => ({
                                ...prev,
                                [v]: { kind: 'static', value: e.target.value },
                              }))
                            }
                            placeholder="Tüm alıcılara aynı değer"
                          />
                        )}
                        {src.kind === 'custom' && (
                          <Input
                            value={src.field}
                            onChange={(e) =>
                              setVariableSources((prev) => ({
                                ...prev,
                                [v]: { kind: 'custom', field: e.target.value },
                              }))
                            }
                            placeholder="customFields anahtarı (örn. sehir)"
                          />
                        )}
                        {src.kind === 'contact_name' && (
                          <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                            santralContacts.name
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={kvkkConfirmed}
                    onCheckedChange={(s) => setKvkkConfirmed(s === true)}
                    className="mt-0.5"
                  />
                  <span>
                    Bu kişilere{' '}
                    <strong>KVKK aydınlatma metni</strong>'ni daha önce
                    gönderdiğimi ve mesajı almak için onay aldıklarını
                    beyan ederim.
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Özet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow
                label="Gönderici"
                value={selectedNumber?.displayName ?? '—'}
                sub={selectedNumber?.phoneNumber}
              />
              <SummaryRow
                label="Şablon"
                value={selectedTemplate.name}
                sub={CATEGORY_LABEL[selectedTemplate.category] ?? selectedTemplate.category}
              />
              <SummaryRow
                label="Alıcı sayısı"
                value={formatCount(truncatedTarget)}
              />
              <div className="rounded-lg border bg-emerald-50 p-3">
                <div className="text-xs text-emerald-700">Tahmini maliyet</div>
                <div className="text-2xl font-bold text-emerald-700">
                  {formatTRY(estimatedCost)}
                </div>
                <div className="text-[11px] text-emerald-700/80">
                  {selectedTemplate.category === 'marketing'
                    ? '0,75 ₺ × pazarlama mesajı'
                    : '0,25 ₺ × bilgilendirme mesajı'}
                </div>
              </div>

              {isSubmitting && (
                <div className="space-y-2">
                  <Progress value={submitProgress} />
                  <p className="text-xs text-muted-foreground">
                    Gönderiliyor…
                  </p>
                </div>
              )}

              {result?.errorCode && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">
                  <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{result.message ?? 'Gönderim başarısız.'}</span>
                </div>
              )}

              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gönderiliyor…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Gönder
                  </>
                )}
              </Button>

              {!kvkkConfirmed && (
                <p className="text-xs text-muted-foreground">
                  Göndermek için KVKK onayını işaretleyin.
                </p>
              )}
              {!allVariablesFilled && (
                <p className="text-xs text-amber-700">
                  Tüm değişkenler için kaynak belirleyin.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* NAV */}
      {!result && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : 1))}
            disabled={step === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          {step < 4 && (
            <Button
              onClick={() => setStep((s) => (s + 1) as 2 | 3 | 4)}
              disabled={
                (step === 1 && !canGoStep2) ||
                (step === 2 && !canGoStep3) ||
                (step === 3 && !canGoStep4)
              }
            >
              İleri
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// -- yardımcı render bileşenleri --

function StepBar({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps = [
    { id: 1 as const, label: 'Numara', icon: Phone },
    { id: 2 as const, label: 'Şablon', icon: FileText },
    { id: 3 as const, label: 'Alıcılar', icon: Users },
    { id: 4 as const, label: 'Onay', icon: Send },
  ];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const active = current === s.id;
        const done = current > s.id;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.id}>
            <div
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition',
                active && 'border-emerald-500 bg-emerald-50 text-emerald-800',
                done && 'border-emerald-300 bg-emerald-100 text-emerald-700',
                !active && !done && 'border-border text-muted-foreground',
              )}
            >
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  active && 'bg-emerald-500 text-white',
                  done && 'bg-emerald-500 text-white',
                  !active && !done && 'bg-muted text-muted-foreground',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : s.id}
              </div>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-right">
        <div className="font-medium">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
