
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { languages, useTranslation } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export default function LanguageSettingsPage() {
    const router = useRouter();
    const { language, changeLanguage, t } = useTranslation();
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const db = useFirestore();

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, COLLECTIONS.users, authUser.uid);
    }, [db, authUser]);

    const handleSave = async () => {
        if (!userDocRef) {
            // Anon: sadece localStorage'a yazılır (LanguageProvider sayesinde)
            const langName = languages.find(l => l.value === language)?.label;
            toast({
                title: t('dashboard.settingsLanguage.toastSavedTitle'),
                description: `${t('dashboard.settingsLanguage.toastSavedDescPrefix')}${langName}${t('dashboard.settingsLanguage.toastSavedDescSuffix')}`,
            });
            return;
        }
        const result = await updateDocumentNonBlocking(userDocRef, { language });
        if (result.ok) {
            const langName = languages.find(l => l.value === language)?.label;
            toast({
                title: t('dashboard.settingsLanguage.toastSavedTitle'),
                description: `${t('dashboard.settingsLanguage.toastSavedDescPrefix')}${langName}${t('dashboard.settingsLanguage.toastSavedDescSuffix')}`,
            });
        } else {
            toast({ variant: 'destructive', title: 'Kayıt başarısız', description: result.error.message.slice(0, 200) });
        }
    };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsLanguage.heading')}</h1>
            <p className="text-muted-foreground text-sm">{t('dashboard.settingsLanguage.subheading')}</p>
        </div>

        <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {languages.map((lang) => (
                    <div 
                        key={lang.value} 
                        className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer"
                        onClick={() => changeLanguage(lang.value)}
                    >
                        <div>
                            <p className="font-medium">{lang.label}</p>
                            <p className="text-xs text-muted-foreground uppercase">{lang.value}</p>
                        </div>
                        {language === lang.value && <Check className="h-5 w-5 text-primary" />}
                    </div>
                ))}
              </div>
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button onClick={handleSave}>{t('dashboard.settingsLanguage.saveBtn')}</Button>
        </div>
    </div>
  );
}
