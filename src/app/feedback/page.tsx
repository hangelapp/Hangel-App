'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Send, Loader2, MessageSquare, BarChart3, CheckCircle2, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PublicFooter } from '@/components/layout/public-footer';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

type SurveyModule = {
    key: string;
    title: string;
    icon: string;
    questions: { id: string; text: string }[];
};

const SURVEY_MODULES: SurveyModule[] = [
    {
        key: 'imece',
        title: 'Hangel İmece (Gönüllülük) Paneli',
        icon: '🤝',
        questions: [
            { id: 'imece_q1', text: 'Gönüllülük ilanlarını bulmak ne kadar kolay?' },
            { id: 'imece_q2', text: 'Sana özel önerilerin alaka düzeyi nasıl?' },
            { id: 'imece_q3', text: 'Başvuru süreci ne kadar pürüzsüz?' },
        ],
    },
    {
        key: 'donation',
        title: 'Hangel Bağış Paneli',
        icon: '💝',
        questions: [
            { id: 'don_q1', text: 'STK bilgileri ve şeffaflık verileri yeterli mi?' },
            { id: 'don_q2', text: 'Bağış akışı ne kadar güvenli hissettiriyor?' },
            { id: 'don_q3', text: 'Bağış sonrası rapor ve takip yeterli mi?' },
        ],
    },
    {
        key: 'library',
        title: 'Hangel Kütüphane',
        icon: '📚',
        questions: [
            { id: 'lib_q1', text: 'İçerikleri keşfetmek ne kadar kolay?' },
            { id: 'lib_q2', text: 'İçerik çeşitliliği ihtiyacını karşılıyor mu?' },
            { id: 'lib_q3', text: 'Okuma / izleme deneyimi rahat mı?' },
        ],
    },
    {
        key: 'impact',
        title: 'Hangel Sosyal Etki Envanteri',
        icon: '📊',
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
        questions: [
            { id: 'club_q1', text: 'Kulüp / üniversite keşfi ne kadar kolay?' },
            { id: 'club_q2', text: 'Etkinlikleri görüp katılmak rahat mı?' },
            { id: 'club_q3', text: 'Kulüp profil sayfaları yeterli bilgi veriyor mu?' },
        ],
    },
];

const SURVEY_REWARD = 20;

export default function FeedbackPage() {
    const router = useRouter();
    const { toast } = useToast();
    const db = useFirestore();
    const { user: authUser } = useUser();

    // Form state
    const [feedbackType, setFeedbackType] = useState<'suggestion' | 'complaint' | 'request'>('suggestion');
    const [feedbackModule, setFeedbackModule] = useState<string>('');
    const [feedbackText, setFeedbackText] = useState<string>('');
    const [feedbackEmail, setFeedbackEmail] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    // Survey state
    const [surveyAnswers, setSurveyAnswers] = useState<Record<string, number>>({});
    const [surveyNotes, setSurveyNotes] = useState<Record<string, string>>({});
    const [surveySubmitting, setSurveySubmitting] = useState(false);
    const [surveyCompleted, setSurveyCompleted] = useState(false);

    const allQuestions = SURVEY_MODULES.flatMap(m => m.questions);
    const answeredCount = allQuestions.filter(q => surveyAnswers[q.id] > 0).length;
    const totalQuestions = allQuestions.length;
    const progress = Math.round((answeredCount / totalQuestions) * 100);

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
                type: feedbackType, // suggestion / complaint / request
                module: feedbackModule || null,
                text: feedbackText.trim(),
                email: feedbackEmail.trim() || authUser?.email || null,
                userId: authUser?.uid || null,
                userName: authUser?.displayName || null,
                createdAt: serverTimestamp(),
                status: 'new',
            });
            toast({
                title: 'Geri Bildiriminiz Alındı',
                description: 'Mesajınız ekibimize ulaştı. Teşekkürler!',
            });
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

    const handleSubmitSurvey = async () => {
        if (!authUser) {
            toast({ variant: 'destructive', title: 'Giriş yapın', description: 'Anketi göndermek için giriş yapmalısınız.' });
            return;
        }
        if (answeredCount < totalQuestions) {
            toast({ variant: 'destructive', title: 'Eksik yanıt', description: `Lütfen tüm ${totalQuestions} soruyu yanıtlayın.` });
            return;
        }
        if (!db) return;
        setSurveySubmitting(true);
        try {
            // Survey kaydını yaz
            await addDoc(collection(db, COLLECTIONS.userFeedback), {
                kind: 'survey',
                answers: surveyAnswers,
                notes: surveyNotes,
                userId: authUser.uid,
                userName: authUser.displayName || null,
                email: authUser.email || null,
                createdAt: serverTimestamp(),
                status: 'completed',
                reward: SURVEY_REWARD,
            });
            // Kullanıcıya 20 puan ekle (impactScore)
            await updateDoc(doc(db, COLLECTIONS.users, authUser.uid), {
                impactScore: increment(SURVEY_REWARD),
            });
            setSurveyCompleted(true);
            toast({
                title: `+${SURVEY_REWARD} puan kazandın! 🎉`,
                description: 'Hangel\'in gelişmesine katkın için teşekkürler.',
            });
        } catch (err) {
            console.error('Survey submit failed:', err);
            toast({ variant: 'destructive', title: 'Anket gönderilemedi', description: 'Lütfen tekrar dene.' });
        } finally {
            setSurveySubmitting(false);
        }
    };

    return (
        <div className="min-h-dvh bg-secondary/30">
            {/* Header */}
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
                {/* Intro */}
                <div className="text-center space-y-2 py-2">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Sesini Duyalım</h1>
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                        Önerilerini, şikayetlerini ve taleplerini ekibimize ilet. Hangel&apos;in
                        her özelliği senin geri bildirimlerinle şekilleniyor.
                    </p>
                </div>

                {/* Feedback Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Öneri / Şikayet / Talep
                        </CardTitle>
                        <CardDescription>Mesajını yaz, ekibimize doğrudan ulaşsın.</CardDescription>
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
                                <Label htmlFor="fb-text" className="text-xs font-bold uppercase tracking-wider">Mesajınız</Label>
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

                {/* UX Survey */}
                <Card className="border-primary/30">
                    <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    Kullanıcı Deneyimi Anketi
                                </CardTitle>
                                <CardDescription className="mt-1.5">
                                    5 modül için kısa sorular. Tamamlayınca <strong className="text-primary">+{SURVEY_REWARD} puan</strong> kazanırsın.
                                </CardDescription>
                            </div>
                            <div className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-bold">
                                <Gift className="h-3.5 w-3.5" /> +{SURVEY_REWARD}
                            </div>
                        </div>
                        {!surveyCompleted && (
                            <div className="space-y-1 pt-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{answeredCount} / {totalQuestions} soru</span>
                                    <span className="font-bold text-primary">%{progress}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {surveyCompleted ? (
                            <div className="text-center py-6 space-y-3">
                                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                                </div>
                                <p className="font-bold text-lg">Anket tamamlandı 🎉</p>
                                <p className="text-sm text-muted-foreground">
                                    +{SURVEY_REWARD} puan etki skoruna eklendi. Teşekkürler!
                                </p>
                            </div>
                        ) : !authUser ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                Anketi doldurmak ve puan kazanmak için giriş yapmalısınız.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {SURVEY_MODULES.map((module) => (
                                    <div key={module.key} className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0">
                                        <h3 className="text-sm font-bold flex items-center gap-2">
                                            <span className="text-xl">{module.icon}</span>
                                            <span>{module.title}</span>
                                        </h3>
                                        {module.questions.map((q) => (
                                            <div key={q.id} className="space-y-2 pl-1">
                                                <p className="text-sm">{q.text}</p>
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setSurveyAnswers(prev => ({ ...prev, [q.id]: star }))}
                                                            className={cn(
                                                                'w-9 h-9 rounded-lg transition-all flex items-center justify-center',
                                                                surveyAnswers[q.id] >= star
                                                                    ? 'bg-primary text-white'
                                                                    : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary',
                                                            )}
                                                            aria-label={`${star} yıldız`}
                                                        >
                                                            <Star className={cn('h-4 w-4', surveyAnswers[q.id] >= star && 'fill-current')} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pl-1">
                                            <Textarea
                                                placeholder={`${module.title} hakkında eklemek istediğin not (opsiyonel)`}
                                                className="text-sm min-h-[60px] resize-none"
                                                value={surveyNotes[module.key] || ''}
                                                onChange={(e) => setSurveyNotes(prev => ({ ...prev, [module.key]: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    onClick={handleSubmitSurvey}
                                    disabled={surveySubmitting || answeredCount < totalQuestions}
                                    className="w-full h-11 rounded-xl font-bold"
                                >
                                    {surveySubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : answeredCount < totalQuestions ? (
                                        `${totalQuestions - answeredCount} soru daha kaldı`
                                    ) : (
                                        <><Gift className="mr-2 h-4 w-4" /> Anketi gönder ve +{SURVEY_REWARD} puan kazan</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            <PublicFooter currentPageLabel="Geri Bildirim" />
        </div>
    );
}
