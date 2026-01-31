'use client';

import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, Twitter, Instagram, Facebook, Linkedin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// --- Shared Constants & Helpers for Detailed Form ---
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
    'Kadıköy': ['Caferağa', 'Osmanağa', 'Rasimpaşa', 'Moda', 'Fenerbahçe'],
    'Çankaya': ['Kızılay', 'Kavaklıdere', 'Maltepe', 'Bahçelievler'],
    'Konak': ['Alsancak', 'Göztepe', 'Hatay', 'Basmane'],
    'Beşiktaş': ['Levent', 'Etiler', 'Bebek', 'Arnavutköy'],
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

// --- Components ---

function IndividualLogin({ onLogin }: { onLogin: (e: React.FormEvent) => void }) {
  const [loginStep, setLoginStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStep(2);
  };

  if (loginStep === 1) {
    return (
      <div className="space-y-6">
        <form className="space-y-6" onSubmit={handleSendCode}>
          <div className="space-y-2">
            <Label htmlFor="phone-login">Telefon Numarası</Label>
            <Input id="phone-login" type="tel" required placeholder="5XX XXX XX XX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">Doğrulama Kodu Gönder</Button>
        </form>
        <div className="text-center text-sm pt-2">
          <span className="text-muted-foreground">Hesabınız yok mu? </span>
          <Link href="/login/selection?action=register" className="font-medium text-primary hover:underline">Kayıt Ol</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={onLogin}>
      <p className="text-sm text-center text-muted-foreground">{`+90 ${phoneNumber} numarasına gönderilen kodu girin.`}</p>
      <div>
        <Label htmlFor="otp">Doğrulama Kodu</Label>
        <Input id="otp" type="text" required className="text-center tracking-[0.5em]" placeholder="------" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <Button variant="link" onClick={() => setLoginStep(1)} className="p-0 text-primary">Numarayı Değiştir</Button>
        <Button variant="link" className="p-0 text-primary">Kodu Tekrar Gönder</Button>
      </div>
      <Button type="submit" className="w-full">Giriş Yap</Button>
    </form>
  );
}

function IndividualRegister({ onRegister }: { onRegister: (e: React.FormEvent) => void }) {
  return (
    <div className="space-y-6">
      <form className="space-y-6" onSubmit={onRegister}>
        <div className="space-y-2">
          <Label htmlFor="name-register">Ad Soyad</Label>
          <Input id="name-register" type="text" required placeholder="Adınız Soyadınız" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone-register">Telefon Numarası</Label>
          <Input id="phone-register" type="tel" required placeholder="5XX XXX XX XX" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-register">E-posta Adresi (İsteğe Bağlı)</Label>
          <Input id="email-register" type="email" placeholder="ornek@eposta.com" />
        </div>
        <div className="flex items-start space-x-3">
          <Checkbox id="terms-register" required />
          <Label htmlFor="terms-register" className="text-xs font-normal text-muted-foreground">
            <Link href="/settings/contracts/kullanici-sozlesmesi" className="font-medium text-primary hover:underline">Kullanıcı Sözleşmesi</Link>, <Link href="/settings/contracts/kvkk-aydinlatma-metni" className="font-medium text-primary hover:underline">KVKK Aydınlatma Metni</Link> ve <Link href="/settings/contracts/sosyal-etki-politikasi" className="font-medium text-primary hover:underline">Sosyal Etki Politikası</Link>'nı okudum, anladım.
          </Label>
        </div>
        <Button type="submit" className="w-full">Kayıt Ol ve Devam Et</Button>
      </form>
      <div className="text-center text-sm pt-2">
        <span className="text-muted-foreground">Zaten hesabınız var mı? </span>
        <Link href="/login/selection?action=login" className="font-medium text-primary hover:underline">Giriş Yap</Link>
      </div>
    </div>
  );
}

function CorporateLogin({ onLogin }: { onLogin: (e: React.FormEvent) => void }) {
    return (
        <div className="space-y-6">
          <form className="space-y-6" onSubmit={onLogin}>
              <div className="space-y-2">
                  <Label htmlFor="email-login">E-posta Adresi</Label>
                  <Input id="email-login" type="email" required placeholder="kurumsal@eposta.com" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="password-login">Şifre</Label>
                  <Input id="password-login" type="password" required />
              </div>
              <div className="flex items-center justify-end text-sm">
                  <Button variant="link" className="p-0 text-primary">Şifremi Unuttum</Button>
              </div>
              <Button type="submit" className="w-full">Giriş Yap</Button>
          </form>
          <div className="text-center text-sm pt-2">
            <span className="text-muted-foreground">Kuruluşunuz kayıtlı değil mi? </span>
            <Link href="/login/selection?action=register" className="font-medium text-primary hover:underline">Başvur</Link>
          </div>
        </div>
    );
}

function CorporateRegister({ onRegister }: { onRegister: (e: React.FormEvent) => void }) {
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
                                        <Select onValueChange={(val) => { setOfficeCity(val); setOfficeDistrict(''); setOfficeNeighborhood(''); }}>
                                            <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                                            <SelectContent>{allProvinces.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>İlçe</Label>
                                        <Select onValueChange={(val) => { setOfficeDistrict(val); setOfficeNeighborhood(''); }} disabled={!officeCity}>
                                            <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                                            <SelectContent>{officeCity && districts[officeCity]?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mahalle</Label>
                                        <Select onValueChange={setOfficeNeighborhood} disabled={!officeDistrict}>
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
        <div className="space-y-6">
            <form className="space-y-6" onSubmit={onRegister}>
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

                {renderFormFields()}

                {applicationType && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Sözleşme Onayları</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Checkbox id="terms-corp" required />
                                    <Label htmlFor="terms-corp" className="text-xs font-normal text-muted-foreground">
                                        <Link href="/settings/contracts/kurulus-sozlesmesi" className="font-medium text-primary hover:underline">Kuruluş Sözleşmesi</Link>, <Link href="/settings/contracts/sosyal-etki-politikasi" className="font-medium text-primary hover:underline">Sosyal Etki Politikası</Link> ve <Link href="/settings/contracts/gizlilik-politikasi" className="font-medium text-primary hover:underline">Gizlilik Politikası</Link>'nı okudum, anladım ve onaylıyorum.
                                    </Label>
                                </div>
                                {applicationType === 'BRAND' && (
                                    <div className="flex items-start space-x-3">
                                        <Checkbox id="terms-fee" required />
                                        <Label htmlFor="terms-fee" className="text-xs font-normal text-muted-foreground">
                                            Hangel <Link href="/settings/contracts/ucret-politikasi" className="font-medium text-primary hover:underline">Ücret Politikası</Link>'nı okudum ve kabul ediyorum.
                                        </Label>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Button type="submit" className="w-full">Başvuruyu Tamamla</Button>
                        <p className="text-xs text-center text-muted-foreground">
                            Başvurunuz incelendikten sonra hesabınız aktifleştirilecektir.
                        </p>
                    </div>
                )}
            </form>
            <div className="text-center text-sm pt-2">
                <span className="text-muted-foreground">Zaten hesabınız var mı? </span>
                <Link href="/login/selection?action=login" className="font-medium text-primary hover:underline">Giriş Yap</Link>
            </div>
        </div>
    );
}

function SelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action') || 'login';

  const title = action === 'register' ? 'Kayıt Ol' : 'Giriş Yap';
  const description = 'Hangel\'e devam etmek için hesap türünü seçin.';

  const handleIndividualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/market');
  };

  const handleIndividualRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/market');
  };

  const handleCorporateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin');
  };

  const handleCorporateRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background relative py-12">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-4 left-4">
          <ArrowLeft className="h-6 w-6" />
       </Button>
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-headline">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>

        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Bireysel Hesap</TabsTrigger>
            <TabsTrigger value="corporate">Kurumsal Hesap</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual" className="mt-6">
            {action === 'login' ? (
                <IndividualLogin onLogin={handleIndividualLogin} />
            ) : (
                <IndividualRegister onRegister={handleIndividualRegister} />
            )}
          </TabsContent>
          
          <TabsContent value="corporate" className="mt-6">
             {action === 'login' ? (
                <CorporateLogin onLogin={handleCorporateLogin} />
             ) : (
                <CorporateRegister onRegister={handleCorporateRegister} />
             )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SelectionPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>}>
            <SelectionContent />
        </Suspense>
    )
}
