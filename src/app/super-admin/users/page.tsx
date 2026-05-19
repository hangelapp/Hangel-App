'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ShieldAlert, Loader2, Trash2, Pencil, Eye, Mail, Phone, MapPin, Cake, Globe, MailCheck, KeyRound, ShieldQuestion, UserPlus, Building2, Briefcase, GraduationCap } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useAuth, initiatePasswordResetEmail } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { COLLECTIONS } from '@/firebase/collections';

type EntityKind = 'ngo' | 'brand' | 'club';

type EntityRow = {
  id: string;
  name?: string;
  logoUrl?: string;
  category?: string;
};

const entityKindLabels: Record<EntityKind, string> = {
  ngo: 'STK',
  brand: 'Marka',
  club: 'Öğrenci Kulübü',
};

const entityCollectionByKind: Record<EntityKind, string> = {
  ngo: 'ngos',
  brand: 'brands',
  club: 'clubs',
};

const entityIdFieldByKind: Record<EntityKind, 'managedNgoId' | 'managedBrandId' | 'managedClubId'> = {
  ngo: 'managedNgoId',
  brand: 'managedBrandId',
  club: 'managedClubId',
};

const invitationIdFieldByKind: Record<EntityKind, 'ngoId' | 'brandId' | 'clubId'> = {
  ngo: 'ngoId',
  brand: 'brandId',
  club: 'clubId',
};

const rolesByKind: Record<EntityKind, { value: string; label: string; isPrimary?: boolean }[]> = {
  ngo: [
    { value: 'Genel Yönetici', label: 'Genel Yönetici', isPrimary: true },
    { value: 'Finans Yöneticisi', label: 'Finans Yöneticisi' },
    { value: 'Gönüllü Yöneticisi', label: 'Gönüllü Yöneticisi' },
    { value: 'İçerik Yöneticisi', label: 'İçerik Yöneticisi' },
    { value: 'Proje Yöneticisi', label: 'Proje Yöneticisi' },
  ],
  brand: [
    { value: 'Genel Yönetici', label: 'Genel Yönetici', isPrimary: true },
    { value: 'Marka Yöneticisi', label: 'Marka Yöneticisi' },
    { value: 'Pazarlama Yöneticisi', label: 'Pazarlama Yöneticisi' },
    { value: 'Finans Yöneticisi', label: 'Finans Yöneticisi' },
  ],
  club: [
    { value: 'Genel Yönetici', label: 'Genel Yönetici', isPrimary: true },
    { value: 'Etkinlik Yöneticisi', label: 'Etkinlik Yöneticisi' },
    { value: 'İçerik Yöneticisi', label: 'İçerik Yöneticisi' },
  ],
};

type UserRow = User & { id: string; status?: string };

const roleLabel: Record<string, string> = {
  'super-admin': 'SÜPER ADMİN',
  'ngo-admin': 'YÖNETİCİ',
  'user': 'KULLANICI',
};

// View (read-only) dialog
const ProfileViewDialog = ({ user, open, onOpenChange }: { user: UserRow | null; open: boolean; onOpenChange: (o: boolean) => void; }) => {
  if (!user) return null;
  const pi = (user.personalInfo || {}) as Partial<{
    email: string;
    phone: string;
    birthDate: string;
    gender: string;
    nationality: string;
    bloodType: string;
    website: string;
    address: Record<string, string | undefined>;
  }>;
  const addr = (pi.address || {}) as Record<string, string | undefined>;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] max-w-lg">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-xl font-black">{(user.name || '?').charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <DialogTitle>{user.name || 'İsimsiz'}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === 'super-admin' ? 'default' : user.role === 'ngo-admin' ? 'secondary' : 'outline'} className="text-[9px] uppercase tracking-widest">
                  {roleLabel[user.role || 'user']}
                </Badge>
                {user.username && <span className="text-xs text-muted-foreground">{user.username}</span>}
              </div>
            </div>
          </div>
          <DialogDescription className="text-xs">UID: <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{user.id}</code></DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">İletişim</p>
            {pi.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {pi.email}</div>}
            {pi.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {pi.phone}</div>}
            {pi.website && <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-muted-foreground" /> <a href={pi.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{pi.website}</a></div>}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Demografi</p>
            {pi.birthDate && <div className="flex items-center gap-2 text-sm"><Cake className="h-4 w-4 text-muted-foreground" /> {pi.birthDate}</div>}
            {pi.gender && <div className="flex items-center gap-2 text-sm"><span className="text-xs text-muted-foreground">Cinsiyet:</span> {pi.gender}</div>}
            {pi.bloodType && <div className="flex items-center gap-2 text-sm"><span className="text-xs text-muted-foreground">Kan Grubu:</span> {pi.bloodType}</div>}
            {pi.nationality && <div className="flex items-center gap-2 text-sm"><span className="text-xs text-muted-foreground">Uyruk:</span> {pi.nationality}</div>}
          </div>
          {(addr.country || addr.city || addr.district) && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Adres</p>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {[addr.neighborhood, addr.district, addr.city, addr.country].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">İstatistikler</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-muted/40 rounded-lg text-center">
                <p className="text-lg font-black">{user.impactScore?.toLocaleString('tr-TR') || 0}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">Etki Puanı</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg text-center">
                <p className="text-lg font-black">{((user as UserRow & { inviteCount?: number }).inviteCount) || 0}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">Davet</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg text-center">
                <p className="text-lg font-black">{Array.isArray(user.supportedNgos) ? user.supportedNgos.length : 0}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">Destek</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Edit dialog — kullanıcı profilinin tamamını düzenler
const EditUserDialog = ({ user, open, onOpenChange, onSave }: {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (id: string, patch: Record<string, unknown>) => Promise<void>;
}) => {
  // Temel
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState<'user' | 'ngo-admin' | 'super-admin'>('user');
  // İletişim
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  // Demografi
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  const [bloodType, setBloodType] = useState('');
  // Adres
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  // Sosyal
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [behance, setBehance] = useState('');
  // Volunteer özet
  const [profession, setProfession] = useState('');

  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (user) {
      const pi = (user.personalInfo || {}) as Partial<{
        email: string;
        phone: string;
        birthDate: string;
        gender: string;
        nationality: string;
        bloodType: string;
        website: string;
        address: Record<string, string | undefined>;
        social: Record<string, string | undefined>;
      }>;
      const addr = (pi.address || {}) as Record<string, string | undefined>;
      const social = (pi.social || {}) as Record<string, string | undefined>;
      const vi = (user.volunteerInfo || {}) as Partial<{ profession: string | null }>;

      setName(user.name || '');
      setUsername(user.username || '');
      setAvatarUrl(user.avatarUrl || '');
      setRole((user.role as 'user' | 'ngo-admin' | 'super-admin') || 'user');

      setEmail(pi.email || '');
      setPhone(pi.phone || '');
      setWebsite(pi.website || '');

      setBirthDate(pi.birthDate || '');
      setGender(pi.gender || '');
      setNationality(pi.nationality || '');
      setBloodType(pi.bloodType || '');

      setCountry(addr.country || '');
      setCity(addr.city || '');
      setDistrict(addr.district || '');

      setInstagram(social.instagram || '');
      setTwitter(social.twitter || '');
      setLinkedin(social.linkedin || '');
      setGithub(social.github || '');
      setBehance(social.behance || '');

      setProfession(vi.profession || '');
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const prevPi = (user.personalInfo || {}) as Record<string, unknown>;
      const prevAddress = ((prevPi.address as Record<string, unknown>) || {});
      const prevSocial = ((prevPi.social as Record<string, unknown>) || {});
      const prevVi = (user.volunteerInfo || {}) as Record<string, unknown>;

      await onSave(user.id, {
        name: name.trim(),
        username: username.trim(),
        avatarUrl: avatarUrl.trim(),
        role,
        personalInfo: {
          ...prevPi,
          email: email.trim(),
          phone: phone.trim(),
          website: website.trim() || null,
          birthDate: birthDate.trim(),
          gender: gender.trim(),
          nationality: nationality.trim(),
          bloodType: bloodType.trim(),
          address: {
            ...prevAddress,
            country: country.trim(),
            city: city.trim(),
            district: district.trim(),
          },
          social: {
            ...prevSocial,
            instagram: instagram.trim() || null,
            twitter: twitter.trim() || null,
            linkedin: linkedin.trim() || null,
            github: github.trim() || null,
            behance: behance.trim() || null,
          },
        },
        volunteerInfo: {
          ...prevVi,
          profession: profession.trim() || null,
        },
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kullanıcı Profilini Düzenle</DialogTitle>
          <DialogDescription>{user.name} kullanıcısının tüm profil bilgilerini, sosyal medyasını ve yetki seviyesini güncelleyin.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2 max-h-[65vh] overflow-y-auto pr-1">
          {/* Profil & Yetki */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profil</p>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xl font-black">{(name || '?').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Label className="text-xs">Profil Fotoğrafı URL</Label>
                <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Kullanıcı Adı</Label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="@kullaniciadi" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Platform Yetkisi</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'user' | 'ngo-admin' | 'super-admin')}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Standart Kullanıcı</SelectItem>
                  <SelectItem value="ngo-admin">Yönetici (Kurumsal)</SelectItem>
                  <SelectItem value="super-admin">Süper Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === 'super-admin' && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs text-red-800 leading-relaxed font-medium">
                  Süper Admin yetkisi, kullanıcının bu paneli ve tüm sistem ayarlarını yönetmesini sağlar.
                </p>
              </div>
            )}
          </div>

          {/* İletişim */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">İletişim</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Web Sitesi</Label>
              <Input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="rounded-xl" />
            </div>
          </div>

          {/* Demografi */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Demografi</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Doğum Tarihi</Label>
                <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Cinsiyet</Label>
                <Select value={gender || undefined} onValueChange={(v) => setGender(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kadın">Kadın</SelectItem>
                    <SelectItem value="Erkek">Erkek</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                    <SelectItem value="Belirtmek istemiyorum">Belirtmek istemiyorum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Uyruk</Label>
                <Input value={nationality} onChange={e => setNationality(e.target.value)} placeholder="T.C." className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Kan Grubu</Label>
                <Select value={bloodType || undefined} onValueChange={(v) => setBloodType(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>
                    {['0 Rh+', '0 Rh-', 'A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-'].map(bt => (
                      <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Adres */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Adres</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Ülke</Label>
                <Input value={country} onChange={e => setCountry(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>İl</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>İlçe</Label>
                <Input value={district} onChange={e => setDistrict(e.target.value)} className="rounded-xl" />
              </div>
            </div>
          </div>

          {/* Sosyal Medya */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sosyal Medya</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@kullanici" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Twitter / X</Label>
                <Input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@kullanici" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/..." className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>GitHub</Label>
                <Input value={github} onChange={e => setGithub(e.target.value)} placeholder="github.com/..." className="rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Behance</Label>
                <Input value={behance} onChange={e => setBehance(e.target.value)} placeholder="behance.net/..." className="rounded-xl" />
              </div>
            </div>
          </div>

          {/* Gönüllü Özeti */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gönüllü Bilgileri (Özet)</p>
            <div className="space-y-2">
              <Label>Meslek</Label>
              <Input value={profession} onChange={e => setProfession(e.target.value)} placeholder="Yazılım Geliştirici" className="rounded-xl" />
              <p className="text-[11px] text-muted-foreground">Diğer gönüllü alanları (yetenekler, eğitim, diller vb.) kullanıcı kendi profilinden düzenler.</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">İptal</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl font-bold">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Yetkilendirme dialog'u — kullanıcıyı bir STK / Marka / Kulüp'e yönetici olarak atar
const AssignEntityDialog = ({ user, open, onOpenChange }: {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const db = useFirestore();
  const { toast } = useToast();

  const [entityKind, setEntityKind] = useState<EntityKind>('ngo');
  const [entitySearch, setEntitySearch] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [roleTitle, setRoleTitle] = useState<string>(rolesByKind.ngo[0].value);
  const [submitting, setSubmitting] = useState(false);

  // Dialog her açıldığında state'i sıfırla
  React.useEffect(() => {
    if (open) {
      setEntityKind('ngo');
      setEntitySearch('');
      setSelectedEntityId('');
      setRoleTitle(rolesByKind.ngo[0].value);
    }
  }, [open]);

  // Entity türü değişince ilk role'ü seç, seçili kuruluşu sıfırla
  React.useEffect(() => {
    setSelectedEntityId('');
    setEntitySearch('');
    setRoleTitle(rolesByKind[entityKind][0].value);
  }, [entityKind]);

  const ngosQuery = useMemoFirebase(() => collection(db, COLLECTIONS.ngos), [db]);
  const brandsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
  const clubsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.clubs), [db]);

  const { data: ngos, isLoading: ngosLoading } = useCollection<EntityRow>(ngosQuery);
  const { data: brands, isLoading: brandsLoading } = useCollection<EntityRow>(brandsQuery);
  const { data: clubs, isLoading: clubsLoading } = useCollection<EntityRow>(clubsQuery);

  const allEntities: EntityRow[] = useMemo(() => {
    if (entityKind === 'ngo') return ngos || [];
    if (entityKind === 'brand') return brands || [];
    return clubs || [];
  }, [entityKind, ngos, brands, clubs]);

  const entitiesLoading = entityKind === 'ngo' ? ngosLoading : entityKind === 'brand' ? brandsLoading : clubsLoading;

  const filteredEntities = useMemo(() => {
    const list = allEntities || [];
    const q = entitySearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(e => (e.name || '').toLowerCase().includes(q));
  }, [allEntities, entitySearch]);

  const selectedEntity = useMemo(
    () => allEntities.find(e => e.id === selectedEntityId) || null,
    [allEntities, selectedEntityId],
  );

  const handleAssign = async () => {
    if (!user || !selectedEntityId || !roleTitle) return;
    setSubmitting(true);
    try {
      const entityCollection = entityCollectionByKind[entityKind];
      const idField = entityIdFieldByKind[entityKind];
      const invitationIdField = invitationIdFieldByKind[entityKind];
      const role = rolesByKind[entityKind].find(r => r.value === roleTitle);
      const isPrimary = role?.isPrimary ?? false;

      // 1) Kullanıcı dokümanını güncelle
      const userPatch: Record<string, unknown> = {
        [idField]: selectedEntityId,
        roleTitle,
      };
      if (user.role !== 'super-admin') {
        userPatch.role = 'ngo-admin';
      }
      await updateDoc(doc(db, COLLECTIONS.users, user.id), userPatch);

      // 2) Sadece Genel Yönetici ise kuruluşun adminUserId'sini bu kullanıcıya bağla
      if (isPrimary) {
        try {
          await updateDoc(doc(db, entityCollection, selectedEntityId), {
            adminUserId: user.id,
          });
        } catch (entityErr) {
          console.warn('Entity adminUserId güncellenemedi:', entityErr);
        }
      }

      // 3) userInvitations koleksiyonuna kabul edilmiş davet kaydı ekle
      try {
        await addDoc(collection(db, COLLECTIONS.userInvitations), {
          [invitationIdField]: selectedEntityId,
          inviteeUserId: user.id,
          role: roleTitle,
          status: 'accepted',
          invitedBy: 'super-admin',
          invitedAt: serverTimestamp(),
          autoAcceptedBy: 'super-admin',
        });
      } catch (invErr) {
        console.warn('userInvitations kaydı oluşturulamadı:', invErr);
      }

      toast({
        title: 'Yetkilendirme Tamamlandı',
        description: `${user.name || 'Kullanıcı'} → ${selectedEntity?.name || 'kuruluş'} (${roleTitle}).`,
      });
      onOpenChange(false);
    } catch (e) {
      console.error('Yetkilendirme başarısız:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Yetkilendirme başarısız',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const roleOptions = rolesByKind[entityKind];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-purple-600" />
            Yetkilendir
          </DialogTitle>
          <DialogDescription>
            <span className="font-bold">{user.name || 'Kullanıcı'}</span> için entity türü, kuruluş ve rol seçin. Atama anında uygulanır ve kabul edilmiş davet kaydı oluşturulur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Entity Türü */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Entity Türü</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(entityKindLabels) as EntityKind[]).map(kind => {
                const Icon = kind === 'ngo' ? Building2 : kind === 'brand' ? Briefcase : GraduationCap;
                const active = entityKind === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setEntityKind(kind)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all font-bold text-xs',
                      active
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-black/10 bg-background hover:border-purple-300',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {entityKindLabels[kind]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kuruluş seç */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Kuruluş</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`${entityKindLabels[entityKind]} ara...`}
                className="pl-9 h-9 rounded-xl"
                value={entitySearch}
                onChange={e => setEntitySearch(e.target.value)}
              />
            </div>
            <div className="max-h-56 overflow-y-auto border rounded-xl divide-y bg-background">
              {entitiesLoading && (
                <div className="p-6 flex items-center justify-center text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yükleniyor...
                </div>
              )}
              {!entitiesLoading && filteredEntities.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground italic">
                  Eşleşen {entityKindLabels[entityKind].toLowerCase()} bulunamadı.
                </div>
              )}
              {!entitiesLoading && filteredEntities.map(entity => {
                const active = selectedEntityId === entity.id;
                return (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => setSelectedEntityId(entity.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 text-left transition-colors',
                      active ? 'bg-purple-50' : 'hover:bg-muted/40',
                    )}
                  >
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage src={entity.logoUrl} alt={entity.name} />
                      <AvatarFallback className="text-xs font-black">
                        {(entity.name || '?').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{entity.name || 'İsimsiz'}</p>
                      {entity.category && (
                        <p className="text-[11px] text-muted-foreground truncate">{entity.category}</p>
                      )}
                    </div>
                    {active && (
                      <Badge variant="default" className="text-[9px] font-black uppercase tracking-widest bg-purple-600">
                        Seçildi
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rol</Label>
            <Select value={roleTitle} onValueChange={(v) => setRoleTitle(v)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Rol seçin" /></SelectTrigger>
              <SelectContent>
                {roleOptions.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}{r.isPrimary ? ' (birincil)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Birincil rol (Genel Yönetici) seçilirse, kuruluşun <code className="text-[10px] bg-muted px-1 py-0.5 rounded">adminUserId</code> alanı bu kullanıcıya bağlanır.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
            İptal
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedEntityId || !roleTitle || submitting}
            className="rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ata
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function UsersPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [viewingUser, setViewingUser] = useState<UserRow | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserRow | null>(null);
  const [permError, setPermError] = useState<string | null>(null);

  const usersQuery = useMemoFirebase(() => collection(db, COLLECTIONS.users), [db]);
  const { data: users, isLoading, error: usersError } = useCollection<UserRow>(usersQuery);

  React.useEffect(() => {
    if (!usersError) { setPermError(null); return; }
    const code = (usersError as { code?: string } | null)?.code;
    const msg = usersError instanceof Error ? usersError.message : 'Bilinmeyen hata.';
    const friendly = code === 'permission-denied'
      ? 'Bu sayfayı görüntülemek için super-admin yetkisi gerekli. (Firestore: users koleksiyonu erişimi reddedildi.)'
      : msg;
    setPermError(friendly);
    toast({
      variant: 'destructive',
      title: 'Kullanıcılar yüklenemedi',
      description: friendly,
    });
  }, [usersError, toast]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const lower = searchTerm.toLowerCase();
    const matched = !searchTerm
      ? [...users]
      : users.filter(u =>
        (u.name || '').toLowerCase().includes(lower) ||
        (u.personalInfo?.email || '').toLowerCase().includes(lower) ||
        (u.username || '').toLowerCase().includes(lower) ||
        (u.personalInfo?.phone || '').includes(lower),
      );

    // En yeni kullanıcı en üstte: createdAt → joinDate → fallback (eklenme sırası)
    const ts = (u: UserRow): number => {
      const c = (u as UserRow & { createdAt?: unknown }).createdAt;
      const maybeDate = c as { toDate?: () => Date } | null;
      if (maybeDate?.toDate) {
        try { return maybeDate.toDate().getTime(); } catch { /* ignore */ }
      }
      if (typeof c === 'string') {
        const t = Date.parse(c);
        if (!Number.isNaN(t)) return t;
      }
      const joinDate = (u as UserRow & { joinDate?: unknown }).joinDate;
      if (typeof joinDate === 'string') {
        const t = Date.parse(joinDate);
        if (!Number.isNaN(t)) return t;
      }
      return 0;
    };
    return matched.sort((a, b) => ts(b) - ts(a));
  }, [searchTerm, users]);

  const handleToggleStatus = async (userId: string, name: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Aktif' ? 'Askıda' : 'Aktif';
    try {
      await updateDoc(doc(db, COLLECTIONS.users, userId), { status: newStatus });
      toast({
        title: 'Kullanıcı Durumu Güncellendi',
        description: `${name} → ${newStatus.toLowerCase()}.`,
      });
    } catch (e) {
      console.error('Toggle status failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Güncelleme başarısız',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    }
  };

  const handleDelete = async (user: UserRow) => {
    try {
      // Önce `disabled: true` flag'i yaz ki tekrar giriş engellensin,
      // ardından Firestore dokümanını sil. (Auth hesabı manuel silinmelidir.)
      try {
        await updateDoc(doc(db, COLLECTIONS.users, user.id), {
          disabled: true,
          disabledAt: serverTimestamp(),
        });
      } catch (flagErr) {
        console.warn('disabled flag yazılamadı:', flagErr);
      }
      await deleteDoc(doc(db, COLLECTIONS.users, user.id));
      toast({
        variant: 'destructive',
        title: 'Kullanıcı Silindi',
        description: `${user.name || 'Kullanıcı'} kaydı silindi ve disabled flag işlendi. Firebase Auth hesabı Console üzerinden ayrıca silinmelidir.`,
      });
    } catch (e) {
      console.error('Delete failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Silme başarısız',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    }
  };

  const [bulkEmail, setBulkEmail] = useState('');
  const [bulkProgress, setBulkProgress] = useState<{ deleted: number; failed: number } | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const matchingByEmail = useMemo(() => {
    if (!users || !bulkEmail.trim()) return [];
    const target = bulkEmail.trim().toLowerCase();
    return users.filter(u => (u.personalInfo?.email || '').toLowerCase() === target);
  }, [users, bulkEmail]);

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    let deleted = 0;
    let failed = 0;
    for (const u of matchingByEmail) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.users, u.id));
        deleted++;
      } catch (e) {
        console.error(`Bulk delete failed for ${u.id}:`, e);
        failed++;
      }
    }
    setBulkProgress({ deleted, failed });
    setBulkDeleting(false);
    toast({
      variant: failed > 0 ? 'destructive' : 'default',
      title: 'Toplu silme tamamlandı',
      description: `${deleted} kayıt silindi${failed > 0 ? `, ${failed} hata` : ''}. Firebase Auth hesapları ayrıca silinmelidir.`,
    });
  };

  const handleSendVerification = async (user: UserRow) => {
    try {
      // Doğrulama isteği kaydı (gerçek SMS/e-mail gönderimi yetkili bir backend job ile yapılır)
      const channels: string[] = [];
      const email = user.personalInfo?.email;
      if (email) channels.push('email');
      if (user.personalInfo?.phone) channels.push('sms');

      await updateDoc(doc(db, COLLECTIONS.users, user.id), {
        verificationRequestedAt: new Date().toISOString(),
        verificationRequestedChannels: channels,
      });

      // Firebase Auth client SDK başka bir kullanıcıya doğrudan sendEmailVerification atamaz
      // (hedef User nesnesi gerekir). E-posta varsa kullanıcıya en azından bir "şifre sıfırlama"
      // bağlantısı göndererek hesabını aktif olarak doğrulama imkanı sun.
      let authEmailSent = false;
      if (email) {
        try {
          await initiatePasswordResetEmail(auth, email);
          authEmailSent = true;
        } catch (authErr) {
          console.warn('Auth verification email could not be triggered client-side:', authErr);
        }
      }

      toast({
        title: 'Doğrulama Talebi Gönderildi',
        description: channels.length === 0
          ? 'Kullanıcının e-posta ve telefon bilgisi yok; talep oluşturuldu fakat gönderim kanalı yok.'
          : authEmailSent
            ? `${email} adresine Firebase Auth üzerinden doğrulama/sıfırlama maili gönderildi. SMS yetkili backend job tarafından iletilecek.`
            : 'Doğrulama e-postası ve SMS yetkili backend job tarafından gönderilecek.',
      });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen hata.';
      toast({
        variant: 'destructive',
        title: 'Doğrulama gönderilemedi',
        description: code === 'permission-denied' ? 'Süper admin yetkisi gerekli.' : message,
      });
    }
  };

  const handleSendPasswordReset = async (user: UserRow) => {
    const email = user.personalInfo?.email?.trim();
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'E-posta yok',
        description: 'Bu kullanıcının kayıtlı bir e-posta adresi olmadığı için şifre sıfırlama maili gönderilemez.',
      });
      return;
    }
    try {
      await initiatePasswordResetEmail(auth, email);
      try {
        await updateDoc(doc(db, COLLECTIONS.users, user.id), {
          passwordResetRequestedAt: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn('Failed to log passwordResetRequestedAt:', logErr);
      }
      toast({
        title: 'Şifre Sıfırlama Maili Gönderildi',
        description: `${email} adresine Firebase Auth üzerinden şifre sıfırlama bağlantısı gönderildi.`,
      });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen hata.';
      toast({
        variant: 'destructive',
        title: 'Sıfırlama maili gönderilemedi',
        description: code === 'auth/user-not-found'
          ? 'Bu e-posta ile eşleşen Firebase Auth hesabı bulunamadı.'
          : code === 'auth/invalid-email'
            ? 'Geçersiz e-posta adresi.'
            : message,
      });
    }
  };

  const handleAdminPasswordChange = (user: UserRow) => {
    // Firebase client SDK başka kullanıcının şifresini değiştiremez; admin SDK gerekir.
    toast({
      title: 'Backend gerektiriyor',
      description: `Doğrudan şifre değiştirme için /api/admin/users/${user.id}/reset-password endpoint'i kurulmalı. Bu kurulana kadar lütfen "Şifre Sıfırlama Maili" gönderin.`,
    });
  };

  const handleSaveUser = async (userId: string, patch: Record<string, unknown>) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.users, userId), patch);
      toast({ title: 'Bilgiler Güncellendi', description: 'Kullanıcı bilgileri kaydedildi.' });
    } catch (e) {
      console.error('Save user failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Kaydedilemedi',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
      throw e;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Kullanıcılar Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Kullanıcı Yönetimi</h1>
        <p className="text-muted-foreground text-sm font-medium">Platformdaki tüm kullanıcıları görüntüleyin, düzenleyin, yetki ve durumunu yönetin.</p>
      </div>

      {permError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-red-800">Erişim hatası</p>
            <p className="text-xs text-red-700 leading-relaxed">{permError}</p>
          </div>
        </div>
      )}

      {/* E-postaya göre toplu silme — mükerrer profil temizliği için */}
      <Card className="rounded-[2rem] border-amber-200 bg-amber-50/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-amber-600" /> E-postaya Göre Toplu Sil
          </CardTitle>
          <CardDescription className="text-xs">
            Aynı e-posta ile oluşturulmuş tüm mükerrer Firestore user kayıtlarını siler. Auth hesapları Console'dan ayrıca silinmelidir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              type="email"
              placeholder="ornek@hangel.org"
              value={bulkEmail}
              onChange={e => { setBulkEmail(e.target.value); setBulkProgress(null); }}
              className="max-w-sm h-9 rounded-xl bg-background"
            />
            <Badge variant="outline" className="text-[11px]">
              {matchingByEmail.length} eşleşen kayıt
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={matchingByEmail.length === 0 || bulkDeleting}
                  className="rounded-xl"
                >
                  {bulkDeleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Hepsini Sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2rem]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">
                    {matchingByEmail.length} kayıt silinecek
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    "{bulkEmail}" e-postasıyla eşleşen {matchingByEmail.length} Firestore user kaydı silinecek. Bu işlem geri alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {matchingByEmail.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-1 text-xs bg-muted/30">
                    {matchingByEmail.map(u => (
                      <div key={u.id} className="flex justify-between gap-2">
                        <span className="truncate">{u.name || 'İsimsiz'}</span>
                        <code className="text-[10px] text-muted-foreground">{u.id.slice(0, 12)}…</code>
                      </div>
                    ))}
                  </div>
                )}
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
                  <AlertDialogAction
                    className={cn(buttonVariants({ variant: 'destructive' }), 'rounded-xl font-bold')}
                    onClick={handleBulkDelete}
                  >
                    Evet, {matchingByEmail.length} kaydı sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {bulkProgress && (
            <p className="text-xs text-muted-foreground">
              Son işlem: {bulkProgress.deleted} silindi, {bulkProgress.failed} hata.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-black/5 shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Platform Üyeleri ({users?.length || 0})</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İsim, @kullanıcı, e-posta, telefon..."
                className="pl-9 h-10 rounded-xl"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y border-t border-black/5">
            {filteredUsers.map(user => {
              const status = (user as UserRow & { status?: string }).status || 'Aktif';
              const isSuspended = status === 'Askıda';
              return (
                <div key={user.id} className={cn(
                  'p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors',
                  isSuspended && 'opacity-60',
                )}>
                  <button
                    type="button"
                    className="flex items-center gap-4 text-left flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    onClick={() => setViewingUser(user)}
                    title="Profili görüntüle"
                  >
                    <Avatar className="h-12 w-12 border shadow-sm">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback className="font-bold">{(user.name || '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[#1d1d1f] truncate">{user.name || 'İsimsiz'}</p>
                        <Badge variant={user.role === 'super-admin' ? 'default' : user.role === 'ngo-admin' ? 'secondary' : 'outline'} className="text-[9px] font-black uppercase tracking-widest">
                          {roleLabel[user.role || 'user']}
                        </Badge>
                        {isSuspended && <Badge variant="secondary" className="text-[9px] font-black uppercase">ASKIDA</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium truncate">
                        {user.personalInfo?.email || '—'}
                        {user.username && ` • ${user.username}`}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <Button variant="outline" size="sm" className="rounded-xl font-bold h-9" onClick={() => setViewingUser(user)}>
                      <Eye className="mr-2 h-4 w-4" /> Görüntüle
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold h-9" onClick={() => setEditingUser(user)}>
                      <Pencil className="mr-2 h-4 w-4" /> Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-bold h-9 text-purple-700 border-purple-300 hover:bg-purple-50"
                      onClick={() => setAssigningUser(user)}
                      title="STK / Marka / Kulüp yöneticisi olarak yetkilendir"
                    >
                      <UserPlus className="mr-2 h-4 w-4" /> Yetkilendir
                    </Button>
                    {!(user as UserRow & { verified?: boolean }).verified && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl font-bold h-9 text-amber-700 border-amber-300 hover:bg-amber-50"
                        onClick={() => handleSendVerification(user)}
                        title="Doğrulama maili ve SMS gönder"
                      >
                        <MailCheck className="mr-2 h-4 w-4" /> Doğrula
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-bold h-9 text-blue-700 border-blue-300 hover:bg-blue-50"
                      onClick={() => handleSendPasswordReset(user)}
                      title="Firebase Auth üzerinden şifre sıfırlama maili gönder"
                    >
                      <KeyRound className="mr-2 h-4 w-4" /> Şifre Sıfırla
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-bold h-9 text-muted-foreground"
                      onClick={() => handleAdminPasswordChange(user)}
                      title="Şifreyi doğrudan değiştir (backend endpoint gerektirir)"
                    >
                      <ShieldQuestion className="mr-2 h-4 w-4" /> Şifre Değiştir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-bold h-9"
                      onClick={() => handleToggleStatus(user.id, user.name || 'Kullanıcı', status)}
                    >
                      {isSuspended ? 'Aktif Et' : 'Askıya Al'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl" aria-label="Sil">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2rem]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold">{user.name || 'Kullanıcı'} siliniyor</AlertDialogTitle>
                          <AlertDialogDescription className="text-base font-medium">
                            Bu işlem geri alınamaz. Firestore'daki kullanıcı dokümanı silinir.
                            Bu işlem kullanıcının erişimini engeller (<code className="text-[11px] bg-muted px-1 py-0.5 rounded">disabled: true</code> flag) ancak Firebase Auth hesabı manuel silinmelidir (Console &gt; Auth).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
                          <AlertDialogAction
                            className={cn(buttonVariants({ variant: 'destructive' }), 'rounded-xl font-bold')}
                            onClick={() => handleDelete(user)}>
                            Evet, Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <div className="p-16 text-center text-muted-foreground italic">Eşleşen kullanıcı bulunamadı.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(o) => !o && setEditingUser(null)}
        onSave={handleSaveUser}
      />
      <ProfileViewDialog
        user={viewingUser}
        open={!!viewingUser}
        onOpenChange={(o) => !o && setViewingUser(null)}
      />
      <AssignEntityDialog
        user={assigningUser}
        open={!!assigningUser}
        onOpenChange={(o) => !o && setAssigningUser(null)}
      />
    </div>
  );
}
