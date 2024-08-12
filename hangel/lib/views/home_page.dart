import 'package:carousel_slider/carousel_slider.dart';
import 'package:countup/countup.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_typeahead/flutter_typeahead.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/models/stk_model.dart';
import '../extension/string_extension.dart';
import '../models/brand_model.dart';
import '../providers/app_view_provider.dart';
import '../providers/brand_provider.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:hangel/views/brand_detail_page.dart';
import 'package:hangel/views/brands_page.dart';
import 'package:hangel/views/stk_detail_page.dart';
import 'package:hangel/views/stk_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/app_name_widget.dart';
import 'package:provider/provider.dart';

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

  int countBrandStatistic = 133;
  int countStkStatistic = 1248;
  int countUserStatistic = 98102;
  int countVolunteerStatistic = 1890;
  int currentIndex = 0;
  final ScrollController _homescrollController = ScrollController();

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

  List<BrandModel> brandModels = [];
  @override
  Widget build(BuildContext context) {
    brandModels = context.watch<BrandProvider>().brandList;
    // stkModels = context.watch<STKProvider>().stkList;
    return Scaffold(
      body: Column(
        children: [
          AppBarWidget(
            leading: IconButton(
              onPressed: () {
                Scaffold.of(context).openDrawer();
              },
              icon: Icon(
                Icons.menu,
                color: AppTheme.secondaryColor,
                size: deviceFontSize(context, 30),
              ),
            ),
          ),
          Expanded(
            child: CustomScrollView(
              controller: _homescrollController,
              slivers: [
                buildCountStatisticsArea,
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: deviceHeightSize(context, 16),
                  ),
                ),
                // buildCarouselArea,
                // SizedBox(
                //   height: deviceHeightSize(context, 8),
                // ),
                // dotList(context),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: deviceHeightSize(context, 20),
                  ),
                ),
                SliverToBoxAdapter(child: buildBrandSearchArea),
                // buildSTKsArea,
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: deviceHeightSize(context, 50),
                  ),
                ),
                ...buildBrandsArea,

                SliverToBoxAdapter(
                  child: SizedBox(
                    height: deviceHeightSize(context, 8),
                  ),
                ),
                // buildSocialEnterprisesArea,
                // SizedBox(
                //   height: deviceHeightSize(context, 8),
                // ),
              ],
            ),
          ),
          // Expanded(
          //   child: SingleChildScrollView(
          //     controller: _homescrollController,
          //     child: const Column(
          //       children: [],
          //     ),
          //   ),
          // ),
        ],
      ),
    );
  }

  Widget get buildCarouselArea => CarouselSlider(
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
      );

  Widget get buildCountStatisticsArea => SliverToBoxAdapter(
        child: Container(
          margin: const EdgeInsets.only(top: 15),
          alignment: Alignment.center,
          width: deviceWidth(context),
          height: deviceHeight(context) * 0.12,
          color: AppTheme.primaryColor,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              buildCountStat("MARKA", countBrandStatistic),
              buildCountStat("STK", countStkStatistic),
              buildCountStat("KULLANICI", countUserStatistic),
              buildCountStat("GÖNÜLLÜ", countVolunteerStatistic),
            ],
          ),
        ),
      );

  Widget buildCountStat(String label, int count) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Countup(
          begin: 0,
          end: count.toDouble(),
          separator: ",",
          duration: const Duration(seconds: 3),
          style: TextStyle(fontSize: deviceFontSize(context, 30), color: AppTheme.white, fontWeight: FontWeight.w700),
        ),
        Text(
          label,
          style: TextStyle(fontSize: deviceFontSize(context, 15), color: AppTheme.white, fontWeight: FontWeight.w400),
        )
      ],
    );
  }

  Widget get buildBrandSearchArea => Container(
        padding: const EdgeInsets.all(8),
        width: double.infinity,
        height: deviceHeight(context) * 0.10,
        child: TypeAheadField(
          itemSeparatorBuilder: (context, index) => Divider(
            color: Colors.grey.shade300,
          ),
          itemBuilder: (context, offer) {
            return Padding(
              padding: const EdgeInsets.all(8),
              child: ListTile(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => BrandDetailPage(
                        brandModel: offer,
                      ),
                    ),
                  );
                },
                subtitle: Text(offer.sector ?? ""),
                trailing: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: deviceWidthSize(context, 10),
                    vertical: deviceHeightSize(context, 5),
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: SizedBox(
                    // height: 50,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.volunteer_activism_rounded,
                          color: AppTheme.primaryColor,
                          size: deviceFontSize(context, 18),
                        ),
                        SizedBox(
                          width: deviceWidthSize(context, 6),
                        ),
                        Text(
                          "%${(offer.donationRate)}",
                          style: AppTheme.semiBoldTextStyle(
                            context,
                            14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                leading: Container(
                    width: deviceWidthSize(context, 50),
                    height: deviceHeightSize(context, 50),
                    decoration: BoxDecoration(
                      boxShadow: AppTheme.shadowList,
                      color: AppTheme.white,
                      shape: BoxShape.circle,
                    ),
                    child: offer.logo != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(100),
                            child: Image.network(
                              offer.logo ?? "",
                              fit: BoxFit.contain,
                              alignment: Alignment.center,
                              errorBuilder: (context, error, stackTrace) => Center(
                                child: Text(
                                  offer.name![0],
                                  style: AppTheme.boldTextStyle(context, 28, color: AppTheme.black),
                                ),
                              ),
                            ),
                          )
                        : Center(
                            child: Text(
                              offer.name![0],
                              style: AppTheme.boldTextStyle(context, 28, color: AppTheme.white),
                            ),
                          )),
                title: Text(offer.name?.removeBrackets() ?? ""),
              ),
            );
          },
          emptyBuilder: (context) => const Text(""),
          errorBuilder: (context, error) => const Text("Bağlantı Problemi!"),
          builder: (context, search, focusNode) {
            return Container(
              alignment: Alignment.center,
              margin: EdgeInsets.symmetric(
                horizontal: deviceWidthSize(context, 10),
              ),
              padding: EdgeInsets.symmetric(
                horizontal: deviceWidthSize(context, 5),
                vertical: deviceHeightSize(context, 4),
              ),
              decoration: BoxDecoration(
                color: AppTheme.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: AppTheme.secondaryColor.withOpacity(0.2),
                ),
              ),
              child: TextField(
                focusNode: focusNode,
                onTap: () {
                  _homescrollController.animateTo(
                    deviceHeightSize(context, 100),
                    duration: const Duration(milliseconds: 500),
                    curve: Curves.ease,
                  );
                },
                controller: search,
                decoration: InputDecoration(
                  hintText: "Marka Ara",
                  hintStyle: AppTheme.lightTextStyle(context, 14),
                  border: InputBorder.none,
                  prefixIcon: Icon(
                    Icons.search_rounded,
                    color: AppTheme.secondaryColor.withOpacity(0.5),
                  ),
                  suffixIcon: (search.text.isNotEmpty)
                      ? IconButton(onPressed: search.clear, icon: const Icon(Icons.close))
                      : null,
                ),
              ),
            );
          },
          onSelected: (value) {},
          suggestionsCallback: (search) async {
            return await context.read<BrandProvider>().getOffersForSearch(search);
          },
        ),
      );

  Widget get buildSTKsArea => Column(
        children: [
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
                        // stkModels.length,
                        0,
                        (index) => listItemImage2(context, /*logo: stkModels[index].name,*/ donationRate: 0, onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => STKDetailPage(
                                // stkModel: stkModels[index],
                                stkModel: StkModel(),
                              ),
                            ),
                          );
                        }, logo: ''),
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
        ],
      );

  List<Widget> get buildBrandsArea => [
        SliverPadding(
          padding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 20),
          ),
          sliver: SliverToBoxAdapter(
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                "Markalar",
                style: AppTheme.semiBoldTextStyle(context, 20),
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: SizedBox(
            height: deviceHeightSize(context, 6),
          ),
        ),
        context.watch<BrandProvider>().loadingState == LoadingState.loading
            ? SliverToBoxAdapter(
                child: SizedBox(
                  height: deviceHeightSize(context, 90),
                  child: const Center(
                    child: CircularProgressIndicator(),
                  ),
                ),
              )
            : SliverPadding(
                padding: EdgeInsets.only(
                  left: deviceWidthSize(context, 20),
                  right: deviceWidthSize(context, 20),
                ),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                      childAspectRatio: 4 / 3, crossAxisSpacing: 10, mainAxisSpacing: 10, maxCrossAxisExtent: 130),
                  delegate: SliverChildBuilderDelegate(
                    (context, i) {
                      return listItemImage2(
                        context,
                        logo: brandModels[i].logo,
                        img: brandModels[i].logo,
                        donationRate: brandModels[i].donationRate ?? 0,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => BrandDetailPage(
                                brandModel: brandModels[i],
                              ),
                            ),
                          );
                        },
                      );
                    },
                    childCount: brandModels.length,
                  ),
                ),
              ),
      ];

  Widget get buildSocialEnterprisesArea => Column(
        children: [
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
                          1,
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
                            return const Text("Error");
                            //Burayı ben kapadım
                            // return listItemImage2(context, logo: "socialEnterprises[index].name", onTap: () {
                            //   // Navigator.push(
                            //   //   context,
                            //   //   MaterialPageRoute(
                            //   //     builder: (context) => BrandDetailPage(
                            //   //       brandModel: socialEnterprises[index],
                            //   //     ),
                            //   //   ),
                            //   // );
                            // });
                          },
                        ),
                        SizedBox(
                          width: deviceWidthSize(context, 20),
                        ),
                      ],
                    ),
                  ),
                ),
        ],
      );

  Widget listItemImage2(
    BuildContext context, {
    required String? logo,
    String? img,
    required double donationRate,
    required Function()? onTap,
  }) {
    // int randomIndex = (logo ?? "").length % (randomColors.length - 1);
    return InkWell(
      onTap: onTap,
      child: Stack(
        children: [
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            // width: deviceWidth(context) * 0.25,
            // height: deviceHeight(context) * 0.12,
            decoration: BoxDecoration(
              // color: randomColors[randomIndex],
              color: Colors.white,
              boxShadow: AppTheme.shadowList,
              borderRadius: BorderRadius.circular(13),
            ),
            child: Align(
              alignment: Alignment.center,
              child: img != null
                  ? Image.network(
                      img,
                      width: deviceWidth(context) * 0.15,
                      height: deviceHeight(context) * 0.05,
                      fit: BoxFit.fitWidth,
                      alignment: Alignment.center,
                      errorBuilder: (context, error, stackTrace) => const AppNameWidget(
                        fontSize: 20,
                        color: AppTheme.primaryColor,
                      ),
                    )
                  : const AppNameWidget(
                      fontSize: 20,
                      color: AppTheme.primaryColor,
                    ),
            ),
          ),
          Positioned(
            bottom: 0,
            right: 0,
            left: 0,
            child: Container(
              width: 50,
              height: 20,
              margin: const EdgeInsets.symmetric(horizontal: 15),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.volunteer_activism_rounded,
                    color: Colors.white70,
                    size: deviceFontSize(context, 18),
                  ),
                  SizedBox(
                    width: deviceWidthSize(context, 6),
                  ),
                  Text(
                    "${(donationRate)}%",
                    style: AppTheme.semiBoldTextStyle(
                      context,
                      color: AppTheme.white,
                      14,
                    ),
                  ),
                ],
              ),
            ),
          )
        ],
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
