'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { Volunteering } from '@/lib/types';

const VolunteeringMap = dynamic(() => import('./volunteering-map').then(m => m.VolunteeringMap), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

export function VolunteeringMapDialog({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Volunteering[];
}) {
  const physicalItems = useMemo(
    () => items.filter(opp => opp.location?.type !== 'Online'),
    [items],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Gönüllülük Haritası</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fiziksel gönüllülük ilanları şehir konumlarına göre haritada görünür. Bir nokta çoklu ilan içeriyorsa hepsi listelenir.
          </p>
        </DialogHeader>
        <div className="h-[70vh] w-full">
          {open && <VolunteeringMap items={physicalItems} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
