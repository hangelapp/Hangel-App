'use client';

/**
 * RewardManager — etkinlik/gönüllülük admin kartındaki "Ödül" butonu + yönetim dialogu.
 *   - Çekiliş: ödüller (ad + kaç kişi) → "Çekilişi Yap".
 *   - Soru-Yarışması: sorular (şıklar, doğru cevap, süre, kural, ödül) → (Faz 2) "Sor".
 * Yapılandırma /api/rewards/config, çekiliş /api/rewards/raffle üzerinden.
 */
import { useCallback, useEffect, useState } from 'react';
import { Gift, Loader2, Plus, Trash2, Trophy, Dice5, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import type { QuizQuestion, RewardPrize } from '@/lib/rewards';

type Props = { kind: 'event' | 'volunteering'; id: string };

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
type LiveData = { counts: number[]; total: number; correctCount: number; correctIndex: number | null; winners: { uid: string; name: string }[]; revealed: boolean };

const emptyPrize = (): RewardPrize => ({ name: '', count: 1 });
const emptyQuestion = (): QuizQuestion => ({
  id: '',
  text: '',
  options: ['', ''],
  correctIndex: 0,
  timeLimitSec: 20,
  winnerRule: 'first',
  checkinOnly: false,
  prizeName: '',
  winnerCount: 1,
});

export function RewardManager({ kind, id }: Props) {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const [isOnline, setIsOnline] = useState(false);
  const [raffleOn, setRaffleOn] = useState(false);
  const [prizes, setPrizes] = useState<RewardPrize[]>([emptyPrize()]);
  const [quizOn, setQuizOn] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([emptyQuestion()]);

  const api = useCallback(
    async (method: 'GET' | 'POST', path: string, body?: unknown) => {
      if (!authUser) throw new Error('Giriş gerekli.');
      const token = await authUser.getIdToken();
      const res = await fetch(path, {
        method,
        headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'İşlem başarısız.');
      return data;
    },
    [authUser],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('GET', `/api/rewards/config?kind=${kind}&id=${id}`);
      const cfg = data.config;
      setIsOnline(cfg?.isOnline ?? !!data.guessOnline);
      setRaffleOn(!!cfg?.raffle?.enabled);
      setPrizes(cfg?.raffle?.prizes?.length ? cfg.raffle.prizes : [emptyPrize()]);
      setQuizOn(!!cfg?.quiz?.enabled);
      setQuestions(cfg?.quiz?.questions?.length ? cfg.quiz.questions : [emptyQuestion()]);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Yüklenemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setLoading(false);
    }
  }, [api, kind, id, toast]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const save = async () => {
    setBusy('save');
    try {
      await api('POST', '/api/rewards/config', {
        kind, id, isOnline,
        raffle: { enabled: raffleOn, prizes: prizes.filter((p) => p.name.trim()) },
        quiz: { enabled: quizOn, questions: questions.filter((q) => q.text.trim() && q.options.filter((o) => o.trim()).length >= 2) },
      });
      toast({ title: 'Ödül ayarları kaydedildi 🎁' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  };

  const drawRaffle = async () => {
    if (!confirm('Çekiliş şimdi yapılacak ve kazananlara bildirim gidecek. Emin misin?')) return;
    setBusy('raffle');
    try {
      const r = await api('POST', '/api/rewards/raffle', { kind, id });
      const names = (r.winners || []).map((w: { name: string; prizeName: string }) => `${w.name} (${w.prizeName})`).join(', ');
      toast({ title: `Çekiliş yapıldı 🎉 ${r.winners?.length || 0} kazanan`, description: names || undefined });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Çekiliş yapılamadı', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  };

  // --- yardımcı mutasyonlar ---
  const setPrize = (i: number, patch: Partial<RewardPrize>) => setPrizes((a) => a.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const setQ = (i: number, patch: Partial<QuizQuestion>) => setQuestions((a) => a.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const setOpt = (qi: number, oi: number, val: string) =>
    setQuestions((a) => a.map((q, idx) => (idx === qi ? { ...q, options: q.options.map((o, k) => (k === oi ? val : o)) } : q)));

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto border-amber-500/40 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700" onClick={() => setOpen(true)}>
        <Gift className="h-4 w-4 mr-1.5" /> Ödül
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-amber-500" /> Ödül & Çekiliş</DialogTitle>
            <DialogDescription>Katılımcılar arasında çekiliş yap ve/veya canlı soru-yarışması kur.</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-5">
              {/* Online mı? */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <Label className="text-sm">Online etkinlik</Label>
                  <p className="text-xs text-muted-foreground">Açıksa check-in aranmaz (kayıtlı herkes katılır). Kapalıysa yalnız check-in yapanlar.</p>
                </div>
                <Switch checked={isOnline} onCheckedChange={setIsOnline} />
              </div>

              {/* ÇEKİLİŞ */}
              <div className="rounded-xl border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm flex items-center gap-1.5"><Dice5 className="h-4 w-4 text-amber-500" /> Çekiliş</span>
                  <Switch checked={raffleOn} onCheckedChange={setRaffleOn} />
                </div>
                {raffleOn && (
                  <div className="space-y-2">
                    {prizes.map((p, i) => (
                      <div key={i} className="flex gap-2">
                        <Input placeholder="Ödül (ör. Bluetooth kulaklık)" value={p.name} onChange={(e) => setPrize(i, { name: e.target.value })} />
                        <Input type="number" className="w-20" min={1} value={p.count} onChange={(e) => setPrize(i, { count: Number(e.target.value) })} title="Kaç kişi" />
                        <Button variant="ghost" size="icon" onClick={() => setPrizes((a) => a.filter((_, idx) => idx !== i))} aria-label="Sil"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setPrizes((a) => [...a, emptyPrize()])}><Plus className="h-4 w-4 mr-1" /> Ödül ekle</Button>
                    <Button className="w-full mt-1" onClick={drawRaffle} disabled={busy === 'raffle'}>
                      {busy === 'raffle' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />} Çekilişi Yap
                    </Button>
                  </div>
                )}
              </div>

              {/* SORU-YARIŞMASI */}
              <div className="rounded-xl border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm flex items-center gap-1.5"><Trophy className="h-4 w-4 text-amber-500" /> Soru-Yarışması</span>
                  <Switch checked={quizOn} onCheckedChange={setQuizOn} />
                </div>
                {quizOn && (
                  <div className="space-y-4">
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
                              <input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi} onChange={() => setQ(qi, { correctIndex: oi })} title="Doğru cevap" />
                              <Input placeholder={`Şık ${oi + 1}`} value={o} onChange={(e) => setOpt(qi, oi, e.target.value)} />
                              {q.options.length > 2 && (
                                <Button variant="ghost" size="icon" onClick={() => setQ(qi, { options: q.options.filter((_, k) => k !== oi), correctIndex: 0 })} aria-label="Şık sil"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                              )}
                            </div>
                          ))}
                          {q.options.length < 6 && (
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setQ(qi, { options: [...q.options, ''] })}><Plus className="h-3 w-3 mr-1" /> Şık ekle</Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[11px]">Süre (sn)</Label>
                            <Input type="number" min={5} max={120} value={q.timeLimitSec} onChange={(e) => setQ(qi, { timeLimitSec: Number(e.target.value) })} />
                          </div>
                          <div>
                            <Label className="text-[11px]">Kaç kişi kazanır</Label>
                            <Input type="number" min={1} value={q.winnerCount} onChange={(e) => setQ(qi, { winnerCount: Number(e.target.value) })} />
                          </div>
                          <div>
                            <Label className="text-[11px]">Kazanma kuralı</Label>
                            <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={q.winnerRule} onChange={(e) => setQ(qi, { winnerRule: e.target.value as 'first' | 'raffle' })}>
                              <option value="first">İlk doğru cevaplayan</option>
                              <option value="raffle">Doğrular arasında çekiliş</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-[11px]">Ödül adı</Label>
                            <Input placeholder="ör. Kitap seti" value={q.prizeName || ''} onChange={(e) => setQ(qi, { prizeName: e.target.value })} />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input type="checkbox" checked={q.checkinOnly} onChange={(e) => setQ(qi, { checkinOnly: e.target.checked })} />
                          Yalnız check-in yapanlar cevaplayabilsin (kopya önleme)
                        </label>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setQuestions((a) => [...a, emptyQuestion()])}><Plus className="h-4 w-4 mr-1" /> Soru ekle</Button>
                    <p className="text-[11px] text-muted-foreground">Canlı "Sor" butonu etkinlik gününde bu ekrana gelir. Şimdilik soruları kaydet.</p>
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={save} disabled={busy === 'save'}>
                {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Ödül Ayarlarını Kaydet
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
