import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_pagination/firebase_pagination.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/models/stk_volunteer_model.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/providers/volunteer_provider.dart';
import 'package:hangel/views/stk_detail_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/list_item_widget.dart';
import 'package:hangel/widgets/stk_search_widget.dart';
import 'package:provider/provider.dart';

class STKVolunteersPage extends StatefulWidget {
  const STKVolunteersPage({super.key});
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
          STKSearchWidget(controller: _searchController),
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
                          initialLoader: const Center(child: CircularProgressIndicator()),
                          bottomLoader: const LinearProgressIndicator(),
                          query: FirebaseFirestore.instance
                              .collection('stkVolunteers')
                              .where("isActive", isEqualTo: true)
                              .orderBy('stkName'),
                          itemBuilder: (context, docs, index) {
                            final stk = StkVolunteerModel.fromJson((docs[index].data() as Map<String, dynamic>));
                            return isLoading
                                ? const Center(child: LinearProgressIndicator())
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
