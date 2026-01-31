'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Twitter, Instagram, Facebook, Linkedin, ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const allProvinces = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];
const universities = ['Boğaziçi Üniversitesi', 'İstanbul Teknik Üniversitesi', 'Orta Doğu Teknik Üniversitesi', 'Galatasaray Üniversitesi'];
const allBeneficiaries = ['Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre', 'Aile', 'Bölgesel', 'İş Dünyası', 'Girişimciler'];
const allSdgs = ['1. Yoksulluğa Son', '2. Açlığa Son', '3. Sağlıklı ve Kaliteli Yaşam', '4. Nitelikli Eğitim', '5. Toplumsal Cinsiyet Eşitliği', '6. Temiz Su ve Sanitasyon', '7. Erişilebilir ve Temiz Enerji', '8. İnsana Yakışır İş ve Ekonomik Büyüme', '9. Sanayi, Yenilikçilik ve Altyapı', '10. Eşitsizliklerin Azaltılması', '11. Sürdürülebilir Şehirler ve Topluluklar', '12. Sorumlu Üretim ve Tüketim', '13. İklim Eylemi', '14. Sudaki Yaşam', '15. Karasal Yaşam', '16. Barış, Adalet ve Güçlü Kurumlar', '17. Amaçlar için Ortaklıklar'];

const districts: { [key: string]: string[] } = {
    'İstanbul': ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'],
    'Ankara': ['Akyurt', 'Altındağ', 'Ayaş', 'Balâ', 'Beypazarı', 'Çamlıdere', 'Çankaya', 'Çubuk', 'Elmadağ', 'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan', 'Kalecik', 'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle'],
    'İzmir': ['Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla'],
};

const neighborhoods: { [key: string]: string[] } = {
    'Kadıköy': ['Caferağa', 'Osmanağa', 'Rasimpaşa', 'Moda', 'Fenerbahçe', 'Eğitim', 'Göztepe', 'Merdivenköy', 'Bostancı', 'Caddebostan'],
    'Beşiktaş': ['Levent', 'Etiler', 'Bebek', 'Arnavutköy', 'Ortaköy', 'Gayrettepe', 'Dikilitaş', 'Muradiye', 'Abbasağa', 'Vişnezade'],
    'Fatih': ['Aksaray', 'Balat', 'Eminönü', 'Sultanahmet', 'Sirkeci', 'Beyazıt', 'Çapa', 'Kocamustafapaşa', 'Yedikule', 'Karagümrük'],
    'Sarıyer': ['Tarabya', 'İstinye', 'Yeniköy', 'Maslak', 'Zekeriyaköy', 'Reşitpaşa', 'Ayazağa', 'Bahçeköy', 'Kireçburnu', 'Emirgan'],
    'Çankaya': ['Kızılay', 'Kavaklıdere', 'Maltepe', 'Bahçelievler', 'Ayrancı', 'Dikmen', 'Oran', 'Yıldız', 'Ümitköy', 'Çayyolu'],
    'Konak': ['Alsancak', 'Göztepe', 'Hatay', 'Basmane', 'Kahramanlar', 'Küçükyalı', 'Güzelyalı', 'Pasaport', 'Kemeraltı', 'Kadifekale'],
};

const CheckboxGroup = ({ title, options }: { title: string, options: string[] }) => (
    <div className="space-y-2">
        <Label>{title}</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
            {options.map(option => (
                <div key={option} className="flex items-center gap-2">
                    <Checkbox id={`${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`} />
                    <Label htmlFor={`${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`} className="text-sm font-normal">{option}</Label>
                </div>
            ))}
        </div>
    </div>
);

const FileUpload = ({label, accept, hint}: {label: string, accept?: string, hint?: string}) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-4">
            <Input id={`${label}-upload`} type="file" className="hidden" accept={accept} />
            <Button asChild variant="outline" size="sm">
                <label htmlFor={`${label}-upload`} className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Belge Seç</label>
            </Button>
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
    </div>
);

export default function NewApplicationPage() {
  const router = useRouter();
  const [applicationType, setApplicationType] = useState<string>('');
  const [clubSchoolType, setClubSchoolType] = useState<string>('');
  const [officeCity, setOfficeCity] = useState('');
  const [officeDistrict, setOfficeDistrict] = useState('');
  const [officeNeighborhood, setOfficeNeighborhood] = useState('');
  const [aboutText, setAboutText] = useState("");
  const ABOUT_LIMIT = 1000;

  const renderFormFields = () => {
    switch (applicationType) {
      case 'NGO':
        return (
          <div className='space-y-6'>
            <Card>
                <CardHeader><CardTitle className="text-lg">Kuruluş Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Kuruluş Adı</Label><Input placeholder="Kuruluşunuzun tam adı" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Kuruluş Kısa Adı</Label><Input placeholder="Örn: TEMA" /></div>
                        <div className="space-y-2"><Label>Kuruluş Yılı</Label><Input type="number" placeholder="Örn: 1992" /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Kuruluş Türü</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dernek">Dernek</SelectItem>
                          <SelectItem value="vakif">Vakıf</SelectItem>
                          <SelectItem value="spor">Spor Kulübü</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Hakkında</Label>
                            <span className={cn("text-[10px]", aboutText.length > ABOUT_LIMIT ? "text-destructive" : "text-muted-foreground")}>
                                {aboutText.length} / {ABOUT_LIMIT} (Kalan: {ABOUT_LIMIT - aboutText.length})
                            </span>
                        </div>
                        <Textarea 
                            value={aboutText} 
                            onChange={(e) => setAboutText(e.target.value)} 
                            maxLength={ABOUT_LIMIT} 
                            placeholder="Kuruluşunuzu anlatan kısa bir metin." 
                            className="min-h-[120px]"
                        />
                    </div>
                </CardContent>
            </Card>
            <CheckboxGroup title="Faydalanıcılar" options={allBeneficiaries} />
            <CheckboxGroup title="Sürdürülebilir Kalkınma Hedefleri" options={allSdgs} />
            <Card>
                <CardHeader><CardTitle className="text-lg">İletişim & Adres</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>E-posta</Label><Input type="email" placeholder="iletisim@ornek.org" required /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>İl</Label>
                            <Select value={officeCity} onValueChange={(val) => { setOfficeCity(val); setOfficeDistrict(''); setOfficeNeighborhood(''); }}>
                                <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                                <SelectContent>{allProvinces.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>İlçe</Label>
                            <Select value={officeDistrict} onValueChange={(val) => { setOfficeDistrict(val); setOfficeNeighborhood(''); }} disabled={!officeCity}>
                                <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                                <SelectContent>{officeCity && districts[officeCity]?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Mahalle</Label>
                            <Select value={officeNeighborhood} onValueChange={setOfficeNeighborhood} disabled={!officeDistrict}>
                                <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                                <SelectContent>{officeDistrict && neighborhoods[officeDistrict]?.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2"><Label>Açık Adres</Label><Input placeholder="Sokak, kapı no..." /></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-lg">Yasal Belgeler</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <FileUpload label="Logo" accept=".jpg,.jpeg" hint="Desteklenen format: .jpg" />
                    <FileUpload label="Faaliyet Belgesi" accept=".pdf" hint="Desteklenen format: .pdf" />
                    <FileUpload label="Tüzük" accept=".pdf" hint="Desteklenen format: .pdf" />
                </CardContent>
            </Card>
          </div>
        );
      case 'CLUB':
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg">Kulüp Bilgileri</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Kulüp Türü</Label>
                            <Select onValueChange={setClubSchoolType}>
                                <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="university">Üniversite</SelectItem>
                                    <SelectItem value="high-school">Lise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {clubSchoolType === 'university' && (
                            <div className="space-y-2">
                                <Label>Üniversite</Label>
                                <Select><SelectTrigger><SelectValue placeholder="Üniversite seçin..." /></SelectTrigger>
                                    <SelectContent>{universities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2"><Label>Kulüp Adı</Label><Input placeholder="Kulübünüzün tam adı" required /></div>
                        <div className="space-y-2"><Label>Yetkili E-posta</Label><Input type="email" placeholder="kulup@okul.edu.tr" required /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-lg">Görseller</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FileUpload label="Kulüp Logosu" accept=".jpg,.jpeg,.png" />
                        <FileUpload label="Kapak Fotoğrafı" accept=".jpg,.jpeg,.png" />
                    </CardContent>
                </Card>
            </div>
        );
      case 'BRAND':
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg">Marka Kimliği</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>Marka Adı</Label><Input placeholder="Markanızın adı" required /></div>
                        <div className="space-y-2"><Label>Kategori</Label><Input placeholder="Giyim, Teknoloji vb." /></div>
                        <div className="space-y-2"><Label>Web Sitesi</Label><Input placeholder="https://marka.com" /></div>
                        <div className="space-y-2">
                            <Label>Bağış Oranı (%)</Label>
                            <Input type="number" placeholder="Örn: 5" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-lg">Yasal & Finansal</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>Yasal Unvan</Label><Input placeholder="Şirket tam adı" /></div>
                        <div className="space-y-2"><Label>IBAN</Label><Input placeholder="TR..." /></div>
                        <FileUpload label="Vergi Levhası" accept=".pdf" />
                    </CardContent>
                </Card>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="flex items-center gap-2">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold font-headline">Yeni Başvuru Oluştur</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kuruluş Başvuru Formu</CardTitle>
          <CardDescription>Lütfen kuruluş türünü seçin ve gerekli alanları doldurun.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="org-type">Kuruluş Türü</Label>
            <Select required onValueChange={setApplicationType}>
                <SelectTrigger id="org-type"><SelectValue placeholder="Kuruluş türünü seçin..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="NGO">Sivil Toplum Kuruluşu (STK)</SelectItem>
                    <SelectItem value="BRAND">Marka / Sosyal İşletme</SelectItem>
                    <SelectItem value="CLUB">Öğrenci Kulübü</SelectItem>
                </SelectContent>
            </Select>
          </div>
          
          {applicationType && (
            <form className="space-y-6 border-t pt-6">
              {renderFormFields()}
              
              <Card>
                <CardHeader><CardTitle className="text-lg">Sözleşme Onayları</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <Checkbox id="terms-new-corp" required />
                        <Label htmlFor="terms-new-corp" className="text-xs font-normal text-muted-foreground">
                            <Link href="/settings/contracts/kurulus-sozlesmesi" className="font-medium text-primary hover:underline">Kuruluş Sözleşmesi</Link>, <Link href="/settings/contracts/sosyal-etki-politikasi" className="font-medium text-primary hover:underline">Sosyal Etki Politikası</Link> ve <Link href="/settings/contracts/gizlilik-politikasi" className="font-medium text-primary hover:underline">Gizlilik Politikası</Link>'nı okudum, anladım ve onaylıyorum.
                        </Label>
                    </div>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full">Başvuruyu Gönder</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
