import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Bell, ChevronRight, FileText, Globe, HelpCircle, Info, LogOut, Palette, Shield, Trash2, User } from 'lucide-react';
import Link from 'next/link';

const SettingsSection = ({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-4">
      {children}
    </CardContent>
  </Card>
);

const SettingsLink = ({ href, icon, label }: { href: string, icon: React.ElementType, label: string }) => {
  const Icon = icon;
  return (
    <Link href={href}>
       <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors">
          <div className="flex items-center gap-4">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{label}</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
       </div>
    </Link>
  )
}

const SettingsSwitch = ({ label, description, defaultChecked = false }: { label: string, description: string, defaultChecked?: boolean }) => (
    <div className="flex items-center justify-between rounded-lg border p-4">
        <div className='space-y-0.5'>
            <Label>{label}</Label>
            <p className='text-xs text-muted-foreground'>{description}</p>
        </div>
        <Switch defaultChecked={defaultChecked} />
    </div>
);


export default function SettingsPage() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Ayarlar</h1>

      <SettingsSection title="Hesap">
        <SettingsLink href="#" icon={User} label="Kişisel Bilgileri Düzenle" />
        <SettingsLink href="#" icon={User} label="Gönüllülük Bilgilerini Düzenle" />
      </SettingsSection>
      
      <SettingsSection title="Bildirimler" description="Hangi durumlarda bildirim almak istediğinizi seçin.">
         <h3 className="text-sm font-medium text-muted-foreground pt-2">Anlık Bildirimler (Mobil/Web)</h3>
         <SettingsSwitch label="Yeni Bağış Yapıldığında" description="Bir alışverişiniz bağışa dönüştüğünde." defaultChecked />
         <SettingsSwitch label="Başvuru Durumu Değiştiğinde" description="Gönüllülük başvurularınız güncellendiğinde." defaultChecked />
         <SettingsSwitch label="Yeni Rozet Kazanıldığında" description="Başarılarınız için sizi tebrik edelim." />
         
         <h3 className="text-sm font-medium text-muted-foreground pt-4">E-posta Bildirimleri</h3>
         <SettingsSwitch label="Haftalık Bülten" description="Haftanın öne çıkanları ve fırsatlar." />
         <SettingsSwitch label="Aylık Etki Raporu" description="Yarattığınız sosyal etkiyi özetleyen rapor." defaultChecked />
      </SettingsSection>

      <SettingsSection title="Güvenlik">
        <SettingsLink href="#" icon={Shield} label="İki Adımlı Doğrulama" />
        <SettingsLink href="#" icon={Shield} label="Şifre Değiştir" />
        <SettingsLink href="#" icon={Shield} label="Oturumları Yönet" />
      </SettingsSection>

      <SettingsSection title="Uygulama" description="Uygulamanın görünümünü ve dilini kişiselleştirin.">
         <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="theme">Tema</Label>
            <Select defaultValue='system'>
              <SelectTrigger id="theme">
                <SelectValue placeholder="Tema seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Açık</SelectItem>
                <SelectItem value="dark">Koyu</SelectItem>
                <SelectItem value="system">Sistem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="language">Dil</Label>
             <Select defaultValue='tr'>
              <SelectTrigger id="language">
                <SelectValue placeholder="Dil seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tr">Türkçe</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
      </SettingsSection>

       <SettingsSection title="Destek & Yasal">
        <SettingsLink href="/support" icon={HelpCircle} label="Yardım Merkezi" />
        <SettingsLink href="/about" icon={Info} label="Hakkımızda" />
        <SettingsLink href="#" icon={FileText} label="Gizlilik Politikası" />
        <SettingsLink href="#" icon={FileText} label="Kullanıcı Sözleşmesi" />
      </SettingsSection>

      <SettingsSection title="Hesabı Sil">
        <p className="text-sm text-muted-foreground">Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.</p>
        <Button variant="destructive" className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />
            Hesabımı Sil
        </Button>
      </SettingsSection>

      <div className="pt-4">
        <Button variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
        </Button>
      </div>

    </div>
  );
}