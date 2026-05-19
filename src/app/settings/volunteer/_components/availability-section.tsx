'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock } from 'lucide-react';

const toggle = (list: string[], item: string, checked: boolean) =>
  checked ? [...list, item] : list.filter(x => x !== item);

export const AvailabilitySection = ({
  days,
  onDaysChange,
  times,
  onTimesChange,
  workModes,
  onWorkModesChange,
}: {
  days: string[];
  onDaysChange: (next: string[]) => void;
  times: string[];
  onTimesChange: (next: string[]) => void;
  workModes: string[];
  onWorkModesChange: (next: string[]) => void;
}) => {
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
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Hangi saatlerde uygunsun?</Label>
          <div className="grid grid-cols-2 gap-2">
            {['Gündüz', 'Akşam'].map(t => (
              <label key={t} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
                <Checkbox
                  checked={times.includes(t)}
                  onCheckedChange={c => onTimesChange(toggle(times, t, !!c))}
                />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>
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
