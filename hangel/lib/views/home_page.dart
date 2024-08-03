import 'dart:convert';

import 'package:carousel_slider/carousel_slider.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_typeahead/flutter_typeahead.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/providers/app_view_provider.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/providers/offer_provider.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/views/brand_detail_page.dart';
import 'package:hangel/views/brands_page.dart';
import 'package:hangel/views/stk_detail_page.dart';
import 'package:hangel/views/stk_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/app_name_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:provider/provider.dart';

import '../models/offer_model.dart';
import 'utilities.dart';

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);
  static const routeName = '/home-page';
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<String> sliderImages = [
    "https://www.turkonfed.org/images/Volunteering-Program.png",
    "https://www.fm-magazine.com/content/dam/cgma/magazine/news/volunteer-819.jpg.transform/750w/image.png",
    "https://students.1fbusa.com/hubfs/25%20Ways%20to%20Volunteer%20in%20Your%20Community.jpg",
    "https://fjwp.s3.amazonaws.com/blog/wp-content/uploads/2020/10/15153848/The-Career-Benefits-of-Volunteering-During-Your-Job-Search-2.jpg",
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

  List<OfferModel> offerList = [];
  Map<String, String> offerImages = {};
  @override
  Widget build(BuildContext context) {
    brandModels = context.watch<BrandProvider>().brandList;
    stkModels = context.watch<STKProvider>().stkList;
    offerList = context.watch<OfferProvider>().offers;
    offerImages = context.watch<OfferProvider>().offerImages;
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
                      SizedBox(
                        width: double.infinity,
                        height: deviceHeight(context) * 0.1,
                        child: TypeAheadField(
                          itemBuilder: (context, offer) {
                            return ListTile(
                              title: Text(offer.name ?? ""),
                            );
                          },
                          onSelected: (value) {},
                          suggestionsCallback: (search) {
                            return context.read<OfferProvider>().getOfferByName(search);
                          },
                        ),
                      ),
                      GeneralButtonWidget(
                          onPressed: () async {
                            // var response = await context.read<OfferProvider>().getOffers();
                            // var response2 = await context.read<OfferProvider>().getOfferImages();
                            var response2 = await context.read<OfferProvider>().getOfferByName("Col");

                            // print(response2);
                            setState(() {});
                          },
                          text: "ARA"),
                      SizedBox(
                        width: double.maxFinite,
                        height: deviceHeight(context) * 0.4,
                        child: ListView.builder(
                          itemCount: offerList.length,
                          itemBuilder: (context, i) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              child: ListTile(
                                leading: CircleAvatar(
                                  radius: 30,
                                  child: Image.network(
                                    offerImages[offerList[i].id] ??
                                        "https://bulutistan.com/blog/wp-content/uploads/2023/01/Depositphotos_1348029_S-800x443.jpg",
                                    errorBuilder: (context, error, stackTrace) => const AppNameWidget(
                                      fontSize: 12,
                                    ),
                                    loadingBuilder: (context, child, loadingProgress) {
                                      if (loadingProgress == null) return child;
                                      return Center(
                                        child: CircularProgressIndicator(
                                          value: loadingProgress.expectedTotalBytes != null
                                              ? loadingProgress.cumulativeBytesLoaded /
                                                  loadingProgress.expectedTotalBytes!
                                              : null,
                                        ),
                                      );
                                    },
                                  ),
                                ),
                                title: Text(offerList[i].name ?? "-"),
                              ),
                            );
                          },
                        ),
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
                      context.watch<STKProvider>().loadingState == LoadingState.loading
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
                                    (index) => listItemImage2(context, logo: stkModels[index].name, onTap: () {
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
                                      context.read<AppViewProvider>().selectedWidget = const STKPage();
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
                                            height: deviceHeightSize(context, 8),
                                          ),
                                          Text(
                                            "Tümünü\nGör",
                                            textAlign: TextAlign.center,
                                            style: AppTheme.normalTextStyle(context, 18),
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
                      context.watch<BrandProvider>().loadingState == LoadingState.loading
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
                                    (index) => listItemImage2(context, logo: brandModels[index].name,
                                        //  img: photos.first,
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
                                      context.read<AppViewProvider>().selectedWidget = const BrandsPage();
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
                                            height: deviceHeightSize(context, 8),
                                          ),
                                          Text(
                                            "Tümünü\nGör",
                                            textAlign: TextAlign.center,
                                            style: AppTheme.normalTextStyle(context, 18),
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
                      context.watch<BrandProvider>().loadingState == LoadingState.loading
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
                                              context.read<BrandProvider>().filterText = "socialEnterprise";

                                              context.read<AppViewProvider>().selectedWidget = const BrandsPage();
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
                                                    height: deviceHeightSize(context, 8),
                                                  ),
                                                  Text(
                                                    "Tümünü\nGör",
                                                    textAlign: TextAlign.center,
                                                    style: AppTheme.normalTextStyle(context, 18),
                                                  )
                                                ],
                                              ),
                                            ),
                                          );
                                        }
                                        if (index > 4) {
                                          return const SizedBox();
                                        }
                                        return listItemImage2(context, logo: socialEnterprises[index].name, onTap: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (context) => BrandDetailPage(
                                                brandModel: socialEnterprises[index],
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
    String? img,
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
            img != null
                ? Image.network(
                    img,
                    fit: BoxFit.fill,
                  )
                : const AppNameWidget(
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
            color: currentIndex == index ? AppTheme.primaryColor : AppTheme.secondaryColor.withOpacity(0.2),
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
    );
  }
}
