'use client';

/**
 * StkManagerDialog — STK yöneticisinin dernek/vakıf'ını kütük numarası (dernek)
 * veya isimle arama (vakıf) ile bulup, gerçek bilgilerini doğrulayıp tek tıkla
 * eklediği yeniden kullanılabilir Dialog.
 *
 * Kayıt (lookup) mantığı ve /api/ngo/claim çağrısı /register-organization
 * sayfasıyla birebir aynıdır (registryDernekler / registryVakiflar public-read;
 * claim endpoint'i `{ ok, ngoId, name }` döner).
 *
 * Kullanım: STK seçim ekranındaki "STK yöneticisiyim" butonu bunu açar; ayrıca
 * gelir-modeli QR kaydolanları için otomatik açılır. onAdded ile geri çağırır.
 */

import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, CheckCircle2, Users, Landmark, ShieldCheck } from 'lucide-react';

interface Match {
  id: string;
  name: string;
  il?: string;
  faaliyetAlani?: string;
  foundedYear?: number;
  adres?: string;
  kutukNo?: string;
}

type OrgType = 'dernek' | 'vakif';

export interface StkManagerDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdded?: (ngoId: string, ngoName: string) => void;
}

export function StkManagerDialog({ open, onOpenChange, onAdded }: StkManagerDialogProps) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [orgType, setOrgType] = useState<OrgType>('dernek');
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Match[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  // Dialog kapanıp/yeniden açılınca tüm iç durumu sıfırla.
  useEffect(() => {
    if (!open) {
      setOrgType('dernek');
      setInput('');
      setResults([]);
      setMatch(null);
      setSearching(false);
      setAdding(false);
    }
  }, [open]);

  // Dernek: 8 hane → "NN-NNN-NNN" olarak otomatik tireleme.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (orgType === 'dernek') {
      const digits = raw.replace(/\D/g, '').slice(0, 8);
      const dashed =
        digits.length > 5 ? `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
          : digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}`
          : digits;
      setInput(dashed);
    } else {
      setInput(raw);
    }
    setMatch(null);
  };

  const switchType = (t: OrgType) => {
    if (t === orgType) return;
    setOrgType(t);
    setInput('');
    setResults([]);
    setMatch(null);
  };

  // Registry sorgusu — /register-organization ile birebir aynı okuma mantığı.
  const search = async () => {
    if (!db) return;
    const q = input.trim();
    if (!q) return;
    setSearching(true);
    setResults([]);
    setMatch(null);
    try {
      if (orgType === 'dernek') {
        // Tireli / tiresiz / ham girişleri dene.
        const digits = q.replace(/\D/g, '');
        const dashed = digits.length === 8 ? `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5, 8)}` : q;
        const candidates = Array.from(new Set([dashed, q, digits]));
        let found: Record<string, unknown> | null = null;
        let foundId = '';
        for (const c of candidates) {
          const snap = await getDoc(doc(db, COLLECTIONS.registryDernekler, c));
          if (snap.exists()) { found = snap.data(); foundId = c; break; }
        }
        if (!found) {
          toast({ variant: 'destructive', title: 'Bulunamadı', description: 'Bu kütük numarasıyla kayıt bulunamadı, kontrol edin. (örn. 06-154-120 veya 06154120)' });
        } else {
          setMatch({
            id: foundId,
            name: found.name as string,
            il: found.il as string,
            faaliyetAlani: found.faaliyetAlani as string,
            foundedYear: found.foundedYear as number,
            adres: found.adres as string,
            kutukNo: foundId,
          });
        }
      } else {
        const ql = q.toLocaleLowerCase('tr');
        const snap = await getDocs(query(
          collection(db, COLLECTIONS.registryVakiflar),
          orderBy('nameLower'),
          where('nameLower', '>=', ql),
          where('nameLower', '<=', ql + ''),
          limit(8),
        ));
        if (snap.empty) {
          toast({ variant: 'destructive', title: 'Bulunamadı', description: 'Bu adla vakıf bulunamadı, kontrol edin. Adın başını yazmayı deneyin.' });
        } else {
          setResults(snap.docs.map((s) => ({ id: s.id, name: s.get('name'), il: s.get('il'), adres: s.get('adres') })));
        }
      }
    } catch {
      toast({ variant: 'destructive', title: 'Sorgulanamadı', description: 'Lütfen tekrar deneyin.' });
    } finally {
      setSearching(false);
    }
  };

  // /api/ngo/claim — /register-organization ile birebir aynı istek.
  const add = async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Giriş gerekli' }); return; }
    if (!match) return;
    setAdding(true);
    try {
      const token = await user.getIdToken();
      const payload = orgType === 'dernek'
        ? { orgType, kutukNo: match.kutukNo }
        : { orgType, vakifId: match.id };
      const res = await fetch('/api/ngo/claim', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, consentAccepted: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'İşlem tamamlanamadı.');

      // ngoId dönmezse users/{uid}.managedNgoId'e düş.
      let ngoId: string = data.ngoId || '';
      const ngoName: string = data.name || match.name;
      if (!ngoId && db) {
        try {
          const usnap = await getDoc(doc(db, COLLECTIONS.users, user.uid));
          ngoId = (usnap.get('managedNgoId') as string) || '';
        } catch { /* yoksay */ }
      }

      toast({ title: 'STK kaydın oluşturuldu 🎉', description: 'Yönetim paneline devam edebilirsin.' });
      onAdded?.(ngoId, ngoName);
      onOpenChange(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Olmadı', description: e instanceof Error ? e.message : 'Lütfen tekrar deneyin.' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>STK'nı ekle</DialogTitle>
          <DialogDescription>
            Dernek kütük numaranı gir ya da vakfını adıyla ara; bilgiler resmi kütükten gelir.
          </DialogDescription>
        </DialogHeader>

        {/* 1) Tür seçimi */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => switchType('dernek')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${orgType === 'dernek' ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent/40'}`}
          >
            <Users className="h-4 w-4" /> Dernek
          </button>
          <button
            type="button"
            onClick={() => switchType('vakif')}
            className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${orgType === 'vakif' ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent/40'}`}
          >
            <Landmark className="h-4 w-4" /> Vakıf
          </button>
        </div>

        {/* 2) Girdi */}
        <div className="space-y-2">
          <Label htmlFor="stk-lookup">
            {orgType === 'dernek' ? 'Kütük Numarası' : 'Vakıf Adı'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="stk-lookup"
              placeholder={orgType === 'dernek' ? 'örn. 06-154-120' : 'örn. Sağlık Eğitim Vakfı'}
              value={input}
              inputMode={orgType === 'dernek' ? 'numeric' : 'text'}
              onChange={handleInputChange}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }}
            />
            <Button type="button" onClick={search} disabled={searching || !input.trim()}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-1.5 hidden sm:inline">Sorgula</span>
            </Button>
          </div>
        </div>

        {/* Vakıf arama sonuçları — seçince doğrulama kartına geçer */}
        {orgType === 'vakif' && results.length > 0 && !match && (
          <div className="max-h-52 space-y-1.5 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setMatch(r)}
                className="block w-full rounded-xl border p-3 text-left text-sm transition hover:border-primary hover:bg-accent/40"
              >
                <span className="block font-semibold">{r.name}</span>
                <span className="block text-xs text-muted-foreground">{[r.il, r.adres].filter(Boolean).join(' · ')}</span>
              </button>
            ))}
          </div>
        )}

        {/* 3) Doğrulama kartı — gerçek kütük bilgileri */}
        {match && (
          <div className="space-y-3">
            <div className="space-y-1.5 rounded-2xl border bg-muted/40 p-4">
              <p className="text-base font-bold leading-tight">{match.name}</p>
              <p className="text-xs text-muted-foreground">
                {[orgType === 'dernek' ? 'Dernek' : 'Vakıf', match.il, match.foundedYear ? `${match.foundedYear}` : '', match.faaliyetAlani].filter(Boolean).join(' · ')}
              </p>
              {match.adres && <p className="text-[11px] text-muted-foreground">{match.adres}</p>}
              {match.kutukNo && <p className="pt-1 text-[11px] font-semibold text-primary">Kütük No: {match.kutukNo}</p>}
            </div>

            {/* 4) Ekle */}
            <Button type="button" className="w-full" onClick={add} disabled={adding}>
              {adding ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
              STK'mı Ekle
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Taslak olarak eklenir; evrak yükleyince herkese görünür.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
