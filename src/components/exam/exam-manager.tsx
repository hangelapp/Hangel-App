'use client';

/**
 * ExamManager — etkinlik admin kartındaki "Sınav" butonu + yönetim dialogu.
 * Sorular + geçme puanı + deneme + her soruya süre (sn, varsayılan 60). Sonuç ekranı:
 * kim geçti/kaldı. Sınav Ödül/Quiz'den bağımsızdır; sertifikayı geçme puanına bağlar.
 */
import { useCallback, useEffect, useState } from 'react';
import { GraduationCap, Loader2, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { DEFAULT_QUESTION_SECONDS, DEFAULT_PASS_PCT, DEFAULT_ATTEMPTS, type ExamQuestion } from '@/lib/exam';

const emptyQ = (): ExamQuestion => ({ id: '', text: '', options: ['', ''], correctIndex: 0, timeLimitSec: DEFAULT_QUESTION_SECONDS });
type ResultRow = { uid: string; name: string; bestScorePct: number; passed: boolean; attemptCount: number };

export function ExamManager({ id }: { id: string }) {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [requiredForCert, setRequiredForCert] = useState(true);
  const [passPct, setPassPct] = useState(String(DEFAULT_PASS_PCT));
  const [attempts, setAttempts] = useState(String(DEFAULT_ATTEMPTS));
  const [questions, setQuestions] = useState<ExamQuestion[]>([emptyQ()]);
  const [results, setResults] = useState<{ total: number; passed: number; failed: number; rows: ResultRow[] } | null>(null);

  const api = useCallback(
    async (method: 'GET' | 'POST', path: string, body?: unknown) => {
      if (!authUser) throw new Error('Giriş gerekli.');
      const token = await authUser.getIdToken();
      const res = await fetch(path, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'İşlem başarısız.');
      return data;
    },
    [authUser],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('GET', `/api/exam/config?id=${id}`);
      const c = data.config;
      if (c) {
        setEnabled(c.enabled !== false);
        setRequiredForCert(c.requiredForCert !== false);
        setPassPct(String(c.passPct ?? DEFAULT_PASS_PCT));
        setAttempts(String(c.attempts ?? DEFAULT_ATTEMPTS));
        setQuestions(c.questions?.length ? c.questions : [emptyQ()]);
      }
      const r = await api('GET', `/api/exam/results?id=${id}`).catch(() => null);
      if (r) setResults(r);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Yüklenemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setLoading(false);
    }
  }, [api, id, toast]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const save = async () => {
    setBusy('save');
    try {
      await api('POST', '/api/exam/config', {
        id,
        enabled,
        requiredForCert,
        passPct: Number(passPct) || DEFAULT_PASS_PCT,
        attempts: Number(attempts) || DEFAULT_ATTEMPTS,
        questions: questions.filter((q) => q.text.trim() && q.options.filter((o) => o.trim()).length >= 2),
      });
      toast({ title: 'Sınav kaydedildi 📝' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  };

  const setQ = (i: number, patch: Partial<ExamQuestion>) => setQuestions((a) => a.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const setOpt = (qi: number, oi: number, val: string) => setQuestions((a) => a.map((q, idx) => (idx === qi ? { ...q, options: q.options.map((o, k) => (k === oi ? val : o)) } : q)));

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto border-indigo-500/40 text-indigo-600 hover:bg-indigo-500/10 hover:text-indigo-700" onClick={() => setOpen(true)}>
        <GraduationCap className="h-4 w-4 mr-1.5" /> Sınav
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-indigo-500" /> Sertifika Sınavı</DialogTitle>
            <DialogDescription>Sınavlı etkinlikte sertifika yalnız geçme puanını aşanlara verilir. Sınav "Tamamla" sonrası açılır.</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label className="text-sm">Sınav aktif</Label><p className="text-xs text-muted-foreground">Kapalıysa sınav uygulanmaz.</p></div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label className="text-sm">Sertifika için zorunlu</Label><p className="text-xs text-muted-foreground">Açıksa sertifika yalnız geçenlere verilir.</p></div>
                <Switch checked={requiredForCert} onCheckedChange={setRequiredForCert} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-[11px]">Geçme puanı (%)</Label><Input type="number" min={1} max={100} value={passPct} onChange={(e) => setPassPct(e.target.value)} /></div>
                <div><Label className="text-[11px]">Deneme hakkı</Label><Input type="number" min={1} max={20} value={attempts} onChange={(e) => setAttempts(e.target.value)} /></div>
              </div>

              <div className="space-y-4">
                <p className="font-semibold text-sm">Sorular</p>
                {questions.map((q, qi) => (
                  <div key={qi} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">Soru {qi + 1}</span>
                      <Button variant="ghost" size="icon" onClick={() => setQuestions((a) => a.filter((_, idx) => idx !== qi))} aria-label="Sil"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <Input placeholder="Soru metni" value={q.text} onChange={(e) => setQ(qi, { text: e.target.value })} />
                    <div className="space-y-1.5">
                      {q.options.map((o, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input type="radio" name={`ecorrect-${qi}`} checked={q.correctIndex === oi} onChange={() => setQ(qi, { correctIndex: oi })} title="Doğru cevap" />
                          <Input placeholder={`Şık ${oi + 1}`} value={o} onChange={(e) => setOpt(qi, oi, e.target.value)} />
                          {q.options.length > 2 && (
                            <Button variant="ghost" size="icon" onClick={() => setQ(qi, { options: q.options.filter((_, k) => k !== oi), correctIndex: 0 })} aria-label="Şık sil"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                          )}
                        </div>
                      ))}
                      {q.options.length < 6 && <Button variant="ghost" size="sm" className="text-xs" onClick={() => setQ(qi, { options: [...q.options, ''] })}><Plus className="h-3 w-3 mr-1" /> Şık ekle</Button>}
                    </div>
                    <div className="w-40">
                      <Label className="text-[11px]">Süre (saniye)</Label>
                      <Input type="number" min={5} max={1800} value={q.timeLimitSec} onChange={(e) => setQ(qi, { timeLimitSec: Number(e.target.value) })} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setQuestions((a) => [...a, emptyQ()])}><Plus className="h-4 w-4 mr-1" /> Soru ekle</Button>
                <p className="text-[11px] text-muted-foreground">Her katılımcıya sorular ve şıklar KARIŞIK sırada gelir (kopya önleme). Süre boş bırakılırsa 60 sn.</p>
              </div>

              <Button className="w-full" onClick={save} disabled={busy === 'save'}>{busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Sınavı Kaydet</Button>

              {results && results.total > 0 && (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2">Sonuçlar
                    <Badge variant="outline" className="text-[10px] text-green-600 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />{results.passed} geçti</Badge>
                    <Badge variant="outline" className="text-[10px] text-red-600 border-red-300"><XCircle className="h-3 w-3 mr-1" />{results.failed} kaldı</Badge>
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.rows.map((r) => (
                      <div key={r.uid} className="flex items-center justify-between text-xs">
                        <span className="truncate">{r.name}</span>
                        <span className={r.passed ? 'text-green-600 font-semibold' : 'text-muted-foreground'}>%{r.bestScorePct} · {r.attemptCount} deneme {r.passed ? '✓' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
