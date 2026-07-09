'use client';

/**
 * /super-admin/messaging/workspace-mail — hangel platform Workspace toplu mail.
 *
 * hangel kendi Google Workspace adresinden, outreach datasına (GSB müdürlükleri,
 * dernekler, vakıflar...) ya da yüklenen listeye, dakikada 1 mail hızında toplu
 * e-posta gönderir. Per-STK mail özelliğinin platform sürümü; /api/super-admin/mail/*.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { allProvinces } from '@/lib/data';
import { ArrowLeft, Loader2, Link2, Send, CheckCircle2, Users, X, Database, Lock } from 'lucide-react';

interface Connection { configured: boolean; connected: boolean; fromEmail?: string; signature?: string }
interface FacetType { type: string; total: number; withEmail: number }

// Ham tür kodları → okunabilir etiket.
const TYPE_LABELS: Record<string, string> = {
  'GençlikSporMüdürlüğü': 'GSB İl Müdürlükleri',
  'GencSporMudurlugu': 'GSB İl Müdürlükleri (eski)',
  'GencSporIlceMudurlugu': 'GSB İlçe Müdürlükleri',
  'SivilToplumMüdürlüğü': 'Sivil Toplum Müdürlükleri',
  'SporKulübü': 'Spor Kulüpleri',
  'Federasyon': 'Federasyonlar',
  'MailHizmet': 'Mail Hizmet',
};
const typeLabel = (t: string) => TYPE_LABELS[t] ?? t;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  return Array.from(new Set(raw.split(/[\n,;\s]+/).map((s) => s.trim()).filter((s) => EMAIL_RE.test(s))));
}

export default function PlatformWorkspaceMailPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();

  const [conn, setConn] = useState<Connection | null>(null);

  // Bağlama formu
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('hangel');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Gönderim
  const [source, setSource] = useState<'outreach' | 'vakif' | 'dernek' | 'inline'>('outreach');
  const [facetTypes, setFacetTypes] = useState<FacetType[]>([]);
  const [filterType, setFilterType] = useState('GençlikSporMüdürlüğü');
  const [filterCity, setFilterCity] = useState('');
  const [list, setList] = useState<string[]>([]);
  // "Yüklenen Liste" KALICI: localStorage'da tutulur — kullanıcı 'Temizle'/× ile
  // silmedikçe sayfa yenilense/kapansa da kalır. İlk mount yazımı atlanır ki
  // localStorage'daki değer boş [] ile ezilmesin.
  const firstListPersistRef = useRef(true);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ws-mail-uploaded-list');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setList(parsed.filter((x) => typeof x === 'string'));
      }
    } catch { /* yoksay */ }
  }, []);
  useEffect(() => {
    if (firstListPersistRef.current) { firstListPersistRef.current = false; return; }
    try { localStorage.setItem('ws-mail-uploaded-list', JSON.stringify(list)); } catch { /* yoksay */ }
  }, [list]);
  const [paste, setPaste] = useState('');
  const [single, setSingle] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [preview, setPreview] = useState<{ count: number; capped: boolean } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  // İmza
  const [sigText, setSigText] = useState('');
  const [sigEditing, setSigEditing] = useState(false);
  const [sigSaving, setSigSaving] = useState(false);

  const token = useCallback(async () => (user ? user.getIdToken() : ''), [user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/super-admin/mail/connection', { headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
      if (!res.ok) return;
      const data = (await res.json()) as Connection;
      setConn(data);
      if (typeof data.signature === 'string' && data.signature) setSigText(data.signature);
    } catch { /* sessiz */ }
  }, [user]);

  const defaultSig = ['hangel', 'hangel.org'].join('\n');
  const startEditSig = () => { if (!sigText.trim()) setSigText(defaultSig); setSigEditing(true); };
  const saveSig = async () => {
    setSigSaving(true);
    try {
      const res = await fetch('/api/super-admin/mail/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ signature: sigText }),
      });
      if (!res.ok) { toast({ variant: 'destructive', title: 'İmza kaydedilemedi' }); return; }
      toast({ title: 'İmza kaydedildi' });
      setSigEditing(false);
    } catch { toast({ variant: 'destructive', title: 'Bağlantı hatası' }); }
    finally { setSigSaving(false); }
  };

  useEffect(() => { void refresh(); }, [refresh]);

  // Outreach tür dağılımını (e-posta sayılı) yükle → tür dropdown.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/super-admin/mail/outreach-facets', { headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const types = (data.types ?? []) as FacetType[];
        setFacetTypes(types);
        if (types.length) setFilterType((cur) => (types.find((t) => t.type === cur) ? cur : types[0].type));
      } catch { /* sessiz */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromEmail.trim() || !smtpHost.trim() || !smtpPassword.trim()) {
      toast({ variant: 'destructive', title: 'Tüm bağlantı alanlarını doldurun' });
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch('/api/super-admin/mail/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ fromEmail: fromEmail.trim(), fromName: fromName.trim() || 'hangel', smtpHost: smtpHost.trim(), smtpPort: Number(smtpPort) || 587, smtpPassword }),
      });
      if (!res.ok) { toast({ variant: 'destructive', title: 'Bağlanamadı', description: 'Bilgileri kontrol edin.' }); return; }
      setSmtpPassword('');
      await refresh();
      toast({ title: 'hangel Workspace bağlandı' });
    } catch { toast({ variant: 'destructive', title: 'Bağlantı hatası' }); }
    finally { setConnecting(false); }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch('/api/super-admin/mail/disconnect', { method: 'POST', headers: { Authorization: `Bearer ${await token()}` } });
      await refresh();
      toast({ title: 'Bağlantı kaldırıldı' });
    } catch { toast({ variant: 'destructive', title: 'Bağlantı hatası' }); }
    finally { setDisconnecting(false); }
  };

  // ── liste yönetimi ──
  const addEmails = (raw: string): number => {
    const e = parseEmails(raw);
    if (e.length === 0) return 0;
    setList((prev) => Array.from(new Set([...prev, ...e])));
    return e.length;
  };
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try {
      const n = addEmails(await f.text());
      if (n) toast({ title: `${n} e-posta işlendi` });
      else toast({ variant: 'destructive', title: 'Geçerli e-posta yok' });
    } catch { toast({ variant: 'destructive', title: 'Dosya okunamadı' }); }
  };
  const removeOne = (em: string) => setList((p) => p.filter((x) => x !== em));

  const buildSourcePayload = () =>
    source === 'inline'
      ? { source: 'inline' as const, inlineRecipients: list.map((email) => ({ email })) }
      : source === 'vakif'
        ? { source: 'vakif' as const, filter: { city: filterCity.trim() || undefined } }
        : source === 'dernek'
          ? { source: 'dernek' as const, filter: { city: filterCity.trim() || undefined } }
          : { source: 'outreach' as const, filter: { type: filterType || undefined, city: filterCity.trim() || undefined } };

  const doPreview = async () => {
    if (source === 'inline' && list.length === 0) { toast({ variant: 'destructive', title: 'Liste boş' }); return; }
    setPreviewing(true); setPreview(null);
    try {
      const res = await fetch('/api/super-admin/mail/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ ...buildSourcePayload(), dryRun: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast({ variant: 'destructive', title: 'Önizleme başarısız', description: typeof data?.message === 'string' ? data.message : undefined }); return; }
      setPreview({ count: data.count ?? 0, capped: !!data.capped });
    } catch { toast({ variant: 'destructive', title: 'Bağlantı hatası' }); }
    finally { setPreviewing(false); }
  };

  const doSend = async () => {
    if (!subject.trim()) { toast({ variant: 'destructive', title: 'Konu boş olamaz' }); return; }
    if (!messageBody.trim()) { toast({ variant: 'destructive', title: 'Mesaj boş olamaz' }); return; }
    if (source === 'inline' && list.length === 0) { toast({ variant: 'destructive', title: 'Liste boş' }); return; }
    setSending(true);
    try {
      const res = await fetch('/api/super-admin/mail/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ ...buildSourcePayload(), subject: subject.trim(), body: messageBody.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) toast({ variant: 'destructive', title: 'hangel Workspace bağlı değil' });
        else toast({ variant: 'destructive', title: 'Gönderim başarısız', description: typeof data?.message === 'string' ? data.message : undefined });
        return;
      }
      toast({ title: 'Toplu mail kuyruğa alındı 🧡', description: `${data.queued ?? 0} alıcı — dakikada 1 mail gider.${data.capped ? ' (üst sınır uygulandı)' : ''} Canlı izleme açılıyor…` });
      setSubject(''); setMessageBody(''); setPreview(null);
      // Kampanya CANLI izleme sayfasına götür: kuyruktaki/gönderilen/başarısız
      // sayıları + alıcı listesi Firestore listener ile anlık akar.
      if (data.campaignId) router.push(`/super-admin/messaging/campaigns/${data.campaignId}`);
    } catch { toast({ variant: 'destructive', title: 'Bağlantı hatası' }); }
    finally { setSending(false); }
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Link href="/super-admin/messaging" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-6 w-6" /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold font-headline">Workspace Toplu Mail</h1>
          <p className="text-sm text-muted-foreground">hangel kendi Workspace adresinden outreach datasına toplu mail gönderir (dakikada 1).</p>
        </div>
        {/* Kuyruk/gönderim CANLI izleme — kampanya listesi (anlık Firestore). */}
        <Button asChild variant="outline" size="sm" className="shrink-0 rounded-xl">
          <Link href="/super-admin/messaging/campaigns">Kampanyaları İzle</Link>
        </Button>
      </div>

      {conn && conn.configured === false && (
        <Card className="border-muted bg-muted/30">
          <CardContent className="flex items-start gap-3 p-4">
            <Lock className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Mail altyapısı yapılandırılıyor — çok yakında.</p>
          </CardContent>
        </Card>
      )}

      {conn?.configured && !conn.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" /> hangel Workspace Hesabını Bağla</CardTitle>
            <CardDescription>hangel&apos;in Google Workspace adresinden gönderim. Şifre olarak Google App Password kullanın.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleConnect}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Gönderen E-posta</Label>
                  <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="ismailhilmi@hangel.org" type="email" />
                  <p className="text-xs text-muted-foreground">hangel Workspace adresi — mailler bundan gider.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Görünen Ad</Label>
                  <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="hangel" />
                </div>
                <div className="space-y-1.5">
                  <Label>SMTP Sunucu</Label>
                  <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>SMTP Port</Label>
                  <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" inputMode="numeric" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>App Password</Label>
                  <Input value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="16 haneli Google App Password" type="password" autoComplete="new-password" />
                  <p className="text-xs text-muted-foreground">
                    2 Adımlı Doğrulama açıkken{' '}
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">myaccount.google.com/apppasswords</a>{' '}
                    adresinden üretin.
                  </p>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={connecting}>
                {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />} Bağla
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {conn?.connected && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Alıcı Kaynağı</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> {conn.fromEmail}</span>
                  <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={disconnecting}>{disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bağlantıyı Kaldır'}</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 rounded-xl bg-muted/60 p-1">
                <button type="button" onClick={() => { if (source === 'inline') setSource('outreach'); setPreview(null); }} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${source !== 'inline' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>Veritabanı</button>
                <button type="button" onClick={() => { setSource('inline'); setPreview(null); }} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${source === 'inline' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>Yüklenen Liste</button>
              </div>

              {source !== 'inline' ? (
                <div className="space-y-2">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Tür</Label>
                      {/* Outreach türleri + Vakıflar + Dernekler tek dropdown'da. Seçim source'u belirler. */}
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={source === 'vakif' ? '__vakif__' : source === 'dernek' ? '__dernek__' : filterType}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPreview(null);
                          if (v === '__vakif__') setSource('vakif');
                          else if (v === '__dernek__') setSource('dernek');
                          else { setSource('outreach'); setFilterType(v); }
                        }}
                      >
                        {facetTypes.length === 0 && source === 'outreach' ? (
                          <option value={filterType}>{typeLabel(filterType)}</option>
                        ) : (
                          facetTypes.map((t) => <option key={t.type} value={t.type}>{typeLabel(t.type)} ({t.withEmail} e-postalı)</option>)
                        )}
                        <option value="__vakif__">Vakıflar (vakıf veritabanı)</option>
                        <option value="__dernek__">Dernekler (dernek kütüğü)</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        {source === 'vakif'
                          ? 'Vakıf kayıt veritabanından (~6.700 vakıf) e-postası olanlara gönderilir.'
                          : source === 'dernek'
                            ? 'Resmi dernek kütüğünden e-postası olan kayıtlara gönderilir.'
                            : 'Yalnız e-postası olan kayıtlar listelenir (boş türler görünmez).'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Şehir (opsiyonel)</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={filterCity} onChange={(e) => { setFilterCity(e.target.value); setPreview(null); }}>
                        <option value="">Tümü</option>
                        {allProvinces.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  {source === 'dernek' && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                      ⚠️ Resmi dernek kütüğünde (100.967 kayıt) e-posta adresi yok denecek kadar az. &quot;Kaç alıcı?&quot; çoğunlukla 0 döner — derneklere mail için web sitelerinden e-posta toplamak gerekir.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Dosyadan yükle (CSV / TXT)</Label>
                      <Input type="file" accept=".csv,.txt" onChange={handleFile} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tek e-posta ekle</Label>
                      <div className="flex gap-2">
                        <Input value={single} onChange={(e) => setSingle(e.target.value)} placeholder="ornek@eposta.com" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (addEmails(single)) setSingle(''); } }} />
                        <Button type="button" variant="outline" onClick={() => { if (addEmails(single)) setSingle(''); }}>Ekle</Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Veya yapıştır</Label>
                    <Textarea rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="ornek@eposta.com, ornek2@eposta.com..." />
                    <Button type="button" variant="outline" size="sm" onClick={() => { const n = addEmails(paste); if (n) { setPaste(''); toast({ title: `${n} e-posta işlendi` }); } }}>Listeye Ekle</Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Yüklenen alıcılar <span className="font-normal text-muted-foreground">({list.length})</span></Label>
                      {list.length > 0 && <Button type="button" variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => setList([])}>Temizle</Button>}
                    </div>
                    {list.length === 0 ? (
                      <p className="rounded-lg border border-dashed py-3 text-center text-xs text-muted-foreground">Henüz alıcı eklenmedi.</p>
                    ) : (
                      <div className="max-h-48 divide-y overflow-y-auto rounded-lg border">
                        {list.map((em) => (
                          <div key={em} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                            <span className="truncate">{em}</span>
                            <button type="button" onClick={() => removeOne(em)} aria-label="Çıkar" className="shrink-0 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={doPreview} disabled={previewing}>
                  {previewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />} Kaç alıcı?
                </Button>
                {preview && <span className="text-sm font-medium">{preview.count} alıcı{preview.capped ? ` (üst sınır ${5000})` : ''}</span>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Mesaj & Gönder</CardTitle>
              <CardDescription>Her maile KVKK &quot;çıkar&quot; bağlantısı otomatik eklenir. Gönderim hızı dakikada 1 maildir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Konu</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="E-posta konusu" />
              </div>
              <div className="space-y-1.5">
                <Label>Mesaj</Label>
                <Textarea rows={8} value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Mesajınızı yazın..." />
              </div>
              <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Mail İmzası</Label>
                  {!sigEditing ? (
                    <Button type="button" variant="outline" size="sm" onClick={startEditSig}>İmzanı Düzenle</Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSigEditing(false)}>İptal</Button>
                      <Button type="button" size="sm" onClick={saveSig} disabled={sigSaving}>{sigSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kaydet'}</Button>
                    </div>
                  )}
                </div>
                {sigEditing ? (
                  <Textarea rows={4} value={sigText} onChange={(e) => setSigText(e.target.value)} placeholder="hangel, web sitesi, iletişim..." />
                ) : (
                  <p className="whitespace-pre-line text-xs text-muted-foreground">{sigText || defaultSig}</p>
                )}
                <p className="text-[11px] text-muted-foreground">İmza her mailin altına eklenir. En alta otomatik &quot;Listeden çıkmak istiyorum&quot; satırı konur.</p>
              </div>
              <Button className="w-full" onClick={doSend} disabled={sending}>
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Workspace Toplu Mail Gönder
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
