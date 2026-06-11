'use client';
/**
 * "Yapay Zekalar ile Entegrasyon" — Süper Admin → Ayarlar bölümü.
 *
 * 1) hangel Bağlam Paketi: HANGEL_AI_CONTEXT'i gösterir + kopyalatır (Claude/ChatGPT'ye
 *    knowledge olarak verilir). hangel güncellendikçe sabit güncellenir → burası güncel kalır.
 * 2) Bağlı Yapay Zeka Araçları: süper-adminin kullandığı AI araçlarını (ad, tür, workspace
 *    linki, not) kaydeder. superAdminSettings/{uid}.aiIntegrations'a yazılır.
 *
 * GÜVENLİK: API anahtarı saklanmaz (sır). Sadece referans/entegrasyon kaydı.
 */
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Copy, Check, Plus, Trash2, ExternalLink, Sparkles } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import { HANGEL_AI_CONTEXT, HANGEL_AI_CONTEXT_UPDATED } from '@/lib/ai-context';

type AiToolType = 'claude' | 'chatgpt' | 'gemini' | 'other';
interface AiIntegration {
  id: string;
  name: string;
  type: AiToolType;
  link?: string;
  note?: string;
}

const TYPE_LABELS: Record<AiToolType, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  other: 'Diğer',
};

export function AiIntegrationSection() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(
    () => (user?.uid ? doc(db, COLLECTIONS.superAdminSettings, user.uid) : null),
    [db, user?.uid],
  );
  const { data: settingsDoc } = useDoc<{ aiIntegrations?: AiIntegration[] }>(settingsRef);
  const tools = useMemo<AiIntegration[]>(() => settingsDoc?.aiIntegrations || [], [settingsDoc]);

  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AiToolType>('claude');
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const copyContext = async () => {
    try {
      await navigator.clipboard.writeText(HANGEL_AI_CONTEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Kopyalandı', description: 'Bağlam paketi panoya kopyalandı. Claude/ChatGPT knowledge\'ına yapıştır.' });
    } catch {
      toast({ variant: 'destructive', title: 'Kopyalanamadı', description: 'Metni elle seçip kopyalayabilirsin.' });
    }
  };

  const persist = async (next: AiIntegration[]) => {
    if (!settingsRef) return;
    setBusy(true);
    try {
      await setDoc(settingsRef, { aiIntegrations: next }, { merge: true });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e instanceof Error ? e.message : 'Hata' });
    } finally {
      setBusy(false);
    }
  };

  const addTool = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'İsim gerekli', description: 'Araç adı zorunlu.' });
      return;
    }
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}`;
    await persist([...tools, { id, name: name.trim(), type, link: link.trim() || undefined, note: note.trim() || undefined }]);
    setName(''); setLink(''); setNote(''); setType('claude');
    toast({ title: 'Eklendi', description: `${name.trim()} entegrasyon listesine eklendi.` });
  };

  const removeTool = (id: string) => persist(tools.filter((t) => t.id !== id));

  return (
    <Card className="rounded-[2rem] border-black/5 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Yapay Zekalar ile Entegrasyon</CardTitle>
        <CardDescription>
          hangel&apos;in güncel bağlamını Claude/ChatGPT&apos;ye tek seferde tanıt; kullandığın yapay zeka araçlarını burada yönet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 1) Bağlam paketi */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <Label className="text-sm font-bold">hangel Bağlam Paketi</Label>
              <p className="text-xs text-muted-foreground">Güncel: {HANGEL_AI_CONTEXT_UPDATED} · hangel değiştikçe burada güncel tutulur. Sır içermez.</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="rounded-xl font-bold" onClick={copyContext}>
              {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? 'Kopyalandı' : 'Bağlamı Kopyala'}
            </Button>
          </div>
          <pre className="max-h-64 overflow-auto rounded-xl border bg-muted/30 p-3 text-[11px] leading-relaxed whitespace-pre-wrap font-mono">{HANGEL_AI_CONTEXT}</pre>
          <p className="text-[11px] text-muted-foreground">
            Nasıl kullanılır: <strong>Claude</strong> → bir Project aç, &quot;Project knowledge&quot;a yapıştır. <strong>ChatGPT</strong> → Project veya Custom GPT &quot;Knowledge&quot;ına yapıştır. (Claude Code için repo&apos;da CLAUDE.md zaten var.)
          </p>
        </div>

        {/* 2) Bağlı AI araçları */}
        <div className="space-y-3">
          <Label className="text-sm font-bold flex items-center gap-2"><Bot className="h-4 w-4" /> Bağlı Yapay Zeka Araçları</Label>

          {tools.length > 0 ? (
            <div className="divide-y rounded-xl border">
              {tools.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate flex items-center gap-2">
                      {t.name}
                      <Badge variant="outline" className="text-[9px] uppercase">{TYPE_LABELS[t.type]}</Badge>
                    </p>
                    {t.note && <p className="text-xs text-muted-foreground truncate">{t.note}</p>}
                    {t.link && (
                      <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> {t.link}
                      </a>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl shrink-0" onClick={() => removeTool(t.id)} disabled={busy} aria-label="Kaldır">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Henüz araç eklenmedi.</p>
          )}

          {/* ekleme formu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border bg-muted/20 p-3">
            <Input placeholder="Araç adı (ör. hangel Asistanı)" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-9" />
            <Select value={type} onValueChange={(v) => setType(v as AiToolType)}>
              <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="chatgpt">ChatGPT</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="other">Diğer</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Workspace / Project / Custom GPT linki (opsiyonel)" value={link} onChange={(e) => setLink(e.target.value)} className="rounded-xl h-9 sm:col-span-2" />
            <Input placeholder="Not (opsiyonel)" value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl h-9 sm:col-span-2" />
            <Button type="button" onClick={addTool} disabled={busy} className="rounded-xl font-bold sm:col-span-2">
              <Plus className="mr-2 h-4 w-4" /> Araç Ekle
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            ⚠️ Güvenlik: Buraya <strong>API anahtarı / şifre yazma</strong>. Sadece referans (ad, tür, link, not). Anahtar gerektiren gerçek entegrasyon sunucu tarafında güvenli saklanır.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
