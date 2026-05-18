'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, ArrowRight, Check, Loader2, MessageSquare, Mail, Send,
  AlertTriangle, RefreshCw, Search, X, Users, Calendar, Clock,
} from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { messagingFetch } from '@/lib/messaging/client';
import { segmentInfo } from '@/lib/messaging/sms-segments';
import { extractVariables } from '@/lib/messaging/template';
import type { RecipientSourceSpec, ResolvedRecipient, SegmentFilters } from '@/lib/messaging/types';
import { allProvinces } from '@/lib/data';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize-html';

type Channel = 'sms' | 'email';
type UseCase = 'transactional' | 'marketing' | 'emergency';
type Step = 1 | 2 | 3 | 4;

interface TemplateRow {
  id: string;
  name?: string;
  channel?: 'sms' | 'email' | 'both';
  useCase?: string;
  subject?: string;
  body?: string;
  active?: boolean;
  iysApproved?: boolean;
}

interface SegmentRow {
  id: string;
  name?: string;
  channel?: string;
  useCase?: string;
  estimatedSize?: number;
}

interface DryRun {
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

interface UserSearchResult {
  id: string;
  name?: string;
  username?: string;
  personalInfo?: { email?: string; phone?: string };
}

const STEP_TITLES = ['Kanal & Amaç', 'Alıcılar', 'İçerik', 'Onay & Gönder'];

export default function CampaignWizardPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Channel>('sms');
  const [useCase, setUseCase] = useState<UseCase>('transactional');

  // Step 2 — recipients
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
  const [manualUsers, setManualUsers] = useState<UserSearchResult[]>([]);
  const [quickRoles, setQuickRoles] = useState<string[]>([]);
  const [quickCities, setQuickCities] = useState<string[]>([]);
  const [dryRun, setDryRun] = useState<DryRun | null>(null);
  const [dryRunning, setDryRunning] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Step 3
  const [templateId, setTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [senderId, setSenderId] = useState('HANGEL');
  const [fromEmail, setFromEmail] = useState('noreply@hangel.org');
  const [fromName, setFromName] = useState('Hangel');
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});

  // Step 4
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [doubleConfirmCount, setDoubleConfirmCount] = useState<string>('');

  // Load templates and segments
  const tplQuery = useMemoFirebase(
    () => query(collection(db, 'messageTemplates'), orderBy('updatedAt', 'desc')),
    [db]
  );
  const segQuery = useMemoFirebase(
    () => query(collection(db, 'recipientSegments'), orderBy('updatedAt', 'desc')),
    [db]
  );
  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);

  const { data: templates } = useCollection<TemplateRow>(tplQuery);
  const { data: segments } = useCollection<SegmentRow>(segQuery);
  const { data: allUsers } = useCollection<UserSearchResult>(usersQuery);

  const filteredTemplates = useMemo(
    () => (templates ?? []).filter((t) => t.channel === channel || t.channel === 'both').filter((t) => t.active !== false),
    [templates, channel]
  );
  const filteredSegments = useMemo(
    () =>
      (segments ?? []).filter(
        (s) => s.channel === channel || s.channel === 'both' || !s.channel
      ),
    [segments, channel]
  );

  const userMatches = useMemo(() => {
    if (!allUsers || userSearch.trim().length < 2) return [];
    const s = userSearch.trim().toLowerCase();
    return allUsers
      .filter(
        (u) =>
          (u.name ?? '').toLowerCase().includes(s) ||
          (u.username ?? '').toLowerCase().includes(s) ||
          (u.personalInfo?.email ?? '').toLowerCase().includes(s) ||
          (u.personalInfo?.phone ?? '').includes(s.replace(/\D/g, ''))
      )
      .slice(0, 8);
  }, [allUsers, userSearch]);

  // Apply template when selected
  useEffect(() => {
    if (!templateId) return;
    const t = filteredTemplates.find((x) => x.id === templateId);
    if (t) {
      setSubject(t.subject ?? '');
      setBody(t.body ?? '');
    }
  }, [templateId, filteredTemplates]);

  const variables = useMemo(
    () => [...new Set([...extractVariables(body), ...extractVariables(subject)])],
    [body, subject]
  );

  const seg = useMemo(() => (channel === 'sms' ? segmentInfo(body) : null), [body, channel]);

  const buildSpec = (): RecipientSourceSpec => {
    const filters: SegmentFilters = {};
    if (quickRoles.length > 0) filters.roles = quickRoles as SegmentFilters['roles'];
    if (quickCities.length > 0) filters.cities = quickCities;
    const hasFilters = Object.keys(filters).length > 0;
    return {
      channel,
      useCase,
      filters: hasFilters ? filters : undefined,
      segmentIds: selectedSegmentIds.length > 0 ? selectedSegmentIds : undefined,
      manualUserIds: manualUsers.length > 0 ? manualUsers.map((u) => u.id) : undefined,
    };
  };

  const runDryRun = async () => {
    setDryRunning(true);
    try {
      const result = await messagingFetch<DryRun>('/api/messaging/resolve-recipients', {
        method: 'POST',
        body: JSON.stringify(buildSpec()),
      });
      setDryRun(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setDryRunning(false);
    }
  };

  // Auto dry-run when recipients change (debounced)
  useEffect(() => {
    if (step !== 2) return;
    const handle = setTimeout(() => {
      runDryRun();
    }, 600);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSegmentIds.join(','), manualUsers.map((u) => u.id).join(','), quickRoles.join(','), quickCities.join(','), channel, useCase]);

  const canProceedFromStep = (s: Step): boolean => {
    if (s === 1) return name.trim().length > 0;
    if (s === 2) return !!dryRun && dryRun.summary.afterConsent > 0;
    if (s === 3) {
      if (!body.trim()) return false;
      if (channel === 'email' && !subject.trim()) return false;
      return true;
    }
    return true;
  };

  const recipientCount = dryRun?.summary.afterConsent ?? 0;
  const needsDoubleConfirm = recipientCount >= 1000;

  const handleSubmit = async () => {
    if (needsDoubleConfirm && Number(doubleConfirmCount) !== recipientCount) {
      toast({
        variant: 'destructive',
        title: 'Onay gerekli',
        description: `Alıcı sayısını (${recipientCount}) elle girmen lazım.`,
      });
      return;
    }
    setSubmitting(true);
    try {
      const result = await messagingFetch<{ campaignId: string; status: string }>(
        '/api/messaging/campaigns',
        {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            channel,
            useCase,
            templateId: templateId || undefined,
            subject: channel === 'email' ? subject : undefined,
            body,
            senderId,
            fromEmail: channel === 'email' ? fromEmail : undefined,
            fromName: channel === 'email' ? fromName : undefined,
            spec: buildSpec(),
            scheduledAt: scheduleMode === 'later' ? scheduledAt : null,
            doubleConfirmCount: needsDoubleConfirm ? recipientCount : undefined,
          }),
        }
      );
      toast({ title: 'Kampanya oluşturuldu', description: result.status });
      router.push(`/super-admin/messaging/campaigns/${result.campaignId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/super-admin/messaging/campaigns" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Kampanyalar
        </Link>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEP_TITLES.map((title, i) => {
          const n = (i + 1) as Step;
          const active = step === n;
          const done = step > n;
          return (
            <button
              key={title}
              onClick={() => (done || canProceedFromStep((n - 1) as Step) ? setStep(n) : null)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap',
                active ? 'bg-primary text-primary-foreground' : done ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <span className="font-bold">{n}.</span>}
              {title}
            </button>
          );
        })}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kanal & Amaç</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Kampanya adı (yalnızca dahili)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ör. Mayıs Bağışçı Teşekkür" />
            </div>
            <div>
              <Label>Kanal</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(['sms', 'email'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChannel(c)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded border-2 text-left',
                      channel === c ? 'border-primary bg-primary/5' : 'border-muted'
                    )}
                  >
                    {c === 'sms' ? <MessageSquare className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                    <div>
                      <div className="font-medium text-sm">{c === 'sms' ? 'SMS' : 'E-posta'}</div>
                      <div className="text-xs text-muted-foreground">
                        {c === 'sms' ? 'Kısa mesaj, telefon numarası' : 'Zengin içerik, e-posta'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Kullanım amacı</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {([
                  { v: 'transactional', t: 'İşlemsel', d: 'Hesap, etkinlik' },
                  { v: 'marketing', t: 'Pazarlama', d: 'KVKK + İYS izni şart' },
                  { v: 'emergency', t: 'Acil durum', d: 'Kriz uyarısı' },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setUseCase(opt.v)}
                    className={cn(
                      'p-3 rounded border-2 text-left',
                      useCase === opt.v ? 'border-primary bg-primary/5' : 'border-muted'
                    )}
                  >
                    <div className="font-medium text-sm">{opt.t}</div>
                    <div className="text-xs text-muted-foreground">{opt.d}</div>
                  </button>
                ))}
              </div>
            </div>
            {useCase === 'marketing' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-900">
                  Pazarlama mesajları yalnızca KVKK pazarlama iznine sahip kullanıcılara gider; izni olmayanlar otomatik elenir.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Alıcılar</CardTitle>
            <Button variant="outline" size="sm" onClick={runDryRun} disabled={dryRunning}>
              {dryRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Hesapla
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="segments">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="segments">Segmentler</TabsTrigger>
                <TabsTrigger value="quick">Hızlı Filtre</TabsTrigger>
                <TabsTrigger value="manual">Manuel</TabsTrigger>
              </TabsList>

              <TabsContent value="segments" className="mt-4 space-y-2">
                {filteredSegments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Bu kanala uygun segment yok. <Link href="/super-admin/messaging/segments/new/edit" className="text-primary underline">Yeni segment</Link>
                  </p>
                ) : (
                  filteredSegments.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/40">
                      <Checkbox
                        checked={selectedSegmentIds.includes(s.id)}
                        onCheckedChange={(c) => {
                          if (c) setSelectedSegmentIds([...selectedSegmentIds, s.id]);
                          else setSelectedSegmentIds(selectedSegmentIds.filter((x) => x !== s.id));
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{s.name ?? s.id}</div>
                        {typeof s.estimatedSize === 'number' && (
                          <div className="text-xs text-muted-foreground">~{s.estimatedSize} kişi</div>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </TabsContent>

              <TabsContent value="quick" className="mt-4 space-y-3">
                <div>
                  <Label className="text-xs">Roller</Label>
                  <div className="flex gap-3 mt-1">
                    {(['user', 'ngo-admin', 'super-admin'] as const).map((r) => (
                      <label key={r} className="flex items-center gap-1.5 text-sm">
                        <Checkbox
                          checked={quickRoles.includes(r)}
                          onCheckedChange={(c) => {
                            if (c) setQuickRoles([...quickRoles, r]);
                            else setQuickRoles(quickRoles.filter((x) => x !== r));
                          }}
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Şehir</Label>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-auto p-2 border rounded bg-muted/20">
                    {allProvinces.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          if (quickCities.includes(c)) setQuickCities(quickCities.filter((x) => x !== c));
                          else setQuickCities([...quickCities, c]);
                        }}
                        className={cn(
                          'text-xs px-2 py-1 rounded border',
                          quickCities.includes(c)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Daha karmaşık filtreler için "Segmentler" sekmesinden kayıtlı segment oluştur.
                </p>
              </TabsContent>

              <TabsContent value="manual" className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="İsim, kullanıcı adı, e-posta, telefon…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {userMatches.length > 0 && (
                  <ul className="border rounded divide-y max-h-48 overflow-auto">
                    {userMatches.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!manualUsers.find((x) => x.id === u.id)) {
                              setManualUsers([...manualUsers, u]);
                              setUserSearch('');
                            }
                          }}
                          className="w-full text-left p-2 hover:bg-muted/40 text-sm"
                        >
                          <div className="font-medium">{u.name ?? u.username ?? u.id}</div>
                          <div className="text-xs text-muted-foreground">
                            {channel === 'sms' ? u.personalInfo?.phone : u.personalInfo?.email}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {manualUsers.length > 0 && (
                  <div>
                    <Label className="text-xs">Eklendi ({manualUsers.length})</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {manualUsers.map((u) => (
                        <Badge key={u.id} variant="secondary" className="text-xs">
                          {u.name ?? u.username ?? u.id}
                          <button
                            type="button"
                            onClick={() => setManualUsers(manualUsers.filter((x) => x.id !== u.id))}
                            className="ml-1.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Dry-run summary */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded bg-muted/40">
                <p className="text-xl font-bold">{(dryRun?.summary.beforeDedupe ?? 0).toLocaleString('tr-TR')}</p>
                <p className="text-xs text-muted-foreground">Ham</p>
              </div>
              <div className="p-3 rounded bg-muted/40">
                <p className="text-xl font-bold">{(dryRun?.summary.afterDedupe ?? 0).toLocaleString('tr-TR')}</p>
                <p className="text-xs text-muted-foreground">Tekil</p>
              </div>
              <div className="p-3 rounded bg-muted/40">
                <p className="text-xl font-bold">{(dryRun?.summary.invalidAddress ?? 0).toLocaleString('tr-TR')}</p>
                <p className="text-xs text-muted-foreground">Geçersiz</p>
              </div>
              <div className="p-3 rounded bg-primary/10">
                <p className="text-xl font-bold text-primary">
                  <Users className="h-4 w-4 inline mr-1" />
                  {recipientCount.toLocaleString('tr-TR')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {useCase === 'marketing' ? 'İzinli alıcı' : 'Final'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">İçerik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Şablon (opsiyonel)</Label>
                <Select
                  value={templateId || '__none'}
                  onValueChange={(v) => setTemplateId(v === '__none' ? '' : v)}
                >
                  <SelectTrigger><SelectValue placeholder="— Boş başla —" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Boş —</SelectItem>
                    {filteredTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name ?? t.id} {t.useCase ? `· ${t.useCase}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {channel === 'sms' && (
                <div>
                  <Label>Gönderici (sender ID)</Label>
                  <Input value={senderId} onChange={(e) => setSenderId(e.target.value)} maxLength={11} />
                  <p className="text-xs text-muted-foreground mt-1">Provider'a önceden kaydedilmiş başlık.</p>
                </div>
              )}

              {channel === 'email' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Gönderen adı</Label>
                      <Input value={fromName} onChange={(e) => setFromName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Gönderen e-posta</Label>
                      <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Konu</Label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Merhaba {ad}!" />
                  </div>
                </>
              )}

              <div>
                <Label>Gövde</Label>
                {channel === 'email' ? (
                  <RichTextEditor value={body} onChange={setBody} />
                ) : (
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Merhaba {ad}, ..." />
                )}
              </div>

              {seg && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant={seg.encoding === 'GSM7' ? 'secondary' : 'outline'}>{seg.encoding}</Badge>
                  <span className="text-muted-foreground">{seg.chars} karakter · {seg.segments} segment</span>
                  {seg.encoding === 'UCS2' && (
                    <span className="text-amber-700">⚠ Türkçe karakter 70 limit</span>
                  )}
                </div>
              )}

              {variables.length > 0 && (
                <div>
                  <Label className="text-xs">Değişkenler</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {variables.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs">{`{${v}}`}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Önizleme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {variables.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {variables.map((v) => (
                    <div key={v}>
                      <Label className="text-xs">{`{${v}}`}</Label>
                      <Input value={previewVars[v] ?? ''} onChange={(e) => setPreviewVars((p) => ({ ...p, [v]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              )}
              <PreviewPane channel={channel} subject={subject} body={body} vars={previewVars} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Onay & Gönder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded bg-muted/40">
                <p className="text-2xl font-bold">{recipientCount.toLocaleString('tr-TR')}</p>
                <p className="text-xs text-muted-foreground">Alıcı</p>
              </div>
              <div className="p-3 rounded bg-muted/40">
                <p className="text-2xl font-bold">{channel === 'sms' ? seg?.segments ?? 0 : 1}</p>
                <p className="text-xs text-muted-foreground">{channel === 'sms' ? 'Segment/kişi' : 'Email/kişi'}</p>
              </div>
              <div className="p-3 rounded bg-amber-50">
                <p className="text-2xl font-bold text-amber-800">{useCase}</p>
                <p className="text-xs text-muted-foreground">Amaç</p>
              </div>
              <div className="p-3 rounded bg-violet-50">
                <p className="text-2xl font-bold text-violet-800">{channel.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">Kanal</p>
              </div>
            </div>

            <div>
              <Label>Zamanlama</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setScheduleMode('now')}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded border-2',
                    scheduleMode === 'now' ? 'border-primary bg-primary/5' : 'border-muted'
                  )}
                >
                  <Send className="h-4 w-4" />
                  <span>Şimdi gönder</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode('later')}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded border-2',
                    scheduleMode === 'later' ? 'border-primary bg-primary/5' : 'border-muted'
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  <span>İleri tarih</span>
                </button>
              </div>
              {scheduleMode === 'later' && (
                <div className="mt-2">
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 inline mr-1" /> Sunucu saati: Europe/Istanbul
                  </p>
                </div>
              )}
            </div>

            {needsDoubleConfirm && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5" />
                  <div className="text-xs text-rose-900">
                    <strong>Büyük gönderim onayı:</strong> {recipientCount.toLocaleString('tr-TR')} kişiye gönderiyorsun. Devam için sayıyı elle yaz.
                  </div>
                </div>
                <Input
                  placeholder={String(recipientCount)}
                  value={doubleConfirmCount}
                  onChange={(e) => setDoubleConfirmCount(e.target.value)}
                  className="bg-white"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stepper actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1) as Step)} disabled={step === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Geri
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canProceedFromStep(step)}>
            İleri <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting || (scheduleMode === 'later' && !scheduledAt)}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {scheduleMode === 'now' ? 'Gönder' : 'Zamanla'}
          </Button>
        )}
      </div>
    </div>
  );
}

function PreviewPane({
  channel, subject, body, vars,
}: {
  channel: Channel; subject: string; body: string; vars: Record<string, string>;
}) {
  const renderedBody = body.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (m, k) => vars[k] ?? m);
  const renderedSubject = subject.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (m, k) => vars[k] ?? m);
  return (
    <div className="border rounded p-3 bg-muted/30">
      {channel === 'email' && renderedSubject && (
        <p className="text-xs font-semibold mb-2">Konu: {renderedSubject}</p>
      )}
      {channel === 'email' ? (
        <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderedBody || '<em>boş</em>') }} />
      ) : (
        <pre className="text-sm whitespace-pre-wrap font-sans">{renderedBody || '(boş)'}</pre>
      )}
    </div>
  );
}
