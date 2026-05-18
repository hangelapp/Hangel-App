'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ArrowLeft, Contrast, MinusCircle, Type, Eye, Ear, Pilcrow } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const SettingsItem = ({ children, icon: Icon, label, iconColor, description }: { children: React.ReactNode, icon: React.ElementType, label: string, iconColor: string, description?: string }) => (
    <div className="flex items-center p-4 text-sm sm:text-base border-b last:border-b-0">
        <div className={cn("p-1.5 rounded-lg mr-4", iconColor)}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div className='flex-1 space-y-0.5'>
            <label htmlFor={label.replace(/\s/g, '')} className="font-medium cursor-pointer">{label}</label>
            {description && <p className='text-xs text-muted-foreground'>{description}</p>}
        </div>
        {children}
    </div>
);


export default function AppearanceSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSave = () => {
        toast({
            title: "Ayarlar Kaydedildi",
            description: "Görünüm ayarlarınız başarıyla güncellendi.",
        });
    };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label="Geri">
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold font-headline">Görünüm Ayarları</h1>
            <p className="text-muted-foreground text-sm">Deneyiminizi iyileştirmek için uygulama görünümünü yapılandırın.</p>
        </div>

        <Card>
           <CardHeader>
                <CardTitle>Görsel Ayarlar</CardTitle>
            </CardHeader>
             <CardContent className="p-0">
                <div className="flex flex-col">
                    <SettingsItem 
                        label="Yüksek Kontrast Modu"
                        description="Okunabilirliği artırmak için renkleri daha belirgin hale getirir."
                        icon={Contrast} 
                        iconColor="bg-indigo-500" 
                    >
                        <Switch id="a11y-contrast" />
                    </SettingsItem>
                     <SettingsItem label="Yazı Tipi Boyutu" icon={Type} iconColor="bg-indigo-500">
                        <Select defaultValue='normal'>
                          <SelectTrigger className='w-auto border-none bg-accent focus:ring-0'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Küçük</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="large">Büyük</SelectItem>
                          </SelectContent>
                        </Select>
                    </SettingsItem>
                     <SettingsItem label="Renk Körlüğü Filtresi" icon={Eye} iconColor="bg-indigo-500">
                        <Select defaultValue='yok'>
                          <SelectTrigger className='w-auto border-none bg-accent focus:ring-0'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yok">Yok</SelectItem>
                            <SelectItem value="protanopia">Protanopia</SelectItem>
                            <SelectItem value="deuteranopia">Deuteranopia</SelectItem>
                            <SelectItem value="tritanopia">Tritanopia</SelectItem>
                          </SelectContent>
                        </Select>
                    </SettingsItem>
                    <SettingsItem 
                        label="Disleksi Dostu Yazı Tipi"
                        description="Okuma güçlüğü çeken kullanıcılar için özel yazı tipi kullanır."
                        icon={Pilcrow} 
                        iconColor="bg-indigo-500" 
                    >
                        <Switch id="a11y-dyslexia" />
                    </SettingsItem>
                </div>
            </CardContent>
        </Card>
        
        <Card>
           <CardHeader>
                <CardTitle>Etkileşim Ayarları</CardTitle>
            </CardHeader>
             <CardContent className="p-0">
                <div className="flex flex-col">
                    <SettingsItem
                        label="Animasyonları Azalt"
                        description="Uygulama içi geçiş efektlerini ve hareketleri azaltır."
                        icon={MinusCircle} 
                        iconColor="bg-teal-500"
                    >
                         <Switch id="a11y-animations" />
                    </SettingsItem>
                     <SettingsItem
                        label="Ekran Okuyucu İyileştirmeleri"
                        description="Ekran okuyucular için ARIA etiketlerini ve anonsları etkinleştirir."
                        icon={Ear} 
                        iconColor="bg-teal-500"
                    >
                         <Switch id="a11y-screenreader" defaultChecked />
                    </SettingsItem>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button onClick={handleSave}>Değişiklikleri Kaydet</Button>
        </div>
    </div>
  );
}
