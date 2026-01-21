'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const languages = [
    { code: 'tr', name: 'Türkçe', country: 'Türkiye' },
    { code: 'en', name: 'English', country: 'United States' },
];

export default function LanguageSettingsPage() {
    const router = useRouter();
    const [selectedLanguage, setSelectedLanguage] = useState('tr');

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold font-headline">Dil Ayarları</h1>
            <p className="text-muted-foreground text-sm">Uygulama dilini değiştirin.</p>
        </div>

        <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {languages.map((lang) => (
                    <div 
                        key={lang.code} 
                        className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer"
                        onClick={() => setSelectedLanguage(lang.code)}
                    >
                        <div>
                            <p className="font-medium">{lang.name}</p>
                            <p className="text-sm text-muted-foreground">{lang.country}</p>
                        </div>
                        {selectedLanguage === lang.code && <Check className="h-5 w-5 text-primary" />}
                    </div>
                ))}
              </div>
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button>Değişiklikleri Kaydet</Button>
        </div>
    </div>
  );
}
