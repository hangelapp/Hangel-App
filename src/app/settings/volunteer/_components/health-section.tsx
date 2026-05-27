'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HeartPulse, Bell } from 'lucide-react';

const BLOOD_TYPES = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-', 'Bilinmiyor'];

export const HealthSection = ({
  bloodType,
  onBloodTypeChange,
  bloodNotifications,
  onBloodNotificationsChange,
  emergencyAvailable,
  onEmergencyAvailableChange,
  hasChronicIllness,
  onHasChronicIllnessChange,
  usesRegularMedication,
  onUsesRegularMedicationChange,
}: {
  bloodType: string;
  onBloodTypeChange: (v: string) => void;
  bloodNotifications: boolean;
  onBloodNotificationsChange: (v: boolean) => void;
  emergencyAvailable: boolean;
  onEmergencyAvailableChange: (v: boolean) => void;
  hasChronicIllness: boolean;
  onHasChronicIllnessChange: (v: boolean) => void;
  usesRegularMedication: boolean;
  onUsesRegularMedicationChange: (v: boolean) => void;
}) => {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-primary" /> Sağlık Durumu</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {/* Cinsiyet alanı Kişisel Bilgileri Düzenle sayfasına taşındı. */}
        <div className="space-y-2 p-4 border rounded-lg">
          <Label>Kan Grubu</Label>
          <Select value={bloodType || ''} onValueChange={onBloodTypeChange}>
            <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
            <SelectContent>
              {BLOOD_TYPES.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <Bell className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Kan ilanlarında bildirim al</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Senin kan grubuna uygun acil kan ihtiyacı bildirimleri telefonuna ve uygulamaya iletilir.
              </p>
            </div>
          </div>
          <Switch checked={bloodNotifications} onCheckedChange={onBloodNotificationsChange} />
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <Label htmlFor="emergency-available" className="font-medium">Acil durumlarda gönüllülüğe uygunum</Label>
          <Switch id="emergency-available" checked={emergencyAvailable} onCheckedChange={onEmergencyAvailableChange} />
        </div>
        <div className="flex items-center space-x-2 p-4 border rounded-lg">
          <Checkbox id="chronic-illness" checked={hasChronicIllness} onCheckedChange={c => onHasChronicIllnessChange(!!c)} />
          <Label htmlFor="chronic-illness" className="text-sm">Kronik bir rahatsızlığım var.</Label>
        </div>
        <div className="flex items-center space-x-2 p-4 border rounded-lg">
          <Checkbox id="regular-medication" checked={usesRegularMedication} onCheckedChange={c => onUsesRegularMedicationChange(!!c)} />
          <Label htmlFor="regular-medication" className="text-sm">Düzenli ilaç kullanıyorum.</Label>
        </div>
      </CardContent>
    </Card>
  );
};
