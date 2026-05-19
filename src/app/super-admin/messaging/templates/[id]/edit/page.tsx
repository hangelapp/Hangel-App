'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { extractVariables, render } from '@/lib/messaging/template';
import { segmentInfo } from '@/lib/messaging/sms-segments';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import Link from 'next/link';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { COLLECTIONS } from '@/firebase/collections';

export default function TemplateEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const isNew = params.id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [useCase, setUseCase] = useState<'transactional' | 'marketing' | 'emergency'>('transactional');
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [active, setActive] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [iysApproved, setIysApproved] = useState(false);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const snap = await getDoc(doc(db, COLLECTIONS.messageTemplates, params.id));
      if (!snap.exists()) {
        toast({ variant: 'destructive', title: 'Bulunamadı', description: 'Şablon yok.' });
        router.push('/super-admin/messaging/templates');
        return;
      }
      const t = snap.data() as Record<string, unknown>;
      setName((t.name as string) ?? '');
      setChannel((t.channel as 'sms' | 'email') ?? 'sms');
      setUseCase((t.useCase as 'transactional' | 'marketing' | 'emergency') ?? 'transactional');
      setLanguage((t.language as 'tr' | 'en') ?? 'tr');
      setActive(t.active !== false);
      setSubject((t.subject as string) ?? '');
      setBody((t.body as string) ?? '');
      setIysApproved(Boolean(t.iysApproved));
      setLoading(false);
    })();
  }, [db, params.id, isNew, router, toast]);

  const variables = useMemo(() => {
    const all = new Set<string>([...extractVariables(body), ...extractVariables(subject)]);
    return [...all];
  }, [body, subject]);

  const seg = useMemo(() => (channel === 'sms' ? segmentInfo(body) : null), [body, channel]);

  const rendered = useMemo(
    () => ({
      subject: render(subject, previewVars),
      body: render(body, previewVars),
    }),
    [body, subject, previewVars]
  );

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Eksik', description: 'İsim zorunlu' });
      return;
    }
    if (!body.trim()) {
      toast({ variant: 'destructive', title: 'Eksik', description: 'Mesaj gövdesi zorunlu' });
      return;
    }
    if (channel === 'email' && !subject.trim()) {
      toast({ variant: 'destructive', title: 'Eksik', description: 'E-posta için konu zorunlu' });
      return;
    }

    setSaving(true);
    try {
      const id = isNew
        ? `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        : params.id;
      const ref = doc(db, COLLECTIONS.messageTemplates, id);
      await setDoc(
        ref,
        {
          name: name.trim(),
          channel,
          useCase,
          language,
          active,
          subject: channel === 'email' ? subject.trim() : null,
          body,
          variables,
          iysApproved: useCase === 'marketing' && channel === 'sms' ? iysApproved : false,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ?? 'unknown',
          ...(isNew ? { createdAt: serverTimestamp(), createdBy: user?.uid ?? 'unknown' } : {}),
        },
        { merge: true }
      );
      toast({ title: 'Kaydedildi', description: name });
      if (isNew) router.replace(`/super-admin/messaging/templates/${id}/edit`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    if (!confirm('Şablon silinsin mi? Bu işlem geri alınamaz.')) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, COLLECTIONS.messageTemplates, params.id));
      toast({ title: 'Silindi' });
      router.push('/super-admin/messaging/templates');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setDeleting(false);
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
        <Link
          href="/super-admin/messaging/templates"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Şablonlar
        </Link>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Kaydet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>İsim</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ör. Bağış Teşekkür Mesajı" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kanal</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as 'sms' | 'email')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">E-posta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kullanım amacı</Label>
                <Select value={useCase} onValueChange={(v) => setUseCase(v as typeof useCase)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactional">İşlemsel</SelectItem>
                    <SelectItem value="marketing">Pazarlama</SelectItem>
                    <SelectItem value="emergency">Acil durum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <Label>Dil</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as 'tr' | 'en')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Switch checked={active} onCheckedChange={setActive} id="active" />
                <Label htmlFor="active">Aktif</Label>
              </div>
            </div>

            {channel === 'sms' && useCase === 'marketing' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-amber-900">İYS onayı gerekli</p>
                  <p className="text-amber-800 mt-1">
                    Ticari SMS için İYS'ye onaylı içerik olarak kaydetmeniz şart.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      checked={iysApproved}
                      onCheckedChange={setIysApproved}
                      id="iys"
                    />
                    <Label htmlFor="iys" className="text-xs">
                      İYS'de onaylı içerik
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">İçerik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {channel === 'email' && (
              <div>
                <Label>Konu</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="ör. Hoş geldin {ad}!" />
              </div>
            )}

            <div>
              <Label>Gövde</Label>
              {channel === 'email' ? (
                <RichTextEditor value={body} onChange={setBody} />
              ) : (
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  placeholder="Merhaba {ad}, …"
                />
              )}
            </div>

            {seg && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant={seg.encoding === 'GSM7' ? 'secondary' : 'outline'}>
                  {seg.encoding}
                </Badge>
                <span className="text-muted-foreground">
                  {seg.chars} karakter · {seg.segments} segment
                </span>
                {seg.encoding === 'UCS2' && (
                  <span className="text-amber-700">
                    ⚠ Türkçe karakter kapasiteyi 160→70 düşürdü
                  </span>
                )}
              </div>
            )}

            {variables.length > 0 && (
              <div>
                <Label className="text-xs">Tespit edilen değişkenler</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {variables.map((v) => (
                    <Badge key={v} variant="outline" className="text-xs">{`{${v}}`}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Önizleme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {variables.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {variables.map((v) => (
                  <div key={v}>
                    <Label className="text-xs">{`{${v}}`}</Label>
                    <Input
                      value={previewVars[v] ?? ''}
                      onChange={(e) => setPreviewVars((p) => ({ ...p, [v]: e.target.value }))}
                      placeholder={`Örnek ${v}`}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="border rounded p-3 bg-muted/30">
              {channel === 'email' && rendered.subject && (
                <p className="text-xs font-semibold mb-2">Konu: {rendered.subject}</p>
              )}
              {channel === 'email' ? (
                <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(rendered.body || '<em class="text-muted-foreground">boş</em>') }} />
              ) : (
                <pre className="text-sm whitespace-pre-wrap font-sans">{rendered.body || '(boş)'}</pre>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
