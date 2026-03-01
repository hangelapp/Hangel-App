'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, ArrowLeft, Plus, X, Instagram, Facebook, Linkedin, Twitter, Youtube, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { marketCategories, allUniversities, countryPhoneCodes } from '@/lib/data';

// --- Shared Constants & Data ---
const allProvinces = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantp", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];

const districts: { [key: string]: string[] } = {
    'Adana': ['Aladağ', 'Ceyhan', 'Çukurova', 'Feke', 'İmamoğlu', 'Karaisalı', 'Karataş', 'Kozan', 'Pozantı', 'Saimbeyli', 'Sarıçam', 'Seyhan', 'Tufanbeyli', 'Yumurtalık', 'Yüreğir'],
    'Adıyaman': ['Merkez', 'Besni', 'Çelikhan', 'Gerger', 'Gölbaşı', 'Kahta', 'Samsat', 'Sincik', 'Tut'],
    'Afyonkarahisar': ['Merkez', 'Başmakçı', 'Bayat', 'Bolvadin', 'Çay', 'Çobanlar', 'Dazkırı', 'Dinar', 'Emirdağ', 'Evciler', 'Hocalar', 'İhsaniye', 'İscehisar', 'Kızılören', 'Sandıklı', 'Sinanpaşa', 'Sultandağı', 'Şuhut'],
    'Ağrı': ['Merkez', 'Diyadin', 'Doğubayazıt', 'Eleşkirt', 'Hamur', 'Patnos', 'Taşlıçay', 'Tutak'],
    'Ankara': ['Akyurt', 'Altındağ', 'Ayaş', 'Bala', 'Beypazarı', 'Çamlidere', 'Çankaya', 'Çubuk', 'Elmadağ', 'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan', 'Kalecik', 'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahelle'],
    'İstanbul': ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'],
    'İzmir': ['Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla'],
};

const neighborhoods: { [key: string]: string[] } = {
    'Kadıköy': ['Caferağa', 'Osmanağa', 'Rasimpaşa', 'Moda', 'Fenerbahçe', 'Eğitim', 'Göztepe', 'Merdivenköy', 'Bostancı', 'Caddebostan'],
    'Fatih': ['Aksaray', 'Balat', 'Eminönü', 'Sultanahmet', 'Sirkeci', 'Beyazıt', 'Çapa', 'Kocamustafapaşa', 'Yedikule', 'Karagümrük'],
};

const allBeneficiaries = ['Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre', 'Aile', 'Bölgesel', 'İş Dünyası', 'Girişimciler'];
const allSdgs = ['1. Yoksulluğa Son', '2. Açlığa Son', '3. Sağlıklı ve Kaliteli Yaşam', '4. Nitelikli Eğitim', '5. Toplumsal Cinsiyet Eşitliği', '6. Temiz Su ve Sanitasyon', '7. Erişilebilir ve Temiz Enerji', '8. İnsana Yakışır İş ve Ekonomik Büyüme', '9. Sanayi, Yenilikçilik ve Altyapı', '10. Eşitsizliklerin Azaltılması', '11. Sürdürülebilir Şehirler ve Topluluklar', '12. Sorumlu Üretim ve Tüketim', '13. İklim Eylemi', '14. Sudaki Yaşam', '15. Karasal Yaşam', '16. Barış, Adalet ve Güçlü Kurumlar', '17. Amaçlar için Ortaklıklar'];

const marketCategoryLabels = marketCategories
    .filter(c => c.mainCategory !== 'Öne çıkanlar' && c.mainCategory !== 'Tümü')
    .map(c => c.mainCategory);

// --- Shared Components ---

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

const FileUpload = ({label, accept, hint, required}: {label: string, accept?: string, hint?: string, required?: boolean}) => (
    <div className="space-y-2">
        <Label>{label} {required && "*"}</Label>
        <div className="flex items-center gap-4">
            <Input id={`${label}-upload`} type="file" className="hidden" accept={accept} required={required} />
            <Button asChild variant="outline" size="sm">
                <label htmlFor={`${label}-upload`} className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Belge Seç</label>
            </Button>
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
    </div>
);

const SocialMediaFields = () => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">Sosyal Medya Hesapları</CardTitle>
            <CardDescription>Kuruluşunuzun sosyal medya linklerini ekleyin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>Instagram</Label>
                <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="instagram.com/kullaniciadi" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>X (Twitter)</Label>
                <div className="flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="x.com/kullaniciadi" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Facebook</Label>
                <div className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="facebook.com/sayfaadi" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>LinkedIn</Label>
                <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="linkedin.com/company/kurumadi" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>YouTube</Label>
                <div className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="youtube.com/@kanaladi" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const AddressFields = ({ city, setCity, district, setDistrict, neighborhood, setNeighborhood, required = true }: any) => (
    <Card>
        <CardHeader><CardTitle className="text-lg">İletişim & Adres</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2"><Label>E-posta</Label><Input type="email" placeholder="iletisim@ornek.com" required={required} /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>İl</Label>
                    <Select value={city} onValueChange={(val) => { setCity(val); setDistrict(''); setNeighborhood(''); }} required={required}>
                        <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                        <SelectContent>
                            {allProvinces.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>İlçe</Label>
                    <Select value={district} onValueChange={(val) => { setDistrict(val); setNeighborhood(''); }} disabled={!city} required={required}>
                        <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                        <SelectContent>
                            {city && (districts[city] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Mahalle</Label>
                    <Select value={neighborhood} onValueChange={setNeighborhood} disabled={!district} required={required}>
                        <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                        <SelectContent>
                            {district && (neighborhoods[district] || ['Merkez', 'Cumhuriyet', 'Hürriyet']).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2"><Label>Açık Adres</Label><Input placeholder="Sokak, kapı no..." required={required} /></div>
        </CardContent>
    </Card>
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

  const [brandDonationRates, setBrandDonationRates] = useState([{ category: '', rate: '' }]);

  const addDonationRate = () => setBrandDonationRates([...brandDonationRates, { category: '', rate: '' }]);
  const removeDonationRate = (index: number) => {
      if (brandDonationRates.length > 1) {
          setBrandDonationRates(brandDonationRates.filter((_, i) => i !== index));
      }
  };
  const updateDonationRate = (index: number, field: 'category' | 'rate', value: string) => {
      const updated = [...brandDonationRates];
      updated[index][field] = value;
      setBrandDonationRates(updated);
  };

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
                        <div className="space-y-2"><Label>Kuruluş Kısa Adı</Label><Input placeholder="Örn: TEMA" required /></div>
                        <div className="space-y-2"><Label>Kuruluş Yılı</Label><Input type="number" placeholder="Örn: 1992" required /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Kuruluş Türü</Label>
                      <Select required>
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
                            required
                        />
                    </div>
                </CardContent>
            </Card>
            <CheckboxGroup title="Faydalanıcılar" options={allBeneficiaries} />
            <CheckboxGroup title="Sürdürülebilir Kalkınma Hedefleri" options={allSdgs} />
            
            <AddressFields 
                city={officeCity} setCity={setOfficeCity}
                district={officeDistrict} setDistrict={setOfficeDistrict}
                neighborhood={officeNeighborhood} setNeighborhood={setOfficeNeighborhood}
                required={true}
            />

            <SocialMediaFields />

            <Card>
                <CardHeader><CardTitle className="text-lg">Yasal Belgeler</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <FileUpload label="Logo" accept=".jpg,.jpeg,.png" hint="Desteklenen format: .jpg, .png" required={true} />
                    <FileUpload label="Faaliyet Belgesi" accept=".pdf" hint="Desteklenen format: .pdf" required={true} />
                    <FileUpload label="Tüzük" accept=".pdf" hint="Desteklenen format: .pdf" required={true} />
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
                            <Select onValueChange={setClubSchoolType} required>
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
                                <Select required><SelectTrigger><SelectValue placeholder="Üniversite seçin..." /></SelectTrigger>
                                    <SelectContent>{allUniversities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
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
                        <FileUpload label="Kulüp Logosu" accept=".jpg,.jpeg,.png" required={true} />
                        <FileUpload label="Kapak Fotoğrafı" accept=".jpg,.jpeg,.png" required={true} />
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
                        <div className="space-y-2"><Label>Web Sitesi</Label><Input placeholder="https://marka.com" required /></div>
                        
                        <div className="space-y-4 border-t pt-4">
                            <Label className="text-base font-semibold">Kategori Bazlı Bağış Oranları (%)</Label>
                            <p className="text-xs text-muted-foreground">Markanızın farklı kategorileri için taahhüt ettiği bağış oranlarını girin.</p>
                            <div className="space-y-3">
                                {brandDonationRates.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-end">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Kategori</Label>
                                            <Select 
                                                value={item.category} 
                                                onValueChange={(val) => updateDonationRate(index, 'category', val)}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seçiniz" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {marketCategoryLabels.map(cat => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24 space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Oran (%)</Label>
                                            <Input 
                                                type="number" 
                                                placeholder="5" 
                                                value={item.rate} 
                                                onChange={(e) => updateDonationRate(index, 'rate', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-destructive h-10 w-10 hover:bg-destructive/10"
                                            onClick={() => removeDonationRate(index)}
                                            disabled={brandDonationRates.length === 1}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={addDonationRate}>
                                <Plus className="mr-2 h-4 w-4" /> Yeni Kategori Ekle
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <AddressFields 
                    city={officeCity} setCity={setOfficeCity}
                    district={officeDistrict} setDistrict={setOfficeDistrict}
                    neighborhood={officeNeighborhood} setNeighborhood={setOfficeNeighborhood}
                    required={true}
                />

                <SocialMediaFields />

                <Card>
                    <CardHeader><CardTitle className="text-lg">Yasal & Finansal</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>Yasal Unvan</Label><Input placeholder="Şirket tam adı" required /></div>
                        <div className="space-y-2"><Label>IBAN</Label><Input placeholder="TR..." required /></div>
                        <FileUpload label="Vergi Levhası" accept=".pdf" required={true} />
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
