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
import { useTranslation } from '@/components/providers/language-provider';

type SurveyModule = {
    key: string;
    title: string;
    icon: string;
    description: string;
    questions: { id: string; text: string }[];
};

const SURVEY_REWARD = 20;

export default function FeedbackPage() {
    const router = useRouter();
    const { toast } = useToast();
    const db = useFirestore();
    const { user: authUser } = useUser();
    const { t } = useTranslation();

    const SURVEY_MODULES: SurveyModule[] = [
        {
            key: 'imece',
            title: t('feedbackPage.survey.imeceTitle'),
            icon: '🤝',
            description: t('feedbackPage.survey.imeceDesc'),
            questions: [
                { id: 'imece_q1', text: t('feedbackPage.survey.imeceQ1') },
                { id: 'imece_q2', text: t('feedbackPage.survey.imeceQ2') },
                { id: 'imece_q3', text: t('feedbackPage.survey.imeceQ3') },
                { id: 'imece_q4', text: t('feedbackPage.survey.imeceQ4') },
            ],
        },
        {
            key: 'donation',
            title: t('feedbackPage.survey.donationTitle'),
            icon: '💝',
            description: t('feedbackPage.survey.donationDesc'),
            questions: [
                { id: 'don_q1', text: t('feedbackPage.survey.donQ1') },
                { id: 'don_q2', text: t('feedbackPage.survey.donQ2') },
                { id: 'don_q3', text: t('feedbackPage.survey.donQ3') },
                { id: 'don_q4', text: t('feedbackPage.survey.donQ4') },
            ],
        },
        {
            key: 'library',
            title: t('feedbackPage.survey.libraryTitle'),
            icon: '📚',
            description: t('feedbackPage.survey.libraryDesc'),
            questions: [
                { id: 'lib_q1', text: t('feedbackPage.survey.libQ1') },
                { id: 'lib_q2', text: t('feedbackPage.survey.libQ2') },
                { id: 'lib_q3', text: t('feedbackPage.survey.libQ3') },
            ],
        },
        {
            key: 'impact',
            title: t('feedbackPage.survey.impactTitle'),
            icon: '📊',
            description: t('feedbackPage.survey.impactDesc'),
            questions: [
                { id: 'imp_q1', text: t('feedbackPage.survey.impQ1') },
                { id: 'imp_q2', text: t('feedbackPage.survey.impQ2') },
                { id: 'imp_q3', text: t('feedbackPage.survey.impQ3') },
            ],
        },
        {
            key: 'clubs',
            title: t('feedbackPage.survey.clubsTitle'),
            icon: '🎓',
            description: t('feedbackPage.survey.clubsDesc'),
            questions: [
                { id: 'club_q1', text: t('feedbackPage.survey.clubQ1') },
                { id: 'club_q2', text: t('feedbackPage.survey.clubQ2') },
                { id: 'club_q3', text: t('feedbackPage.survey.clubQ3') },
            ],
        },
        {
            key: 'mobile-ux',
            title: t('feedbackPage.survey.mobileTitle'),
            icon: '📱',
            description: t('feedbackPage.survey.mobileDesc'),
            questions: [
                { id: 'mob_q1', text: t('feedbackPage.survey.mobQ1') },
                { id: 'mob_q2', text: t('feedbackPage.survey.mobQ2') },
                { id: 'mob_q3', text: t('feedbackPage.survey.mobQ3') },
            ],
        },
        {
            key: 'notifications',
            title: t('feedbackPage.survey.notiTitle'),
            icon: '🔔',
            description: t('feedbackPage.survey.notiDesc'),
            questions: [
                { id: 'not_q1', text: t('feedbackPage.survey.notQ1') },
                { id: 'not_q2', text: t('feedbackPage.survey.notQ2') },
                { id: 'not_q3', text: t('feedbackPage.survey.notQ3') },
            ],
        },
        {
            key: 'auth',
            title: t('feedbackPage.survey.authTitle'),
            icon: '🔐',
            description: t('feedbackPage.survey.authDesc'),
            questions: [
                { id: 'auth_q1', text: t('feedbackPage.survey.authQ1') },
                { id: 'auth_q2', text: t('feedbackPage.survey.authQ2') },
                { id: 'auth_q3', text: t('feedbackPage.survey.authQ3') },
            ],
        },
    ];

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
            toast({ variant: 'destructive', title: t('feedbackPage.missingText'), description: t('feedbackPage.missingTextDesc') });
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
            toast({ title: t('feedbackPage.receivedTitle'), description: t('feedbackPage.receivedDesc') });
            setFeedbackType('suggestion');
            setFeedbackModule('');
            setFeedbackText('');
            setFeedbackEmail('');
        } catch {
            toast({ variant: 'destructive', title: t('feedbackPage.sendFailedTitle'), description: t('feedbackPage.sendFailedDesc') });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitSurvey = async (surveyModule: SurveyModule) => {
        if (!authUser) {
            toast({ variant: 'destructive', title: t('feedbackPage.loginNeededTitle'), description: t('feedbackPage.loginNeededDesc') });
            return;
        }
        if (completed.has(surveyModule.key)) {
            toast({ variant: 'destructive', title: t('feedbackPage.alreadyDoneTitle'), description: t('feedbackPage.alreadyDoneDesc') });
            return;
        }
        const surveyAnswers = answers[surveyModule.key] || {};
        const answered = surveyModule.questions.filter(q => surveyAnswers[q.id] > 0).length;
        if (answered < surveyModule.questions.length) {
            toast({ variant: 'destructive', title: t('feedbackPage.missingAnswers'), description: `${surveyModule.questions.length - answered} ${t('feedbackPage.unansweredSuffix')}` });
            return;
        }
        if (!db) return;
        setSubmittingSurvey(surveyModule.key);
        try {
            await addDoc(collection(db, COLLECTIONS.userFeedback), {
                kind: 'survey',
                surveyKey: surveyModule.key,
                surveyTitle: surveyModule.title,
                answers: surveyAnswers,
                notes: notes[surveyModule.key] || '',
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
            toast({ title: `+${SURVEY_REWARD} ${t('feedbackPage.pointsEarned')} 🎉`, description: `"${surveyModule.title}" ${t('feedbackPage.thanksForSurvey')}` });
            setOpenSurvey(null);
        } catch (err) {
            console.error('Survey submit failed:', err);
            toast({ variant: 'destructive', title: t('feedbackPage.surveyFailedTitle'), description: t('feedbackPage.sendFailedDesc') });
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
                        <ArrowLeft className="mr-1 h-4 w-4" /> {t('aria.back')}
                    </Button>
                    <span className="text-sm font-bold">{t('feedbackPage.headerLabel')}</span>
                    <div className="w-12" />
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
                <div className="text-center space-y-2 py-2">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('feedbackPage.heroTitle')}</h1>
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                        {t('feedbackPage.heroDescPrefix')} <strong className="text-primary">{t('feedbackPage.heroDescBoldPrefix')} +{SURVEY_REWARD} {t('feedbackPage.heroDescBoldSuffix')}</strong> {t('feedbackPage.heroDescSuffix')}
                    </p>
                </div>

                {/* Free-form Feedback */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" /> {t('feedbackPage.formTitle')}
                        </CardTitle>
                        <CardDescription>{t('feedbackPage.formDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmitFeedback} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider">{t('feedbackPage.kindLabel')}</Label>
                                    <Select value={feedbackType} onValueChange={(v) => setFeedbackType(v as 'suggestion' | 'complaint' | 'request')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="suggestion">💡 {t('feedbackPage.kindSuggestion')}</SelectItem>
                                            <SelectItem value="complaint">⚠️ {t('feedbackPage.kindComplaint')}</SelectItem>
                                            <SelectItem value="request">📋 {t('feedbackPage.kindRequest')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider">{t('feedbackPage.relatedArea')}</Label>
                                    <Select value={feedbackModule} onValueChange={setFeedbackModule}>
                                        <SelectTrigger><SelectValue placeholder={t('feedbackPage.generalLabel')} /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">{t('feedbackPage.generalLabel')}</SelectItem>
                                            {SURVEY_MODULES.map(m => (
                                                <SelectItem key={m.key} value={m.key}>{m.icon} {m.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fb-text" className="text-xs font-bold uppercase tracking-wider">{t('feedbackPage.yourMessage')}</Label>
                                <Textarea
                                    id="fb-text"
                                    placeholder={t('feedbackPage.messagePh')}
                                    className="min-h-[120px] resize-none"
                                    required
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                />
                            </div>
                            {!authUser?.email && (
                                <div className="space-y-2">
                                    <Label htmlFor="fb-email" className="text-xs font-bold uppercase tracking-wider">{t('feedbackPage.emailOptional')}</Label>
                                    <Input
                                        id="fb-email"
                                        type="email"
                                        placeholder={t('feedbackPage.emailPh')}
                                        value={feedbackEmail}
                                        onChange={(e) => setFeedbackEmail(e.target.value)}
                                    />
                                </div>
                            )}
                            <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl font-bold">
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> {t('feedbackPage.send')}</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Anketler */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pt-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-black">{t('feedbackPage.surveysTitle')}</h2>
                        <span className="text-xs text-muted-foreground">— {t('feedbackPage.eachOnePrefix')} +{SURVEY_REWARD} {t('feedbackPage.pointsLabel')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t('feedbackPage.surveysIntroPrefix')} {SURVEY_MODULES.length} {t('feedbackPage.surveysIntroSuffix')}
                    </p>

                    {!authUser && (
                        <Card className="border-amber-300 bg-amber-50/50">
                            <CardContent className="p-4 text-center text-sm">
                                {t('feedbackPage.loginToFill')}
                            </CardContent>
                        </Card>
                    )}

                    {SURVEY_MODULES.map((surveyModule) => {
                        const isOpen = openSurvey === surveyModule.key;
                        const isDone = completed.has(surveyModule.key);
                        const sa = answers[surveyModule.key] || {};
                        const answeredCount = surveyModule.questions.filter(q => sa[q.id] > 0).length;
                        const progress = Math.round((answeredCount / surveyModule.questions.length) * 100);
                        return (
                            <Card key={surveyModule.key} className={cn(isDone && 'border-emerald-300 bg-emerald-50/30')}>
                                <button
                                    type="button"
                                    onClick={() => setOpenSurvey(isOpen ? null : surveyModule.key)}
                                    disabled={isDone}
                                    className={cn(
                                        'w-full text-left p-4 flex items-center gap-3 transition-colors',
                                        !isDone && 'hover:bg-accent/30',
                                    )}
                                >
                                    <div className="text-2xl">{surveyModule.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm leading-tight">{surveyModule.title}</p>
                                        <p className="text-xs text-muted-foreground leading-snug mt-0.5">{surveyModule.description}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            {surveyModule.questions.length} {t('feedbackPage.questionLabel')} · +{SURVEY_REWARD} {t('feedbackPage.pointsLabel')}
                                        </p>
                                    </div>
                                    {isDone ? (
                                        <div className="flex items-center gap-1 text-emerald-700">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="text-xs font-bold">{t('feedbackPage.completedLabel')}</span>
                                        </div>
                                    ) : (
                                        <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                                    )}
                                </button>
                                {isOpen && !isDone && authUser && (
                                    <CardContent className="border-t pt-4 space-y-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">{answeredCount}/{surveyModule.questions.length} {t('feedbackPage.questionLabel')}</span>
                                                <span className="font-bold text-primary">%{progress}</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                        {surveyModule.questions.map((q) => (
                                            <div key={q.id} className="space-y-2">
                                                <p className="text-sm">{q.text}</p>
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setAnswer(surveyModule.key, q.id, star)}
                                                            className={cn(
                                                                'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                                                                sa[q.id] >= star
                                                                    ? 'bg-primary text-white'
                                                                    : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary',
                                                            )}
                                                            aria-label={`${star} ${t('feedbackPage.starLabel')}`}
                                                        >
                                                            <Star className={cn('h-4 w-4', sa[q.id] >= star && 'fill-current')} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <Textarea
                                            placeholder={`${surveyModule.title} ${t('feedbackPage.noteAboutSuffix')}`}
                                            className="text-sm min-h-[60px] resize-none"
                                            value={notes[surveyModule.key] || ''}
                                            onChange={(e) => setNote(surveyModule.key, e.target.value)}
                                        />
                                        <Button
                                            onClick={() => handleSubmitSurvey(surveyModule)}
                                            disabled={submittingSurvey === surveyModule.key || answeredCount < surveyModule.questions.length}
                                            className="w-full h-11 rounded-xl font-bold"
                                        >
                                            {submittingSurvey === surveyModule.key ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : answeredCount < surveyModule.questions.length ? (
                                                `${surveyModule.questions.length - answeredCount} ${t('feedbackPage.questionsRemaining')}`
                                            ) : (
                                                <><Gift className="mr-2 h-4 w-4" /> {t('feedbackPage.submitGain')} +{SURVEY_REWARD} {t('feedbackPage.pointsEarnedShort')}</>
                                            )}
                                        </Button>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </main>

            <PublicFooter currentPageLabel={t('feedbackPage.footerLabel')} />
        </div>
    );
}
