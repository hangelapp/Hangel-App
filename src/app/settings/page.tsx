
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    Bell, ChevronRight, FileText, Globe, LogOut, Palette, Shield, Trash2, User,
    HeartHandshake, PersonStanding, HandCoins, Store, Megaphone
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { useTranslation } from '@/components/providers/language-provider';

const SettingsLink = ({ href, icon, label, iconColor }: { href: string, icon: React.ElementType, label: string, iconColor: string }) => {
  const Icon = icon;
  return (
    <Link href={href} className="flex items-center p-4 hover:bg-accent transition-colors w-full text-sm sm:text-base">
      <div className={cn("p-1.5 rounded-lg mr-4", iconColor)}>
          <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  )
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { t } = useTranslation();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleDeleteAccount = () => {
    toast({
        variant: 'destructive',
        title: t('settings.deleteToastTitle'),
        description: t('settings.deleteToastDesc'),
    });
    setTimeout(async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error("Sign out error:", error);
        }
    }, 2000);
  };

  const handleSignOut = async () => {
    try {
        await signOut(auth);
        router.push('/login');
    } catch (error) {
        console.error("Sign out error:", error);
    }
  };
  
  return (
    <div className="p-4 space-y-8 animate-in fade-in-0">
      <h1 className="text-3xl font-bold font-headline">{t('settings.title')}</h1>

      <div className='space-y-6'>

        <Card>
            <CardHeader>
                <CardTitle>{t('settings.accountSection')}</CardTitle>
                <CardDescription>{t('settings.accountSectionDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <div className="flex flex-col divide-y">
                    <SettingsLink href="/settings/profile" icon={User} label={t('settings.editProfile')} iconColor="bg-blue-500" />
                    <SettingsLink href="/settings/volunteer" icon={HeartHandshake} label={t('settings.editVolunteer')} iconColor="bg-orange-500" />
                    <SettingsLink href="/settings/security" icon={Shield} label={t('settings.security')} iconColor="bg-sky-500" />
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>{t('settings.ngoSection')}</CardTitle>
                <CardDescription>{t('settings.ngoSectionDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                    <div className="flex flex-col divide-y">
                        <SettingsLink href="/settings/ngo-selection" icon={HandCoins} label={t('settings.changeDonorNgos')} iconColor="bg-amber-500" />
                        <SettingsLink href="/settings/volunteer-ngo-selection" icon={HeartHandshake} label={t('settings.changeVolunteerNgos')} iconColor="bg-rose-500" />
                    </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>{t('settings.brandsSection')}</CardTitle>
                <CardDescription>{t('settings.brandsSectionDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col divide-y">
                    <SettingsLink href="/settings/brands" icon={Store} label={t('settings.viewFollowedBrands')} iconColor="bg-violet-500" />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>{t('settings.appSection')}</CardTitle>
                <CardDescription>{t('settings.appSectionDesc')}</CardDescription>
            </CardHeader>
             <CardContent className="p-0">
                 <div className="flex flex-col divide-y">
                    <SettingsLink href="/settings/notifications" icon={Bell} label={t('settings.notificationSettings')} iconColor="bg-red-500" />
                    <SettingsLink href="/settings/marketing-consent" icon={Megaphone} label={t('settings.marketingConsent')} iconColor="bg-fuchsia-500" />
                    <SettingsLink href="/settings/theme" icon={Palette} label={t('settings.theme')} iconColor="bg-gray-500" />
                    <SettingsLink href="/settings/language" icon={Globe} label={t('settings.language')} iconColor="bg-blue-500" />
                    <SettingsLink href="/settings/accessibility" icon={PersonStanding} label={t('settings.accessibility')} iconColor="bg-indigo-500" />
                    <SettingsLink href="/settings/privacy" icon={Shield} label={t('settings.privacy')} iconColor="bg-teal-500" />
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>{t('settings.helpSection')}</CardTitle>
                 <CardDescription>{t('settings.helpSectionDesc')}</CardDescription>
            </CardHeader>
             <CardContent className="p-0">
                 <div className="flex flex-col divide-y">
                    <SettingsLink href="/settings/contracts" icon={FileText} label={t('settings.contracts')} iconColor="bg-slate-500" />
                 </div>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>{t('settings.accountOps')}</CardTitle>
                <CardDescription>{t('settings.accountOpsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button variant="secondary" className="w-full justify-start text-base p-6 rounded-2xl" onClick={() => setIsLogoutDialogOpen(true)}>
                    <LogOut className="mr-2 h-5 w-5" /> {t('settings.logout')}
                </Button>

                <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                    <AlertDialogContent className="rounded-3xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold">{t('settings.logoutConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription className="text-base">
                                {t('settings.logoutConfirmDesc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-2xl font-bold">{t('settings.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSignOut} className="rounded-2xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {t('settings.logout')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive text-sm p-3 rounded-xl">
                        <Trash2 className="mr-2 h-5 w-5" /> {t('settings.deleteAccount')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-bold text-destructive">{t('settings.deleteAccountTitle')}</AlertDialogTitle>
                      <AlertDialogDescription className="text-base">
                        {t('settings.deleteAccountDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="rounded-2xl font-bold">{t('settings.cancel')}</AlertDialogCancel>
                      <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }), "rounded-2xl font-bold")} onClick={handleDeleteAccount}>{t('settings.deleteAccountConfirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
