'use client';

/**
 * CallLists — STK çağrı merkezi arama listeleri yönetimi (önceden /call-center/lists sayfası).
 *
 * Hem /ngo-admin/call-center/lists route'unda (deep-link/kuyruk linkleri) hem de
 * /ngo-admin/call-center "Arama Listeleri" sekmesinde render edilir.
 *
 * API'ler:
 *   - GET    /api/ngo-admin/call-center/lists           → liste kartları
 *   - POST   /api/ngo-admin/call-center/lists/upload    → yeni liste (multipart)
 *   - DELETE /api/ngo-admin/call-center/lists/[id]      → soft archive
 *
 * KVKK: yalnızca caller'ın tenant'ı (managedNgoId) görünür/yönetilir. ngoId prop'u
 * opsiyoneldir; verilmezse mevcut davranış korunur (API auth managedNgoId'ye düşer).
 * Kayıt sayıları santralContactLists.totalContacts üzerinden okunur.
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  Upload,
  UploadCloud,
  Users,
} from 'lucide-react';

interface ListRow {
  id: string;
  name: string;
  description: string;
  totalContacts: number;
  importedAt: string | null;
  status: string;
}

interface InvalidSample {
  row: number;
  reason: string;
}

interface UploadResult {
  listId: string;
  total: number;
  valid: number;
  invalid: number;
  sampleInvalid: InvalidSample[];
}

interface ApiError {
  errorCode?: string;
  message?: string;
}

interface WhatsAppTemplateRow {
  id: string;
  name: string;
  language: string;
  bodyText: string;
  variables: string[];
  wabaPhoneNumberId: string;
  status: string;
}

interface WhatsAppPhoneRow {
  id: string;
  phoneNumber: string;
  displayName: string;
  status: string;
}

interface BlastResultError {
  contactId: string;
  errorCode: string;
  message: string;
}

interface BlastResult {
  sent: number;
  failed: number;
  totalProcessed: number;
  truncated: boolean;
  errors: BlastResultError[];
}

function extractTemplateVarNames(body: string): string[] {
  const m = body.match(/\{\{([^}]+)\}\}/g) ?? [];
  return m.map((x) => x.replace(/[{}]/g, '').trim()).filter(Boolean);
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function formatImportedAt(iso: string | null): string {
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

function formatCount(n: number): string {
  return n.toLocaleString('tr-TR');
}

export function CallLists({ ngoId: _ngoId }: { ngoId?: string | null } = {}) {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [lists, setLists] = useState<ListRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [listName, setListName] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const [pendingDelete, setPendingDelete] = useState<ListRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // WhatsApp blast modal state
  const [waList, setWaList] = useState<ListRow | null>(null);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplateRow[]>([]);
  const [waPhones, setWaPhones] = useState<WhatsAppPhoneRow[]>([]);
  const [waLoading, setWaLoading] = useState(false);
  const [waSelectedTemplateId, setWaSelectedTemplateId] = useState('');
  const [waSelectedPhoneId, setWaSelectedPhoneId] = useState('');
  const [waVariableValues, setWaVariableValues] = useState<Record<string, string>>({});
  const [waSending, setWaSending] = useState(false);
  const [waResult, setWaResult] = useState<BlastResult | null>(null);

  const fetchLists = useCallback(async () => {
    if (!user) return;
    setIsFetching(true);
    setLoadError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/lists', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const payload = (await res.json().catch(() => null)) as
        | { lists?: ListRow[] }
        | ApiError
        | null;
      if (!res.ok || !payload || !('lists' in payload) || !Array.isArray(payload.lists)) {
        const err = payload as ApiError | null;
        throw new Error(err?.message || 'Listeler alınamadı.');
      }
      setLists(payload.lists);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Beklenmeyen hata.');
    } finally {
      setIsFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void fetchLists();
    }
  }, [user, fetchLists]);

  const resetUploadForm = () => {
    setFile(null);
    setListName('');
    setDescription('');
    setUploadProgress(0);
    setUploadResult(null);
  };

  const handleUploadOpenChange = (open: boolean) => {
    if (isUploading) return;
    setUploadOpen(open);
    if (!open) resetUploadForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    if (picked && picked.size > MAX_UPLOAD_BYTES) {
      toast({
        title: 'Dosya çok büyük',
        description: 'En fazla 5 MB CSV/XLSX dosyası yükleyebilirsiniz.',
        variant: 'destructive',
      });
      e.target.value = '';
      setFile(null);
      return;
    }
    setFile(picked);
    if (picked && !listName.trim()) {
      // Dosya adından akıllı default — uzantı + tireleri temizle
      const base = picked.name.replace(/\.(csv|xlsx|xls)$/i, '').replace(/[-_]+/g, ' ').trim();
      if (base) setListName(base);
    }
  };

  const handleUpload = async () => {
    if (!user || !file) {
      toast({
        title: 'Eksik bilgi',
        description: 'Lütfen bir dosya seçin.',
        variant: 'destructive',
      });
      return;
    }
    const trimmedName = listName.trim();
    if (!trimmedName) {
      toast({
        title: 'Liste adı zorunlu',
        description: 'Listeyi tanımak için bir ad yazın.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('listName', trimmedName);
      if (description.trim()) formData.append('description', description.trim());

      const result = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/ngo-admin/call-center/lists/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            // Yükleme %0–%90 arası; sunucu işleme payı son %10
            const pct = Math.min(90, Math.round((ev.loaded / ev.total) * 90));
            setUploadProgress(pct);
          }
        };

        xhr.onload = () => {
          setUploadProgress(100);
          let parsed: unknown;
          try {
            parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
          } catch {
            parsed = null;
          }
          if (xhr.status >= 200 && xhr.status < 300 && parsed && typeof parsed === 'object') {
            resolve(parsed as UploadResult);
          } else {
            const err = parsed as ApiError | null;
            reject(new Error(err?.message || `Yükleme başarısız (HTTP ${xhr.status}).`));
          }
        };
        xhr.onerror = () => reject(new Error('Ağ hatası. Tekrar deneyin.'));
        xhr.onabort = () => reject(new Error('Yükleme iptal edildi.'));
        xhr.send(formData);
      });

      setUploadResult(result);
      toast({
        title: 'Liste yüklendi',
        description: `${formatCount(result.valid)} kişi kaydedildi${
          result.invalid > 0 ? ` (${formatCount(result.invalid)} geçersiz)` : ''
        }.`,
      });
      // Listeyi yenile ama dialog'u sample göstermek için açık bırak.
      void fetchLists();
    } catch (e) {
      toast({
        title: 'Yükleme başarısız',
        description: e instanceof Error ? e.message : 'Beklenmeyen hata.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !pendingDelete) return;
    setIsDeleting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/ngo-admin/call-center/lists/${encodeURIComponent(pendingDelete.id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean }
        | ApiError
        | null;
      if (!res.ok || !payload || !('ok' in payload) || !payload.ok) {
        const err = payload as ApiError | null;
        throw new Error(err?.message || 'Liste silinemedi.');
      }
      toast({
        title: 'Liste silindi',
        description: `"${pendingDelete.name}" arşivlendi.`,
      });
      setPendingDelete(null);
      void fetchLists();
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

  const visibleLists = useMemo(() => lists ?? [], [lists]);

  const openWhatsAppBlast = useCallback(
    async (list: ListRow) => {
      if (!user) return;
      setWaList(list);
      setWaResult(null);
      setWaSelectedTemplateId('');
      setWaSelectedPhoneId('');
      setWaVariableValues({});
      setWaLoading(true);
      try {
        const token = await user.getIdToken();
        const [tplRes, phoneRes] = await Promise.all([
          fetch('/api/ngo-admin/whatsapp-business/templates?status=approved', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }),
          fetch('/api/ngo-admin/whatsapp-business/numbers', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }),
        ]);
        const tplPayload = (await tplRes.json().catch(() => null)) as {
          templates?: WhatsAppTemplateRow[];
        } | null;
        const phonePayload = (await phoneRes.json().catch(() => null)) as {
          numbers?: WhatsAppPhoneRow[];
        } | null;
        setWaTemplates(tplPayload?.templates ?? []);
        const activePhones = (phonePayload?.numbers ?? []).filter(
          (p) => p.status === 'active',
        );
        setWaPhones(activePhones);
        if (activePhones.length === 1) setWaSelectedPhoneId(activePhones[0].id);
      } catch {
        setWaTemplates([]);
        setWaPhones([]);
      } finally {
        setWaLoading(false);
      }
    },
    [user],
  );

  const selectedWaTemplate = useMemo(
    () => waTemplates.find((t) => t.id === waSelectedTemplateId) ?? null,
    [waTemplates, waSelectedTemplateId],
  );

  useEffect(() => {
    if (!selectedWaTemplate) {
      setWaVariableValues({});
      return;
    }
    const declared = selectedWaTemplate.variables.length
      ? selectedWaTemplate.variables
      : extractTemplateVarNames(selectedWaTemplate.bodyText);
    const next: Record<string, string> = {};
    for (const v of declared) next[v] = '';
    setWaVariableValues(next);
    if (selectedWaTemplate.wabaPhoneNumberId) {
      setWaSelectedPhoneId(selectedWaTemplate.wabaPhoneNumberId);
    }
  }, [selectedWaTemplate]);

  const handleWaSend = async () => {
    if (!user || !waList) return;
    if (!waSelectedTemplateId) {
      toast({ variant: 'destructive', title: 'Şablon seçin' });
      return;
    }
    if (!waSelectedPhoneId) {
      toast({ variant: 'destructive', title: 'Numara seçin' });
      return;
    }
    setWaSending(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/ngo-admin/call-center/lists/${encodeURIComponent(waList.id)}/whatsapp-blast`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            templateId: waSelectedTemplateId,
            wabaPhoneNumberId: waSelectedPhoneId,
            variables: waVariableValues,
          }),
        },
      );
      const payload = (await res.json().catch(() => null)) as
        | (BlastResult & { ok?: boolean })
        | ApiError
        | null;
      if (!res.ok || !payload || 'errorCode' in (payload ?? {})) {
        const err = payload as ApiError | null;
        throw new Error(err?.message || 'Gönderim başarısız.');
      }
      const result = payload as BlastResult;
      setWaResult(result);
      toast({
        title: 'Gönderim tamam',
        description: `${result.sent} mesaj gönderildi${
          result.failed > 0 ? ` · ${result.failed} başarısız` : ''
        }.`,
      });
    } catch (e) {
      toast({
        title: 'Gönderilemedi',
        description: e instanceof Error ? e.message : 'Beklenmeyen hata.',
        variant: 'destructive',
      });
    } finally {
      setWaSending(false);
    }
  };

  const closeWaModal = (open: boolean) => {
    if (waSending) return;
    if (!open) {
      setWaList(null);
      setWaResult(null);
      setWaSelectedTemplateId('');
      setWaSelectedPhoneId('');
      setWaVariableValues({});
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Oturum gerekli</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Arama listelerini görmek için oturum açın.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">
            CSV veya Excel dosyasından kişi listesi yükleyin, kampanyalarda
            kullanın.
          </p>
        </div>
        <Button
          onClick={() => setUploadOpen(true)}
          className="self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 mr-1" /> Yeni Liste Yükle
        </Button>
      </div>

      {isFetching && lists === null && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {loadError && (
        <Card className="border-rose-300 bg-rose-50/40">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <CardTitle className="text-base">Listeler yüklenemedi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{loadError}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchLists()}>
              Tekrar dene
            </Button>
          </CardContent>
        </Card>
      )}

      {lists !== null && lists.length === 0 && !loadError && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UploadCloud className="h-10 w-10 text-muted-foreground/60 mb-3" />
            <p className="text-base font-medium">Henüz arama listeniz yok</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              CSV veya Excel dosyanızdaki telefon numaralarını yükleyerek ilk
              arama listenizi oluşturun.
            </p>
            <Button className="mt-4" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> İlk Listeyi Yükle
            </Button>
          </CardContent>
        </Card>
      )}

      {visibleLists.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleLists.map((list) => (
            <Card key={list.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold leading-tight break-words">
                  {list.name || 'İsimsiz liste'}
                </CardTitle>
                {list.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {list.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {formatCount(list.totalContacts)} kişi
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatImportedAt(list.importedAt)}
                  </span>
                </div>
                <div className="mt-auto flex flex-col gap-2 pt-2">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link
                        href={`/ngo-admin/call-center/contacts?listId=${encodeURIComponent(list.id)}`}
                      >
                        Kişileri Gör
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete(list)}
                      aria-label="Listeyi sil"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void openWhatsAppBlast(list)}
                    className="w-full border-emerald-200 bg-emerald-50/40 text-emerald-800 hover:bg-emerald-100"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp Gönder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ---- Yükleme Dialog ---- */}
      <Dialog open={uploadOpen} onOpenChange={handleUploadOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Arama Listesi</DialogTitle>
            <DialogDescription>
              CSV veya Excel (.xlsx) dosyası yükleyin. Telefon kolonu zorunlu;
              numaralar otomatik +90 formatına çevrilir. En fazla 5 MB.
            </DialogDescription>
          </DialogHeader>

          {uploadResult ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm">
                <p className="font-medium text-emerald-800">
                  {formatCount(uploadResult.valid)} kişi yüklendi
                  {uploadResult.invalid > 0
                    ? ` (${formatCount(uploadResult.invalid)} geçersiz)`
                    : ''}
                  .
                </p>
                <p className="text-xs text-emerald-700/80 mt-1">
                  Toplam {formatCount(uploadResult.total)} satır incelendi.
                </p>
              </div>
              {uploadResult.sampleInvalid.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs space-y-1">
                  <p className="font-medium text-amber-900">
                    Geçersiz satır örnekleri:
                  </p>
                  <ul className="list-disc ml-4 text-amber-900/90 space-y-0.5">
                    {uploadResult.sampleInvalid.map((s, i) => (
                      <li key={i}>
                        Satır {s.row}: {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetUploadForm();
                  }}
                >
                  Başka liste yükle
                </Button>
                <Button onClick={() => handleUploadOpenChange(false)}>
                  Kapat
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="list-file">Dosya (CSV / XLSX)</Label>
                <Input
                  id="list-file"
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                {file && (
                  <p className="text-xs text-muted-foreground">
                    {file.name} · {(file.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-name">Liste adı</Label>
                <Input
                  id="list-name"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="Örn. 2026 Bağışçılar"
                  disabled={isUploading}
                  maxLength={120}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list-desc">Açıklama (opsiyonel)</Label>
                <Input
                  id="list-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kısa açıklama"
                  disabled={isUploading}
                  maxLength={300}
                />
              </div>

              {isUploading && (
                <div className="space-y-1.5">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Yükleniyor… {uploadProgress}%
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleUploadOpenChange(false)}
                  disabled={isUploading}
                >
                  Vazgeç
                </Button>
                <Button onClick={handleUpload} disabled={isUploading || !file}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" /> Yükleniyor
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" /> Yükle
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---- WhatsApp Blast Dialog ---- */}
      <Dialog open={!!waList} onOpenChange={closeWaModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              WhatsApp Gönder
            </DialogTitle>
            <DialogDescription>
              {waList && (
                <>
                  <span className="font-medium">{waList.name}</span> listesindeki{' '}
                  {formatCount(waList.totalContacts)} kişiye onaylı bir şablon
                  gönderin.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {waResult ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm">
                <p className="font-medium text-emerald-800">
                  {formatCount(waResult.sent)} mesaj gönderildi
                  {waResult.failed > 0
                    ? ` · ${formatCount(waResult.failed)} başarısız`
                    : ''}
                  .
                </p>
                <p className="text-xs text-emerald-700/80 mt-1">
                  Toplam {formatCount(waResult.totalProcessed)} kişi işlendi
                  {waResult.truncated ? ' (üst sınıra ulaşıldı).' : '.'}
                </p>
              </div>
              {waResult.errors.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs space-y-1 max-h-32 overflow-y-auto">
                  <p className="font-medium text-amber-900">
                    Hata örnekleri:
                  </p>
                  <ul className="list-disc ml-4 text-amber-900/90 space-y-0.5">
                    {waResult.errors.slice(0, 5).map((e, i) => (
                      <li key={i}>{e.errorCode}: {e.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => closeWaModal(false)}>Kapat</Button>
              </DialogFooter>
            </div>
          ) : waLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : waPhones.length === 0 ? (
            <div className="text-sm text-muted-foreground border rounded p-3">
              Aktif WABA numarası yok.{' '}
              <Link
                href="/ngo-admin/whatsapp-business"
                className="text-emerald-700 underline"
              >
                Numara ekleyin
              </Link>
              .
            </div>
          ) : waTemplates.length === 0 ? (
            <div className="text-sm text-muted-foreground border rounded p-3">
              Meta onayından geçmiş şablon yok.{' '}
              <Link
                href="/ngo-admin/whatsapp-business/templates"
                className="text-emerald-700 underline"
              >
                Şablon oluşturun
              </Link>
              .
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="wa-blast-phone">Gönderen Numara</Label>
                <select
                  id="wa-blast-phone"
                  value={waSelectedPhoneId}
                  onChange={(e) => setWaSelectedPhoneId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border bg-white text-sm"
                >
                  <option value="">Numara seçin…</option>
                  {waPhones.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName || p.phoneNumber} ({p.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wa-blast-template">Şablon</Label>
                <select
                  id="wa-blast-template"
                  value={waSelectedTemplateId}
                  onChange={(e) => setWaSelectedTemplateId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border bg-white text-sm"
                >
                  <option value="">Şablon seçin…</option>
                  {waTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.language})
                    </option>
                  ))}
                </select>
              </div>

              {selectedWaTemplate && (
                <>
                  <div className="rounded-md border bg-slate-50 p-3 text-xs whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {selectedWaTemplate.bodyText}
                  </div>

                  {Object.keys(waVariableValues).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Değişkenler (tüm kişilere aynı değer)
                      </Label>
                      {Object.keys(waVariableValues).map((varName) => (
                        <div key={varName} className="space-y-1">
                          <Label
                            htmlFor={`wa-blast-var-${varName}`}
                            className="text-xs text-muted-foreground"
                          >
                            {varName}
                          </Label>
                          <Input
                            id={`wa-blast-var-${varName}`}
                            value={waVariableValues[varName] ?? ''}
                            onChange={(e) =>
                              setWaVariableValues((prev) => ({
                                ...prev,
                                [varName]: e.target.value,
                              }))
                            }
                            placeholder={`{{${varName}}}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => closeWaModal(false)}
                  disabled={waSending}
                >
                  Vazgeç
                </Button>
                <Button
                  onClick={handleWaSend}
                  disabled={waSending || !waSelectedTemplateId || !waSelectedPhoneId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {waSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Gönderiliyor
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" /> Onayla &amp; Gönder
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---- Silme Confirm Dialog ---- */}
      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Listeyi sil</DialogTitle>
            <DialogDescription>
              {pendingDelete ? (
                <>
                  <span className="font-medium">{pendingDelete.name}</span>{' '}
                  listesi arşivlenecek ve arama kampanyalarında artık
                  görünmeyecek. Geçmiş çağrı kayıtları korunur.
                </>
              ) : (
                'Liste arşivlenecek.'
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
    </div>
  );
}
