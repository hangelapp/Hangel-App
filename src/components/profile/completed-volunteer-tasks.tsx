'use client';

/**
 * Tamamlanan Gönüllülükler — Profil Etki sekmesinde, her tamamlanmış kaydı
 * (STK + tarih + saat + meslek + mali değer) listeler. Üstte özet kart:
 * toplam saat + toplam mali etki (₺).
 *
 * Mali değer hesaplaması paylaşılan `@/lib/volunteer/impact-value`
 * (`calculateImpactValue` sync) — aynı utility leaderboard / demographics /
 * settings yerlerinde de kullanılır.
 *
 * Veri kaynağı: profile-bundle endpoint'inden inen `pastVolunteering` array
 * (parent zaten okuyor; ek Firestore çağrısı yok). volunteerScoring
 * kataloğunu burada client-side okuruz çünkü süper-admin değiştirebilir ve
 * UI taze değer göstermeli.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { Briefcase, Handshake, Hourglass, Sparkles } from 'lucide-react';
import { collection } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { format, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import {
    calculateImpactValue,
    normalizeCompletedTask,
    type CompletedVolunteerTask,
    type ProfessionScoringRow,
} from '@/lib/volunteer/impact-value';

interface NgoLite {
    id: string;
    name?: string;
    avatarUrl?: string;
    logoUrl?: string;
    files?: { logo?: string };
}

interface Props {
    /** Profile-bundle.pastVolunteering — raw doc array. */
    pastVolunteering: Array<Record<string, unknown>>;
    /** users/{uid}.completedVolunteerTasks (yeni şema, varsa). */
    inlineCompletedTasks?: Array<Record<string, unknown>>;
    /** Kullanıcının default mesleği (kayıtta profession yoksa fallback). */
    fallbackProfession?: string | null;
    /** NGO logo lookup için. */
    volunteerNgos?: NgoLite[];
    supportedNgos?: NgoLite[];
}

function pickNgoLogo(ngo?: NgoLite): string | undefined {
    if (!ngo) return undefined;
    return ngo.avatarUrl || ngo.logoUrl || ngo.files?.logo;
}

function fmtTRY(n: number): string {
    return `${Math.round(n).toLocaleString('tr-TR')} ₺`;
}

function fmtDate(value: string | null, lang: 'tr' | 'en'): string {
    if (!value) return '';
    try {
        const d = value.includes('T') ? parseISO(value) : new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        return format(d, 'dd MMM yyyy', { locale: lang === 'tr' ? tr : enUS });
    } catch {
        return value;
    }
}

export function CompletedVolunteerTasks({
    pastVolunteering,
    inlineCompletedTasks = [],
    fallbackProfession,
    volunteerNgos = [],
    supportedNgos = [],
}: Props) {
    const { t, language } = useTranslation();
    const db = useFirestore();

    // Süper-admin yönettiği iş kalemi kataloğu (manHourCost kaynağı).
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

    const ngoLogoById = useMemo<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        for (const n of [...volunteerNgos, ...supportedNgos]) {
            const url = pickNgoLogo(n);
            if (url) map[n.id] = url;
        }
        return map;
    }, [volunteerNgos, supportedNgos]);

    const tasks = useMemo<CompletedVolunteerTask[]>(() => {
        const out: CompletedVolunteerTask[] = [];
        inlineCompletedTasks.forEach((raw, idx) => {
            if (raw && typeof raw === 'object') {
                const norm = normalizeCompletedTask(raw, `inline-${idx}`);
                // Profession yoksa user profile fallback
                if (!norm.professionId && fallbackProfession) {
                    norm.professionId = fallbackProfession;
                }
                out.push(norm);
            }
        });
        pastVolunteering.forEach((raw) => {
            const norm = normalizeCompletedTask(
                raw,
                String((raw as { id?: string }).id ?? `pv-${out.length}`),
            );
            if (!norm.professionId && fallbackProfession) {
                norm.professionId = fallbackProfession;
            }
            out.push(norm);
        });
        return out;
    }, [pastVolunteering, inlineCompletedTasks, fallbackProfession]);

    const { totalTRY, breakdown } = useMemo(
        () => calculateImpactValue(tasks, catalog),
        [tasks, catalog],
    );

    const totalHours = useMemo(
        () => breakdown.reduce((s, r) => s + r.hours, 0),
        [breakdown],
    );

    // breakdown -> task lookup (organization, ngoId, completedAt için)
    const taskById = useMemo<Record<string, CompletedVolunteerTask>>(() => {
        const map: Record<string, CompletedVolunteerTask> = {};
        for (const t of tasks) map[t.taskId] = t;
        return map;
    }, [tasks]);

    return (
        <Card variant="glass">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Handshake className="h-5 w-5 text-primary" />
                    {t('profile_completed_volunteer.sectionTitle')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    {t('profile_completed_volunteer.summary')
                        .replace('{hours}', String(totalHours))
                        .replace('{value}', fmtTRY(totalTRY))}
                </p>
            </CardHeader>
            <CardContent>
                {breakdown.length === 0 ? (
                    <EmptyState
                        icon={Handshake}
                        title={t('profile_completed_volunteer.emptyTitle')}
                        description={t('profile_completed_volunteer.emptyDesc')}
                    />
                ) : (
                    <ul className="divide-y">
                        {breakdown.map((row) => {
                            const task = taskById[row.taskId];
                            const logo =
                                task?.ngoId ? ngoLogoById[task.ngoId] : undefined;
                            const orgName = task?.organization ?? '';
                            const title = task?.title ?? '';
                            const dateText = fmtDate(
                                task?.completedAt ?? null,
                                language === 'tr' ? 'tr' : 'en',
                            );
                            return (
                                <li
                                    key={row.taskId}
                                    className="flex items-start justify-between gap-3 py-3"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarImage src={logo} alt={orgName} />
                                            <AvatarFallback className="text-xs font-bold">
                                                {(orgName || '?').charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="font-medium leading-tight truncate">
                                                {orgName || t('profile_completed_volunteer.unknownOrg')}
                                            </p>
                                            {title && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {title}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                                                {dateText && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Sparkles className="h-3 w-3" />
                                                        {dateText}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1">
                                                    <Hourglass className="h-3 w-3" />
                                                    {row.hours} {t('profile_completed_volunteer.hourUnit')}
                                                </span>
                                                {row.professionLabel && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Briefcase className="h-3 w-3" />
                                                        {row.professionLabel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold tabular-nums">
                                            {fmtTRY(row.value)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {row.hours} × {Math.round(row.rate).toLocaleString('tr-TR')} ₺
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
