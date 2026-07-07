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
import { useAutosave } from '@/hooks/use-autosave';
import { AutosaveIndicator } from '@/components/shared/autosave-indicator';
import {
  Brain,
  Sparkles,
  Bot,
  Loader2,
  Save,
  Library as LibraryIcon,
  X,
  Building2,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { LibrarySection } from '@/lib/library';
import { librarySections as staticSections } from '@/lib/library';
import { COLLECTIONS } from '@/firebase/collections';

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
      'Sen hangel Kütüphane AI Asistanısın. SADECE kütüphanedeki seçili dokümanları kullanarak cevap ver. ' +
      'Dokümanlarda olmayan bilgileri uydurma; bilmiyorsan "Bu konuda kütüphanede içerik bulamadım." de.',
    knowledgeSourceSlugs: [],
    model: 'gemini-2.5-pro',
    temperature: 0.3,
    maxTokens: 1024,
  },
  project: {
    systemPrompt:
      'Sen hangel Proje Yazma Asistanısın. Kullanıcının anlattığı projeyi alır, kütüphane kaynakları ve ' +
      'süper admin tarafından sağlanan şablonlarla birlikte yapılandırılmış bir proje dokümanı taslağı oluşturursun. ' +
      'Başlık, özet, hedefler, paydaşlar, faaliyet planı, bütçe ve etki ölçümü bölümleri içersin.',
    knowledgeSourceSlugs: [],
    model: 'gemini-2.5-pro',
    temperature: 0.7,
    maxTokens: 2048,
  },
};

const MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (hızlı, ucuz)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (kapsamlı)' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (en ucuz)' },
  { value: 'gpt-4o', label: 'GPT-4o (henüz aktif değil)' },
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
        const snap = await getDoc(doc(db, COLLECTIONS.aiAssistantConfig, kind));
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

  const persist = async () => {
    await setDoc(
      doc(db, COLLECTIONS.aiAssistantConfig, kind),
      {
        ...config,
        kind,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  };

  const { status: autosaveStatus, markDirty } = useAutosave(persist, [config], { delayMs: 1000 });

  const toggleSlug = (slug: string) => {
    markDirty();
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
      await persist();
      toast({
        title: 'Kaydedildi',
        description: `${kind === 'library' ? 'Kütüphane AI Asistanı' : 'Proje Yazma Asistanı'} ayarları güncellendi.`,
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
          onChange={e => {
            markDirty();
            setConfig(prev => ({ ...prev, systemPrompt: e.target.value }));
          }}
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
              onClick={() => {
                markDirty();
                setConfig(prev => ({ ...prev, knowledgeSourceSlugs: [] }));
              }}
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
            onValueChange={v => {
              markDirty();
              setConfig(prev => ({ ...prev, model: v }));
            }}
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
            Gemini Pro / 1.5 Pro doğrudan aktif. GPT-4o seçilirse desteklenmediğinden default Gemini Flash'a düşülür.
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
            onChange={e => {
              markDirty();
              setConfig(prev => ({
                ...prev,
                maxTokens: Math.max(64, Math.min(8192, Number(e.target.value) || 0)),
              }));
            }}
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
          onValueChange={v => {
            markDirty();
            setConfig(prev => ({
              ...prev,
              temperature: Array.isArray(v) ? Number(v[0]) : prev.temperature,
            }));
          }}
        />
        <p className="text-[11px] text-muted-foreground">
          0 = deterministik / 1 = yaratıcı.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3">
        <AutosaveIndicator status={autosaveStatus} />
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

// PDF #3: per-institution "proje çağrı esasları". Doc id = institution slug.
interface ProjectCallCriteria {
  institution: string;
  slug: string;
  requirements: string;
  format: string;
  deadline: string;
  keywords: string;
  focusAreas: string;
}

const EMPTY_CRITERIA: ProjectCallCriteria = {
  institution: '',
  slug: '',
  requirements: '',
  format: '',
  deadline: '',
  keywords: '',
  focusAreas: '',
};

/**
 * Turkish-aware slugify. MUST stay in sync with the API route
 * (`src/app/api/library/project/route.ts` → `slugifyInstitution`) so the
 * institution label resolves to the same doc id on write (here) and read (route).
 */
function slugifyInstitution(label: string): string {
  return label
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ProjectCriteriaManager() {
  const db = useFirestore();
  const { toast } = useToast();

  const criteriaQuery = useMemoFirebase(
    () => collection(db, COLLECTIONS.projectCallCriteria),
    [db],
  );
  const { data: criteriaList, isLoading } =
    useCollection<ProjectCallCriteria>(criteriaQuery);

  const [form, setForm] = useState<ProjectCallCriteria>(EMPTY_CRITERIA);
  // Doc id currently being edited (null = creating a new record).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedList = useMemo(() => {
    return [...(criteriaList ?? [])].sort((a, b) =>
      (a.institution ?? '').localeCompare(b.institution ?? '', 'tr'),
    );
  }, [criteriaList]);
  // `useCollection` returns `WithId<T>`, so each item carries a string `id`.
  type CriteriaWithId = ProjectCallCriteria & { id: string };

  const resetForm = () => {
    setForm(EMPTY_CRITERIA);
    setEditingId(null);
  };

  const startEdit = (item: CriteriaWithId) => {
    setForm({
      institution: item.institution ?? '',
      slug: item.slug ?? item.id,
      requirements: item.requirements ?? '',
      format: item.format ?? '',
      deadline: item.deadline ?? '',
      keywords: item.keywords ?? '',
      focusAreas: item.focusAreas ?? '',
    });
    setEditingId(item.id);
  };

  const handleSave = async () => {
    const institution = form.institution.trim();
    if (!institution) {
      toast({
        title: 'Kurum adı zorunlu',
        description: 'Lütfen çağrı esaslarını gireceğiniz kurumun adını yazın.',
        variant: 'destructive',
      });
      return;
    }
    // When editing keep the original doc id; when creating derive it from the label.
    const docId = editingId ?? slugifyInstitution(institution);
    if (!docId) {
      toast({
        title: 'Geçersiz kurum adı',
        description: 'Kurum adından geçerli bir kimlik üretilemedi.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.projectCallCriteria, docId),
        {
          institution,
          slug: docId,
          requirements: form.requirements.trim(),
          format: form.format.trim(),
          deadline: form.deadline.trim(),
          keywords: form.keywords.trim(),
          focusAreas: form.focusAreas.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      toast({
        title: 'Kaydedildi',
        description: `${institution} için proje çağrı esasları güncellendi.`,
      });
      resetForm();
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

  const handleDelete = async (id: string, institution: string) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`${institution || id} için çağrı esaslarını silmek istiyor musunuz?`)
    ) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, COLLECTIONS.projectCallCriteria, id));
      if (editingId === id) resetForm();
      toast({ title: 'Silindi', description: `${institution || id} çağrı esasları kaldırıldı.` });
    } catch (err) {
      toast({
        title: 'Silme başarısız',
        description: err instanceof Error ? err.message : 'Bilinmeyen hata',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-muted/20 p-4 space-y-4">
        <div className="flex items-center gap-2">
          {editingId ? (
            <Pencil className="h-4 w-4 text-fuchsia-500" />
          ) : (
            <Plus className="h-4 w-4 text-fuchsia-500" />
          )}
          <h3 className="font-semibold text-sm">
            {editingId ? 'Çağrı Esaslarını Düzenle' : 'Yeni Çağrı Esası Ekle'}
          </h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="crit-institution">Kurum Adı</Label>
          <Input
            id="crit-institution"
            value={form.institution}
            onChange={e => setForm(prev => ({ ...prev, institution: e.target.value }))}
            placeholder="Örn. AB (Avrupa Birliği) Fonları"
            disabled={editingId !== null}
          />
          <p className="text-[11px] text-muted-foreground">
            Proje yazma formundaki kurum adıyla birebir aynı yazın. Kimlik:{' '}
            <code className="bg-muted px-1 rounded">
              {(editingId ?? slugifyInstitution(form.institution)) || '—'}
            </code>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="crit-requirements">Talep ve Esaslar</Label>
          <Textarea
            id="crit-requirements"
            rows={5}
            value={form.requirements}
            onChange={e => setForm(prev => ({ ...prev, requirements: e.target.value }))}
            placeholder="Bu kurumun proje başvurularından beklediği koşullar, uygunluk kriterleri..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="crit-format">Format / Şablon Beklentisi</Label>
            <Textarea
              id="crit-format"
              rows={3}
              value={form.format}
              onChange={e => setForm(prev => ({ ...prev, format: e.target.value }))}
              placeholder="İstenen bölümler, sayfa limiti, ek belgeler..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crit-deadline">Son Başvuru Tarihi / Takvim</Label>
            <Input
              id="crit-deadline"
              value={form.deadline}
              onChange={e => setForm(prev => ({ ...prev, deadline: e.target.value }))}
              placeholder="Örn. 31 Aralık 2026 veya yıl boyu açık"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="crit-focus">Odak Alanları</Label>
            <Textarea
              id="crit-focus"
              rows={3}
              value={form.focusAreas}
              onChange={e => setForm(prev => ({ ...prev, focusAreas: e.target.value }))}
              placeholder="Öncelikli temalar (örn. iklim, dijital dönüşüm, gençlik)..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crit-keywords">Anahtar Kelimeler</Label>
            <Textarea
              id="crit-keywords"
              rows={3}
              value={form.keywords}
              onChange={e => setForm(prev => ({ ...prev, keywords: e.target.value }))}
              placeholder="Virgülle ayrılmış anahtar kelimeler..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {editingId && (
            <Button variant="ghost" onClick={resetForm} disabled={saving}>
              İptal
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> {editingId ? 'Güncelle' : 'Ekle'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tanımlı Çağrı Esasları</Label>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Yükleniyor...
          </div>
        ) : sortedList.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">
            Henüz çağrı esası tanımlanmadı. Yukarıdan ilk kaydı ekleyebilirsiniz.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedList.map(item => {
              const id = item.id;
              return (
                <div
                  key={id}
                  className="flex items-start justify-between gap-3 rounded-xl border bg-background p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm break-words">{item.institution || id}</span>
                    </div>
                    {item.requirements && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.requirements}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(item)}
                      aria-label="Düzenle"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleDelete(id, item.institution)}
                      disabled={deletingId === id}
                      aria-label="Sil"
                    >
                      {deletingId === id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIManagementPage() {
  const db = useFirestore();

  const libQuery = useMemoFirebase(() => query(collection(db, COLLECTIONS.library), orderBy(documentId()), limit(200)), [db]);
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
        <h1 className="text-3xl font-black tracking-tighter text-foreground flex items-center gap-2">
          <Brain className="h-7 w-7 text-fuchsia-500" />
          Yapay Zeka Yönetimi
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Kütüphane AI Asistanı ve Proje Yazma Asistanı yapay zekalarının sistem prompt&apos;unu,
          bilgi tabanını ve model parametrelerini buradan eğitin.
        </p>
      </div>

      <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
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
              <TabsList className="grid grid-cols-3 w-full max-w-2xl">
                <TabsTrigger value="library" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" /> Kütüphane AI Asistanı
                </TabsTrigger>
                <TabsTrigger value="project" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Proje Yazma Asistanı
                </TabsTrigger>
                <TabsTrigger value="criteria" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Proje Çağrı Esasları
                </TabsTrigger>
              </TabsList>
              <TabsContent value="library" className="mt-6">
                <AssistantEditor kind="library" sectionOptions={sectionOptions} />
              </TabsContent>
              <TabsContent value="project" className="mt-6">
                <AssistantEditor kind="project" sectionOptions={sectionOptions} />
              </TabsContent>
              <TabsContent value="criteria" className="mt-6">
                <ProjectCriteriaManager />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
