/**
 * Badge points scorer unit tests.
 *
 * Pure functions — no Firestore, no I/O. Deterministic.
 */
import { describe, expect, it } from 'vitest';
import {
  computeAreaPoints,
  mapCategoryToBadgeArea,
  DONATION_AREA_POINTS,
  INVITE_AREA_POINTS,
  HANGEL_AREA,
  type ComputeAreaPointsInput,
} from '@/lib/badge-points';

const baseInput = (over: Partial<ComputeAreaPointsInput> = {}): ComputeAreaPointsInput => ({
  donations: [],
  ngoCategoryById: {},
  pastVolunteering: [],
  inviteCount: 0,
  ...over,
});

describe('mapCategoryToBadgeArea', () => {
  it('maps a direct keyword category to its full badge area', () => {
    expect(mapCategoryToBadgeArea('Çevre')).toBe('Çevre Gönüllüsü');
    expect(mapCategoryToBadgeArea('Eğitim')).toBe('Eğitim Gönüllüsü');
  });

  it('maps known aliases to their canonical badge area', () => {
    expect(mapCategoryToBadgeArea('Yardımlaşma')).toBe('Sosyal Yardım Gönüllüsü');
    expect(mapCategoryToBadgeArea('Dayanışma')).toBe('Afet Gönüllüsü');
    expect(mapCategoryToBadgeArea('Sanat')).toBe('Kültür ve Sanat Gönüllüsü');
    expect(mapCategoryToBadgeArea('Kültür')).toBe('Kültür ve Sanat Gönüllüsü');
  });

  it('is Turkish-case insensitive for lower and upper variants', () => {
    expect(mapCategoryToBadgeArea('çevre')).toBe('Çevre Gönüllüsü');
    expect(mapCategoryToBadgeArea('ÇEVRE')).toBe('Çevre Gönüllüsü');
    expect(mapCategoryToBadgeArea('eğitim')).toBe('Eğitim Gönüllüsü');
    expect(mapCategoryToBadgeArea('YARDIMLAŞMA')).toBe('Sosyal Yardım Gönüllüsü');
  });

  it('returns null for an unknown category', () => {
    expect(mapCategoryToBadgeArea('Zzz Kategori')).toBeNull();
  });

  it('returns null for null/undefined/empty input', () => {
    expect(mapCategoryToBadgeArea(null)).toBeNull();
    expect(mapCategoryToBadgeArea(undefined)).toBeNull();
    expect(mapCategoryToBadgeArea('   ')).toBeNull();
  });
});

describe('computeAreaPoints — donations', () => {
  it('credits a confirmed donation to the mapped area', () => {
    const input = baseInput({
      donations: [{ status: 'Yatırıldı', ngoIds: ['n1'] }],
      ngoCategoryById: { n1: 'Çevre' },
    });
    expect(computeAreaPoints(input)).toEqual({ 'Çevre Gönüllüsü': DONATION_AREA_POINTS });
  });

  it('accepts both confirmed statuses (Yatırıldı / Tamamlandı)', () => {
    const input = baseInput({
      donations: [
        { status: 'Tamamlandı', ngoIds: ['n1'] },
        { status: 'Yatırıldı', ngoIds: ['n2'] },
      ],
      ngoCategoryById: { n1: 'Çevre', n2: 'Eğitim' },
    });
    expect(computeAreaPoints(input)).toEqual({
      'Çevre Gönüllüsü': DONATION_AREA_POINTS,
      'Eğitim Gönüllüsü': DONATION_AREA_POINTS,
    });
  });

  it('stacks two confirmed donations to the same area (2x)', () => {
    const input = baseInput({
      donations: [
        { status: 'Yatırıldı', ngoIds: ['n1'] },
        { status: 'Tamamlandı', ngoIds: ['n2'] },
      ],
      ngoCategoryById: { n1: 'Çevre', n2: 'Çevre' },
    });
    expect(computeAreaPoints(input)).toEqual({ 'Çevre Gönüllüsü': DONATION_AREA_POINTS * 2 });
  });

  it('ignores a donation with a non-confirmed status', () => {
    const input = baseInput({
      donations: [{ status: 'İşleme Alındı', ngoIds: ['n1'] }],
      ngoCategoryById: { n1: 'Çevre' },
    });
    expect(computeAreaPoints(input)).toEqual({});
  });

  it('ignores Atanmamış ngoId and unmapped categories', () => {
    const input = baseInput({
      donations: [
        { status: 'Yatırıldı', ngoIds: ['Atanmamış'] },
        { status: 'Yatırıldı', ngoIds: ['n1'] },
      ],
      ngoCategoryById: { n1: 'Zzz Kategori' },
    });
    expect(computeAreaPoints(input)).toEqual({});
  });
});

describe('computeAreaPoints — volunteering', () => {
  it('uses an explicit socialArea + positive points', () => {
    const input = baseInput({
      pastVolunteering: [{ socialArea: 'Sağlık Gönüllüsü', points: 40 }],
    });
    expect(computeAreaPoints(input)).toEqual({ 'Sağlık Gönüllüsü': 40 });
  });

  it('falls back to the ngo category when only ngoId is present', () => {
    const input = baseInput({
      pastVolunteering: [{ ngoId: 'n1', points: 30 }],
      ngoCategoryById: { n1: 'Eğitim' },
    });
    expect(computeAreaPoints(input)).toEqual({ 'Eğitim Gönüllüsü': 30 });
  });

  it('skips a record with neither socialArea/area nor ngoId', () => {
    const input = baseInput({
      pastVolunteering: [{ organization: 'Some NGO', points: 99 }],
    });
    expect(computeAreaPoints(input)).toEqual({});
  });

  it('uses the default points (50) when points is missing', () => {
    const input = baseInput({
      pastVolunteering: [{ socialArea: 'Sağlık Gönüllüsü' }],
    });
    expect(computeAreaPoints(input)).toEqual({ 'Sağlık Gönüllüsü': 50 });
  });
});

describe('computeAreaPoints — invites', () => {
  it('credits inviteCount * INVITE_AREA_POINTS to the hangel area', () => {
    const input = baseInput({ inviteCount: 3 });
    expect(computeAreaPoints(input)).toEqual({ [HANGEL_AREA]: 3 * INVITE_AREA_POINTS });
  });

  it('credits nothing for inviteCount 0', () => {
    expect(computeAreaPoints(baseInput({ inviteCount: 0 }))).toEqual({});
  });
});

describe('computeAreaPoints — combined & defensive', () => {
  it('sums donations, volunteering and invites into one integer map', () => {
    const input = baseInput({
      donations: [{ status: 'Yatırıldı', ngoIds: ['n1'] }],
      ngoCategoryById: { n1: 'Çevre' },
      pastVolunteering: [{ socialArea: 'Çevre Gönüllüsü', points: 50 }],
      inviteCount: 2,
    });
    const result = computeAreaPoints(input);
    expect(result).toEqual({
      'Çevre Gönüllüsü': DONATION_AREA_POINTS + 50,
      [HANGEL_AREA]: 2 * INVITE_AREA_POINTS,
    });
    for (const v of Object.values(result)) expect(Number.isInteger(v)).toBe(true);
  });

  it('returns {} for empty arrays and zero invites', () => {
    expect(computeAreaPoints(baseInput())).toEqual({});
  });
});
