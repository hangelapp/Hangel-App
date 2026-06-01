'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COLLECTIONS } from '@/firebase/collections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, ShieldCheck, Flame, Award, Upload, FileText, ExternalLink } from 'lucide-react';
import type { StudentClub } from '@/lib/types';
import { clubCategoryGroups } from '@/app/login/selection/_components/shared';

type ClubDoc = StudentClub & {
  status?: string;
  adminUserId?: string;
  joinDate?: string;
  description?: string;
  vision?: string;
  shortName?: string;
  activityCertificateUrl?: string;
};

const FREQUENCY_OPTIONS = ['Haftalık', 'Aylık', 'Dönemsel', 'Düzensiz'];

export default function SuperAdminClubEditPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const { user: authUser } = useUser();

  const docRef = useMemoFirebase(() => (db && id ? doc(db, COLLECTIONS.clubs, id) : null), [db, id]);
  const { data: club, isLoading } = useDoc<ClubDoc>(docRef);

  const [form, setForm] = useState<Partial<ClubDoc>>({});
  const [categoriesSel, setCategoriesSel] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  useEffect(() => {
    if (club) {
      setForm({
        name: club.name,
        shortName: (club as ClubDoc & { shortName?: string }).shortName,
        university: club.university,
        type: club.type,
        category: club.category,
        avatarUrl: club.avatarUrl,
        coverPhotoUrl: club.coverPhotoUrl,
        description: club.description,
        shortDescription: club.shortDescription,
        eventFrequency: club.eventFrequency,
        vision: club.vision,
        joinDate: club.joinDate,
        contact: club.contact || { email: '', phone: '', website: '' },
        advisorName: club.advisorName,
        projects: club.projects,
        volunteerHours: club.volunteerHours,
        activeMemberRate: club.activeMemberRate,
        verified: club.verified,
        activeClub: club.activeClub,
        campusAmbassador: club.campusAmbassador,
        activityCertificateUrl: club.activityCertificateUrl,
      });
      setCategoriesSel(Array.isArray(club.categories) ? club.categories : club.category ? [club.category] : []);
    }
  }, [club]);

  const updateContact = useCallback((field: keyof NonNullable<ClubDoc['contact']>, value: string) => {
    setForm(prev => ({
      ...prev,
      contact: { ...(prev.contact || { email: '', phone: '', website: '' }), [field]: value },
    }));
  }, []);

  const toggleCategory = (cat: string) => {
    setCategoriesSel(prev => (prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]));
  };

  const handleFileUpload = async (file: File, kind: 'logo' | 'cert') => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'En fazla 10MB yükleyebilirsiniz.' });
      return;
    }
    const setUploading = kind === 'logo' ? setUploadingLogo : setUploadingCert;
    setUploading(true);
    try {
      const storage = getStorage();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `clubs/${id}/${kind}-${Date.now()}-${safeName}`;
      const sref = ref(storage, path);
      await uploadBytes(sref, file);
      const url = await getDownloadURL(sref);

      if (kind === 'logo') setForm(p => ({ ...p, avatarUrl: url }));
      else setForm(p => ({ ...p, activityCertificateUrl: url }));

      // Super-admin "Arşiv" sekmesinde kulüp evrakı olarak görünsün (best-effort).
      try {
        const token = await authUser?.getIdToken();
        if (token) {
          await fetch('/api/ngo/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              docType: kind === 'logo' ? 'Logo' : 'Faaliyet Belgesi',
              fileUrl: url,
              entityType: 'club',
              entityId: id,
              entityName: form.name || club?.name || '',
            }),
          });
        }
      } catch { /* arşiv aynası başarısız olsa da yükleme tamam */ }

      toast({ title: kind === 'logo' ? 'Logo yüklendi' : 'Faaliyet belgesi yüklendi', description: 'Kaydet\'e basınca kulüp profiline işlenir.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Yükleme hatası', description: e instanceof Error ? e.message.slice(0, 200) : 'Bilinmeyen hata' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!docRef) return;
    setSaving(true);
    try {
      await updateDoc(docRef, {
        ...form,
        categories: categoriesSel,
        category: categoriesSel[0] || '',
      });
      toast({ title: 'Kulüp güncellendi', description: 'Değişiklikler kaydedildi.' });
      router.push('/super-admin/clubs');
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Kayıt başarısız',
        description: e instanceof Error ? e.message.slice(0, 200) : 'Bilinmeyen hata',
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !club) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in-0 pb-32">
      <div className="flex items-center gap-3">
        <Button onClick={() => router.back()} variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black tracking-tight truncate">{club.name}</h1>
          <p className="text-xs text-muted-foreground">Kulüp profilini düzenle</p>
        </div>
      </div>

      {/* Temel Bilgiler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kulüp Türü</Label>
              <Select value={form.type || ''} onValueChange={v => setForm(p => ({ ...p, type: v as 'university' | 'high-school' }))}>
                <SelectTrigger><SelectValue placeholder="Tür seç..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="university">Üniversite</SelectItem>
                  <SelectItem value="high-school">Lise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bağlı Okul / Üniversite</Label>
              <Input value={form.university || ''} onChange={e => setForm(p => ({ ...p, university: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kulüp Adı</Label>
            <Input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Kısa Ad (Opsiyonel)</Label>
            <Input value={(form as { shortName?: string }).shortName || ''} onChange={e => setForm(p => ({ ...p, shortName: e.target.value } as Partial<ClubDoc>))} placeholder="Örn: AİP" />
          </div>
          <div className="space-y-2">
            <Label>Kısa Tanıtım</Label>
            <Textarea rows={3} value={form.shortDescription || ''} onChange={e => setForm(p => ({ ...p, shortDescription: e.target.value }))} placeholder="2-3 cümle kulüp özeti" />
          </div>
          <div className="space-y-2">
            <Label>Uzun Açıklama</Label>
            <Textarea rows={5} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Detaylı kulüp tanıtımı" />
          </div>
          <div className="space-y-2">
            <Label>Vizyon</Label>
            <Textarea rows={3} value={form.vision || ''} onChange={e => setForm(p => ({ ...p, vision: e.target.value }))} placeholder="Kulübün vizyonu" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Etkinlik Sıklığı</Label>
              <Select value={form.eventFrequency || ''} onValueChange={v => setForm(p => ({ ...p, eventFrequency: v }))}>
                <SelectTrigger><SelectValue placeholder="Sıklık seç..." /></SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Katılım Tarihi (hangel)</Label>
              <Input value={form.joinDate || ''} onChange={e => setForm(p => ({ ...p, joinDate: e.target.value }))} placeholder="YYYY-MM-DD" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Çalışma Alanları (Kategoriler) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Çalışma Alanları</CardTitle>
          <CardDescription>{categoriesSel.length} kategori seçili. Hepsini kulüp profilinde rozet olarak göstereceğiz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {clubCategoryGroups.map(group => (
            <div key={group.group} className="space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{group.group}</h4>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map(item => {
                  const sel = categoriesSel.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCategory(item)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        sel ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* İletişim & Sosyal Medya */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">İletişim & Sosyal Medya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input type="email" value={form.contact?.email || ''} onChange={e => updateContact('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input type="tel" value={form.contact?.phone || ''} onChange={e => updateContact('phone', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Web Sitesi</Label>
              <Input type="url" value={form.contact?.website || ''} onChange={e => updateContact('website', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={form.contact?.instagram || ''} onChange={e => updateContact('instagram', e.target.value)} placeholder="@kulup" />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={form.contact?.linkedin || ''} onChange={e => updateContact('linkedin', e.target.value)} placeholder="@kulup" />
            </div>
            <div className="space-y-2">
              <Label>X (Twitter)</Label>
              <Input value={form.contact?.twitter || ''} onChange={e => updateContact('twitter', e.target.value)} placeholder="@kulup" />
            </div>
            <div className="space-y-2">
              <Label>Akademik Danışman (yalnız ad)</Label>
              <Input value={form.advisorName || ''} onChange={e => setForm(p => ({ ...p, advisorName: e.target.value }))} placeholder="Prof. Dr. ..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo, Kapak & Belgeler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo, Kapak & Belgeler</CardTitle>
          <CardDescription>Logoyu ve okuldan alınan faaliyet belgesini yükleyebilir ya da URL girebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo — yükle veya URL */}
          <div className="space-y-2">
            <Label>Kulüp Logosu</Label>
            <div className="flex items-center gap-3">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Logo" className="h-14 w-14 rounded-xl object-cover border shrink-0" />
              ) : (
                <div className="h-14 w-14 rounded-xl border bg-muted flex items-center justify-center shrink-0 text-muted-foreground text-[10px]">Logo</div>
              )}
              <Button asChild variant="secondary" size="sm" disabled={uploadingLogo}>
                <label htmlFor="club-logo-upload" className="cursor-pointer">
                  {uploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {form.avatarUrl ? 'Logoyu Değiştir' : 'Logo Yükle'}
                  <input id="club-logo-upload" type="file" className="hidden" accept="image/*"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'logo'); e.target.value = ''; }} />
                </label>
              </Button>
            </div>
            <Input type="url" value={form.avatarUrl || ''} onChange={e => setForm(p => ({ ...p, avatarUrl: e.target.value }))} placeholder="veya logo URL'si yapıştır" />
          </div>

          {/* Kapak */}
          <div className="space-y-2">
            <Label>Kapak Fotoğrafı URL</Label>
            <Input type="url" value={form.coverPhotoUrl || ''} onChange={e => setForm(p => ({ ...p, coverPhotoUrl: e.target.value }))} />
          </div>

          {/* Faaliyet Belgesi — yükle + görüntüle */}
          <div className="space-y-2">
            <Label>Faaliyet Belgesi (okuldan alınan)</Label>
            <div className="flex items-center gap-3 flex-wrap">
              <Button asChild variant="secondary" size="sm" disabled={uploadingCert}>
                <label htmlFor="club-cert-upload" className="cursor-pointer">
                  {uploadingCert ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {form.activityCertificateUrl ? 'Belgeyi Değiştir' : 'Belge Yükle'}
                  <input id="club-cert-upload" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'cert'); e.target.value = ''; }} />
                </label>
              </Button>
              {form.activityCertificateUrl && (
                <a href={form.activityCertificateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <FileText className="h-4 w-4" /> Belgeyi Görüntüle <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">PDF veya görsel (en fazla 10MB). Yüklenen belge super-admin &quot;Arşiv&quot; sekmesinde kulüp bazlı listelenir.</p>
          </div>
        </CardContent>
      </Card>

      {/* İstatistikler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">İstatistikler</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Proje Sayısı</Label>
            <Input type="number" min={0} value={form.projects ?? 0} onChange={e => setForm(p => ({ ...p, projects: Number(e.target.value) || 0 }))} />
          </div>
          <div className="space-y-2">
            <Label>Gönüllülük Saati</Label>
            <Input type="number" min={0} value={form.volunteerHours ?? 0} onChange={e => setForm(p => ({ ...p, volunteerHours: Number(e.target.value) || 0 }))} />
          </div>
          <div className="space-y-2">
            <Label>Aktif Üye Oranı (%)</Label>
            <Input type="number" min={0} max={100} value={form.activeMemberRate ?? 0} onChange={e => setForm(p => ({ ...p, activeMemberRate: Number(e.target.value) || 0 }))} />
          </div>
        </CardContent>
      </Card>

      {/* Rozetler (Doğrulanmış / Aktif / Kampüs Elçisi) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kulüp Rozetleri</CardTitle>
          <CardDescription>Süper admin onayı ile profil sayfasında gösterilir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-blue-700" /></div>
              <div>
                <p className="text-sm font-bold">Doğrulanmış Kulüp</p>
                <p className="text-[11px] text-muted-foreground">Süper admin onaylı ve yayında.</p>
              </div>
            </div>
            <Switch checked={!!form.verified} onCheckedChange={c => setForm(p => ({ ...p, verified: c }))} />
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center"><Flame className="h-5 w-5 text-orange-700" /></div>
              <div>
                <p className="text-sm font-bold">Aktif Kulüp</p>
                <p className="text-[11px] text-muted-foreground">Okulun en aktif 3 kulübünden biri.</p>
              </div>
            </div>
            <Switch checked={!!form.activeClub} onCheckedChange={c => setForm(p => ({ ...p, activeClub: c }))} />
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center"><Award className="h-5 w-5 text-purple-700" /></div>
              <div>
                <p className="text-sm font-bold">Kampüs Elçisi</p>
                <p className="text-[11px] text-muted-foreground">hangel elçisi olarak atanmış kulüp.</p>
              </div>
            </div>
            <Switch checked={!!form.campusAmbassador} onCheckedChange={c => setForm(p => ({ ...p, campusAmbassador: c }))} />
          </div>
        </CardContent>
      </Card>

      {/* Kaydet */}
      <div className="sticky bottom-4 z-10 flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>İptal</Button>
        <Button onClick={handleSave} disabled={saving} className="rounded-2xl font-black shadow-xl">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Kaydediliyor...</> : <><Save className="h-4 w-4 mr-2" /> Kaydet</>}
        </Button>
      </div>
    </div>
  );
}
