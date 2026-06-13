'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Volunteering } from '@/lib/types';
import { Loader2, Calendar, MapPin, Users } from 'lucide-react';
import { COLLECTIONS } from '@/firebase/collections';

type Status = 'Aktif' | 'Pasif' | 'Beklemede';

const statusLabel: Record<Status, string> = {
  Aktif: 'Aktif',
  Pasif: 'Pasif',
  Beklemede: 'Onay Bekliyor',
};

const statusColor: Record<Status, string> = {
  Aktif: 'bg-green-100 text-green-700 border-green-300',
  Pasif: 'bg-gray-100 text-gray-600 border-gray-300',
  Beklemede: 'bg-amber-100 text-amber-700 border-amber-300',
};

// Virgülle ayrılmış metni string[]'e çevirir (boş elemanları atar)
const toList = (s: string): string[] =>
  s.split(',').map(x => x.trim()).filter(Boolean);

const LOCATION_TYPES = ['Online', 'Saha', 'Hibrit'] as const;
const TASK_TYPES = ['Tek Gün', 'Dönemsel', 'Sürekli'] as const;
const STATUS_OPTIONS: Status[] = ['Beklemede', 'Aktif', 'Pasif'];

const EditDialog = ({ opp, onSave }: { opp: Volunteering & { status?: Status }, onSave: (id: string, patch: Partial<Volunteering>) => Promise<void> }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Temel
  const [title, setTitle] = useState(opp.title || '');
  const [organization, setOrganization] = useState(opp.organization || '');
  const [description, setDescription] = useState(opp.description || '');
  const [socialArea, setSocialArea] = useState(opp.socialArea || '');
  const [status, setStatus] = useState<Status>((opp.status as Status) || 'Aktif');

  // Konum
  const [city, setCity] = useState(opp.location?.city || '');
  const [district, setDistrict] = useState(opp.location?.district || '');
  const [locationType, setLocationType] = useState<Volunteering['location']['type']>(opp.location?.type || 'Saha');
  const [address, setAddress] = useState(opp.location?.address || '');
  const [lat, setLat] = useState(String(opp.location?.coordinates?.lat ?? ''));
  const [lon, setLon] = useState(String(opp.location?.coordinates?.lon ?? ''));

  // Katılım & görev
  const [participationCondition, setParticipationCondition] = useState(opp.participationCondition || '');
  const [commitment, setCommitment] = useState(opp.commitment || '');
  const [taskType, setTaskType] = useState<Volunteering['taskType']>(opp.taskType || 'Tek Gün');

  // Tarihler
  const [applicationStart, setApplicationStart] = useState(opp.dates?.applicationStart || '');
  const [applicationEnd, setApplicationEnd] = useState(opp.dates?.applicationEnd || '');
  const [eventStart, setEventStart] = useState(opp.dates?.eventStart || '');
  const [eventEnd, setEventEnd] = useState(opp.dates?.eventEnd || '');

  // Sayılar
  const [needed, setNeeded] = useState(String(opp.volunteerCount?.needed || 0));
  const [points, setPoints] = useState(String(opp.points || 0));

  // Listeler (virgülle ayrılmış)
  const [skills, setSkills] = useState((opp.skills || []).join(', '));
  const [interests, setInterests] = useState((opp.interests || []).join(', '));
  const [languages, setLanguages] = useState((opp.languages || []).join(', '));
  const [requirements, setRequirements] = useState((opp.requirements || []).join(', '));

  // Olanaklar & sertifika
  const [providesCertificate, setProvidesCertificate] = useState(!!opp.providesCertificate);
  const [transport, setTransport] = useState(!!opp.amenities?.transport);
  const [food, setFood] = useState(!!opp.amenities?.food);
  const [accommodation, setAccommodation] = useState(!!opp.amenities?.accommodation);

  const handleSave = async () => {
    setSaving(true);
    try {
      const latNum = Number(lat);
      const lonNum = Number(lon);
      const hasCoords = lat.trim() !== '' && lon.trim() !== '' && !Number.isNaN(latNum) && !Number.isNaN(lonNum);
      await onSave(opp.id, {
        title: title.trim(),
        organization: organization.trim(),
        description: description.trim(),
        socialArea: socialArea.trim(),
        status,
        location: {
          city: city.trim(),
          district: district.trim(),
          type: locationType,
          address: address.trim(),
          coordinates: hasCoords ? { lat: latNum, lon: lonNum } : { lat: 0, lon: 0 },
        },
        participationCondition: participationCondition.trim(),
        commitment: commitment.trim(),
        taskType,
        dates: {
          applicationStart: applicationStart.trim(),
          applicationEnd: applicationEnd.trim(),
          eventStart: eventStart.trim(),
          eventEnd: eventEnd.trim(),
        },
        volunteerCount: {
          needed: Number(needed) || 0,
          applications: opp.volunteerCount?.applications || 0,
        },
        points: Number(points) || 0,
        skills: toList(skills),
        interests: toList(interests),
        languages: toList(languages),
        requirements: toList(requirements),
        providesCertificate,
        amenities: { transport, food, accommodation },
      } as Partial<Volunteering>);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">Düzenle</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>İlanı Düzenle</DialogTitle>
          <DialogDescription>İlanın tüm detaylarını güncelleyin.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
          {/* Temel bilgiler */}
          <div className="space-y-1.5">
            <Label>Başlık</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Kuruluş</Label>
            <Input value={organization} onChange={e => setOrganization(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Açıklama</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sosyal Alan</Label>
              <Input value={socialArea} onChange={e => setSocialArea(e.target.value)} placeholder="örn. Eğitim, Çevre" />
            </div>
            <div className="space-y-1.5">
              <Label>Durum</Label>
              <Select value={status} onValueChange={v => setStatus(v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Konum */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Şehir</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>İlçe</Label>
              <Input value={district} onChange={e => setDistrict(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tür</Label>
              <Select value={locationType} onValueChange={v => setLocationType(v as Volunteering['location']['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Açık Adres</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Saha / fiziksel adres" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Enlem (lat)</Label>
              <Input type="number" value={lat} onChange={e => setLat(e.target.value)} placeholder="örn. 41.0082" />
            </div>
            <div className="space-y-1.5">
              <Label>Boylam (lon)</Label>
              <Input type="number" value={lon} onChange={e => setLon(e.target.value)} placeholder="örn. 28.9784" />
            </div>
          </div>

          {/* Katılım & görev */}
          <div className="space-y-1.5">
            <Label>Katılım Koşulu</Label>
            <Input value={participationCondition} onChange={e => setParticipationCondition(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Taahhüt (commitment)</Label>
              <Input value={commitment} onChange={e => setCommitment(e.target.value)} placeholder="örn. Haftada 4 saat" />
            </div>
            <div className="space-y-1.5">
              <Label>Görev Tipi</Label>
              <Select value={taskType} onValueChange={v => setTaskType(v as Volunteering['taskType'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tarihler */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Başvuru Başlangıç</Label>
              <Input value={applicationStart} onChange={e => setApplicationStart(e.target.value)} placeholder="GG.AA.YYYY" />
            </div>
            <div className="space-y-1.5">
              <Label>Başvuru Bitiş</Label>
              <Input value={applicationEnd} onChange={e => setApplicationEnd(e.target.value)} placeholder="GG.AA.YYYY" />
            </div>
            <div className="space-y-1.5">
              <Label>Etkinlik Başlangıç</Label>
              <Input value={eventStart} onChange={e => setEventStart(e.target.value)} placeholder="GG.AA.YYYY" />
            </div>
            <div className="space-y-1.5">
              <Label>Etkinlik Bitiş</Label>
              <Input value={eventEnd} onChange={e => setEventEnd(e.target.value)} placeholder="GG.AA.YYYY" />
            </div>
          </div>

          {/* Kapasite & puan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Aranan Gönüllü (kapasite)</Label>
              <Input type="number" value={needed} onChange={e => setNeeded(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Puan</Label>
              <Input type="number" value={points} onChange={e => setPoints(e.target.value)} />
            </div>
          </div>

          {/* Listeler */}
          <div className="space-y-1.5">
            <Label>Yetenekler <span className="text-muted-foreground text-xs">(virgülle ayırın)</span></Label>
            <Input value={skills} onChange={e => setSkills(e.target.value)} placeholder="örn. iletişim, organizasyon" />
          </div>
          <div className="space-y-1.5">
            <Label>İlgi Alanları <span className="text-muted-foreground text-xs">(virgülle ayırın)</span></Label>
            <Input value={interests} onChange={e => setInterests(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Diller <span className="text-muted-foreground text-xs">(virgülle ayırın)</span></Label>
            <Input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="örn. Türkçe, İngilizce" />
          </div>
          <div className="space-y-1.5">
            <Label>Gereksinimler / Belgeler <span className="text-muted-foreground text-xs">(virgülle ayırın)</span></Label>
            <Input value={requirements} onChange={e => setRequirements(e.target.value)} />
          </div>

          {/* Olanaklar & sertifika */}
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor={`cert-${opp.id}`}>Sertifika veriliyor</Label>
              <Switch id={`cert-${opp.id}`} checked={providesCertificate} onCheckedChange={setProvidesCertificate} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`transport-${opp.id}`}>Ulaşım sağlanıyor</Label>
              <Switch id={`transport-${opp.id}`} checked={transport} onCheckedChange={setTransport} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`food-${opp.id}`}>Yemek sağlanıyor</Label>
              <Switch id={`food-${opp.id}`} checked={food} onCheckedChange={setFood} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`accommodation-${opp.id}`}>Konaklama sağlanıyor</Label>
              <Switch id={`accommodation-${opp.id}`} checked={accommodation} onCheckedChange={setAccommodation} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const OpportunityCard = ({ opp, onStatusChange, onDelete, onSave }: {
  opp: Volunteering & { status?: Status };
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onSave: (id: string, patch: Partial<Volunteering>) => Promise<void>;
}) => {
  const status: Status = (opp.status as Status) || 'Aktif';
  return (
    <Card>
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{opp.title || '(başlıksız)'}</p>
            <span className={cn('text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded', statusColor[status])}>
              {statusLabel[status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{opp.organization}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
            {opp.location?.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {opp.location.city}{opp.location.district && `, ${opp.location.district}`}</span>}
            {opp.dates?.applicationEnd && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Son: {opp.dates.applicationEnd}</span>}
            {opp.volunteerCount?.needed > 0 && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {opp.volunteerCount?.applications || 0} / {opp.volunteerCount.needed}</span>}
            {opp.points > 0 && <Badge variant="secondary" className="text-[10px]">+{opp.points} puan</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <EditDialog opp={opp} onSave={onSave} />

          {status === 'Beklemede' && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onStatusChange(opp.id, 'Aktif')}>
              Onayla
            </Button>
          )}
          {status === 'Aktif' && (
            <Button variant="outline" size="sm" onClick={() => onStatusChange(opp.id, 'Pasif')}>
              Yayından Kaldır
            </Button>
          )}
          {status === 'Pasif' && (
            <Button variant="secondary" size="sm" onClick={() => onStatusChange(opp.id, 'Aktif')}>
              Yayına Al
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">Sil</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>İlanı Silmek Üzeresiniz</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. İlan kalıcı olarak silinecektir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  className={cn(buttonVariants({ variant: 'destructive' }))}
                  onClick={() => onDelete(opp.id)}>
                  Evet, Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default function VolunteerManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const oppsQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.volunteering) : null), [db]);
  const { data: opportunities, isLoading } = useCollection<Volunteering & { status?: Status }>(oppsQuery);

  const handleUpdateStatus = async (id: string, newStatus: Status) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.volunteering, id), { status: newStatus });
      toast({
        title: 'İlan Durumu Güncellendi',
        description: newStatus === 'Aktif' ? 'İlan yayına alındı.' : newStatus === 'Pasif' ? 'İlan yayından kaldırıldı.' : 'İlan onay bekliyor.',
      });
    } catch (e) {
      console.error('Status update failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata.';
      toast({
        variant: 'destructive',
        title: 'Güncelleme başarısız',
        description: code === 'permission-denied' ? 'Bu işlem için super-admin yetkisi gerekli.' : message,
      });
    }
  };

  const handleSave = async (id: string, patch: Partial<Volunteering>) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.volunteering, id), patch as Record<string, unknown>);
      toast({ title: 'İlan Güncellendi', description: 'Değişiklikler kaydedildi.' });
    } catch (e) {
      console.error('Save failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata.';
      toast({
        variant: 'destructive',
        title: 'Kaydedilemedi',
        description: code === 'permission-denied' ? 'Bu işlem için yetkiniz yok.' : message,
      });
      throw e;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.volunteering, id));
      toast({ variant: 'destructive', title: 'İlan Silindi' });
    } catch (e) {
      console.error('Delete failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata.';
      toast({
        variant: 'destructive',
        title: 'Silinemedi',
        description: code === 'permission-denied' ? 'Bu işlem için yetkiniz yok.' : message,
      });
    }
  };

  const all = opportunities || [];
  const pending = all.filter(o => (o.status || 'Aktif') === 'Beklemede');
  const active = all.filter(o => (o.status || 'Aktif') === 'Aktif');
  const passive = all.filter(o => o.status === 'Pasif');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold md:text-2xl">Gönüllülük Yönetimi</h1>
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Onay Bekleyen ({pending.length})</TabsTrigger>
          <TabsTrigger value="active">Aktif ({active.length})</TabsTrigger>
          <TabsTrigger value="passive">Pasif ({passive.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Onay Bekleyen Gönüllülük İlanları</CardTitle>
              <CardDescription>NGO yöneticileri tarafından oluşturulan, yayınlanmak için onayınızı bekleyen ilanlar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pending.length > 0 ? (
                pending.map(opp => <OpportunityCard key={opp.id} opp={opp} onStatusChange={handleUpdateStatus} onDelete={handleDelete} onSave={handleSave} />)
              ) : (
                <p className="text-center text-muted-foreground p-8">Onay bekleyen ilan bulunmuyor.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktif Gönüllülük İlanları</CardTitle>
              <CardDescription>Şu anda yayında olan ilanları yönetin, düzenleyin veya yayından kaldırın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {active.length > 0 ? (
                active.map(opp => <OpportunityCard key={opp.id} opp={opp} onStatusChange={handleUpdateStatus} onDelete={handleDelete} onSave={handleSave} />)
              ) : (
                <p className="text-center text-muted-foreground p-8">Aktif ilan bulunmuyor.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passive" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pasif Gönüllülük İlanları</CardTitle>
              <CardDescription>Yayından kaldırılmış ilanlar — istenirse tekrar yayına alınabilir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passive.length > 0 ? (
                passive.map(opp => <OpportunityCard key={opp.id} opp={opp} onStatusChange={handleUpdateStatus} onDelete={handleDelete} onSave={handleSave} />)
              ) : (
                <p className="text-center text-muted-foreground p-8">Pasif ilan bulunmuyor.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
