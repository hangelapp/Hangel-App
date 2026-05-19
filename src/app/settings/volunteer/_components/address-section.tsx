'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

export const AddressSection = ({
  neighborhood,
  onNeighborhoodChange,
  street,
  onStreetChange,
  doorNo,
  onDoorNoChange,
}: {
  neighborhood: string;
  onNeighborhoodChange: (v: string) => void;
  street: string;
  onStreetChange: (v: string) => void;
  doorNo: string;
  onDoorNoChange: (v: string) => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Detaylı Adres Bilgileri</CardTitle>
        <p className="text-xs text-muted-foreground mt-2">Acil durum ve gönüllülük lojistiği için detaylı adres bilgileri.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Mahalle</Label>
          <Input value={neighborhood} onChange={e => onNeighborhoodChange(e.target.value)} placeholder="Mahalle adı" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sokak / Cadde</Label>
            <Input value={street} onChange={e => onStreetChange(e.target.value)} placeholder="Sokak adı" />
          </div>
          <div className="space-y-2">
            <Label>Bina / Kapı No</Label>
            <Input value={doorNo} onChange={e => onDoorNoChange(e.target.value)} placeholder="Bina no / Daire" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
