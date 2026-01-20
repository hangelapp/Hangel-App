'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload } from 'lucide-react';

type ApplicationType = 'STK Kayıt Başvurusu' | 'Öğrenci Kulübü Kayıt Başvurusu' | 'Marka Kayıt Başvurusu' | 'Okul Temsilciliği Başvurusu' | '';

const allBeneficiaries = ['Çocuklar', 'Kadınlar', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler'];
const allSdgs = [
    'Yoksulluğa Son', 'Açlığa Son', 'Sağlıklı ve Kaliteli Yaşam', 'Nitelikli Eğitim', 'Toplumsal Cinsiyet Eşitliği', 
    'Temiz Su ve Sanitasyon', 'Erişilebilir ve Temiz Enerji', 'İnsana Yakışır İş ve Ekonomik Büyüme',
    'Sanayi, Yenilikçilik ve Altyapı', 'Eşitsizliklerin Azaltılması', 'Sürdürülebilir Şehirler ve Topluluklar',
    'Sorumlu Üretim ve Tüketim', 'İklim Eylemi', 'Sudaki Yaşam', 'Karasal Yaşam'
];
const allMemberships = ['Afet Platformu', 'Açık Açık', 'Tüsev', 'Adım Adım'];


const CheckboxGroup = ({ title, options }: { title: string, options: string[] }) => {
    return (
        <div className="space-y-2">
            <Label>{title}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-lg border p-4">
                {options.map(option => (
                    <div key={option} className="flex items-center gap-2">
                        <Checkbox id={`${title}-${option}`} />
                        <Label htmlFor={`${title}-${option}`} className="text-sm font-normal">{option}</Label>
                    </div>
                ))}
            </div>
        </div>
    )
}

const FileUpload = ({label}: {label: string}) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-4">
            <Input id={`${label}-upload`} type="file" className="hidden" />
            <Button asChild variant="outline">
                <label htmlFor={`${label}-upload`} className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Belge Seç</label>
            </Button>
        </div>
    </div>
)

export default function NewApplicationPage() {
  const [applicationType, setApplicationType] = useState<ApplicationType>('');

  const renderFormFields = () => {
    switch (applicationType) {
      case 'STK Kayıt Başvurusu':
        return (
          <div className='space-y-6'>
            <Card>
                <CardHeader><CardTitle>Kuruluş Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Kuruluş Adı</Label><Input placeholder="Kuruluşunuzun tam adı" /></div>
                    <div className="space-y-2"><Label>Kuruluş Türü</Label><Select><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger><SelectContent><SelectItem value="dernek">Dernek</SelectItem><SelectItem value="vakif">Vakıf</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Web Sitesi</Label><Input placeholder="https://ornek.org" /></div>
                    <div className="space-y-2"><Label>Hakkında</Label><Textarea placeholder="Kuruluşunuzu anlatan kısa bir metin." /></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Kuruluş Detayları</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <CheckboxGroup title="Faydalanıcılar" options={allBeneficiaries} />
                    <CheckboxGroup title="Desteklenen SKA'lar" options={allSdgs} />
                    <CheckboxGroup title="Üye Olunan Platformlar" options={allMemberships} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>İletişim ve Adres</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Yetkili E-posta</Label><Input type="email" placeholder="iletisim@ornek.org" /></div>
                    <div className="space-y-2"><Label>Telefon</Label><Input type="tel" placeholder="+90..." /></div>
                    <div className="space-y-2"><Label>Adres</Label><Input placeholder="Açık adres" /></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Banka Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Banka IBAN Numarası</Label><Input placeholder="TR..." /></div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Yasal Belgeler</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <FileUpload label="Logo" />
                    <FileUpload label="Kapak Fotoğrafı" />
                    <FileUpload label="Tüzük / Vakıf Senedi" />
                </CardContent>
            </Card>
          </div>
        );
      case 'Öğrenci Kulübü Kayıt Başvurusu':
        return (
            <Card>
                <CardHeader><CardTitle>Kulüp Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Kulüp Adı</Label><Input placeholder="Kulübünüzün tam adı" /></div>
                    <div className="space-y-2"><Label>Okul Adı</Label><Input placeholder="Örn: Boğaziçi Üniversitesi" /></div>
                    <div className="space-y-2"><Label>Kulüp Türü</Label><Select><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger><SelectContent><SelectItem value="university">Üniversite</SelectItem><SelectItem value="high-school">Lise</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Kulüp Açıklaması</Label><Textarea placeholder="Kulübünüzün faaliyetlerini ve amacını açıklayın." /></div>
                    <div className="space-y-2"><Label>Vizyon</Label><Textarea placeholder="Kulübünüzün vizyonunu paylaşın." /></div>
                    <div className="space-y-2"><Label>Yetkili E-posta</Label><Input type="email" placeholder="kulup@okul.edu.tr" /></div>
                    <FileUpload label="Kulüp Logosu" />
                </CardContent>
            </Card>
        );
      case 'Marka Kayıt Başvurusu':
        return (
            <Card>
                <CardHeader><CardTitle>Marka Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Marka Adı</Label><Input placeholder="Markanızın tam adı" /></div>
                    <div className="space-y-2"><Label>Marka Kategorisi</Label><Input placeholder="Örn: Giyim, Elektronik" /></div>
                    <div className="space-y-2"><Label>Marka Türü</Label><Select><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger><SelectContent><SelectItem value="brand">Marka</SelectItem><SelectItem value="cooperative">Kooperatif</SelectItem><SelectItem value="social">Sosyal İşletme</SelectItem><SelectItem value="economic">İktisadi İşletme</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Marka Hakkında</Label><Textarea placeholder="Markanızı ve sosyal sorumluluk vizyonunuzu anlatın." /></div>
                    <div className="space-y-2"><Label>Web Sitesi</Label><Input placeholder="https://marka.com" /></div>
                    <div className="space-y-2"><Label>Ortalama Bağış Oranı (%)</Label><Input type="number" placeholder="Örn: 5" /></div>
                    <FileUpload label="Marka Logosu" />
                </CardContent>
            </Card>
        );
        case 'Okul Temsilciliği Başvurusu':
        return (
             <Card>
                <CardHeader><CardTitle>Temsilci Aday Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Ad Soyad</Label><Input placeholder="Adınız ve Soyadınız" /></div>
                    <div className="space-y-2"><Label>Okul</Label><Input placeholder="Okulunuzun adı" /></div>
                    <div className="space-y-2"><Label>Fakülte / Bölüm</Label><Input placeholder="Fakülte ve bölümünüz" /></div>
                    <div className="space-y-2"><Label>Motivasyon Mektubu</Label><Textarea placeholder="Neden okul temsilcisi olmak istediğinizi, hangel vizyonuna nasıl katkı sağlayacağınızı açıklayın." rows={8}/></div>
                </CardContent>
            </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div>
        <h1 className="text-2xl font-bold font-headline">Yeni Başvuru Oluştur</h1>
        <p className="text-muted-foreground text-sm">Aşağıdaki formu doldurarak başvurunuzu yapın.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Başvuru Formu</CardTitle>
          <CardDescription>Lütfen başvuru türünü seçin ve gerekli alanları doldurun.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="application-type">Başvuru Türü</Label>
            <Select onValueChange={(value: ApplicationType) => setApplicationType(value)}>
              <SelectTrigger id="application-type">
                <SelectValue placeholder="Başvuru türünü seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STK Kayıt Başvurusu">Sivil Toplum Kuruluşu Kayıt Başvurusu</SelectItem>
                <SelectItem value="Öğrenci Kulübü Kayıt Başvurusu">Öğrenci Kulübü Kayıt Başvurusu</SelectItem>
                <SelectItem value="Marka Kayıt Başvurusu">Marka Kayıt Başvurusu</SelectItem>
                <SelectItem value="Okul Temsilciliği Başvurusu">Okul Temsilciliği Başvurusu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {applicationType && (
            <form className="space-y-6 border-t pt-6">
              {renderFormFields()}
              <Button type="submit" className="w-full">Başvuruyu Gönder</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
