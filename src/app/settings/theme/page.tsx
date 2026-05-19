'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowLeft, Monitor, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';

type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'hangel-theme';

function applyTheme(theme: Theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
        html.classList.add('dark');
    } else if (theme === 'light') {
        html.classList.remove('dark');
    } else {
        // system
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.classList.toggle('dark', prefersDark);
    }
}

export default function ThemeSettingsPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [theme, setTheme] = useState<Theme>('system');
    const { toast } = useToast();

    useEffect(() => {
        const saved = localStorage.getItem(THEME_KEY) as Theme | null;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
            setTheme(saved);
        }
    }, []);

    const handleSelect = (next: Theme) => {
        setTheme(next);
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
    };

    const handleSave = () => {
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
        const label = theme === 'light' ? t('dashboard.settingsTheme.light') : theme === 'dark' ? t('dashboard.settingsTheme.dark') : t('dashboard.settingsTheme.system');
        toast({
            title: t('dashboard.settingsTheme.toastSavedTitle'),
            description: `${t('dashboard.settingsTheme.toastSavedDescPrefix')}${label}${t('dashboard.settingsTheme.toastSavedDescSuffix')}`,
        });
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsTheme.heading')}</h1>
                <p className="text-muted-foreground text-sm">{t('dashboard.settingsTheme.subheading')}</p>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div
                            className={cn("p-4 border-2 rounded-lg cursor-pointer text-center space-y-2", theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}
                            onClick={() => handleSelect('light')}
                        >
                            <Sun className="mx-auto h-6 w-6" />
                            <p className="text-sm font-medium">{t('dashboard.settingsTheme.light')}</p>
                        </div>
                        <div
                            className={cn("p-4 border-2 rounded-lg cursor-pointer text-center space-y-2", theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}
                            onClick={() => handleSelect('dark')}
                        >
                            <Moon className="mx-auto h-6 w-6" />
                            <p className="text-sm font-medium">{t('dashboard.settingsTheme.dark')}</p>
                        </div>
                        <div
                            className={cn("p-4 border-2 rounded-lg cursor-pointer text-center space-y-2", theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}
                            onClick={() => handleSelect('system')}
                        >
                            <Monitor className="mx-auto h-6 w-6" />
                            <p className="text-sm font-medium">{t('dashboard.settingsTheme.system')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>{t('dashboard.settingsTheme.saveBtn')}</Button>
            </div>
        </div>
    );
}
