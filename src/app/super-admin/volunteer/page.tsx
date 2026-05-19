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

const EditDialog = ({ opp, onSave }: { opp: Volunteering, onSave: (id: string, patch: Partial<Volunteering>) => Promise<void> }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(opp.title || '');
  const [description, setDescription] = useState((opp as Volunteering & { description?: string }).description || '');
  const [organization, setOrganization] = useState(opp.organization || '');
  const [city, setCity] = useState(opp.location?.city || '');
  const [district, setDistrict] = useState(opp.location?.district || '');
  const [points, setPoints] = useState(String(opp.points || 0));
  const [needed, setNeeded] = useState(String(opp.volunteerCount?.needed || 0));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(opp.id, {
        title: title.trim(),
        description: description.trim(),
        organization: organization.trim(),
        location: { ...(opp.location || {}), city: city.trim(), district: district.trim() } as Volunteering['location'],
        points: Number(points) || 0,
        volunteerCount: { needed: Number(needed) || 0, applications: opp.volunteerCount?.applications || 0 },
      });
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>İlanı Düzenle</DialogTitle>
          <DialogDescription>İlan bilgilerini güncelleyin.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
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
              <Label>Şehir</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>İlçe</Label>
              <Input value={district} onChange={e => setDistrict(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Puan</Label>
              <Input type="number" value={points} onChange={e => setPoints(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Aranan Gönüllü</Label>
              <Input type="number" value={needed} onChange={e => setNeeded(e.target.value)} />
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
