import { describe, it, expect } from 'vitest';
import { findNgoDuplicate, type NgoDedupeRecord } from '@/lib/ngo-dedupe';

const records: NgoDedupeRecord[] = [
  {
    id: 'a',
    name: 'YEŞİL TÜRKİYE ORMANCILAR DERNEĞİ',
    shortName: 'YEŞİL TÜRKİYE',
    kutukNo: '06-002-182',
    contact: { phone: '5553722501', email: 'yesilturkiye1950@hotmail.com' },
    status: 'Aktif',
  },
  {
    id: 'b-arsiv',
    name: 'Yeşil Türkiye Derneği',
    status: 'Pasif',
    mergedInto: 'a',
  },
  { id: 'c', name: 'Patipark Hayvanseverler Derneği', kutukNo: '34-111-222', status: 'Aktif' },
];

describe('findNgoDuplicate', () => {
  it('kütük tek başına kesin mükerrer (tireli/tiresiz fark etmez)', () => {
    const m = findNgoDuplicate({ name: 'Bambaşka İsim', kutukNo: '06002182' }, records);
    expect(m?.id).toBe('a');
    expect(m?.matchedFields).toContain('kütük no');
  });

  it('isim + kısa isim (≥2) eşleşince mükerrer — Türkçe İ ve büyük/küçük harf normalize', () => {
    const m = findNgoDuplicate({ name: 'yeşil türkiye ormancılar derneği', shortName: 'Yeşil Türkiye' }, records);
    expect(m?.id).toBe('a');
    expect(m?.matchedFields).toEqual(expect.arrayContaining(['isim', 'kısa isim']));
  });

  it('telefon + e-posta (≥2) eşleşince mükerrer — boşluk/ülke kodu normalize', () => {
    const m = findNgoDuplicate({ phone: '+90 555 372 25 01', email: 'YesilTurkiye1950@Hotmail.com' }, records);
    expect(m?.id).toBe('a');
    expect(m?.matchedFields).toEqual(expect.arrayContaining(['telefon', 'e-posta']));
  });

  it('tek alan (sadece isim) eşleşince mükerrer SAYILMAZ', () => {
    const m = findNgoDuplicate({ name: 'YEŞİL TÜRKİYE ORMANCILAR DERNEĞİ' }, records);
    expect(m).toBeNull();
  });

  it('arşivlenmiş (Pasif/mergedInto) kayıtlar eşleşmeye dahil edilmez', () => {
    // "Yeşil Türkiye Derneği" yalnız arşivdeki b ile birebir; ama o atlanır → null.
    const m = findNgoDuplicate({ name: 'Yeşil Türkiye Derneği', shortName: 'Yeşil Türkiye Derneği' }, records);
    expect(m).toBeNull();
  });

  it('excludeId verilen kayıt kendisiyle eşleşmez (düzenleme senaryosu)', () => {
    const m = findNgoDuplicate({ name: 'YEŞİL TÜRKİYE ORMANCILAR DERNEĞİ', kutukNo: '06-002-182' }, records, 'a');
    expect(m).toBeNull();
  });

  it('alakasız aday → null', () => {
    const m = findNgoDuplicate({ name: 'Tamamen Farklı Vakıf', kutukNo: '99-999-999', email: 'x@y.com' }, records);
    expect(m).toBeNull();
  });

  it('hiç karşılaştırılabilir alan yoksa → null', () => {
    const m = findNgoDuplicate({}, records);
    expect(m).toBeNull();
  });
});
