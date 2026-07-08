'use client';

/**
 * EventChecklistButton — etkinlik yönetimi kartında "Checklist" butonu + modal.
 * Yöneticiye etkinliğin başarılı geçmesi için etkinlik ÖNCESİ / GÜNÜ / SONRASI
 * kontrol etmesi gereken maddeleri gösterir. Maddeler işaretlenebilir ve etkinlik
 * dokümanına (events/{id}.managerChecklist) kaydedilir → ilerleme kalıcıdır.
 *
 * Sabit rehber maddeler (herkese aynı iyi-etkinlik kontrol listesi); işaret durumu
 * etkinliğe özeldir. Firestore write client-side (owner, rules: status dışı update).
 */
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ListChecks, Loader2, Check } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Kontrol listesi — üç faz. `key` Firestore'da işaret durumunu tutar (stabil kalmalı).
const CHECKLIST: Array<{ phase: string; items: Array<{ key: string; label: string }> }> = [
  {
    phase: 'Etkinlik Öncesi',
    items: [
      { key: 'pre_details', label: 'Etkinlik adı, tarih, saat ve konum bilgileri doğru ve eksiksiz.' },
      { key: 'pre_agenda', label: 'Etkinlik programı (akış) girildi ve detay sayfasında yayınlandı.' },
      { key: 'pre_speakers', label: 'Konuşmacı / sanatçı / ekip listesi eklendi.' },
      { key: 'pre_capacity', label: 'Kapasite / kontenjan belirlendi.' },
      { key: 'pre_promote', label: 'Etkinlik sosyal medyada ve Google’da (Ad Grants) tanıtıldı.' },
      { key: 'pre_qr', label: 'Kayıt QR ve Check-in QR oluşturuldu, gerekiyorsa yazdırıldı.' },
      { key: 'pre_venue', label: 'Mekan / online bağlantı teyit edildi (fiziksel: yönlendirme, online: link testi).' },
      { key: 'pre_reminder', label: 'Katılımcılara hatırlatma mesajı gönderildi.' },
    ],
  },
  {
    phase: 'Etkinlik Günü',
    items: [
      { key: 'day_checkin', label: 'Check-in QR ile katılımcı girişleri alınıyor.' },
      { key: 'day_start', label: 'Etkinlik zamanında başlatıldı (canlı mod otomatik açılır).' },
      { key: 'day_badges', label: 'Yaka kartları hazır / dağıtıldı.' },
      { key: 'day_support', label: 'Teknik ve lojistik destek hazır (ses, görüntü, ikram, yönlendirme).' },
      { key: 'day_capture', label: 'Fotoğraf / video çekimi ve içerik üretimi yapıldı.' },
    ],
  },
  {
    phase: 'Etkinlik Sonrası',
    items: [
      { key: 'post_complete', label: '“Tamamla” ile etkinlik kapatıldı ve katılımcılar değerlendirildi.' },
      { key: 'post_certificates', label: 'Katılım sertifikaları oluşturuldu / gönderildi.' },
      { key: 'post_thanks', label: 'Katılımcılara teşekkür / geri bildirim mesajı gönderildi.' },
      { key: 'post_report', label: 'Katılım, geri bildirim ve etki verileri raporlandı.' },
    ],
  },
];

const TOTAL = CHECKLIST.reduce((n, g) => n + g.items.length, 0);

export function EventChecklistButton({
  eventId,
  checklist,
  className,
}: {
  eventId: string;
  /** events/{id}.managerChecklist — { [key]: true } işaretli maddeler. */
  checklist?: Record<string, boolean>;
  className?: string;
}) {
  const db = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  // Optimistik yerel durum; kaydedilince Firestore snapshot ile senkronlanır.
  const [localState, setLocalState] = useState<Record<string, boolean>>({});

  const checked = useMemo(() => ({ ...(checklist || {}), ...localState }), [checklist, localState]);
  const doneCount = useMemo(
    () => CHECKLIST.reduce((n, g) => n + g.items.filter((it) => checked[it.key]).length, 0),
    [checked],
  );

  const toggle = async (key: string) => {
    const next = !checked[key];
    setLocalState((s) => ({ ...s, [key]: next }));
    setSavingKey(key);
    try {
      await updateDoc(doc(db, COLLECTIONS.events, eventId), {
        [`managerChecklist.${key}`]: next,
      });
    } catch (err) {
      // Geri al + uyar
      setLocalState((s) => ({ ...s, [key]: !next }));
      console.error('[event-checklist] update failed', err);
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: 'İşaret kaydedilemedi. Tekrar deneyin.' });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className={cn('rounded-xl w-full sm:w-auto', className)} onClick={() => setOpen(true)}>
        <ListChecks className="h-4 w-4 mr-1.5" /> Checklist
        <span className="ml-1.5 tabular-nums text-xs text-muted-foreground">{doneCount}/{TOTAL}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" /> Etkinlik Checklist
            </DialogTitle>
            <DialogDescription>
              Etkinliğinizin başarılı geçmesi için kontrol listesi. İşaretlediklerin kaydedilir.
            </DialogDescription>
          </DialogHeader>

          {/* İlerleme çubuğu */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Tamamlanan</span>
              <span className="tabular-nums">{doneCount} / {TOTAL}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${TOTAL ? (doneCount / TOTAL) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-5 pt-1">
            {CHECKLIST.map((group) => (
              <div key={group.phase} className="space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">{group.phase}</p>
                <ul className="space-y-1.5">
                  {group.items.map((it) => {
                    const isChecked = !!checked[it.key];
                    return (
                      <li key={it.key}>
                        <button
                          type="button"
                          onClick={() => toggle(it.key)}
                          disabled={savingKey === it.key}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                            isChecked ? 'border-primary/30 bg-primary/5' : 'border-border hover:bg-muted/50',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                              isChecked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                            )}
                          >
                            {savingKey === it.key ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isChecked ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : null}
                          </span>
                          <span className={cn('text-sm leading-snug', isChecked ? 'text-foreground' : 'text-muted-foreground')}>
                            {it.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
