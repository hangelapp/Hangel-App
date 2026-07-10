'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, limit as fsLimit } from 'firebase/firestore';
import { Loader2, GraduationCap, Users2, Plus, Trash2, Siren } from 'lucide-react';

import { SettingsNextStep } from '@/components/shared/settings-next-step';
import { AutosaveIndicator } from '@/components/shared/autosave-indicator';
import { useAutosave } from '@/hooks/use-autosave';

import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/shared/searchable-select';
import { TURKISH_UNIVERSITIES, FACULTIES, DEPARTMENTS } from '@/lib/turkish-universities';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';

const EDUCATION_LEVELS = ['Lise', 'Önlisans', 'Lisans', 'Yüksek Lisans', 'Doktora'];
const STATUS_OPTIONS = ['Devam Ediyor', 'Mezun', 'Terk'];

interface EducationEntry {
  level: string;
  school: string;
  faculty?: string;
  department?: string;
  status?: string;
  grade?: string;
  graduationYear?: string;
}

interface ClubLite { id: string; name: string; schoolName?: string }

export default function EducationSettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [clubMemberships, setClubMemberships] = useState<string[]>([]);
  const [availableClubs, setAvailableClubs] = useState<ClubLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clubSearch, setClubSearch] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!user || !firestore) return;
    (async () => {
      try {
        const snap = await getDoc(doc(firestore, COLLECTIONS.users, user.uid));
        const data = snap.data() as { volunteerInfo?: { education?: EducationEntry[]; clubMemberships?: string[] } } | undefined;
        setEducation(data?.volunteerInfo?.education ?? []);
        setClubMemberships(data?.volunteerInfo?.clubMemberships ?? []);
        // Persist'in yazdığı alanlar dolduruldu → otomatik kayıt artık güvenle açılabilir.
        setHydrated(true);
        // İlk 50 kulübü yükle (search ile filtreleyeceğiz)
        const clubsSnap = await getDocs(query(collection(firestore, COLLECTIONS.clubs), fsLimit(50)));
        const clubs: ClubLite[] = [];
        clubsSnap.forEach((d) => {
          const cd = d.data() as { name?: string; schoolName?: string };
          if (cd.name) clubs.push({ id: d.id, name: cd.name, schoolName: cd.schoolName });
        });
        setAvailableClubs(clubs);
      } catch (e) {
        // Sessiz boş form yerine: yükleme hatasını kullanıcıya bildir.
        toast({ variant: 'destructive', title: t('educationPage.loadError'), description: e instanceof Error ? e.message : t('common.unknownError') });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast/t stable; rerun only on user/firestore
  }, [user, firestore]);

  const filteredClubs = useMemo(() => {
    const q = clubSearch.trim().toLowerCase();
    if (!q) return availableClubs;
    return availableClubs.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.schoolName ?? '').toLowerCase().includes(q),
    );
  }, [availableClubs, clubSearch]);

  const addEducation = () => { setEducation((prev) => [...prev, { level: '', school: '' }]); };
  const removeEducation = (idx: number) => { setEducation((prev) => prev.filter((_, i) => i !== idx)); };
  const updateEducation = (idx: number, patch: Partial<EducationEntry>) => {
    setEducation((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const toggleClub = (clubId: string) => {
    setClubMemberships((prev) =>
      prev.includes(clubId) ? prev.filter((c) => c !== clubId) : [...prev, clubId],
    );
  };

  const search = async () => {
    if (!firestore || !clubSearch.trim()) return;
    try {
      const q = clubSearch.trim();
      const snap = await getDocs(query(
        collection(firestore, COLLECTIONS.clubs),
        where('name', '>=', q),
        where('name', '<=', q + ''),
        fsLimit(20),
      ));
      const clubs: ClubLite[] = [];
      snap.forEach((d) => {
        const cd = d.data() as { name?: string; schoolName?: string };
        if (cd.name) clubs.push({ id: d.id, name: cd.name, schoolName: cd.schoolName });
      });
      if (clubs.length) setAvailableClubs((prev) => {
        const map = new Map(prev.map((c) => [c.id, c]));
        clubs.forEach((c) => map.set(c.id, c));
        return Array.from(map.values());
      });
    } catch { /* search optional */ }
  };

  // Ortak yazım — Kaydet butonu ve otomatik kayıt aynı yolu kullanır.
  const persist = async () => {
    if (!user || !firestore) return;
    await updateDoc(doc(firestore, COLLECTIONS.users, user.uid), {
      'volunteerInfo.education': education.filter((e) => e.school.trim()),
      'volunteerInfo.clubMemberships': clubMemberships,
      'volunteerInfo.educationUpdatedAt': serverTimestamp(),
    });
  };

  // Otomatik kayıt (v2 auto): hydration sonrası herhangi bir değişiklikte 1.2 sn sonra sessizce yaz (toast yok).
  const { status: autosaveStatus } = useAutosave(persist, [education, clubMemberships], { delayMs: 1200, enabled: hydrated, auto: true });

  const save = async () => {
    if (!user || !firestore) return;
    setSaving(true);
    try {
      await persist();
      toast({ title: t('educationPage.saved'), description: t('educationPage.savedDesc') });
    } catch (e) {
      toast({ variant: 'destructive', title: t('educationPage.saveError'), description: e instanceof Error ? e.message : t('common.unknownError') });
    } finally {
      setSaving(false);
    }
  };

  if (isUserLoading || loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="px-4 sm:px-1 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('educationPage.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('educationPage.subtitle')}</p>
        </div>
        <AutosaveIndicator status={autosaveStatus} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-5 w-5 text-blue-600" /> {t('educationPage.historySection')}</CardTitle>
          <CardDescription>{t('educationPage.historySectionDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {education.map((entry, idx) => (
            <div key={idx} className="space-y-2 p-3 rounded-xl border bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeEducation(idx)} className="h-7 px-2 text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Select value={entry.level} onValueChange={(v) => updateEducation(idx, { level: v })}>
                <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder={t('educationPage.levelPlaceholder')} /></SelectTrigger>
                <SelectContent>{EDUCATION_LEVELS.map((l) => (<SelectItem key={l} value={l}>{t(`educationPage.levels.${l}`)}</SelectItem>))}</SelectContent>
              </Select>
              {entry.level === 'Lise' ? (
                <Input placeholder={t('educationPage.schoolPlaceholder')} value={entry.school} onChange={(e) => updateEducation(idx, { school: e.target.value })} className="h-10 rounded-lg" />
              ) : (
                <>
                  {/* Üniversite + fakülte + bölüm — tamamı çoktan seçmeli (aramalı dropdown). */}
                  <SearchableSelect
                    options={TURKISH_UNIVERSITIES}
                    value={entry.school}
                    onValueChange={(v) => updateEducation(idx, { school: v })}
                    placeholder="Üniversite seç"
                    searchPlaceholder="Üniversite ara..."
                    triggerClassName="h-10 rounded-lg border border-input bg-background px-3 font-normal"
                  />
                  <SearchableSelect
                    options={FACULTIES}
                    value={entry.faculty ?? ''}
                    onValueChange={(v) => updateEducation(idx, { faculty: v })}
                    placeholder="Fakülte seç"
                    searchPlaceholder="Fakülte ara..."
                    triggerClassName="h-10 rounded-lg border border-input bg-background px-3 font-normal"
                  />
                  <SearchableSelect
                    options={DEPARTMENTS}
                    value={entry.department ?? ''}
                    onValueChange={(v) => updateEducation(idx, { department: v })}
                    placeholder="Bölüm seç"
                    searchPlaceholder="Bölüm ara..."
                    triggerClassName="h-10 rounded-lg border border-input bg-background px-3 font-normal"
                  />
                </>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={entry.status ?? ''} onValueChange={(v) => updateEducation(idx, { status: v })}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder={t('educationPage.statusPlaceholder')} /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{t(`educationPage.statusOptions.${s}`)}</SelectItem>))}</SelectContent>
                </Select>
                <Input
                  placeholder={entry.status === 'Mezun' ? t('educationPage.graduationYearPlaceholder') : t('educationPage.gradePlaceholder')}
                  value={entry.status === 'Mezun' ? (entry.graduationYear ?? '') : (entry.grade ?? '')}
                  onChange={(e) => updateEducation(idx, entry.status === 'Mezun' ? { graduationYear: e.target.value } : { grade: e.target.value })}
                  className="h-10 rounded-lg"
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addEducation} className="w-full h-10 rounded-lg">
            <Plus className="h-4 w-4 mr-1" /> {t('educationPage.addEducation')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Users2 className="h-5 w-5 text-violet-600" /> {t('educationPage.clubsSection')}</CardTitle>
          <CardDescription>{t('educationPage.clubsSectionDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder={t('educationPage.searchClubs')}
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void search(); } }}
              className="h-10 rounded-lg flex-1"
            />
            <Button type="button" variant="outline" onClick={() => void search()} className="h-10">{t('educationPage.searchButton')}</Button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {filteredClubs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t('educationPage.noClubsFound')}</p>
            )}
            {filteredClubs.map((club) => {
              const isMember = clubMemberships.includes(club.id);
              return (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => toggleClub(club.id)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    isMember ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-border hover:border-violet-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{club.name}</p>
                      {club.schoolName && <p className="text-xs text-muted-foreground truncate">{club.schoolName}</p>}
                    </div>
                    {isMember ? (
                      <span className="text-xs font-bold text-violet-700 shrink-0">✓ {t('educationPage.member')}</span>
                    ) : (
                      <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full h-12 rounded-xl font-bold">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('educationPage.save')}
      </Button>

      {/* Akış: kişisel bilgiler → eğitim → afet/acil durum → gönüllülük. */}
      <SettingsNextStep
        href="/settings/emergency"
        icon={<Siren className="h-5 w-5 text-orange-600" />}
        iconBg="bg-orange-100 dark:bg-orange-900/30"
        title="Afet ve Acil Durum"
        description="Kan grubu, bağış tercihleri ve afet gönüllülüğü."
      />
    </div>
  );
}
