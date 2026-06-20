'use client';

/**
 * Completion dialog — "B yolu": tamamlamayı GÖNÜLLÜ değil YÖNETİCİ girer.
 *
 * Yönetici iki şey girer:
 *   1. Kaç SAAT çalışıldı
 *   2. Hangi İŞ KALEMİ yapıldı (süper-admin volunteerScoring kataloğu)
 *
 * Sistem puan + mali değeri (₺) OTOMATİK hesaplar (manuel girilmez) ve canlı
 * önizler. Parent (page) `onSubmit({ hours, taskTypeId })` ile değerleri alır;
 * `/api/volunteering/{id}/complete-volunteer` çağrısı tamamlamayı oluşturup
 * ANINDA onaylar (ngoApproved: true).
 */

import React, { useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Award } from 'lucide-react';

/** Süper-admin iş kalemi kataloğu satırı (volunteerScoring). */
export type ScoringItem = {
  id: string;
  taskType: string;
  pointsPerHour: number;
  manHourCost: number;
  isActive: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteerName: string;
  listingTitle: string;
  scoringItems: ScoringItem[];
  onSubmit: (payload: { hours: number; taskTypeId: string; notes: string }) => Promise<void> | void;
  submitting?: boolean;
};

export function CompletionScoringDialog({
  open,
  onOpenChange,
  volunteerName,
  listingTitle,
  scoringItems,
  onSubmit,
  submitting,
}: Props) {
  const [taskTypeId, setTaskTypeId] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Modal her açıldığında state'i sıfırla — aynı dialog farklı gönüllü için
  // tekrar açılıyor; eski değerler sızmamalı.
  React.useEffect(() => {
    if (open) {
      setTaskTypeId('');
      setHours('');
      setNotes('');
    }
  }, [open]);

  const activeItems = useMemo(() => scoringItems.filter((i) => i.isActive), [scoringItems]);
  const selected = useMemo(
    () => activeItems.find((i) => i.id === taskTypeId) ?? null,
    [activeItems, taskTypeId],
  );

  const hoursNum = Number(hours) || 0;
  const computedPoints = selected ? Math.round(selected.pointsPerHour * hoursNum) : 0;
  const computedValue = selected ? Math.round(selected.manHourCost * hoursNum) : 0;

  const canSubmit = !!selected && hoursNum > 0 && !submitting;

  const handleConfirm = () => {
    if (!selected || hoursNum <= 0) return;
    void onSubmit({ hours: hoursNum, taskTypeId: selected.id, notes: notes.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tamamlamayı işle</DialogTitle>
          <DialogDescription>
            <strong>{volunteerName}</strong> için <strong>{listingTitle}</strong> ilanında yapılan
            işi ve süreyi girin. Puan ve mali değer otomatik hesaplanır; kayıt anında onaylanır.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="completion-task-type">Yapılan iş kalemi</Label>
            <Select value={taskTypeId} onValueChange={setTaskTypeId}>
              <SelectTrigger id="completion-task-type">
                <SelectValue
                  placeholder={
                    activeItems.length === 0 ? 'Katalog boş — süper-admin doldurmalı' : 'Seçiniz...'
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[50vh] overflow-y-auto overscroll-contain">
                {activeItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.taskType}{' '}
                    <span className="text-muted-foreground text-xs">({item.pointsPerHour} pt/saat)</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completion-hours">Çalışılan saat</Label>
            <Input
              id="completion-hours"
              type="number"
              min={0}
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Örn. 4"
            />
          </div>

          {selected && hoursNum > 0 && (
            <div className="space-y-2 p-3 bg-primary/5 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    İş Kalemi Puanı (taban)
                  </p>
                  <p className="text-2xl font-black text-primary tabular-nums">
                    {computedPoints.toLocaleString('tr-TR')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {selected.pointsPerHour} pt × {hoursNum} saat
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Sosyal Etki Mali Değeri
                  </p>
                  <p className="text-2xl font-black text-primary tabular-nums">
                    {computedValue.toLocaleString('tr-TR')} ₺
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {selected.manHourCost} ₺ × {hoursNum} saat (adam-saat)
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed border-t pt-2">
                <strong>Not:</strong> Gönüllünün <strong>kendi mesleğine</strong> göre ek puan otomatik
                eklenir. Mali değer hesabında sadece iş kaleminin adam-saat değeri baz alınır.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="completion-notes">Not (opsiyonel)</Label>
            <Textarea
              id="completion-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Kısa açıklama (kaç kişiye ulaşıldı vb.)"
            />
          </div>

          {activeItems.length === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              Henüz iş kalemi yok. Süper-admin{' '}
              <code className="text-[10px]">/super-admin/settings/volunteer-scoring</code> üzerinden
              katalog oluşturmalı.
            </p>
          )}

          <p className="text-[11px] text-muted-foreground">
            Bu kayıt gönüllünün profilinde KVKK uyumlu olarak saklanır ve yalnızca kullanıcının kendi
            izniyle dış kurumlarla paylaşılır.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Vazgeç
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Award className="mr-2 h-4 w-4" />
            )}
            Onayla ve sertifika ver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
