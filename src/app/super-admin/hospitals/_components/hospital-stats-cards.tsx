'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, MapPin, MapPinned, Navigation } from 'lucide-react';

import type { HospitalStats } from './types';

interface Props {
  stats: HospitalStats;
  loading: boolean;
  labelTotal: string;
  labelMissingAddress: string;
  labelMissingCity: string;
  labelMissingDistrict: string;
}

// Üst bilgi kartları — toplam + 3 eksik metrik. Sayılar bir kez
// `getCountFromServer` ile çekilir (5013 doc'ı client'a indirmeden).
export const HospitalStatsCards = ({
  stats,
  loading,
  labelTotal,
  labelMissingAddress,
  labelMissingCity,
  labelMissingDistrict,
}: Props) => {
  const items: Array<{ key: string; label: string; value: number; icon: React.ReactNode; tone: string }> = [
    { key: 'total', label: labelTotal, value: stats.total, icon: <Building2 className="h-4 w-4" />, tone: 'text-emerald-600' },
    { key: 'addr', label: labelMissingAddress, value: stats.missingAddress, icon: <MapPin className="h-4 w-4" />, tone: 'text-amber-600' },
    { key: 'city', label: labelMissingCity, value: stats.missingCity, icon: <Navigation className="h-4 w-4" />, tone: 'text-orange-600' },
    { key: 'district', label: labelMissingDistrict, value: stats.missingDistrict, icon: <MapPinned className="h-4 w-4" />, tone: 'text-rose-600' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map(item => (
        <Card key={item.key} className="rounded-2xl border-black/5 shadow-sm">
          <CardContent className="p-5 space-y-1.5">
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${item.tone}`}>
              {item.icon}
              {item.label}
            </div>
            <div className="text-3xl font-black tracking-tighter text-[#1d1d1f]">
              {loading ? '...' : item.value.toLocaleString('tr-TR')}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
