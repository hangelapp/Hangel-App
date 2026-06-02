'use client';

/**
 * Bölüm 9 — Filmler.
 *
 * Veri kaynağı: Firestore `library/filmler` doc'u (süper-admin maintenance
 * panelinden seed edilir, bkz. super-admin/maintenance/page.tsx). Kategori/dil/
 * dub/yıl/tür/ülke/duygu/içerik-tipi/hangel-aksiyon filtreleri haystack araması
 * ile eşleşir.
 */

import React from 'react';
import { SectionAccordion, type FilterDef } from './_shared';
import { useSectionDoc } from './_use-section-doc';
import { useTranslation } from '@/components/providers/language-provider';

const SLUG = 'filmler';

const FILTERS: FilterDef[] = [
  {
    key: 'category', label: 'category', type: 'select',
    options: [
      'İnsan Hakları', 'Yoksulluk & Umut', 'Etik & Hukuk', 'Dijital Toplum',
      'Kriz & Yardım', 'Gazetecilik & Adalet', 'Çocuk Hakları', 'Sosyal Eşitsizlik',
      'Eğitim & Dayanışma', 'Gönüllülük & İyilik', 'Ekonomi & Sistem', 'Eğitim & Aktivizm',
      'Çevre', 'İklim Krizi', 'Kültür & Umut', 'Otizm & Nöroçeşitlilik',
      'Nadir Hastalıklar', 'ALS & Nörodejeneratif Hastalıklar', 'ALS & Nörolojik Hastalık',
      'Serebral Palsi', 'Serebral Palsi & Bakım', 'Serebral Palsi & Yaşam',
      'Fiziksel Engellilik', 'Engellilik & Aktivizm', 'Engellilik & Sosyal Uyum',
      'Engellilik & Eğitim', 'Engellilik & Toplumsal Algı', 'Engellilik & Dayanışma',
      'Körlük (Görme Engeli)', 'Sağır & İşitme Engeli', 'Rehber Köpekler',
      'Hayvan Hakları', 'Irkçılık & İnsan Hakları', 'İyilik & Gönüllülük',
      'STK & Aktivizm', 'Sosyal Etki', 'Sosyal Girişim', 'Sosyal Adalet',
      'İşçi Hakları', 'Etik İş Dünyası', 'Sosyal Aktivizm',
      'Sosyal Tabu & Sosyal Girişim', 'Mülteci & Göç', 'Mülteci & Savaş',
      'Mülteci & Kimlik', 'Göç & Aile', 'Mülteci & Dayanışma', 'Göç & Çocuk',
      'Mülteci & Belgesel', 'Göç & Emek', 'Hak Mücadelesi', 'Hak & Sistem',
      'Ezilen Gruplar', 'Göç & Aktivizm', 'Mülteci & Kadın', 'Göç & Umut',
    ],
  },
  {
    key: 'language', label: 'language', type: 'select',
    options: ['İngilizce', 'Türkçe', 'Arapça', 'Korece', 'Fransızca', 'Hintçe',
      'Japonca', 'Norveççe', 'İtalyanca', 'İşaret Dili', 'Çok Dilli'],
  },
  {
    key: 'dub', label: 'dub', type: 'select',
    options: ['Türkçe', 'İngilizce'],
  },
  { key: 'year', label: 'yearRange', type: 'year-range', min: 1962, max: 2021 },
  {
    key: 'genre', label: 'genre', type: 'select',
    options: ['Film', 'Belgesel (Film)', 'Belgesel (Dizi)'],
  },
  {
    key: 'country', label: 'country', type: 'select',
    options: ['ABD / İngilizce Yapımlar', 'Türkiye', 'Fransa', 'Güney Kore',
      'Hindistan', 'Japonya', 'Norveç', 'İtalya', 'Çok Uluslu'],
  },
  {
    key: 'emotion', label: 'emotion', type: 'multi-select',
    options: ['Vicdan', 'Cesaret', 'İnsanlık', 'Umut', 'Azim', 'Hayatta Kalma',
      'Adalet', 'Mücadele', 'Gerçeklerin Ortaya Çıkması', 'Sarsıcı', 'Yoksulluk',
      'Dayanışma', 'Empati', 'Kabul', 'Dışlanma', 'Kimlik Arayışı', 'Bağımsızlık',
      'Sevgi', 'Dostluk', 'Yalnızlık', 'Travma', 'Kayıp', 'İyilik', 'İlham',
      'Motivasyon', 'Sistem Eleştirisi', 'Toplumsal Farkındalık', 'Aktivizm', 'Özgürlük'],
  },
  {
    key: 'contentType', label: 'contentType', type: 'select',
    options: ['Gerçek Hikaye', 'Kurgu'],
  },
  {
    key: 'hangelAction', label: 'hangelAction', type: 'select',
    options: ['Gönüllülük', 'Bağış', 'Farkındalık', 'Eğitim'],
  },
];

export function FilmsSection() {
  const { t } = useTranslation();
  const { section } = useSectionDoc(SLUG, {
    slug: SLUG,
    title: 'Filmler',
    description: 'Sosyal etki temalı film ve belgesel seçkisi.',
    icon: 'Film',
  });
  return <SectionAccordion section={section} filterDefs={FILTERS} searchPlaceholder={t('library.toolbar.filmPlaceholder')} />;
}
