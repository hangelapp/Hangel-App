import 'dart:convert';
import 'package:flutter/services.dart';
import '../constants/app_theme.dart';

List<Color> randomColors = [
  AppTheme.blue,
  AppTheme.green,
  AppTheme.yellow,
  AppTheme.red,
  AppTheme.primaryColor,
];
// List<StkModel> stkModels = [
//   StkModel(
//     name: "Güvercin Sevenler Derneği",
//     country: "Türkiye",
//     city: "İstanbul",
//     fieldOfBenefit: "Hayvan Hakları",
//     inEarthquakeZone: false,
//     specialStatus: "Sivil Toplum Kuruluşu",
//     creationDate: DateTime(2005, 9, 27),
//     bannerImage: "https://example.com/guvercin-banner.jpg",
//     detailText: "Kuş severlerin bir araya geldiği ve güvercinlerin haklarını savunan bir dernektir.",
//     link: "https://www.guvercinseverler.org/",
//     type: "Dernek",
//     donorCount: 15000,
//     categories: [
//       "Hayvan Hakları",
//       "Sosyal Değişim",
//     ],
//   ),
//   StkModel(
//     name: "Bağımlılıkla Mücadele Derneği",
//     country: "Türkiye",
//     city: "Ankara",
//     fieldOfBenefit: "Bağımlılıkla Mücadele",
//     inEarthquakeZone: false,
//     specialStatus: "Sivil Toplum Kuruluşu",
//     creationDate: DateTime(2003, 4, 11),
//     bannerImage: "https://example.com/bagimlilik-banner.jpg",
//     detailText: "Bağımlılıkla mücadele ederek toplumda sağlıklı bir yaşamı teşvik eden bir dernektir.",
//     link: "https://www.bagimlilikla-mucadele.org/",
//     type: "Dernek",
//     donorCount: 20000,
//     categories: [
//       "Bağımlılıkla Mücadele",
//       "Sosyal Değişim",
//     ],
//   ),
//   StkModel(
//     name: "Fırsat Eşitliği Derneği",
//     country: "Türkiye",
//     city: "İzmir",
//     fieldOfBenefit: "Eşitlik",
//     inEarthquakeZone: false,
//     specialStatus: "Sivil Toplum Kuruluşu",
//     creationDate: DateTime(2006, 8, 5),
//     bannerImage: "https://example.com/esitlik-banner.jpg",
//     detailText: "Toplumda fırsat eşitliği ve adaleti destekleyerek sosyal değişim yaratmayı amaçlar.",
//     link: "https://www.firsat-esitligi.org/",
//     type: "Dernek",
//     donorCount: 18000,
//     categories: [
//       "Eşitlik",
//       "Sosyal Değişim",
//     ],
//   ),
//   StkModel(
//     name: "Bergamalılar Derneği",
//     country: "Türkiye",
//     city: "Bergama",
//     fieldOfBenefit: "Kültürel Miras",
//     inEarthquakeZone: true,
//     specialStatus: "Sivil Toplum Kuruluşu",
//     creationDate: DateTime(1998, 12, 19),
//     bannerImage: "https://example.com/bergamalar-banner.jpg",
//     detailText: "Bergama'nın kültürel mirasını korumayı ve tanıtmayı amaçlayan bir dernektir.",
//     link: "https://www.bergamalar.org.tr/",
//     type: "Özel İzinli",
//     donorCount: 12000,
//     categories: [
//       "Kültürel Miras",
//       "Sosyal Değişim",
//     ],
//   ),
//   StkModel(
//     name: "Kırsal Kalkınma Derneği",
//     country: "Türkiye",
//     city: "Adana",
//     fieldOfBenefit: "Kırsal Kalkınma",
//     inEarthquakeZone: false,
//     specialStatus: "Sivil Toplum Kuruluşu",
//     creationDate: DateTime(2000, 6, 8),
//     bannerImage: "https://example.com/kirsal-kalkinma-banner.jpg",
//     detailText: "Kırsal bölgelerde yaşayan insanların ekonomik ve sosyal kalkınmasını destekler.",
//     link: "https://www.kirsal-kalkinma.org.tr/",
//     type: "Vakıf",
//     donorCount: 25000,
//     categories: [
//       "Kırsal Kalkınma",
//       "Sosyal Değişim",
//     ],
//   ),
// ];

Future<List<String>> loadAssets() async {
  final manifestContent = await rootBundle.loadString('AssetManifest.json');
  final Map<String, dynamic> manifestMap = json.decode(manifestContent);
  final imagePaths =
      manifestMap.keys.where((String key) => key.startsWith('assets/images/brands/') && key.endsWith('.png')).toList();
  return imagePaths;
}

Future<String?> findAsset(String fileName) async {
  final imagePaths = await loadAssets();
  final searchFileName = 'assets/images/brands/$fileName.png';
  if (imagePaths.contains(searchFileName)) {
    return searchFileName;
  }
  return null;
}

Future<Uint8List> assetToUint8List(String assetPath) async {
  // 1. AssetImage'ı yükleyin
  final ByteData data = await rootBundle.load(assetPath);

  // 2. ByteData'dan Uint8List'e dönüştürün
  final Uint8List bytes = data.buffer.asUint8List();

  return bytes;
}
  // List<StkModel> stkModels = [
  //   StkModel(
  //     logo:
  //         "http://docs.kariyer.net/job/jobtemplate/000/000/002/avatar/227520190319015959633.jpeg",
  //     name: "TEMA Vakfı",
  //     country: "Türkiye",
  //     city: "Ankara",
  //     fieldOfBenefit: "Çevre Koruma",
  //     inEarthquakeZone: false,
  //     specialStatus: "Vakıf",
  //     creationDate: DateTime(2002, 2, 13),
  //     bannerImage: "https://example.com/tema-banner.jpg",
  //     detailText:
  //         "Türkiye'nin doğal güzelliklerini ve çevresini korumayı amaçlayan bir sivil toplum kuruluşudur.",
  //     link: "https://www.tema.org.tr/",
  //     donorCount: 50000,
  //   ),
  //   StkModel(
  //     logo:
  //         "https://cf.kizlarsoruyor.com/q19852181/0f216d32-eb4a-48c8-abde-d746910e65ff.jpg",
  //     name: "Ahbap",
  //     country: "Türkiye",
  //     city: "İstanbul",
  //     fieldOfBenefit: "Sosyal Yardım",
  //     inEarthquakeZone: false,
  //     specialStatus: "Vakıf",
  //     creationDate: DateTime(2014, 7, 19),
  //     bannerImage: "https://example.com/ahbap-banner.jpg",
  //     detailText:
  //         "İhtiyaç sahiplerine destek sağlamak ve yardımlaşmayı teşvik etmek amacıyla kurulan bir gönüllü hareketidir.",
  //     link: "https://www.ahbap.org/",
  //     donorCount: 300000,
  //   ),
  //   StkModel(
  //     logo:
  //         "https://pbs.twimg.com/profile_images/1676596053125070848/0M52PW5W_400x400.jpg",
  //     name: "AFAD",
  //     country: "Türkiye",
  //     city: "Ankara",
  //     fieldOfBenefit: "Afet Yönetimi",
  //     inEarthquakeZone: true,
  //     specialStatus: "Kamu Kurumu",
  //     creationDate: DateTime(2009, 8, 17),
  //     bannerImage: "https://example.com/afad-banner.jpg",
  //     detailText:
  //         "Türkiye'nin afetlere karşı hazırlıklı olmasını sağlamak ve afet durumlarında etkili müdahale yapmak amacıyla kurulmuş bir kamu kurumudur.",
  //     link: "https://www.afad.gov.tr/",
  //     donorCount: 0,
  //   ),
  //   StkModel(
  //     logo: "https://cemkaya.net/uploads/resim/23-1/acev-logo.png",
  //     name: "AÇEV",
  //     country: "Türkiye",
  //     city: "İstanbul",
  //     fieldOfBenefit: "Eğitim",
  //     inEarthquakeZone: false,
  //     specialStatus: "Vakıf",
  //     creationDate: DateTime(1993, 5, 10),
  //     bannerImage: "https://example.com/acev-banner.jpg",
  //     detailText:
  //         "Çocukların eğitimine destek olmayı amaçlayan bir sivil toplum kuruluşudur.",
  //     link: "https://www.acev.org/",
  //     donorCount: 10000,
  //   ),
  //   StkModel(
  //     logo:
  //         "https://upload.wikimedia.org/wikipedia/tr/5/50/TSK_Mehmet%C3%A7ik_Vakf%C4%B1_logo.png",
  //     name: "Mehmetçik Vakfı",
  //     country: "Türkiye",
  //     city: "Ankara",
  //     fieldOfBenefit: "Askeri Personel ve Aileleri",
  //     inEarthquakeZone: false,
  //     specialStatus: "Vakıf",
  //     creationDate: DateTime(1995, 4, 23),
  //     bannerImage: "https://example.com/mehmetcik-banner.jpg",
  //     detailText:
  //         "Türk Silahlı Kuvvetleri personeli ve ailelerine destek olmayı amaçlayan bir sivil toplum kuruluşudur.",
  //     link: "https://www.mehmetcik.org.tr/",
  //     donorCount: 25000,
  //   ),
  // ];

  // List<BrandModel> brandModels = [
  //   BrandModel(
  //     name: "DeFacto",
  //     logo: "https://logowik.com/content/uploads/images/793_defacto.jpg",
  //     sector: "Moda",
  //     inEarthquakeZone: false,
  //     isSocialEnterprise: false,
  //     donationRate: 0.05,
  //     creationDate: DateTime(1993, 7, 5),
  //     bannerImage: "https://example.com/defacto-banner.jpg",
  //     detailText:
  //         "DeFacto, geniş ürün yelpazesi ve modern tasarımlarıyla dikkat çeken bir moda markasıdır.",
  //     link: "https://www.defacto.com.tr/",
  //   ),
  //   BrandModel(
  //     name: "Getir",
  //     logo:
  //         "https://www.donanimhaber.com/images/images/haber/159864/1400x1400getir-in-yeni-ozelligi-getiryemek-masa-kullanima-sunuldu.jpg",
  //     sector: "Alışveriş ve Teslimat",
  //     inEarthquakeZone: false,
  //     isSocialEnterprise: false,
  //     donationRate: 0.02,
  //     creationDate: DateTime(2015, 12, 8),
  //     bannerImage: "https://example.com/getir-banner.jpg",
  //     detailText:
  //         "Getir, hızlı ve pratik teslimat hizmeti sunan bir platformdur.",
  //     link: "https://www.getir.com/",
  //   ),
  //   BrandModel(
  //     name: "Trendyol",
  //     logo:
  //         "https://play-lh.googleusercontent.com/LosPYfjaz1pOL-I3XCTroj4vQVxfsF5629nzPJM4pIj2KLaQuLbwmXUqV-I1RT5u9A",
  //     sector: "E-Ticaret",
  //     inEarthquakeZone: false,
  //     isSocialEnterprise: false,
  //     donationRate: 0.03,
  //     creationDate: DateTime(2010, 10, 1),
  //     bannerImage: "https://example.com/trendyol-banner.jpg",
  //     detailText:
  //         "Trendyol, çeşitli ürünlerin satıldığı ve online alışverişin kolaylaştırıldığı bir platformdur.",
  //     link: "https://www.trendyol.com/",
  //   ),
  //   BrandModel(
  //     name: "Amazon",
  //     logo:
  //         "https://m.media-amazon.com/images/G/41/social_share/amazon_logo._CB633269640_.png",
  //     sector: "E-Ticaret ve Teknoloji",
  //     inEarthquakeZone: false,
  //     isSocialEnterprise: false,
  //     donationRate: 0.01,
  //     creationDate: DateTime(1994, 7, 5),
  //     bannerImage: "https://example.com/amazon-banner.jpg",
  //     detailText:
  //         "Amazon, dünya genelinde hizmet veren büyük bir e-ticaret ve teknoloji şirketidir.",
  //     link: "https://www.amazon.com/",
  //   ),
  //   BrandModel(
  //     name: "Koton",
  //     logo:
  //         "https://play-lh.googleusercontent.com/qjh8Y5ijBDtwSK7lrPPWW5GOXRjWgIIvapXG29dzXcJPCUCHNY4TrN2KsQHJpg617wSz",
  //     sector: "Moda",
  //     inEarthquakeZone: false,
  //     isSocialEnterprise: false,
  //     donationRate: 0.04,
  //     creationDate: DateTime(1988, 10, 10),
  //     bannerImage: "https://example.com/koton-banner.jpg",
  //     detailText:
  //         "Koton, genç ve dinamik moda anlayışıyla öne çıkan bir markadır.",
  //     link: "https://www.koton.com/",
  //   ),
  // ];


// Positioned(
//                             bottom: deviceHeightSize(context, 10),
//                             right: deviceWidthSize(context, 20),
//                             child: FloatingActionButton(
//                               heroTag: "stk-1",
//                               shape: const CircleBorder(),
//                               onPressed: () {
//                                 showModalBottomSheet(
//                                   context: context,
//                                   isScrollControlled: true,
//                                   builder: (context) => const BottomSheetWidget(
//                                     title: "STK Başvuru Formu",
//                                     isMinPadding: true,
//                                     child: STKFormWidget(),
//                                   ),
//                                 );
//                               },
//                               backgroundColor: AppTheme.primaryColor,
//                               child: Image.asset(
//                                 "assets/icons/apply.png",
//                                 width: deviceWidthSize(context, 24),
//                               ),
//                             ),
//                           ),
