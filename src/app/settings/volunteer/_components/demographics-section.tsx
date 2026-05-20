'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Country } from 'country-state-city';
import { Calendar, Globe, UserCircle } from 'lucide-react';

export const DemographicsSection = ({
  title,
  birthDate,
  onBirthDateChange,
  nationality,
  onNationalityChange,
}: {
  title: string;
  birthDate: string;
  onBirthDateChange: (v: string) => void;
  nationality: string;
  onNationalityChange: (v: string) => void;
}) => {
  // Country dropdown options: Türkiye + KKTC pinned, then rest alphabetically
  const countryOptions = useMemo(() => {
    const rest = Country.getAllCountries()
      .map(c => ({ name: c.name, code: c.isoCode }))
      .filter(c => c.name !== 'Turkey' && c.name !== 'Cyprus')
      .sort((a, b) => a.name.localeCompare(b.name));
    return [
      { name: 'Türkiye', code: 'TR' },
      { name: 'KKTC (Kuzey Kıbrıs)', code: 'CY-KKTC' },
      ...rest,
    ];
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary" /> {title}</CardTitle>
        <CardDescription>Doğum tarihin ve uyruğun. Sadece sen ve süper admin görür.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Doğum Tarihi</Label>
            <Input
              type="date"
              value={birthDate || ''}
              onChange={(e) => onBirthDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Uyruk</Label>
            <Select value={nationality || ''} onValueChange={onNationalityChange}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Uyruk seçin..." /></SelectTrigger>
              <SelectContent className="max-h-72">
                {countryOptions.map(c => (
                  <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
