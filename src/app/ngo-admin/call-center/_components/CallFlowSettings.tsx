'use client';

/**
 * CallFlowSettings — santral "Ayarlar" sekmesindeki ÇAĞRI AKIŞI paneli.
 *
 * Yönetici IVR / sıra / cevapsız-aksiyonu / çalışma saatlerini buradan açıp
 * kapatır, metin/ses/numara girer. Hepsi varsayılan KAPALI → santral normal
 * telefon gibi çalışır. Her bölüm bağımsız Switch ile açılır.
 *
 * API: GET/POST /api/ngo-admin/call-center/call-flow, ses: .../call-flow/audio
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Save, Plus, Trash2, Phone, Menu, Users, Voicemail, PhoneForwarded, Clock, Upload, CheckCircle2,
} from 'lucide-react';
import { defaultCallFlow, type CallFlow, type IvrOption } from '@/lib/santral/call-flow';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export function CallFlowSettings() {
  const { user } = useUser();
  const { withEntityHeaders } = useActiveEntity();
  const { toast } = useToast();
  const [cf, setCf] = useState<CallFlow>(defaultCallFlow());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/call-flow', withEntityHeaders({ headers: { authorization: `Bearer ${token}` } }));
      const data = await res.json();
      if (res.ok && data.callFlow) setCf(data.callFlow);
    } catch { /* varsayılan kalır */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/call-flow', withEntityHeaders({
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ callFlow: cf }),
      }));
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Kaydedilemedi.');
      if (data.callFlow) setCf(data.callFlow);
      toast({ title: 'Çağrı akışı kaydedildi', description: 'Değişiklikler birkaç dakika içinde aktif olur.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e instanceof Error ? e.message : 'Hata.' });
    } finally { setSaving(false); }
  };

  const uploadAudio = async (slot: 'greeting' | 'closed' | 'voicemail', file: File, apply: (url: string) => void) => {
    if (!user) return;
    setUploading(slot);
    try {
      const token = await user.getIdToken();
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slot', slot);
      const res = await fetch('/api/ngo-admin/call-center/call-flow/audio', withEntityHeaders({
        method: 'POST', headers: { authorization: `Bearer ${token}` }, body: fd,
      }));
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Yüklenemedi.');
      apply(data.url);
      toast({ title: 'Ses yüklendi', description: 'Kaydet’e basmayı unutma.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Ses yüklenemedi', description: e instanceof Error ? e.message : 'Hata.' });
    } finally { setUploading(null); }
  };

  // Yardımcı: derin alan güncelle
  const set = <K extends keyof CallFlow>(key: K, patch: Partial<CallFlow[K]>) =>
    setCf((p) => ({ ...p, [key]: { ...p[key], ...patch } }));

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const AudioRow = ({ slot, url, onUrl }: { slot: 'greeting' | 'closed' | 'voicemail'; url: string | null; onUrl: (u: string) => void }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <input ref={inputRef} type="file" accept="audio/wav,audio/mpeg,audio/mp3" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadAudio(slot, f, onUrl); }} />
        <Button type="button" variant="outline" size="sm" className="rounded-lg" disabled={uploading === slot} onClick={() => inputRef.current?.click()}>
          {uploading === slot ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
          Ses yükle (MP3/WAV)
        </Button>
        {url && <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> yüklü</span>}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-base">Çağrı Akışı</h2>
          <p className="text-xs text-muted-foreground">Aşağıdaki özellikler kapalıyken santral normal telefon gibi çalışır (arayan doğrudan paneli çaldırır). İstediğini aç, ayarla.</p>
        </div>
        <Button onClick={save} disabled={saving} className="rounded-xl min-h-[44px] shrink-0">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Kaydet
        </Button>
      </div>

      {/* 1) IVR */}
      <Card variant="glass" className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Menu className="h-4 w-4 text-primary" /> Sesli Karşılama (IVR)</CardTitle>
          <Switch checked={cf.ivr.enabled} onCheckedChange={(v) => set('ivr', { enabled: v })} />
        </CardHeader>
        {cf.ivr.enabled && (
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Karşılama metni</Label>
              <Textarea value={cf.ivr.greetingText} onChange={(e) => set('ivr', { greetingText: e.target.value })}
                placeholder="hangel'e hoş geldiniz. Kullanıcı ilişkileri için 1'e, bağış için 2'ye basın." rows={2} className="rounded-xl" />
            </div>
            <AudioRow slot="greeting" url={cf.ivr.greetingAudioUrl} onUrl={(u) => set('ivr', { greetingAudioUrl: u })} />
            <div className="space-y-2">
              <Label className="text-xs">Tuş seçenekleri</Label>
              {cf.ivr.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={opt.digit} onChange={(e) => { const o = [...cf.ivr.options]; o[i] = { ...o[i], digit: e.target.value.replace(/[^0-9]/g, '').slice(0, 1) }; set('ivr', { options: o }); }} placeholder="1" className="w-14 rounded-lg text-center" />
                  <Input value={opt.label} onChange={(e) => { const o = [...cf.ivr.options]; o[i] = { ...o[i], label: e.target.value }; set('ivr', { options: o }); }} placeholder="Kullanıcı İlişkileri" className="flex-1 rounded-lg" />
                  <Input value={opt.target} onChange={(e) => { const o = [...cf.ivr.options]; o[i] = { ...o[i], target: e.target.value }; set('ivr', { options: o }); }} placeholder="dahili (100)" className="w-28 rounded-lg" />
                  <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => set('ivr', { options: cf.ivr.options.filter((_, x) => x !== i) })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => set('ivr', { options: [...cf.ivr.options, { digit: '', label: '', target: '' } as IvrOption] })}><Plus className="h-4 w-4 mr-1.5" /> Seçenek ekle</Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 2) Sıra / çoklu temsilci */}
      <Card variant="glass" className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Çoklu Temsilci / Sıra</CardTitle>
          <Switch checked={cf.queue.enabled} onCheckedChange={(v) => set('queue', { enabled: v })} />
        </CardHeader>
        {cf.queue.enabled && (
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Çalacak dahililer (virgülle: 100,101,102)</Label>
              <Input value={cf.queue.members.join(',')} onChange={(e) => set('queue', { members: e.target.value.split(',').map((s) => s.trim().replace(/[^0-9]/g, '')).filter(Boolean) })} placeholder="100,101,102" className="rounded-xl" />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <Label className="text-xs">Çalma şekli</Label>
                <div className="flex gap-2 mt-1">
                  <Button type="button" size="sm" variant={cf.queue.strategy === 'ringall' ? 'default' : 'outline'} className="rounded-lg" onClick={() => set('queue', { strategy: 'ringall' })}>Hepsi aynı anda</Button>
                  <Button type="button" size="sm" variant={cf.queue.strategy === 'linear' ? 'default' : 'outline'} className="rounded-lg" onClick={() => set('queue', { strategy: 'linear' })}>Sırayla</Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Kaç saniye çalsın</Label>
                <Input type="number" value={cf.queue.ringSeconds} onChange={(e) => set('queue', { ringSeconds: Number(e.target.value) || 25 })} className="w-24 rounded-xl" />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 3) Cevapsız aksiyonu */}
      <Card variant="glass" className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Kimse cevaplamazsa</CardTitle>
          <CardDescription className="text-xs">Çağrı cevaplanmazsa ne olsun?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button type="button" size="sm" variant={cf.noAnswer.action === 'hangup' ? 'default' : 'outline'} className="rounded-lg" onClick={() => set('noAnswer', { action: 'hangup' })}>Kapat</Button>
            <Button type="button" size="sm" variant={cf.noAnswer.action === 'voicemail' ? 'default' : 'outline'} className="rounded-lg" onClick={() => set('noAnswer', { action: 'voicemail' })}><Voicemail className="h-4 w-4 mr-1.5" /> Sesli mesaj</Button>
            <Button type="button" size="sm" variant={cf.noAnswer.action === 'forward' ? 'default' : 'outline'} className="rounded-lg" onClick={() => set('noAnswer', { action: 'forward' })}><PhoneForwarded className="h-4 w-4 mr-1.5" /> Yönlendir</Button>
          </div>
          {cf.noAnswer.action === 'forward' && (
            <div>
              <Label className="text-xs">Yönlendirilecek numara</Label>
              <Input value={cf.noAnswer.forwardNumber || ''} onChange={(e) => set('noAnswer', { forwardNumber: e.target.value })} placeholder="05XX XXX XX XX" className="rounded-xl" />
            </div>
          )}
          {cf.noAnswer.action === 'voicemail' && (
            <div className="space-y-2">
              <Label className="text-xs">Sesli mesaj anonsu</Label>
              <Textarea value={cf.noAnswer.voicemailPrompt} onChange={(e) => set('noAnswer', { voicemailPrompt: e.target.value })} rows={2} className="rounded-xl" />
              <AudioRow slot="voicemail" url={cf.noAnswer.voicemailAudioUrl} onUrl={(u) => set('noAnswer', { voicemailAudioUrl: u })} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4) Çalışma saatleri */}
      <Card variant="glass" className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Çalışma Saatleri</CardTitle>
          <Switch checked={cf.workingHours.enabled} onCheckedChange={(v) => set('workingHours', { enabled: v })} />
        </CardHeader>
        {cf.workingHours.enabled && (
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              {cf.workingHours.days.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-20 text-xs">{DAYS[i]}</span>
                  <Switch checked={d.open} onCheckedChange={(v) => { const days = [...cf.workingHours.days]; days[i] = { ...days[i], open: v }; set('workingHours', { days }); }} />
                  {d.open ? (
                    <>
                      <Input type="time" value={d.from} onChange={(e) => { const days = [...cf.workingHours.days]; days[i] = { ...days[i], from: e.target.value }; set('workingHours', { days }); }} className="w-28 rounded-lg" />
                      <span className="text-xs text-muted-foreground">–</span>
                      <Input type="time" value={d.to} onChange={(e) => { const days = [...cf.workingHours.days]; days[i] = { ...days[i], to: e.target.value }; set('workingHours', { days }); }} className="w-28 rounded-lg" />
                    </>
                  ) : <span className="text-xs text-muted-foreground">Kapalı</span>}
                </div>
              ))}
            </div>
            <div>
              <Label className="text-xs">Mesai dışı anonsu</Label>
              <Textarea value={cf.workingHours.closedPrompt} onChange={(e) => set('workingHours', { closedPrompt: e.target.value })} rows={2} className="rounded-xl" />
              <div className="mt-2"><AudioRow slot="closed" url={cf.workingHours.closedAudioUrl} onUrl={(u) => set('workingHours', { closedAudioUrl: u })} /></div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="rounded-xl min-h-[44px]">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Kaydet
        </Button>
      </div>
    </div>
  );
}
