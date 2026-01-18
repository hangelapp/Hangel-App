'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import React from 'react';

export default function ManageProfilePage() {
  const [aboutText, setAboutText] = React.useState("Ahbap, ihtiyaç sahibi kişilere ayni ve nakdi olmak üzere her türlü yardımda bulunmak, toplumda yardımlaşma bilincinin güçlenmesini sağlamak, iyi insan ve iyi toplum inşasına hizmet etmek amacıyla kurulmuş bir işbirliği hareketidir.");
  const ABOUT_MAX_LENGTH = 1000;

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
             <div className="space-y-2">
                <Label htmlFor="ngo-name">Kuruluşun Tam Adı</Label>
                <Input id="ngo-name" defaultValue="Ahbap Derneği" />
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
                        <SelectItem value="ozel">Özel İzinli</SelectItem>
                         <SelectItem value="spor">Spor Kulübü</SelectItem>
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
                <CardTitle>Kuruluş Detayları</CardTitle>
                <CardDescription>Kuruluşunuzun odaklandığı alanları ve üyeliklerini belirtin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="ngo-beneficiaries">Faydalanıcılar</Label>
                    <Textarea id="ngo-beneficiaries" placeholder="Örn: Çocuklar, Kadınlar, Afetzedeler..." defaultValue="Afetzedeler, İhtiyaç Sahibi Aileler, Öğrenciler, Hastalar"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ngo-sdgs">Desteklenen BM Sürdürülebilir Kalkınma Amaçları</Label>
                    <Textarea id="ngo-sdgs" placeholder="Örn: Yoksulluğa Son, Nitelikli Eğitim..." defaultValue="Yoksulluğa Son, Sağlıklı ve Kaliteli Yaşam, Nitelikli Eğitim" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ngo-memberships">Üye Olunan Platformlar</Label>
                    <Textarea id="ngo-memberships" placeholder="Örn: Afet Platformu, Açık Açık..." defaultValue="Afet Platformu" />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Adres Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="ngo-country">Ülke</Label>
                        <Input id="ngo-country" defaultValue="Türkiye" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ngo-city">Şehir</Label>
                        <Input id="ngo-city" defaultValue="İstanbul" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="ngo-district">İlçe</Label>
                        <Input id="ngo-district" defaultValue="Kadıköy" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="ngo-neighborhood">Mahalle</Label>
                        <Input id="ngo-neighborhood" defaultValue="Caferağa" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="ngo-address">Açık Adres</Label>
                    <Input id="ngo-address" defaultValue="Zuhal Sk. No:1" />
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
            </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Yasal Belgeler ve Görseller</CardTitle>
            <CardDescription>Bu bilgiler şeffaflık puanınızı etkiler.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                    <Input id="logo-upload" type="file" className="hidden" />
                    <Button asChild variant="outline">
                        <label htmlFor="logo-upload" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Logo Yükle</label>
                    </Button>
                    <span className="text-sm text-muted-foreground">Mevcut: ahbap_logo.png</span>
                </div>
            </div>
             <div className="space-y-2">
                <Label>Kapak Fotoğrafı</Label>
                <div className="flex items-center gap-4">
                    <Input id="cover-upload" type="file" className="hidden" />
                    <Button asChild variant="outline">
                        <label htmlFor="cover-upload" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Kapak Yükle</label>
                    </Button>
                     <span className="text-sm text-muted-foreground">Mevcut: ahbap_cover.jpg</span>
                </div>
            </div>
             <div className="space-y-2">
                <Label>Tüzük / Vakıf Senedi</Label>
                <div className="flex items-center gap-4">
                    <Input id="charter-upload" type="file" className="hidden" />
                    <Button asChild variant="outline">
                        <label htmlFor="charter-upload" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Belge Yükle</label>
                    </Button>
                     <span className="text-sm text-muted-foreground">Mevcut: ahbap_tuzuk.pdf</span>
                </div>
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
