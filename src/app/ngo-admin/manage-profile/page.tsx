
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Instagram, Linkedin, Youtube, ArrowLeft, Globe, Mail, Phone, MapPin, Palette, FileText, X, Save } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { allUniversities, countryPhoneCodes, sportsFederations, allProvinces, districtsData, neighborhoodsData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const XIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      {...props}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

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
const years = Array.from({ length: 2025 - 1900 }, (_, i) => (2024 - i).toString());

const FileUpload = ({label, currentFile, required}: {label: string, currentFile?: string, required?: boolean}) => (
    <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label} {required && "*"}</Label>
        <div className="flex items-center gap-4 p-4 border rounded-2xl bg-muted/20 border-dashed border-primary/20">
            <input id={`${label}-upload`} type="file" className="hidden" required={required} />
            <Button asChild variant="outline" size="sm" className="rounded-xl border-primary/20 hover:bg-primary/5">
                <label htmlFor={`${label}-upload`} className="cursor-pointer font-bold"><Upload className="mr-2 h-4 w-4" />{currentFile ? 'Değiştir' : 'Belge Seç'}</label>
            </Button>
            <div className="flex-1">
                <p className="text-[10px] text-muted-foreground leading-tight">{currentFile ? `Mevcut: ${currentFile}` : "Resmi formatta bir dosya yükleyin."}</p>
            </div>
        </div>
    </div>
)

const CheckboxGroup = ({ title, options, defaultValues = [] }: { title: string, options: string[], defaultValues?: string[] }) => {
    return (
        <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{title}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl border p-4 bg-background">
                {options.map(option => (
                    <div key={option} className="flex items-center gap-2">
                        <Checkbox 
                            id={`${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`} 
                            defaultChecked={defaultValues.includes(option)}
                        />
                        <Label htmlFor={`${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`} className="text-xs font-medium cursor-pointer leading-none">{option}</Label>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ManageProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [aboutText, setAboutText] = useState("Ahbap, ihtiyaç sahibi kişilere ayni ve nakdi olmak üzere her türlü yardımda bulunmak, toplumda yardımlaşma bilincinin güçlenmesini sağlamak, iyi insan ve iyi toplum inşasına hizmet etmek amacıyla kurulmuş bir işbirliği hareketidir.");
  const ABOUT_MAX_LENGTH = 1000;
  
  const [ngoType, setNgoType] = useState('dernek');
  const [selectedFeds, setSelectedFeds] = useState<string[]>([]);
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('Kadıköy');
  const [neighborhood, setNeighborhood] = useState('Caferağa');

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      toast({ title: "Değişiklikler Kaydedildi", description: "Kuruluş profiliniz başarıyla güncellendi." });
  };

  const toggleFed = (fed: string) => {
    if (selectedFeds.includes(fed)) {
        setSelectedFeds(selectedFeds.filter(f => f !== fed));
    } else if (selectedFeds.length < 3) {
        setSelectedFeds([...selectedFeds, fed]);
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">STK Profili Güncelle</h1>
                <p className="text-muted-foreground text-sm">Platformda görünen bilgilerinizi buradan yönetebilirsiniz.</p>
            </div>
          </div>
          <Button onClick={handleSave} size="sm" className="shadow-lg"><Save className="mr-2 h-4 w-4" /> Kaydet</Button>
      </div>
      
      <form onSubmit={handleSave} className="space-y-8">
        <Card className="rounded-[2rem] overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Kuruluş Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Türü</Label>
                <Select required onValueChange={setNgoType} defaultValue={ngoType}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="dernek">Dernek</SelectItem>
                        <SelectItem value="vakif">Vakıf</SelectItem>
                        <SelectItem value="spor-kulubu">Spor Kulübü</SelectItem>
                        <SelectItem value="ozel-izinli">Özel İzinli</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Tam Adı</Label>
                <Input defaultValue="Ahbap Derneği" className="h-11 rounded-xl" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Kısa Adı</Label>
                    <Input defaultValue="Ahbap" className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Yılı</Label>
                    <Select defaultValue="2017" required>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İktisadi İşletme Durumu</Label>
                    <Select defaultValue="var" required>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="var">Var</SelectItem>
                            <SelectItem value="yok">Yok</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kullanım Amacı</Label>
                    <Select defaultValue="both" required>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="donation">Bağış toplamak</SelectItem>
                            <SelectItem value="volunteer">Gönüllülük ilanı vermek</SelectItem>
                            <SelectItem value="both">Bağış ve Gönüllülük ilanı vermek</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {ngoType === 'spor-kulubu' && (
                <div className="space-y-4 p-4 border rounded-[2rem] bg-primary/5 border-primary/10 animate-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Kayıt Olduğunuz Federasyonlar</Label>
                    <Select onValueChange={toggleFed}>
                        <SelectTrigger className="h-11 rounded-xl bg-white shadow-sm"><SelectValue placeholder="Federasyon ekleyin..." /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {sportsFederations.map(fed => <SelectItem key={fed} value={fed}>{fed}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2">
                        {selectedFeds.map(fed => (
                            <Badge key={fed} className="bg-white text-foreground border shadow-sm px-3 py-1.5 rounded-xl gap-2 h-auto flex items-center">
                                <span className="text-[11px] font-medium">{fed}</span>
                                <button type="button" onClick={() => toggleFed(fed)}><X className="h-3 w-3" /></button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Hakkında</Label>
                    <span className={cn("text-[10px] font-bold text-muted-foreground")}>{aboutText.length} / {ABOUT_MAX_LENGTH}</span>
                </div>
                <Textarea 
                    value={aboutText} 
                    onChange={(e) => setAboutText(e.target.value)} 
                    maxLength={ABOUT_MAX_LENGTH} 
                    className="min-h-[120px] rounded-2xl"
                    required
                />
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-8">
            <CheckboxGroup title="Faydalanıcılar" options={allBeneficiaries} defaultValues={["Afetzedeler", "İhtiyaç Sahibi Aileler", "Öğrenciler"]} />
            <CheckboxGroup title="Sürdürülebilir Kalkınma Hedefleri (SKA)" options={allSdgs} defaultValues={["1. Yoksulluğa Son", "2. Açlığa Son"]} />
            <CheckboxGroup title="Üye Olunan Platformlar" options={allMemberships} defaultValues={["Afet Platformu", "Açık Açık"]} />
        </div>

        <Card className="rounded-[2rem] overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Adres & İletişim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İl</Label>
                        <Select value={city} onValueChange={(val) => { setCity(val); setDistrict(''); setNeighborhood(''); }} required>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="İl Seçiniz..." /></SelectTrigger>
                            <SelectContent>{allProvinces.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İlçe</Label>
                        <Select value={district} onValueChange={(val) => { setDistrict(val); setNeighborhood(''); }} disabled={!city} required>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="İlçe Seçiniz..." /></SelectTrigger>
                            <SelectContent>{city && (districtsData[city] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mahalle</Label>
                    {city && district && neighborhoodsData[city]?.[district] ? (
                        <Select value={neighborhood} onValueChange={setNeighborhood} required>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Mahalle Seçiniz..." /></SelectTrigger>
                            <SelectContent>
                                {neighborhoodsData[city][district].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Mahalle giriniz..." required disabled={!district} className="h-11 rounded-xl" />
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal E-posta</Label>
                    <Input type="email" defaultValue="iletisim@ahbap.org" className="h-11 rounded-xl" required />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal Telefon</Label>
                    <div className="flex gap-2">
                        <div className="w-[100px] shrink-0">
                            <Select defaultValue="90" required>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>{countryPhoneCodes.map(code => <SelectItem key={code} value={code}>+{code}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <Input defaultValue="5551234567" className="h-11 rounded-xl flex-1" required />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="rounded-[2rem] overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Sosyal Medya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                {[
                    { label: 'Instagram', icon: Instagram, prefix: 'instagram.com/' },
                    { label: 'X (Twitter)', icon: XIcon, prefix: 'x.com/' },
                    { label: 'LinkedIn', icon: Linkedin, prefix: 'linkedin.com/company/' },
                    { label: 'YouTube', icon: Youtube, prefix: 'youtube.com/@' },
                ].map((social) => (
                    <div key={social.label} className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{social.label}</Label>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-muted rounded-lg"><social.icon className="h-4 w-4 text-muted-foreground" /></div>
                            <Input placeholder={social.prefix + "kullaniciadi"} className="h-11 rounded-xl" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card className="rounded-[2rem] overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Yasal Belgeler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
             <FileUpload label="Kuruluş Logosu (PNG/JPG)" currentFile="ahbap_logo.png" required={true} />
             <FileUpload label="Faaliyet Belgesi (PNG/PDF)" currentFile="faaliyet_belgesi_2024.pdf" required={true} />
             <FileUpload label={ngoType === 'vakif' ? 'Vakıf Senedi (PDF)' : 'Tüzük (PDF)'} currentFile="dernek_tuzugu.pdf" required={true} />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] overflow-hidden shadow-sm bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Yetkili Kişi Bilgileri</CardTitle>
                <CardDescription>Kuruluşu platformda temsil eden ana yetkili bilgileri.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ad Soyad</Label>
                    <Input defaultValue="Haluk Levent" className="h-11 rounded-xl bg-white" required />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Görevi</Label>
                    <Input defaultValue="Genel Başkan" className="h-11 rounded-xl bg-white" required />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Şahsi E-posta</Label>
                    <Input defaultValue="haluk@ahbap.org" className="h-11 rounded-xl bg-white" required />
                </div>
            </CardContent>
        </Card>
        
        <div className="flex justify-end gap-4 pb-10">
          <Button variant="outline" onClick={() => router.back()}>İptal</Button>
          <Button onClick={handleSave} className="px-10 font-bold">Tümünü Kaydet</Button>
        </div>
      </form>
    </div>
  );
}
