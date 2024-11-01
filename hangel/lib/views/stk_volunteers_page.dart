import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_pagination/firebase_pagination.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_typeahead/flutter_typeahead.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/models/stk_volunteer_model.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/providers/volunteer_provider.dart';
import 'package:hangel/views/brand_detail_page.dart';
import 'package:hangel/views/stk_detail_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/list_item_widget.dart';
import 'package:provider/provider.dart';

class STKVolunteersPage extends StatefulWidget {
  const STKVolunteersPage({Key? key}) : super(key: key);
  static const routeName = '/stkVolunteers';
  @override
  State<STKVolunteersPage> createState() => _STKVolunteersPageState();
}

class _STKVolunteersPageState extends State<STKVolunteersPage> {
  List<StkModel> _stkList = [];
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool isLoading = false;
  @override
  void initState() {
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      await context.read<VolunteerProvider>().getStks();
    });
    super.initState();
  }

  // Future<void> _loadMoreData() async {
  //   setState(() {
  //     _isLoading = true;
  //   });
  //   context.read<BrandProvider>().nextPage();
  //   await context.read<BrandProvider>().getOffers().whenComplete(
  //         () => setState(() => _isLoading = false),
  //       );
  // }

  List<Map<String, String>> filters = [
    {
      "name": "brand_detail_page_deprem_bolgesi".locale,
      "value": "depremBolgesi",
    },
    {
      "name": "brand_detail_page_sosyal_girisim".locale,
      "value": "socialEnterprise",
    },
    {
      "name": "select_favorite_stk_all".locale,
      "value": "",
    },
  ];

  List<Map<String, String>> sorts = [
    {
      "name": "home_page_sort_donation_rate_desc".locale,
      "value": "bagisOraniYuksektenDusuge",
    },
    {
      "name": "home_page_sort_donation_rate_asc".locale,
      "value": "bagisOraniDusuktenYuksege",
    },
    {
      "name": "home_page_sort_newest_oldest".locale,
      "value": "enYenidenEnEskiye",
    },
    {
      "name": "home_page_sort_oldest_newest".locale,
      "value": "enEskidenEnYeniye",
    },
    {
      "name": "A-Z",
      "value": "A-Z",
    },
    {
      "name": "Z-A",
      "value": "Z-A",
    },
  ];

  @override
  Widget build(BuildContext context) {
    _stkList = context.watch<VolunteerProvider>().stkVolunteers;
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
          SizedBox(height: deviceTopPadding(context)),
          Container(
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
                    trailing: Column(
                      children: [
                        Text(
                          "Bağış Oranı",
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
              suggestionsCallback: (search) async {
                return await context.read<BrandProvider>().getOffersForSearch(search);
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
                            child: Text(
                              "gonullu_ilanlari".locale,
                              style: AppTheme.boldTextStyle(context, 20),
                            ),
                          ),
                          filterAndSort(context),
                        ],
                      ),

                      Expanded(
                        child: FirestorePagination(
                          // padding: EdgeInsets.zero,
                          limit: 5,
                          isLive: true,
                          initialLoader: Center(child: CircularProgressIndicator()),
                          bottomLoader: LinearProgressIndicator(),
                          query: FirebaseFirestore.instance
                              .collection('stkVolunteers')
                              .where("isActive", isEqualTo: true)
                              .orderBy('stkName'),
                          itemBuilder: (context, docs, index) {
                            final stk = StkVolunteerModel.fromJson((docs[index].data() as Map<String, dynamic>));
                            return isLoading
                                ? Center(child: LinearProgressIndicator())
                                : ListItemWidget(
                                    context,
                                    logo: stk.stkLogo,
                                    title: stk.stkName.toString(),
                                    sector: stk.stkCategory,
                                    stkEmail: stk.stkEmail,
                                    stkId: stk.stkId,
                                    isSTKVolunteer: true,
                                    totalAplicant: stk.applicantIds,
                                    onTap: () async {
                                      setState(() {
                                        isLoading = true;
                                      });
                                      try {
                                        // Veriyi Firestore'dan al
                                        var snapshot = await FirebaseFirestore.instance
                                            .collection("stklar")
                                            .where("id", isEqualTo: stk.stkId)
                                            .limit(1)
                                            .get();
                                        setState(() {
                                          isLoading = false;
                                        });
                                        // Veriyi modele çevir
                                        StkModel stkModel = StkModel.fromJson(snapshot.docs.first.data());
                                        // Yeni sayfaya yönlendir
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => STKDetailPage(
                                              stkModel: stkModel,
                                            ),
                                          ),
                                        );
                                      } catch (e) {
                                        setState(() {
                                          isLoading = false;
                                        });
                                        print(e);
                                      }
                                    },
                                  );
                          },
                        ),
                      ),

                      // Expanded(
                      //   child: FutureBuilder(
                      //     future: context.read<VolunteerProvider>().getStks(),
                      //     builder: (context, snapshot) {
                      //       if (snapshot.hasData) {
                      //         return ListView.builder(
                      //           controller: _scrollController,
                      //           itemCount: snapshot.data?.length ?? 0,
                      //           // itemCount: _stkList.length,
                      //           itemBuilder: (context, index) {
                      //             return ListItemWidget(
                      //               context,
                      //               sector: (snapshot.data?[index].categories ?? [""]).first,
                      //               logo: snapshot.data?[index].logo,
                      //               title: (snapshot.data?[index].name ?? "").removeBrackets(),
                      //               desc: snapshot.data?[index].detailText,
                      //               isSTKVolunteer: true,
                      //               onTap: () {
                      //                 if (snapshot.data?[index] != null) {
                      //                   Navigator.push(
                      //                       context,
                      //                       MaterialPageRoute(
                      //                         builder: (context) => STKDetailPage(stkModel: snapshot.data![index]),
                      //                       ));
                      //                 }
                      //               },
                      //             );
                      //           },
                      //         );
                      //       } else {
                      //         return Center(child: CircularProgressIndicator());
                      //       }
                      //     },
                      //   ),
                      // ),
                      // _isLoading ? const LinearProgressIndicator() : const SizedBox.shrink()
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
                  child: Text(sorts[index]["name"] ?? "",
                      style: context.read<BrandProvider>().sortText == sorts[index]["value"]
                          ? AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor)
                          : AppTheme.normalTextStyle(context, 14)),
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
              ...List.generate(
                filters.length,
                (index) => PopupMenuItem(
                  value: filters[index]["value"],
                  child: Text(filters[index]["name"] ?? "",
                      style: context.read<BrandProvider>().filterText == filters[index]["value"]
                          ? AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor)
                          : AppTheme.normalTextStyle(context, 14)),
                ),
              ),
            ],
            onSelected: (value) {
              if (value == "Tümü") {
                value = "";
              }
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
}
