'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  Sparkles,
  Bot,
  Loader2,
  Save,
  Library as LibraryIcon,
  X,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { LibrarySection } from '@/lib/library';
import { librarySections as staticSections } from '@/lib/library';

type AssistantKind = 'library' | 'project';

interface AssistantConfig {
  systemPrompt: string;
  knowledgeSourceSlugs: string[];
  model: string;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_CONFIG: Record<AssistantKind, AssistantConfig> = {
  library: {
    systemPrompt:
      'Sen Hangel Kütüphane Asistanısın. SADECE kütüphanedeki seçili dokümanları kullanarak cevap ver. ' +
      'Dokümanlarda olmayan bilgileri uydurma; bilmiyorsan "Bu konuda kütüphanede içerik bulamadım." de.',
    knowledgeSourceSlugs: [],
    model: 'gemini-1.5-pro',
    temperature: 0.3,
    maxTokens: 1024,
  },
  project: {
    systemPrompt:
      'Sen Hangel Proje Yazma Asistanısın. Kullanıcının anlattığı projeyi alır, kütüphane kaynakları ve ' +
      'süper admin tarafından sağlanan şablonlarla birlikte yapılandırılmış bir proje dokümanı taslağı oluşturursun. ' +
      'Başlık, özet, hedefler, paydaşlar, faaliyet planı, bütçe ve etki ölçümü bölümleri içersin.',
    knowledgeSourceSlugs: [],
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxTokens: 2048,
  },
};

const MODELS = [
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gpt-4o', label: 'GPT-4o' },
];

function AssistantEditor({
  kind,
  sectionOptions,
}: {
  kind: AssistantKind;
  sectionOptions: { slug: string; title: string }[];
}) {
  const db = useFirestore();
  const { toast } = useToast();
  const [config, setConfig] = useState<AssistantConfig>(DEFAULT_CONFIG[kind]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current config
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'aiAssistantConfig', kind));
        if (!active) return;
        if (snap.exists()) {
          const data = snap.data() as Partial<AssistantConfig>;
          setConfig({
            systemPrompt: data.systemPrompt ?? DEFAULT_CONFIG[kind].systemPrompt,
            knowledgeSourceSlugs: Array.isArray(data.knowledgeSourceSlugs)
              ? data.knowledgeSourceSlugs
              : [],
            model: typeof data.model === 'string' ? data.model : DEFAULT_CONFIG[kind].model,
            temperature:
              typeof data.temperature === 'number'
                ? data.temperature
                : DEFAULT_CONFIG[kind].temperature,
            maxTokens:
              typeof data.maxTokens === 'number'
                ? data.maxTokens
                : DEFAULT_CONFIG[kind].maxTokens,
          });
        } else {
          setConfig(DEFAULT_CONFIG[kind]);
        }
      } catch {
        if (active) setConfig(DEFAULT_CONFIG[kind]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [db, kind]);

  const toggleSlug = (slug: string) => {
    setConfig(prev => {
      const exists = prev.knowledgeSourceSlugs.includes(slug);
      return {
        ...prev,
        knowledgeSourceSlugs: exists
          ? prev.knowledgeSourceSlugs.filter(s => s !== slug)
          : [...prev.knowledgeSourceSlugs, slug],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'aiAssistantConfig', kind),
        {
          ...config,
          kind,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      toast({
        title: 'Kaydedildi',
        description: `${kind === 'library' ? 'Kütüphane Asistanı' : 'Proje Yazma Asistanı'} ayarları güncellendi.`,
      });
    } catch (err) {
      toast({
        title: 'Kayıt başarısız',
        description: err instanceof Error ? err.message : 'Bilinmeyen hata',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor={`${kind}-prompt`}>Sistem Prompt</Label>
        <Textarea
          id={`${kind}-prompt`}
          rows={8}
          value={config.systemPrompt}
          onChange={e => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
          placeholder="Asistanın rolünü, kısıtlarını ve cevap formatını yazın..."
        />
        <p className="text-xs text-muted-foreground">
          Bu prompt her sorgu öncesinde modele iletilecektir.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Bilgi Tabanı Kaynakları</Label>
          {config.knowledgeSourceSlugs.length > 0 && (
            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, knowledgeSourceSlugs: [] }))}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Temizle ({config.knowledgeSourceSlugs.length})
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Asistanın cevap üretirken kullanacağı kütüphane bölümlerini seçin.
        </p>
        <div className="flex flex-wrap gap-1.5 p-3 border rounded-xl bg-muted/30 max-h-56 overflow-y-auto">
          {sectionOptions.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Kütüphane bölümü bulunamadı.</p>
          )}
          {sectionOptions.map(opt => {
            const isOn = config.knowledgeSourceSlugs.includes(opt.slug);
            return (
              <button
                key={opt.slug}
                type="button"
                onClick={() => toggleSlug(opt.slug)}
                className={
                  isOn
                    ? 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground'
                    : 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-background border text-muted-foreground hover:bg-muted'
                }
              >
                <LibraryIcon className="h-3 w-3" />
                {opt.title}
                {isOn && <X className="h-3 w-3 opacity-80" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Model</Label>
          <Select
            value={config.model}
            onValueChange={v => setConfig(prev => ({ ...prev, model: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Model seçin" />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Şu an placeholder; API anahtarı tanımlandığında aktifleşecek.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${kind}-max`}>Maksimum cevap uzunluğu (token)</Label>
          <Input
            id={`${kind}-max`}
            type="number"
            min={64}
            max={8192}
            step={64}
            value={config.maxTokens}
            onChange={e =>
              setConfig(prev => ({
                ...prev,
                maxTokens: Math.max(64, Math.min(8192, Number(e.target.value) || 0)),
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Sıcaklık (temperature)</Label>
          <Badge variant="secondary">{config.temperature.toFixed(2)}</Badge>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[config.temperature]}
          onValueChange={v =>
            setConfig(prev => ({
              ...prev,
              temperature: Array.isArray(v) ? Number(v[0]) : prev.temperature,
            }))
          }
        />
        <p className="text-[11px] text-muted-foreground">
          0 = deterministik / 1 = yaratıcı.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function AIManagementPage() {
  const db = useFirestore();

  const libQuery = useMemoFirebase(() => collection(db, 'library'), [db]);
  const { data: libData, isLoading } = useCollection<LibrarySection>(libQuery);

  const sectionOptions = useMemo(() => {
    const map = new Map<string, { slug: string; title: string }>();
    for (const s of staticSections) {
      map.set(s.slug, { slug: s.slug, title: s.title });
    }
    for (const s of libData ?? []) {
      if (s.slug) map.set(s.slug, { slug: s.slug, title: s.title ?? s.slug });
    }
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'tr'));
  }, [libData]);

  return (
    <div className="space-y-6 animate-in fade-in-0 max-w-4xl mx-auto pb-12">
      <div className="space-y-1 px-1">
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f] flex items-center gap-2">
          <Brain className="h-7 w-7 text-fuchsia-500" />
          Yapay Zeka Yönetimi
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Kütüphane Asistanı ve Proje Yazma Asistanı yapay zekalarının sistem prompt&apos;unu,
          bilgi tabanını ve model parametrelerini buradan eğitin.
        </p>
      </div>

      <Card className="rounded-3xl border-black/5 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg">Asistan Konfigürasyonu</CardTitle>
          <CardDescription>
            Her asistan için ayrı sistem prompt&apos;u ve bilgi tabanı belirleyebilirsiniz.
            Ayarlar <code className="text-[11px] bg-muted px-1 rounded">aiAssistantConfig</code> koleksiyonunda saklanır.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Kütüphane bölümleri yükleniyor...
            </div>
          ) : (
            <Tabs defaultValue="library">
              <TabsList className="grid grid-cols-2 w-full max-w-md">
                <TabsTrigger value="library" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" /> Kütüphane Asistanı
                </TabsTrigger>
                <TabsTrigger value="project" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Proje Yazma Asistanı
                </TabsTrigger>
              </TabsList>
              <TabsContent value="library" className="mt-6">
                <AssistantEditor kind="library" sectionOptions={sectionOptions} />
              </TabsContent>
              <TabsContent value="project" className="mt-6">
                <AssistantEditor kind="project" sectionOptions={sectionOptions} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
