'use client';

/**
 * /stk-ekle — STK yöneticisi hızlı ön kayıt (taslak).
 *
 * 1. "STK yöneticisi misin?" → Hayır = çık · Evet = devam.
 * 2. Kütük no → registryDernekler/{kutukNo} (public-read) → bilgiler gelir.
 * 3. Sözleşme/politikaları onayla → /api/ngo/claim → taslak STK + managedNgoId.
 * Taslak STK marketplace'te gizli; sahibine "evrakını tamamla" ikazı çıkar.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, CheckCircle2, Search, ShieldCheck } from 'lucide-react';

interface RegMatch { name?: string; il?: string; faaliyetAlani?: string; foundedYear?: number; adres?: string }

export default function StkEklePage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [step, setStep] = useState<'ask' | 'kutuk' | 'confirm'>('ask');
  const [kutukNo, setKutukNo] = useState('');
  const [match, setMatch] = useState<RegMatch | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    const k = kutukNo.trim();
    if (!db || !k) return;
    setLoading(true); setMatch(null);
    try {
      const snap = await getDoc(doc(db, 'registryDernekler', k));
      if (!snap.exists()) {
        toast({ variant: 'destructive', title: 'Bulunamadı', description: 'Bu kütük numarasıyla kayıt yok. Numarayı kontrol et (örn. 06-154-120).' });
      } else {
        setMatch(snap.data() as RegMatch);
        setStep('confirm');
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
      const res = await fetch('/api/ngo/claim', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ kutukNo: kutukNo.trim(), consentAccepted: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'İşlem tamamlanamadı.');
      toast({ title: 'STK’n eklendi 🎉', description: 'Yönetim paneline yönlendiriliyorsun. Evraklarını tamamlayınca herkese görünür olur.' });
      router.push('/ngo-admin');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Olmadı', description: e instanceof Error ? e.message : '' });
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-primary/10 to-background px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-xl">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-7 w-7" /></div>

        {step === 'ask' && (
          <>
            <h1 className="text-2xl font-black tracking-tight">Bir STK yöneticisi misin?</h1>
            <p className="mt-2 text-sm text-muted-foreground">Derneğini hangel’e <strong>2 dakikada</strong> ekle — kütük numaranla otomatik gelir.</p>
            <div className="mt-6 space-y-2">
              <Button className="w-full" onClick={() => setStep('kutuk')}>Evet, yöneticisiyim</Button>
              <Button variant="outline" className="w-full" asChild><Link href="/timeline">Hayır, devam et</Link></Button>
            </div>
          </>
        )}

        {step === 'kutuk' && (
          <>
            <h1 className="text-2xl font-black tracking-tight">Kütük numaran</h1>
            <p className="mt-2 text-sm text-muted-foreground">Derneğinin kütük (sicil) numarasını gir — bilgilerin devlet kütüğünden otomatik gelir.</p>
            <div className="mt-5 space-y-3">
              <Input placeholder="örn. 06-154-120" value={kutukNo} onChange={(e) => setKutukNo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && lookup()} />
              <Button className="w-full" onClick={lookup} disabled={loading || !kutukNo.trim()}>
                {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />} Sorgula
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep('ask')}>Geri</Button>
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
              <p className="pt-1 text-[11px] font-semibold text-primary">Kütük No: {kutukNo.trim()}</p>
            </div>
            <label className="mt-4 flex items-start gap-2 text-xs">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#f34723]" />
              <span><Link href="/settings/contracts" className="font-bold text-primary underline">Sözleşme ve politikaları</Link> okudum, bu STK’nın yetkili yöneticisi olduğumu onaylıyorum.</span>
            </label>
            <Button className="mt-5 w-full" onClick={claim} disabled={loading || !consent}>
              {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />} STK’mı Sahiplen
            </Button>
            <Button variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={() => { setMatch(null); setStep('kutuk'); }}>Farklı kütük no</Button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Taslak olarak eklenir; evrak yükleyince herkese görünür.</p>
          </>
        )}
      </div>
    </div>
  );
}
