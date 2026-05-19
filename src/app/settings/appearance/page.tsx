'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ArrowLeft, Contrast, MinusCircle, Type, Eye, Ear, Pilcrow } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';

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
    const { t } = useTranslation();

    const handleSave = () => {
        toast({
            title: t('dashboard.settingsAppearance.toastSavedTitle'),
            description: t('dashboard.settingsAppearance.toastSavedDesc'),
        });
    };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsAppearance.heading')}</h1>
            <p className="text-muted-foreground text-sm">{t('dashboard.settingsAppearance.subheading')}</p>
        </div>

        <Card>
           <CardHeader>
                <CardTitle>{t('dashboard.settingsAppearance.visualCardTitle')}</CardTitle>
            </CardHeader>
             <CardContent className="p-0">
                <div className="flex flex-col">
                    <SettingsItem
                        label={t('dashboard.settingsAppearance.highContrastLabel')}
                        description={t('dashboard.settingsAppearance.highContrastDesc')}
                        icon={Contrast}
                        iconColor="bg-indigo-500"
                    >
                        <Switch id="a11y-contrast" />
                    </SettingsItem>
                     <SettingsItem label={t('dashboard.settingsAppearance.fontSizeLabel')} icon={Type} iconColor="bg-indigo-500">
                        <Select defaultValue='normal'>
                          <SelectTrigger className='w-auto border-none bg-accent focus:ring-0'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">{t('dashboard.settingsAppearance.fontSizeSmall')}</SelectItem>
                            <SelectItem value="normal">{t('dashboard.settingsAppearance.fontSizeNormal')}</SelectItem>
                            <SelectItem value="large">{t('dashboard.settingsAppearance.fontSizeLarge')}</SelectItem>
                          </SelectContent>
                        </Select>
                    </SettingsItem>
                     <SettingsItem label={t('dashboard.settingsAppearance.colorBlindLabel')} icon={Eye} iconColor="bg-indigo-500">
                        <Select defaultValue='yok'>
                          <SelectTrigger className='w-auto border-none bg-accent focus:ring-0'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yok">{t('dashboard.settingsAppearance.colorBlindNone')}</SelectItem>
                            <SelectItem value="protanopia">Protanopia</SelectItem>
                            <SelectItem value="deuteranopia">Deuteranopia</SelectItem>
                            <SelectItem value="tritanopia">Tritanopia</SelectItem>
                          </SelectContent>
                        </Select>
                    </SettingsItem>
                    <SettingsItem
                        label={t('dashboard.settingsAppearance.dyslexiaLabel')}
                        description={t('dashboard.settingsAppearance.dyslexiaDesc')}
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
                <CardTitle>{t('dashboard.settingsAppearance.interactionCardTitle')}</CardTitle>
            </CardHeader>
             <CardContent className="p-0">
                <div className="flex flex-col">
                    <SettingsItem
                        label={t('dashboard.settingsAppearance.reduceMotionLabel')}
                        description={t('dashboard.settingsAppearance.reduceMotionDesc')}
                        icon={MinusCircle}
                        iconColor="bg-teal-500"
                    >
                         <Switch id="a11y-animations" />
                    </SettingsItem>
                     <SettingsItem
                        label={t('dashboard.settingsAppearance.screenReaderLabel')}
                        description={t('dashboard.settingsAppearance.screenReaderDesc')}
                        icon={Ear}
                        iconColor="bg-teal-500"
                    >
                         <Switch id="a11y-screenreader" defaultChecked />
                    </SettingsItem>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button onClick={handleSave}>{t('dashboard.settingsAppearance.saveBtn')}</Button>
        </div>
    </div>
  );
}
