'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ArrowLeft, Lock, Shield } from 'lucide-react';
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


export default function PrivacySettingsPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSave = () => {
        toast({
            title: "Ayarlar Kaydedildi",
            description: "Gizlilik tercihleriniz başarıyla güncellendi.",
        });
    };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold font-headline">Gizlilik ve Etkileşim</h1>
            <p className="text-muted-foreground text-sm">Profilinizin görünürlüğünü ve kimlerin sizinle etkileşime girebileceğini yönetin.</p>
        </div>

        <Card>
           <CardHeader>
                <CardTitle>Profil Gizliliği</CardTitle>
            </CardHeader>
             <CardContent className="p-0">
                <div className="flex flex-col">
                    <SettingsItem 
                        label="Özel Profil"
                        description="Etkinleştirilirse, profilinizi sadece onayladığınız takipçiler görebilir."
                        icon={Lock} 
                        iconColor="bg-red-500" 
                    >
                        <Switch id="private-profile" />
                    </SettingsItem>
                </div>
            </CardContent>
        </Card>
        
        <Card>
           <CardHeader>
                <CardTitle>Veri Gizliliği</CardTitle>
                 <CardDescription>Profilinizde hangi bilgilerin görüneceğini seçin.</CardDescription>
            </CardHeader>
             <CardContent className="p-0">
                <div className="flex flex-col">
                    <SettingsItem
                        label="Etki Puanımı Gizle"
                        description="Sosyal etki puanınız ve istatistikleriniz profilinizde görünmez."
                        icon={Shield} 
                        iconColor="bg-green-500"
                    >
                         <Switch id="hide-score" />
                    </SettingsItem>
                    <SettingsItem
                        label="Hakkında Bilgilerimi Gizle"
                        description="Kişisel ve iletişim bilgileriniz profilinizde görünmez."
                        icon={Shield} 
                        iconColor="bg-green-500"
                    >
                         <Switch id="hide-about" />
                    </SettingsItem>
                    <SettingsItem
                        label="Gönüllülük Bilgilerimi Gizle"
                        description="Gönüllülük yetkinlikleriniz ve geçmişiniz profilinizde görünmez."
                        icon={Shield} 
                        iconColor="bg-green-500"
                    >
                         <Switch id="hide-volunteer" />
                    </SettingsItem>
                    <SettingsItem
                        label="Rozetlerimi Gizle"
                        description="Kazandığınız rozetler profilinizde görünmez."
                        icon={Shield} 
                        iconColor="bg-green-500"
                    >
                         <Switch id="hide-badges" />
                    </SettingsItem>
                    <SettingsItem
                        label="Sertifikalarımı Gizle"
                        description="Kazandığınız sertifikalar profilinizde görünmez."
                        icon={Shield} 
                        iconColor="bg-green-500"
                    >
                         <Switch id="hide-certificates" />
                    </SettingsItem>
                    <SettingsItem
                        label="Gönderilerimi Gizle"
                        description="Paylaştığınız gönderiler profilinizde görünmez."
                        icon={Shield} 
                        iconColor="bg-green-500"
                    >
                         <Switch id="hide-posts" />
                    </SettingsItem>
                     <SettingsItem
                        label="Bağış Aktivitelerimi Gizle"
                        description="Bağış ve işlem geçmişiniz profilinizde görünmez."
                        icon={Shield} 
                        iconColor="bg-green-500"
                    >
                         <Switch id="hide-donations" />
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
