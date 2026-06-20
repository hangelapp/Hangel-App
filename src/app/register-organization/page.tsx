'use client';

/**
 * /register-organization — kuruluş yöneticisi hızlı ön kayıt (taslak).
 *
 * Dernek (kütük no) · Vakıf (isimle ara) · Spor Kulübü (manuel). Sözleşme onayı →
 * /api/ngo/claim → taslak kuruluş + managedNgoId. Taslak marketplace'te gizli;
 * sahibine "evrakını tamamla" ikazı çıkar. (Apple kimliği; "yaratma" yok.)
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, doc, getDoc, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, CheckCircle2, Search, ShieldCheck, Landmark, Trophy, Users } from 'lucide-react';

type OrgType = 'dernek' | 'vakif' | 'kulup';
interface Match { id: string; name: string; il?: string; faaliyetAlani?: string; foundedYear?: number; adres?: string; kutukNo?: string }

export default function RegisterOrganizationPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [step, setStep] = useState<'ask' | 'type' | 'lookup' | 'confirm'>('ask');
  const [orgType, setOrgType] = useState<OrgType>('dernek');
  const [input, setInput] = useState('');         // kütük no / vakıf adı / kulüp adı
  const [city, setCity] = useState('');           // kulüp manuel il
  const [results, setResults] = useState<Match[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!db) return;
    const q = input.trim();
    if (!q) return;
    setLoading(true); setResults([]); setMatch(null);
    try {
      if (orgType === 'dernek') {
        const snap = await getDoc(doc(db, COLLECTIONS.registryDernekler, q));
        if (!snap.exists()) { toast({ variant: 'destructive', title: 'Bulunamadı', description: 'Bu kütük numarasıyla dernek yok (örn. 06-154-120).' }); }
        else { const d = snap.data(); setMatch({ id: q, name: d.name, il: d.il, faaliyetAlani: d.faaliyetAlani, foundedYear: d.foundedYear, adres: d.adres, kutukNo: q }); setStep('confirm'); }
      } else if (orgType === 'vakif') {
        const ql = q.toLocaleLowerCase('tr');
        const snap = await getDocs(query(collection(db, COLLECTIONS.registryVakiflar), orderBy('nameLower'), where('nameLower', '>=', ql), where('nameLower', '<=', ql + ''), limit(8)));
        if (snap.empty) { toast({ variant: 'destructive', title: 'Bulunamadı', description: 'Bu adla vakıf yok. Adın başını yazmayı dene.' }); }
        else { setResults(snap.docs.map((s) => ({ id: s.id, name: s.get('name'), il: s.get('il'), adres: s.get('adres') }))); }
      }
    } catch {
      toast({ variant: 'destructive', title: 'Sorgulanamadı', description: 'Tekrar dene.' });
    } finally { setLoading(false); }
  };

  const claim = async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Giriş gerekli' }); return; }
    if (!consent) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const payload = orgType === 'dernek' ? { orgType, kutukNo: match?.kutukNo }
        : orgType === 'vakif' ? { orgType, vakifId: match?.id }
        : { orgType, manualName: input.trim(), manualCity: city.trim() };
      const res = await fetch('/api/ngo/claim', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ ...payload, consentAccepted: true }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'İşlem tamamlanamadı.');
      toast({ title: 'Kuruluşun eklendi 🎉', description: 'Yönetim paneline gidiyorsun. Evrakları yükleyince herkese görünür olur.' });
      router.push('/ngo-admin');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Olmadı', description: e instanceof Error ? e.message : '' });
    } finally { setLoading(false); }
  };

  const TYPES: { key: OrgType; label: string; icon: typeof Building2; hint: string }[] = [
    { key: 'dernek', label: 'Dernek', icon: Users, hint: 'Kütük numaranla' },
    { key: 'vakif', label: 'Vakıf', icon: Landmark, hint: 'İsimle ara' },
    { key: 'kulup', label: 'Spor Kulübü', icon: Trophy, hint: 'Adını gir' },
  ];

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-primary/10 to-background px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-xl">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-7 w-7" /></div>

        {step === 'ask' && (
          <>
            <h1 className="text-2xl font-black tracking-tight">Bir kuruluşun yöneticisi misin?</h1>
            <p className="mt-2 text-sm text-muted-foreground">Dernek, vakıf ya da spor kulübünü hangel’e <strong>2 dakikada</strong> ekle.</p>
            <div className="mt-6 space-y-2">
              <Button className="w-full" onClick={() => setStep('type')}>Evet, yöneticisiyim</Button>
              <Button variant="outline" className="w-full" asChild><Link href="/timeline">Hayır, devam et</Link></Button>
            </div>
          </>
        )}

        {step === 'type' && (
          <>
            <h1 className="text-xl font-black tracking-tight">Kuruluş tipi</h1>
            <div className="mt-4 grid gap-2">
              {TYPES.map((t) => (
                <button key={t.key} onClick={() => { setOrgType(t.key); setInput(''); setResults([]); setMatch(null); setStep('lookup'); }}
                  className="flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:border-primary hover:bg-accent/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><t.icon className="h-5 w-5" /></span>
                  <span><span className="block font-bold">{t.label}</span><span className="block text-xs text-muted-foreground">{t.hint}</span></span>
                </button>
              ))}
            </div>
            <Button variant="ghost" className="mt-3 w-full text-muted-foreground" onClick={() => setStep('ask')}>Geri</Button>
          </>
        )}

        {step === 'lookup' && (
          <>
            <h1 className="text-xl font-black tracking-tight">{orgType === 'dernek' ? 'Kütük numaran' : orgType === 'vakif' ? 'Vakıf adı' : 'Kulüp adı'}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {orgType === 'dernek' ? 'Kütük (sicil) numaranı gir — bilgiler devlet kütüğünden otomatik gelir.'
                : orgType === 'vakif' ? 'Vakıf adının başını yaz, listeden seç.'
                : 'Spor kulübünün resmî kütük verisi yok; adını ve ilini gir (sonra doğrulanır).'}
            </p>
            <div className="mt-5 space-y-3">
              <Input placeholder={orgType === 'dernek' ? 'örn. 06-154-120' : orgType === 'vakif' ? 'örn. Sağlık Eğitim Vakfı' : 'örn. Beşiktaş Gençlik Spor Kulübü'} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && orgType !== 'kulup' && search()} />
              {orgType === 'kulup' && <Input placeholder="İl (örn. İstanbul)" value={city} onChange={(e) => setCity(e.target.value)} />}
              {orgType === 'kulup' ? (
                <Button className="w-full" onClick={() => { if (input.trim()) { setMatch({ id: 'manual', name: input.trim(), il: city.trim() }); setStep('confirm'); } }} disabled={!input.trim()}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Devam
                </Button>
              ) : (
                <Button className="w-full" onClick={search} disabled={loading || !input.trim()}>
                  {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />} Ara
                </Button>
              )}
              {results.length > 0 && (
                <div className="max-h-52 space-y-1.5 overflow-y-auto">
                  {results.map((r) => (
                    <button key={r.id} onClick={() => { setMatch(r); setStep('confirm'); }} className="block w-full rounded-xl border p-3 text-left text-sm transition hover:border-primary hover:bg-accent/40">
                      <span className="block font-semibold">{r.name}</span>
                      <span className="block text-xs text-muted-foreground">{[r.il, r.adres].filter(Boolean).join(' · ')}</span>
                    </button>
                  ))}
                </div>
              )}
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep('type')}>Geri</Button>
            </div>
          </>
        )}

        {step === 'confirm' && match && (
          <>
            <h1 className="text-xl font-black tracking-tight">Bilgilerini doğrula</h1>
            <div className="mt-4 space-y-1.5 rounded-2xl border bg-muted/40 p-4">
              <p className="text-base font-bold leading-tight">{match.name}</p>
              <p className="text-xs text-muted-foreground">{[match.il, match.foundedYear ? `${match.foundedYear}` : '', match.faaliyetAlani].filter(Boolean).join(' · ')}</p>
              {match.adres && <p className="text-[11px] text-muted-foreground">{match.adres}</p>}
              {match.kutukNo && <p className="pt-1 text-[11px] font-semibold text-primary">Kütük No: {match.kutukNo}</p>}
            </div>
            <label className="mt-4 flex items-start gap-2 text-xs">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#f34723]" />
              <span><Link href="/settings/contracts" className="font-bold text-primary underline">Sözleşme ve politikaları</Link> okudum, bu kuruluşun yetkili yöneticisi olduğumu onaylıyorum.</span>
            </label>
            <Button className="mt-5 w-full" onClick={claim} disabled={loading || !consent}>
              {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />} Kuruluşumu Sahiplen
            </Button>
            <Button variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={() => { setMatch(null); setStep('lookup'); }}>Geri</Button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Taslak olarak eklenir; evrak yükleyince herkese görünür.</p>
          </>
        )}
      </div>
    </div>
  );
}
