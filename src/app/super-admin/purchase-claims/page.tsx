'use client';

/**
 * Bağış Talep Yönetimi — kullanıcıların "alışverişim/bağışım görünmüyor" talepleri
 * (`purchaseClaims`). Kullanıcı my-donations sayfasındaki formdan oluşturur.
 *
 * Bu sayfa:
 *   - Talepleri mağazaya (brandName) göre GRUPLU listeler.
 *   - Durum + arama ile filtreler.
 *   - Çoklu seçim (satır + grup + tümü) yapıp seçili taleplere TOPLU E-POSTA atar
 *     (gerçek gönderim: /api/messaging/campaigns, spec.inlineRecipients).
 *   - Tek tek durum günceller (open → resolved / rejected).
 *
 * Not: Bu sayfa bağışı OTOMATİK oluşturmaz — süper-admin talebi inceleyip (ör.
 * ağ panelinden dönüşümü teyit edip) kullanıcıya döner; gerçek bağış conversion
 * postback'ten düşer. Amaç: manuel "hayalet bağış" yerine denetlenebilir kayıt.
 */

import React, { useMemo, useState } from 'react';
import { HandCoins, Search, Loader2, Mail, CheckCircle2, XCircle, RotateCcw, Store, Calendar, Hash, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { collection, orderBy, query, doc, updateDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import { messagingFetch } from '@/lib/messaging/client';
import { cn } from '@/lib/utils';

interface PurchaseClaim {
  id: string;
  userId?: string;
  userName?: string | null;
  userEmail?: string | null;
  contactEmail?: string | null;
  brandName?: string | null;
  orderNumber?: string | null;
  purchaseDate?: string | null;
  amount?: string | null;
  note?: string | null;
  status?: 'open' | 'resolved' | 'rejected';
  createdAt?: Timestamp | null;
  resolvedAt?: Timestamp | null;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  open: { label: 'Açık', className: 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  resolved: { label: 'Çözüldü', className: 'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300' },
  rejected: { label: 'Reddedildi', className: 'border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

const DEFAULT_SUBJECT = 'hangel — alışveriş bağışın hakkında';
const DEFAULT_BODY =
  'Merhaba {ad},\n\n' +
  '"Alışverişim görünmüyor" talebini aldık. Alışverişini kontrol ettik ve ' +
  'en kısa sürede sonucunu seninle paylaşacağız.\n\n' +
  'İlgin ve iyiliğin için teşekkürler 🧡\n' +
  'hangel ekibi';

export default function PurchaseClaimsPage() {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Toplu mail modalı
  const [mailOpen, setMailOpen] = useState(false);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [sending, setSending] = useState(false);

  const claimsQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.purchaseClaims), orderBy('createdAt', 'desc')) : null),
    [db],
  );
  const { data: claims, isLoading } = useCollection<PurchaseClaim>(claimsQuery);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (claims || []).filter((c) => {
      const matchesStatus = statusFilter === 'all' || (c.status || 'open') === statusFilter;
      const matchesSearch =
        term === '' ||
        (c.brandName || '').toLowerCase().includes(term) ||
        (c.userName || '').toLowerCase().includes(term) ||
        (c.contactEmail || c.userEmail || '').toLowerCase().includes(term) ||
        (c.orderNumber || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [claims, statusFilter, searchTerm]);

  // Mağazaya göre grupla (brandName), grup içinde tarihe göre.
  const groups = useMemo(() => {
    const map = new Map<string, PurchaseClaim[]>();
    for (const c of filtered) {
      const key = (c.brandName || 'Diğer').trim() || 'Diğer';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const stats = useMemo(() => {
    const all = claims || [];
    return {
      total: all.length,
      open: all.filter((c) => (c.status || 'open') === 'open').length,
      resolved: all.filter((c) => c.status === 'resolved').length,
      brands: new Set(all.map((c) => (c.brandName || 'Diğer').trim())).size,
    };
  }, [claims]);

  // Seçili taleplerin geçerli alıcıları (e-posta bazında dedup; ad ilk eşleşmeden).
  const selectedRecipients = useMemo(() => {
    const map = new Map<string, { email: string; name?: string }>();
    for (const c of filtered) {
      if (!selected.has(c.id)) continue;
      const email = (c.contactEmail || c.userEmail || '').trim().toLowerCase();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) continue;
      if (!map.has(email)) map.set(email, { email, name: c.userName || undefined });
    }
    return Array.from(map.values());
  }, [filtered, selected]);
  const selectedEmails = selectedRecipients;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const toggleGroup = (rows: PurchaseClaim[]) =>
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = rows.every((r) => next.has(r.id));
      rows.forEach((r) => (allSelected ? next.delete(r.id) : next.add(r.id)));
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const allSelected = filtered.length > 0 && filtered.every((r) => prev.has(r.id));
      return allSelected ? new Set() : new Set(filtered.map((r) => r.id));
    });

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const updateStatus = async (id: string, status: 'open' | 'resolved' | 'rejected') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.purchaseClaims, id), {
        status,
        resolvedAt: status === 'open' ? null : serverTimestamp(),
        resolvedBy: status === 'open' ? null : authUser?.uid ?? null,
      });
      toast({ title: 'Güncellendi', description: `Talep "${STATUS_META[status].label}" olarak işaretlendi.` });
    } catch {
      toast({ variant: 'destructive', title: 'Hata', description: 'Durum güncellenemedi.' });
    }
  };

  const handleSendBulk = async () => {
    if (selectedEmails.length === 0) {
      toast({ variant: 'destructive', title: 'Alıcı yok', description: 'Geçerli e-postası olan en az bir talep seç.' });
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast({ variant: 'destructive', title: 'Eksik', description: 'Konu ve mesaj gerekli.' });
      return;
    }
    setSending(true);
    try {
      const bodyHtml = body.trim().replace(/\n/g, '<br>');
      await messagingFetch('/api/messaging/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: `Bağış talebi yanıtı — ${new Date().toISOString().slice(0, 10)}`,
          channel: 'email',
          useCase: 'transactional',
          subject: subject.trim(),
          body: bodyHtml,
          senderId: 'hangel',
          spec: {
            channel: 'email',
            useCase: 'transactional',
            inlineRecipients: selectedRecipients.map((r) => ({ email: r.email, name: r.name })),
          },
          scheduledAt: null,
        }),
      });
      toast({
        title: 'Gönderim başlatıldı 🧡',
        description: `${selectedEmails.length} kişiye e-posta kuyruğa alındı.`,
      });
      setMailOpen(false);
      setSelected(new Set());
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: err instanceof Error ? err.message : 'Bir sorun oluştu.' });
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold font-headline">
          <HandCoins className="h-6 w-6 text-primary" />
          Bağış Talep Yönetimi
        </h1>
        <p className="text-sm text-muted-foreground">
          Kullanıcıların &quot;alışverişim/bağışım görünmüyor&quot; talepleri. Mağazaya göre gruplu; seç, incele, toplu e-posta gönder.
        </p>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Toplam Talep', value: stats.total },
          { label: 'Açık', value: stats.open },
          { label: 'Çözüldü', value: stats.resolved },
          { label: 'Mağaza', value: stats.brands },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtre + toplu aksiyon çubuğu */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Mağaza, isim, e-posta, sipariş no ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm durumlar</SelectItem>
            <SelectItem value="open">Açık</SelectItem>
            <SelectItem value="resolved">Çözüldü</SelectItem>
            <SelectItem value="rejected">Reddedildi</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => setMailOpen(true)}
          disabled={selected.size === 0}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          Toplu E-posta ({selectedEmails.length})
        </Button>
      </div>

      {/* Tümünü seç */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} id="select-all" />
          <Label htmlFor="select-all" className="cursor-pointer text-sm text-muted-foreground">
            Tümünü seç ({filtered.length})
          </Label>
          {selected.size > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
              Seçimi temizle ({selected.size})
            </Button>
          )}
        </div>
      )}

      {/* Gruplu liste */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <HandCoins className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Bu filtreyle talep yok.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map(([brand, rows]) => {
            const groupAllSelected = rows.every((r) => selected.has(r.id));
            return (
              <Card key={brand}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 py-3">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={groupAllSelected} onCheckedChange={() => toggleGroup(rows)} />
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      {brand}
                    </CardTitle>
                    <Badge variant="secondary">{rows.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {rows.map((c) => {
                    const email = c.contactEmail || c.userEmail || '';
                    const status = c.status || 'open';
                    return (
                      <div key={c.id} className={cn('flex flex-col gap-2 p-4 sm:flex-row sm:items-start', selected.has(c.id) && 'bg-primary/5')}>
                        <Checkbox className="mt-1" checked={selected.has(c.id)} onCheckedChange={() => toggleOne(c.id)} />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 text-sm font-semibold">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {c.userName || 'İsimsiz'}
                            </span>
                            <Badge variant="outline" className={cn('text-[10px] font-bold uppercase', STATUS_META[status].className)}>
                              {STATUS_META[status].label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{email}</span>}
                            {c.orderNumber && <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{c.orderNumber}</span>}
                            {c.amount && <span>{c.amount} TL</span>}
                            {c.purchaseDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{c.purchaseDate}</span>}
                          </div>
                          {c.note && <p className="rounded-lg bg-muted/50 p-2 text-xs text-foreground/80">{c.note}</p>}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {status !== 'resolved' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" title="Çözüldü işaretle" onClick={() => updateStatus(c.id, 'resolved')}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {status !== 'rejected' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="Reddet" onClick={() => updateStatus(c.id, 'rejected')}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {status !== 'open' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Tekrar aç" onClick={() => updateStatus(c.id, 'open')}>
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Toplu mail modalı */}
      <Dialog open={mailOpen} onOpenChange={setMailOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Toplu E-posta Gönder</DialogTitle>
            <DialogDescription>
              Seçili taleplerdeki {selectedEmails.length} benzersiz e-postaya gönderilecek.
              {' '}<code className="rounded bg-muted px-1">{'{ad}'}</code> değişkeni kişinin adıyla doldurulur.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="mail-subject">Konu</Label>
              <Input id="mail-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mail-body">Mesaj</Label>
              <Textarea id="mail-body" value={body} onChange={(e) => setBody(e.target.value)} rows={9} />
            </div>
            {selectedEmails.length === 0 && (
              <p className="text-xs text-destructive">Seçili taleplerde geçerli e-posta yok.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMailOpen(false)} disabled={sending}>İptal</Button>
            <Button onClick={handleSendBulk} disabled={sending || selectedEmails.length === 0} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {selectedEmails.length} kişiye gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
