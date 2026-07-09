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
import { Checkbox } from '@/components/ui/checkbox';
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
  address: string;
  locationType: string;
  socialArea: string;
  commitment: string;
  capacity: number;
  skills: string[];
  interests: string[];
  // İleri detaylar
  hoursStart: string;
  hoursEnd: string;
  hoursTotal: number;
  transport: boolean;
  food: boolean;
  accommodation: boolean;
  requirements: string[];
  participationCondition: string;
  hasPreTraining: boolean;
  meetUrl: string;
  urgent: boolean;
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
  address: '',
  locationType: 'Saha',
  socialArea: '',
  commitment: 'Tek Günlük',
  capacity: 1,
  skills: [],
  interests: [],
  hoursStart: '',
  hoursEnd: '',
  hoursTotal: 0,
  transport: false,
  food: false,
  accommodation: false,
  requirements: [],
  participationCondition: '',
  hasPreTraining: false,
  meetUrl: '',
  urgent: false,
};

// Kanonik seçenekler — rozet motoru socialArea'yı normalize eder (resolveBadgeArea).
const SOCIAL_AREAS = [
  'Eğitim', 'Sağlık', 'Çevre', 'Hayvan Hakları', 'Afet & Acil Yardım', 'Sosyal Yardım',
  'Kültür & Sanat', 'Spor', 'İnsan Hakları', 'Teknoloji', 'Gıda & Beslenme',
  'Yaşlı Bakımı', 'Çocuk', 'Kadın', 'Mülteci & Göç', 'Engelli Hakları',
];
const LOCATION_TYPES = ['Saha', 'Online', 'Hibrit'];
const COMMITMENTS = ['Tek Günlük', 'Kısa Süreli', 'Düzenli', 'Sürekli'];
const selectCls =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

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
  const [requirementInput, setRequirementInput] = useState('');

  useEffect(() => {
    if (initialValues) {
      setValues((prev) => ({ ...prev, ...initialValues }));
    }
  }, [initialValues]);

  const update = <K extends keyof ListingFormValues>(key: K, val: ListingFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  type ChipKind = 'skills' | 'interests' | 'requirements';
  const chipReset: Record<ChipKind, (v: string) => void> = {
    skills: setSkillInput,
    interests: setInterestInput,
    requirements: setRequirementInput,
  };
  const addChip = (kind: ChipKind, raw: string) => {
    const v = raw.trim();
    if (!v) return;
    const current = values[kind];
    if (current.includes(v)) return;
    update(kind, [...current, v]);
    chipReset[kind]('');
  };

  const removeChip = (kind: ChipKind, val: string) => {
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

        <div className="space-y-2">
          <Label htmlFor="listing-address">Açık Adres (saha için — opsiyonel)</Label>
          <Input
            id="listing-address"
            value={values.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="Cadde, sokak, no — yol tarifi ve buluşma noktası için"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="listing-area">Sosyal Alan</Label>
          <select
            id="listing-area"
            className={selectCls}
            value={values.socialArea}
            onChange={(e) => update('socialArea', e.target.value)}
          >
            <option value="">Seçin…</option>
            {SOCIAL_AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
            {values.socialArea && !SOCIAL_AREAS.includes(values.socialArea) && (
              <option value={values.socialArea}>{values.socialArea}</option>
            )}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="listing-loctype">Katılım Şekli</Label>
          <select
            id="listing-loctype"
            className={selectCls}
            value={values.locationType}
            onChange={(e) => update('locationType', e.target.value)}
          >
            {LOCATION_TYPES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="listing-commit">Süre / Bağlılık</Label>
          <select
            id="listing-commit"
            className={selectCls}
            value={values.commitment}
            onChange={(e) => update('commitment', e.target.value)}
          >
            {COMMITMENTS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
            {values.commitment && !COMMITMENTS.includes(values.commitment) && (
              <option value={values.commitment}>{values.commitment}</option>
            )}
          </select>
        </div>
      </div>

      {/* İleri detaylar — hepsi opsiyonel */}
      <div className="rounded-xl border bg-muted/20 p-3 space-y-4">
        <p className="text-sm font-semibold">Detaylar (opsiyonel)</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="listing-hstart">Başlangıç Saati</Label>
            <Input id="listing-hstart" type="time" value={values.hoursStart} onChange={(e) => update('hoursStart', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-hend">Bitiş Saati</Label>
            <Input id="listing-hend" type="time" value={values.hoursEnd} onChange={(e) => update('hoursEnd', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-htotal">Toplam Saat (tahmini)</Label>
            <Input
              id="listing-htotal"
              type="number"
              min={0}
              step={0.5}
              value={values.hoursTotal}
              onChange={(e) => update('hoursTotal', Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>İmkânlar</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={values.transport} onCheckedChange={(c) => update('transport', c === true)} /> Ulaşım
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={values.food} onCheckedChange={(c) => update('food', c === true)} /> Yemek
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={values.accommodation} onCheckedChange={(c) => update('accommodation', c === true)} /> Konaklama
            </label>
          </div>
        </div>

        {/* Online gönüllülük → Google Meet linki (onaylı gönüllü "Katıl" ile açar) */}
        {values.locationType === 'Online' && (
          <div className="space-y-2">
            <Label htmlFor="listing-meet">Google Meet linki (online)</Label>
            <Input
              id="listing-meet"
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={values.meetUrl}
              onChange={(e) => update('meetUrl', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Onaylanan gönüllüler ilan sayfasından bu linkle &quot;Online gönüllülüğe katıl&quot; der.</p>
          </div>
        )}

        {/* ACİL gönüllülük (afet/acil) → kart/detayda kırmızı şerit + öne çıkar */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={values.urgent} onCheckedChange={(c) => update('urgent', c === true)} />
          <span className="font-semibold text-red-600 dark:text-red-400">🚨 ACİL gönüllülük</span>
          <span className="text-xs text-muted-foreground">(afet/acil — listede öne çıkar, kırmızı şerit)</span>
        </label>

        <div className="space-y-2">
          <Label htmlFor="listing-req">Gereksinimler / Belgeler</Label>
          <div className="flex gap-2">
            <Input
              id="listing-req"
              value={requirementInput}
              onChange={(e) => setRequirementInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addChip('requirements', requirementInput);
                }
              }}
              placeholder="Örn. Sağlık raporu, ehliyet, gönüllülük sözleşmesi…"
            />
            <Button type="button" variant="secondary" onClick={() => addChip('requirements', requirementInput)}>
              {t('ngo_admin_volunteering.form.addBtn')}
            </Button>
          </div>
          {values.requirements.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {values.requirements.map((s) => (
                <Badge key={s} variant="secondary" className="font-normal">
                  {s}
                  <button
                    type="button"
                    className="ml-1 inline-flex"
                    onClick={() => removeChip('requirements', s)}
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
          <Label htmlFor="listing-cond">Katılım Koşulu</Label>
          <Textarea
            id="listing-cond"
            rows={2}
            value={values.participationCondition}
            onChange={(e) => update('participationCondition', e.target.value)}
            placeholder="Katılım için özel koşul (yaş, deneyim, üyelik vb.) — varsa"
          />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={values.hasPreTraining} onCheckedChange={(c) => update('hasPreTraining', c === true)} />
          Katılımdan önce ön-eğitim / oryantasyon var
        </label>
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
