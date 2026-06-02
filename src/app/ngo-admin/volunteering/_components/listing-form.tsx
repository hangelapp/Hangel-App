'use client';

/**
 * Listing form — used by NGO admins to create or edit a volunteering
 * opportunity (volunteering collection doc).
 *
 * Cerrahi scope: bu component sadece form state'i tutar ve `onSubmit` ile
 * upstream'e değerleri verir. Firestore write çağrısı parent page'de yapılır
 * (tek bir transactional yer — parent ayrıca status / ngoId / createdAt
 * field'larını ekler).
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';
import { useTranslation } from '@/components/providers/language-provider';
import { LocationFields } from '@/components/shared/location-fields';

export type ListingFormValues = {
  title: string;
  description: string;
  applicationStart: string;
  applicationEnd: string;
  eventStart: string;
  eventEnd: string;
  city: string;
  district: string;
  capacity: number;
  skills: string[];
  interests: string[];
};

const EMPTY: ListingFormValues = {
  title: '',
  description: '',
  applicationStart: '',
  applicationEnd: '',
  eventStart: '',
  eventEnd: '',
  city: '',
  district: '',
  capacity: 1,
  skills: [],
  interests: [],
};

type Props = {
  initialValues?: Partial<ListingFormValues>;
  onSubmit: (values: ListingFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
};

export function ListingForm({ initialValues, onSubmit, onCancel, submitting }: Props) {
  const { t } = useTranslation();
  const [values, setValues] = useState<ListingFormValues>({ ...EMPTY, ...initialValues });
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  useEffect(() => {
    if (initialValues) {
      setValues((prev) => ({ ...prev, ...initialValues }));
    }
  }, [initialValues]);

  const update = <K extends keyof ListingFormValues>(key: K, val: ListingFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const addChip = (kind: 'skills' | 'interests', raw: string) => {
    const v = raw.trim();
    if (!v) return;
    const current = values[kind];
    if (current.includes(v)) return;
    update(kind, [...current, v]);
    if (kind === 'skills') setSkillInput('');
    else setInterestInput('');
  };

  const removeChip = (kind: 'skills' | 'interests', val: string) => {
    update(
      kind,
      values[kind].filter((s) => s !== val),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="listing-title">{t('ngo_admin_volunteering.form.titleLabel')}</Label>
        <Input
          id="listing-title"
          value={values.title}
          onChange={(e) => update('title', e.target.value)}
          required
          placeholder={t('ngo_admin_volunteering.form.titlePlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="listing-desc">{t('ngo_admin_volunteering.form.descriptionLabel')}</Label>
        <Textarea
          id="listing-desc"
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
          required
          rows={4}
          placeholder={t('ngo_admin_volunteering.form.descriptionPlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="listing-app-start">{t('ngo_admin_volunteering.form.applicationStartLabel')}</Label>
          <Input
            id="listing-app-start"
            type="date"
            value={values.applicationStart}
            onChange={(e) => update('applicationStart', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="listing-app-end">{t('ngo_admin_volunteering.form.applicationEndLabel')}</Label>
          <Input
            id="listing-app-end"
            type="date"
            value={values.applicationEnd}
            onChange={(e) => update('applicationEnd', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="listing-event-start">{t('ngo_admin_volunteering.form.eventStartLabel')}</Label>
          <Input
            id="listing-event-start"
            type="date"
            value={values.eventStart}
            onChange={(e) => update('eventStart', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="listing-event-end">{t('ngo_admin_volunteering.form.eventEndLabel')}</Label>
          <Input
            id="listing-event-end"
            type="date"
            value={values.eventEnd}
            onChange={(e) => update('eventEnd', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <LocationFields
          value={{ country: 'Türkiye', city: values.city, district: values.district }}
          onChange={(next) => {
            update('city', next.city ?? '');
            update('district', next.district ?? '');
          }}
          showCountry={false}
          showNeighborhood={false}
          labelCity={t('ngo_admin_volunteering.form.cityLabel')}
          labelDistrict={t('ngo_admin_volunteering.form.districtLabel')}
        />
        <div className="space-y-2">
          <Label htmlFor="listing-cap">{t('ngo_admin_volunteering.form.capacityLabel')}</Label>
          <Input
            id="listing-cap"
            type="number"
            min={1}
            value={values.capacity}
            onChange={(e) => update('capacity', Math.max(1, Number(e.target.value) || 1))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="listing-skills">{t('ngo_admin_volunteering.form.skillsLabel')}</Label>
        <div className="flex gap-2">
          <Input
            id="listing-skills"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addChip('skills', skillInput);
              }
            }}
            placeholder={t('ngo_admin_volunteering.form.skillsPlaceholder')}
          />
          <Button type="button" variant="secondary" onClick={() => addChip('skills', skillInput)}>
            {t('ngo_admin_volunteering.form.addBtn')}
          </Button>
        </div>
        {values.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {values.skills.map((s) => (
              <Badge key={s} variant="secondary" className="font-normal">
                {s}
                <button
                  type="button"
                  className="ml-1 inline-flex"
                  onClick={() => removeChip('skills', s)}
                  aria-label={t('ngo_admin_volunteering.form.removeAria')}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="listing-interests">{t('ngo_admin_volunteering.form.interestsLabel')}</Label>
        <div className="flex gap-2">
          <Input
            id="listing-interests"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addChip('interests', interestInput);
              }
            }}
            placeholder={t('ngo_admin_volunteering.form.interestsPlaceholder')}
          />
          <Button type="button" variant="secondary" onClick={() => addChip('interests', interestInput)}>
            {t('ngo_admin_volunteering.form.addBtn')}
          </Button>
        </div>
        {values.interests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {values.interests.map((s) => (
              <Badge key={s} variant="secondary" className="font-normal">
                {s}
                <button
                  type="button"
                  className="ml-1 inline-flex"
                  onClick={() => removeChip('interests', s)}
                  aria-label={t('ngo_admin_volunteering.form.removeAria')}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            {t('ngo_admin_volunteering.form.cancelBtn')}
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('ngo_admin_volunteering.form.submitBtn')}
        </Button>
      </div>
    </form>
  );
}
