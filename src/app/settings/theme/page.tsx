'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowLeft, Monitor, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ThemeSettingsPage() {
    const router = useRouter();
    const [theme, setTheme] = useState('system');
    const { toast } = useToast();

    const handleSave = () => {
        toast({
            title: "Tema Ayarları Kaydedildi",
            description: `Tema "${theme}" olarak ayarlandı.`,
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
                        className={cn("p-4 border-2 rounded-lg cursor-pointer text-center space-y-2", theme === 'light' ? 'border-primary' : 'hover:border-primary/50')}
                        onClick={() => setTheme('light')}
                    >
                        <Sun className="mx-auto h-6 w-6" />
                        <p className="text-sm font-medium">Açık</p>
                    </div>
                     <div 
                        className={cn("p-4 border-2 rounded-lg cursor-pointer text-center space-y-2", theme === 'dark' ? 'border-primary' : 'hover:border-primary/50')}
                        onClick={() => setTheme('dark')}
                    >
                        <Moon className="mx-auto h-6 w-6" />
                        <p className="text-sm font-medium">Koyu</p>
                    </div>
                     <div 
                        className={cn("p-4 border-2 rounded-lg cursor-pointer text-center space-y-2", theme === 'system' ? 'border-primary' : 'hover:border-primary/50')}
                        onClick={() => setTheme('system')}
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
