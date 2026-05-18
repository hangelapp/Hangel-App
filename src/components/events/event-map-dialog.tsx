'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { Event } from '@/lib/types';

// Leaflet'in window'a erişimi nedeniyle SSR'da yüklenemez — dynamic import ile kapatıyoruz.
const EventMap = dynamic(() => import('./event-map').then(m => m.EventMap), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

export function EventMapDialog({
  open,
  onOpenChange,
  events,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Event[];
}) {
  const physicalEvents = useMemo(
    () => events.filter(e => e.type !== 'Online'),
    [events],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Etkinlik Haritası</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fiziksel etkinlikler şehir konumlarına göre haritada görünür. Bir nokta çoklu etkinlik içeriyorsa hepsi listelenir.
          </p>
        </DialogHeader>
        <div className="h-[70vh] w-full">
          {open && <EventMap events={physicalEvents} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
