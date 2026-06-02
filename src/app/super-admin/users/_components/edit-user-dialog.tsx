'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ShieldAlert, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { Timestamp, deleteField } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { useToast } from '@/hooks/use-toast';
import { LocationFields } from '@/components/shared/location-fields';
import type { UserRow } from './types';

type EducationRow = { level: string; school: string };
type EmergencyContactRow = { name: string; phone: string };

// Edit dialog — kullanıcı profilinin tamamını düzenler
export const EditUserDialog = ({ user, open, onOpenChange, onSave }: {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (id: string, patch: Record<string, unknown>) => Promise<void>;
}) => {
  // Temel
  // React 19 purity: Date.now() not callable in render path. Snapshot once on mount.
  const [nowMs] = useState<number>(() => Date.now());
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
  // PDF-29 — Gönüllülük detayları (CSV string olarak edit, save'de array'e dönüştürülür)
  const [skillsCsv, setSkillsCsv] = useState('');
  const [interestsCsv, setInterestsCsv] = useState('');
  const [languagesCsv, setLanguagesCsv] = useState('');
  const [programsCsv, setProgramsCsv] = useState('');
  const [licensesCsv, setLicensesCsv] = useState('');
  const [sector, setSector] = useState('');
  const [position, setPosition] = useState('');
  // Derin gönüllülük alanları (CSV string olarak edit, save'de array'e dönüştürülür)
  const [dailySkillsCsv, setDailySkillsCsv] = useState('');
  const [documentsCsv, setDocumentsCsv] = useState('');
  const [visasCsv, setVisasCsv] = useState('');
  // Eğitim geçmişi (satır satır)
  const [education, setEducation] = useState<EducationRow[]>([]);
  // Seyahat bilgileri
  const [domesticObstacle, setDomesticObstacle] = useState(false);
  const [internationalObstacle, setInternationalObstacle] = useState(false);
  // Acil durum & sağlık
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [hasChronicIllness, setHasChronicIllness] = useState(false);
  const [usesRegularMedication, setUsesRegularMedication] = useState(false);
  const [hasPhysicalLimitation, setHasPhysicalLimitation] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactRow[]>([]);
  // Adres (detay)
  const [neighborhood, setNeighborhood] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  // 30-günlük STK seçim kilidi başlangıç tarihi — son STK seçim değişikliği
  // ngo profil sayfası ve settings/ngo-selection burayı kontrol eder.
  const [ngoLockSince, setNgoLockSince] = useState(''); // YYYY-MM-DD

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // Ülke / İl / İlçe / Mahalle: LocationFields cascading bileşeni içeride yönetir
  // (parent değişince child reset).

  const handleAvatarFile = async (file: File) => {
    if (!user?.id) return;
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Geçersiz dosya', description: 'Lütfen bir görsel dosyası seçin.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'Maksimum 5MB.' });
      return;
    }
    setUploadingAvatar(true);
    try {
      const storage = getStorage(getApp());
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `users/${user.id}/avatar-${Date.now()}-${safeName}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file, { contentType: file.type });
      const url = await getDownloadURL(ref);
      setAvatarUrl(url);
      toast({ title: 'Yüklendi', description: 'Profil fotoğrafı Storage\'a yüklendi. Kaydet butonuna basmayı unutmayın.' });
    } catch (e) {
      const err = e as { message?: string };
      toast({ variant: 'destructive', title: 'Yüklenemedi', description: err.message || 'Beklenmeyen hata.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

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
      const vi = (user.volunteerInfo || {}) as Partial<{
        profession: string | null;
        skills: string[];
        interests: string[];
        languages: string[];
        programs: string[];
        licenses: string[];
        sector: string | null;
        position: string | null;
        dailySkills: string[];
        documents: string[];
        education: EducationRow[];
        travelInfo: {
          domesticObstacle: boolean;
          internationalObstacle: boolean;
          visas: string[];
        };
        emergency: {
          available: boolean;
          hasChronicIllness: boolean;
          usesRegularMedication: boolean;
          hasPhysicalLimitation: boolean;
          emergencyContacts: EmergencyContactRow[];
        };
      }>;

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
      setNeighborhood(addr.neighborhood || '');
      setFullAddress(addr.fullAddress || '');

      setInstagram(social.instagram || '');
      setTwitter(social.twitter || '');
      setLinkedin(social.linkedin || '');
      setGithub(social.github || '');
      setBehance(social.behance || '');

      setProfession(vi.profession || '');
      setSector(vi.sector || '');
      setPosition(vi.position || '');
      setSkillsCsv((vi.skills || []).join(', '));
      setInterestsCsv((vi.interests || []).join(', '));
      setLanguagesCsv((vi.languages || []).join(', '));
      setProgramsCsv((vi.programs || []).join(', '));
      setLicensesCsv((vi.licenses || []).join(', '));

      setDailySkillsCsv((vi.dailySkills || []).join(', '));
      setDocumentsCsv((vi.documents || []).join(', '));
      setVisasCsv((vi.travelInfo?.visas || []).join(', '));
      setEducation((vi.education || []).map(e => ({ level: e?.level || '', school: e?.school || '' })));
      setDomesticObstacle(vi.travelInfo?.domesticObstacle ?? false);
      setInternationalObstacle(vi.travelInfo?.internationalObstacle ?? false);
      setEmergencyAvailable(vi.emergency?.available ?? false);
      setHasChronicIllness(vi.emergency?.hasChronicIllness ?? false);
      setUsesRegularMedication(vi.emergency?.usesRegularMedication ?? false);
      setHasPhysicalLimitation(vi.emergency?.hasPhysicalLimitation ?? false);
      setEmergencyContacts((vi.emergency?.emergencyContacts || []).map(c => ({ name: c?.name || '', phone: c?.phone || '' })));

      // lastNgoSelectionChange okunması — Firestore Timestamp veya seconds objesi olabilir
      const rawLock = (user as unknown as { lastNgoSelectionChange?: { toDate?: () => Date; seconds?: number } | null }).lastNgoSelectionChange;
      let lockDate: Date | null = null;
      if (rawLock && typeof rawLock.toDate === 'function') lockDate = rawLock.toDate();
      else if (rawLock && typeof rawLock.seconds === 'number') lockDate = new Date(rawLock.seconds * 1000);
      setNgoLockSince(lockDate ? lockDate.toISOString().slice(0, 10) : '');
    }
  }, [user]);

  const csvToArray = (s: string): string[] =>
    s.split(',').map(x => x.trim()).filter(Boolean);

  // Eğitim satırları
  const addEducationRow = () => setEducation(prev => [...prev, { level: '', school: '' }]);
  const removeEducationRow = (index: number) => setEducation(prev => prev.filter((_, i) => i !== index));
  const updateEducationRow = (index: number, field: keyof EducationRow, value: string) =>
    setEducation(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  // Acil durum kişileri
  const addEmergencyContact = () => setEmergencyContacts(prev => [...prev, { name: '', phone: '' }]);
  const removeEmergencyContact = (index: number) => setEmergencyContacts(prev => prev.filter((_, i) => i !== index));
  const updateEmergencyContact = (index: number, field: keyof EmergencyContactRow, value: string) =>
    setEmergencyContacts(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const prevPi = (user.personalInfo || {}) as Record<string, unknown>;
      const prevAddress = ((prevPi.address as Record<string, unknown>) || {});
      const prevSocial = ((prevPi.social as Record<string, unknown>) || {});
      const prevVi = (user.volunteerInfo || {}) as Record<string, unknown>;
      const prevTravel = ((prevVi.travelInfo as Record<string, unknown>) || {});
      const prevEmergency = ((prevVi.emergency as Record<string, unknown>) || {});

      // 30-günlük STK seçim kilidi: süper-admin tarihi değiştirebilir veya
      // tamamen silebilir (boş bırakırsa). Boş → deleteField (alanı kaldırır,
      // sıfırdan limit yazılmamış kabul edilir).
      const lockPayload: { lastNgoSelectionChange?: Timestamp | ReturnType<typeof deleteField> } = {};
      if (ngoLockSince.trim()) {
        const d = new Date(ngoLockSince + 'T00:00:00');
        if (!isNaN(d.getTime())) lockPayload.lastNgoSelectionChange = Timestamp.fromDate(d);
      } else {
        // Eski değer vardı ama admin boşalttı → alanı sil (kilit kalksın)
        const hadLock = !!(user as unknown as { lastNgoSelectionChange?: unknown }).lastNgoSelectionChange;
        if (hadLock) lockPayload.lastNgoSelectionChange = deleteField();
      }

      await onSave(user.id, {
        ...lockPayload,
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
            neighborhood: neighborhood.trim(),
            fullAddress: fullAddress.trim(),
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
          sector: sector.trim() || null,
          position: position.trim() || null,
          skills: csvToArray(skillsCsv),
          interests: csvToArray(interestsCsv),
          languages: csvToArray(languagesCsv),
          programs: csvToArray(programsCsv),
          licenses: csvToArray(licensesCsv),
          dailySkills: csvToArray(dailySkillsCsv),
          documents: csvToArray(documentsCsv),
          education: education
            .map(e => ({ level: e.level.trim(), school: e.school.trim() }))
            .filter(e => e.level || e.school),
          travelInfo: {
            ...prevTravel,
            domesticObstacle,
            internationalObstacle,
            visas: csvToArray(visasCsv),
          },
          emergency: {
            ...prevEmergency,
            available: emergencyAvailable,
            hasChronicIllness,
            usesRegularMedication,
            hasPhysicalLimitation,
            emergencyContacts: emergencyContacts
              .map(c => ({ name: c.name.trim(), phone: c.phone.trim() }))
              .filter(c => c.name || c.phone),
          },
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
              <Avatar className="h-20 w-20 border-2 border-white shadow">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xl font-black">{(name || '?').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Label className="text-xs">Profil Fotoğrafı</Label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) void handleAvatarFile(f);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold"
                    disabled={uploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {uploadingAvatar ? 'Yükleniyor…' : 'Fotoğraf Yükle'}
                  </Button>
                  {avatarUrl && (
                    <Button type="button" variant="ghost" size="sm" className="rounded-xl text-destructive" onClick={() => setAvatarUrl('')}>
                      Kaldır
                    </Button>
                  )}
                </div>
                <Input
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="veya doğrudan URL yapıştırın"
                  className="rounded-xl text-xs"
                />
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

          {/* STK Seçim Kilidi (30 günlük) */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">STK Seçim Kilidi (30 Gün)</p>
            <div className="space-y-2">
              <Label className="text-xs">Son seçim değişikliği tarihi</Label>
              <Input
                type="date"
                value={ngoLockSince}
                onChange={(e) => setNgoLockSince(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Kullanıcı STK seçim/değişiklik kilidi bu tarihten itibaren 30 gün sürer.
                {ngoLockSince && (() => {
                  const start = new Date(ngoLockSince + 'T00:00:00');
                  const ends = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
                  // Why: React 19 purity rule — Date.now() impure. nowRef stable per mount.
                  const remaining = Math.max(0, Math.ceil((ends.getTime() - nowMs) / (24 * 60 * 60 * 1000)));
                  return (
                    <>
                      {' '}Bitiş: <strong>{ends.toLocaleDateString('tr-TR')}</strong> ({remaining > 0 ? `${remaining} gün kaldı` : 'süre doldu'}).
                    </>
                  );
                })()}
                {!ngoLockSince && ' Alanı boş bırakırsanız kilit tamamen kaldırılır.'}
              </p>
            </div>
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

          {/* Adres — LocationFields (cascading + bayraklı ülke + İstanbul/Ankara/İzmir pinned).
              fullAddress (sokak/açık adres) ayrı text input olarak korunur. */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Adres</p>
            <LocationFields
              value={{
                country: country || 'Türkiye',
                city,
                district,
                neighborhood,
                openAddress: fullAddress,
              }}
              onChange={(next) => {
                setCountry(next.country ?? '');
                setCity(next.city ?? '');
                setDistrict(next.district ?? '');
                setNeighborhood(next.neighborhood ?? '');
                setFullAddress(next.openAddress ?? '');
              }}
              showCountry
              showOpenAddress
              labelOpenAddress="Açık Adres"
            />
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

          {/* Gönüllü Bilgileri (genişletilmiş) */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gönüllülük Bilgileri</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Meslek</Label>
                <Input value={profession} onChange={e => setProfession(e.target.value)} placeholder="Yazılım Geliştirici" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Sektör</Label>
                <Input value={sector} onChange={e => setSector(e.target.value)} placeholder="Teknoloji" className="rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Pozisyon</Label>
                <Input value={position} onChange={e => setPosition(e.target.value)} placeholder="Senior Engineer" className="rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Yetenekler (virgülle ayırın)</Label>
                <Input value={skillsCsv} onChange={e => setSkillsCsv(e.target.value)} placeholder="Liderlik, İletişim, Web Geliştirme" className="rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>İlgi Alanları (virgülle ayırın)</Label>
                <Input value={interestsCsv} onChange={e => setInterestsCsv(e.target.value)} placeholder="Eğitim, Çevre, Hayvan Hakları" className="rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Sosyal Yetkinlikler (virgülle ayırın)</Label>
                <Input value={dailySkillsCsv} onChange={e => setDailySkillsCsv(e.target.value)} placeholder="Empati, Takım Çalışması" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Diller (virgülle ayırın)</Label>
                <Input value={languagesCsv} onChange={e => setLanguagesCsv(e.target.value)} placeholder="Türkçe, İngilizce" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Programlar/Sertifikalar</Label>
                <Input value={programsCsv} onChange={e => setProgramsCsv(e.target.value)} placeholder="İlk Yardım, AKUT" className="rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Ehliyetler (virgülle ayırın)</Label>
                <Input value={licensesCsv} onChange={e => setLicensesCsv(e.target.value)} placeholder="B sınıfı" className="rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Belgeler (virgülle ayırın)</Label>
                <Input value={documentsCsv} onChange={e => setDocumentsCsv(e.target.value)} placeholder="Pasaport, Sağlık Raporu" className="rounded-xl" />
              </div>
            </div>
          </div>

          {/* Eğitim Geçmişi */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Eğitim Geçmişi</p>
              <Button type="button" variant="outline" size="sm" onClick={addEducationRow} className="rounded-xl font-bold h-8 gap-1">
                <Plus className="h-3.5 w-3.5" /> Ekle
              </Button>
            </div>
            {education.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Henüz eğitim bilgisi yok. Eklemek için “Ekle” butonunu kullanın.</p>
            ) : (
              <div className="space-y-3">
                {education.map((row, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Seviye</Label>
                      <Input value={row.level} onChange={e => updateEducationRow(i, 'level', e.target.value)} placeholder="Lisans" className="rounded-xl" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Okul</Label>
                      <Input value={row.school} onChange={e => updateEducationRow(i, 'school', e.target.value)} placeholder="Üniversite / Bölüm" className="rounded-xl" />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEducationRow(i)} className="rounded-xl text-destructive shrink-0" aria-label="Eğitim satırını sil">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seyahat Bilgileri */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Seyahat Bilgileri</p>
            <div className="space-y-2">
              <Label>Sahip Olunan Vizeler (virgülle ayırın)</Label>
              <Input value={visasCsv} onChange={e => setVisasCsv(e.target.value)} placeholder="Schengen, ABD" className="rounded-xl" />
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-xl">
              <Checkbox id="domestic-obstacle" checked={domesticObstacle} onCheckedChange={c => setDomesticObstacle(!!c)} />
              <Label htmlFor="domestic-obstacle" className="text-sm font-medium">Yurt içi seyahate engelim var.</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-xl">
              <Checkbox id="international-obstacle" checked={internationalObstacle} onCheckedChange={c => setInternationalObstacle(!!c)} />
              <Label htmlFor="international-obstacle" className="text-sm font-medium">Yurt dışı seyahate engelim var.</Label>
            </div>
          </div>

          {/* Acil Durum & Sağlık */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Acil Durum & Sağlık</p>
            <div className="flex items-center justify-between p-3 border rounded-xl">
              <Label htmlFor="emergency-available" className="font-medium">Acil durumlarda gönüllülüğe uygunum</Label>
              <Switch id="emergency-available" checked={emergencyAvailable} onCheckedChange={setEmergencyAvailable} />
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-xl">
              <Checkbox id="chronic-illness" checked={hasChronicIllness} onCheckedChange={c => setHasChronicIllness(!!c)} />
              <Label htmlFor="chronic-illness" className="text-sm">Kronik bir rahatsızlığım var.</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-xl">
              <Checkbox id="regular-medication" checked={usesRegularMedication} onCheckedChange={c => setUsesRegularMedication(!!c)} />
              <Label htmlFor="regular-medication" className="text-sm">Düzenli ilaç kullanıyorum.</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-xl">
              <Checkbox id="physical-limitation" checked={hasPhysicalLimitation} onCheckedChange={c => setHasPhysicalLimitation(!!c)} />
              <Label htmlFor="physical-limitation" className="text-sm">Fiziksel bir kısıtlamam var.</Label>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Acil Durum Kişileri</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEmergencyContact} className="rounded-xl font-bold h-8 gap-1">
                <Plus className="h-3.5 w-3.5" /> Ekle
              </Button>
            </div>
            {emergencyContacts.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Henüz acil durum kişisi yok. Eklemek için “Ekle” butonunu kullanın.</p>
            ) : (
              <div className="space-y-3">
                {emergencyContacts.map((row, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Ad Soyad</Label>
                      <Input value={row.name} onChange={e => updateEmergencyContact(i, 'name', e.target.value)} placeholder="Ad Soyad" className="rounded-xl" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Telefon</Label>
                      <Input type="tel" value={row.phone} onChange={e => updateEmergencyContact(i, 'phone', e.target.value)} placeholder="5XX..." className="rounded-xl" />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEmergencyContact(i)} className="rounded-xl text-destructive shrink-0" aria-label="Acil durum kişisini sil">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
