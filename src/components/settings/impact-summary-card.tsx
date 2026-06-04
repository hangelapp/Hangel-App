'use client';

/**
 * Settings → Sosyal Etki özet kartı.
 *
 * Mali değer kaynağı: paylaşılan `lib/volunteer/impact-value`
 * (`calculateImpactValue`). `users/{uid}.stats.totalImpactValue` cache'i ile
 * live hesap karşılaştırılır; live > 0 ise live, değilse cache gösterilir.
 *
 * Aynı utility profile Etki tab ve leaderboard tarafından da kullanılır —
 * "Sosyal Etki Mali Değeri" tek bir doğru kaynaktan beslenir.
 */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Hourglass, Handshake } from 'lucide-react';
import { useFirestore, useMemoFirebase, useCollection, useDoc, useUser } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import {
    calculateImpactValue,
    normalizeCompletedTask,
    type ProfessionScoringRow,
} from '@/lib/volunteer/impact-value';

export function ImpactSummaryCard() {
    const { t } = useTranslation();
    const db = useFirestore();
    const { user: authUser } = useUser();

    const userRef = useMemoFirebase(
        () => (db && authUser ? doc(db, COLLECTIONS.users, authUser.uid) : null),
        [db, authUser?.uid],
    );
    const { data: userData } = useDoc<{
        stats?: { totalImpactValue?: number; volunteerHours?: number };
        volunteerInfo?: { profession?: string | null };
        completedVolunteerTasks?: Array<Record<string, unknown>>;
    }>(userRef);

    const pastVolRef = useMemoFirebase(
        () =>
            db && authUser
                ? collection(db, COLLECTIONS.users, authUser.uid, COLLECTIONS.pastVolunteering)
                : null,
        [db, authUser?.uid],
    );
    const { data: pastVolData } = useCollection<Record<string, unknown>>(pastVolRef);

    const catalogRef = useMemoFirebase(
        () => (db ? collection(db, COLLECTIONS.volunteerScoring) : null),
        [db],
    );
    const { data: catalogData } = useCollection<ProfessionScoringRow>(catalogRef);

    // Lazy state — sadece veri tamam olduğunda hesaplama
    const [resolved, setResolved] = useState<{ totalTRY: number; hours: number } | null>(null);
    useEffect(() => {
        const cat: ProfessionScoringRow[] = (catalogData ?? []).map((row) => ({
            id: row.id,
            taskType: String(row.taskType ?? ''),
            manHourCost: Number(row.manHourCost) || 0,
            pointsPerHour: Number(row.pointsPerHour) || 0,
            isActive: row.isActive !== false,
        }));
        const fallbackProfession = userData?.volunteerInfo?.profession ?? null;
        const tasks = [
            ...(Array.isArray(userData?.completedVolunteerTasks)
                ? userData!.completedVolunteerTasks!
                : []
            ).map((raw, i) => {
                const n = normalizeCompletedTask(raw as Record<string, unknown>, `inline-${i}`);
                if (!n.professionId && fallbackProfession) n.professionId = fallbackProfession;
                return n;
            }),
            ...(pastVolData ?? []).map((raw, i) => {
                const n = normalizeCompletedTask(
                    raw,
                    String((raw as { id?: string }).id ?? `pv-${i}`),
                );
                if (!n.professionId && fallbackProfession) n.professionId = fallbackProfession;
                return n;
            }),
        ];
        const { totalTRY, breakdown } = calculateImpactValue(tasks, cat);
        const hours = breakdown.reduce((s, r) => s + r.hours, 0);
        setResolved({ totalTRY, hours });
    }, [catalogData, pastVolData, userData]);

    const cachedValue = Number(userData?.stats?.totalImpactValue) || 0;
    const cachedHours = Number(userData?.stats?.volunteerHours) || 0;
    const value = useMemo(() => {
        if (resolved && resolved.totalTRY > 0) return resolved.totalTRY;
        return cachedValue;
    }, [resolved, cachedValue]);
    const hours = useMemo(() => {
        if (resolved && resolved.hours > 0) return resolved.hours;
        return cachedHours;
    }, [resolved, cachedHours]);

    if (!authUser) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {t('settings_impact.title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border p-4">
                    <Sparkles className="h-4 w-4 text-primary mb-1" />
                    <p className="text-2xl font-bold leading-none">
                        {value.toLocaleString('tr-TR')} ₺
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5">
                        {t('settings_impact.financialValue')}
                    </p>
                </div>
                <div className="rounded-2xl border p-4">
                    <Hourglass className="h-4 w-4 text-primary mb-1" />
                    <p className="text-2xl font-bold leading-none">
                        {hours.toLocaleString('tr-TR')}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5">
                        {t('settings_impact.hours')}
                    </p>
                </div>
                <Link
                    href="/profile"
                    className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-accent"
                >
                    <Handshake className="h-3.5 w-3.5" />
                    {t('settings_impact.viewDetails')}
                </Link>
            </CardContent>
        </Card>
    );
}
