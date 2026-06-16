'use client';

/**
 * /ngo-admin/call-center/contacts
 *
 * STK çağrı merkezi kişi rehberi. Arama + liste + disposition filtresi ile
 * sayfalı tablo. URL query params (q, listId, disposition, page) state'i
 * yansıtır; paylaşılabilir/yenilenebilir link.
 *
 * KVKK: yalnızca caller'ın ngoId'sine ait kişiler API tarafında filtrelenir.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Loader2,
  ListChecks,
  Phone,
  Search,
  Users,
} from 'lucide-react';
import { messagingFetch } from '@/lib/messaging/client';

const PAGE_SIZE = 50;
const ALL_VALUE = '__all__';

interface ContactRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  attempts: number;
  lastAttemptAt: string | null;
  lastDisposition: string | null;
  listIds: string[];
}

interface ContactsResponse {
  contacts: ContactRow[];
  total: number;
}

interface ListRow {
  id: string;
  name: string;
  totalContacts: number;
}

interface ListsResponse {
  lists: ListRow[];
}

const DISPOSITION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'never_called', label: 'Hiç aranmamış' },
  { value: 'answered', label: 'Görüşüldü' },
  { value: 'no_answer', label: 'Cevapsız' },
  { value: 'busy', label: 'Meşgul' },
  { value: 'wrong_number', label: 'Yanlış numara' },
];

const DISPOSITION_LABEL: Record<string, string> = {
  answered: 'Görüşüldü',
  no_answer: 'Cevapsız',
  busy: 'Meşgul',
  wrong_number: 'Yanlış numara',
  never_called: 'Hiç aranmamış',
};

const DISPOSITION_BADGE: Record<string, string> = {
  answered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  no_answer: 'bg-amber-100 text-amber-800 border-amber-200',
  busy: 'bg-orange-100 text-orange-800 border-orange-200',
  wrong_number: 'bg-rose-100 text-rose-800 border-rose-200',
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

function parsePage(raw: string | null): number {
  const n = Number.parseInt(raw ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default function ContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get('q') ?? '';
  const initialListId = searchParams.get('listId') ?? '';
  const initialDisposition = searchParams.get('disposition') ?? '';
  const initialPage = parsePage(searchParams.get('page'));

  // Input state (debounced before commit to URL).
  const [searchInput, setSearchInput] = useState(initialQ);
  // Effective query state (mirrors URL).
  const [q, setQ] = useState(initialQ);
  const [listId, setListId] = useState(initialListId);
  const [disposition, setDisposition] = useState(initialDisposition);
  const [page, setPage] = useState(initialPage);

  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lists, setLists] = useState<ListRow[]>([]);
  const [listsLoading, setListsLoading] = useState(true);

  // URL state'ini sync et — filtre değiştiğinde browser history'e yaz.
  const syncUrl = useCallback(
    (next: { q?: string; listId?: string; disposition?: string; page?: number }) => {
      const params = new URLSearchParams();
      const nextQ = next.q ?? '';
      const nextListId = next.listId ?? '';
      const nextDisposition = next.disposition ?? '';
      const nextPage = next.page ?? 1;
      if (nextQ) params.set('q', nextQ);
      if (nextListId) params.set('listId', nextListId);
      if (nextDisposition) params.set('disposition', nextDisposition);
      if (nextPage > 1) params.set('page', String(nextPage));
      const qs = params.toString();
      router.replace(qs ? `/ngo-admin/call-center/contacts?${qs}` : '/ngo-admin/call-center/contacts');
    },
    [router],
  );

  // Arama input debounce — 300ms.
  useEffect(() => {
    if (searchInput === q) return;
    const t = setTimeout(() => {
      setQ(searchInput);
      setPage(1);
      syncUrl({ q: searchInput, listId, disposition, page: 1 });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, q, listId, disposition, syncUrl]);

  // Listeleri tek sefer yükle.
  useEffect(() => {
    let cancelled = false;
    setListsLoading(true);
    messagingFetch<ListsResponse>('/api/ngo-admin/call-center/lists')
      .then((res) => {
        if (cancelled) return;
        setLists(res.lists);
      })
      .catch(() => {
        if (cancelled) return;
        setLists([]);
      })
      .finally(() => {
        if (!cancelled) setListsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Kişileri yükle (filtre değiştiğinde tetiklenir).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (listId) params.set('listId', listId);
    if (disposition) params.set('disposition', disposition);
    params.set('page', String(page));
    params.set('limit', String(PAGE_SIZE));
    messagingFetch<ContactsResponse>(`/api/ngo-admin/call-center/contacts?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setContacts(res.contacts);
        setTotal(res.total);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setContacts([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : 'Kişiler yüklenemedi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, listId, disposition, page]);

  function handleListChange(value: string) {
    const next = value === ALL_VALUE ? '' : value;
    setListId(next);
    setPage(1);
    syncUrl({ q, listId: next, disposition, page: 1 });
  }

  function handleDispositionChange(value: string) {
    const next = value === ALL_VALUE ? '' : value;
    setDisposition(next);
    setPage(1);
    syncUrl({ q, listId, disposition: next, page: 1 });
  }

  function handlePageChange(next: number) {
    setPage(next);
    syncUrl({ q, listId, disposition, page: next });
  }

  const totalPages = useMemo(
    () => (total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1),
    [total],
  );
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, page * PAGE_SIZE);

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
            <BreadcrumbPage>Kişi Rehberi</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" /> Kişi Rehberi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tüm rehberinizi tek ekrandan arayın, filtreleyin ve sıraya alın.
          </p>
        </div>
        <Button asChild>
          <Link href="/ngo-admin/call-center/queue">
            <ListChecks className="h-4 w-4 mr-2" /> Sıraya Al
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1 md:col-span-1">
            <label htmlFor="contacts-search" className="text-xs text-muted-foreground">
              Arama
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contacts-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ad, telefon veya e-posta"
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Liste</label>
            <Select value={listId || ALL_VALUE} onValueChange={handleListChange} disabled={listsLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm listeler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Tüm listeler</SelectItem>
                {lists.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} ({l.totalContacts})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Son durum</label>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">
            Kişiler {total > 0 ? <span className="text-xs font-normal text-muted-foreground ml-2">{total} kayıt</span> : null}
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
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">
              Filtrelere uygun kişi bulunamadı.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead className="text-right">Deneme</TableHead>
                    <TableHead>Son Durum</TableHead>
                    <TableHead>Son Arama</TableHead>
                    <TableHead className="text-right">Aksiyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c) => {
                    const dispKey = c.lastDisposition ?? '';
                    const dispLabel = dispKey ? DISPOSITION_LABEL[dispKey] ?? dispKey : 'Hiç aranmamış';
                    const dispBadgeClass = dispKey ? DISPOSITION_BADGE[dispKey] ?? '' : '';
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{c.phone || '—'}</TableCell>
                        <TableCell className="text-xs">{c.email ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{c.attempts}</TableCell>
                        <TableCell>
                          {dispKey ? (
                            <Badge className={dispBadgeClass} variant="outline">
                              {dispLabel}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Hiç aranmamış</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDateTime(c.lastAttemptAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/ngo-admin/call-center/call/${c.id}`}>
                              <Phone className="h-3.5 w-3.5 mr-1" /> Ara
                            </Link>
                          </Button>
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
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!canPrev}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Önceki
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!canNext}
                >
                  Sonraki <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
