'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VenueManager } from '@/app/ngo-admin/events/_components/venue-manager';
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
  date?: string;
  startDate?: string;
  location?: { type?: string; address?: string; city?: string; district?: string };
  description?: string;
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
  type: string;
  description: string;
  startDate: string;
  locationType: string;
  city: string;
  district: string;
  address: string;
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

  return (
    <Card className="rounded-2xl border-black/5 hover:shadow-md transition-all">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Avatar className="h-14 w-14 border shadow-sm shrink-0 rounded-2xl">
          <AvatarImage src={cover} alt={title} />
          <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
            <Calendar className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-foreground truncate">{title}</p>
            <StatusBadge status={event.status} />
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            <span className="font-semibold">{organizer}</span>
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
    name: '',
    organizer: '',
    type: '',
    description: '',
    startDate: '',
    locationType: 'Fiziksel',
    city: '',
    district: '',
    address: '',
  });

  // Re-seed the form whenever a new event is opened for editing.
  React.useEffect(() => {
    if (event && open) {
      setForm({
        name: event.name ?? '',
        organizer: event.organizer ?? '',
        type: event.type ?? '',
        description: event.description ?? '',
        startDate: event.startDate ?? event.date ?? '',
        locationType: event.location?.type ?? 'Fiziksel',
        city: event.location?.city ?? '',
        district: event.location?.district ?? '',
        address: event.location?.address ?? '',
      });
    }
  }, [event, open]);

  if (!event) return null;

  const set = (key: keyof EventEditForm, value: string) =>
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
            <Label htmlFor="event-description" className="font-semibold">Açıklama</Label>
            <Textarea
              id="event-description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Etkinlik açıklaması"
              rows={4}
            />
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
      await updateDoc(doc(db, COLLECTIONS.events, id), {
        name: form.name.trim(),
        organizer: form.organizer.trim(),
        type: form.type.trim(),
        description: form.description.trim(),
        startDate: form.startDate.trim(),
        date: form.startDate.trim(),
        'location.type': form.locationType,
        'location.city': form.city.trim(),
        'location.district': form.district.trim(),
        'location.address': form.address.trim(),
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
                {editButton(event)}
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
                {editButton(event)}
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
