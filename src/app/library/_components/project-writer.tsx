'use client';

/**
 * Bölüm 2 — Proje Yazma AI Asistanı (STK admin).
 *
 * Önceki ad: "STK'na Proje Yaz". Kullanıcının görüntü-üst metni "Proje Yazma AI
 * Asistanı" olarak güncellendi. Backend endpoint: `/api/library/project` →
 * `writeProjectProposal` flow.
 *
 * STK admin (veya süper-admin) gate'i `useIsNgoAdmin` ile uygulanır; Dialog (form
 * akışı) yalnızca NGO admin için render edilir. `ProjectWriterCard` ise herkese
 * görünür — STK admin değilse kart tıklanamaz, kırmızı badge + tooltip ile gate
 * açıklanır.
 */

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, Lock, Sparkles, Trash2 } from 'lucide-react';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { useIsNgoAdmin } from '@/hooks/use-is-ngo-admin';

const ENDPOINT = '/api/library/project';
const ACCENT = 'bg-fuchsia-600 text-white';

// PDF #3: kullanıcı projesini hangi kuruma sunacağını seçer; AI o kurumun esaslarına
// uygun proje üretir.
const PROJECT_INSTITUTIONS = [
  'Marka (Kurumsal Sponsor)',
  'STK / Dernek',
  'Vakıf',
  'Üniversite',
  'Belediye',
  'Bakanlık',
  'AB (Avrupa Birliği) Fonları',
  'UNDP',
  'TÜBİTAK',
  'KOSGEB',
  'Diğer',
] as const;

export function ProjectWriterDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  // Görüntü-üst başlık: "Proje Yazma AI Asistanı" (assistant.projectTitle güncellendi).
  const title = t('library.assistant.projectTitle');
  const { toast } = useToast();
  const db = useFirestore();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [institution, setInstitution] = useState<string>('');

  // Süper-admin'in yayınladığı hibe/fon programları — dialog açıldığında lazy yüklenir.
  const fundsRef = useMemoFirebase(() => (open && db ? collection(db, COLLECTIONS.funds) : null), [open, db]);
  const { data: funds } = useCollection<{ id: string; name?: string; provider?: string; status?: string }>(fundsRef);

  const fundInstitutions = useMemo(() => {
    const list = (funds || [])
      .filter(f => f.name && (!f.status || f.status === 'Açık'))
      .map(f => `${f.name}${f.provider ? ` — ${f.provider}` : ''}`);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [funds]);

  const [summary, setSummary] = useState('');
  const [goals, setGoals] = useState('');
  const [audience, setAudience] = useState('');
  const [budget, setBudget] = useState('');
  const [activities, setActivities] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [proposal, setProposal] = useState<string | null>(null);

  const reset = () => {
    setStep(1);
    setInstitution('');
    setSummary('');
    setGoals('');
    setAudience('');
    setBudget('');
    setActivities('');
    setProposal(null);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution,
          sections: { summary, goals, audience, activities, budget },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { fullProposal?: string; reply?: string };
      const text = (data?.fullProposal ?? data?.reply ?? '').toString().trim();
      if (!text) throw new Error('Empty proposal');
      setProposal(text);
      setStep(4);
    } catch {
      toast({
        title: t('library.projectWriter.unavailableTitle'),
        description: t('library.projectWriter.unavailableDesc'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadWord = () => {
    if (!proposal) return;
    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const bodyHtml = proposal
      .split(/\n{2,}/)
      .map(para => `<p>${escapeHtml(para).replace(/\n/g, '<br/>')}</p>`)
      .join('');
    const htmlString =
      `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Proje</title></head><body style="font-family:Calibri,Arial,sans-serif;line-height:1.5;">` +
      bodyHtml +
      `</body></html>`;
    const slug =
      (institution || 'proje-onerisi')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'proje-onerisi';
    const blob = new Blob([htmlString], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canAdvance =
    (step === 1 && institution.length > 0) ||
    (step === 2 && summary.trim().length >= 10) ||
    (step === 3 && (goals.trim().length > 0 || audience.trim().length > 0 || budget.trim().length > 0));

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="rounded-3xl max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${ACCENT}`}>
              <Sparkles className="h-4 w-4" />
            </span>
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step < 4
              ? `${t('library.projectWriter.stepLabel')} ${step} ${t('library.projectWriter.stepOfThree')} ${
                  step === 1
                    ? t('library.projectWriter.step1Desc')
                    : step === 2
                      ? t('library.projectWriter.step2Desc')
                      : t('library.projectWriter.step3Desc')
                }`
              : t('library.projectWriter.step4Desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto bg-muted/20">
          {step === 1 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('library.projectWriter.institutionLabel')}
              </label>
              <Select value={institution} onValueChange={setInstitution}>
                <SelectTrigger>
                  <SelectValue placeholder={t('library.projectWriter.institutionPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {fundInstitutions.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {t('library.projectWriter.openFundsHeader')}
                      </div>
                      {fundInstitutions.map(inst => (
                        <SelectItem key={`fund:${inst}`} value={inst}>{inst}</SelectItem>
                      ))}
                      <div className="px-2 py-1.5 mt-1 border-t text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {t('library.projectWriter.generalInstitutionsHeader')}
                      </div>
                    </>
                  )}
                  {PROJECT_INSTITUTIONS.map(inst => (
                    <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {t('library.projectWriter.institutionHint')}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('library.projectWriter.summaryLabel')}
              </label>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                rows={6}
                maxLength={2000}
                className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('library.projectWriter.summaryPlaceholder')}
              />
              <p className="text-[11px] text-muted-foreground text-right">{summary.length}/2000</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('library.projectWriter.goalsLabel')}
                </label>
                <textarea
                  value={goals}
                  onChange={e => setGoals(e.target.value)}
                  rows={3}
                  maxLength={1500}
                  className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('library.projectWriter.goalsPlaceholder')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('library.projectWriter.audienceLabel')}
                </label>
                <textarea
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('library.projectWriter.audiencePlaceholder')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('library.projectWriter.activitiesLabel')}
                </label>
                <textarea
                  value={activities}
                  onChange={e => setActivities(e.target.value)}
                  rows={2}
                  maxLength={1500}
                  className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('library.projectWriter.activitiesPlaceholder')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('library.projectWriter.budgetLabel')}
                </label>
                <textarea
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('library.projectWriter.budgetPlaceholder')}
                />
              </div>
            </div>
          )}

          {step === 4 && proposal && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {t('library.projectWriter.proposalReadyText')} <strong>{institution}</strong>
              </p>
              <textarea
                readOnly
                value={proposal}
                rows={16}
                className="w-full rounded-lg border bg-background p-3 text-sm font-mono"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleDownloadWord}>
                <Download className="h-4 w-4 mr-2" /> {t('library.projectWriter.downloadWord')}
              </Button>
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-background flex items-center justify-between gap-2">
          {step > 1 && step < 4 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}>
              {t('library.projectWriter.back')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {step < 3 && (
              <Button
                type="button"
                size="sm"
                disabled={!canAdvance}
                onClick={() => setStep(s => (s + 1) as 2 | 3)}
              >
                {t('library.projectWriter.next')}
              </Button>
            )}
            {step === 3 && (
              <Button
                type="button"
                size="sm"
                disabled={submitting || !canAdvance}
                onClick={() => void handleSubmit()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('library.projectWriter.preparing')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> {t('library.projectWriter.generate')}
                  </>
                )}
              </Button>
            )}
            {step === 4 && (
              <Button type="button" size="sm" variant="outline" onClick={reset}>
                <Trash2 className="h-4 w-4 mr-2" /> {t('library.projectWriter.newProject')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Proje Yazma AI Asistanı CTA kartı — herkes görür, STK admin değilse tıklama
 * disable + tooltip ile gate. STK admin ise normal CTA gibi davranır; `onOpen`
 * çağrılır ve parent dialog'u açar.
 *
 * shadcn Card + Badge + Tooltip stack. Tooltip primitive lokal `TooltipProvider`
 * altında mount edilir (uygulamada global provider yok).
 */
export function ProjectWriterCard({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation();
  const { isNgoAdmin, isLoading } = useIsNgoAdmin();
  const locked = !isLoading && !isNgoAdmin;

  const title = t('library.project_writer.title');
  const description = t('library.project_writer.description');
  const badgeText = t('library.project_writer.adminBadge');
  const lockedTooltip = t('library.project_writer.lockedTooltip');

  const cardBody = (
    <Card
      variant="solid"
      className={`flex items-start gap-3 p-4 text-left transition-colors w-full ${
        locked ? 'opacity-70 cursor-not-allowed' : 'hover:bg-accent cursor-pointer'
      }`}
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fuchsia-600 text-white">
        {locked ? <Lock className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{title}</span>
          <Badge
            variant="destructive"
            className="text-[10px] px-2 py-0 leading-4 font-semibold"
          >
            {badgeText}
          </Badge>
        </span>
        <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
      </span>
    </Card>
  );

  if (locked) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-disabled
              aria-label={lockedTooltip}
              className="block w-full text-left"
              onClick={e => e.preventDefault()}
            >
              {cardBody}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{lockedTooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full text-left"
      aria-label={title}
    >
      {cardBody}
    </button>
  );
}
