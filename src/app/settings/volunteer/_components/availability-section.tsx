'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';

const toggle = (list: string[], item: string, checked: boolean) =>
  checked ? [...list, item] : list.filter(x => x !== item);

const TIME_OF_DAY_DEFAULTS: Record<string, { from: string; to: string }> = {
  'Gündüz': { from: '09:00', to: '17:00' },
  'Akşam': { from: '18:00', to: '22:00' },
};

export type TimeRange = { from?: string; to?: string };

export const AvailabilitySection = ({
  days,
  onDaysChange,
  times,
  onTimesChange,
  timeRanges,
  onTimeRangesChange,
  workModes,
  onWorkModesChange,
}: {
  days: string[];
  onDaysChange: (next: string[]) => void;
  times: string[];
  onTimesChange: (next: string[]) => void;
  timeRanges: Record<string, TimeRange>;
  onTimeRangesChange: (next: Record<string, TimeRange>) => void;
  workModes: string[];
  onWorkModesChange: (next: string[]) => void;
}) => {
  const handleTimeToggle = (t: string, checked: boolean) => {
    onTimesChange(toggle(times, t, checked));
    if (checked && !timeRanges[t]) {
      onTimeRangesChange({ ...timeRanges, [t]: TIME_OF_DAY_DEFAULTS[t] ?? { from: '', to: '' } });
    }
  };

  const handleRangeChange = (t: string, field: 'from' | 'to', value: string) => {
    onTimeRangesChange({
      ...timeRanges,
      [t]: { ...(timeRanges[t] ?? {}), [field]: value },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Müsaitlik & Çalışma Şekli</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Hangi günlerde uygunsun?</Label>
          <div className="grid grid-cols-2 gap-2">
            {['Hafta içi', 'Hafta sonu'].map(d => (
              <label key={d} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
                <Checkbox
                  checked={days.includes(d)}
                  onCheckedChange={c => onDaysChange(toggle(days, d, !!c))}
                />
                <span className="text-sm">{d}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Hangi saatlerde uygunsun?</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['Gündüz', 'Akşam'] as const).map(t => (
              <label key={t} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
                <Checkbox
                  checked={times.includes(t)}
                  onCheckedChange={c => handleTimeToggle(t, !!c)}
                />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>
          {(['Gündüz', 'Akşam'] as const).filter(t => times.includes(t)).map(t => {
            const range = timeRanges[t] ?? TIME_OF_DAY_DEFAULTS[t];
            return (
              <div key={`range-${t}`} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t} saat aralığı</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`from-${t}`} className="text-xs text-muted-foreground">Başlangıç</Label>
                    <Input
                      id={`from-${t}`}
                      type="time"
                      value={range?.from ?? ''}
                      onChange={e => handleRangeChange(t, 'from', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`to-${t}`} className="text-xs text-muted-foreground">Bitiş</Label>
                    <Input
                      id={`to-${t}`}
                      type="time"
                      value={range?.to ?? ''}
                      onChange={e => handleRangeChange(t, 'to', e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Çalışma Şekli</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {['Sahada', 'Online', 'Hibrit'].map(m => (
              <label key={m} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
                <Checkbox
                  checked={workModes.includes(m)}
                  onCheckedChange={c => onWorkModesChange(toggle(workModes, m, !!c))}
                />
                <span className="text-sm">{m}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
