'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone } from 'lucide-react';
import { countryPhoneCodes } from '@/lib/data';
import type { EmergencyContact } from './types';

export const EmergencyContactsSection = ({
  contacts,
  onContactChange,
}: {
  contacts: EmergencyContact[];
  onContactChange: (index: number, field: 'name' | 'phone', value: string) => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /> Acil Durum Kişileri (İsteğe Bağlı)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Birinci Kişi</Label>
          <Input placeholder="Ad Soyad" value={contacts[0]?.name || ''} onChange={e => onContactChange(0, 'name', e.target.value)} />
          <div className="flex gap-2">
            <div className="w-[80px] shrink-0">
              <Select defaultValue="90">
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{[...new Set(countryPhoneCodes)].map(c => <SelectItem key={c} value={c}>+{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Input type="tel" placeholder="5XX..." value={contacts[0]?.phone || ''} onChange={e => onContactChange(0, 'phone', e.target.value)} className="flex-1" />
          </div>
        </div>
        <div className="space-y-4 pt-4 border-t border-dashed">
          <Label className="text-xs font-bold uppercase text-muted-foreground">İkinci Kişi</Label>
          <Input placeholder="Ad Soyad" value={contacts[1]?.name || ''} onChange={e => onContactChange(1, 'name', e.target.value)} />
          <div className="flex gap-2">
            <div className="w-[80px] shrink-0">
              <Select defaultValue="90">
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{[...new Set(countryPhoneCodes)].map(c => <SelectItem key={c} value={c}>+{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Input type="tel" placeholder="5XX..." value={contacts[1]?.phone || ''} onChange={e => onContactChange(1, 'phone', e.target.value)} className="flex-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
