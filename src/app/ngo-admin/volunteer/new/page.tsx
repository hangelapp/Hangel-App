'use client';

import React, { useState, Suspense } from 'react';
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


const allInterests = ['Hayvan Hakları', 'Çevre', 'Eğitim', 'Sağlık', 'Afet', 'Çocuk', 'Kadın Hakları', 'Kültür & Sanat', 'İnsan Hakları', 'Yoksullukla Mücadele'];
const allSkills = ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Grafik Tasarım', 'Web Geliştirme', 'Kaynak Geliştirme', 'Hukuki Danışmanlık', 'Tercümanlık', 'Fotoğrafçılık', 'Video Kurgu'];
const allLanguages = ['Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'İspanyolca', 'Rusça', 'İşaret Dili'];
const allPrograms = ['MS Office', 'Google Workspace', 'Figma', 'Adobe Photoshop', 'Adobe Premiere', 'VS Code', 'Docker', 'Google Analytics'];
const allDocuments = ['İlk Yardım Sertifikası', 'Hijyen Belgesi', 'Scrum Master Sertifikası', 'Pedagojik Formasyon', 'Afet Bilinci Eğitimi Sertifikası', 'SRC Belgesi', 'B Sınıfı Ehliyet'];
const allVisas = ['Schengen', 'ABD (B1/B2)', 'İngiltere', 'Kanada'];


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
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [applicationEnd, setApplicationEnd] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [commitment, setCommitment] = useState('');
  const [commitmentDetail, setCommitmentDetail] = useState('');
  const [volunteerNeeded, setVolunteerNeeded] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
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
        location: {
          city: city.trim(),
          district: district.trim(),
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
          eventStart: eventStart || applicationEnd,
          eventEnd: eventStart || applicationEnd,
        },
        hours: { start: '', end: '', total: 0 },
        skills,
        languages,
        programs,
        requirements: documents,
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
        status: 'Aktif',
        createdAt: serverTimestamp(),
        createdBy: authUser?.uid || null,
      };

      await addDoc(collection(db, 'volunteering'), payload);

      toast({ title: 'İlan Yayınlandı', description: 'Gönüllülük ilanınız yayında.' });
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
                <Label htmlFor="city">Şehir</Label>
                <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="İstanbul" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">İlçe</Label>
                <Input id="district" value={district} onChange={e => setDistrict(e.target.value)} placeholder="Kadıköy" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicationEnd">Son Başvuru Tarihi</Label>
                <Input id="applicationEnd" type="date" value={applicationEnd} onChange={e => setApplicationEnd(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventStart">Gönüllülük Başlangıç Tarihi</Label>
                <Input id="eventStart" type="date" value={eventStart} onChange={e => setEventStart(e.target.value)} />
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
            <MultiSelect title="Gerekli Yetkinlikler" options={allSkills} selected={skills} onSelectedChange={setSkills} />
            <MultiSelect title="İstenen Diller" options={allLanguages} selected={languages} onSelectedChange={setLanguages} />
            <MultiSelect title="Bilgisi İstenen Programlar" options={allPrograms} selected={programs} onSelectedChange={setPrograms} />
            <MultiSelect title="Gerekli Belgeler/Lisanslar" options={allDocuments} selected={documents} onSelectedChange={setDocuments} />
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
