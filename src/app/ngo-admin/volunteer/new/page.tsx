
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const allInterests = ['Hayvan Hakları', 'Çevre', 'Eğitim', 'Sağlık', 'Afet', 'Çocuk', 'Kadın Hakları', 'Kültür & Sanat', 'İnsan Hakları', 'Yoksullukla Mücadele'];
const allSkills = ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Grafik Tasarım', 'Web Geliştirme', 'Kaynak Geliştirme', 'Hukuki Danışmanlık', 'Tercümanlık', 'Fotoğrafçılık', 'Video Kurgu'];
const allLanguages = ['Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'İspanyolca', 'Rusça', 'İşaret Dili'];
const allPrograms = ['MS Office', 'Google Workspace', 'Figma', 'Adobe Photoshop', 'Adobe Premiere', 'VS Code', 'Docker', 'Google Analytics'];
const allDocuments = ['İlk Yardım Sertifikası', 'Hijyen Belgesi', 'Scrum Master Sertifikası', 'Pedagojik Formasyon', 'Afet Bilinci Eğitimi Sertifikası', 'SRC Belgesi', 'B Sınıfı Ehliyet'];
const allVisas = ['Schengen', 'ABD (B1/B2)', 'İngiltere', 'Kanada'];
const allUniversities = ['Boğaziçi Üniversitesi', 'İstanbul Teknik Üniversitesi', 'Orta Doğu Teknik Üniversitesi', 'Galatasaray Üniversitesi', 'Koç Üniversitesi', 'Sabancı Üniversitesi', 'Hacettepe Üniversitesi', 'Bilkent Üniversitesi'];


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
                                if (checked) {
                                    onSelectedChange([...selected, option]);
                                } else {
                                    onSelectedChange(selected.filter((item) => item !== option));
                                }
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


export default function NewOpportunityPage() {
    const [skills, setSkills] = React.useState<string[]>([]);
    const [languages, setLanguages] = React.useState<string[]>([]);
    const [programs, setPrograms] = React.useState<string[]>([]);
    const [documents, setDocuments] = React.useState<string[]>([]);
    const [visas, setVisas] = React.useState<string[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yeni Gönüllülük İlanı Oluştur</h1>
        <p className="text-muted-foreground">Kuruluşunuz için yeni bir gönüllülük fırsatı yayınlayın.</p>
      </div>
      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Temel İlan Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">İlan Başlığı</Label>
              <Input id="title" placeholder="Örn: Afet Bölgesi Yardım Dağıtımı" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">İlan Açıklaması</Label>
              <Textarea id="description" placeholder="Gönüllülerden beklentileri, yapılacak işleri ve projenin amacını detaylıca açıklayın." />
            </div>
             <div className="space-y-2">
                <Label htmlFor="socialArea">Sosyal Alan</Label>
                <Select>
                    <SelectTrigger id="socialArea"><SelectValue placeholder="İlanın ilgili olduğu sosyal alanı seçin..." /></SelectTrigger>
                    <SelectContent>
                        {allInterests.map(interest => <SelectItem key={interest} value={interest}>{interest}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konum ve Zamanlama</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="locationType">Konum Türü</Label>
                <Select>
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
                <Input id="city" placeholder="İstanbul" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">İlçe</Label>
                <Input id="district" placeholder="Kadıköy" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="applicationEnd">Son Başvuru Tarihi</Label>
                    <Input id="applicationEnd" type="date" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="eventStart">Gönüllülük Başlangıç Tarihi</Label>
                    <Input id="eventStart" type="date" />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="commitment">Çalışma Şekli</Label>
                 <Select>
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
                <Input id="commitment-detail" placeholder="Örn: Haftada 5 saat, 1 ay boyunca" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aranan Gönüllü Profili ve Gereklilikler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="volunteer-needed">Aranan Gönüllü Sayısı</Label>
              <Input id="volunteer-needed" type="number" placeholder="50" />
            </div>
            <MultiSelect title="Gerekli Yetkinlikler" options={allSkills} selected={skills} onSelectedChange={setSkills} />
            <MultiSelect title="İstenen Diller" options={allLanguages} selected={languages} onSelectedChange={setLanguages} />
            <MultiSelect title="Bilgisi İstenen Programlar" options={allPrograms} selected={programs} onSelectedChange={setPrograms} />
            <MultiSelect title="Gerekli Belgeler/Lisanslar" options={allDocuments} selected={documents} onSelectedChange={setDocuments} />
             <div className="space-y-2">
                <Label htmlFor="education">Eğitim Seviyesi (İsteğe Bağlı)</Label>
                <Select>
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
          <CardHeader>
            <CardTitle>Seyahat Gereksinimleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="domestic-travel" className="font-medium">Yurtiçi seyahat gerektiriyor mu?</Label>
                <Switch id="domestic-travel" />
            </div>
             <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="international-travel" className="font-medium">Yurtdışı seyahat gerektiriyor mu?</Label>
                <Switch id="international-travel" />
            </div>
            <MultiSelect title="Gerekli Vizeler" options={allVisas} selected={visas} onSelectedChange={setVisas} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sağlanan İmkanlar ve Kazanımlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Checkbox id="amenity-transport" />
                    <Label htmlFor="amenity-transport">Ulaşım</Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Checkbox id="amenity-food" />
                    <Label htmlFor="amenity-food">Yemek</Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <Checkbox id="amenity-accommodation" />
                    <Label htmlFor="amenity-accommodation">Konaklama</Label>
                </div>
             </div>
             <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="pre-training" className="font-medium">Ön eğitim verilecek mi?</Label>
                <Switch id="pre-training" />
            </div>
             <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="provides-certificate" className="font-medium">Sertifika verilecek mi?</Label>
                <Switch id="provides-certificate" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="points">Kazandırılacak Sosyal Etki Puanı</Label>
                <Input id="points" type="number" placeholder="Örn: 500" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full">İlanı Yayınla</Button>
      </form>
    </div>
  );
}
