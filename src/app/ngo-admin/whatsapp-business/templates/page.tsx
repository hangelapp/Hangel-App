'use client';

/**
 * /ngo-admin/whatsapp-business/templates
 *
 * STK WABA mesaj şablonları listesi + yönetimi:
 *   - GET    /api/ngo-admin/whatsapp-business/templates             → şablonlar
 *   - GET    /api/ngo-admin/whatsapp-business/numbers               → sync filtresi
 *   - POST   /api/ngo-admin/whatsapp-business/templates/sync        → Meta'dan içe aktar
 *   - DELETE /api/ngo-admin/whatsapp-business/templates/[id]        → Meta + Firestore sil
 *
 * "+ Yeni Şablon" → /ngo-admin/whatsapp-business/templates/new.
 * Onaya gönderilmiş şablonlar Meta'dan da silinir; draft sadece Firestore'dan.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCcw,
  Trash2,
} from 'lucide-react';

interface TemplateButton {
  type: string;
  text: string;
  url?: string;
  phoneNumber?: string;
  payload?: string;
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
  buttons: TemplateButton[];
  variables: string[];
  wabaTemplateId: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paused' | string;
  rejectionReason: string | null;
  createdAt: string | null;
}

interface NumberRow {
  id: string;
  phoneNumber: string;
  displayName: string;
  status: string;
}

interface ApiError {
  errorCode?: string;
  message?: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Taslak', variant: 'secondary' },
  pending: { label: 'Beklemede', variant: 'outline' },
  approved: { label: 'Onaylı', variant: 'default' },
  rejected: { label: 'Reddedildi', variant: 'destructive' },
  paused: { label: 'Duraklatıldı', variant: 'outline' },
};

const CATEGORY_LABELS: Record<string, string> = {
  utility: 'Hizmet',
  marketing: 'Pazarlama',
  authentication: 'Doğrulama',
};

const LANGUAGE_LABELS: Record<string, string> = {
  tr: 'Türkçe',
  en: 'İngilizce',
};

function formatCreatedAt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderPreviewBody(body: string): string {
  // Önizleme için {{1}} {{2}} placeholder'larını [1] [2] olarak göster.
  return body.replace(/\{\{(\d+)\}\}/g, '[$1]');
}

export default function WhatsAppTemplatesPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [numbers, setNumbers] = useState<NumberRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const [previewTemplate, setPreviewTemplate] = useState<TemplateRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TemplateRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [syncOpen, setSyncOpen] = useState(false);
  const [syncPhoneId, setSyncPhoneId] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsFetching(true);
    setLoadError(null);
    try {
      const token = await user.getIdToken();
      const [tplRes, numRes] = await Promise.all([
        fetch('/api/ngo-admin/whatsapp-business/templates', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch('/api/ngo-admin/whatsapp-business/numbers', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
      ]);
      const tplJson = (await tplRes.json().catch(() => null)) as
        | { templates?: TemplateRow[] }
        | ApiError
        | null;
      const numJson = (await numRes.json().catch(() => null)) as
        | { numbers?: NumberRow[] }
        | ApiError
        | null;
      if (!tplRes.ok || !tplJson || !('templates' in tplJson) || !Array.isArray(tplJson.templates)) {
        const err = tplJson as ApiError | null;
        throw new Error(err?.message || 'Şablonlar yüklenemedi.');
      }
      if (!numRes.ok || !numJson || !('numbers' in numJson) || !Array.isArray(numJson.numbers)) {
        const err = numJson as ApiError | null;
        throw new Error(err?.message || 'Numaralar yüklenemedi.');
      }
      setTemplates(tplJson.templates);
      setNumbers(numJson.numbers);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Beklenmeyen hata.');
    } finally {
      setIsFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void fetchData();
    }
  }, [user, fetchData]);

  const handleDelete = async () => {
    if (!user || !pendingDelete) return;
    setIsDeleting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/ngo-admin/whatsapp-business/templates/${encodeURIComponent(pendingDelete.id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; metaSkipped?: boolean }
        | ApiError
        | null;
      if (!res.ok || !payload || !('ok' in payload) || !payload.ok) {
        const err = payload as ApiError | null;
        throw new Error(err?.message || 'Şablon silinemedi.');
      }
      toast({
        title: 'Şablon silindi',
        description: `"${pendingDelete.name}" kaldırıldı.`,
      });
      setPendingDelete(null);
      void fetchData();
    } catch (e) {
      toast({
        title: 'Silme başarısız',
        description: e instanceof Error ? e.message : 'Beklenmeyen hata.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSync = async () => {
    if (!user || !syncPhoneId) {
      toast({
        title: 'Numara seçilmedi',
        description: 'Sync için bir WABA numarası seçin.',
        variant: 'destructive',
      });
      return;
    }
    setIsSyncing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/whatsapp-business/templates/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wabaPhoneNumberId: syncPhoneId }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { synced?: number; added?: number; updated?: number }
        | ApiError
        | null;
      if (!res.ok || !payload || !('synced' in payload)) {
        const err = payload as ApiError | null;
        throw new Error(err?.message || 'Meta sync başarısız.');
      }
      toast({
        title: 'Meta sync tamamlandı',
        description: `${payload.synced ?? 0} şablon işlendi (${payload.added ?? 0} yeni, ${payload.updated ?? 0} güncellendi).`,
      });
      setSyncOpen(false);
      setSyncPhoneId('');
      void fetchData();
    } catch (e) {
      toast({
        title: 'Sync başarısız',
        description: e instanceof Error ? e.message : 'Beklenmeyen hata.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const visibleTemplates = useMemo(() => templates ?? [], [templates]);
  const activeNumbers = useMemo(
    () => (numbers ?? []).filter((n) => n.status === 'active'),
    [numbers],
  );

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Oturum gerekli</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              WhatsApp şablonlarını görmek için oturum açın.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6">
      <div className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/ngo-admin">Yönetim Paneli</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/ngo-admin/whatsapp-business">WhatsApp Business</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Şablonlar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Link
          href="/ngo-admin/whatsapp-business"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> WhatsApp Business
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-emerald-600" /> Mesaj Şablonları
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Meta onaylı şablonlar 24 saatlik konuşma penceresi dışında da gönderilebilir.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              onClick={() => setSyncOpen(true)}
              disabled={activeNumbers.length === 0}
            >
              <RefreshCcw className="h-4 w-4 mr-1" /> Meta&apos;dan Sync
            </Button>
            <Button asChild>
              <Link href="/ngo-admin/whatsapp-business/templates/new">
                <Plus className="h-4 w-4 mr-1" /> Yeni Şablon
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {isFetching && templates === null && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {loadError && (
        <Card className="border-rose-300 bg-rose-50/40">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <CardTitle className="text-base">Şablonlar yüklenemedi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{loadError}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchData()}>
              Tekrar dene
            </Button>
          </CardContent>
        </Card>
      )}

      {templates !== null && templates.length === 0 && !loadError && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/60 mb-3" />
            <p className="text-base font-medium">Henüz şablonunuz yok</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              WhatsApp Business&apos;te konuşma penceresi dışına mesaj göndermek için
              Meta onaylı şablonlara ihtiyacınız var.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <Button asChild>
                <Link href="/ngo-admin/whatsapp-business/templates/new">
                  <Plus className="h-4 w-4 mr-1" /> İlk Şablonu Oluştur
                </Link>
              </Button>
              {activeNumbers.length > 0 && (
                <Button variant="outline" onClick={() => setSyncOpen(true)}>
                  <RefreshCcw className="h-4 w-4 mr-1" /> Meta&apos;dan Sync
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {visibleTemplates.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Dil</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                  <TableHead className="text-right">Aksiyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTemplates.map((t) => {
                  const status = STATUS_LABELS[t.status] ?? { label: t.status, variant: 'secondary' as const };
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium break-all">{t.name}</TableCell>
                      <TableCell>{CATEGORY_LABELS[t.category] ?? t.category}</TableCell>
                      <TableCell>{LANGUAGE_LABELS[t.language] ?? t.language}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                        {t.status === 'rejected' && t.rejectionReason && (
                          <p className="text-xs text-rose-700 mt-1 max-w-xs line-clamp-2">
                            {t.rejectionReason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatCreatedAt(t.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewTemplate(t)}
                            aria-label="Önizle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingDelete(t)}
                            aria-label="Sil"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ---- Önizleme Dialog ---- */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Şablon Önizlemesi</DialogTitle>
            <DialogDescription>
              {previewTemplate ? (
                <span className="font-mono text-xs">{previewTemplate.name}</span>
              ) : (
                'Şablon önizlemesi'
              )}
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                {previewTemplate.headerText && (
                  <p className="font-semibold text-sm text-emerald-950">
                    {previewTemplate.headerText}
                  </p>
                )}
                <p className="text-sm text-emerald-950 whitespace-pre-wrap">
                  {renderPreviewBody(previewTemplate.bodyText)}
                </p>
                {previewTemplate.footerText && (
                  <p className="text-xs text-emerald-800/80">
                    {previewTemplate.footerText}
                  </p>
                )}
                {previewTemplate.buttons.length > 0 && (
                  <div className="mt-2 space-y-1 pt-2 border-t border-emerald-200">
                    {previewTemplate.buttons.map((b, i) => (
                      <div
                        key={i}
                        className="text-center text-sm text-emerald-700 py-1.5 bg-white rounded-md border border-emerald-200"
                      >
                        {b.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {previewTemplate.variables.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Değişkenler:</p>
                  <ul className="list-disc ml-4 space-y-0.5">
                    {previewTemplate.variables.map((v, i) => (
                      <li key={i}>
                        <span className="font-mono">{`{{${i + 1}}}`}</span> → {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setPreviewTemplate(null)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Sil Confirm Dialog ---- */}
      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Şablonu sil</DialogTitle>
            <DialogDescription>
              {pendingDelete ? (
                <>
                  <span className="font-mono">{pendingDelete.name}</span> şablonu{' '}
                  {pendingDelete.status === 'draft'
                    ? 'sadece hangel\'den silinecek.'
                    : 'hem Meta\'dan hem hangel\'den silinecek.'}{' '}
                  Bu işlem geri alınamaz.
                </>
              ) : (
                'Şablon silinecek.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={isDeleting}
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" /> Siliniyor
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" /> Sil
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Sync Dialog ---- */}
      <Dialog
        open={syncOpen}
        onOpenChange={(open) => {
          if (!isSyncing) {
            setSyncOpen(open);
            if (!open) setSyncPhoneId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Meta&apos;dan Şablon Sync</DialogTitle>
            <DialogDescription>
              Seçtiğiniz numaraya bağlı tüm şablonlar Meta&apos;dan çekilir, hangel
              ile eşleştirilir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>WABA Numarası</Label>
              <Select value={syncPhoneId} onValueChange={setSyncPhoneId} disabled={isSyncing}>
                <SelectTrigger>
                  <SelectValue placeholder="Numara seçin" />
                </SelectTrigger>
                <SelectContent>
                  {activeNumbers.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.displayName} ({n.phoneNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setSyncOpen(false)}
              disabled={isSyncing}
            >
              Vazgeç
            </Button>
            <Button onClick={handleSync} disabled={isSyncing || !syncPhoneId}>
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" /> Sync...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4 mr-1" /> Sync Başlat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
