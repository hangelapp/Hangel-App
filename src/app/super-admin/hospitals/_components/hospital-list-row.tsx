'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, MapPinned, Pencil, Navigation } from 'lucide-react';

import type { HospitalDoc } from './types';

interface Props {
  hospital: HospitalDoc;
  onEdit: (h: HospitalDoc) => void;
  labels: {
    edit: string;
    hasCoords: string;
    missingAddress: string;
    missingCity: string;
    missingDistrict: string;
    sourceOsm: string;
    sourceSb: string;
    sourceUnknown: string;
  };
}

// Tek hastane satırı — kart benzeri liste item. Eksik alanlar amber/rose
// badge ile vurgulanır; sağda Edit butonu dialog'u açar.
export const HospitalListRow = React.memo(function HospitalListRow({ hospital, onEdit, labels }: Props) {
  const hasCoords = typeof hospital.lat === 'number' && typeof hospital.lng === 'number';
  const missingAddress = !hospital.address || hospital.address.trim() === '';
  const missingCity = !hospital.city || hospital.city.trim() === '';
  const missingDistrict = !hospital.district || hospital.district.trim() === '';

  const sourceLabel = (() => {
    const id = hospital.id || '';
    if (id.startsWith('osm-')) return labels.sourceOsm;
    if (id.startsWith('sb-')) return labels.sourceSb;
    if (hospital.source) return hospital.source;
    return labels.sourceUnknown;
  })();

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 p-5 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-base text-[#1d1d1f] truncate">
            {hospital.name || '—'}
          </p>
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide">
            {sourceLabel}
          </Badge>
          {hasCoords && (
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border-emerald-200">
              <Navigation className="h-3 w-3 mr-1" />
              {labels.hasCoords}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
          <MapPinned className="h-3.5 w-3.5 shrink-0" />
          <span>{hospital.city || '—'}</span>
          <span className="opacity-40">/</span>
          <span>{hospital.district || '—'}</span>
          {hospital.neighborhood && (
            <>
              <span className="opacity-40">/</span>
              <span>{hospital.neighborhood}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{hospital.address || '—'}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {missingAddress && (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-semibold text-[10px]">
              {labels.missingAddress}
            </Badge>
          )}
          {missingCity && (
            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 font-semibold text-[10px]">
              {labels.missingCity}
            </Badge>
          )}
          {missingDistrict && (
            <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 font-semibold text-[10px]">
              {labels.missingDistrict}
            </Badge>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <Button variant="outline" size="sm" onClick={() => onEdit(hospital)} className="rounded-xl">
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          {labels.edit}
        </Button>
      </div>
    </div>
  );
});
