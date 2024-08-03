import 'package:flutter/material.dart';

import '../constants/app_theme.dart';
import '../models/brand_model.dart';
import '../models/stk_model.dart';

List<Color> randomColors = [
  AppTheme.blue,
  AppTheme.green,
  AppTheme.yellow,
  AppTheme.red,
  AppTheme.primaryColor,
];
List<StkModel> stkModels = [
  StkModel(
    name: "Güvercin Sevenler Derneği",
    country: "Türkiye",
    city: "İstanbul",
    fieldOfBenefit: "Hayvan Hakları",
    inEarthquakeZone: false,
    specialStatus: "Sivil Toplum Kuruluşu",
    creationDate: DateTime(2005, 9, 27),
    bannerImage: "https://example.com/guvercin-banner.jpg",
    detailText: "Kuş severlerin bir araya geldiği ve güvercinlerin haklarını savunan bir dernektir.",
    link: "https://www.guvercinseverler.org/",
    type: "Dernek",
    donorCount: 15000,
    categories: [
      "Hayvan Hakları",
      "Sosyal Değişim",
    ],
  ),
  StkModel(
    name: "Bağımlılıkla Mücadele Derneği",
    country: "Türkiye",
    city: "Ankara",
    fieldOfBenefit: "Bağımlılıkla Mücadele",
    inEarthquakeZone: false,
    specialStatus: "Sivil Toplum Kuruluşu",
    creationDate: DateTime(2003, 4, 11),
    bannerImage: "https://example.com/bagimlilik-banner.jpg",
    detailText: "Bağımlılıkla mücadele ederek toplumda sağlıklı bir yaşamı teşvik eden bir dernektir.",
    link: "https://www.bagimlilikla-mucadele.org/",
    type: "Dernek",
    donorCount: 20000,
    categories: [
      "Bağımlılıkla Mücadele",
      "Sosyal Değişim",
    ],
  ),
  StkModel(
    name: "Fırsat Eşitliği Derneği",
    country: "Türkiye",
    city: "İzmir",
    fieldOfBenefit: "Eşitlik",
    inEarthquakeZone: false,
    specialStatus: "Sivil Toplum Kuruluşu",
    creationDate: DateTime(2006, 8, 5),
    bannerImage: "https://example.com/esitlik-banner.jpg",
    detailText: "Toplumda fırsat eşitliği ve adaleti destekleyerek sosyal değişim yaratmayı amaçlar.",
    link: "https://www.firsat-esitligi.org/",
    type: "Dernek",
    donorCount: 18000,
    categories: [
      "Eşitlik",
      "Sosyal Değişim",
    ],
  ),
  StkModel(
    name: "Bergamalılar Derneği",
    country: "Türkiye",
    city: "Bergama",
    fieldOfBenefit: "Kültürel Miras",
    inEarthquakeZone: true,
    specialStatus: "Sivil Toplum Kuruluşu",
    creationDate: DateTime(1998, 12, 19),
    bannerImage: "https://example.com/bergamalar-banner.jpg",
    detailText: "Bergama'nın kültürel mirasını korumayı ve tanıtmayı amaçlayan bir dernektir.",
    link: "https://www.bergamalar.org.tr/",
    type: "Özel İzinli",
    donorCount: 12000,
    categories: [
      "Kültürel Miras",
      "Sosyal Değişim",
    ],
  ),
  StkModel(
    name: "Kırsal Kalkınma Derneği",
    country: "Türkiye",
    city: "Adana",
    fieldOfBenefit: "Kırsal Kalkınma",
    inEarthquakeZone: false,
    specialStatus: "Sivil Toplum Kuruluşu",
    creationDate: DateTime(2000, 6, 8),
    bannerImage: "https://example.com/kirsal-kalkinma-banner.jpg",
    detailText: "Kırsal bölgelerde yaşayan insanların ekonomik ve sosyal kalkınmasını destekler.",
    link: "https://www.kirsal-kalkinma.org.tr/",
    type: "Vakıf",
    donorCount: 25000,
    categories: [
      "Kırsal Kalkınma",
      "Sosyal Değişim",
    ],
  ),
];

List<BrandModel> brandModels = [
  BrandModel(
    name: "Güzel Otomotiv",
    sector: "Otomotiv",
    inEarthquakeZone: false,
    isSocialEnterprise: false,
    donationRate: 0.03,
    creationDate: DateTime(1999, 5, 15),
    bannerImage: "https://example.com/guzel-otomotiv-banner.jpg",
    detailText: "Güzel Otomotiv, kaliteli otomobil satışı ve servis hizmetleri sunan bir şirkettir.",
    link: "https://www.guzelotomotiv.com/",
    categories: [
      CategoryModel(
        name: "Otomotiv",
        donationRate: 0.03,
      ),
      CategoryModel(
        name: "Aracılık Hizmetleri",
        donationRate: 0.03,
      ),
      CategoryModel(
        name: "Sosyal Şirket",
        donationRate: 0.5,
      ),
    ],
  ),
  BrandModel(
    name: "Karlı Kuyumculuk",
    sector: "Kuyumculuk",
    inEarthquakeZone: false,
    isSocialEnterprise: false,
    donationRate: 0.02,
    creationDate: DateTime(2005, 8, 20),
    bannerImage: "https://example.com/karli-kuyumculuk-banner.jpg",
    detailText: "Karlı Kuyumculuk, değerli mücevherler ve takılar sunan bir kuyumculuk markasıdır.",
    link: "https://www.karlikuyumculuk.com/",
    categories: [
      CategoryModel(
        name: "Kuyumculuk",
        donationRate: 0.02,
      ),
      CategoryModel(
        donationRate: 0.5,
        name: "Sosyal Şirket",
      ),
    ],
  ),
  BrandModel(
    name: "Sağlam İnşaat",
    sector: "İnşaat",
    inEarthquakeZone: true,
    isSocialEnterprise: false,
    donationRate: 0.01,
    creationDate: DateTime(2010, 3, 10),
    bannerImage: "https://example.com/saglam-insaat-banner.jpg",
    detailText: "Sağlam İnşaat, inşaat projeleri ve taahhüt hizmetleri sunan bir inşaat şirketidir.",
    link: "https://www.saglaminsaat.com/",
    categories: [
      CategoryModel(
        name: "İnşaat Hizmetleri",
        donationRate: 0.01,
      ),
      CategoryModel(
        name: "İnşaat Malzemeleri",
        donationRate: 0.01,
      ),
    ],
  ),
  BrandModel(
    name: "Bizim Kargo",
    sector: "Lojistik",
    inEarthquakeZone: false,
    isSocialEnterprise: true,
    donationRate: 0.05,
    creationDate: DateTime(2008, 6, 18),
    bannerImage: "https://example.com/bizim-kargo-banner.jpg",
    detailText: "Bizim Kargo, hızlı ve güvenilir kargo hizmetleri sunan bir lojistik şirketidir.",
    link: "https://www.bizimkargo.com/",
    categories: [
      CategoryModel(
        name: "Lojistik",
        donationRate: 0.05,
      ),
      CategoryModel(
        name: "Sosyal Şirket",
        donationRate: 0.5,
      ),
    ],
  ),
  BrandModel(
    name: "Doyuran Restoran",
    sector: "Restoran",
    inEarthquakeZone: false,
    isSocialEnterprise: false,
    donationRate: 0.04,
    creationDate: DateTime(2007, 9, 12),
    bannerImage: "https://example.com/doyuran-restoran-banner.jpg",
    detailText: "Doyuran Restoran, lezzetli yemekler ve misafirperverlik sunan bir restoran zinciridir.",
    link: "https://www.doyuranrestoran.com/",
    categories: [
      CategoryModel(
        name: "Yeme içme",
        donationRate: 0.04,
      ),
      CategoryModel(
        name: "Sosyal Şirket",
        donationRate: 0.5,
      ),
    ],
  ),
];
List<BrandModel> socialEnterprises = brandModels.where((element) {
  return element.isSocialEnterprise == true;
}).toList();
