'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, BarChart3, Eye, User, Search, Filter, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { collection, orderBy, query, Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
    { value: 'yeni', label: 'Yeni' },
    { value: 'inceleniyor', label: 'İnceleniyor' },
    { value: 'cozuldu', label: 'Çözüldü' },
] as const;

const STATUS_LABEL: Record<string, string> = {
    yeni: 'Yeni',
    inceleniyor: 'İnceleniyor',
    cozuldu: 'Çözüldü',
};

interface FeedbackDoc {
    id: string;
    kind?: 'feedback' | 'survey';
    type?: 'suggestion' | 'complaint' | 'request'; // feedback type
    module?: string | null;
    text?: string;
    surveyKey?: string;
    surveyTitle?: string;
    answers?: Record<string, number>;
    notes?: string;
    email?: string | null;
    userId?: string | null;
    userName?: string | null;
    status?: string;
    reward?: number;
    createdAt?: Timestamp;
}

const TYPE_LABEL: Record<string, string> = {
    suggestion: '💡 Öneri',
    complaint: '⚠️ Şikayet',
    request: '📋 Talep',
};

const MODULE_LABEL: Record<string, string> = {
    imece: '🤝 İmece',
    donation: '💝 Bağış',
    library: '📚 Kütüphane',
    impact: '📊 Etki',
    clubs: '🎓 Kulüpler',
    'mobile-ux': '📱 Mobil',
    notifications: '🔔 Bildirim',
    auth: '🔐 Auth',
    general: 'Genel',
};

export default function SuperAdminFeedbackPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [savingStatus, setSavingStatus] = useState(false);

    const feedbackRef = useMemoFirebase(
        () => (firestore ? query(collection(firestore, COLLECTIONS.userFeedback), orderBy('createdAt', 'desc')) : null),
        [firestore],
    );
    const { data: feedbacks, isLoading } = useCollection<FeedbackDoc>(feedbackRef);

    const [kindFilter, setKindFilter] = useState<'all' | 'feedback' | 'survey'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [moduleFilter, setModuleFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<FeedbackDoc | null>(null);

    const handleStatusChange = async (value: string) => {
        if (!firestore || !selectedItem) return;
        setSavingStatus(true);
        try {
            await updateDoc(doc(firestore, COLLECTIONS.userFeedback, selectedItem.id), {
                status: value,
                statusUpdatedAt: serverTimestamp(),
            });
            setSelectedItem(prev => (prev ? { ...prev, status: value } : prev));
            toast({ title: 'Durum güncellendi', description: STATUS_LABEL[value] || value });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Güncellenemedi.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setSavingStatus(false);
        }
    };

    const filtered = useMemo(() => {
        const list = feedbacks || [];
        return list.filter(f => {
            if (kindFilter !== 'all' && f.kind !== kindFilter) return false;
            if (typeFilter !== 'all' && f.type !== typeFilter) return false;
            if (moduleFilter !== 'all') {
                const fmod = f.kind === 'survey' ? f.surveyKey : f.module;
                if (fmod !== moduleFilter) return false;
            }
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                const matches =
                    (f.text || '').toLowerCase().includes(q) ||
                    (f.notes || '').toLowerCase().includes(q) ||
                    (f.userName || '').toLowerCase().includes(q) ||
                    (f.email || '').toLowerCase().includes(q);
                if (!matches) return false;
            }
            return true;
        });
    }, [feedbacks, kindFilter, typeFilter, moduleFilter, searchTerm]);

    // Stats
    const stats = useMemo(() => {
        const list = feedbacks || [];
        const feedbackList = list.filter(f => f.kind === 'feedback');
        const surveyList = list.filter(f => f.kind === 'survey');
        const byType: Record<string, number> = { suggestion: 0, complaint: 0, request: 0 };
        feedbackList.forEach(f => { if (f.type) byType[f.type] = (byType[f.type] || 0) + 1; });
        const byModule: Record<string, number> = {};
        list.forEach(f => {
            const m = f.kind === 'survey' ? f.surveyKey : f.module;
            if (m) byModule[m] = (byModule[m] || 0) + 1;
        });
        // Survey ortalamaları
        const surveyAvgByKey: Record<string, { count: number; avg: number }> = {};
        const aggByKey: Record<string, { sum: number; n: number }> = {};
        surveyList.forEach(s => {
            const key = s.surveyKey || 'unknown';
            if (!aggByKey[key]) aggByKey[key] = { sum: 0, n: 0 };
            const vals = Object.values(s.answers || {});
            const total = vals.reduce((a, b) => a + b, 0);
            const cnt = vals.length;
            if (cnt > 0) {
                aggByKey[key].sum += total / cnt;
                aggByKey[key].n += 1;
            }
        });
        Object.entries(aggByKey).forEach(([key, { sum, n }]) => {
            surveyAvgByKey[key] = { count: n, avg: n > 0 ? sum / n : 0 };
        });
        return {
            total: list.length,
            feedbackCount: feedbackList.length,
            surveyCount: surveyList.length,
            byType,
            byModule,
            surveyAvgByKey,
        };
    }, [feedbacks]);

    return (
        <div className="min-h-dvh">
            <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/super-admin">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Geri Bildirim Yönetimi</h1>
                        <p className="text-sm text-muted-foreground">Kullanıcı geri bildirimleri ve anket sonuçları.</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Toplam" value={stats.total} icon={<BarChart3 className="h-4 w-4" />} />
                    <StatCard label="Geri Bildirim" value={stats.feedbackCount} icon={<MessageSquare className="h-4 w-4" />} />
                    <StatCard label="Anket" value={stats.surveyCount} icon={<Star className="h-4 w-4" />} />
                    <StatCard label="Şikayet" value={stats.byType.complaint || 0} icon={<Filter className="h-4 w-4 text-destructive" />} accent="text-destructive" />
                </div>

                {/* Module breakdown */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Anket Ortalamaları (5 üzerinden)</CardTitle>
                        <CardDescription>Modül başına ortalama puan ve katılım sayısı.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(stats.surveyAvgByKey).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Henüz anket yanıtı yok.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.entries(stats.surveyAvgByKey).map(([key, { avg, count }]) => (
                                    <div key={key} className="border rounded-lg p-3">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            {MODULE_LABEL[key] || key}
                                        </p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-2xl font-black">{avg.toFixed(1)}</span>
                                            <span className="text-xs text-muted-foreground">/ 5.0</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">{count} yanıt</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Ara..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as typeof kindFilter)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                <SelectItem value="feedback">Geri Bildirim</SelectItem>
                                <SelectItem value="survey">Anket</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger><SelectValue placeholder="Tür" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Türler</SelectItem>
                                <SelectItem value="suggestion">💡 Öneri</SelectItem>
                                <SelectItem value="complaint">⚠️ Şikayet</SelectItem>
                                <SelectItem value="request">📋 Talep</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={moduleFilter} onValueChange={setModuleFilter}>
                            <SelectTrigger><SelectValue placeholder="Modül" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Modüller</SelectItem>
                                {Object.entries(MODULE_LABEL).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* List */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Geri Bildirimler ({filtered.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">Yükleniyor...</div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground text-sm">Bu filtrelerle eşleşen kayıt yok.</div>
                        ) : (
                            <div className="divide-y">
                                {filtered.map((f) => (
                                    <div key={f.id} className="p-4 hover:bg-accent/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {f.kind === 'survey' ? (
                                                        <Badge variant="default" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                                            <Star className="h-3 w-3 mr-1" /> Anket
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {f.type ? TYPE_LABEL[f.type] : 'Mesaj'}
                                                        </Badge>
                                                    )}
                                                    {(f.module || f.surveyKey) && (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {MODULE_LABEL[(f.surveyKey || f.module) as string] || f.surveyKey || f.module}
                                                        </Badge>
                                                    )}
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {f.createdAt && typeof f.createdAt.toDate === 'function'
                                                            ? f.createdAt.toDate().toLocaleString('tr-TR')
                                                            : ''}
                                                    </span>
                                                    {f.status && STATUS_LABEL[f.status] && (
                                                        <Badge
                                                            variant={f.status === 'cozuldu' ? 'default' : 'outline'}
                                                            className={cn('text-[10px]', f.status === 'cozuldu' && 'bg-emerald-600 hover:bg-emerald-600')}
                                                        >
                                                            {STATUS_LABEL[f.status]}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {f.kind === 'survey' ? (
                                                    <div className="text-sm">
                                                        <span className="font-bold">{f.surveyTitle || 'Anket'}</span>
                                                        {f.answers && (
                                                            <span className="text-muted-foreground ml-2 text-xs">
                                                                Ortalama: {(Object.values(f.answers).reduce((a, b) => a + b, 0) / Math.max(1, Object.values(f.answers).length)).toFixed(1)} / 5
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm line-clamp-2">{f.text || '—'}</p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0"
                                                onClick={() => setSelectedItem(f)}
                                                aria-label="İncele"
                                                title="İncele"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detail dialog */}
            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedItem?.kind === 'survey' ? selectedItem?.surveyTitle : 'Geri Bildirim'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedItem?.createdAt && typeof selectedItem.createdAt.toDate === 'function'
                                ? selectedItem.createdAt.toDate().toLocaleString('tr-TR')
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-4">
                            {/* Submitter info */}
                            <div className="border rounded-lg p-3 bg-muted/30 space-y-1">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    <User className="h-3.5 w-3.5" /> Gönderen
                                </div>
                                <p className="text-sm">{selectedItem.userName || 'Anonim'}</p>
                                {selectedItem.email && <p className="text-xs text-muted-foreground">{selectedItem.email}</p>}
                                {selectedItem.userId && (
                                    <Link href={`/profile/${selectedItem.userId}`} className="text-[11px] text-primary hover:underline">
                                        Kullanıcı profili →
                                    </Link>
                                )}
                            </div>

                            {/* Durum yönetimi */}
                            <div className="border rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Durum
                                    {savingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                </div>
                                <Select
                                    value={selectedItem.status && STATUS_LABEL[selectedItem.status] ? selectedItem.status : 'yeni'}
                                    onValueChange={handleStatusChange}
                                    disabled={savingStatus}
                                >
                                    <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Survey answers */}
                            {selectedItem.kind === 'survey' && selectedItem.answers && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Yanıtlar</p>
                                    {Object.entries(selectedItem.answers).map(([qid, value]) => (
                                        <div key={qid} className="flex items-center justify-between p-2 border rounded-md text-sm">
                                            <span className="text-muted-foreground">{qid}</span>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} className={cn('h-4 w-4', s <= value ? 'fill-primary text-primary' : 'text-muted-foreground/30')} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {selectedItem.notes && (
                                        <div className="space-y-1 pt-2">
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Not</p>
                                            <p className="text-sm whitespace-pre-wrap border rounded-md p-2 bg-muted/30">{selectedItem.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Feedback text */}
                            {selectedItem.kind === 'feedback' && selectedItem.text && (
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mesaj</p>
                                    <p className="text-sm whitespace-pre-wrap border rounded-md p-3 bg-muted/20">{selectedItem.text}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: string }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {icon}
                    {label}
                </div>
                <p className={cn('text-2xl font-black mt-1', accent)}>{value.toLocaleString('tr-TR')}</p>
            </CardContent>
        </Card>
    );
}
