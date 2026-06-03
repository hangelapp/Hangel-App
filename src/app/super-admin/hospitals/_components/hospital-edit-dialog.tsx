'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, MapPin, Phone, Globe, Save, X, Navigation } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationFields } from '@/components/shared/location-fields';

import type { HospitalDoc, HospitalEditForm } from './types';

interface Props {
  hospital: HospitalDoc | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (id: string, patch: HospitalEditForm) => Promise<void>;
  labels: {
    title: string;
    description: string;
    name: string;
    namePlaceholder: string;
    address: string;
    addressPlaceholder: string;
    phone: string;
    website: string;
    postcode: string;
    openInMaps: string;
    coordsMissing: string;
    cancel: string;
    save: string;
    saving: string;
  };
}

// Tek hastane edit dialog. Form alanları HospitalEditForm shape'iyle birebir;
// `onSave` Firestore updateDoc'u parent yapar (parent sayfayı toast/state akışı
// için kontrolünde tutar). LocationFields ülke seçimi gizli — hospitals her
// zaman Türkiye'de (showCountry={false}).
export const HospitalEditDialog = ({ hospital, open, onOpenChange, onSave, labels }: Props) => {
  const [form, setForm] = useState<HospitalEditForm>({
    name: '',
    city: '',
    district: '',
    neighborhood: '',
    address: '',
    phone: '',
    website: '',
    postcode: '',
  });
  const [saving, setSaving] = useState(false);

  // Hidrasyon: dialog açıldığında / hastane değiştiğinde form'u yeniden doldur.
  useEffect(() => {
    if (!hospital) return;
    setForm({
      name: hospital.name ?? '',
      city: hospital.city ?? '',
      district: hospital.district ?? '',
      neighborhood: hospital.neighborhood ?? '',
      address: hospital.address ?? '',
      phone: hospital.phone ?? '',
      website: hospital.website ?? '',
      postcode: hospital.postcode ?? '',
    });
  }, [hospital]);

  const handleSave = async () => {
    if (!hospital?.id) return;
    setSaving(true);
    try {
      await onSave(hospital.id, form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const hasCoords = !!hospital && typeof hospital.lat === 'number' && typeof hospital.lng === 'number';
  const mapsHref = hasCoords && hospital
    ? `https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lng}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="hospital-name">{labels.name}</Label>
            <Input
              id="hospital-name"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder={labels.namePlaceholder}
              className="h-11 rounded-xl"
            />
          </div>

          <LocationFields
            value={{
              city: form.city,
              district: form.district,
              neighborhood: form.neighborhood,
            }}
            onChange={(next) => setForm(prev => ({
              ...prev,
              city: next.city ?? '',
              district: next.district ?? '',
              neighborhood: next.neighborhood ?? '',
            }))}
            showCountry={false}
            showNeighborhood
          />

          <div className="space-y-2">
            <Label htmlFor="hospital-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {labels.address}
            </Label>
            <Input
              id="hospital-address"
              value={form.address}
              onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder={labels.addressPlaceholder}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hospital-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {labels.phone}
              </Label>
              <Input
                id="hospital-phone"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                inputMode="tel"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hospital-postcode">{labels.postcode}</Label>
              <Input
                id="hospital-postcode"
                value={form.postcode}
                onChange={(e) => setForm(prev => ({ ...prev, postcode: e.target.value }))}
                inputMode="numeric"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hospital-website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> {labels.website}
            </Label>
            <Input
              id="hospital-website"
              value={form.website}
              onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
              type="url"
              placeholder="https://"
              className="h-11 rounded-xl"
            />
          </div>

          {mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <Navigation className="h-4 w-4" />
              {labels.openInMaps}
            </a>
          ) : (
            <p className="text-xs text-muted-foreground italic">{labels.coordsMissing}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="h-4 w-4 mr-1.5" />
            {labels.cancel}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            {saving ? labels.saving : labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
