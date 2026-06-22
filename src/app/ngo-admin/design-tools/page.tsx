
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Palette, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/language-provider';

export default function DesignToolsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();

    const providers = [
        { id: 'canva', name: 'Canva', logo: 'C', color: 'bg-[#00C4CC]', status: t('ngoAdminDesignTools.statusConnected'), price: t('ngoAdminDesignTools.canvaPrice'), discount: t('ngoAdminDesignTools.discount100') },
        { id: 'adobe', name: 'Adobe Creative Cloud', logo: 'A', color: 'bg-[#FF0000]', status: t('ngoAdminDesignTools.statusAvailable'), price: t('ngoAdminDesignTools.adobePrice'), discount: t('ngoAdminDesignTools.discount60') },
        { id: 'figma', name: 'Figma', logo: 'F', color: 'bg-[#F24E1E]', status: t('ngoAdminDesignTools.statusAvailable'), price: t('ngoAdminDesignTools.figmaPrice'), discount: t('ngoAdminDesignTools.discount100') },
    ];

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngoAdminDesignTools.backAria')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">{t('ngoAdminDesignTools.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('ngoAdminDesignTools.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((item) => (
                    <Card key={item.id} className="hover:border-primary transition-all cursor-pointer group">
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", item.color)}>
                                {item.logo}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{item.name}</p>
                                <Badge variant={item.status === t('ngoAdminDesignTools.statusConnected') ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                    {item.status}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-primary">{item.price}</p>
                                <p className="text-[10px] text-green-600 font-medium">{item.discount}</p>
                            </div>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: t('ngoAdminDesignTools.toastRedirectTitle'), description: t('ngoAdminDesignTools.toastRedirectDesc')})}>{t('ngoAdminDesignTools.benefitBtn')}</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> {t('ngoAdminDesignTools.studioTitle')}</CardTitle>
                    <CardDescription>{t('ngoAdminDesignTools.studioDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="py-8 flex flex-col items-center justify-center space-y-4">
                    <Palette className="h-16 w-16 text-primary/40" />
                    <p className="text-sm text-muted-foreground text-center max-w-sm">{t('ngoAdminDesignTools.studioBody')}</p>
                    <Button size="lg" disabled>{t('ngoAdminDesignTools.studioCta')}</Button>
                    <p className="text-[11px] text-muted-foreground">Bu özellik geliştiriliyor, yakında.</p>
                </CardContent>
            </Card>
        </div>
    );
}
