'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, limit as fsLimit } from 'firebase/firestore';
import { Loader2, GraduationCap, Users2, Plus, Trash2 } from 'lucide-react';

import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';

const EDUCATION_LEVELS = ['Lise', 'Önlisans', 'Lisans', 'Yüksek Lisans', 'Doktora'];
const STATUS_OPTIONS = ['Devam Ediyor', 'Mezun', 'Terk'];

interface EducationEntry {
  level: string;
  school: string;
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
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [clubMemberships, setClubMemberships] = useState<string[]>([]);
  const [availableClubs, setAvailableClubs] = useState<ClubLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clubSearch, setClubSearch] = useState('');

  useEffect(() => {
    if (!user || !firestore) return;
    (async () => {
      try {
        const snap = await getDoc(doc(firestore, COLLECTIONS.users, user.uid));
        const data = snap.data() as { volunteerInfo?: { education?: EducationEntry[]; clubMemberships?: string[] } } | undefined;
        setEducation(data?.volunteerInfo?.education ?? []);
        setClubMemberships(data?.volunteerInfo?.clubMemberships ?? []);
        // İlk 50 kulübü yükle (search ile filtreleyeceğiz)
        const clubsSnap = await getDocs(query(collection(firestore, COLLECTIONS.clubs), fsLimit(50)));
        const clubs: ClubLite[] = [];
        clubsSnap.forEach((d) => {
          const cd = d.data() as { name?: string; schoolName?: string };
          if (cd.name) clubs.push({ id: d.id, name: cd.name, schoolName: cd.schoolName });
        });
        setAvailableClubs(clubs);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, firestore]);

  const filteredClubs = useMemo(() => {
    const q = clubSearch.trim().toLowerCase();
    if (!q) return availableClubs;
    return availableClubs.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.schoolName ?? '').toLowerCase().includes(q),
    );
  }, [availableClubs, clubSearch]);

  const addEducation = () => setEducation((prev) => [...prev, { level: '', school: '' }]);
  const removeEducation = (idx: number) => setEducation((prev) => prev.filter((_, i) => i !== idx));
  const updateEducation = (idx: number, patch: Partial<EducationEntry>) =>
    setEducation((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));

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

  const save = async () => {
    if (!user || !firestore) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, COLLECTIONS.users, user.uid), {
        'volunteerInfo.education': education.filter((e) => e.school.trim()),
        'volunteerInfo.clubMemberships': clubMemberships,
        'volunteerInfo.educationUpdatedAt': serverTimestamp(),
      });
      toast({ title: 'Kaydedildi', description: 'Eğitim ve kulüp bilgilerin güncellendi.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e instanceof Error ? e.message : 'Bilinmeyen hata.' });
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
      <div className="px-1">
        <h1 className="text-2xl font-black tracking-tight">Eğitim ve Kulüp Bilgileri</h1>
        <p className="text-sm text-muted-foreground mt-1">Eğitim geçmişin ve üye olduğun öğrenci kulüpleri.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-5 w-5 text-blue-600" /> Eğitim Geçmişi</CardTitle>
          <CardDescription>Lise, üniversite, yüksek lisans seviyelerinde okul bilgilerin.</CardDescription>
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
                <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Eğitim seviyesi" /></SelectTrigger>
                <SelectContent>{EDUCATION_LEVELS.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}</SelectContent>
              </Select>
              <Input placeholder="Okul / Üniversite adı" value={entry.school} onChange={(e) => updateEducation(idx, { school: e.target.value })} className="h-10 rounded-lg" />
              {(entry.level === 'Önlisans' || entry.level === 'Lisans' || entry.level === 'Yüksek Lisans' || entry.level === 'Doktora') && (
                <Input placeholder="Bölüm / Fakülte" value={entry.department ?? ''} onChange={(e) => updateEducation(idx, { department: e.target.value })} className="h-10 rounded-lg" />
              )}
              <div className="grid grid-cols-2 gap-2">
                <Select value={entry.status ?? ''} onValueChange={(v) => updateEducation(idx, { status: v })}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Durum" /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                </Select>
                <Input
                  placeholder={entry.status === 'Mezun' ? 'Mezuniyet yılı' : 'Sınıf'}
                  value={entry.status === 'Mezun' ? (entry.graduationYear ?? '') : (entry.grade ?? '')}
                  onChange={(e) => updateEducation(idx, entry.status === 'Mezun' ? { graduationYear: e.target.value } : { grade: e.target.value })}
                  className="h-10 rounded-lg"
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addEducation} className="w-full h-10 rounded-lg">
            <Plus className="h-4 w-4 mr-1" /> Eğitim ekle
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Users2 className="h-5 w-5 text-violet-600" /> Üyesi Olduğun Kulüpler</CardTitle>
          <CardDescription>Eklediğin kulüplerin etkinlikleri ve duyuruları sana ulaşır.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Kulüp ara (isim veya okul)"
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void search(); } }}
              className="h-10 rounded-lg flex-1"
            />
            <Button type="button" variant="outline" onClick={() => void search()} className="h-10">Ara</Button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {filteredClubs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Kulüp bulunamadı.</p>
            )}
            {filteredClubs.map((club) => {
              const isMember = clubMemberships.includes(club.id);
              return (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => toggleClub(club.id)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    isMember ? 'border-violet-500 bg-violet-50' : 'border-border hover:border-violet-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{club.name}</p>
                      {club.schoolName && <p className="text-xs text-muted-foreground truncate">{club.schoolName}</p>}
                    </div>
                    {isMember ? (
                      <span className="text-xs font-bold text-violet-700 shrink-0">✓ Üye</span>
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
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kaydet'}
      </Button>
    </div>
  );
}
