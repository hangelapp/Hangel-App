'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Leaf, Save, Upload, Trash2, FileText, ExternalLink, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAutosave } from '@/hooks/use-autosave';
import { AutosaveIndicator } from '@/components/shared/autosave-indicator';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity, useActiveEntityDoc } from '../active-entity-context';
import { useTranslation } from '@/components/providers/language-provider';

interface SustainabilityReport {
    id: string;
    year: string;
    title: string;
    description?: string;
    url?: string;
    publishedAt?: string;
}

interface KssArea {
    id: string;
    title: string;
    description: string;
    impactMetric?: string;
}

interface BrandWithSustainability {
    id: string;
    name?: string;
    sustainability?: {
        mission?: string;
        sdgGoals?: number[]; // BM Sürdürülebilir Kalkınma Hedefleri: 1-17
        reports?: SustainabilityReport[];
        kssAreas?: KssArea[];
        contactEmail?: string;
        certificates?: { name: string; issuer: string; year: string }[];
    };
}

export default function SustainabilityPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const firestore = useFirestore();
    // BM Sürdürülebilir Kalkınma Hedefleri (UN SDGs) — sadece sayı seç UX
    const SDG_LABELS: Record<number, string> = {
        1: t('ngo_admin_sustainability.sdg.sdg1'),
        2: t('ngo_admin_sustainability.sdg.sdg2'),
        3: t('ngo_admin_sustainability.sdg.sdg3'),
        4: t('ngo_admin_sustainability.sdg.sdg4'),
        5: t('ngo_admin_sustainability.sdg.sdg5'),
        6: t('ngo_admin_sustainability.sdg.sdg6'),
        7: t('ngo_admin_sustainability.sdg.sdg7'),
        8: t('ngo_admin_sustainability.sdg.sdg8'),
        9: t('ngo_admin_sustainability.sdg.sdg9'),
        10: t('ngo_admin_sustainability.sdg.sdg10'),
        11: t('ngo_admin_sustainability.sdg.sdg11'),
        12: t('ngo_admin_sustainability.sdg.sdg12'),
        13: t('ngo_admin_sustainability.sdg.sdg13'),
        14: t('ngo_admin_sustainability.sdg.sdg14'),
        15: t('ngo_admin_sustainability.sdg.sdg15'),
        16: t('ngo_admin_sustainability.sdg.sdg16'),
        17: t('ngo_admin_sustainability.sdg.sdg17'),
    };
    const { id: entityId, kind } = useActiveEntity();
    const { data: entity, isLoading } = useActiveEntityDoc<BrandWithSustainability>();

    const [mission, setMission] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [selectedSdgs, setSelectedSdgs] = useState<number[]>([]);
    const [reports, setReports] = useState<SustainabilityReport[]>([]);
    const [kssAreas, setKssAreas] = useState<KssArea[]>([]);
    const [certificates, setCertificates] = useState<{ name: string; issuer: string; year: string }[]>([]);
    const [saving, setSaving] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    // Formu kurum başına BİR kez doldur — canlı doc her snapshot'ta güncellenince
    // effect yeniden çalışıp kullanıcının girdiği değerleri ezmesin.
    const hydratedIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!entity) return;
        if (hydratedIdRef.current === entity.id) return;
        hydratedIdRef.current = entity.id;
        const s = entity.sustainability || {};
        setMission(s.mission || '');
        setContactEmail(s.contactEmail || '');
        setSelectedSdgs(s.sdgGoals || []);
        setReports(s.reports || []);
        setKssAreas(s.kssAreas || []);
        setCertificates(s.certificates || []);
        setHydrated(true);
    }, [entity]);

    const persistSustainability = async () => {
        if (!entityId || !firestore) return;
        const colName = kind === 'brand' ? COLLECTIONS.brands : kind === 'ngo' ? COLLECTIONS.ngos : COLLECTIONS.clubs;
        await updateDoc(doc(firestore, colName, entityId), {
            sustainability: {
                mission: mission.trim(),
                contactEmail: contactEmail.trim(),
                sdgGoals: selectedSdgs,
                reports: reports.filter(r => r.title.trim()),
                kssAreas: kssAreas.filter(k => k.title.trim()),
                certificates: certificates.filter(c => c.name.trim()),
                updatedAt: serverTimestamp(),
            },
        });
    };

    const { status: autosaveStatus, markDirty } = useAutosave(
        persistSustainability,
        [mission, contactEmail, selectedSdgs, reports, kssAreas, certificates],
        { delayMs: 1000 },
    );

    const toggleSdg = (n: number) => {
        markDirty();
        setSelectedSdgs(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort((a, b) => a - b));
    };

    const addReport = () => {
        markDirty();
        setReports(prev => [...prev, { id: `r_${Date.now()}`, year: String(new Date().getFullYear()), title: '', description: '', url: '' }]);
    };
    const updateReport = (id: string, patch: Partial<SustainabilityReport>) => {
        markDirty();
        setReports(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    };
    const removeReport = (id: string) => {
        markDirty();
        setReports(prev => prev.filter(r => r.id !== id));
    };

    const addKssArea = () => {
        markDirty();
        setKssAreas(prev => [...prev, { id: `k_${Date.now()}`, title: '', description: '', impactMetric: '' }]);
    };
    const updateKssArea = (id: string, patch: Partial<KssArea>) => {
        markDirty();
        setKssAreas(prev => prev.map(k => k.id === id ? { ...k, ...patch } : k));
    };
    const removeKssArea = (id: string) => {
        markDirty();
        setKssAreas(prev => prev.filter(k => k.id !== id));
    };

    const addCertificate = () => {
        markDirty();
        setCertificates(prev => [...prev, { name: '', issuer: '', year: String(new Date().getFullYear()) }]);
    };
    const updateCertificate = (idx: number, patch: Partial<{ name: string; issuer: string; year: string }>) => {
        markDirty();
        setCertificates(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
    };
    const removeCertificate = (idx: number) => {
        markDirty();
        setCertificates(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        if (!entityId || !firestore || saving) return;
        setSaving(true);
        try {
            await persistSustainability();
            toast({ title: t('ngo_admin_sustainability.saveSuccessTitle'), description: t('ngo_admin_sustainability.saveSuccessDescription') });
        } catch (e) {
            toast({ variant: 'destructive', title: t('ngo_admin_sustainability.saveErrorTitle'), description: e instanceof Error ? e.message.slice(0, 200) : t('ngo_admin_sustainability.saveErrorDefault') });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!entity) {
        return <div className="text-center py-20 text-muted-foreground">{t('ngo_admin_sustainability.brandNotFound')}</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100">
                        <Leaf className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">{t('ngo_admin_sustainability.heading')}</h1>
                        <p className="text-sm text-muted-foreground">{t('ngo_admin_sustainability.subheading')}</p>
                    </div>
                </div>
                <AutosaveIndicator status={autosaveStatus} />
            </div>

            {/* Misyon + İletişim */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t('ngo_admin_sustainability.visionTitle')}</CardTitle>
                    <CardDescription>{t('ngo_admin_sustainability.visionDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="mission" className="text-xs font-bold uppercase tracking-wider">{t('ngo_admin_sustainability.missionLabel')}</Label>
                        <Textarea
                            id="mission"
                            value={mission}
                            onChange={(e) => { markDirty(); setMission(e.target.value); }}
                            placeholder={t('ngo_admin_sustainability.missionPlaceholder')}
                            className="min-h-[100px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sustainability-email" className="text-xs font-bold uppercase tracking-wider">{t('ngo_admin_sustainability.contactEmailLabel')}</Label>
                        <Input
                            id="sustainability-email"
                            type="email"
                            value={contactEmail}
                            onChange={(e) => { markDirty(); setContactEmail(e.target.value); }}
                            placeholder={t('ngo_admin_sustainability.contactEmailPlaceholder')}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SKH (UN SDG) hedefleri */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t('ngo_admin_sustainability.sdgTitle')}</CardTitle>
                    <CardDescription>{t('ngo_admin_sustainability.sdgDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(SDG_LABELS).map(([n, label]) => {
                            const num = Number(n);
                            const selected = selectedSdgs.includes(num);
                            return (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => toggleSdg(num)}
                                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-colors ${
                                        selected ? 'border-emerald-500 bg-emerald-50' : 'hover:bg-accent'
                                    }`}
                                >
                                    <span className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                                        selected ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {num}
                                    </span>
                                    <span className="flex-1">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* KSS Alanları */}
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-base">{t('ngo_admin_sustainability.kssTitle')}</CardTitle>
                        <CardDescription>{t('ngo_admin_sustainability.kssDescription')}</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addKssArea}>
                        <Plus className="h-4 w-4 mr-1" /> {t('ngo_admin_sustainability.kssAddButton')}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {kssAreas.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-6">
                            {t('ngo_admin_sustainability.kssEmpty')}
                        </p>
                    )}
                    {kssAreas.map((k) => (
                        <div key={k.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-start gap-2">
                                <Input
                                    placeholder={t('ngo_admin_sustainability.kssTitlePlaceholder')}
                                    value={k.title}
                                    onChange={(e) => updateKssArea(k.id, { title: e.target.value })}
                                    className="flex-1 font-semibold"
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeKssArea(k.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                            <Textarea
                                placeholder={t('ngo_admin_sustainability.kssDescriptionPlaceholder')}
                                value={k.description}
                                onChange={(e) => updateKssArea(k.id, { description: e.target.value })}
                                className="min-h-[60px] text-sm"
                            />
                            <Input
                                placeholder={t('ngo_admin_sustainability.kssImpactPlaceholder')}
                                value={k.impactMetric || ''}
                                onChange={(e) => updateKssArea(k.id, { impactMetric: e.target.value })}
                                className="text-sm"
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Raporlar */}
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-base">{t('ngo_admin_sustainability.reportsTitle')}</CardTitle>
                        <CardDescription>{t('ngo_admin_sustainability.reportsDescription')}</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addReport}>
                        <Upload className="h-4 w-4 mr-1" /> {t('ngo_admin_sustainability.reportsAddButton')}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {reports.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-6">{t('ngo_admin_sustainability.reportsEmpty')}</p>
                    )}
                    {reports.map((r) => (
                        <div key={r.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-start gap-2">
                                <Input
                                    placeholder={t('ngo_admin_sustainability.reportYearPlaceholder')}
                                    value={r.year}
                                    onChange={(e) => updateReport(r.id, { year: e.target.value })}
                                    className="w-24"
                                />
                                <Input
                                    placeholder={t('ngo_admin_sustainability.reportTitlePlaceholder')}
                                    value={r.title}
                                    onChange={(e) => updateReport(r.id, { title: e.target.value })}
                                    className="flex-1 font-semibold"
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeReport(r.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                            <Textarea
                                placeholder={t('ngo_admin_sustainability.reportDescriptionPlaceholder')}
                                value={r.description || ''}
                                onChange={(e) => updateReport(r.id, { description: e.target.value })}
                                className="min-h-[50px] text-sm"
                            />
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder={t('ngo_admin_sustainability.reportUrlPlaceholder')}
                                    value={r.url || ''}
                                    onChange={(e) => updateReport(r.id, { url: e.target.value })}
                                    className="text-sm"
                                />
                                {r.url && (
                                    <Button type="button" variant="ghost" size="icon" asChild>
                                        <a href={r.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Sertifikalar */}
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-base">{t('ngo_admin_sustainability.certificatesTitle')}</CardTitle>
                        <CardDescription>{t('ngo_admin_sustainability.certificatesDescription')}</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addCertificate}>
                        <Plus className="h-4 w-4 mr-1" /> {t('ngo_admin_sustainability.certificatesAddButton')}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {certificates.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-6">{t('ngo_admin_sustainability.certificatesEmpty')}</p>
                    )}
                    {certificates.map((c, idx) => (
                        <div key={idx} className="flex items-start gap-2 border rounded-lg p-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-2.5 shrink-0" />
                            <Input
                                placeholder={t('ngo_admin_sustainability.certificateNamePlaceholder')}
                                value={c.name}
                                onChange={(e) => updateCertificate(idx, { name: e.target.value })}
                                className="flex-1 font-semibold"
                            />
                            <Input
                                placeholder={t('ngo_admin_sustainability.certificateIssuerPlaceholder')}
                                value={c.issuer}
                                onChange={(e) => updateCertificate(idx, { issuer: e.target.value })}
                                className="w-40"
                            />
                            <Input
                                placeholder={t('ngo_admin_sustainability.certificateYearPlaceholder')}
                                value={c.year}
                                onChange={(e) => updateCertificate(idx, { year: e.target.value })}
                                className="w-20"
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeCertificate(idx)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-end pb-8">
                <Button onClick={handleSave} disabled={saving} size="lg" className="rounded-2xl font-bold">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {t('ngo_admin_sustainability.saveButton')}
                </Button>
            </div>
        </div>
    );
}
