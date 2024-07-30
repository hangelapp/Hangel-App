import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/views/brand_detail_page.dart';
import 'package:hangel/views/brands_page.dart';
import 'package:hangel/views/stk_detail_page.dart';
import 'package:hangel/views/stk_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/app_name_widget.dart';
import 'package:provider/provider.dart';

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);
  static const routeName = '/home-page';
  @override
  State<HomePage> createState() => _HomePageState();
}

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
    detailText:
        "Kuş severlerin bir araya geldiği ve güvercinlerin haklarını savunan bir dernektir.",
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
    detailText:
        "Bağımlılıkla mücadele ederek toplumda sağlıklı bir yaşamı teşvik eden bir dernektir.",
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
    detailText:
        "Toplumda fırsat eşitliği ve adaleti destekleyerek sosyal değişim yaratmayı amaçlar.",
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
    detailText:
        "Bergama'nın kültürel mirasını korumayı ve tanıtmayı amaçlayan bir dernektir.",
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
    detailText:
        "Kırsal bölgelerde yaşayan insanların ekonomik ve sosyal kalkınmasını destekler.",
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
    detailText:
        "Güzel Otomotiv, kaliteli otomobil satışı ve servis hizmetleri sunan bir şirkettir.",
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
    detailText:
        "Karlı Kuyumculuk, değerli mücevherler ve takılar sunan bir kuyumculuk markasıdır.",
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
    detailText:
        "Sağlam İnşaat, inşaat projeleri ve taahhüt hizmetleri sunan bir inşaat şirketidir.",
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
    detailText:
        "Bizim Kargo, hızlı ve güvenilir kargo hizmetleri sunan bir lojistik şirketidir.",
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
    detailText:
        "Doyuran Restoran, lezzetli yemekler ve misafirperverlik sunan bir restoran zinciridir.",
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

class _HomePageState extends State<HomePage> {
  List<String> sliderImages = [
    "https://www.turkonfed.org/images/Volunteering-Program.png",
    "https://www.fm-magazine.com/content/dam/cgma/magazine/news/volunteer-819.jpg.transform/750w/image.png",
    "https://students.1fbusa.com/hubfs/25%20Ways%20to%20Volunteer%20in%20Your%20Community.jpg",
    "https://www.glasshouserecruiting.co.za/wp-content/uploads/2022/06/Volunteer1.png",
    "https://kacuv.org/en/wp-content/uploads/2020/10/kacuv-pattern.png"
  ];
  List<String> bannerImages = [
    "assets/images/banner1.jpeg",
    "assets/images/banner2.jpeg",
  ];

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

  int currentIndex = 0;
  @override
  void initState() {
    SchedulerBinding.instance.addPostFrameCallback((_) {
      // brandModels.forEach((element) {
      //   context.read<BrandProvider>().addBrand(element);
      // });
      // stkModels.forEach((element) {
      //   context.read<STKProvider>().addSTK(element);
      // });
      context.read<BrandProvider>().getBrands();
      context.read<STKProvider>().getSTKs();
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    brandModels = context.watch<BrandProvider>().brandList;
    stkModels = context.watch<STKProvider>().stkList;
    socialEnterprises = brandModels.where((element) {
      return element.isSocialEnterprise == true;
    }).toList();
    return Scaffold(
      body: Column(
        children: [
          AppBarWidget(
            leading: IconButton(
              onPressed: () {
                scaffoldKey.currentState!.openDrawer();
              },
              icon: Icon(
                Icons.menu,
                color: AppTheme.secondaryColor,
                size: deviceFontSize(context, 30),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  SizedBox(
                    height: deviceHeightSize(context, 16),
                  ),
                  CarouselSlider(
                    items: [
                      ...List.generate(
                        bannerImages.length,
                        (index) => Container(
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(13),
                            image: DecorationImage(
                              image: AssetImage(bannerImages[index]),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      ),
                      ...List.generate(
                        sliderImages.length,
                        (index) => Container(
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(13),
                            image: DecorationImage(
                              image: NetworkImage(sliderImages[index]),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      )
                    ],
                    options: CarouselOptions(
                      onPageChanged: (index, reason) {
                        setState(() {
                          currentIndex = index;
                        });
                      },
                      height: deviceHeightSize(context, 180),
                      viewportFraction: 0.8,
                      enlargeCenterPage: true,
                      autoPlay: true,
                      autoPlayInterval: const Duration(seconds: 5),
                      autoPlayAnimationDuration: const Duration(seconds: 1),
                      autoPlayCurve: Curves.fastOutSlowIn,
                      scrollDirection: Axis.horizontal,
                    ),
                  ),
                  SizedBox(
                    height: deviceHeightSize(context, 8),
                  ),
                  dotList(context),
                  Column(
                    children: [
                      SizedBox(
                        height: deviceHeightSize(context, 8),
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: deviceWidthSize(context, 20),
                        ),
                        alignment: Alignment.centerLeft,
                        child: Text(
                          "STK'lar",
                          style: AppTheme.semiBoldTextStyle(context, 20),
                        ),
                      ),
                      SizedBox(
                        height: deviceHeightSize(context, 6),
                      ),
                      context.watch<STKProvider>().loadingState ==
                              LoadingState.loading
                          ? SizedBox(
                              height: deviceHeightSize(context, 90),
                              child: const Center(
                                child: CircularProgressIndicator(),
                              ),
                            )
                          : SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              clipBehavior: Clip.none,
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: deviceWidthSize(context, 20),
                                  ),
                                  ...List.generate(
                                    stkModels.length,
                                    (index) => listItemImage2(context,
                                        logo: stkModels[index].name, onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => STKDetailPage(
                                            stkModel: stkModels[index],
                                          ),
                                        ),
                                      );
                                    }),
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      context
                                          .read<LoginRegisterPageProvider>()
                                          .selectedWidget = const STKPage();
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.all(8.0),
                                      child: Column(
                                        children: [
                                          Icon(
                                            Icons.arrow_forward_ios_rounded,
                                            color: AppTheme.black,
                                            size: deviceFontSize(context, 20),
                                          ),
                                          SizedBox(
                                            height:
                                                deviceHeightSize(context, 8),
                                          ),
                                          Text(
                                            "Tümünü\nGör",
                                            textAlign: TextAlign.center,
                                            style: AppTheme.normalTextStyle(
                                                context, 18),
                                          )
                                        ],
                                      ),
                                    ),
                                  ),
                                  SizedBox(
                                    width: deviceWidthSize(context, 20),
                                  ),
                                ],
                              ),
                            ),
                      SizedBox(
                        height: deviceHeightSize(context, 8),
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: deviceWidthSize(context, 20),
                        ),
                        alignment: Alignment.centerLeft,
                        child: Text(
                          "Markalar",
                          style: AppTheme.semiBoldTextStyle(context, 20),
                        ),
                      ),
                      SizedBox(
                        height: deviceHeightSize(context, 6),
                      ),
                      context.watch<BrandProvider>().loadingState ==
                              LoadingState.loading
                          ? SizedBox(
                              height: deviceHeightSize(context, 90),
                              child: const Center(
                                child: CircularProgressIndicator(),
                              ),
                            )
                          : SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              clipBehavior: Clip.none,
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: deviceWidthSize(context, 20),
                                  ),
                                  ...List.generate(
                                    brandModels.length,
                                    (index) => listItemImage2(context,
                                        logo: brandModels[index].name,
                                        onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => BrandDetailPage(
                                            brandModel: brandModels[index],
                                          ),
                                        ),
                                      );
                                    }),
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      context
                                          .read<LoginRegisterPageProvider>()
                                          .selectedWidget = const BrandsPage();
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.all(8.0),
                                      child: Column(
                                        children: [
                                          Icon(
                                            Icons.arrow_forward_ios_rounded,
                                            color: AppTheme.black,
                                            size: deviceFontSize(context, 20),
                                          ),
                                          SizedBox(
                                            height:
                                                deviceHeightSize(context, 8),
                                          ),
                                          Text(
                                            "Tümünü\nGör",
                                            textAlign: TextAlign.center,
                                            style: AppTheme.normalTextStyle(
                                                context, 18),
                                          )
                                        ],
                                      ),
                                    ),
                                  ),
                                  SizedBox(
                                    width: deviceWidthSize(context, 20),
                                  ),
                                ],
                              ),
                            ),
                      SizedBox(
                        height: deviceHeightSize(context, 8),
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: deviceWidthSize(context, 20),
                        ),
                        alignment: Alignment.centerLeft,
                        child: Text(
                          "Sosyal Şirketler",
                          style: AppTheme.semiBoldTextStyle(context, 20),
                        ),
                      ),
                      SizedBox(
                        height: deviceHeightSize(context, 6),
                      ),
                      context.watch<BrandProvider>().loadingState ==
                              LoadingState.loading
                          ? SizedBox(
                              height: deviceHeightSize(context, 90),
                              child: const Center(
                                child: CircularProgressIndicator(),
                              ),
                            )
                          : SizedBox(
                              width: deviceWidth(context),
                              child: SingleChildScrollView(
                                scrollDirection: Axis.horizontal,
                                clipBehavior: Clip.none,
                                child: Row(
                                  children: [
                                    SizedBox(
                                      width: deviceWidthSize(context, 20),
                                    ),
                                    ...List.generate(
                                      socialEnterprises.length,
                                      (index) {
                                        if (index == 4) {
                                          return GestureDetector(
                                            onTap: () {
                                              context
                                                      .read<BrandProvider>()
                                                      .filterText =
                                                  "socialEnterprise";

                                              context
                                                      .read<
                                                          LoginRegisterPageProvider>()
                                                      .selectedWidget =
                                                  const BrandsPage();
                                            },
                                            child: Padding(
                                              padding:
                                                  const EdgeInsets.all(8.0),
                                              child: Column(
                                                children: [
                                                  Icon(
                                                    Icons
                                                        .arrow_forward_ios_rounded,
                                                    color: AppTheme.black,
                                                    size: deviceFontSize(
                                                        context, 20),
                                                  ),
                                                  SizedBox(
                                                    height: deviceHeightSize(
                                                        context, 8),
                                                  ),
                                                  Text(
                                                    "Tümünü\nGör",
                                                    textAlign: TextAlign.center,
                                                    style: AppTheme
                                                        .normalTextStyle(
                                                            context, 18),
                                                  )
                                                ],
                                              ),
                                            ),
                                          );
                                        }
                                        if (index > 4) {
                                          return const SizedBox();
                                        }
                                        return listItemImage2(context,
                                            logo: socialEnterprises[index].name,
                                            onTap: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (context) =>
                                                  BrandDetailPage(
                                                brandModel:
                                                    socialEnterprises[index],
                                              ),
                                            ),
                                          );
                                        });
                                      },
                                    ),
                                    SizedBox(
                                      width: deviceWidthSize(context, 20),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                      SizedBox(
                        height: deviceHeightSize(context, 8),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  GestureDetector listItemImage(
    BuildContext context, {
    required String? logo,
    required Function()? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: deviceWidthSize(context, 130),
        height: deviceHeightSize(context, 150),
        margin: EdgeInsets.only(
          right: deviceWidthSize(context, 10),
        ),
        decoration: BoxDecoration(
          color: AppTheme.white,
          boxShadow: AppTheme.shadowList,
          borderRadius: BorderRadius.circular(13),
          image: DecorationImage(
            image: NetworkImage(logo ?? ""),
            fit: BoxFit.cover,
          ),
        ),
      ),
    );
  }

  GestureDetector listItemImage2(
    BuildContext context, {
    required String? logo,
    required Function()? onTap,
  }) {
    int randomIndex = (logo ?? "").length % (randomColors.length - 1);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: deviceWidthSize(context, 90),
        height: deviceHeightSize(context, 90),
        margin: EdgeInsets.only(
          right: deviceWidthSize(context, 10),
        ),
        decoration: BoxDecoration(
          color: randomColors[randomIndex],
          boxShadow: AppTheme.shadowList,
          borderRadius: BorderRadius.circular(13),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const AppNameWidget(
              fontSize: 20,
              color: AppTheme.white,
            ),
            SizedBox(
              height: deviceHeightSize(context, 8),
            ),
          ],
        ),
      ),
    );
  }

  dotList(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(
        sliderImages.length + bannerImages.length,
        (index) => AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 2),
          ),
          width: deviceWidthSize(context, currentIndex == index ? 12 : 8),
          height: deviceHeightSize(context, 8),
          decoration: BoxDecoration(
            color: currentIndex == index
                ? AppTheme.primaryColor
                : AppTheme.secondaryColor.withOpacity(0.2),
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
    );
  }
}
