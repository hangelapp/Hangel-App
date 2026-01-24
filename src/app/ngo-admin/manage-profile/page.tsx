
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Facebook, Instagram, Linkedin, Twitter, Youtube, Link as LinkIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

const allProvinces = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];

const allBeneficiaries = ['Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre'];
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

const FileUpload = ({label, currentFile}: {label: string, currentFile?: string}) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-4">
            <Input id={`${label}-upload`} type="file" className="hidden" />
            <Button asChild variant="outline">
                <label htmlFor={`${label}-upload`} className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />{currentFile ? 'Değiştir' : 'Yükle'}</label>
            </Button>
            {currentFile && <span className="text-sm text-muted-foreground">Mevcut: {currentFile}</span>}
        </div>
    </div>
)

const CheckboxGroup = ({ title, options, defaultValues }: { title: string, options: string[], defaultValues: string[] }) => {
    return (
        <div className="space-y-2">
            <Label>{title}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-lg border p-4">
                {options.map(option => (
                    <div key={option} className="flex items-center gap-2">
                        <Checkbox 
                            id={`${title}-${option.replace(/\s/g, '-')}`}
                            defaultChecked={defaultValues.includes(option)}
                        />
                        <Label htmlFor={`${title}-${option.replace(/\s/g, '-')}`} className="text-sm font-normal">{option}</Label>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ManageProfilePage() {
  const [aboutText, setAboutText] = React.useState("Ahbap, ihtiyaç sahibi kişilere ayni ve nakdi olmak üzere her türlü yardımda bulunmak, toplumda yardımlaşma bilincinin güçlenmesini sağlamak, iyi insan ve iyi toplum inşasına hizmet etmek amacıyla kurulmuş bir işbirliği hareketidir.");
  const ABOUT_MAX_LENGTH = 1000;
  
  const [officeCity, setOfficeCity] = useState('İstanbul');
  const [mailCity, setMailCity] = useState('İstanbul');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">STK Profilini Güncelle</h1>
        <p className="text-muted-foreground">
          Platformda görünen bilgilerinizi ve yasal belgelerinizi buradan yönetebilirsiniz.
        </p>
      </div>
      
      <form className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Kuruluş Bilgileri</CardTitle>
            <CardDescription>Kuruluşunuzun temel kimlik bilgileri.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="ngo-name">Kuruluşun Tam Adı</Label>
                    <Input id="ngo-name" defaultValue="Ahbap Derneği" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ngo-short-name">Kuruluş Kısa Adı</Label>
                    <Input id="ngo-short-name" defaultValue="Ahbap" placeholder="Örn: AHBAP" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ngo-type">Kuruluş Türü</Label>
                <Select defaultValue="dernek">
                    <SelectTrigger id="ngo-type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="dernek">Dernek</SelectItem>
                        <SelectItem value="vakif">Vakıf</SelectItem>
                        <SelectItem value="spor">Spor Kulübü</SelectItem>
                        <SelectItem value="ozel">Özel İzinli</SelectItem>
                         <SelectItem value="ogrenci">Öğrenci Kulübü</SelectItem>
                    </SelectContent>
                </Select>
              </div>
                <div className="space-y-2">
                    <Label htmlFor="ngo-website">Web Sitesi</Label>
                    <Input id="ngo-website" defaultValue="https://ahbap.org" />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ngo-about">Hakkında</Label>
              <Textarea 
                id="ngo-about" 
                rows={5} 
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
                    <Input placeholder="Örn: Anadolu Platformu" defaultValue="Anadolu Platformu"/>
                </div>
                <FileUpload label="Üst Kuruluş Logosu" currentFile="anadolu_platformu.png"/>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Kuruluş Detayları</CardTitle>
                <CardDescription>Kuruluşunuzun odaklandığı alanları ve üyeliklerini belirtin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <CheckboxGroup title="Faydalanıcılar" options={allBeneficiaries} defaultValues={["Afetzedeler", "İhtiyaç Sahibi Aileler", "Öğrenciler", "Hastalar"]} />
                <CheckboxGroup title="Birleşmiş Milletler 17 Sürdürülebilir Kalkınma Hedefleri" options={allSdgs} defaultValues={["1. Yoksulluğa Son", "3. Sağlıklı ve Kaliteli Yaşam", "4. Nitelikli Eğitim"]} />
                <CheckboxGroup title="Üye Olunan Platformlar" options={allMemberships} defaultValues={["Afet Platformu", "Açık Açık"]} />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>İletişim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="ngo-email">STK'nın e-postası</Label>
                    <Input id="ngo-email" type="email" defaultValue="iletisim@ahbap.org" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="ngo-phone">Telefon Numarası</Label>
                    <Input id="ngo-phone" type="tel" defaultValue="0216 550 50 50" />
                </div>
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
                        <Select defaultValue="İstanbul" onValueChange={setOfficeCity}>
                            <SelectTrigger id="office-city"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="office-district">İlçe</Label>
                        <Select defaultValue="Kadıköy" disabled={!officeCity}>
                            <SelectTrigger id="office-district"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {officeCity && districts[officeCity] && districts[officeCity].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="office-neighborhood">Mahalle</Label>
                    <Input id="office-neighborhood" defaultValue="Caferağa" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="office-address">Açık Adres (Sokak, Kapı No vb.)</Label>
                    <Input id="office-address" defaultValue="Zuhal Sk. No:1" />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Posta Adresi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id="same-address" />
                    <Label htmlFor="same-address">Ofis adresi ile aynı</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="mail-city">İl</Label>
                        <Select defaultValue="İstanbul" onValueChange={setMailCity}>
                            <SelectTrigger id="mail-city"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mail-district">İlçe</Label>
                        <Select defaultValue="Kadıköy" disabled={!mailCity}>
                            <SelectTrigger id="mail-district"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {mailCity && districts[mailCity] && districts[mailCity].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mail-neighborhood">Mahalle</Label>
                    <Input id="mail-neighborhood" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mail-address">Açık Adres (Sokak, Kapı No vb.)</Label>
                    <Input id="mail-address" />
                </div>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Banka ve Ödeme Entegrasyonu</CardTitle>
                 <CardDescription>Bağışların aktarılacağı hesap ve sanal POS entegrasyon bilgileri.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="account-holder">Hesap Sahibi Adı</Label>
                    <Input id="account-holder" defaultValue="Ahbap Derneği" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bank-name">Banka Adı</Label>
                    <Input id="bank-name" defaultValue="Türkiye İş Bankası" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ngo-iban">Banka IBAN Numarası</Label>
                    <Input id="ngo-iban" defaultValue="TR00 0000 0000 0000 0000 0000 00" />
                </div>
                <div className="pt-4 border-t">
                     <h3 className="text-base font-medium mb-2">Sanal POS Bilgileri (İsteğe Bağlı)</h3>
                     <div className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="pos-merchant-id">Üye İşyeri Numarası (Merchant ID)</Label>
                            <Input id="pos-merchant-id" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="pos-api-key">API Anahtarı (API Key)</Label>
                            <Input id="pos-api-key" type="password"/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="pos-api-secret">API Şifresi (API Secret)</Label>
                            <Input id="pos-api-secret" type="password"/>
                        </div>
                     </div>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Sosyal Medya Hesapları</CardTitle>
                <CardDescription>Topluluğunuzla etkileşimde kaldığınız kanallar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="social-twitter">Twitter (X)</Label>
                    <div className='flex items-center gap-2'>
                        <Twitter className='h-5 w-5 text-muted-foreground' />
                        <Input id="social-twitter" placeholder="Kullanıcı Adı" defaultValue="ahbap" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="social-instagram">Instagram</Label>
                     <div className='flex items-center gap-2'>
                        <Instagram className='h-5 w-5 text-muted-foreground' />
                        <Input id="social-instagram" placeholder="Kullanıcı Adı" defaultValue="ahbap" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="social-facebook">Facebook</Label>
                     <div className='flex items-center gap-2'>
                        <Facebook className='h-5 w-5 text-muted-foreground' />
                        <Input id="social-facebook" placeholder="Sayfa Adı" defaultValue="ahbapdernegi" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="social-linkedin">LinkedIn</Label>
                     <div className='flex items-center gap-2'>
                        <Linkedin className='h-5 w-5 text-muted-foreground' />
                        <Input id="social-linkedin" placeholder="Sayfa Adı" defaultValue="ahbap-dernegi" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="social-youtube">YouTube</Label>
                     <div className='flex items-center gap-2'>
                        <Youtube className='h-5 w-5 text-muted-foreground' />
                        <Input id="social-youtube" placeholder="Kanal ID veya kullanıcı adı" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="social-other">Blog / Diğer</Label>
                     <div className='flex items-center gap-2'>
                        <LinkIcon className='h-5 w-5 text-muted-foreground' />
                        <Input id="social-other" placeholder="https://..." />
                    </div>
                </div>
            </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Yasal Belgeler ve Görseller</CardTitle>
            <CardDescription>Bu bilgiler şeffaflık puanınızı etkiler.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <FileUpload label="Logo" currentFile="ahbap_logo.png" />
             <FileUpload label="Faaliyet Belgesi" currentFile="faaliyet_belgesi.pdf" />
             <FileUpload label="Tüzük / Vakıf Senedi" currentFile="ahbap_tuzuk.pdf" />
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Sözleşme ve Politika Onayları</CardTitle>
                <CardDescription>Platformda yer alabilmek için bu belgeleri okuyup onaylamanız gerekmektedir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                    <Checkbox id="terms-ngo" required defaultChecked/>
                    <Label htmlFor="terms-ngo" className="text-sm font-normal text-muted-foreground">
                        <Link href="/settings/contracts/kurulus-sozlesmesi" className="font-medium text-primary hover:underline">Kuruluş Sözleşmesi</Link>'ni okudum ve kabul ediyorum.
                    </Label>
                </div>
                 <div className="flex items-start space-x-3">
                    <Checkbox id="terms-privacy" required defaultChecked/>
                    <Label htmlFor="terms-privacy" className="text-sm font-normal text-muted-foreground">
                        <Link href="/settings/contracts/gizlilik-politikasi" className="font-medium text-primary hover:underline">Gizlilik Politikası</Link> ve <Link href="/settings/contracts/kvkk-aydinlatma-metni" className="font-medium text-primary hover:underline">KVKK Aydınlatma Metni</Link>'ni okudum ve kabul ediyorum.
                    </Label>
                </div>
                 <div className="flex items-start space-x-3">
                    <Checkbox id="terms-social-impact" required defaultChecked/>
                    <Label htmlFor="terms-social-impact" className="text-sm font-normal text-muted-foreground">
                        <Link href="/settings/contracts/sosyal-etki-politikasi" className="font-medium text-primary hover:underline">Sosyal Etki Politikası</Link>'nı ve <Link href="/settings/contracts/bagis-ve-yardim-politikasi" className="font-medium text-primary hover:underline">Bağış ve Yardım Politikası</Link>'nı okudum ve kabul ediyorum.
                    </Label>
                </div>
            </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit">Değişiklikleri Kaydet</Button>
        </div>
      </form>
    </div>
  );
}

    
