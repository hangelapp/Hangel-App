'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { allProvinces, districtsData, neighborhoodsData } from '@/lib/data';
import type { NeighborhoodsMap } from './types';

export const MuhtarSection = ({
  isMuhtar,
  onIsMuhtarChange,
  il,
  onIlChange,
  ilce,
  onIlceChange,
  mahalle,
  onMahalleChange,
}: {
  isMuhtar: boolean;
  onIsMuhtarChange: (v: boolean) => void;
  il: string;
  onIlChange: (v: string) => void;
  ilce: string;
  onIlceChange: (v: string) => void;
  mahalle: string;
  onMahalleChange: (v: string) => void;
}) => {
  const ilceler = useMemo(() => il ? (districtsData[il] ?? []) : [], [il]);
  const mahalleler = useMemo(
    () => (il && ilce) ? ((neighborhoodsData as NeighborhoodsMap)[il]?.[ilce] ?? []) : [],
    [il, ilce],
  );

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Mahalle Muhtarıyım</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3 p-4 border rounded-lg">
          <Label htmlFor="is-muhtar" className="font-medium min-w-0">Mahalle muhtarıyım</Label>
          <Switch id="is-muhtar" checked={isMuhtar} onCheckedChange={onIsMuhtarChange} className="shrink-0" />
        </div>
        {isMuhtar && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>İl</Label>
              <Select value={il} onValueChange={v => { onIlChange(v); onIlceChange(''); onMahalleChange(''); }}>
                <SelectTrigger><SelectValue placeholder="İl seçiniz..." /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {allProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {il && (
              <div className="space-y-2">
                <Label>İlçe</Label>
                <Select value={ilce} onValueChange={v => { onIlceChange(v); onMahalleChange(''); }}>
                  <SelectTrigger><SelectValue placeholder="İlçe seçiniz..." /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {ilceler.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {ilce && mahalleler.length > 0 && (
              <div className="space-y-2">
                <Label>Mahalle</Label>
                <Select value={mahalle} onValueChange={onMahalleChange}>
                  <SelectTrigger><SelectValue placeholder="Mahalle seçiniz..." /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {mahalleler.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
