'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Send, Loader2, MessageSquare, BarChart3, CheckCircle2, Gift, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PublicFooter } from '@/components/layout/public-footer';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

type SurveyModule = {
    key: string;
    title: string;
    icon: string;
    description: string;
    questions: { id: string; text: string }[];
};

const SURVEY_MODULES: SurveyModule[] = [
    {
        key: 'imece',
        title: 'İmece (Gönüllülük) Paneli',
        icon: '🤝',
        description: 'Gönüllülük akışı, ilan keşfi, başvuru deneyimi.',
        questions: [
            { id: 'imece_q1', text: 'Gönüllülük ilanlarını bulmak ne kadar kolay?' },
            { id: 'imece_q2', text: 'Sana özel önerilerin alaka düzeyi nasıl?' },
            { id: 'imece_q3', text: 'Başvuru süreci ne kadar pürüzsüz?' },
            { id: 'imece_q4', text: 'Sertifika ve rozet motivasyonu yeterli mi?' },
        ],
    },
    {
        key: 'donation',
        title: 'Bağış Paneli',
        icon: '💝',
        description: 'STK keşfi, bağış akışı, şeffaflık.',
        questions: [
            { id: 'don_q1', text: 'STK bilgileri ve şeffaflık verileri yeterli mi?' },
            { id: 'don_q2', text: 'Bağış akışı ne kadar güvenli hissettiriyor?' },
            { id: 'don_q3', text: 'Bağış sonrası rapor ve takip yeterli mi?' },
            { id: 'don_q4', text: 'STK seçim ekranı kullanışlı mı?' },
        ],
    },
    {
        key: 'library',
        title: 'Kütüphane',
        icon: '📚',
        description: 'İçerik keşfi, okuma/izleme deneyimi.',
        questions: [
            { id: 'lib_q1', text: 'İçerikleri keşfetmek ne kadar kolay?' },
            { id: 'lib_q2', text: 'İçerik çeşitliliği ihtiyacını karşılıyor mu?' },
            { id: 'lib_q3', text: 'Okuma / izleme deneyimi rahat mı?' },
        ],
    },
    {
        key: 'impact',
        title: 'Sosyal Etki Envanteri',
        icon: '📊',
        description: 'Etki skoru, sertifika, rozet sistemleri.',
        questions: [
            { id: 'imp_q1', text: 'Kendi etki skorun sana anlamlı geliyor mu?' },
            { id: 'imp_q2', text: 'STK etki verileri yeterince detaylı mı?' },
            { id: 'imp_q3', text: 'Sertifika / rozet sistemi motive ediyor mu?' },
        ],
    },
    {
        key: 'clubs',
        title: 'Öğrenci Kulüpleri ve Etkinlikleri',
        icon: '🎓',
        description: 'Kulüp keşfi, etkinlik bulma, katılım.',
        questions: [
            { id: 'club_q1', text: 'Kulüp / üniversite keşfi ne kadar kolay?' },
            { id: 'club_q2', text: 'Etkinlikleri görüp katılmak rahat mı?' },
            { id: 'club_q3', text: 'Kulüp profil sayfaları yeterli bilgi veriyor mu?' },
        ],
    },
    {
        key: 'mobile-ux',
        title: 'Mobil Deneyim',
        icon: '📱',
        description: 'App akıcılığı, dokunma alanları, hız.',
        questions: [
            { id: 'mob_q1', text: 'App ne kadar akıcı çalışıyor (donma, gecikme)?' },
            { id: 'mob_q2', text: 'Dokunma alanları (butonlar) yeterince büyük mü?' },
            { id: 'mob_q3', text: 'Açılış hızı tatmin edici mi?' },
        ],
    },
    {
        key: 'notifications',
        title: 'Bildirim Deneyimi',
        icon: '🔔',
        description: 'Push, mail, sms bildirimlerinin değeri ve sıklığı.',
        questions: [
            { id: 'not_q1', text: 'Aldığın bildirimler sana değerli geliyor mu?' },
            { id: 'not_q2', text: 'Bildirim sıklığı doğru mu (az / fazla değil)?' },
            { id: 'not_q3', text: 'Acil kan / etkinlik bildirimleri net mi?' },
        ],
    },
    {
        key: 'auth',
        title: 'Giriş ve Kayıt',
        icon: '🔐',
        description: 'WhatsApp / e-posta / telefon ile kayıt deneyimi.',
        questions: [
            { id: 'auth_q1', text: 'Kayıt akışı ne kadar hızlı / kolay?' },
            { id: 'auth_q2', text: 'WhatsApp kod/link aldığında akış pürüzsüz mü?' },
            { id: 'auth_q3', text: 'Şifre / kod hatırlama / sıfırlama deneyimi nasıl?' },
        ],
    },
];

const SURVEY_REWARD = 20;

export default function FeedbackPage() {
    const router = useRouter();
    const { toast } = useToast();
    const db = useFirestore();
    const { user: authUser } = useUser();

    // Free-form feedback state
    const [feedbackType, setFeedbackType] = useState<'suggestion' | 'complaint' | 'request'>('suggestion');
    const [feedbackModule, setFeedbackModule] = useState<string>('');
    const [feedbackText, setFeedbackText] = useState<string>('');
    const [feedbackEmail, setFeedbackEmail] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    // Per-survey state
    const [openSurvey, setOpenSurvey] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, Record<string, number>>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [submittingSurvey, setSubmittingSurvey] = useState<string | null>(null);

    // Kullanıcının daha önce tamamladığı anketleri yükle
    const completedRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return query(
            collection(db, COLLECTIONS.userFeedback),
            where('userId', '==', authUser.uid),
            where('kind', '==', 'survey'),
        );
    }, [db, authUser]);
    const { data: completedDocs } = useCollection<{ surveyKey?: string }>(completedRef);
    const completed = useMemo(() => {
        const set = new Set<string>();
        (completedDocs || []).forEach((d) => { if (d.surveyKey) set.add(d.surveyKey); });
        return set;
    }, [completedDocs]);

    const handleSubmitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackText.trim()) {
            toast({ variant: 'destructive', title: 'Yazı eksik', description: 'Lütfen düşüncelerinizi yazın.' });
            return;
        }
        if (!db) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, COLLECTIONS.userFeedback), {
                kind: 'feedback',
                type: feedbackType,
                module: feedbackModule || null,
                text: feedbackText.trim(),
                email: feedbackEmail.trim() || authUser?.email || null,
                userId: authUser?.uid || null,
                userName: authUser?.displayName || null,
                createdAt: serverTimestamp(),
                status: 'new',
            });
            toast({ title: 'Geri Bildiriminiz Alındı', description: 'Mesajınız ekibimize ulaştı. Teşekkürler!' });
            setFeedbackType('suggestion');
            setFeedbackModule('');
            setFeedbackText('');
            setFeedbackEmail('');
        } catch {
            toast({ variant: 'destructive', title: 'Gönderilemedi', description: 'Lütfen tekrar dene.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitSurvey = async (module: SurveyModule) => {
        if (!authUser) {
            toast({ variant: 'destructive', title: 'Giriş yapın', description: 'Anket için giriş yapmalısın.' });
            return;
        }
        if (completed.has(module.key)) {
            toast({ variant: 'destructive', title: 'Bu anket zaten tamamlandı', description: 'Aynı anket için ikinci kez puan kazanılamaz.' });
            return;
        }
        const surveyAnswers = answers[module.key] || {};
        const answered = module.questions.filter(q => surveyAnswers[q.id] > 0).length;
        if (answered < module.questions.length) {
            toast({ variant: 'destructive', title: 'Eksik yanıt', description: `${module.questions.length - answered} soru yanıtsız.` });
            return;
        }
        if (!db) return;
        setSubmittingSurvey(module.key);
        try {
            await addDoc(collection(db, COLLECTIONS.userFeedback), {
                kind: 'survey',
                surveyKey: module.key,
                surveyTitle: module.title,
                answers: surveyAnswers,
                notes: notes[module.key] || '',
                userId: authUser.uid,
                userName: authUser.displayName || null,
                email: authUser.email || null,
                createdAt: serverTimestamp(),
                status: 'completed',
                reward: SURVEY_REWARD,
            });
            await updateDoc(doc(db, COLLECTIONS.users, authUser.uid), {
                impactScore: increment(SURVEY_REWARD),
            });
            toast({ title: `+${SURVEY_REWARD} puan kazandın! 🎉`, description: `"${module.title}" anketi için teşekkürler.` });
            setOpenSurvey(null);
        } catch (err) {
            console.error('Survey submit failed:', err);
            toast({ variant: 'destructive', title: 'Anket gönderilemedi', description: 'Lütfen tekrar dene.' });
        } finally {
            setSubmittingSurvey(null);
        }
    };

    const setAnswer = (moduleKey: string, qid: string, value: number) => {
        setAnswers(prev => ({
            ...prev,
            [moduleKey]: { ...(prev[moduleKey] || {}), [qid]: value },
        }));
    };
    const setNote = (moduleKey: string, value: string) => {
        setNotes(prev => ({ ...prev, [moduleKey]: value }));
    };

    return (
        <div className="min-h-dvh bg-secondary/30">
            <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-3xl">
                    <Button onClick={() => router.back()} variant="ghost" size="sm" className="h-8 px-2 -ml-2">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Geri
                    </Button>
                    <span className="text-sm font-bold">Geri Bildirim</span>
                    <div className="w-12" />
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
                <div className="text-center space-y-2 py-2">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Sesini Duyalım</h1>
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                        Önerilerini, şikayetlerini ve taleplerini ilet. Anketleri doldurarak <strong className="text-primary">her biri için +{SURVEY_REWARD} puan</strong> kazan.
                    </p>
                </div>

                {/* Free-form Feedback */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" /> Öneri / Şikayet / Talep
                        </CardTitle>
                        <CardDescription>Doğrudan ekibimize mesaj yaz.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmitFeedback} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider">Tür</Label>
                                    <Select value={feedbackType} onValueChange={(v) => setFeedbackType(v as 'suggestion' | 'complaint' | 'request')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="suggestion">💡 Öneri</SelectItem>
                                            <SelectItem value="complaint">⚠️ Şikayet</SelectItem>
                                            <SelectItem value="request">📋 Talep</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider">İlgili Alan (Opsiyonel)</Label>
                                    <Select value={feedbackModule} onValueChange={setFeedbackModule}>
                                        <SelectTrigger><SelectValue placeholder="Genel" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">Genel</SelectItem>
                                            {SURVEY_MODULES.map(m => (
                                                <SelectItem key={m.key} value={m.key}>{m.icon} {m.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fb-text" className="text-xs font-bold uppercase tracking-wider">Mesajın</Label>
                                <Textarea
                                    id="fb-text"
                                    placeholder="Düşüncelerini, sorununu veya talebini detaylıca yaz..."
                                    className="min-h-[120px] resize-none"
                                    required
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                />
                            </div>
                            {!authUser?.email && (
                                <div className="space-y-2">
                                    <Label htmlFor="fb-email" className="text-xs font-bold uppercase tracking-wider">E-posta (Opsiyonel)</Label>
                                    <Input
                                        id="fb-email"
                                        type="email"
                                        placeholder="Gerekirse size dönüş yapabilmemiz için"
                                        value={feedbackEmail}
                                        onChange={(e) => setFeedbackEmail(e.target.value)}
                                    />
                                </div>
                            )}
                            <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl font-bold">
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Gönder</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Anketler */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pt-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-black">Anketler</h2>
                        <span className="text-xs text-muted-foreground">— Her biri +{SURVEY_REWARD} puan</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Aşağıdaki {SURVEY_MODULES.length} farklı anket var. Her birini ayrı doldur, ayrı puan kazan. Aynı anket için 2. defa puan verilmez.
                    </p>

                    {!authUser && (
                        <Card className="border-amber-300 bg-amber-50/50">
                            <CardContent className="p-4 text-center text-sm">
                                Anketleri doldurmak ve puan kazanmak için giriş yapmalısın.
                            </CardContent>
                        </Card>
                    )}

                    {SURVEY_MODULES.map((module) => {
                        const isOpen = openSurvey === module.key;
                        const isDone = completed.has(module.key);
                        const sa = answers[module.key] || {};
                        const answeredCount = module.questions.filter(q => sa[q.id] > 0).length;
                        const progress = Math.round((answeredCount / module.questions.length) * 100);
                        return (
                            <Card key={module.key} className={cn(isDone && 'border-emerald-300 bg-emerald-50/30')}>
                                <button
                                    type="button"
                                    onClick={() => setOpenSurvey(isOpen ? null : module.key)}
                                    disabled={isDone}
                                    className={cn(
                                        'w-full text-left p-4 flex items-center gap-3 transition-colors',
                                        !isDone && 'hover:bg-accent/30',
                                    )}
                                >
                                    <div className="text-2xl">{module.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm leading-tight">{module.title}</p>
                                        <p className="text-xs text-muted-foreground leading-snug mt-0.5">{module.description}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            {module.questions.length} soru · +{SURVEY_REWARD} puan
                                        </p>
                                    </div>
                                    {isDone ? (
                                        <div className="flex items-center gap-1 text-emerald-700">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="text-xs font-bold">Tamamlandı</span>
                                        </div>
                                    ) : (
                                        <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                                    )}
                                </button>
                                {isOpen && !isDone && authUser && (
                                    <CardContent className="border-t pt-4 space-y-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">{answeredCount}/{module.questions.length} soru</span>
                                                <span className="font-bold text-primary">%{progress}</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                        {module.questions.map((q) => (
                                            <div key={q.id} className="space-y-2">
                                                <p className="text-sm">{q.text}</p>
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setAnswer(module.key, q.id, star)}
                                                            className={cn(
                                                                'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                                                                sa[q.id] >= star
                                                                    ? 'bg-primary text-white'
                                                                    : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary',
                                                            )}
                                                            aria-label={`${star} yıldız`}
                                                        >
                                                            <Star className={cn('h-4 w-4', sa[q.id] >= star && 'fill-current')} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <Textarea
                                            placeholder={`${module.title} hakkında ek not (opsiyonel)`}
                                            className="text-sm min-h-[60px] resize-none"
                                            value={notes[module.key] || ''}
                                            onChange={(e) => setNote(module.key, e.target.value)}
                                        />
                                        <Button
                                            onClick={() => handleSubmitSurvey(module)}
                                            disabled={submittingSurvey === module.key || answeredCount < module.questions.length}
                                            className="w-full h-11 rounded-xl font-bold"
                                        >
                                            {submittingSurvey === module.key ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : answeredCount < module.questions.length ? (
                                                `${module.questions.length - answeredCount} soru daha kaldı`
                                            ) : (
                                                <><Gift className="mr-2 h-4 w-4" /> Gönder ve +{SURVEY_REWARD} puan kazan</>
                                            )}
                                        </Button>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </main>

            <PublicFooter currentPageLabel="Geri Bildirim" />
        </div>
    );
}
