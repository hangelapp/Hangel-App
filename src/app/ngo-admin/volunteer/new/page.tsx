'use client';

import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin } from 'lucide-react';
import { PlaceAutocomplete } from '@/components/shared/place-autocomplete';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Country, State, City } from 'country-state-city';
import { allProvinces, districtsData, neighborhoodsData } from '@/lib/data';
import {
  PROFESSIONS, SKILLS, DAILY_SKILLS, INTERESTS,
  LANGUAGES, SIGN_LANGUAGES, DRIVER_LICENSES,
  CERTIFICATES, PROGRAMS, VISAS,
} from '@/lib/volunteer-data';
import { COLLECTIONS } from '@/firebase/collections';
import { fireOrgLifecycle } from '@/lib/org-lifecycle-client';

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
        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-[60vh] overflow-y-auto overscroll-contain">
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

// EDIT modu ters eşlemeler: Firestore'da saklanan Türkçe değerden form
// state değerine geri döner (prefill için). locationTypeMap/commitmentMap'in
// tersi.
const locationTypeReverseMap: Record<string, string> = {
  Online: 'online',
  Saha: 'field',
  Hibrit: 'hybrid',
};

const commitmentReverseMap: Record<string, string> = {
  'Tek Günlük': 'one-day',
  Dönemsel: 'periodic',
  Sürekli: 'continuous',
};

// Saklanmış değer virgülle birleşik string ("A, B") ya da array olabilir.
// Array varsa onu, yoksa string'i virgülden ayırıp temizleyerek diziye çevir.
const toArray = (arr: unknown, str: unknown): string[] => {
  if (Array.isArray(arr)) return arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  if (typeof str === 'string' && str.trim()) return str.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

// Firestore'da saklanan gönüllülük ilanı — create form'un yazdığı tüm alanlar
// (Volunteering tipinde bulunmayan dailySkills/professions/taskTypeId vb. dahil).
type StoredVolunteering = {
  ngoId?: string;
  title?: string;
  description?: string;
  socialArea?: string;
  interests?: string[];
  location?: {
    country?: string;
    city?: string;
    district?: string;
    neighborhood?: string;
    cities?: string[];
    districts?: string[];
    neighborhoods?: string[];
    address?: string;
    lat?: string | number;
    lon?: string | number;
    type?: 'Online' | 'Saha' | 'Hibrit';
  };
  participationCondition?: string;
  commitment?: string;
  volunteerCount?: { needed?: number; applications?: number };
  dates?: {
    applicationEnd?: string;
    applicationEndTime?: string | null;
    eventStart?: string;
    eventStartTime?: string | null;
    eventEnd?: string;
    eventEndTime?: string | null;
  };
  skills?: string[];
  dailySkills?: string[];
  professions?: string[];
  languages?: string[];
  signLanguages?: string[];
  programs?: string[];
  certificates?: string[];
  driverLicenses?: string[];
  education?: string | null;
  travel?: { domestic?: boolean; international?: boolean; visas?: string[] };
  amenities?: {
    transport?: boolean;
    food?: boolean;
    accommodation?: boolean;
    preTraining?: boolean;
    providesCertificate?: boolean;
  };
  taskTypeId?: string;
  estimatedHours?: number;
};

function NewOpportunityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser } = useUser();
  // Yönetim sayfası (ngo-admin/volunteer) ilanları useActiveEntity().id ile sorgular.
  // Yeni ilan da AYNI aktif STK id'siyle yazılmalı; aksi halde ngoId admin'in user
  // uid'sine düşüp eşleşmiyor ve STK kendi ilanını göremiyordu (#8).
  const { id: activeId } = useActiveEntity();

  // EDIT modu: ?edit=<volunteeringId> varsa mevcut ilanı düzenliyoruz.
  const editId = searchParams.get('edit');
  const isEdit = !!editId;

  // Düzenlenecek ilanı yükle (edit modunda). Doc'tan gelen ngoId, edit modunda
  // backHref + ngoData lookup'ının doğru STK'ya işaret etmesini sağlar.
  const editDocRef = useMemoFirebase(() => {
    if (!db || !editId) return null;
    return doc(db, COLLECTIONS.volunteering, editId);
  }, [db, editId]);
  const { data: editOpp } = useDoc<StoredVolunteering>(editDocRef);

  // Create modunda entityId = ?id / aktif STK / kullanıcı uid.
  // Edit modunda entityId = yüklenen ilanın ngoId'si (doğru STK).
  const entityId = isEdit
    ? (editOpp?.ngoId || activeId || authUser?.uid || null)
    : (searchParams.get('id') || activeId || authUser?.uid || null);

  const ngoDocRef = useMemoFirebase(() => {
    if (!db || !entityId) return null;
    return doc(db, COLLECTIONS.ngos, entityId);
  }, [db, entityId]);
  const { data: ngoData } = useDoc<{ name?: string }>(ngoDocRef);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [socialArea, setSocialArea] = useState('');
  const [locationType, setLocationType] = useState('');
  const [country, setCountry] = useState('Türkiye');
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [meetingAddress, setMeetingAddress] = useState('');
  const [meetingLat, setMeetingLat] = useState('');
  const [meetingLon, setMeetingLon] = useState('');
  const [applicationEnd, setApplicationEnd] = useState('');
  const [applicationEndTime, setApplicationEndTime] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [participationCondition, setParticipationCondition] = useState('');
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
  const [taskTypeId, setTaskTypeId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // EDIT modu prefill: yüklenen ilan bir KEZ form state'ine doldurulur. Guard
  // (prefilledRef) sayesinde sonraki re-render/snapshot'larda kullanıcının
  // düzenlemeleri EZİLMEZ. Yüklenen ilanın volunteerCount.applications değerini
  // de tutuyoruz ki save'de sıfırlamayalım.
  const prefilledRef = useRef(false);
  const existingApplicationsRef = useRef(0);

  useEffect(() => {
    if (!isEdit || !editOpp || prefilledRef.current) return;
    prefilledRef.current = true;

    const o = editOpp;
    existingApplicationsRef.current = o.volunteerCount?.applications || 0;

    setTitle(o.title || '');
    setDescription(o.description || '');
    setSocialArea(o.socialArea || '');

    // location.type ('Online'/'Saha'/'Hibrit') → state ('online'/'field'/'hybrid')
    setLocationType(o.location?.type ? (locationTypeReverseMap[o.location.type] || '') : '');
    setCountry(o.location?.country || 'Türkiye');
    // Array varsa onu, yoksa virgüllü string'i böl.
    setCities(toArray(o.location?.cities, o.location?.city));
    setDistricts(toArray(o.location?.districts, o.location?.district));
    setNeighborhoods(toArray(o.location?.neighborhoods, o.location?.neighborhood));
    setMeetingAddress(o.location?.address || '');
    setMeetingLat(o.location?.lat != null ? String(o.location.lat) : '');
    setMeetingLon(o.location?.lon != null ? String(o.location.lon) : '');

    setApplicationEnd(o.dates?.applicationEnd || '');
    setApplicationEndTime(o.dates?.applicationEndTime || '');
    setEventStart(o.dates?.eventStart || '');
    setEventStartTime(o.dates?.eventStartTime || '');
    setEventEnd(o.dates?.eventEnd || '');
    setEventEndTime(o.dates?.eventEndTime || '');

    setParticipationCondition(o.participationCondition || '');

    // commitment "<Türkçe> — <detay>" → state + detay. join(' — ') ile yazıldığı
    // için ilk ' — ' üzerinden ayır; sonraki ' — ' varsa detaya dahil et.
    const commitmentRaw = o.commitment || '';
    const sepIdx = commitmentRaw.indexOf(' — ');
    const commitmentLabel = sepIdx >= 0 ? commitmentRaw.slice(0, sepIdx) : commitmentRaw;
    const commitmentDetailRaw = sepIdx >= 0 ? commitmentRaw.slice(sepIdx + 3) : '';
    setCommitment(commitmentReverseMap[commitmentLabel.trim()] || '');
    setCommitmentDetail(commitmentDetailRaw.trim());

    setVolunteerNeeded(o.volunteerCount?.needed != null ? String(o.volunteerCount.needed) : '');

    setSkills(Array.isArray(o.skills) ? o.skills : []);
    setDailySkills(Array.isArray(o.dailySkills) ? o.dailySkills : []);
    setInterests(Array.isArray(o.interests) ? o.interests : []);
    setProfessions(Array.isArray(o.professions) ? o.professions : []);
    setLanguages(Array.isArray(o.languages) ? o.languages : []);
    setSignLanguages(Array.isArray(o.signLanguages) ? o.signLanguages : []);
    setPrograms(Array.isArray(o.programs) ? o.programs : []);
    setCertificates(Array.isArray(o.certificates) ? o.certificates : []);
    setDriverLicenses(Array.isArray(o.driverLicenses) ? o.driverLicenses : []);
    setVisas(Array.isArray(o.travel?.visas) ? (o.travel?.visas as string[]) : []);
    setEducation(o.education || '');

    setDomesticTravel(!!o.travel?.domestic);
    setInternationalTravel(!!o.travel?.international);
    setTransport(!!o.amenities?.transport);
    setFood(!!o.amenities?.food);
    setAccommodation(!!o.amenities?.accommodation);
    setPreTraining(!!o.amenities?.preTraining);
    setProvidesCertificate(!!o.amenities?.providesCertificate);

    setTaskTypeId(o.taskTypeId || '');
    setEstimatedHours(o.estimatedHours != null ? String(o.estimatedHours) : '');
  }, [isEdit, editOpp]);

  // Süper-admin tarafından yönetilen iş kalemleri kataloğu
  const scoringQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.volunteerScoring), orderBy('order', 'asc')) : null),
    [db],
  );
  const { data: scoringItems } = useCollection<{
    id: string; taskType: string; pointsPerHour: number; manHourCost: number; isActive: boolean;
  }>(scoringQuery);

  const activeScoringItems = useMemo(() => (scoringItems || []).filter(i => i.isActive), [scoringItems]);
  const selectedTask = useMemo(
    () => activeScoringItems.find(i => i.id === taskTypeId) || null,
    [activeScoringItems, taskTypeId],
  );
  const hoursNum = Number(estimatedHours) || 0;
  const computedPoints = selectedTask ? Math.round(selectedTask.pointsPerHour * hoursNum) : 0;
  const computedMHValue = selectedTask ? Math.round(selectedTask.manHourCost * hoursNum) : 0;

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
        ((neighborhoodsData as Record<string, Record<string, string[]>>)?.[c]?.[d] || []).forEach((n: string) => set.add(n));
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
    if (!selectedTask) {
      toast({ variant: 'destructive', title: 'İş kalemi gerekli', description: 'Süper-admin kataloğundan bir iş kalemi seçin.' });
      return;
    }
    if (hoursNum <= 0) {
      toast({ variant: 'destructive', title: 'Tahmini süre gerekli', description: 'Gönüllülük süresini saat olarak girin.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
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
          address: meetingAddress.trim(),
          lat: meetingLat || '',
          lon: meetingLon || '',
          // Detay sayfası "Adres Tarifi Al" + hava durumu + Live Activity logosu
          // location.coordinates'tan okur; lat/lon varsa sayısal olarak da yaz.
          ...(meetingLat && meetingLon && !isNaN(Number(meetingLat)) && !isNaN(Number(meetingLon))
            ? { coordinates: { lat: Number(meetingLat), lon: Number(meetingLon) } }
            : {}),
          cities,
          districts,
          neighborhoods,
          type: locationTypeMap[locationType] || 'Saha',
        },
        participationCondition: participationCondition.trim() || '',
        organizerLogoUrl: (ngoData as { avatarUrl?: string; logoUrl?: string } | null | undefined)?.avatarUrl
          || (ngoData as { avatarUrl?: string; logoUrl?: string } | null | undefined)?.logoUrl || '',
        commitment: [commitmentMap[commitment], commitmentDetail.trim()].filter(Boolean).join(' — '),
        volunteerCount: {
          needed: Number(volunteerNeeded) || 0,
          // Edit modunda mevcut başvuru sayısını KORU (create'te 0).
          applications: isEdit ? existingApplicationsRef.current : 0,
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
        taskTypeId: selectedTask.id,
        taskTypeName: selectedTask.taskType,
        pointsPerHour: selectedTask.pointsPerHour,
        manHourCost: selectedTask.manHourCost,
        estimatedHours: hoursNum,
        points: computedPoints,
        manHourValue: computedMHValue,
      };

      if (isEdit && editId) {
        // EDIT: sadece düzenlenebilir alanları güncelle. status / createdAt /
        // createdBy DEĞİŞTİRİLMEZ (super-admin onay durumu, oluşturulma bilgisi
        // korunur), volunteerCount.applications yukarıda mevcut değerle korundu.
        await updateDoc(doc(db, COLLECTIONS.volunteering, editId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });

        // Onaylı gönüllülere "ilan güncellendi" bildirimi — MEVCUT broadcast
        // rotasını yeniden kullan (yeni server function YOK). Best-effort:
        // bildirim gitmezse kayıt yine de başarılı sayılır.
        try {
          const token = await authUser?.getIdToken();
          if (token) {
            await fetch(`/api/volunteering/${editId}/broadcast`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                audience: 'approved',
                subject: 'Gönüllülük ilanı güncellendi',
                message: `"${title.trim()}" ilanında güncelleme yapıldı. Detayları ilan sayfasından görebilirsin.`,
              }),
            });
          }
        } catch { /* best-effort — bildirim başarısız olsa da kayıt başarılı */ }

        toast({
          title: 'İlan güncellendi',
          description: 'İlan güncellendi — onaylı gönüllülere bildirim gönderildi.',
        });
      } else {
        const payloadCreate: Record<string, unknown> = {
          ...payload,
          status: 'Beklemede',
          createdAt: serverTimestamp(),
          createdBy: authUser?.uid || null,
        };

        const volunteerRef = await addDoc(collection(db, COLLECTIONS.volunteering), payloadCreate);

        // Yaşam döngüsü: "gönüllülük ilanınızın kaydı alındı" (bildirim + kurumsal SMS)
        try {
          const lifecycleToken = await authUser?.getIdToken();
          await fireOrgLifecycle(lifecycleToken, { kind: 'volunteer', stage: 'received', refId: volunteerRef.id });
        } catch { /* best-effort */ }

        toast({
          title: 'İlan Onaya Gönderildi',
          description: 'Gönüllülük ilanınız süper admin onayından sonra yayına alınacaktır.',
        });
      }

      // Edit modunda ngoId doc'tan (entityId) gelir; create modunda mevcut
      // ?id davranışı AYNEN korunur.
      const backHref = isEdit
        ? (entityId ? `/ngo-admin/volunteer?id=${entityId}` : '/ngo-admin/volunteer')
        : (entityId && searchParams.get('id')
            ? `/ngo-admin/volunteer?id=${searchParams.get('id')}`
            : '/ngo-admin/volunteer');
      router.push(backHref);
    } catch (err) {
      console.error(isEdit ? 'Failed to update opportunity:' : 'Failed to publish opportunity:', err);
      const e = err as { message?: string };
      toast({
        variant: 'destructive',
        title: isEdit ? 'İlan güncellenemedi' : 'İlan yayınlanamadı',
        description: e?.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isEdit ? 'Gönüllülük İlanını Düzenle' : 'Yeni Gönüllülük İlanı Oluştur'}</h1>
        <p className="text-muted-foreground">{isEdit ? 'İlanın tüm detaylarını güncelleyin; kaydedince onaylı gönüllülere bildirim gönderilir.' : 'Kuruluşunuz için yeni bir gönüllülük fırsatı yayınlayın.'}</p>
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
              <Label htmlFor="participationCondition">Katılım Koşulu (opsiyonel)</Label>
              <Textarea id="participationCondition" value={participationCondition} onChange={e => setParticipationCondition(e.target.value)} placeholder="Örn: 18 yaş üstü, ehliyet sahibi, hafta sonu müsait olabilen gönüllüler. Boş bırakılırsa herkese açık sayılır." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialArea">Sosyal Alan</Label>
              <Select value={socialArea} onValueChange={setSocialArea}>
                <SelectTrigger id="socialArea"><SelectValue placeholder="İlanın ilgili olduğu sosyal alanı seçin..." /></SelectTrigger>
                <SelectContent className="max-h-[50vh] overflow-y-auto overscroll-contain">
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
                  <SelectContent className="max-h-[50vh] overflow-y-auto overscroll-contain">
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
            {/* Adres / Buluşma Noktası — harita araması: ikona tıkla, yerler listelensin, seçince otomatik dolsun */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Adres / Buluşma Noktası</Label>
              <PlaceAutocomplete
                value={meetingAddress}
                onTextChange={setMeetingAddress}
                onSelect={(sel) => {
                  setMeetingAddress(sel.address || sel.display);
                  setMeetingLat(sel.lat);
                  setMeetingLon(sel.lon);
                  if (sel.city && cities.length === 0) setCities([sel.city]);
                  if (sel.district && districts.length === 0) setDistricts([sel.district]);
                }}
              />
              <p className="text-[11px] text-muted-foreground">Adresi yazıp harita ikonuna tıklayın; eşleşen yerler listelenir, seçince konum kaydedilir.</p>
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
            <div className="space-y-3 border-t pt-4 mt-2">
              <div>
                <Label className="text-sm font-bold">İş Kalemi ve Süre (Süper-Admin Kataloğu)</Label>
                <p className="text-xs text-muted-foreground">Puan ve adam-saat değeri otomatik hesaplanır — manuel girilemez.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="taskType">İş Kalemi *</Label>
                  <Select value={taskTypeId} onValueChange={setTaskTypeId}>
                    <SelectTrigger id="taskType">
                      <SelectValue placeholder={activeScoringItems.length === 0 ? 'Katalog boş — süper-admin doldurmalı' : 'Seçiniz...'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[50vh] overflow-y-auto overscroll-contain">
                      {activeScoringItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.taskType} <span className="text-muted-foreground text-xs">({item.pointsPerHour} pt/saat)</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Tahmini Süre (saat) *</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    min={0}
                    step="0.5"
                    value={estimatedHours}
                    onChange={e => setEstimatedHours(e.target.value)}
                    placeholder="Örn: 4"
                  />
                </div>
              </div>
              {selectedTask && hoursNum > 0 && (
                <div className="space-y-2 p-3 bg-primary/5 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">İş Kalemi Puanı (taban)</p>
                      <p className="text-2xl font-black text-primary tabular-nums">{computedPoints.toLocaleString('tr-TR')}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedTask.pointsPerHour} pt × {hoursNum} saat</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sosyal Etki Mali Değeri</p>
                      <p className="text-2xl font-black text-primary tabular-nums">{computedMHValue.toLocaleString('tr-TR')} ₺</p>
                      <p className="text-[10px] text-muted-foreground">{selectedTask.manHourCost} ₺ × {hoursNum} saat (adam-saat)</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed border-t pt-2">
                    <strong>Not:</strong> Gönüllünün <strong>kendi mesleğine</strong> göre ek puan otomatik eklenir
                    (örn. doktor ekstra <strong>+150 pt/saat</strong>, öğrenci <strong>+25 pt/saat</strong>).
                    Mali değer hesabında sadece iş kaleminin adam-saat değeri baz alınır.
                  </p>
                </div>
              )}
              {activeScoringItems.length === 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  ⚠️ Henüz iş kalemi yok. Süper-admin <code className="text-[10px]">/super-admin/settings/volunteer-scoring</code> üzerinden katalog oluşturmalı.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit
            ? (isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet')
            : (isSubmitting ? 'Yayınlanıyor...' : 'İlanı Yayınla')}
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
