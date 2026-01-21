'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ArrowLeft, Lock, Shield, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';


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
                    <SettingsItem label="Etkileşimler" icon={Users} iconColor="bg-red-500">
                        <Select defaultValue='herkes'>
                          <SelectTrigger className='w-auto border-none bg-accent focus:ring-0'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="herkes">Herkes Gönderilerinize Yorum Yapabilir</SelectItem>
                            <SelectItem value="takipciler">Sadece Takipçiler</SelectItem>
                            <SelectItem value="kimse">Kimse</SelectItem>
                          </SelectContent>
                        </Select>
                    </SettingsItem>
                </div>
            </CardContent>
        </Card>
        
        <Card>
           <CardHeader>
                <CardTitle>Veri Gizliliği</CardTitle>
            </CardHeader>
             <CardContent className="p-0">
                <div className="flex flex-col">
                    <SettingsItem
                        label="Etki Puanımı Gizle"
                        description="Sosyal etki puanınız profilinizde görünmez."
                        icon={Shield} 
                        iconColor="bg-green-500"
                    >
                         <Switch id="hide-score" />
                    </SettingsItem>
                     <SettingsItem
                        label="Bağış Aktivitelerimi Gizle"
                        description="Hangi markalardan alışveriş yaptığınız ve ne kadar bağış yaptığınız görünmez."
                        icon={Shield} 
                        iconColor="bg-green-500"
                    >
                         <Switch id="hide-donations" />
                    </SettingsItem>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button>Değişiklikleri Kaydet</Button>
        </div>
    </div>
  );
}
