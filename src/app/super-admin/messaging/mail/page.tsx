'use client';

/**
 * Kolay Mail Gönder — TEK SAYFA sihirbaz (/super-admin/messaging/mail).
 *
 * Eski akış: Segment → Şablon → 4 adımlı kampanya → detay sayfasında elle
 * "otomatik gönder" + sekme açık tutma (5 ekran, ~7 tıklama). Yeni akış:
 *   1) KİME  — hazır kitle kartları + canlı "X izinli alıcı" sayacı
 *   2) NE    — konu + zengin gövde + {ad} değişkenli canlı önizleme
 *   3) GÖNDER— kendine test maili → onayla → sunucu otomatik gönderir
 *
 * Backend: mevcut kampanya motoru (POST /api/messaging/campaigns). Gönderim,
 * dakikada bir çalışan Cloud Function worker'ı ile SUNUCUDA sürer — sekme
 * açık kalması GEREKMEZ. İzin (KVKK) süzgeci useCase:'marketing' ile otomatik;
 * çıkış (unsubscribe) linki worker tarafından her maile eklenir.
 *
 * MALİYET: alıcı sayacı (resolve-recipients) tüm users koleksiyonunu tarar —
 * bu yüzden yalnız kitle DEĞİŞİNCE, debounce'lu ve oturum içi cache'li çağrılır.
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Mail, Users, Building2, MapPin, ClipboardList, Send, Loader2,
  CheckCircle2, ArrowLeft, Clock, FlaskConical, X, AlertTriangle,
  FileText, Save, MousePointerClick, Eye as EyeIcon, Inbox,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, setDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { messagingFetch } from '@/lib/messaging/client';
import { render, extractVariables } from '@/lib/messaging/template';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { allProvinces } from '@/lib/data';

/* ── Kitle tanımları ─────────────────────────────────────────────────────── */

type AudienceKey = 'all' | 'ngoAdmins' | 'city' | 'manual';

const AUDIENCES: Array<{ key: AudienceKey; label: string; desc: string; icon: React.ElementType }> = [
  { key: 'all', label: 'Tüm kullanıcılar', desc: 'Platformdaki izinli tüm üyeler', icon: Users },
  { key: 'ngoAdmins', label: 'STK yöneticileri', desc: 'Kurum yöneticisi hesaplar', icon: Building2 },
  { key: 'city', label: 'Şehre göre', desc: 'Seçtiğin illerdeki kullanıcılar', icon: MapPin },
  { key: 'manual', label: 'E-posta listesi', desc: 'Adresleri yapıştır (dış liste)', icon: ClipboardList },
];

// Önizleme/test için örnek kişiselleştirme değerleri (resolver user + ngo vars adları).
const SAMPLE_VARS: Record<string, string> = {
  ad: 'Ayşe', tam_ad: 'Ayşe Yılmaz', kullanici: 'ayse',
  sehir: 'İstanbul', ilce: 'Kadıköy', meslek: 'Öğretmen',
  // STK yöneticisi değişkenleri (örnek):
  stk_adi: 'Uluslararası Sosyal Fayda Derneği',
  kutuk_no: '34-262-102',
  stk_turu: 'Dernek',
  stk_sehir: 'İstanbul',
  sayin_yonetici: 'Sayın Uluslararası Sosyal Fayda Derneği yöneticisi Ayşe Yılmaz',
};

// İmleç konumuna tek tıkla eklenen değişken butonları (RichTextEditor'a geçirilir).
const VARIABLE_BUTTONS: { token: string; label: string }[] = [
  // Kişisel
  { token: 'ad', label: 'Ad' },
  { token: 'tam_ad', label: 'Tam ad' },
  { token: 'sehir', label: 'Şehir' },
  { token: 'ilce', label: 'İlçe' },
  { token: 'meslek', label: 'Meslek' },
  // STK bilgileri
  { token: 'stk_adi', label: 'STK adı' },
  { token: 'kutuk_no', label: 'Kütük no' },
  { token: 'stk_turu', label: 'STK türü' },
  { token: 'stk_sehir', label: 'STK şehri' },
  // Hazır ünvan cümlesi
  { token: 'sayin_yonetici', label: 'Sayın … yöneticisi …' },
];

function parseEmails(text: string): string[] {
  const out = new Set<string>();
  for (const tok of text.split(/[\s,;<>"']+/)) {
    const t = tok.trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) out.add(t);
  }
  return [...out];
}

// HTML gövdede görünür metin var mı (boş <p></p> engeli).
function hasVisibleText(html: string): boolean {
  return html.replace(/<[^>]*>/g, '').trim().length > 0;
}

interface ResolveSummary {
  afterConsent: number;
  afterDedupe: number;
  invalidAddress: number;
}

interface CampaignDocLite {
  status?: string;
  stats?: { queued?: number; sent?: number; delivered?: number; failed?: number };
  recipients?: { afterConsentFilter?: number; totalUnique?: number };
  schedule?: { mode?: string };
}

interface TemplateRow {
  id: string;
  name?: string;
  channel?: string;
  subject?: string;
  body?: string;
  active?: boolean;
}

type TSLike = { toDate?: () => Date } | null | undefined;

interface RecipientRow {
  id: string;
  channelAddress?: string;
  status?: string;
  sentAt?: TSLike;
  deliveredAt?: TSLike;
  openedAt?: TSLike;
  clickedAt?: TSLike;
  clickedLink?: string;
}

function fmtTs(v: TSLike): string {
  const d = v?.toDate?.();
  return d ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
}

// Alıcının ulaştığı EN İLERİ aşama: Gönderildi → İletildi → Açıldı → Link tıklandı.
function recipientStage(r: RecipientRow): { label: string; cls: string; icon: React.ElementType; at: TSLike } {
  if (r.clickedAt) return { label: 'Link tıklandı', cls: 'bg-primary/10 text-primary', icon: MousePointerClick, at: r.clickedAt };
  if (r.openedAt) return { label: 'Açıldı', cls: 'bg-emerald-100 text-emerald-700', icon: EyeIcon, at: r.openedAt };
  if (r.deliveredAt) return { label: 'İletildi', cls: 'bg-blue-100 text-blue-700', icon: Inbox, at: r.deliveredAt };
  if (r.status === 'failed') return { label: 'Başarısız', cls: 'bg-red-100 text-red-700', icon: AlertTriangle, at: r.sentAt };
  return { label: 'Gönderildi', cls: 'bg-muted text-muted-foreground', icon: Send, at: r.sentAt };
}

/* ── Sayfa ───────────────────────────────────────────────────────────────── */

export default function EasyMailPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  // 1) Kime
  const [audience, setAudience] = useState<AudienceKey>('all');
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [manualText, setManualText] = useState('');
  const manualEmails = useMemo(() => parseEmails(manualText), [manualText]);

  // Alıcı sayacı (users tabanlı kitleler) — cache + debounce (maliyet!)
  const [counting, setCounting] = useState(false);
  const [summary, setSummary] = useState<ResolveSummary | null>(null);
  const [countError, setCountError] = useState('');
  const cacheRef = useRef<Map<string, ResolveSummary>>(new Map());

  // 2) Ne
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [fromName, setFromName] = useState('hangel');
  // Platform toplu mail'i, bağlı Google Workspace SMTP hesabından (mailAccounts/__platform)
  // gider; gönderen adres worker tarafından o hesaptan zorlanır — burada yalnız
  // önizleme/etiket için tutulur (sabit, değiştirilemez).
  const fromEmail = 'ismailhilmi@hangel.org';

  // Şablonlar — mevcut messageTemplates koleksiyonu (yalnız email + aktif olanlar).
  const tplQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.messageTemplates), orderBy('updatedAt', 'desc'), limit(50)) : null),
    [db],
  );
  const { data: tplRows } = useCollection<TemplateRow>(tplQuery);
  const emailTemplates = useMemo(
    () => (tplRows ?? []).filter((t) => t.channel === 'email' && t.active !== false),
    [tplRows],
  );
  const [selectedTplId, setSelectedTplId] = useState('');
  const [tplSaveOpen, setTplSaveOpen] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplSaving, setTplSaving] = useState(false);

  const applyTemplate = (id: string) => {
    setSelectedTplId(id);
    const t = emailTemplates.find((x) => x.id === id);
    if (!t) return;
    setSubject(t.subject ?? '');
    setBodyHtml(t.body ?? '');
    toast({ title: 'Şablon yüklendi', description: t.name || 'Şablon içeriği dolduruldu — düzenleyebilirsin.' });
  };

  const saveAsTemplate = async () => {
    if (!db) return;
    const name = tplName.trim() || subject.trim();
    if (!name) { toast({ variant: 'destructive', title: 'İsim gerekli', description: 'Şablona bir ad ver.' }); return; }
    setTplSaving(true);
    try {
      const id = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await setDoc(doc(db, COLLECTIONS.messageTemplates, id), {
        name,
        channel: 'email',
        useCase: 'marketing',
        language: 'tr',
        active: true,
        subject: subject.trim(),
        body: bodyHtml,
        variables: extractVariables(`${subject} ${bodyHtml}`),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setTplSaveOpen(false);
      setTplName('');
      toast({ title: 'Şablon kaydedildi 🧡', description: `"${name}" — bir dahaki gönderimde seçebilirsin.` });
    } catch {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: 'Şablon kaydedilirken hata oluştu.' });
    } finally {
      setTplSaving(false);
    }
  };

  // 3) Gönder
  const [testTo, setTestTo] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sentCampaignId, setSentCampaignId] = useState<string | null>(null);
  const [sentScheduled, setSentScheduled] = useState(false);

  useEffect(() => { if (user?.email && !testTo) setTestTo(user.email); }, [user?.email, testTo]);

  // Kitle → RecipientSourceSpec (users tabanlıysa filters, elle listeyse inline).
  const spec = useMemo(() => {
    const base = { channel: 'email' as const, useCase: 'marketing' as const };
    if (audience === 'all') return { ...base, filters: {} };
    if (audience === 'ngoAdmins') return { ...base, filters: { roles: ['ngo-admin' as const] } };
    if (audience === 'city') return cities.length > 0 ? { ...base, filters: { cities } } : null;
    // manual
    return manualEmails.length > 0
      ? { ...base, inlineRecipients: manualEmails.map((email) => ({ email })) }
      : null;
  }, [audience, cities, manualEmails]);

  const isUsersAudience = audience !== 'manual';

  // Canlı sayaç — yalnız users tabanlı kitlelerde ve kitle değişince (debounce + cache).
  useEffect(() => {
    if (!isUsersAudience || !spec || !('filters' in spec)) { setSummary(null); setCountError(''); return; }
    const key = JSON.stringify(spec.filters);
    const cached = cacheRef.current.get(key);
    if (cached) { setSummary(cached); setCountError(''); return; }
    setSummary(null);
    setCountError('');
    setCounting(true);
    const t = setTimeout(async () => {
      try {
        const res = await messagingFetch<{ summary: ResolveSummary }>(
          '/api/messaging/resolve-recipients',
          { method: 'POST', body: JSON.stringify(spec) },
        );
        cacheRef.current.set(key, res.summary);
        setSummary(res.summary);
      } catch (e) {
        setCountError(e instanceof Error ? e.message : 'Alıcı sayısı hesaplanamadı');
      } finally {
        setCounting(false);
      }
    }, 700);
    return () => { clearTimeout(t); setCounting(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUsersAudience, JSON.stringify(spec)]);

  const recipientCount = isUsersAudience ? (summary?.afterConsent ?? null) : manualEmails.length;

  // Önizleme (örnek değerlerle) — sanitize edilmiş HTML.
  const previewSubject = render(subject || 'Konu…', SAMPLE_VARS);
  const previewBody = useMemo(
    () => sanitizeHtml(render(bodyHtml || '<p><em>Mesajını yazmaya başla…</em></p>', SAMPLE_VARS)),
    [bodyHtml],
  );
  const usedVariables = useMemo(() => extractVariables(`${subject} ${bodyHtml}`), [subject, bodyHtml]);

  const contentReady = subject.trim().length > 0 && hasVisibleText(bodyHtml);
  const audienceReady = spec !== null && (isUsersAudience ? recipientCount !== null : manualEmails.length > 0);
  const needsTypeConfirm = (recipientCount ?? 0) >= 1000;

  // Eksikler — butonları SESSİZCE kilitleme yerine ne eksikse açıkça göster/söyle.
  const missingItems = useMemo(() => {
    const items: string[] = [];
    if (!subject.trim()) items.push('Konu boş');
    if (!hasVisibleText(bodyHtml)) items.push('Mesaj gövdesi boş');
    if (audience === 'city' && cities.length === 0) items.push('En az bir şehir ekle');
    if (audience === 'manual' && manualEmails.length === 0) items.push('En az bir e-posta adresi ekle');
    if (isUsersAudience && counting) items.push('Alıcı sayısı hesaplanıyor…');
    if (isUsersAudience && !counting && countError) items.push('Alıcı sayısı alınamadı — kitleyi yeniden seç');
    if (scheduleMode === 'later' && !scheduledAt) items.push('Gönderim zamanı seç');
    return items;
  }, [subject, bodyHtml, audience, cities.length, manualEmails.length, isUsersAudience, counting, countError, scheduleMode, scheduledAt]);

  // Tıklamada eksikleri toast'la — buton hiçbir zaman "sessiz ölü" olmasın.
  const tryOpenConfirm = () => {
    if (missingItems.length > 0) {
      toast({ variant: 'destructive', title: 'Eksik var', description: missingItems[0] });
      return;
    }
    setConfirmInput('');
    setConfirmOpen(true);
  };

  const addCity = useCallback(() => {
    const c = cityInput.trim();
    if (!c) return;
    const match = allProvinces.find((p) => p.toLocaleLowerCase('tr') === c.toLocaleLowerCase('tr'));
    if (!match) { toast({ variant: 'destructive', title: 'Şehir bulunamadı', description: 'Listeden geçerli bir il seç.' }); return; }
    if (!cities.includes(match)) setCities((prev) => [...prev, match]);
    setCityInput('');
  }, [cityInput, cities, toast]);

  const sendTest = async () => {
    if (!testTo.trim()) { toast({ variant: 'destructive', title: 'Test adresi boş', description: 'Test mailinin gideceği e-posta adresini yaz.' }); return; }
    if (!subject.trim()) { toast({ variant: 'destructive', title: 'Konu boş', description: '2. adımda maile bir konu yaz.' }); return; }
    if (!hasVisibleText(bodyHtml)) { toast({ variant: 'destructive', title: 'Mesaj boş', description: '2. adımda mesaj gövdesini yaz.' }); return; }
    setTestSending(true);
    try {
      await messagingFetch('/api/super-admin/messaging/test-email', {
        method: 'POST',
        body: JSON.stringify({ to: testTo, subject, body: bodyHtml, fromEmail, fromName }),
      });
      toast({ title: 'Test maili gönderildi 📬', description: `${testTo} adresini kontrol et.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Test gönderilemedi', description: e instanceof Error ? e.message : 'Hata' });
    } finally {
      setTestSending(false);
    }
  };

  const doSend = async () => {
    if (!spec) return;
    if (scheduleMode === 'later' && new Date(scheduledAt).getTime() <= Date.now()) {
      toast({ variant: 'destructive', title: 'Geçmiş tarih', description: 'Gönderim zamanı ileride olmalı.' });
      return;
    }
    setSending(true);
    try {
      const payload = {
        name: `Mail — ${subject.trim().slice(0, 60)}`,
        channel: 'email',
        useCase: 'marketing',
        subject: subject.trim(),
        body: bodyHtml,
        senderId: 'hangel',
        fromEmail,
        fromName,
        // Platform toplu mail'i Resend yerine bağlı Workspace SMTP'den gönder.
        // Worker, ngoId='__platform' için mailAccounts/__platform hesabını kullanır.
        mailWorkspace: true,
        ngoId: '__platform',
        spec,
        scheduledAt: scheduleMode === 'later' ? new Date(scheduledAt).toISOString() : null,
        ...(needsTypeConfirm && recipientCount ? { doubleConfirmCount: recipientCount } : {}),
      };
      const res = await messagingFetch<{ campaignId: string; status: string }>(
        '/api/messaging/campaigns',
        { method: 'POST', body: JSON.stringify(payload) },
      );
      setSentCampaignId(res.campaignId);
      setSentScheduled(res.status === 'scheduled');
      setConfirmOpen(false);
      toast({
        title: res.status === 'scheduled' ? 'Mail zamanlandı 🕐' : 'Gönderim başladı 🧡',
        description: res.status === 'scheduled'
          ? 'Zamanı gelince sunucu otomatik gönderecek.'
          : 'Sunucu arka planda gönderiyor — bu sayfayı kapatabilirsin.',
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: e instanceof Error ? e.message : 'Hata' });
    } finally {
      setSending(false);
    }
  };

  const resetAll = () => {
    setSentCampaignId(null);
    setSentScheduled(false);
    setSubject('');
    setBodyHtml('');
    setManualText('');
    setConfirmInput('');
    setScheduleMode('now');
    setScheduledAt('');
  };

  /* ── Gönderim sonrası canlı ilerleme ──────────────────────────────────── */
  const campRef = useMemoFirebase(
    () => (db && sentCampaignId ? doc(db, COLLECTIONS.campaigns, sentCampaignId) : null),
    [db, sentCampaignId],
  );
  const { data: camp } = useDoc<CampaignDocLite>(campRef);

  // Anlık gönderim akışı: gönderilen alıcılar SIRAYLA (en yeni üstte). orderBy(sentAt)
  // henüz gönderilmemişleri doğal olarak dışarıda bırakır; Resend webhook'ları
  // iletildi/açıldı/tıklandı alanlarını yazdıkça satır durumu CANLI güncellenir.
  const feedQuery = useMemoFirebase(
    () =>
      db && sentCampaignId
        ? query(
            collection(db, COLLECTIONS.campaigns, sentCampaignId, 'recipients'),
            orderBy('sentAt', 'desc'),
            limit(30),
          )
        : null,
    [db, sentCampaignId],
  );
  const { data: feedRows } = useCollection<RecipientRow>(feedQuery);

  if (sentCampaignId) {
    const stats = camp?.stats ?? {};
    const total = camp?.recipients?.afterConsentFilter ?? camp?.recipients?.totalUnique
      ?? (stats.queued ?? 0) + (stats.sent ?? 0) + (stats.failed ?? 0);
    const done = (stats.sent ?? 0) + (stats.failed ?? 0);
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    const finished = !sentScheduled && total > 0 && done >= total;

    return (
      <div className="mx-auto max-w-xl space-y-5 pb-16">
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            {finished ? (
              <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            ) : sentScheduled ? (
              <Clock className="h-14 w-14 text-primary" />
            ) : (
              <Loader2 className="h-14 w-14 animate-spin text-primary" />
            )}
            <div>
              <h2 className="text-xl font-black">
                {finished ? 'Gönderim tamamlandı 🧡' : sentScheduled ? 'Mail zamanlandı' : 'Gönderiliyor…'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {sentScheduled
                  ? 'Zamanı gelince sunucu otomatik gönderecek — hiçbir şey yapmana gerek yok.'
                  : 'Sunucu arka planda dakikada ~50 mail gönderiyor. Bu sayfayı kapatabilirsin.'}
              </p>
            </div>

            {!sentScheduled && (
              <div className="w-full space-y-2">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold tabular-nums text-muted-foreground">
                  <span>Gönderilen: {stats.sent ?? 0}</span>
                  {typeof stats.failed === 'number' && stats.failed > 0 && (
                    <span className="text-red-600">Başarısız: {stats.failed}</span>
                  )}
                  <span>Toplam: {total}</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/super-admin/messaging/campaigns/${sentCampaignId}`}>Detay & istatistikler</Link>
              </Button>
              <Button onClick={resetAll} className="rounded-xl">
                <Mail className="mr-1.5 h-4 w-4" /> Yeni mail gönder
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Anlık gönderim akışı — kim, hangi aşamada (Gönderildi→İletildi→Açıldı→Tıklandı) */}
        {!sentScheduled && (
          <Card className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-wide text-muted-foreground">
                Anlık gönderim akışı
              </CardTitle>
              <CardDescription className="text-[11px]">
                Gönderildi → İletildi → Açıldı → Link tıklandı · durumlar anlık güncellenir (en yeni üstte)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {(feedRows ?? []).length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                  İlk mailler birkaç saniye içinde burada görünecek…
                </p>
              ) : (
                <ul className="divide-y">
                  {(feedRows ?? []).map((r) => {
                    const st = recipientStage(r);
                    const StIcon = st.icon;
                    return (
                      <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="min-w-0 flex-1 break-all font-mono text-xs">{r.channelAddress || '—'}</span>
                        {r.clickedLink && (
                          <a
                            href={r.clickedLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden max-w-[140px] truncate text-[10px] text-primary underline sm:block"
                            title={r.clickedLink}
                          >
                            {r.clickedLink}
                          </a>
                        )}
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{fmtTs(st.at)}</span>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>
                          <StIcon className="h-3 w-3" /> {st.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  /* ── Ana sihirbaz ─────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      <div className="flex items-center gap-3 px-1">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/super-admin/messaging" aria-label="Geri"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black">Mail Gönder</h1>
          <p className="text-sm text-muted-foreground">Kitle seç, yaz, gönder — gerisi sunucuda otomatik.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* SOL: adımlar */}
        <div className="space-y-5">
          {/* 1 — KİME */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">1</span>
                Kime gidecek?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {AUDIENCES.map((a) => {
                  const Icon = a.icon;
                  const active = audience === a.key;
                  return (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => setAudience(a.key)}
                      className={`flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-left transition ${
                        active ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-bold leading-tight">{a.label}</span>
                      <span className="text-[11px] leading-snug text-muted-foreground">{a.desc}</span>
                    </button>
                  );
                })}
              </div>

              {audience === 'city' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      list="province-list"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCity(); } }}
                      placeholder="İl yaz (örn. İstanbul)…"
                      className="rounded-xl"
                    />
                    <datalist id="province-list">
                      {allProvinces.map((p) => <option key={p} value={p} />)}
                    </datalist>
                    <Button type="button" variant="outline" className="rounded-xl" onClick={addCity}>Ekle</Button>
                  </div>
                  {cities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {cities.map((c) => (
                        <Badge key={c} variant="secondary" className="gap-1 rounded-full px-2.5 py-1">
                          {c}
                          <button type="button" aria-label={`${c} kaldır`} onClick={() => setCities((prev) => prev.filter((x) => x !== c))}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {audience === 'manual' && (
                <div className="space-y-2">
                  <Textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder={'E-posta adreslerini yapıştır — virgül, boşluk veya satırla ayrılabilir.\nörnek@dernek.org, bilgi@vakif.org …'}
                    rows={4}
                    className="rounded-xl font-mono text-xs"
                  />
                  <p className="flex items-start gap-1.5 text-[11px] leading-snug text-amber-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Dış listelerde izin (KVKK) sorumluluğu sana aittir; maillere yine de çıkış linki eklenir.
                  </p>
                </div>
              )}

              {/* Canlı alıcı sayacı */}
              <div className="rounded-2xl border bg-muted/30 px-4 py-3">
                {counting ? (
                  <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Alıcılar hesaplanıyor…
                  </span>
                ) : countError ? (
                  <span className="text-sm font-semibold text-red-600">{countError}</span>
                ) : recipientCount !== null && audienceReady ? (
                  <span className="text-sm font-bold">
                    <span className="text-lg tabular-nums text-primary">{recipientCount}</span>{' '}
                    {isUsersAudience ? 'izinli alıcıya gidecek' : 'adrese gidecek'}
                    {isUsersAudience && summary && summary.afterDedupe > summary.afterConsent && (
                      <span className="ml-2 text-xs font-medium text-muted-foreground">
                        ({summary.afterDedupe - summary.afterConsent} kişi izin vermediği için hariç)
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {audience === 'city' ? 'Şehir ekleyince alıcı sayısı hesaplanır.' : 'Adres ekleyince sayı görünür.'}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2 — NE */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">2</span>
                Ne yazacaksın?
              </CardTitle>
              <CardDescription className="text-xs">
                Kişiselleştirme: imleci koy, editördeki <strong>“Otomatik bilgi”</strong> butonlarına bas — her alıcı için o bilgi (ad, STK adı, kütük no…) otomatik dolar. Görsel için araç çubuğundaki resim simgesini kullan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Şablon: seç → doldurur; mevcut içeriği şablon olarak kaydet */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedTplId} onValueChange={applyTemplate}>
                  <SelectTrigger className="h-9 w-full rounded-xl sm:w-72" aria-label="Şablon seç">
                    <span className="flex items-center gap-1.5 text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Şablondan başla (isteğe bağlı)" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">Henüz e-posta şablonu yok</div>
                    ) : (
                      emailTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name || t.subject || t.id}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => {
                    if (!contentReady) {
                      toast({ variant: 'destructive', title: 'Önce içerik', description: 'Şablon için önce konu ve mesajı yaz.' });
                      return;
                    }
                    setTplName(subject.trim());
                    setTplSaveOpen(true);
                  }}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Şablon olarak kaydet
                </Button>
              </div>

              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Konu — örn. Merhaba {ad}, yeni etkinlikler seni bekliyor"
                className="rounded-xl font-semibold"
                maxLength={200}
              />
              <RichTextEditor
                value={bodyHtml}
                onChange={setBodyHtml}
                enableImageUpload
                imageUploadPath="mail-images"
                variableButtons={VARIABLE_BUTTONS}
              />
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-muted/30 px-4 py-2.5 text-xs">
                <span className="font-bold uppercase tracking-wide text-muted-foreground">Gönderen</span>
                <Input value={fromName} onChange={(e) => setFromName(e.target.value)} className="h-8 w-32 rounded-lg" aria-label="Gönderen adı" />
                <Input
                  value={fromEmail}
                  readOnly
                  disabled
                  className="h-8 w-56 rounded-lg font-mono"
                  aria-label="Gönderen e-posta"
                  title="Workspace hesabından gönderilir"
                />
                <span className="text-[11px] text-muted-foreground">
                  Workspace hesabından gönderilir ({fromEmail})
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 3 — GÖNDER */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">3</span>
                Gönder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test maili */}
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed px-4 py-3">
                <FlaskConical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="test@adresin.com"
                  className="h-9 w-56 rounded-lg font-mono text-xs"
                  aria-label="Test e-posta adresi"
                />
                <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => void sendTest()} disabled={testSending}>
                  {testSending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                  Önce kendine test gönder
                </Button>
              </div>

              {/* Zamanlama */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={scheduleMode === 'now' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setScheduleMode('now')}
                >
                  Şimdi gönder
                </Button>
                <Button
                  type="button"
                  variant={scheduleMode === 'later' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setScheduleMode('later')}
                >
                  <Clock className="mr-1.5 h-3.5 w-3.5" /> İleri tarihte
                </Button>
                {scheduleMode === 'later' && (
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="h-9 w-auto rounded-lg"
                    aria-label="Gönderim zamanı"
                  />
                )}
              </div>

              {missingItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {missingItems.map((m) => (
                    <span key={m} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                      <AlertTriangle className="h-3 w-3" /> {m}
                    </span>
                  ))}
                </div>
              )}
              <Button
                type="button"
                size="lg"
                className="h-14 w-full rounded-2xl text-base font-black"
                disabled={sending}
                onClick={tryOpenConfirm}
              >
                {sending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                {recipientCount !== null && audienceReady
                  ? scheduleMode === 'later' ? `${recipientCount} kişiye zamanla` : `${recipientCount} kişiye gönder`
                  : 'Gönder'}
              </Button>
              <p className="text-center text-[11px] leading-snug text-muted-foreground">
                Gönderim sunucuda otomatik sürer (dakikada ~50); izinli olmayan kullanıcılar otomatik hariç tutulur ve her maile çıkış linki eklenir.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SAĞ: canlı önizleme */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-wide text-muted-foreground">Önizleme</CardTitle>
              <CardDescription className="text-[11px]">Örnek değerlerle: Ayşe · İstanbul</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border">
                <div className="border-b bg-muted/40 px-4 py-3">
                  <p className="text-[11px] font-semibold text-muted-foreground">{fromName} &lt;{fromEmail}&gt;</p>
                  <p className="break-words text-sm font-bold">{previewSubject}</p>
                </div>
                <div
                  className="prose prose-sm max-w-none px-4 py-4 text-sm"
                  // Güvenli: içerik sanitizeHtml ile temizlenmiş super-admin girdisi.
                  dangerouslySetInnerHTML={{ __html: previewBody }}
                />
              </div>
              {usedVariables.length > 0 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Kullanılan değişkenler: {usedVariables.map((v) => `{${v}}`).join(' ')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Onay diyaloğu */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {scheduleMode === 'later' ? 'Gönderim zamanlansın mı?' : 'Gönderilsin mi?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              <span className="block">
                <strong className="tabular-nums">{recipientCount}</strong> alıcı ·{' '}
                {AUDIENCES.find((a) => a.key === audience)?.label}
                {scheduleMode === 'later' && scheduledAt
                  ? ` · ${new Date(scheduledAt).toLocaleString('tr-TR')}`
                  : ' · hemen'}
              </span>
              <span className="block break-words font-medium text-foreground">“{subject}”</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {needsTypeConfirm && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-amber-700">
                Büyük gönderim — onay için alıcı sayısını yaz: {recipientCount}
              </p>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={String(recipientCount)}
                className="rounded-xl text-center font-black tabular-nums"
                inputMode="numeric"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              disabled={sending || (needsTypeConfirm && confirmInput.trim() !== String(recipientCount))}
              onClick={(e) => { e.preventDefault(); void doSend(); }}
            >
              {sending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {scheduleMode === 'later' ? 'Zamanla' : 'Gönder'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Şablon olarak kaydet */}
      <AlertDialog open={tplSaveOpen} onOpenChange={setTplSaveOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Şablon olarak kaydet</AlertDialogTitle>
            <AlertDialogDescription>
              Mevcut konu + gövde şablon kütüphanesine eklenir; sonraki gönderimlerde tek tıkla seçersin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            placeholder="Şablon adı — örn. Aylık bülten"
            className="rounded-xl"
            maxLength={80}
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              disabled={tplSaving}
              onClick={(e) => { e.preventDefault(); void saveAsTemplate(); }}
            >
              {tplSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Kaydet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
