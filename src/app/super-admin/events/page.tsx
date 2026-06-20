'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VenueManager } from '@/app/ngo-admin/events/_components/venue-manager';
import { EventAttendees } from '@/components/events/event-attendees';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { EventAttendanceButton } from '@/components/events/event-attendance-button';
import type { EventContributor } from '@/lib/types';
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Inbox,
  Calendar,
  MapPin,
  Hourglass,
  Trash2,
  Edit3,
  Power,
  PowerOff,
} from 'lucide-react';
import { COLLECTIONS } from '@/firebase/collections';
import { fireOrgLifecycle } from '@/lib/org-lifecycle-client';
import { isLiveEvent } from '@/lib/event-time';
import Link from 'next/link';

type EventStatus = 'Beklemede' | 'Yayında' | 'Reddedildi' | 'Aktif' | 'Pasif';

interface EventDoc {
  id: string;
  name?: string;
  slug?: string;
  organizer?: string;
  organizerId?: string;
  organizerKind?: string;
  organizerLogoUrl?: string;
  organizerAvatarUrl?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  type?: string;
  tags?: string[];
  language?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  time?: string;
  capacity?: { current?: number; max?: number };
  participationCondition?: string;
  providesCertificate?: boolean;
  location?: { type?: string; address?: string; city?: string; district?: string; neighborhood?: string };
  description?: string;
  contributors?: EventContributor[];
  status?: EventStatus;
  createdAt?: number;
  createdBy?: string | null;
  approvedAt?: unknown;
  approvedBy?: string | null;
  rejectedAt?: unknown;
  rejectionReason?: string;
}

interface EventEditForm {
  name: string;
  organizer: string;
  organizerLogoUrl: string;
  imageUrl: string;
  type: string;
  tags: string; // virgülle ayrık
  language: string;
  startDate: string;
  endDate: string;
  time: string;
  capacityMax: string;
  participationCondition: string;
  providesCertificate: boolean;
  status: EventStatus;
  locationType: string;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  description: string;
  contributors: EventContributor[];
}

function StatusBadge({ status }: { status?: EventStatus }) {
  const s = status || 'Beklemede';
  if (s === 'Beklemede') {
    return (
      <Badge
        variant="outline"
        className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold uppercase tracking-wider"
      >
        <Hourglass className="mr-1 h-3 w-3" /> Onay Bekliyor
      </Badge>
    );
  }
  if (s === 'Reddedildi') {
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase tracking-wider"
      >
        <XCircle className="mr-1 h-3 w-3" /> Reddedildi
      </Badge>
    );
  }
  if (s === 'Pasif') {
    return (
      <Badge
        variant="outline"
        className="bg-slate-100 text-slate-600 border-slate-300 text-[10px] font-bold uppercase tracking-wider"
      >
        <PowerOff className="mr-1 h-3 w-3" /> Pasif
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-green-50 text-green-700 border-green-200 text-[10px] font-bold uppercase tracking-wider"
    >
      <CheckCircle2 className="mr-1 h-3 w-3" /> Yayında
    </Badge>
  );
}

function formatDate(d?: string): string {
  if (!d) return '—';
  return d;
}

function EventRow({
  event,
  children,
}: {
  event: EventDoc;
  children?: React.ReactNode;
}) {
  const title = event.name || 'Adsız etkinlik';
  const organizer = event.organizer || 'Bilinmeyen Kulüp';
  const city = event.location?.city || '';
  const district = event.location?.district || '';
  const address = event.location?.address || '';
  const date = formatDate(event.date || event.startDate);
  const cover = event.coverImageUrl || event.imageUrl || event.organizerLogoUrl;
  const orgLogo = event.organizerLogoUrl || event.organizerAvatarUrl;
  const live = isLiveEvent(event);
  const detailHref = `/events/${event.slug || event.id}`;

  return (
    <Card className="rounded-2xl border-black/5 hover:shadow-md transition-all">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href={detailHref} target="_blank" rel="noopener noreferrer" className="shrink-0" title="Etkinlik sayfasını aç">
          <Avatar className="h-14 w-14 border shadow-sm rounded-2xl">
            <AvatarImage src={cover} alt={title} />
            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
              <Calendar className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={detailHref} target="_blank" rel="noopener noreferrer" className="font-bold text-foreground truncate hover:text-primary hover:underline">
              {title}
            </Link>
            {live && (
              <Badge className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Canlı
              </Badge>
            )}
            <StatusBadge status={event.status} />
          </div>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Avatar className="h-5 w-5 border shrink-0">
              <AvatarImage src={orgLogo} alt={organizer} />
              <AvatarFallback className="text-[8px] font-bold bg-muted">{(organizer || '?').charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold truncate">{organizer}</span>
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {date}
            </span>
            {(city || district) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[district, city].filter(Boolean).join(', ')}
              </span>
            )}
          </p>
          {event.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{event.description}</p>
          )}
          {address && (
            <p className="text-[10px] text-muted-foreground/80 italic truncate">{address}</p>
          )}
          {event.rejectionReason && event.status === 'Reddedildi' && (
            <p className="text-[11px] text-red-600 font-medium pt-1">
              Red gerekçesi: {event.rejectionReason}
            </p>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto sm:flex-col md:flex-row">{children}</div>
      </CardContent>
    </Card>
  );
}

function EditEventDialog({
  event,
  open,
  onOpenChange,
  onSave,
  saving,
}: {
  event: EventDoc | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, form: EventEditForm) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<EventEditForm>({
    name: '', organizer: '', organizerLogoUrl: '', imageUrl: '', type: '', tags: '', language: '',
    startDate: '', endDate: '', time: '', capacityMax: '', participationCondition: 'Herkese Açık',
    providesCertificate: false, status: 'Beklemede', locationType: 'Fiziksel', city: '', district: '',
    neighborhood: '', address: '', description: '', contributors: [],
  });

  // Re-seed the form whenever a new event is opened for editing.
  React.useEffect(() => {
    if (event && open) {
      setForm({
        name: event.name ?? '',
        organizer: event.organizer ?? '',
        organizerLogoUrl: event.organizerLogoUrl ?? event.organizerAvatarUrl ?? '',
        imageUrl: event.imageUrl ?? event.coverImageUrl ?? '',
        type: event.type ?? '',
        tags: Array.isArray(event.tags) ? event.tags.join(', ') : '',
        language: event.language ?? '',
        startDate: event.startDate ?? event.date ?? '',
        endDate: event.endDate ?? '',
        time: event.time ?? '',
        capacityMax: event.capacity?.max != null ? String(event.capacity.max) : '',
        participationCondition: event.participationCondition ?? 'Herkese Açık',
        providesCertificate: !!event.providesCertificate,
        status: event.status ?? 'Beklemede',
        locationType: event.location?.type ?? 'Fiziksel',
        city: event.location?.city ?? '',
        district: event.location?.district ?? '',
        neighborhood: event.location?.neighborhood ?? '',
        address: event.location?.address ?? '',
        description: event.description ?? '',
        contributors: Array.isArray(event.contributors) ? event.contributors : [],
      });
    }
  }, [event, open]);

  if (!event) return null;

  const set = <K extends keyof EventEditForm>(key: K, value: EventEditForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Etkinliği Düzenle</DialogTitle>
          <DialogDescription className="font-medium">
            Etkinlik bilgilerini güncelleyin. Değişiklikler kaydedildiğinde anında yayınlanır.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="event-name" className="font-semibold">Başlık</Label>
            <Input
              id="event-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Etkinlik adı"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-organizer" className="font-semibold">Düzenleyen</Label>
            <Input
              id="event-organizer"
              value={form.organizer}
              onChange={(e) => set('organizer', e.target.value)}
              placeholder="Kulüp / kurum adı"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-type" className="font-semibold">Kategori</Label>
            <Input
              id="event-type"
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              placeholder="Örn. Seminer, Atölye"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-date" className="font-semibold">Tarih ve Saat</Label>
            <Input
              id="event-date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              placeholder="YYYY-MM-DD HH:mm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-location-type" className="font-semibold">Konum Türü</Label>
            <Select value={form.locationType} onValueChange={(v) => set('locationType', v)}>
              <SelectTrigger id="event-location-type">
                <SelectValue placeholder="Konum türü seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fiziksel">Fiziksel</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-city" className="font-semibold">Şehir</Label>
              <Input
                id="event-city"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="İstanbul"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-district" className="font-semibold">İlçe</Label>
              <Input
                id="event-district"
                value={form.district}
                onChange={(e) => set('district', e.target.value)}
                placeholder="Kadıköy"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-address" className="font-semibold">Adres</Label>
            <Input
              id="event-address"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Açık adres"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold">Mahalle</Label>
            <Input value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} placeholder="Mahalle" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-semibold">Bitiş (YYYY-MM-DD HH:mm)</Label>
              <Input value={form.endDate} onChange={(e) => set('endDate', e.target.value)} placeholder="2026-06-20 18:00" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Saat (HH:mm)</Label>
              <Input value={form.time} onChange={(e) => set('time', e.target.value)} placeholder="15:05" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-semibold">Etiketler (virgülle)</Label>
              <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="müzik, atölye" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Dil</Label>
              <Input value={form.language} onChange={(e) => set('language', e.target.value)} placeholder="Türkçe" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-semibold">Kontenjan (maks.)</Label>
              <Input type="number" value={form.capacityMax} onChange={(e) => set('capacityMax', e.target.value)} placeholder="100" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Durum</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v as EventStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beklemede">Beklemede</SelectItem>
                  <SelectItem value="Yayında">Yayında</SelectItem>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Pasif">Pasif</SelectItem>
                  <SelectItem value="Reddedildi">Reddedildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-semibold">Katılım Koşulu</Label>
              <Select value={form.participationCondition} onValueChange={(v) => set('participationCondition', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Herkese Açık">Herkese Açık</SelectItem>
                  <SelectItem value="Üyelere Özel">Üyelere Özel</SelectItem>
                  <SelectItem value="Davetli">Davetli</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Sertifika</Label>
              <Select value={form.providesCertificate ? 'evet' : 'hayir'} onValueChange={(v) => set('providesCertificate', v === 'evet')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="evet">Veriliyor</SelectItem>
                  <SelectItem value="hayir">Verilmiyor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold">Afiş Görseli (URL)</Label>
            <Input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold">Düzenleyen Kurum Logosu (URL)</Label>
            <Input value={form.organizerLogoUrl} onChange={(e) => set('organizerLogoUrl', e.target.value)} placeholder="https://…" />
          </div>
          {(form.imageUrl || form.organizerLogoUrl) && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {form.imageUrl && <img src={form.imageUrl} alt="afiş" className="h-16 w-16 rounded-lg object-cover border" />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {form.organizerLogoUrl && <img src={form.organizerLogoUrl} alt="logo" className="h-16 w-16 rounded-full object-cover border bg-white" />}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="event-description" className="font-semibold">Açıklama</Label>
            <Textarea
              id="event-description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Etkinlik açıklaması"
              rows={4}
            />
          </div>
          {/* Konuşmacılar / ekip — canlı mod + sertifika + yaka kartına yansır */}
          <div className="space-y-2">
            <Label className="font-semibold">Konuşmacılar / Ekip</Label>
            {form.contributors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Ad Soyad"
                  value={c.name ?? ''}
                  onChange={(e) => set('contributors', form.contributors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                />
                <Input
                  placeholder="Ünvan (ör. Prof. Dr.)"
                  value={c.title ?? ''}
                  onChange={(e) => set('contributors', form.contributors.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                />
                <Button type="button" variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => set('contributors', form.contributors.filter((_, j) => j !== i))}>
                  Sil
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="rounded-xl font-bold"
              onClick={() => set('contributors', [...form.contributors, { name: '', title: '', role: 'speaker' }])}>
              + Konuşmacı ekle
            </Button>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-xl font-bold"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Vazgeç
          </Button>
          <Button
            className="rounded-xl font-bold"
            onClick={() => onSave(event.id, form)}
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SuperAdminEventsPage() {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventDoc | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // orderBy('createdAt') koymuyoruz — createdAt alanı eksik eski etkinlikler
  // sessizce listeden düşüyordu. Tüm koleksiyon çekilir, client-side sıralanır.
  const eventsQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.events)) : null),
    [db],
  );
  const { data: events, isLoading } = useCollection<EventDoc>(eventsQuery);

  const grouped = useMemo(() => {
    const list = ((events || []) as EventDoc[]).slice().sort((a, b) => {
      // createdAt varsa (Firestore Timestamp), descending — yoksa en sona koy
      const aT = (a as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0;
      const bT = (b as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0;
      return bT - aT;
    });
    // /events sayfası `Beklemede / Pasif / Reddedildi` dışındaki tüm
    // statusleri (Yayında, Aktif, Onaylandı, eski/bilinmeyen değerler dahil)
    // herkese gösterir. Super-admin'in görünümü de aynı kapsamı yansıtır:
    // published = NOT (pending/passive/rejected). Böylece /events'te listelenen
    // her etkinlik buradan da yönetilebilir.
    return {
      pending: list.filter((e) => (e.status || 'Beklemede') === 'Beklemede'),
      passive: list.filter((e) => e.status === 'Pasif'),
      rejected: list.filter((e) => e.status === 'Reddedildi'),
      published: list.filter((e) => {
        const s = e.status || 'Beklemede';
        return s !== 'Beklemede' && s !== 'Pasif' && s !== 'Reddedildi';
      }),
    };
  }, [events]);

  const handleApprove = async (id: string) => {
    if (!db) return;
    setBusyId(id);
    try {
      await updateDoc(doc(db, COLLECTIONS.events, id), {
        status: 'Yayında',
        approvedAt: serverTimestamp(),
        approvedBy: authUser?.uid || null,
      });

      // Etkinlik onaylandı → kulüp üyelerine bildirim (Cloud Function otomatik push atar).
      // Best-effort: hata olsa bile onay başarılı sayılır.
      try {
        const ev = (events || []).find((e) => e.id === id);
        const clubId = ev?.organizerId;
        if (clubId) {
          const membersSnap = await getDocs(
            query(collection(db, COLLECTIONS.users), where('joinedClubs', 'array-contains', clubId)),
          );
          if (!membersSnap.empty) {
            const evName = ev?.name || 'Yeni etkinlik';
            const evDate = (ev as { date?: string })?.date || '';
            let batch = writeBatch(db);
            let count = 0;
            for (const m of membersSnap.docs) {
              const notifRef = doc(collection(db, COLLECTIONS.notifications));
              batch.set(notifRef, {
                userId: m.id,
                type: 'event_created',
                title: '📅 Yeni etkinlik',
                body: `${ev?.organizer || 'Kulübün'}: "${evName}"${evDate ? ` — ${evDate}` : ''}`,
                data: { eventId: id, link: `/events/${id}` },
                read: false,
                createdAt: serverTimestamp(),
                createdBy: authUser?.uid || 'super-admin',
              });
              count += 1;
              if (count >= 450) { await batch.commit(); batch = writeBatch(db); count = 0; }
            }
            if (count > 0) await batch.commit();
          }
        }
      } catch (notifErr) {
        console.warn('[event approve] member notification failed', notifErr);
      }

      // Yaşam döngüsü: "etkinliğiniz onaylandı ve yayında" → kuruma bildirim + SMS
      try {
        const lifecycleToken = await authUser?.getIdToken();
        await fireOrgLifecycle(lifecycleToken, { kind: 'event', stage: 'approved', refId: id });
      } catch { /* best-effort */ }

      toast({ title: 'Etkinlik Onaylandı', description: 'Etkinlik yayında. Kulüp üyelerine bildirim gönderildi.' });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({
        variant: 'destructive',
        title: 'Onaylanamadı',
        description: code === 'permission-denied' ? 'Süper admin yetkisi gerekli.' : message,
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!db) return;
    setBusyId(id);
    try {
      await updateDoc(doc(db, COLLECTIONS.events, id), {
        status: 'Reddedildi',
        rejectedAt: serverTimestamp(),
        rejectionReason: 'Süper admin tarafından reddedildi.',
        approvedBy: authUser?.uid || null,
      });
      toast({
        variant: 'destructive',
        title: 'Etkinlik Reddedildi',
        description: 'Etkinlik yayına alınmadı.',
      });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({
        variant: 'destructive',
        title: 'Reddedilemedi',
        description: code === 'permission-denied' ? 'Süper admin yetkisi gerekli.' : message,
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    setBusyId(id);
    try {
      await deleteDoc(doc(db, COLLECTIONS.events, id));
      toast({ variant: 'destructive', title: 'Etkinlik Silindi' });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({
        variant: 'destructive',
        title: 'Silinemedi',
        description: code === 'permission-denied' ? 'Süper admin yetkisi gerekli.' : message,
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (id: string, currentStatus?: EventStatus) => {
    if (!db) return;
    const isPassive = currentStatus === 'Pasif';
    setBusyId(id);
    try {
      await updateDoc(doc(db, COLLECTIONS.events, id), {
        status: isPassive ? 'Yayında' : 'Pasif',
        ...(isPassive
          ? { approvedAt: serverTimestamp(), approvedBy: authUser?.uid || null }
          : {}),
      });
      toast({
        title: isPassive ? 'Etkinlik Aktifleştirildi' : 'Etkinlik Pasife Alındı',
        description: isPassive
          ? 'Etkinlik tekrar yayında ve platformda görünür.'
          : 'Etkinlik artık platformda görünmüyor.',
      });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({
        variant: 'destructive',
        title: 'İşlem başarısız',
        description: code === 'permission-denied' ? 'Süper admin yetkisi gerekli.' : message,
      });
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (event: EventDoc) => {
    setEditingEvent(event);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (id: string, form: EventEditForm) => {
    if (!db) return;
    if (!form.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Başlık gerekli',
        description: 'Etkinlik başlığı boş bırakılamaz.',
      });
      return;
    }
    setIsSaving(true);
    try {
      const startTrim = form.startDate.trim();
      const dateOnly = startTrim.split(' ')[0] || startTrim;
      const maxCap = parseInt(form.capacityMax, 10);
      await updateDoc(doc(db, COLLECTIONS.events, id), {
        name: form.name.trim(),
        organizer: form.organizer.trim(),
        organizerLogoUrl: form.organizerLogoUrl.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        type: form.type.trim(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        language: form.language.trim() || null,
        startDate: startTrim,
        date: dateOnly,
        endDate: form.endDate.trim() || null,
        time: form.time.trim() || null,
        'capacity.max': Number.isFinite(maxCap) ? maxCap : null,
        participationCondition: form.participationCondition,
        providesCertificate: form.providesCertificate,
        status: form.status,
        'location.type': form.locationType,
        'location.city': form.city.trim(),
        'location.district': form.district.trim(),
        'location.neighborhood': form.neighborhood.trim(),
        'location.address': form.address.trim(),
        description: form.description.trim(),
        contributors: form.contributors
          .map((c) => ({ name: (c.name || '').trim(), title: (c.title || '').trim(), role: c.role || 'speaker', ...(c.userId ? { userId: c.userId } : {}) }))
          .filter((c) => c.name),
      });
      toast({ title: 'Etkinlik Güncellendi', description: 'Değişiklikler kaydedildi.' });
      setIsEditOpen(false);
      setEditingEvent(null);
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({
        variant: 'destructive',
        title: 'Kaydedilemedi',
        description: code === 'permission-denied' ? 'Süper admin yetkisi gerekli.' : message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const editButton = (event: EventDoc) => (
    <Button
      size="sm"
      variant="outline"
      className="flex-1 sm:flex-grow-0 rounded-xl font-bold"
      disabled={busyId === event.id}
      onClick={() => openEdit(event)}
    >
      <Edit3 className="mr-2 h-4 w-4" /> Düzenle
    </Button>
  );

  const participantsButton = (event: EventDoc) => (
    <EventAttendanceButton
      eventId={event.id}
      eventName={event.name || 'Etkinlik'}
      authUser={authUser ?? null}
      className="flex-1 sm:flex-grow-0 rounded-xl font-bold"
    />
  );

  const deactivateButton = (event: EventDoc) => {
    const isPassive = event.status === 'Pasif';
    return (
      <Button
        size="sm"
        variant="outline"
        className="flex-1 sm:flex-grow-0 rounded-xl font-bold"
        disabled={busyId === event.id}
        onClick={() => handleToggleActive(event.id, event.status)}
      >
        {busyId === event.id ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : isPassive ? (
          <Power className="mr-2 h-4 w-4" />
        ) : (
          <PowerOff className="mr-2 h-4 w-4" />
        )}
        {isPassive ? 'Aktifleştir' : 'Pasife Al'}
      </Button>
    );
  };

  const deleteButton = (event: EventDoc) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 sm:flex-grow-0 rounded-xl font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          disabled={busyId === event.id}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Sil
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-[2rem]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">
            Etkinliği kalıcı olarak sil?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base font-medium">
            &quot;{event.name}&quot; etkinliği veritabanından silinecek. Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl font-bold bg-red-600 hover:bg-red-700"
            onClick={() => handleDelete(event.id)}
          >
            Evet, Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Etkinlikler Yükleniyor...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Etkinlik Yönetimi</h1>
        <p className="text-muted-foreground text-sm font-medium">
          Öğrenci kulüplerinin oluşturduğu etkinlikleri inceleyin, onaylayın veya reddedin.
        </p>
      </div>

      <div className="p-4 bg-primary/5 border border-primary/10 rounded-[2rem] flex items-start gap-4">
        <Calendar className="h-6 w-6 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold text-sm">Süper Admin Onay Süreci</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Yeni etkinlikler kulüpler tarafından &quot;Beklemede&quot; durumunda oluşturulur. Onayladığınız etkinlikler
            otomatik olarak &quot;Yayında&quot; durumuna geçer ve platformda görünür olur.
          </p>
        </div>
      </div>

      <Tabs defaultValue="published" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto sm:h-14 rounded-2xl bg-muted/50 p-1.5 backdrop-blur-xl gap-1.5 sm:gap-0">
          <TabsTrigger
            value="published"
            className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> Yayında ({grouped.published.length})
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            <Hourglass className="mr-2 h-4 w-4" /> Onay Bekleyenler ({grouped.pending.length})
          </TabsTrigger>
          <TabsTrigger
            value="passive"
            className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            <PowerOff className="mr-2 h-4 w-4" /> Pasif ({grouped.passive.length})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            <XCircle className="mr-2 h-4 w-4" /> Reddedilenler ({grouped.rejected.length})
          </TabsTrigger>
          <TabsTrigger
            value="venues"
            className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg"
          >
            <MapPin className="mr-2 h-4 w-4" /> Mekanlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-8 space-y-4">
          {grouped.pending.length === 0 ? (
            <div className="text-center py-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-black/5">
              <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                Onay bekleyen etkinlik bulunmuyor.
              </p>
            </div>
          ) : (
            grouped.pending.map((event) => (
              <EventRow key={event.id} event={event}>
                <EventAttendees eventId={event.id} />
                <Button
                  size="sm"
                  className="flex-1 sm:flex-grow-0 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white"
                  disabled={busyId === event.id}
                  onClick={() => handleApprove(event.id)}
                >
                  {busyId === event.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Onayla
                </Button>
                {editButton(event)}
                {participantsButton(event)}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-grow-0 rounded-xl font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      disabled={busyId === event.id}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Reddet
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[2rem]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-bold">
                        Etkinliği reddet?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-base font-medium">
                        &quot;{event.name}&quot; etkinliği reddedilecek ve yayına alınmayacak. Bu işlemi
                        daha sonra geri alabilirsiniz.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-xl font-bold bg-red-600 hover:bg-red-700"
                        onClick={() => handleReject(event.id)}
                      >
                        Evet, Reddet
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {deleteButton(event)}
              </EventRow>
            ))
          )}
        </TabsContent>

        <TabsContent value="published" className="mt-8 space-y-4">
          {grouped.published.length === 0 ? (
            <div className="text-center py-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-black/5">
              <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                Yayında olan etkinlik bulunmuyor.
              </p>
            </div>
          ) : (
            grouped.published.map((event) => (
              <EventRow key={event.id} event={event}>
                <EventAttendees eventId={event.id} />
                {editButton(event)}
                {participantsButton(event)}
                {deactivateButton(event)}
                {deleteButton(event)}
              </EventRow>
            ))
          )}
        </TabsContent>

        <TabsContent value="passive" className="mt-8 space-y-4">
          {grouped.passive.length === 0 ? (
            <div className="text-center py-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-black/5">
              <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                Pasif etkinlik bulunmuyor.
              </p>
            </div>
          ) : (
            grouped.passive.map((event) => (
              <EventRow key={event.id} event={event}>
                <EventAttendees eventId={event.id} />
                {editButton(event)}
                {participantsButton(event)}
                {deactivateButton(event)}
                {deleteButton(event)}
              </EventRow>
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-8 space-y-4">
          {grouped.rejected.length === 0 ? (
            <div className="text-center py-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-black/5">
              <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                Reddedilmiş etkinlik bulunmuyor.
              </p>
            </div>
          ) : (
            grouped.rejected.map((event) => (
              <EventRow key={event.id} event={event}>
                <EventAttendees eventId={event.id} />
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-grow-0 rounded-xl font-bold"
                  disabled={busyId === event.id}
                  onClick={() => handleApprove(event.id)}
                >
                  {busyId === event.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Yeniden Yayınla
                </Button>
                {editButton(event)}
                {participantsButton(event)}
                {deleteButton(event)}
              </EventRow>
            ))
          )}
        </TabsContent>

        <TabsContent value="venues" className="mt-8">
          <VenueManager manageable />
        </TabsContent>
      </Tabs>

      <EditEventDialog
        event={editingEvent}
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingEvent(null);
        }}
        onSave={handleSaveEdit}
        saving={isSaving}
      />
    </div>
  );
}
