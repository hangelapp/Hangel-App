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
import { ShieldAlert, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import type { UserRow } from './types';

// Edit dialog — kullanıcı profilinin tamamını düzenler
export const EditUserDialog = ({ user, open, onOpenChange, onSave }: {
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
  // PDF-29 — Gönüllülük detayları (CSV string olarak edit, save'de array'e dönüştürülür)
  const [skillsCsv, setSkillsCsv] = useState('');
  const [interestsCsv, setInterestsCsv] = useState('');
  const [languagesCsv, setLanguagesCsv] = useState('');
  const [programsCsv, setProgramsCsv] = useState('');
  const [licensesCsv, setLicensesCsv] = useState('');
  const [sector, setSector] = useState('');
  const [position, setPosition] = useState('');
  // Adres (detay)
  const [neighborhood, setNeighborhood] = useState('');
  const [fullAddress, setFullAddress] = useState('');

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
      const vi = (user.volunteerInfo || {}) as Partial<{
        profession: string | null;
        skills: string[];
        interests: string[];
        languages: string[];
        programs: string[];
        licenses: string[];
        sector: string | null;
        position: string | null;
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
    }
  }, [user]);

  const csvToArray = (s: string): string[] =>
    s.split(',').map(x => x.trim()).filter(Boolean);

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
              <div className="space-y-2">
                <Label>Mahalle</Label>
                <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Açık Adres</Label>
                <Input value={fullAddress} onChange={e => setFullAddress(e.target.value)} placeholder="Sokak, No, Daire" className="rounded-xl" />
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
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Daha derin gönüllü alanları (eğitim geçmişi, acil durum kişileri, sağlık durumu) kullanıcı kendi <code className="text-[10px] bg-muted px-1 py-0.5 rounded">/settings/volunteer</code> sayfasından düzenler.
            </p>
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
