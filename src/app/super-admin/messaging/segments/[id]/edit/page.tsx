'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Save, Trash2, ArrowLeft, RefreshCw, Users,
} from 'lucide-react';
import { allProvinces, allInterests, allSkills } from '@/lib/data';
import { messagingFetch } from '@/lib/messaging/client';
import type { SegmentFilters, ResolvedRecipient } from '@/lib/messaging/types';
import { COLLECTIONS } from '@/firebase/collections';

interface DryRunResult {
  summary: {
    fromFilters: number;
    fromSegments: number;
    manual: number;
    csv: number;
    beforeDedupe: number;
    afterDedupe: number;
    invalidAddress: number;
    afterConsent: number;
  };
  sample: ResolvedRecipient[];
}

const BLOOD_TYPES = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'];

function MultiPicker({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else onChange([...values, opt]);
  };
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1.5 mt-1 max-h-40 overflow-auto p-2 border rounded bg-muted/20">
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            onClick={() => toggle(opt)}
            className={`text-xs px-2 py-1 rounded border ${
              values.includes(opt)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {values.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1">{values.length} seçili</p>
      )}
    </div>
  );
}

export default function SegmentEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const isNew = params.id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email' | 'both'>('sms');
  const [useCase, setUseCase] = useState<'transactional' | 'marketing' | 'emergency'>('transactional');

  const [roles, setRoles] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [bloodTypes, setBloodTypes] = useState<string[]>([]);
  const [donationMin, setDonationMin] = useState<string>('');
  const [donationMax, setDonationMax] = useState<string>('');

  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [dryRunning, setDryRunning] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const snap = await getDoc(doc(db, COLLECTIONS.recipientSegments, params.id));
      if (!snap.exists()) {
        toast({ variant: 'destructive', title: 'Bulunamadı' });
        router.push('/super-admin/messaging/segments');
        return;
      }
      const s = snap.data() as Record<string, unknown>;
      setName((s.name as string) ?? '');
      setDescription((s.description as string) ?? '');
      setChannel((s.channel as 'sms' | 'email' | 'both') ?? 'sms');
      setUseCase((s.useCase as 'transactional' | 'marketing' | 'emergency') ?? 'transactional');
      const f = (s.filters as SegmentFilters | undefined) ?? {};
      setRoles(f.roles ?? []);
      setCities(f.cities ?? []);
      setInterests(f.interests ?? []);
      setSkills(f.skills ?? []);
      setBloodTypes(f.bloodTypes ?? []);
      setDonationMin(f.donationTier?.minTotal !== undefined ? String(f.donationTier.minTotal) : '');
      setDonationMax(f.donationTier?.maxTotal !== undefined ? String(f.donationTier.maxTotal) : '');
      setLoading(false);
    })();
  }, [db, params.id, isNew, router, toast]);

  const filtersObj: SegmentFilters = useMemo(() => {
    const f: SegmentFilters = {};
    if (roles.length) f.roles = roles as SegmentFilters['roles'];
    if (cities.length) f.cities = cities;
    if (interests.length) f.interests = interests;
    if (skills.length) f.skills = skills;
    if (bloodTypes.length) f.bloodTypes = bloodTypes;
    const min = donationMin.trim() ? Number(donationMin) : undefined;
    const max = donationMax.trim() ? Number(donationMax) : undefined;
    if (min !== undefined || max !== undefined) {
      f.donationTier = {};
      if (min !== undefined) f.donationTier.minTotal = min;
      if (max !== undefined) f.donationTier.maxTotal = max;
    }
    return f;
  }, [roles, cities, interests, skills, bloodTypes, donationMin, donationMax]);

  const handleDryRun = async () => {
    setDryRunning(true);
    try {
      const result = await messagingFetch<DryRunResult>('/api/messaging/resolve-recipients', {
        method: 'POST',
        body: JSON.stringify({ channel: channel === 'both' ? 'sms' : channel, useCase, filters: filtersObj }),
      });
      setDryRun(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setDryRunning(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Eksik', description: 'İsim zorunlu' });
      return;
    }
    setSaving(true);
    try {
      const id = isNew
        ? `seg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        : params.id;
      await setDoc(
        doc(db, COLLECTIONS.recipientSegments, id),
        {
          name: name.trim(),
          description: description.trim(),
          channel,
          useCase,
          filters: filtersObj,
          estimatedSize: dryRun?.summary.afterConsent ?? null,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ?? 'unknown',
          ...(isNew ? { createdAt: serverTimestamp(), createdBy: user?.uid ?? 'unknown' } : {}),
        },
        { merge: true }
      );
      toast({ title: 'Kaydedildi' });
      if (isNew) router.replace(`/super-admin/messaging/segments/${id}/edit`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    if (!confirm('Segment silinsin mi?')) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.recipientSegments, params.id));
      router.push('/super-admin/messaging/segments');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/super-admin/messaging/segments" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Segmentler
        </Link>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Kaydet
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>İsim</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ör. İstanbul Aktif Gönüllüleri" />
          </div>
          <div>
            <Label>Açıklama</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kanal</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as 'sms' | 'email' | 'both')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">E-posta</SelectItem>
                  <SelectItem value="both">Her ikisi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kullanım amacı</Label>
              <Select value={useCase} onValueChange={(v) => setUseCase(v as typeof useCase)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactional">İşlemsel</SelectItem>
                  <SelectItem value="marketing">Pazarlama</SelectItem>
                  <SelectItem value="emergency">Acil durum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Roller</Label>
            <div className="flex gap-3 mt-1">
              {(['user', 'ngo-admin', 'super-admin'] as const).map((r) => (
                <label key={r} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={roles.includes(r)}
                    onCheckedChange={(c) => {
                      if (c) setRoles([...roles, r]);
                      else setRoles(roles.filter((x) => x !== r));
                    }}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <MultiPicker label="Şehir" options={allProvinces} values={cities} onChange={setCities} />
          <MultiPicker label="İlgi Alanları" options={allInterests} values={interests} onChange={setInterests} />
          <MultiPicker label="Yetenekler" options={allSkills} values={skills} onChange={setSkills} />
          <MultiPicker label="Kan Grubu" options={BLOOD_TYPES} values={bloodTypes} onChange={setBloodTypes} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Min. Toplam Bağış (TRY)</Label>
              <Input type="number" value={donationMin} onChange={(e) => setDonationMin(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Max. Toplam Bağış (TRY)</Label>
              <Input type="number" value={donationMax} onChange={(e) => setDonationMax(e.target.value)} placeholder="—" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">Tahmin</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handleDryRun} disabled={dryRunning}>
            {dryRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Yeniden Hesapla
          </Button>
        </CardHeader>
        <CardContent>
          {!dryRun ? (
            <p className="text-sm text-muted-foreground">"Yeniden Hesapla" ile alıcı sayısını öğren.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded bg-muted/40">
                  <p className="text-2xl font-bold">{dryRun.summary.fromFilters.toLocaleString('tr-TR')}</p>
                  <p className="text-xs text-muted-foreground">Filtreden</p>
                </div>
                <div className="p-3 rounded bg-muted/40">
                  <p className="text-2xl font-bold">{dryRun.summary.afterDedupe.toLocaleString('tr-TR')}</p>
                  <p className="text-xs text-muted-foreground">Dedupe sonrası</p>
                </div>
                <div className="p-3 rounded bg-muted/40">
                  <p className="text-2xl font-bold">{dryRun.summary.invalidAddress.toLocaleString('tr-TR')}</p>
                  <p className="text-xs text-muted-foreground">Geçersiz adres</p>
                </div>
                <div className="p-3 rounded bg-primary/10">
                  <p className="text-2xl font-bold text-primary">{dryRun.summary.afterConsent.toLocaleString('tr-TR')}</p>
                  <p className="text-xs text-muted-foreground">Final</p>
                </div>
              </div>
              {dryRun.sample.length > 0 && (
                <div>
                  <Label className="text-xs">Örnek alıcılar (ilk {dryRun.sample.length})</Label>
                  <ul className="mt-1 space-y-0.5 text-xs font-mono">
                    {dryRun.sample.map((r) => (
                      <li key={r.channelAddress} className="truncate">
                        {r.channelAddress} — {r.vars.tam_ad || '(isim yok)'}
                        {r.vars.sehir ? ` · ${r.vars.sehir}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
