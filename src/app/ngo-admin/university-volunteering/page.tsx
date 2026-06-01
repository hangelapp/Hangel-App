'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, School, Info, Users, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/components/providers/language-provider';

export default function UniversityVolunteeringPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const [isApproving, setIsApproving] = useState(false);

    const universities = [
        { id: 'boun', name: t('ngo_admin_university.uniBoun'), status: t('ngo_admin_university.statusConnected'), students: 120, course: t('ngo_admin_university.courseBoun'), discount: t('ngo_admin_university.discountFull') },
        { id: 'itu', name: t('ngo_admin_university.uniItu'), status: t('ngo_admin_university.statusConnected'), students: 85, course: t('ngo_admin_university.courseItu'), discount: t('ngo_admin_university.discountFull') },
        { id: 'odtu', name: t('ngo_admin_university.uniOdtu'), status: t('ngo_admin_university.statusInTalks'), students: 0, course: t('ngo_admin_university.courseNone'), discount: t('ngo_admin_university.discountPending') },
    ];

    const handleBulkApprove = () => {
        setIsApproving(true);
        setTimeout(() => {
            toast({ title: t('ngo_admin_university.toastBulkApprovedTitle'), description: t('ngo_admin_university.toastBulkApprovedDesc') });
            setIsApproving(false);
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngo_admin_university.backAria')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">{t('ngo_admin_university.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('ngo_admin_university.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {universities.map((uni) => (
                    <Card key={uni.id} className="hover:border-primary transition-all group overflow-hidden">
                        <div className="bg-muted/30 p-4 border-b">
                            <div className="flex justify-between items-start">
                                <School className="h-8 w-8 text-primary/60" />
                                <Badge variant={uni.status === t('ngo_admin_university.statusConnected') ? 'default' : 'secondary'} className="text-[9px] uppercase">{uni.status}</Badge>
                            </div>
                            <CardTitle className="text-sm font-bold mt-2">{uni.name}</CardTitle>
                        </div>
                        <CardContent className="p-4 space-y-3">
                            <div className="text-xs space-y-1">
                                <p className="text-muted-foreground">{t('ngo_admin_university.relatedCourse')}</p>
                                <p className="font-bold text-foreground">{uni.course}</p>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground pt-2 border-t">
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {uni.students} {t('ngo_admin_university.studentsSuffix')}</span>
                                <span className="text-green-600 font-bold">{uni.discount}</span>
                            </div>
                            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => toast({title: t('ngo_admin_university.toastUniPanelTitle'), description: `${uni.name} ${t('ngo_admin_university.toastUniPanelDescSuffix')}`})}>{t('ngo_admin_university.btnManageQuota')}</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t('ngo_admin_university.certTitle')}</CardTitle>
                    <CardDescription>{t('ngo_admin_university.certDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-xl bg-orange-50 text-orange-800 text-xs flex items-center gap-3">
                        <Info className="h-5 w-5 shrink-0" />
                        <p>{t('ngo_admin_university.certInfo')}</p>
                    </div>
                    <Button className="w-full" onClick={handleBulkApprove} disabled={isApproving}>
                        {isApproving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('ngo_admin_university.btnApproving')}</> : t('ngo_admin_university.btnBulkApprove')}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
