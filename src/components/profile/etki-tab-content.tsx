'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Award, BarChart3, CheckCircle, ChevronRight, DollarSign, FileText,
    HandCoins, Handshake, Hourglass, Sparkles, Target, TrendingUp,
} from 'lucide-react';

type UserStats = {
    totalDonation: number;
    donationCount: number;
    highestSingleDonation: number;
    mostSupportedNgo: string;
    avgDonation: number;
    volunteerHours: number;
    completedProjects: number;
    mostActiveVolunteerArea: string;
    totalImpactValue: number;
    volunteerRank: { country?: string | number; city?: string | number };
};

type EtkiUser = {
    impactScore: number;
    stats: UserStats;
};

export type EtkiTabContentProps = {
    user: EtkiUser;
    earnedBadgeCount: number;
    certificateCount: number;
    impactCardTitle: string;
};

const InfoRow = ({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value?: string | number | null; href?: string }) => {
    const ValueComponent = href ? (
        <Link href={href} className="flex items-center gap-1 text-muted-foreground hover:underline">
            <span>{value ?? '-'}</span>
            <ChevronRight className="h-4 w-4" />
        </Link>
    ) : (
        <p className="text-muted-foreground">{value ?? '-'}</p>
    );

    return (
        <div className="flex justify-between items-start py-3 text-sm">
            <div className="flex items-start">
                <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <p className="font-medium ml-4">{label}</p>
            </div>
            <div className="flex items-center gap-2 text-right">
                {ValueComponent}
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) => (
    <div className="text-center p-2">
        <Icon className="h-7 w-7 text-primary mx-auto mb-2" />
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
);

export function EtkiTabContent({ user, earnedBadgeCount, certificateCount, impactCardTitle }: EtkiTabContentProps) {
    const stats = user.stats;
    return (
        <div className="space-y-4">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>{impactCardTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-6xl font-bold text-primary">{user.impactScore.toLocaleString('tr-TR')}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                        <CheckCircle className="h-3 w-3 inline mr-1" /> {earnedBadgeCount} rozet · {certificateCount} sertifika
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Özet İstatistikler</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard icon={HandCoins} value={`${(stats.totalDonation ?? 0).toLocaleString('tr-TR')} ₺`} label="Toplam Bağış" />
                    <StatCard icon={Sparkles} value={`${(stats.totalImpactValue ?? 0).toLocaleString('tr-TR')} ₺`} label="Sosyal Etki Mali Değeri" />
                    <StatCard icon={Handshake} value={`${stats.volunteerHours ?? 0} Saat`} label="Gönüllülük" />
                    <StatCard icon={Award} value={earnedBadgeCount} label="Kazanılan Rozet" />
                    <StatCard icon={FileText} value={certificateCount} label="Sertifika" />
                    <StatCard icon={BarChart3} value={stats.volunteerRank?.country ?? '-'} label="Türkiye Sıralaması" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Gönüllülük İstatistikleri</CardTitle></CardHeader>
                <CardContent className="divide-y">
                    <InfoRow icon={Hourglass} label="Toplam Gönüllülük Saati" value={`${stats.volunteerHours ?? 0} Saat`} />
                    <InfoRow icon={Handshake} label="Tamamlanan Proje Sayısı" value={`${stats.completedProjects ?? 0} Proje`} />
                    <InfoRow icon={Sparkles} label="En Aktif Gönüllülük Alanı" value={stats.mostActiveVolunteerArea} />
                    <InfoRow icon={TrendingUp} label="Türkiye Gönüllü Sıralaması" value={stats.volunteerRank?.country} href="/leaderboard" />
                    <InfoRow icon={TrendingUp} label="Şehir Gönüllü Sıralaması" value={stats.volunteerRank?.city} href="/leaderboard" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><HandCoins className="h-5 w-5 text-primary" />Bağış İstatistikleri</CardTitle></CardHeader>
                <CardContent className="divide-y">
                    <InfoRow icon={DollarSign} label="Toplam Bağış Tutarı" value={`${(stats.totalDonation ?? 0).toLocaleString('tr-TR')} ₺`} />
                    <InfoRow icon={FileText} label="Toplam İşlem Adedi" value={`${stats.donationCount ?? 0} İşlem`} />
                    <InfoRow icon={Target} label="En Çok Desteklenen STK" value={stats.mostSupportedNgo} />
                    <InfoRow icon={TrendingUp} label="Tek Seferde En Yüksek Bağış" value={`${(stats.highestSingleDonation ?? 0).toLocaleString('tr-TR')} ₺`} />
                    <InfoRow icon={BarChart3} label="Ortalama Bağış Tutarı" value={`${(stats.avgDonation ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`} />
                </CardContent>
            </Card>
        </div>
    );
}
