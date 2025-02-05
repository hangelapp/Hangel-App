import 'dart:math';

import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_typeahead/flutter_typeahead.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/views/brand_detail_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/list_item_widget.dart';
import 'package:hangel/widgets/locale_text.dart';
import 'package:in_app_review/in_app_review.dart';
import 'package:provider/provider.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  static const routeName = '/home';
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<BrandModel> _brandList = [];
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = false;
  int selectedCategory = 0;
  List<CategoryModel> categories = [
    CategoryModel(name: "Öne Çıkan", donationRate: 0.0),
    CategoryModel(name: "Tekstil", donationRate: 0.0),
    CategoryModel(name: "E-Ticaret", donationRate: 0.0),
  ];
  @override
  void initState() {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<BrandProvider>().getSectorsList();
      await context.read<BrandProvider>().getBrands();
      await context.read<BrandProvider>().getBanners();
      await showAppRateDialog();
    });
    _scrollController.addListener(() async {
      if (_scrollController.position.pixels >= (_scrollController.position.maxScrollExtent - 250) && !_isLoading) {
        await _loadMoreData();
      }
    });
    super.initState();
  }

  Future<void> showAppRateDialog() async {
    int rand = Random().nextInt(100);
    if (rand < 99) return;
    final InAppReview inAppReview = InAppReview.instance;

    if (await inAppReview.isAvailable()) {
      await inAppReview.requestReview();
    }
  }

  Future<void> _loadMoreData() async {
    setState(() {
      _isLoading = true;
    });
    context.read<BrandProvider>().nextPage();
    await Future.wait([
      context.read<BrandProvider>().getOffers2().whenComplete(() => setState(() => _isLoading = false)),
      context.read<BrandProvider>().getOffers().whenComplete(() => setState(() => _isLoading = false))
    ]);
  }

  List<Map<String, String>> filters = [
    {
      "name": "home_page_all",
      "value": "",
    },
  ];

  List<Map<String, String>> sorts = [
    {
      "name": "home_page_sort_donation_rate_desc",
      "value": "bagisOraniYuksektenDusuge",
    },
    {
      "name": "home_page_sort_donation_rate_asc",
      "value": "bagisOraniDusuktenYuksege",
    },
    {
      "name": "home_page_sort_newest_oldest",
      "value": "enYenidenEnEskiye",
    },
    {
      "name": "home_page_sort_oldest_newest",
      "value": "enEskidenEnYeniye",
    },
    {
      "name": "home_page_sort_a_z",
      "value": "A-Z",
    },
    {
      "name": "home_page_sort_z_a",
      "value": "Z-A",
    },
  ];

  final CarouselSliderController _carouselController = CarouselSliderController();

  @override
  Widget build(BuildContext context) {
    _brandList = context.watch<BrandProvider>().brandList;
    Size size = MediaQuery.of(context).size;
    bool bannerLoaded = context.watch<BrandProvider>().bannerLoaded;
    List<String> banners = context.watch<BrandProvider>().bannerImages;
    return Scaffold(
      backgroundColor: Colors.white,
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
          bannerArea(banners, bannerLoaded, size),
          Container(
            padding: const EdgeInsets.all(8),
            width: double.infinity,
            height: deviceHeight(context) * 0.09,
            child: TypeAheadField(
              itemSeparatorBuilder: (context, index) => Divider(color: Colors.grey.shade300),
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
                    trailing: Column(
                      children: [
                        LocaleText(
                          'home_page_donation_rate',
                          style: AppTheme.normalTextStyle(context, 14),
                        ),
                        Container(
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
                      ],
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
                                  offer.logo!,
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
                    title: Text(offer.name ?? ""),
                  ),
                );
              },
              emptyBuilder: (context) => const Text(""),
              errorBuilder: (context, error) => LocaleText('home_page_connection_problem'),
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
                    // border: Border.all(
                    //   color: AppTheme.secondaryColor.withOpacity(0.2),
                    // ),
                  ),
                  child: TextField(
                    focusNode: focusNode,
                    onTap: () {
                      _scrollController.animateTo(
                        deviceHeightSize(context, 200),
                        duration: const Duration(milliseconds: 500),
                        curve: Curves.ease,
                      );
                    },
                    controller: search,
                    decoration: InputDecoration(
                      hintText: "home_page_search_brand".locale,
                      hintStyle: AppTheme.lightTextStyle(context, 14),
                      // border: InputBorder.none,
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
              hideOnEmpty: true,
              hideWithKeyboard: false,
              suggestionsCallback: (search) async {
                if (search.length < 2) return [];
                var response1 = await context.read<BrandProvider>().getOffersForSearch(search);
                var response2 = await context.read<BrandProvider>().getOffersForSearch2(search);
                return response1 + response2;
              },
            ),
          ),
          Expanded(
            child: context.watch<BrandProvider>().loadingState == LoadingState.loading
                ? const Center(child: CircularProgressIndicator())
                : Column(
                    children: [
                      SizedBox(
                        height: deviceHeightSize(context, 10),
                      ),
                      //filter and sort
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Padding(
                            padding: EdgeInsets.only(
                              left: deviceWidthSize(context, 20),
                            ),
                            child: LocaleText(
                              'home_page_brands',
                              style: AppTheme.boldTextStyle(context, 20),
                            ),
                          ),
                          filterAndSort(context),
                        ],
                      ),
                      Expanded(
                        child: Row(
                          children: [
                            //Filtered ListView
                            // Container(
                            //   width: size.width * 0.2,
                            //   height: size.height,
                            //   decoration: BoxDecoration(color: Colors.grey.shade100, boxShadow: [
                            //     BoxShadow(
                            //       offset: const Offset(1, 2),
                            //       blurRadius: 2,
                            //       color: Colors.black.withOpacity(0.1),
                            //     )
                            //   ]),
                            //   child: ListView.builder(
                            //     padding: EdgeInsets.zero,
                            //     itemCount: categories.length,
                            //     itemBuilder: (context, index) {
                            //       if (selectedCategory == index) {
                            //         return GestureDetector(
                            //           onTap: () {
                            //             setState(() {
                            //               selectedCategory = index;
                            //             });
                            //           },
                            //           child: Stack(
                            //             children: [
                            //               Positioned(
                            //                 child: Container(
                            //                   alignment: Alignment.center,
                            //                   height: size.height * 0.05,
                            //                   width: size.width * 0.2,
                            //                   color: Colors.white,
                            //                   child: AutoSizeText(
                            //                     categories[index].name ?? "",
                            //                     style: const TextStyle(
                            //                       fontWeight: FontWeight.bold,
                            //                     ),
                            //                     maxLines: 2,
                            //                     textAlign: TextAlign.center,
                            //                   ),
                            //                 ),
                            //               ),
                            //               Positioned(
                            //                 top: size.height * 0.015,
                            //                 bottom: size.height * 0.015,
                            //                 width: 3,
                            //                 child: Container(color: AppTheme.primaryColor),
                            //               ),
                            //             ],
                            //           ),
                            //         );
                            //       }
                            //       return InkWell(
                            //         onTap: () {
                            //           setState(() {
                            //             selectedCategory = index;
                            //           });
                            //         },
                            //         child: Container(
                            //           alignment: Alignment.center,
                            //           height: size.height * 0.05,
                            //           width: size.width,
                            //           decoration: BoxDecoration(
                            //               color: Colors.grey.shade100,
                            //               border: const Border(
                            //                 bottom: BorderSide(
                            //                   width: 0.5,
                            //                   color: Colors.white
                            //                 ),
                            //               )),
                            //           child: AutoSizeText(
                            //             categories[index].name ?? "",
                            //             style: const TextStyle(
                            //               fontWeight: FontWeight.bold,
                            //             ),
                            //             maxLines: 2,
                            //             textAlign: TextAlign.center,
                            //           ),
                            //         ),
                            //       );
                            //     },
                            //   ),
                            // ),
                            Expanded(
                              child: ListView.builder(
                                padding: EdgeInsets.zero,
                                controller: _scrollController,
                                itemCount: _brandList.length,
                                itemBuilder: (context, index) {
                                  bool isSearch = _brandList[index]
                                      .name!
                                      .toLowerCase()
                                      .contains(_searchController.text.toLowerCase());
                                  bool isFilter = false;
                                  String filterText = context.read<BrandProvider>().filterText;
                                  switch (filterText) {
                                    case "depremBolgesi":
                                      isFilter = _brandList[index].inEarthquakeZone!;
                                      break;
                                    case "socialEnterprise":
                                      isFilter = _brandList[index].isSocialEnterprise!;
                                      break;
                                    default:
                                      isFilter = (_brandList[index].sector ?? "")
                                          .toLowerCase()
                                          .contains(filterText.toLowerCase());
                                      break;
                                  }

                                  (_brandList[index].sector ?? "")
                                      .toLowerCase()
                                      .contains(context.read<BrandProvider>().filterText.toLowerCase());

                                  bool isReturn = isSearch && isFilter;
                                  return isReturn
                                      ? ListItemWidget(
                                          context,
                                          sector: _brandList[index].sector,
                                          logo: _brandList[index].logo,
                                          title: (_brandList[index].name ?? "").removeBrackets(),
                                          desc: _brandList[index].detailText,
                                          donationRate: _brandList[index].donationRate,
                                          logoWidth: deviceWidthSize(context, 50),
                                          logoHeight: deviceWidthSize(context, 50),
                                          fontSize: 9,
                                          onTap: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) => BrandDetailPage(
                                                  brandModel: _brandList[index],
                                                ),
                                              ),
                                            );
                                          },
                                        )
                                      : Container();
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                      _isLoading ? const LinearProgressIndicator() : const SizedBox.shrink()
                    ],
                  ),
          )
        ],
      ),
    );
  }

  Padding filterAndSort(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        right: deviceWidthSize(context, 20),
      ),
      child: Row(
        children: [
          PopupMenuButton(
            color: Colors.white,
            surfaceTintColor: Colors.white,
            itemBuilder: (context) => [
              ...List.generate(
                sorts.length,
                (index) => PopupMenuItem(
                  value: sorts[index]["value"],
                  child: LocaleText(
                    sorts[index]["name"]!,
                    style: context.read<BrandProvider>().sortText == sorts[index]["value"]
                        ? AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor)
                        : AppTheme.normalTextStyle(context, 14),
                  ),
                ),
              ),
            ],
            onSelected: (value) {
              context.read<BrandProvider>().sortBrands(value);
            },
            child: Icon(
              Icons.sort_rounded,
              color: context.read<BrandProvider>().sortText == ""
                  ? AppTheme.secondaryColor.withOpacity(0.5)
                  : AppTheme.primaryColor,
            ),
          ),
          SizedBox(
            width: deviceWidthSize(context, 10),
          ),
          PopupMenuButton(
            color: Colors.white,
            surfaceTintColor: Colors.white,
            itemBuilder: (context) => [
              ...List.generate(
                filters.length,
                (index) => PopupMenuItem(
                  value: filters[index]["value"],
                  child: LocaleText(
                    filters[index]["name"]!,
                    style: context.read<BrandProvider>().filterText == filters[index]["value"]
                        ? AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor)
                        : AppTheme.normalTextStyle(context, 14),
                  ),
                ),
              ),
              ...List.generate(
                context.read<BrandProvider>().brandSectors.length,
                (index) => PopupMenuItem(
                  value: context.read<BrandProvider>().brandSectors[index],
                  child: Text(context.read<BrandProvider>().brandSectors[index],
                      style:
                          context.read<BrandProvider>().filterText == context.read<BrandProvider>().brandSectors[index]
                              ? AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor)
                              : AppTheme.normalTextStyle(context, 14)),
                ),
              ),
            ],
            onSelected: (value) {
              // if (value == "Tümü") {
              //   value = "";
              // }
              context.read<BrandProvider>().filterText = value;
            },
            child: Icon(
              Icons.filter_alt_rounded,
              color: context.read<BrandProvider>().filterText == ""
                  ? AppTheme.secondaryColor.withOpacity(0.5)
                  : AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget bannerArea(List<String> banners, bool bannerLoaded, Size size) {
    return bannerLoaded && banners.isNotEmpty
        ? Container(
            width: size.width,
            height: size.height * 0.1,
            margin: const EdgeInsets.all(8),
            clipBehavior: Clip.antiAliasWithSaveLayer,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
            ),
            child: CarouselSlider.builder(
              itemBuilder: (context, index, realIndex) {
                return Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.network(
                      banners[index],
                      fit: BoxFit.cover,
                      width: double.infinity,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return LinearProgressIndicator(
                          color: Colors.grey.shade100,
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                              : null,
                          backgroundColor: Colors.transparent,
                        );
                      },
                    ),
                    Positioned(
                      right: 10,
                      bottom: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          "${index + 1}/${banners.length}",
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                );
              },
              options: CarouselOptions(
                autoPlay: true,
                enlargeCenterPage: true,
                viewportFraction: 1,
                aspectRatio: 16 / 9,
                initialPage: 0,
                autoPlayInterval: const Duration(seconds: 10),
                autoPlayAnimationDuration: const Duration(milliseconds: 400),
                autoPlayCurve: Curves.fastOutSlowIn,
              ),
              carouselController: _carouselController,
              itemCount: banners.length,
            ),
          )
        : const SizedBox();
  }
}
