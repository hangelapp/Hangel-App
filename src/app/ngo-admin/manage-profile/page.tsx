'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import React from 'react';

export default function ManageProfilePage() {
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ngo-name">Kuruluşun Tam Adı</Label>
                <Input id="ngo-name" defaultValue="Ahbap Derneği" />
              </div>
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
                    </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="ngo-email">İletişim E-postası</Label>
                    <Input id="ngo-email" type="email" defaultValue="iletisim@ahbap.org" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ngo-website">Web Sitesi</Label>
                    <Input id="ngo-website" defaultValue="https://ahbap.org" />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ngo-about">Hakkında</Label>
              <Textarea id="ngo-about" rows={5} defaultValue="Ahbap, ihtiyaç sahibi kişilere ayni ve nakdi olmak üzere her türlü yardımda bulunmak, toplumda yardımlaşma bilincinin güçlenmesini sağlamak, iyi insan ve iyi toplum inşasına hizmet etmek amacıyla kurulmuş bir işbirliği hareketidir." />
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
