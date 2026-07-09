'use client';

/**
 * /onboarding/stk-yonetici — Etkinlik-QR ("Gelir Modeli Oluşturma Konferansı")
 * akışının STK-yönetici adımı.
 *
 * Kullanıcı etkinlik detaydan çıktıktan sonra buraya yönlendirilir:
 *   ADIM 1  "STK yöneticisi misiniz?"
 *     · Hayır → bağışçı akışı: onboardingStep=ngo-selection + next=/market → /settings/ngo-selection
 *     · Evet  → ADIM 2
 *   ADIM 2  Kütük numarası → /api/ngo/claim ile STK (taslak) oluşturulur.
 *     Başarıda oluşan ngoId ön-seçili olacak şekilde bağışçı seçimine gidilir;
 *     kullanıcı 2. STK'yı seçip market'e geçer.
 *
 * /register-organization'daki claim çağrısı birebir örnek alınmıştır:
 *   body → { orgType, kutukNo | vakifId, consentAccepted:true }
 *   token → user.getIdToken()  ·  başarı dönüşü → { ok, ngoId, name }
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  clearQrOnboard,
  setNgoSelectionNext,
} from '@/lib/onboarding/qr-onboarding';
import { Building2, Loader2, CheckCircle2, Search, Users, Landmark, ShieldCheck } from 'lucide-react';

type OrgType = 'dernek' | 'vakif';
interface VakifMatch { id: string; name: string; il?: string; adres?: string }

export default function StkYoneticiOnboardingPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [step, setStep] = useState<'ask' | 'kutuk'>('ask');
  const [orgType, setOrgType] = useState<OrgType>('dernek');
  const [input, setInput] = useState(''); // dernek kütük no / vakıf arama metni
  const [results, setResults] = useState<VakifMatch[]>([]);
  const [vakif, setVakif] = useState<VakifMatch | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Giriş yapılmamışsa (buraya normalde girişli gelinir) giriş seçimine gönder.
  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login/selection');
  }, [isUserLoading, user, router]);

  // Bağışçı akışına yönlendir (ortak yardımcı).
  const goToNgoSelection = () => {
    try {
      localStorage.setItem('onboardingStep', 'ngo-selection');
    } catch { /* yut */ }
    setNgoSelectionNext('/market');
    router.push('/settings/ngo-selection');
  };

  // ADIM 1 — "Hayır, bağışçı olacağım"
  const handleNo = () => {
    clearQrOnboard();
    goToNgoSelection();
  };

  // Dernek kütük no formatı: "34262102" → "34-262-102".
  const formatKutuk = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return raw.trim();
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5, 8)}`;
  };

  // Vakıf: isimle registry'de ara, listeden seç (endpoint vakifId bekler).
  const searchVakif = async () => {
    if (!db) return;
    const q = input.trim();
    if (!q) return;
    setSearching(true); setResults([]); setVakif(null);
    try {
      const ql = q.toLocaleLowerCase('tr');
      const snap = await getDocs(query(
        collection(db, COLLECTIONS.registryVakiflar),
        orderBy('nameLower'),
        where('nameLower', '>=', ql),
        where('nameLower', '<=', ql + ''),
        limit(8),
      ));
      if (snap.empty) {
        toast({ variant: 'destructive', title: 'Bulunamadı', description: 'Bu adla vakıf yok. Adın başını yazmayı dene.' });
      } else {
        setResults(snap.docs.map((s) => ({ id: s.id, name: s.get('name'), il: s.get('il'), adres: s.get('adres') })));
      }
    } catch {
      toast({ variant: 'destructive', title: 'Sorgulanamadı', description: 'Tekrar dene.' });
    } finally {
      setSearching(false);
    }
  };

  // ADIM 2 — "STK'mı oluştur"
  const handleCreate = async () => {
    if (!user) { router.replace('/login/selection'); return; }

    let payload: Record<string, unknown>;
    if (orgType === 'dernek') {
      const kutukNo = formatKutuk(input);
      if (!kutukNo) {
        toast({ variant: 'destructive', title: 'Kütük numarası gerekli', description: 'Örn. 06-154-120 veya 06154120.' });
        return;
      }
      payload = { orgType: 'dernek', kutukNo };
    } else {
      if (!vakif) {
        toast({ variant: 'destructive', title: 'Vakıf seç', description: 'Listeden vakfını seçmelisin.' });
        return;
      }
      payload = { orgType: 'vakif', vakifId: vakif.id };
    }

    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo/claim', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, consentAccepted: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'STK oluşturulamadı.');

      // Oluşan STK'yı yakala: endpoint { ok, ngoId, name } döner. Emniyet için
      // dönüşte yoksa users/{uid}.managedNgoId'den oku (claim route bunu yazar).
      let ngoId: string | undefined = data?.ngoId;
      if (!ngoId && db) {
        try {
          const uSnap = await getDoc(doc(db, COLLECTIONS.users, user.uid));
          const mid = uSnap.get('managedNgoId');
          if (typeof mid === 'string' && mid) ngoId = mid;
        } catch { /* yut */ }
      }

      // Oluşan STK bağışçı seçiminde ön-seçili gelsin.
      try {
        if (ngoId) localStorage.setItem('onboardingPreselectNgo', ngoId);
        localStorage.setItem('onboardingStep', 'ngo-selection');
      } catch { /* yut */ }
      setNgoSelectionNext('/market');
      clearQrOnboard();

      toast({ title: 'STK kaydın oluşturuldu 🎉', description: "Şimdi 2. desteklediğin STK'yı seç." });
      router.push('/settings/ngo-selection');
    } catch (e) {
      // Başarısızlıkta marker'lara dokunma; kullanıcı tekrar denesin.
      toast({ variant: 'destructive', title: 'Olmadı', description: e instanceof Error ? e.message : 'Tekrar dene.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-primary/10 to-background px-6 py-10">
      <Card className="w-full max-w-md rounded-2xl border shadow-xl">
        <CardContent className="p-7">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-7 w-7" />
          </div>

          {step === 'ask' && (
            <>
              <h1 className="text-2xl font-black tracking-tight">STK yöneticisi misiniz?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Bir <strong>dernek</strong> ya da <strong>vakıf</strong> yöneticisiysen STK'nı hangel'e
                ekleyip market'te yerini alabilirsin. Değilsen bağışçı olarak devam edebilirsin.
              </p>
              <div className="mt-6 space-y-2">
                <Button className="w-full" onClick={() => setStep('kutuk')}>
                  Evet, yöneticiyim
                </Button>
                <Button variant="outline" className="w-full" onClick={handleNo}>
                  Hayır, bağışçı olacağım
                </Button>
              </div>
            </>
          )}

          {step === 'kutuk' && (
            <>
              <h1 className="text-xl font-black tracking-tight">STK'nı ekle</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Kuruluş tipini seç, {orgType === 'dernek' ? 'kütük numaranı gir' : 'vakfının adını ara'}.
              </p>

              {/* Tip seçimi — segmentli kontrol */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                {([
                  { key: 'dernek' as const, label: 'Dernek', icon: Users },
                  { key: 'vakif' as const, label: 'Vakıf', icon: Landmark },
                ]).map((t) => {
                  const active = orgType === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => { setOrgType(t.key); setInput(''); setResults([]); setVakif(null); }}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold transition ${
                        active ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary hover:bg-accent/40'
                      }`}
                    >
                      <t.icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-3">
                {orgType === 'dernek' ? (
                  <Input
                    inputMode="numeric"
                    placeholder="Kütük no — örn. 06-154-120"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                  />
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Vakıf adı — örn. Sağlık Eğitim Vakfı"
                        value={input}
                        onChange={(e) => { setInput(e.target.value); setVakif(null); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') searchVakif(); }}
                      />
                      <Button type="button" variant="outline" onClick={searchVakif} disabled={searching || !input.trim()}>
                        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                    {results.length > 0 && (
                      <div className="max-h-52 space-y-1.5 overflow-y-auto">
                        {results.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => { setVakif(r); setResults([]); setInput(r.name); }}
                            className="block w-full rounded-xl border p-3 text-left text-sm transition hover:border-primary hover:bg-accent/40"
                          >
                            <span className="block font-semibold">{r.name}</span>
                            <span className="block text-xs text-muted-foreground">{[r.il, r.adres].filter(Boolean).join(' · ')}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {vakif && (
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Seçilen: {vakif.name}
                      </p>
                    )}
                  </>
                )}

                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={submitting || (orgType === 'dernek' ? !input.trim() : !vakif)}
                >
                  {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                  STK'mı oluştur
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep('ask')} disabled={submitting}>
                  Geri
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Taslak olarak eklenir; evrak yükleyince herkese görünür.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
