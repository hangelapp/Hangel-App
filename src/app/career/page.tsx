'use client';

/**
 * Gönüllü Kariyer Karnesi sayfası — Faz 3.
 *
 * LinkedIn-tarzı görünüm. Veri /api/users/me/career endpoint'inden gelir
 * (mevcut alt koleksiyonlar + users.career alanı birleştirilmiş).
 *
 * Üst: avatar + isim + meslek + kısa biyografi.
 * Sonra: yetkinlikler / tamamlanan görevler / eğitimler / sertifikalar /
 * liderlik deneyimleri / PDF indirme.
 *
 * Düzenleme: bu commit "read-only" görünüm. Edit UI sonraki commit
 * (in-place modal veya /career/edit ayrı sayfa).
 */

import { useEffect, useState } from 'react';
import { Award, BookOpen, Briefcase, Loader2, Sparkles, Star, ChevronRight } from 'lucide-react';

import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc as fsDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';

interface Career {
  competencies: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'expert'>;
  endorsements: Record<string, number>;
  completedTasks: Array<{ id: string; title: string; ngoName?: string; completedAt?: string | null; hours?: number }>;
  trainings: Array<{ title: string; provider?: string; year?: number; certificateUrl?: string }>;
  certificates: Array<{ id: string; title: string; issuedBy?: string; issuedAt?: string | null }>;
  leadershipExperiences: Array<{ title: string; org?: string; startYear?: number; endYear?: number; description?: string }>;
  lastUpdatedAt: string;
}

const LEVEL_PERCENT: Record<string, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

export default function CareerPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [career, setCareer] = useState<Career | null>(null);
  const [loading, setLoading] = useState(false);

  const LEVEL_LABEL: Record<string, string> = {
    beginner: t('careerPage.levelBeginner'),
    intermediate: t('careerPage.levelIntermediate'),
    advanced: t('careerPage.levelAdvanced'),
    expert: t('careerPage.levelExpert'),
  };

  const userDocRef = useMemoFirebase(
    () => (user?.uid && firestore ? fsDoc(firestore, 'users', user.uid) : null),
    [user?.uid, firestore],
  );
  const { data: userDoc } = useDoc<{ displayName?: string; profilePictureUrl?: string; volunteerInfo?: { profession?: string; bio?: string } }>(userDocRef);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/users/me/career', { headers: { authorization: `Bearer ${idToken}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setCareer(json.career as Career);
    } catch (e) {
      toast({ variant: 'destructive', title: t('careerPage.loadFailed'), description: e instanceof Error ? e.message : t('careerPage.unknownError') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  if (isUserLoading || (loading && !career)) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user || !career) return null;

  const competencyKeys = Object.keys(career.competencies);

  return (
    <div className="min-h-dvh bg-secondary/40 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">

        {/* Hero */}
        <Card className="border-none shadow-lg bg-background rounded-3xl overflow-hidden">
          <CardContent className="p-6 text-center space-y-2">
            {userDoc?.profilePictureUrl
              ? <img src={userDoc.profilePictureUrl} alt="" className="w-20 h-20 rounded-full mx-auto object-cover ring-4 ring-primary/10" />
              : <div className="w-20 h-20 rounded-full mx-auto bg-primary/10 flex items-center justify-center"><Briefcase className="h-8 w-8 text-primary" /></div>}
            <h1 className="text-2xl font-black">{userDoc?.displayName ?? t('careerPage.defaultName')}</h1>
            {userDoc?.volunteerInfo?.profession && (
              <p className="text-sm text-muted-foreground">{userDoc.volunteerInfo.profession}</p>
            )}
            {userDoc?.volunteerInfo?.bio && (
              <p className="text-xs text-muted-foreground max-w-md mx-auto pt-2">{userDoc.volunteerInfo.bio}</p>
            )}
            <Badge className="mt-2 bg-primary/10 text-primary hover:bg-primary/15 rounded-full font-bold text-[10px]">
              <Sparkles className="h-3 w-3 mr-1" /> {t('careerPage.badge')}
            </Badge>
          </CardContent>
        </Card>

        {/* Yetkinlikler */}
        <Section title={t('careerPage.competenciesTitle')} icon={Star}>
          {competencyKeys.length === 0 ? (
            <EmptyState text={t('careerPage.competenciesEmpty')} />
          ) : (
            <div className="space-y-3">
              {competencyKeys.map(name => {
                const level = career.competencies[name];
                const count = career.endorsements[name] ?? 0;
                return (
                  <div key={name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold">{name}</span>
                      <span className="text-muted-foreground">
                        {LEVEL_LABEL[level] ?? level} {count > 0 && <span className="ml-1">· {count} {t('careerPage.endorsement')}</span>}
                      </span>
                    </div>
                    <Progress value={LEVEL_PERCENT[level] ?? 0} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Tamamlanan görevler */}
        <Section title={`${t('careerPage.tasksTitle')} (${career.completedTasks.length})`} icon={Briefcase}>
          {career.completedTasks.length === 0 ? (
            <EmptyState text={t('careerPage.tasksEmpty')} />
          ) : (
            <div className="space-y-2">
              {career.completedTasks.slice(0, 10).map(task => (
                <Card key={task.id} className="border-none shadow-sm bg-background rounded-xl">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Briefcase className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{task.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {task.ngoName ?? ''}{task.hours ? ` · ${task.hours} ${t('careerPage.hours')}` : ''}
                      </p>
                    </div>
                    {task.completedAt && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(task.completedAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
              {career.completedTasks.length > 10 && (
                <p className="text-center text-xs text-muted-foreground pt-2">
                  + {career.completedTasks.length - 10} {t('careerPage.moreTasks')}
                </p>
              )}
            </div>
          )}
        </Section>

        {/* Eğitimler */}
        <Section title={t('careerPage.trainingsTitle')} icon={BookOpen}>
          {career.trainings.length === 0 ? (
            <EmptyState text={t('careerPage.trainingsEmpty')} />
          ) : (
            <div className="space-y-2">
              {career.trainings.map((tr, i) => (
                <Card key={i} className="border-none shadow-sm bg-background rounded-xl">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{tr.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {tr.provider ?? ''}{tr.year ? ` · ${tr.year}` : ''}
                      </p>
                    </div>
                    {tr.certificateUrl && (
                      <a href={tr.certificateUrl} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline">
                        {t('careerPage.certificate')}
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Section>

        {/* Sertifikalar */}
        <Section title={`${t('careerPage.certificatesTitle')} (${career.certificates.length})`} icon={Award}>
          {career.certificates.length === 0 ? (
            <EmptyState text={t('careerPage.certificatesEmpty')} />
          ) : (
            <div className="space-y-2">
              {career.certificates.map(c => (
                <Card key={c.id} className="border-none shadow-sm bg-background rounded-xl">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <Award className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{c.title}</p>
                      {c.issuedBy && <p className="text-[11px] text-muted-foreground truncate">{c.issuedBy}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Section>

        {/* Liderlik */}
        <Section title={t('careerPage.leadershipTitle')} icon={Star}>
          {career.leadershipExperiences.length === 0 ? (
            <EmptyState text={t('careerPage.leadershipEmpty')} />
          ) : (
            <div className="space-y-3">
              {career.leadershipExperiences.map((l, i) => (
                <Card key={i} className="border-none shadow-sm bg-background rounded-xl">
                  <CardContent className="p-4 space-y-1">
                    <p className="font-bold text-sm">{l.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {l.org ?? ''}{l.startYear ? ` · ${l.startYear}${l.endYear ? `-${l.endYear}` : `-${t('careerPage.ongoing')}`}` : ''}
                    </p>
                    {l.description && <p className="text-xs text-muted-foreground pt-1">{l.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Section>

        <p className="text-center text-[10px] text-muted-foreground pt-2">
          {t('careerPage.lastUpdate')}: {new Date(career.lastUpdatedAt).toLocaleString('tr-TR')}
        </p>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Award; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="border-dashed bg-background/60 rounded-2xl">
      <CardContent className="p-6 text-center text-xs text-muted-foreground">{text}</CardContent>
    </Card>
  );
}
