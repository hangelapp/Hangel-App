'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Award, BarChart3, CheckCircle, ChevronRight, DollarSign, FileText,
    HandCoins, Handshake, Hourglass, Sparkles, Target, TrendingUp,
} from 'lucide-react';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import {
    calculateImpactValue,
    normalizeCompletedTask,
    type ProfessionScoringRow,
} from '@/lib/volunteer/impact-value';
import { CompletedVolunteerTasks } from '@/components/profile/completed-volunteer-tasks';

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

type NgoLite = {
    id: string;
    name?: string;
    avatarUrl?: string;
    logoUrl?: string;
    files?: { logo?: string };
};

export type EtkiTabContentProps = {
    user: EtkiUser;
    earnedBadgeCount: number;
    certificateCount: number;
    impactCardTitle: string;
    /** Bundle'dan veya parent'tan gelen kayıtlar — kanonik mali değer için. */
    pastVolunteering?: Array<Record<string, unknown>>;
    /** users/{uid}.completedVolunteerTasks (yeni şema). */
    inlineCompletedTasks?: Array<Record<string, unknown>>;
    /** Kayıtlarda profession yoksa fallback. */
    fallbackProfession?: string | null;
    volunteerNgos?: NgoLite[];
    supportedNgos?: NgoLite[];
};

const InfoRow = ({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value?: string | number | null; href?: string }) => {
    const ValueComponent = href ? (
        <Link href={href} className="flex items-center gap-1 text-muted-foreground hover:underline min-w-0">
            <span className="truncate">{value ?? '-'}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
        </Link>
    ) : (
        <p className="text-muted-foreground break-words min-w-0">{value ?? '-'}</p>
    );

    return (
        <div className="flex justify-between items-start gap-3 py-2 text-sm">
            <div className="flex items-start shrink-0 max-w-[45%]">
                <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="font-medium ml-4">{label}</p>
            </div>
            <div className="flex items-center gap-2 text-right min-w-0 break-words">
                {ValueComponent}
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) => (
    <div className="text-center p-3">
        <Icon className="h-7 w-7 text-primary mx-auto mb-2" />
        <p className="text-xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
);

export function EtkiTabContent({
    user,
    earnedBadgeCount,
    certificateCount,
    impactCardTitle,
    pastVolunteering = [],
    inlineCompletedTasks = [],
    fallbackProfession,
    volunteerNgos = [],
    supportedNgos = [],
}: EtkiTabContentProps) {
    const stats = user.stats;
    const db = useFirestore();

    // Kanonik mali değer: süper-admin volunteerScoring kataloğu × tamamlanmış
    // saatler. stats.totalImpactValue cache'lenmiş; canlı hesap > cache.
    const catalogRef = useMemoFirebase(
        () => (db ? collection(db, COLLECTIONS.volunteerScoring) : null),
        [db],
    );
    const { data: catalogData } = useCollection<ProfessionScoringRow>(catalogRef);
    const catalog = useMemo<ProfessionScoringRow[]>(
        () =>
            (catalogData ?? []).map((row) => ({
                id: row.id,
                taskType: String(row.taskType ?? ''),
                manHourCost: Number(row.manHourCost) || 0,
                pointsPerHour: Number(row.pointsPerHour) || 0,
                isActive: row.isActive !== false,
            })),
        [catalogData],
    );

    const liveImpactValue = useMemo(() => {
        const tasks = [
            ...inlineCompletedTasks
                .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
                .map((r, i) => {
                    const n = normalizeCompletedTask(r, `inline-${i}`);
                    if (!n.professionId && fallbackProfession) n.professionId = fallbackProfession;
                    return n;
                }),
            ...pastVolunteering
                .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
                .map((r, i) => {
                    const n = normalizeCompletedTask(
                        r,
                        String((r as { id?: string }).id ?? `pv-${i}`),
                    );
                    if (!n.professionId && fallbackProfession) n.professionId = fallbackProfession;
                    return n;
                }),
        ];
        return calculateImpactValue(tasks, catalog).totalTRY;
    }, [inlineCompletedTasks, pastVolunteering, catalog, fallbackProfession]);

    // Live > cache; ikisi de 0 ise 0 göster.
    const displayImpactValue =
        liveImpactValue > 0 ? liveImpactValue : Number(stats.totalImpactValue ?? 0) || 0;

    return (
        <div className="space-y-3">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>{impactCardTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-5xl font-bold tabular-nums text-primary sm:text-6xl">{user.impactScore.toLocaleString('tr-TR')}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                        <CheckCircle className="h-3 w-3 inline mr-1" /> {earnedBadgeCount} rozet · {certificateCount} sertifika
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Özet İstatistikler</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                    <StatCard icon={HandCoins} value={`${(stats.totalDonation ?? 0).toLocaleString('tr-TR')} ₺`} label="Toplam Bağış" />
                    <StatCard icon={Sparkles} value={`${displayImpactValue.toLocaleString('tr-TR')} ₺`} label="Sosyal Etki Mali Değeri" />
                    <StatCard icon={Handshake} value={`${stats.volunteerHours ?? 0} Saat`} label="Gönüllülük" />
                    <StatCard icon={Award} value={earnedBadgeCount} label="Kazanılan Rozet" />
                    <StatCard icon={FileText} value={certificateCount} label="Sertifika" />
                    <StatCard icon={BarChart3} value={stats.volunteerRank?.country ?? '-'} label="Türkiye Sıralaması" />
                </CardContent>
            </Card>

            <CompletedVolunteerTasks
                pastVolunteering={pastVolunteering}
                inlineCompletedTasks={inlineCompletedTasks}
                fallbackProfession={fallbackProfession}
                volunteerNgos={volunteerNgos}
                supportedNgos={supportedNgos}
            />

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
