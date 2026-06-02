'use client';

/**
 * Completion scoring dialog — tamamlanan ilanın gönüllüsüne 1-5 puan +
 * opsiyonel yorum girilen modal. Parent (page) `onSubmit` ile değerleri alır
 * ve certificates write + bildirim emission'ı yapar.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Star } from 'lucide-react';
import { useTranslation } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteerName: string;
  listingTitle: string;
  onSubmit: (payload: { score: number; comment: string }) => Promise<void> | void;
  submitting?: boolean;
};

export function CompletionScoringDialog({
  open,
  onOpenChange,
  volunteerName,
  listingTitle,
  onSubmit,
  submitting,
}: Props) {
  const { t } = useTranslation();
  const [score, setScore] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  // Modal her açıldığında state'i sıfırlamak: aynı dialog'u farklı volunteer
  // için tekrar tekrar açıyoruz — eski skor sızmamalı.
  React.useEffect(() => {
    if (open) {
      setScore(0);
      setComment('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (score < 1 || score > 5) return;
    void onSubmit({ score, comment: comment.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('ngo_admin_volunteering.scoring.title')}</DialogTitle>
          <DialogDescription>
            {t('ngo_admin_volunteering.scoring.descPrefix')} <strong>{volunteerName}</strong>
            {t('ngo_admin_volunteering.scoring.descMiddle')} <strong>{listingTitle}</strong>
            {t('ngo_admin_volunteering.scoring.descSuffix')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('ngo_admin_volunteering.scoring.scoreLabel')}</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScore(n)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${n} ${t('ngo_admin_volunteering.scoring.starsAria')}`}
                >
                  <Star
                    className={cn(
                      'h-7 w-7',
                      n <= score ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {score > 0 ? `${score}/5` : t('ngo_admin_volunteering.scoring.selectScoreHint')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scoring-comment">
              {t('ngo_admin_volunteering.scoring.commentLabel')}
            </Label>
            <Textarea
              id="scoring-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder={t('ngo_admin_volunteering.scoring.commentPlaceholder')}
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            {t('ngo_admin_volunteering.scoring.kvkkNote')}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('ngo_admin_volunteering.scoring.cancelBtn')}
          </Button>
          <Button onClick={handleConfirm} disabled={submitting || score < 1}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('ngo_admin_volunteering.scoring.confirmBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
