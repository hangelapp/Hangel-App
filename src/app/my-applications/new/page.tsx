
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Twitter, Instagram, Facebook, Linkedin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';

type ApplicationType = 'STK Kayıt Başvurusu' | 'Öğrenci Kulübü Kayıt Başvurusu' | 'Marka Kayıt Başvurusu' | 'Okul Temsilciliği Başvurusu' | '';

const allProvinces = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];

// Mock data for selects
const universities = ['Boğaziçi Üniversitesi', 'İstanbul Teknik Üniversitesi', 'Orta Doğu Teknik Üniversitesi', 'Galatasaray Üniversitesi'];
const provinces = allProvinces;

// Updated data from user request
const allBeneficiaries = ['Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre', 'Aile', 'Bölgesel'];
const allActivityAreas = ['Çevre', 'Hayvanlar', 'Hukuk, İnsan Hakları ve Politika Geliştirme', 'Kültür, Sanat ve Spor', 'Sağlık', 'Eğitim', 'Dini Hizmetler', 'Ekonomik, Sosyal ve Toplumsal Gelişim', 'Sosyal Hizmetler', 'Uluslararası', 'Bilim ve Teknoloji'];

const allSdgs = [
    '1. Yoksulluğa Son', 
    '2. Açlığa Son', 
    '3. Sağlıklı ve Kaliteli Yaşam', 
    '4. Nitelikli Eğitim', 
    '5. Toplumsal Cinsiyet Eşitliği', 
    '6. Temiz Su ve Sanitasyon', 
    '7. Erişilebilir ve Temiz Enerji', 
    '8. İnsana Yakışır İş ve Ekonomik Büyüme',
    '9. Sanayi, Yenilikçilik ve Altyapı', 
    '10. Eşitsizliklerin Azaltılması', 
    '11. Sürdürülebilir Şehirler ve Topluluklar',
    '12. Sorumlu Üretim ve Tüketim', 
    '13. İklim Eylemi', 
    '14. Sudaki Yaşam', 
    '15. Karasal Yaşam',
    '16. Barış, Adalet ve Güçlü Kurumlar',
    '17. Amaçlar için Ortaklıklar'
];
const allMemberships = ['Afet Platformu', 'Açık Açık', 'Tüsev', 'Adım Adım', 'Ability Pool', 'HelpSteps', 'Candid'];

const cities = allProvinces;
const districts: { [key: string]: string[] } = {
    'İstanbul': ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'],
    'Ankara': ['Akyurt', 'Altındağ', 'Ayaş', 'Balâ', 'Beypazarı', 'Çamlıdere', 'Çankaya', 'Çubuk', 'Elmadağ', 'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan', 'Kalecik', 'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle'],
    'İzmir': ['Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla'],
};

const neighborhoods: { [key: string]: string[] } = {
    'Kadıköy': ['Caferağa', 'Osmanağa', 'Rasimpaşa', 'Moda', 'Fenerbahçe'],
    'Çankaya': ['Kızılay', 'Kavaklıdere', 'Maltepe', 'Bahçelievler'],
    'Konak': ['Alsancak', 'Göztepe', 'Hatay', 'Basmane'],
    'Beşiktaş': ['Levent', 'Etiler', 'Bebek', 'Arnavutköy'],
};

const CheckboxGroup = ({ title, options }: { title: string, options: string[] }) => {
    return (
        <div className="space-y-2">
            <Label>{title}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-lg border p-4">
                {options.map(option => (
                    <div key={option} className="flex items-center gap-2">
                        <Checkbox id={`${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`} />
                        <Label htmlFor={`${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`} className="text-sm font-normal">{option}</Label>
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
  const [clubSchoolType, setClubSchoolType] = useState<'university' | 'high-school' | ''>('');
  const [repSchoolType, setRepSchoolType] = useState<'university' | 'high-school' | ''>('');
  
  // States for STK form
  const [aboutText, setAboutText] = React.useState("");
  const ABOUT_MAX_LENGTH = 1000;
  const [officeCity, setOfficeCity] = useState('');
  const [officeDistrict, setOfficeDistrict] = useState('');
  const [mailCity, setMailCity] = useState('');
  const [mailDistrict, setMailDistrict] = useState('');
  const [sameAsOffice, setSameAsOffice] = useState(false);
  
  // States for Club form
  const [clubCity, setClubCity] = useState('');
  const [clubDistrict, setClubDistrict] = useState('');


  const renderFormFields = () => {
    switch (applicationType) {
      case 'STK Kayıt Başvurusu':
        return (
          <div className='space-y-6'>
            <Card>
                <CardHeader><CardTitle>Kuruluş Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Kuruluş Adı</Label><Input placeholder="Kuruluşunuzun tam adı" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectItem value="ozel">Özel İzinli</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Web Sitesi</Label><Input placeholder="https://ornek.org" /></div>
                    <div className="space-y-2">
                      <Label htmlFor="ngo-about">Hakkında</Label>
                      <Textarea 
                        id="ngo-about" 
                        placeholder="Kuruluşunuzu anlatan kısa bir metin." 
                        value={aboutText}
                        onChange={(e) => setAboutText(e.target.value)}
                        maxLength={ABOUT_MAX_LENGTH}
                      />
                      <p className="text-xs text-muted-foreground text-right">{aboutText.length} / {ABOUT_MAX_LENGTH}</p>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Bağlı Olunan Üst Kuruluş (İsteğe Bağlı)</CardTitle>
                    <CardDescription>Kuruluşunuz bir federasyon, konfederasyon veya platforma bağlıysa belirtin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Üst Kuruluş Adı</Label>
                        <Input placeholder="Örn: Türkiye Dernekler Federasyonu"/>
                    </div>
                    <FileUpload label="Üst Kuruluş Logosu" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Kuruluş Detayları</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <CheckboxGroup title="Faydalanıcılar" options={allBeneficiaries} />
                    <CheckboxGroup title="Birleşmiş Milletler 17 Sürdürülebilir Kalkınma Hedefleri" options={allSdgs} />
                    <CheckboxGroup title="Üye Olunan Platformlar" options={allMemberships} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Ana Faaliyet Alanları</CardTitle></CardHeader>
                <CardContent>
                    <CheckboxGroup title="" options={allActivityAreas} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>İletişim Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>STK'nın e postası</Label><Input type="email" placeholder="iletisim@ornek.org" /></div>
                    <div className="space-y-2"><Label>Telefon</Label><Input type="tel" placeholder="+90..." /></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Ofis Adresi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="office-city">İl</Label>
                            <Select onValueChange={setOfficeCity}>
                                <SelectTrigger id="office-city"><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                                <SelectContent>
                                    {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="office-district">İlçe</Label>
                            <Select onValueChange={setOfficeDistrict} disabled={!officeCity}>
                                <SelectTrigger id="office-district"><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
                                <SelectContent>
                                    {officeCity && districts[officeCity] && districts[officeCity].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="office-neighborhood">Mahalle</Label>
                             <Select disabled={!officeDistrict}>
                                <SelectTrigger id="office-neighborhood"><SelectValue placeholder="Mahalle seçin..." /></SelectTrigger>
                                <SelectContent>
                                    {officeDistrict && neighborhoods[officeDistrict] && neighborhoods[officeDistrict].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="office-address">Açık Adres (Sokak, Kapı No vb.)</Label>
                            <Input id="office-address" placeholder="Açık adres"/>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Posta Adresi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="same-address" checked={sameAsOffice} onCheckedChange={(checked) => setSameAsOffice(checked as boolean)} />
                        <Label htmlFor="same-address">Ofis adresi ile aynı</Label>
                    </div>
                    {!sameAsOffice && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mail-city">İl</Label>
                                <Select onValueChange={setMailCity}>
                                    <SelectTrigger id="mail-city"><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                                    <SelectContent>
                                        {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mail-district">İlçe</Label>
                                <Select onValueChange={setMailDistrict} disabled={!mailCity}>
                                    <SelectTrigger id="mail-district"><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
                                    <SelectContent>
                                        {mailCity && districts[mailCity] && districts[mailCity].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mail-neighborhood">Mahalle</Label>
                                 <Select disabled={!mailDistrict}>
                                    <SelectTrigger id="mail-neighborhood"><SelectValue placeholder="Mahalle seçin..." /></SelectTrigger>
                                    <SelectContent>
                                        {mailDistrict && neighborhoods[mailDistrict] && neighborhoods[mailDistrict].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mail-address">Açık Adres (Sokak, Kapı No vb.)</Label>
                                <Input id="mail-address" placeholder="Açık adres" />
                            </div>
                        </div>
                    </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Banka Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Hesap Sahibi Adı</Label><Input placeholder="Hesap sahibinin tam adı" /></div>
                    <div className="space-y-2"><Label>Banka Adı</Label><Input placeholder="Örn: Türkiye İş Bankası" /></div>
                    <div className="space-y-2"><Label>Banka IBAN Numarası</Label><Input placeholder="TR..." /></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Online Bağış</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                       <Label htmlFor="online-donation-switch" className="font-medium">Online bağış kabul ediyor musunuz?</Label>
                       <Switch id="online-donation-switch" />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Yasal Belgeler</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <FileUpload label="Logo" />
                    <FileUpload label="Faaliyet Belgesi" />
                    <FileUpload label="Tüzük / Vakıf Senedi" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Sözleşme ve Politika Onayları</CardTitle>
                    <CardDescription>Platformda yer alabilmek için bu belgeleri okuyup onaylamanız gerekmektedir.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <Checkbox id="terms-ngo" required />
                        <Label htmlFor="terms-ngo" className="text-sm font-normal text-muted-foreground">
                            <Link href="/settings/contracts/kurulus-sozlesmesi" className="font-medium text-primary hover:underline">Kuruluş Sözleşmesi</Link>'ni okudum ve kabul ediyorum.
                        </Label>
                    </div>
                     <div className="flex items-start space-x-3">
                        <Checkbox id="terms-privacy" required />
                        <Label htmlFor="terms-privacy" className="text-sm font-normal text-muted-foreground">
                            <Link href="/settings/contracts/gizlilik-politikasi" className="font-medium text-primary hover:underline">Gizlilik Politikası</Link> ve <Link href="/settings/contracts/kvkk-aydinlatma-metni" className="font-medium text-primary hover:underline">KVKK Aydınlatma Metni</Link>'ni okudum ve kabul ediyorum.
                        </Label>
                    </div>
                     <div className="flex items-start space-x-3">
                        <Checkbox id="terms-social-impact" required />
                        <Label htmlFor="terms-social-impact" className="text-sm font-normal text-muted-foreground">
                            <Link href="/settings/contracts/sosyal-etki-politikasi" className="font-medium text-primary hover:underline">Sosyal Etki Politikası</Link>'nı ve <Link href="/settings/contracts/bagis-ve-yardim-politikasi" className="font-medium text-primary hover:underline">Bağış ve Yardım Politikası</Link>'nı okudum ve kabul ediyorum.
                        </Label>
                    </div>
                </CardContent>
            </Card>
          </div>
        );
      case 'Öğrenci Kulübü Kayıt Başvurusu':
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Kulüp Temel Bilgileri</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Kulüp Türü</Label>
                            <Select onValueChange={(value: 'university' | 'high-school') => setClubSchoolType(value)}>
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
                                <Select><SelectTrigger><SelectValue placeholder="Üniversite seçin..." /></SelectTrigger><SelectContent>
                                    {universities.map(uni => <SelectItem key={uni} value={uni}>{uni}</SelectItem>)}
                                </SelectContent></Select>
                            </div>
                        )}

                        {clubSchoolType === 'high-school' && (
                            <div className='space-y-4'>
                                <div className="space-y-2">
                                    <Label>İl</Label>
                                    <Select onValueChange={setClubCity}>
                                        <SelectTrigger><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                                        <SelectContent>{provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>İlçe</Label>
                                    <Select onValueChange={setClubDistrict} disabled={!clubCity}>
                                        <SelectTrigger><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
                                        <SelectContent>{clubCity && districts[clubCity] && districts[clubCity].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label>Lise Adı</Label><Input placeholder="Lisenizin tam adı" />
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-2"><Label>Kulüp Adı</Label><Input placeholder="Kulübünüzün tam adı" /></div>
                        <div className="space-y-2"><Label>Kulüp Açıklaması</Label><Textarea placeholder="Kulübünüzün faaliyetlerini ve amacını açıklayın." /></div>
                        <div className="space-y-2"><Label>Vizyon</Label><Textarea placeholder="Kulübünüzün vizyonunu paylaşın." /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Kulüp İletişim Bilgileri</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>Yetkili E-posta</Label><Input type="email" placeholder="kulup@okul.edu.tr" /></div>
                        <div className="space-y-2"><Label>Telefon Numarası (İsteğe Bağlı)</Label><Input type="tel" placeholder="+90..." /></div>
                        <div className="space-y-2"><Label>Web Sitesi (İsteğe Bağlı)</Label><Input placeholder="https://kulup.org" /></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Sosyal Medya Hesapları</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="social-twitter" className="text-xs">Twitter (X)</Label><div className='flex items-center gap-2'><Twitter className='h-5 w-5 text-muted-foreground' /><Input id="social-twitter" placeholder="Kullanıcı Adı" /></div></div>
                        <div className="space-y-2"><Label htmlFor="social-instagram" className="text-xs">Instagram</Label><div className='flex items-center gap-2'><Instagram className='h-5 w-5 text-muted-foreground' /><Input id="social-instagram" placeholder="Kullanıcı Adı" /></div></div>
                        <div className="space-y-2"><Label htmlFor="social-facebook" className="text-xs">Facebook</Label><div className='flex items-center gap-2'><Facebook className='h-5 w-5 text-muted-foreground' /><Input id="social-facebook" placeholder="Sayfa Adı" /></div></div>
                        <div className="space-y-2"><Label htmlFor="social-linkedin" className="text-xs">LinkedIn</Label><div className='flex items-center gap-2'><Linkedin className='h-5 w-5 text-muted-foreground' /><Input id="social-linkedin" placeholder="Sayfa Adı" /></div></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Yönetim Bilgileri</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2"><Label>Kulüp Başkanı Adı</Label><Input placeholder="Başkanın adı ve soyadı" /></div>
                         <div className="space-y-2">
                             <Label>Yönetim Kurulu Üyeleri</Label>
                             <Textarea placeholder="Her üyeyi yeni bir satıra 'İsim Soyisim - Rol' formatında yazınız." rows={5} />
                         </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Görseller</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FileUpload label="Kulüp Logosu" />
                        <FileUpload label="Kapak Fotoğrafı" />
                    </CardContent>
                </Card>
            </div>
        );
      case 'Marka Kayıt Başvurusu':
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Marka Kimlik Bilgileri</CardTitle>
                        <CardDescription>Markanızın platformda nasıl görüneceğini ve temel bilgilerini girin.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>Marka Adı</Label><Input placeholder="Markanızın platformdaki adı" /></div>
                        <div className="space-y-2"><Label>Marka Kategorisi</Label><Input placeholder="Örn: Giyim, Restoran, Elektronik" /></div>
                        <div className="space-y-2">
                            <Label>Marka Türü</Label>
                            <Select>
                                <SelectTrigger><SelectValue placeholder="Marka türünü seçin..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="brand">Marka</SelectItem>
                                    <SelectItem value="cooperative">Kooperatif</SelectItem>
                                    <SelectItem value="social">Sosyal İşletme</SelectItem>
                                    <SelectItem value="economic">İktisadi İşletme</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Marka Hakkında</Label>
                            <Textarea placeholder="Markanızı, misyonunuzu ve sosyal sorumluluk vizyonunuzu anlatın." />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Yasal ve Finansal Bilgiler</CardTitle>
                        <CardDescription>Resmi işlemler ve bağış aktarımları için gereklidir.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>Yasal Şirket Unvanı</Label><Input placeholder="Ticaret sicilindeki tam unvanınız" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Vergi Numarası</Label><Input placeholder="10 haneli vergi kimlik numaranız" /></div>
                          <div className="space-y-2"><Label>Vergi Dairesi</Label><Input placeholder="Bağlı olduğunuz vergi dairesi" /></div>
                        </div>
                        <div className="space-y-2 border-t pt-4">
                          <Label>Banka IBAN Numarası</Label>
                          <Input placeholder="TR..." />
                          <p className="text-xs text-muted-foreground">Hak edişlerinizin yatırılacağı banka hesabı.</p>
                        </div>
                    </CardContent>
                </Card>
      
                <Card>
                    <CardHeader>
                        <CardTitle>Bağış Yapılandırması</CardTitle>
                        <CardDescription>Alışverişler üzerinden STK'lara aktarılacak bağış oranlarını belirleyin.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Ortalama Bağış Oranı (%)</Label>
                            <Input type="number" placeholder="Örn: 5" />
                        </div>
                        <div className="space-y-2">
                            <Label>Kategori Bazlı Oranlar (İsteğe bağlı)</Label>
                            <Textarea placeholder="Farklı ürün kategorileri için farklı oranlar belirleyebilirsiniz. Örn: Elektronik - %3, Giyim - %8" />
                        </div>
                    </CardContent>
                </Card>
      
                <Card>
                    <CardHeader>
                        <CardTitle>İletişim ve Adres Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Yetkili Adı Soyadı</Label><Input placeholder="İletişime geçilecek kişi" /></div>
                          <div className="space-y-2"><Label>Yetkili E-posta</Label><Input type="email" placeholder="kurumsal@marka.com" /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>Fiziksel Mağaza Adresi (varsa)</Label>
                            <Input placeholder="Açık adres" />
                        </div>
                        <div className="space-y-2">
                            <Label>Web Sitesi</Label>
                            <Input placeholder="https://marka.com" />
                        </div>
                    </CardContent>
                </Card>
      
                <Card>
                    <CardHeader><CardTitle>Sosyal Medya ve Görseller</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="social-twitter" className="text-sm">Twitter (X)</Label><div className='flex items-center gap-2'><Twitter className='h-5 w-5 text-muted-foreground' /><Input id="social-twitter" placeholder="Kullanıcı Adı" /></div></div>
                        <div className="space-y-2"><Label htmlFor="social-instagram" className="text-sm">Instagram</Label><div className='flex items-center gap-2'><Instagram className='h-5 w-5 text-muted-foreground' /><Input id="social-instagram" placeholder="Kullanıcı Adı" /></div></div>
                        <div className="space-y-2"><Label htmlFor="social-facebook" className="text-sm">Facebook</Label><div className='flex items-center gap-2'><Facebook className='h-5 w-5 text-muted-foreground' /><Input id="social-facebook" placeholder="Sayfa Adı" /></div></div>
                        <div className="space-y-2"><Label htmlFor="social-linkedin" className="text-sm">LinkedIn</Label><div className='flex items-center gap-2'><Linkedin className='h-5 w-5 text-muted-foreground' /><Input id="social-linkedin" placeholder="Sayfa Adı" /></div></div>
                        <div className="space-y-4 pt-4 border-t">
                            <FileUpload label="Marka Logosu (Zorunlu)" />
                            <FileUpload label="Kapak Fotoğrafı (İsteğe Bağlı)" />
                        </div>
                    </CardContent>
                </Card>
      
                 <Card>
                      <CardHeader>
                          <CardTitle>Sözleşme Onayları</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="flex items-start space-x-3">
                              <Checkbox id="terms-brand" required />
                              <Label htmlFor="terms-brand" className="text-sm font-normal text-muted-foreground">
                                  <Link href="/settings/contracts/kurulus-sozlesmesi" className="font-medium text-primary hover:underline">Kuruluş Sözleşmesi</Link>'ni ve Hangel'in <Link href="/settings/contracts/ucret-politikasi" className="font-medium text-primary hover:underline">Ücret Politikası</Link>'nı okudum ve kabul ediyorum.
                              </Label>
                          </div>
                           <div className="flex items-start space-x-3">
                              <Checkbox id="terms-privacy-brand" required />
                              <Label htmlFor="terms-privacy-brand" className="text-sm font-normal text-muted-foreground">
                                  <Link href="/settings/contracts/gizlilik-politikasi" className="font-medium text-primary hover:underline">Gizlilik Politikası</Link>'nı okudum ve kabul ediyorum.
                              </Label>
                          </div>
                      </CardContent>
                  </Card>
            </div>
        );
        case 'Okul Temsilciliği Başvurusu':
        return (
             <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Temsilci Aday Bilgileri</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Okul Türü</Label>
                            <Select onValueChange={(value: 'university' | 'high-school') => setRepSchoolType(value)}>
                                <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="university">Üniversite</SelectItem>
                                    <SelectItem value="high-school">Lise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {repSchoolType === 'university' && (
                            <div className="space-y-2">
                                <Label>Üniversite</Label>
                                <Select><SelectTrigger><SelectValue placeholder="Üniversite seçin..." /></SelectTrigger><SelectContent>
                                    {universities.map(uni => <SelectItem key={uni} value={uni}>{uni}</SelectItem>)}
                                </SelectContent></Select>
                            </div>
                        )}
                        {repSchoolType === 'high-school' && (
                            <div className='space-y-4'>
                                <div className="space-y-2">
                                    <Label>İl</Label>
                                    <Select><SelectTrigger><SelectValue placeholder="İl seçin..." /></SelectTrigger><SelectContent>
                                        {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent></Select>
                                </div>
                                <div className="space-y-2"><Label>İlçe</Label><Input placeholder="İlçe adı" /></div>
                                <div className="space-y-2"><Label>Lise Adı</Label><Input placeholder="Lisenizin tam adı" /></div>
                            </div>
                        )}
                        <div className="space-y-2"><Label>Ad Soyad</Label><Input placeholder="Adınız ve Soyadınız" /></div>
                        <div className="space-y-2"><Label>Fakülte / Bölüm</Label><Input placeholder="Fakülte ve bölümünüz" /></div>
                        <div className="space-y-2"><Label>Motivasyon Mektubu</Label><Textarea placeholder="Neden okul temsilcisi olmak istediğinizi, hangel vizyonuna nasıl katkı sağlayacağınızı açıklayın." rows={8}/></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>İletişim Bilgileri</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2"><Label>E-posta Adresi</Label><Input type="email" placeholder="ornek@eposta.com" /></div>
                        <div className="space-y-2"><Label>Telefon Numarası</Label><Input type="tel" placeholder="+90..." /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Üyesi Olduğunuz Kulüp ve STK'lar</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Lütfen üyesi olduğunuz diğer öğrenci kulüplerini veya sivil toplum kuruluşlarını belirtiniz.</Label>
                            <Textarea placeholder="Örn: İTÜ Pazarlama Kulübü - Üye, TEMA Vakfı - Gönüllü" rows={4} />
                        </div>
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
