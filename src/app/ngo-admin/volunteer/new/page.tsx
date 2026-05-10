'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Country, State, City } from 'country-state-city';
import { allProvinces, districtsData, neighborhoodsData } from '@/lib/data';
import {
  PROFESSIONS, SKILLS, DAILY_SKILLS, INTERESTS,
  LANGUAGES, SIGN_LANGUAGES, DRIVER_LICENSES,
  CERTIFICATES, PROGRAMS, VISAS,
} from '@/lib/volunteer-data';

const allInterests = INTERESTS;
const allSkills = SKILLS;
const allDailySkills = DAILY_SKILLS;
const allLanguages = LANGUAGES;
const allSignLanguages = SIGN_LANGUAGES;
const allPrograms = PROGRAMS;
const allCertificates = CERTIFICATES;
const allDriverLicenses = DRIVER_LICENSES;
const allProfessions = PROFESSIONS;
const allVisas = VISAS;


const MultiSelect = ({ title, options, selected, onSelectedChange }: { title: string, options: string[], selected: string[], onSelectedChange: (selected: string[]) => void }) => {
  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal h-auto min-h-10">
            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selected.map((item) => (
                  <Badge key={item} variant="secondary" className="font-normal">{item}</Badge>
                ))}
              </div>
            ) : `${title} seçin...`}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={selected.includes(option)}
              onCheckedChange={(checked) => {
                if (checked) onSelectedChange([...selected, option]);
                else onSelectedChange(selected.filter((item) => item !== option));
              }}
            >
              {option}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const locationTypeMap: Record<string, 'Online' | 'Saha' | 'Hibrit'> = {
  online: 'Online',
  field: 'Saha',
  hybrid: 'Hibrit',
};

const commitmentMap: Record<string, string> = {
  'one-day': 'Tek Günlük',
  periodic: 'Dönemsel',
  continuous: 'Sürekli',
};

function NewOpportunityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser } = useUser();

  const entityId = searchParams.get('id') || authUser?.uid || null;

  const ngoDocRef = useMemoFirebase(() => {
    if (!db || !entityId) return null;
    return doc(db, 'ngos', entityId);
  }, [db, entityId]);
  const { data: ngoData } = useDoc<any>(ngoDocRef);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [socialArea, setSocialArea] = useState('');
  const [locationType, setLocationType] = useState('');
  const [country, setCountry] = useState('Türkiye');
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [applicationEnd, setApplicationEnd] = useState('');
  const [applicationEndTime, setApplicationEndTime] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [commitment, setCommitment] = useState('');
  const [commitmentDetail, setCommitmentDetail] = useState('');
  const [volunteerNeeded, setVolunteerNeeded] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [dailySkills, setDailySkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [professions, setProfessions] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [signLanguages, setSignLanguages] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<string[]>([]);
  const [driverLicenses, setDriverLicenses] = useState<string[]>([]);
  const [visas, setVisas] = useState<string[]>([]);
  const [education, setEducation] = useState('');
  const [domesticTravel, setDomesticTravel] = useState(false);
  const [internationalTravel, setInternationalTravel] = useState(false);
  const [transport, setTransport] = useState(false);
  const [food, setFood] = useState(false);
  const [accommodation, setAccommodation] = useState(false);
  const [preTraining, setPreTraining] = useState(false);
  const [providesCertificate, setProvidesCertificate] = useState(false);
  const [points, setPoints] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTurkey = country === 'Türkiye' || country === 'Turkey' || country === 'TR';

  const allCountriesList = useMemo(() => {
    return Country.getAllCountries()
      .map(c => ({ name: c.name, code: c.isoCode }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const countryISO = useMemo(() => {
    if (!country) return null;
    if (isTurkey) return 'TR';
    return Country.getAllCountries().find(c => c.name === country || c.isoCode === country)?.isoCode || null;
  }, [country, isTurkey]);

  const cityOptions = useMemo(() => {
    if (isTurkey) return (allProvinces || []).slice().sort((a, b) => a.localeCompare(b, 'tr'));
    if (!countryISO) return [];
    const states = State.getStatesOfCountry(countryISO).map(s => s.name);
    if (states.length > 0) return states.sort((a, b) => a.localeCompare(b));
    return City.getCitiesOfCountry(countryISO)?.map(c => c.name).sort((a, b) => a.localeCompare(b)) || [];
  }, [isTurkey, countryISO]);

  const districtOptions = useMemo(() => {
    if (cities.length === 0) return [];
    const set = new Set<string>();
    if (isTurkey) {
      cities.forEach(c => (districtsData[c] || []).forEach(d => set.add(d)));
    } else if (countryISO) {
      cities.forEach(cName => {
        const stateObj = State.getStatesOfCountry(countryISO).find(s => s.name === cName);
        if (stateObj) {
          City.getCitiesOfState(countryISO, stateObj.isoCode)?.forEach(c => set.add(c.name));
        }
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, isTurkey ? 'tr' : undefined));
  }, [isTurkey, countryISO, cities]);

  const neighborhoodOptions = useMemo(() => {
    if (!isTurkey || cities.length === 0 || districts.length === 0) return [];
    const set = new Set<string>();
    cities.forEach(c => {
      districts.forEach(d => {
        ((neighborhoodsData as any)?.[c]?.[d] || []).forEach((n: string) => set.add(n));
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [isTurkey, cities, districts]);

  // Üst seviye seçim değişince geçersiz alt seçimleri temizle
  React.useEffect(() => {
    setDistricts(prev => prev.filter(d => districtOptions.includes(d)));
  }, [districtOptions]);
  React.useEffect(() => {
    setNeighborhoods(prev => prev.filter(n => neighborhoodOptions.includes(n)));
  }, [neighborhoodOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entityId) {
      toast({ variant: 'destructive', title: 'Oturum bulunamadı', description: 'İlan yayınlamak için giriş yapmalısınız.' });
      return;
    }

    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Başlık gerekli', description: 'Lütfen ilan başlığını girin.' });
      return;
    }
    if (!locationType) {
      toast({ variant: 'destructive', title: 'Konum türü gerekli' });
      return;
    }
    if (!applicationEnd) {
      toast({ variant: 'destructive', title: 'Son başvuru tarihi gerekli' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        organization: ngoData?.name || 'Kuruluş',
        ngoId: entityId,
        socialArea,
        interests,
        location: {
          country: country.trim(),
          // Geriye dönük uyumluluk için virgülle birleştirilmiş string + multi-select array'ler
          city: cities.join(', '),
          district: districts.join(', '),
          neighborhood: neighborhoods.join(', '),
          cities,
          districts,
          neighborhoods,
          type: locationTypeMap[locationType] || 'Saha',
        },
        commitment: [commitmentMap[commitment], commitmentDetail.trim()].filter(Boolean).join(' — '),
        volunteerCount: {
          needed: Number(volunteerNeeded) || 0,
          applications: 0,
        },
        dates: {
          applicationStart: new Date().toISOString().slice(0, 10),
          applicationEnd,
          applicationEndTime: applicationEndTime || null,
          eventStart: eventStart || applicationEnd,
          eventStartTime: eventStartTime || null,
          eventEnd: eventEnd || eventStart || applicationEnd,
          eventEndTime: eventEndTime || null,
        },
        hours: {
          start: eventStartTime || '',
          end: eventEndTime || '',
          total: 0,
        },
        skills,
        dailySkills,
        professions,
        languages,
        signLanguages,
        programs,
        certificates,
        driverLicenses,
        requirements: [...certificates, ...driverLicenses],
        travel: {
          domestic: domesticTravel,
          international: internationalTravel,
          visas,
        },
        amenities: {
          transport,
          food,
          accommodation,
          preTraining,
          providesCertificate,
        },
        education: education || null,
        points: Number(points) || 0,
        status: 'Beklemede',
        createdAt: serverTimestamp(),
        createdBy: authUser?.uid || null,
      };

      await addDoc(collection(db, 'volunteering'), payload);

      toast({
        title: 'İlan Onaya Gönderildi',
        description: 'Gönüllülük ilanınız süper admin onayından sonra yayına alınacaktır.',
      });
      const backHref = entityId && searchParams.get('id')
        ? `/ngo-admin/volunteer?id=${searchParams.get('id')}`
        : '/ngo-admin/volunteer';
      router.push(backHref);
    } catch (err: any) {
      console.error('Failed to publish opportunity:', err);
      toast({
        variant: 'destructive',
        title: 'İlan yayınlanamadı',
        description: err?.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yeni Gönüllülük İlanı Oluştur</h1>
        <p className="text-muted-foreground">Kuruluşunuz için yeni bir gönüllülük fırsatı yayınlayın.</p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Temel İlan Bilgileri</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">İlan Başlığı</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Afet Bölgesi Yardım Dağıtımı" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">İlan Açıklaması</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Gönüllülerden beklentileri, yapılacak işleri ve projenin amacını detaylıca açıklayın." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialArea">Sosyal Alan</Label>
              <Select value={socialArea} onValueChange={setSocialArea}>
                <SelectTrigger id="socialArea"><SelectValue placeholder="İlanın ilgili olduğu sosyal alanı seçin..." /></SelectTrigger>
                <SelectContent>
                  {allInterests.map(interest => <SelectItem key={interest} value={interest}>{interest}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Konum ve Zamanlama</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationType">Konum Türü</Label>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger id="locationType"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="field">Saha</SelectItem>
                  <SelectItem value="hybrid">Hibrit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Ülke</Label>
                <Select
                  value={country}
                  onValueChange={(v) => { setCountry(v); setCities([]); setDistricts([]); setNeighborhoods([]); }}
                >
                  <SelectTrigger id="country"><SelectValue placeholder="Ülke seçin..." /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="Türkiye">Türkiye</SelectItem>
                    {allCountriesList.filter(c => c.name !== 'Turkey').map(c => (
                      <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {cityOptions.length > 0 ? (
                <MultiSelect
                  title={isTurkey ? 'İl' : 'Şehir'}
                  options={cityOptions}
                  selected={cities}
                  onSelectedChange={setCities}
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="city">{isTurkey ? 'İl' : 'Şehir'}</Label>
                  <Input id="city" value={cities[0] || ''} onChange={e => setCities(e.target.value ? [e.target.value] : [])} placeholder="Şehir girin" />
                </div>
              )}
              {districtOptions.length > 0 ? (
                <MultiSelect
                  title={isTurkey ? 'İlçe' : 'Bölge'}
                  options={districtOptions}
                  selected={districts}
                  onSelectedChange={setDistricts}
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="district">{isTurkey ? 'İlçe' : 'Bölge'}</Label>
                  <Input id="district" value={districts[0] || ''} onChange={e => setDistricts(e.target.value ? [e.target.value] : [])} placeholder="İlçe girin" />
                </div>
              )}
              {isTurkey && neighborhoodOptions.length > 0 ? (
                <MultiSelect
                  title="Mahalle"
                  options={neighborhoodOptions}
                  selected={neighborhoods}
                  onSelectedChange={setNeighborhoods}
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Mahalle</Label>
                  <Input id="neighborhood" value={neighborhoods[0] || ''} onChange={e => setNeighborhoods(e.target.value ? [e.target.value] : [])} placeholder="Mahalle girin" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicationEnd">Son Başvuru Tarihi</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input id="applicationEnd" type="date" value={applicationEnd} onChange={e => setApplicationEnd(e.target.value)} required />
                  <Input id="applicationEndTime" type="time" value={applicationEndTime} onChange={e => setApplicationEndTime(e.target.value)} placeholder="Saat" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventStart">Gönüllülük Başlangıç Tarihi &amp; Saati</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input id="eventStart" type="date" value={eventStart} onChange={e => setEventStart(e.target.value)} />
                  <Input id="eventStartTime" type="time" value={eventStartTime} onChange={e => setEventStartTime(e.target.value)} placeholder="Saat" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventEnd">Gönüllülük Bitiş Tarihi &amp; Saati</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input id="eventEnd" type="date" value={eventEnd} onChange={e => setEventEnd(e.target.value)} min={eventStart || undefined} />
                  <Input id="eventEndTime" type="time" value={eventEndTime} onChange={e => setEventEndTime(e.target.value)} placeholder="Saat" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commitment">Çalışma Şekli</Label>
              <Select value={commitment} onValueChange={setCommitment}>
                <SelectTrigger id="commitment"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-day">Tek Günlük</SelectItem>
                  <SelectItem value="periodic">Dönemsel</SelectItem>
                  <SelectItem value="continuous">Sürekli</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commitment-detail">Çalışma Detayı</Label>
              <Input id="commitment-detail" value={commitmentDetail} onChange={e => setCommitmentDetail(e.target.value)} placeholder="Örn: Haftada 5 saat, 1 ay boyunca" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Aranan Gönüllü Profili ve Gereklilikler</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="volunteer-needed">Aranan Gönüllü Sayısı</Label>
              <Input id="volunteer-needed" type="number" value={volunteerNeeded} onChange={e => setVolunteerNeeded(e.target.value)} placeholder="50" />
            </div>
            <MultiSelect title="Hassasiyet / Sosyal Alanlar" options={allInterests} selected={interests} onSelectedChange={setInterests} />
            <MultiSelect title="Profesyonel Yetkinlikler" options={allSkills} selected={skills} onSelectedChange={setSkills} />
            <MultiSelect title="Günlük Hayat Yetkinlikleri" options={allDailySkills} selected={dailySkills} onSelectedChange={setDailySkills} />
            <MultiSelect title="İstenen Meslekler" options={allProfessions} selected={professions} onSelectedChange={setProfessions} />
            <MultiSelect title="İstenen Diller" options={allLanguages} selected={languages} onSelectedChange={setLanguages} />
            <MultiSelect title="İşaret Dilleri" options={allSignLanguages} selected={signLanguages} onSelectedChange={setSignLanguages} />
            <MultiSelect title="Bilgisi İstenen Programlar" options={allPrograms} selected={programs} onSelectedChange={setPrograms} />
            <MultiSelect title="Gerekli Sertifikalar" options={allCertificates} selected={certificates} onSelectedChange={setCertificates} />
            <MultiSelect title="Sürücü Belgeleri" options={allDriverLicenses} selected={driverLicenses} onSelectedChange={setDriverLicenses} />
            <div className="space-y-2">
              <Label htmlFor="education">Eğitim Seviyesi (İsteğe Bağlı)</Label>
              <Select value={education} onValueChange={setEducation}>
                <SelectTrigger id="education"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Farketmez</SelectItem>
                  <SelectItem value="high-school">Lise</SelectItem>
                  <SelectItem value="university">Üniversite</SelectItem>
                  <SelectItem value="graduate">Lisansüstü</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Seyahat Gereksinimleri</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Label htmlFor="domestic-travel" className="font-medium">Yurtiçi seyahat gerektiriyor mu?</Label>
              <Switch id="domestic-travel" checked={domesticTravel} onCheckedChange={setDomesticTravel} />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Label htmlFor="international-travel" className="font-medium">Yurtdışı seyahat gerektiriyor mu?</Label>
              <Switch id="international-travel" checked={internationalTravel} onCheckedChange={setInternationalTravel} />
            </div>
            <MultiSelect title="Gerekli Vizeler" options={allVisas} selected={visas} onSelectedChange={setVisas} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sağlanan İmkanlar ve Kazanımlar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <Checkbox id="amenity-transport" checked={transport} onCheckedChange={c => setTransport(!!c)} />
                <Label htmlFor="amenity-transport">Ulaşım</Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <Checkbox id="amenity-food" checked={food} onCheckedChange={c => setFood(!!c)} />
                <Label htmlFor="amenity-food">Yemek</Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <Checkbox id="amenity-accommodation" checked={accommodation} onCheckedChange={c => setAccommodation(!!c)} />
                <Label htmlFor="amenity-accommodation">Konaklama</Label>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Label htmlFor="pre-training" className="font-medium">Ön eğitim verilecek mi?</Label>
              <Switch id="pre-training" checked={preTraining} onCheckedChange={setPreTraining} />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Label htmlFor="provides-certificate" className="font-medium">Sertifika verilecek mi?</Label>
              <Switch id="provides-certificate" checked={providesCertificate} onCheckedChange={setProvidesCertificate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Kazandırılacak Sosyal Etki Puanı</Label>
              <Input id="points" type="number" value={points} onChange={e => setPoints(e.target.value)} placeholder="Örn: 500" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Yayınlanıyor...' : 'İlanı Yayınla'}
        </Button>
      </form>
    </div>
  );
}

export default function NewOpportunityPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <NewOpportunityForm />
    </Suspense>
  );
}
