'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowLeft, Monitor, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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
        toast({
            title: "Tema Ayarları Kaydedildi",
            description: `Tema "${theme === 'light' ? 'Açık' : theme === 'dark' ? 'Koyu' : 'Sistem'}" olarak ayarlandı.`,
        });
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Tema Ayarları</h1>
                <p className="text-muted-foreground text-sm">Uygulamanın genel görünümünü kişiselleştirin.</p>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div
                            className={cn("p-4 border-2 rounded-lg cursor-pointer text-center space-y-2", theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}
                            onClick={() => handleSelect('light')}
                        >
                            <Sun className="mx-auto h-6 w-6" />
                            <p className="text-sm font-medium">Açık</p>
                        </div>
                        <div
                            className={cn("p-4 border-2 rounded-lg cursor-pointer text-center space-y-2", theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}
                            onClick={() => handleSelect('dark')}
                        >
                            <Moon className="mx-auto h-6 w-6" />
                            <p className="text-sm font-medium">Koyu</p>
                        </div>
                        <div
                            className={cn("p-4 border-2 rounded-lg cursor-pointer text-center space-y-2", theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}
                            onClick={() => handleSelect('system')}
                        >
                            <Monitor className="mx-auto h-6 w-6" />
                            <p className="text-sm font-medium">Sistem</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>Değişiklikleri Kaydet</Button>
            </div>
        </div>
    );
}
