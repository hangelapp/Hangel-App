'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Landmark, Building2, Store, Building, Users, MapPin, Calendar, Plus, Pencil, Trash2,
  ExternalLink, Mail, Link2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';

interface VenueHall {
  id: string;
  name: string;
  type: string;
  fee: string;
  capacity: number;
  description?: string;
}

interface VenueDoc {
  id: string;
  name?: string;
  type?: string;
  city?: string;
  logo?: string;
  address?: string;
  hours?: string;
  iconName?: string;
  reservationType?: 'email' | 'link';
  reservationEmail?: string;
  reservationLink?: string;
  halls?: VenueHall[];
  createdBy?: string;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  landmark: Landmark,
  building: Building2,
  store: Store,
};
const iconFor = (name?: string) => ICONS[name || 'landmark'] || Landmark;

const FEE_OPTIONS = ['Ücretsiz', 'İndirimli', 'Ücretli'];
const ICON_OPTIONS = [
  { value: 'landmark', label: 'Kültür Merkezi / Salon' },
  { value: 'building', label: 'Ofis / Bina' },
  { value: 'store', label: 'Sergi / Fuaye' },
];

type HallDraft = VenueHall & { _key: string };

interface VenueDraft {
  name: string;
  type: string;
  city: string;
  address: string;
  hours: string;
  iconName: string;
  reservationType: 'email' | 'link';
  reservationEmail: string;
  reservationLink: string;
  halls: HallDraft[];
}

const emptyDraft = (): VenueDraft => ({
  name: '', type: '', city: '', address: '', hours: '', iconName: 'landmark',
  reservationType: 'email', reservationEmail: '', reservationLink: '',
  halls: [],
});

export function VenueManager({ activeEntityName }: { activeEntityName?: string }) {
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  useEffect(() => {
    if (!authUser) { setIsSuperAdmin(false); return; }
    let cancelled = false;
    authUser.getIdTokenResult()
      .then((res) => { if (!cancelled) setIsSuperAdmin((res.claims as { role?: unknown }).role === 'super-admin'); })
      .catch(() => { if (!cancelled) setIsSuperAdmin(false); });
    return () => { cancelled = true; };
  }, [authUser]);

  const venuesQ = useMemoFirebase(
    () => (firestore ? collection(firestore, COLLECTIONS.eventVenues) : null),
    [firestore],
  );
  const { data: venues, isLoading } = useCollection<VenueDoc>(venuesQ);

  const [venueDetail, setVenueDetail] = useState<{ venue: VenueDoc; hall: VenueHall } | null>(null);
  const [editTarget, setEditTarget] = useState<VenueDoc | 'new' | null>(null);
  const [draft, setDraft] = useState<VenueDraft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const hallKeyRef = useRef(1);

  const canManage = (v: VenueDoc) => isSuperAdmin || (!!authUser && v.createdBy === authUser.uid);

  const openNew = () => {
    setDraft(emptyDraft());
    setEditTarget('new');
  };

  const openEdit = (v: VenueDoc) => {
    setDraft({
      name: v.name || '', type: v.type || '', city: v.city || '', address: v.address || '',
      hours: v.hours || '', iconName: v.iconName || 'landmark',
      reservationType: v.reservationType === 'link' ? 'link' : 'email',
      reservationEmail: v.reservationEmail || '', reservationLink: v.reservationLink || '',
      halls: (v.halls || []).map((h) => ({ ...h, _key: String(hallKeyRef.current++) })),
    });
    setEditTarget(v);
  };

  const addHall = () => setDraft((d) => ({
    ...d,
    halls: [...d.halls, { _key: String(hallKeyRef.current++), id: '', name: '', type: '', fee: 'Ücretsiz', capacity: 0 }],
  }));
  const updateHall = (key: string, patch: Partial<HallDraft>) =>
    setDraft((d) => ({ ...d, halls: d.halls.map((h) => (h._key === key ? { ...h, ...patch } : h)) }));
  const removeHall = (key: string) =>
    setDraft((d) => ({ ...d, halls: d.halls.filter((h) => h._key !== key) }));

  const saveVenue = async () => {
    if (!firestore || !authUser) return;
    if (!draft.name.trim()) {
      toast({ variant: 'destructive', title: 'Mekan adı gerekli' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        type: draft.type.trim(),
        city: draft.city.trim(),
        address: draft.address.trim(),
        hours: draft.hours.trim(),
        iconName: draft.iconName,
        reservationType: draft.reservationType,
        reservationEmail: draft.reservationType === 'email' ? draft.reservationEmail.trim() : '',
        reservationLink: draft.reservationType === 'link' ? draft.reservationLink.trim() : '',
        halls: draft.halls.map((h, i) => ({
          id: h.id || `hall-${i + 1}`,
          name: h.name.trim(),
          type: h.type.trim(),
          fee: h.fee,
          capacity: Number(h.capacity) || 0,
          ...(h.description ? { description: h.description } : {}),
        })),
      };
      if (editTarget && editTarget !== 'new') {
        await updateDoc(doc(firestore, COLLECTIONS.eventVenues, editTarget.id), payload);
        toast({ title: 'Mekan güncellendi' });
      } else {
        await addDoc(collection(firestore, COLLECTIONS.eventVenues), {
          ...payload,
          createdBy: authUser.uid,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Mekan eklendi' });
      }
      setEditTarget(null);
    } catch {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: 'Yetkin yoksa bu işlem reddedilebilir.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteVenue = async (v: VenueDoc) => {
    if (!firestore) return;
    if (typeof window !== 'undefined' && !window.confirm(`"${v.name}" mekanını silmek istediğine emin misin?`)) return;
    try {
      await deleteDoc(doc(firestore, COLLECTIONS.eventVenues, v.id));
      toast({ title: 'Mekan silindi' });
    } catch {
      toast({ variant: 'destructive', title: 'Silinemedi' });
    }
  };

  const reserve = (v: VenueDoc, hall: VenueHall) => {
    if (v.reservationType === 'link' && v.reservationLink) {
      if (typeof window !== 'undefined') window.open(v.reservationLink, '_blank', 'noopener,noreferrer');
      return;
    }
    if (v.reservationEmail) {
      const subject = `Salon Rezervasyon Talebi — ${hall.name} (${v.name})`;
      const body = [
        'Merhaba,', '',
        `"${hall.name}" (${hall.type}, ${hall.capacity} kişilik) salonu için rezervasyon talep ediyoruz.`,
        '',
        `Kuruluş: ${activeEntityName || ''}`,
        'Etkinlik adı: ', 'Etkinlik tarihi / saati: ', 'Tahmini katılımcı sayısı: ', 'İletişim: ',
        '', 'Teşekkürler.',
      ].join('\n');
      if (typeof window !== 'undefined') {
        window.location.assign(`mailto:${v.reservationEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      }
      return;
    }
    toast({ title: 'Rezervasyon bilgisi yok', description: 'Bu mekan için e-posta/link tanımlı değil.' });
  };

  const sortedVenues = useMemo(() => (venues || []).slice(), [venues]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Etkinlikleriniz için mekanlar ve salonlar. Mekan ekleyebilir, düzenleyebilir, salon rezervasyonu talep edebilirsiniz.</p>
        {authUser && (
          <Button onClick={openNew} size="sm" className="shrink-0"><Plus className="h-4 w-4 mr-1.5" /> Mekan Ekle</Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Yükleniyor…</div>
      )}

      {!isLoading && sortedVenues.length === 0 && (
        <Card className="border-dashed"><CardContent className="py-10 text-center text-sm text-muted-foreground">Henüz mekan eklenmemiş. “Mekan Ekle” ile başlayın.</CardContent></Card>
      )}

      {sortedVenues.map((v) => {
        const Icon = iconFor(v.iconName);
        return (
          <Card key={v.id} className="overflow-hidden border-2 shadow-sm">
            <CardHeader className="bg-muted/30 border-b p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={v.logo} />
                    <AvatarFallback><Building className="h-6 w-6" /></AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">{v.name}</CardTitle>
                    <CardDescription className="text-xs font-bold text-primary uppercase tracking-widest truncate">{v.type || 'Mekan'}{v.city ? ` · ${v.city}` : ''}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="text-[9px] font-bold gap-1">
                    {v.reservationType === 'link' ? <><Link2 className="h-3 w-3" /> Link</> : <><Mail className="h-3 w-3" /> E-posta</>}
                  </Badge>
                  {canManage(v) && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)} aria-label="Düzenle"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteVenue(v)} aria-label="Sil"><Trash2 className="h-4 w-4" /></Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 bg-background">
              {(v.halls || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Bu mekana henüz salon eklenmemiş.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(v.halls || []).map((hall) => (
                    <Card key={hall.id} onClick={() => setVenueDetail({ venue: v, hall })} className="hover:border-primary transition-all hover:shadow-md cursor-pointer group">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                          <Badge variant="outline" className={cn('text-[10px] font-bold', hall.fee === 'Ücretsiz' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200')}>{hall.fee}</Badge>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{hall.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{hall.type}</p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {hall.capacity} kişi</span>
                          {v.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {v.city}</span>}
                        </div>
                        <Button size="sm" className="w-full text-xs h-8" onClick={(e) => { e.stopPropagation(); reserve(v, hall); }}>Rezerve Et</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Salon detay modalı */}
      <Dialog open={!!venueDetail} onOpenChange={(o) => { if (!o) setVenueDetail(null); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          {venueDetail && (() => {
            const Icon = iconFor(venueDetail.venue.iconName);
            const v = venueDetail.venue; const hall = venueDetail.hall;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
                    <div>
                      <DialogTitle className="font-bold">{hall.name}</DialogTitle>
                      <DialogDescription className="text-xs">{hall.type} · {v.name}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  {hall.description && <p className="text-muted-foreground">{hall.description}</p>}
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> {hall.capacity} kişi kapasiteli</div>
                  <div><Badge variant="outline" className={cn('text-[10px] font-bold', hall.fee === 'Ücretsiz' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200')}>{hall.fee}</Badge></div>
                  {v.address && <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" /> <span className="text-muted-foreground">{v.address}</span></div>}
                  {v.hours && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> <span className="text-muted-foreground">{v.hours}</span></div>}
                  {v.address && (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => { if (typeof window !== 'undefined') window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address as string)}`, '_blank', 'noopener,noreferrer'); }}>
                      <ExternalLink className="h-4 w-4 mr-1.5" /> Haritada aç
                    </Button>
                  )}
                </div>
                <DialogFooter>
                  <Button className="w-full" onClick={() => reserve(v, hall)}>Rezerve Et</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Mekan ekle/düzenle dialogu */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget === 'new' ? 'Mekan Ekle' : 'Mekanı Düzenle'}</DialogTitle>
            <DialogDescription className="text-xs">Mekan ve salon bilgilerini girin. Rezervasyon e-posta veya link ile yapılabilir.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mekan Adı</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Örn. Karşıyaka Belediyesi Sancar Maruflu STK Yerleşkesi" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Tür</Label><Input value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} placeholder="Belediye · STK Yerleşkesi" /></div>
              <div className="space-y-2"><Label>Şehir</Label><Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="İzmir" /></div>
            </div>
            <div className="space-y-2"><Label>Adres</Label><Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Mahalle, cadde, no" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Çalışma Saatleri</Label><Input value={draft.hours} onChange={(e) => setDraft({ ...draft, hours: e.target.value })} placeholder="7 gün 10:00 – 22:00" /></div>
              <div className="space-y-2">
                <Label>Simge</Label>
                <Select value={draft.iconName} onValueChange={(val) => setDraft({ ...draft, iconName: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ICON_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rezervasyon Yöntemi</Label>
              <div className="flex gap-2">
                <Button type="button" variant={draft.reservationType === 'email' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setDraft({ ...draft, reservationType: 'email' })}><Mail className="h-4 w-4 mr-1.5" /> E-posta</Button>
                <Button type="button" variant={draft.reservationType === 'link' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setDraft({ ...draft, reservationType: 'link' })}><Link2 className="h-4 w-4 mr-1.5" /> Link</Button>
              </div>
              {draft.reservationType === 'email' ? (
                <Input type="email" value={draft.reservationEmail} onChange={(e) => setDraft({ ...draft, reservationEmail: e.target.value })} placeholder="rezervasyon@ornek.bel.tr" />
              ) : (
                <Input type="url" value={draft.reservationLink} onChange={(e) => setDraft({ ...draft, reservationLink: e.target.value })} placeholder="https://rezervasyon-sistemi.example.com" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Salonlar</Label>
                <Button type="button" variant="outline" size="sm" onClick={addHall}><Plus className="h-3.5 w-3.5 mr-1" /> Salon Ekle</Button>
              </div>
              {draft.halls.length === 0 && <p className="text-[11px] text-muted-foreground">Henüz salon eklenmedi.</p>}
              {draft.halls.map((h) => (
                <div key={h._key} className="rounded-xl border p-3 space-y-2 relative bg-muted/20">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-destructive" onClick={() => removeHall(h._key)} aria-label="Salonu kaldır"><Trash2 className="h-3.5 w-3.5" /></Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={h.name} onChange={(e) => updateHall(h._key, { name: e.target.value })} placeholder="Salon adı (Salon 1)" className="h-9" />
                    <Input value={h.type} onChange={(e) => updateHall(h._key, { type: e.target.value })} placeholder="Tür (Konferans)" className="h-9" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" min={0} value={h.capacity || ''} onChange={(e) => updateHall(h._key, { capacity: Number(e.target.value) || 0 })} placeholder="Kapasite" className="h-9" />
                    <Select value={h.fee} onValueChange={(val) => updateHall(h._key, { fee: val })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{FEE_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>İptal</Button>
            <Button onClick={saveVenue} disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Kaydediliyor…</> : 'Kaydet'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
