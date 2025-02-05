import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_pagination/firebase_pagination.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/views/auth/register_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/gradient_widget.dart';
import 'package:hangel/widgets/locale_text.dart';
import 'package:hangel/widgets/toast_widgets.dart';
import 'package:provider/provider.dart';

import '../helpers/hive_helpers.dart';
import '../models/stk_model.dart';
import '../models/user_model.dart';
import '../widgets/stk_favorite_search_widget.dart';

class SelectFavoriteStkPage extends StatefulWidget {
  const SelectFavoriteStkPage({super.key, this.inTree = true, this.selectedSTKIds});
  static const routeName = '/select-favorite-stk-page';
  final bool inTree;
  final List<String>? selectedSTKIds;

  @override
  State<SelectFavoriteStkPage> createState() => _SelectFavoriteStkPageState();
}

class _SelectFavoriteStkPageState extends State<SelectFavoriteStkPage> {
  List<String> selectedStkIdList = [];
  final TextEditingController _searchController = TextEditingController();
  bool isLoading = false;
  UserModel user = HiveHelpers.getUserFromHive();
  final List<String> _tabs = [
    "select_favorite_stk_all",
    "select_favorite_stk_association",
    "select_favorite_stk_foundation",
    "select_favorite_stk_special_permission",
  ];

  List<StkModel> _manuallyLoadedStks = [];

  @override
  void initState() {
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      await context.read<STKProvider>().getSTKs();
      if (user.favoriteStks.isNotEmpty) {
        setState(() {
          selectedStkIdList.addAll(user.favoriteStks);
        });
      } else {
        if (widget.selectedSTKIds != null) {
          setState(() {
            selectedStkIdList.addAll(widget.selectedSTKIds!);
          });
        }
      }
      // Seçilen STK'ları manuel olarak yükle
      if (selectedStkIdList.isNotEmpty) {
        await _loadSelectedStks();
      }
    });
    super.initState();
  }

  Future<void> _loadSelectedStks() async {
    // Seçili olan STK'ların bilgilerini Firestore'dan çek
    final List<String> ids = selectedStkIdList;
    if (ids.isEmpty) return;

    try {
      final query = await FirebaseFirestore.instance.collection('stklar').where('id', whereIn: ids).get();

      final loadedStks = query.docs.map((e) => StkModel.fromJson(e.data())).toList();
      setState(() {
        _manuallyLoadedStks = loadedStks;
      });
    } catch (e) {
      // hata durumunda bir şey yapılabilir
    }
  }

  @override
  Widget build(BuildContext context) {
    user = HiveHelpers.getUserFromHive();
    return Scaffold(
      backgroundColor: Colors.white,
      body: DefaultTabController(
        length: 4,
        child: Column(
          children: [
            AppBarWidget(
              title: "select_favorite_stk_title".locale,
              action: !widget.inTree
                  ? SizedBox(
                      height: 30,
                      child: ElevatedButton(
                          onPressed: () {
                            Navigator.pushAndRemoveUntil(
                                context, MaterialPageRoute(builder: (context) => const AppView()), (route) => false);
                          },
                          child: Text("select_favorite_stk_skip".locale)))
                  : null,
            ),
            context.watch<STKProvider>().loadingState == LoadingState.loading
                ? const LinearProgressIndicator()
                : Expanded(
                    child: Stack(
                      children: [
                        Column(
                          children: [
                            Padding(
                              padding: EdgeInsets.symmetric(
                                horizontal: deviceWidthSize(context, 20),
                              ),
                              child: Text(
                                "select_favorite_stk_instruction".locale,
                                textAlign: TextAlign.center,
                                style: AppTheme.lightTextStyle(
                                  context,
                                  14,
                                ),
                              ),
                            ),
                            SizedBox(height: deviceHeightSize(context, 10)),
                            STKFavoriteSearchWidget(
                              controller: _searchController,
                              selectedStkIdList: selectedStkIdList,
                              onSelectionChanged: (stkId, isSelected) async {
                                setState(() {
                                  if (isSelected) {
                                    if (selectedStkIdList.length >= 2) {
                                      ToastWidgets.errorToast(context, "select_favorite_stk_max_error".locale);
                                      return;
                                    }
                                    selectedStkIdList.add(stkId);
                                  } else {
                                    selectedStkIdList.remove(stkId);
                                  }
                                });
                                // Seçim değiştiğinde manuel listeyi güncelle
                                await _loadSelectedStks();
                              },
                            ),
                            SizedBox(height: deviceHeightSize(context, 10)),
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: deviceWidthSize(context, 20),
                              ),
                              alignment: Alignment.centerLeft,
                              child: TabBar(
                                indicatorColor: Colors.transparent,
                                tabAlignment: TabAlignment.start,
                                labelColor: AppTheme.primaryColor,
                                labelStyle: AppTheme.boldTextStyle(context, 14),
                                unselectedLabelStyle: AppTheme.normalTextStyle(context, 14),
                                indicatorSize: TabBarIndicatorSize.tab,
                                indicator: BoxDecoration(
                                    borderRadius: BorderRadius.circular(10),
                                    color: AppTheme.primaryColor.withOpacity(0.1)),
                                labelPadding: EdgeInsets.symmetric(horizontal: deviceWidthSize(context, 20)),
                                dividerColor: Colors.transparent,
                                isScrollable: true,
                                overlayColor: WidgetStateProperty.all(Colors.transparent),
                                tabs: _tabs.map((e) => Tab(text: e.locale)).toList(),
                              ),
                            ),
                            Expanded(
                              child: TabBarView(
                                children: List.generate(
                                  _tabs.length,
                                  (tabIndex) => viewWidget(context, tabIndex),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const GradientWidget(height: 80),
                        Positioned(
                          bottom: deviceHeightSize(context, 20),
                          left: deviceWidthSize(context, 20),
                          right: deviceWidthSize(context, 20),
                          child: GeneralButtonWidget(
                            onPressed: () async {
                              if (context.read<STKProvider>().favoriteSTKState == LoadingState.loading) {
                                return;
                              }
                              if (user.uid == null) {
                                if (selectedStkIdList.length < 2) {
                                  ToastWidgets.errorToast(context, "select_favorite_stk_min_error".locale);
                                  return;
                                }
                                if (selectedStkIdList.length > 2) {
                                  ToastWidgets.errorToast(context, "select_favorite_stk_max_error".locale);
                                  return;
                                }
                                context.read<LoginRegisterPageProvider>().setPhoneLoginPageType(PhoneLoginPageType.register);
                                Navigator.push(context,
                                    MaterialPageRoute(builder: (context) => RegisterPage(stkIds: selectedStkIdList)));
                                return;
                              }
                              String? control = context.read<STKProvider>().checkAddedTime(user.favoriteAddedDate);
                              if (control != "Kaydet") {
                                ToastWidgets.errorToast(context, control);
                                return;
                              }
                              if (selectedStkIdList.length < 2) {
                                ToastWidgets.errorToast(context, "select_favorite_stk_min_error".locale);
                                return;
                              }
                              if (selectedStkIdList.length > 2) {
                                ToastWidgets.errorToast(context, "select_favorite_stk_max_error".locale);
                                return;
                              }
                              context.read<STKProvider>().favoriteSTKState = LoadingState.loading;
                              await context
                                  .read<STKProvider>()
                                  .addRemoveFavoriteSTK(selectedStkIdList)
                                  .then((response) {
                                if (response.success ?? false) {
                                  context.read<STKProvider>().favoriteSTKState = LoadingState.loaded;
                                  ToastWidgets.successToast(context, "select_favorite_stk_success".locale);
                                } else {
                                  context.read<STKProvider>().favoriteSTKState = LoadingState.loaded;
                                  ToastWidgets.errorToast(
                                      context, response.message ?? "select_favorite_stk_error_code".locale);
                                }
                              });
                              context.read<STKProvider>().favoriteSTKState = LoadingState.loaded;

                              if (context
                                      .read<LoginRegisterPageProvider>()
                                      .selectedOptions
                                      .any((element) => element == -1) ==
                                  false) {
                                if (widget.inTree) {
                                  Navigator.pop(context);
                                  tabcontroller.jumpToTab(2);
                                } else {
                                  Navigator.push(context, MaterialPageRoute(builder: (context) => const AppView()));
                                }
                                return;
                              }
                              if (widget.inTree) {
                                Navigator.pop(context);
                                tabcontroller.jumpToTab(2);
                              } else {
                                Navigator.push(context, MaterialPageRoute(builder: (context) => const AppView()));
                              }
                            },
                            text: context.read<STKProvider>().checkAddedTime(user.favoriteAddedDate).locale,
                            isLoading: context.watch<STKProvider>().favoriteSTKState == LoadingState.loading,
                            buttonColor: AppTheme.primaryColor,
                          ),
                        )
                      ],
                    ),
                  ),
          ],
        ),
      ),
    );
  }

  Widget viewWidget(BuildContext context, int tabIndex) {
    final user = HiveHelpers.getUserFromHive();
    return Column(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        filterAndSort(context),
        // Önce manuel yüklenen STK'ları göster
        if (_manuallyLoadedStks.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade300),
                boxShadow: AppTheme.shadowList,
                color: Colors.white,
              ),
              child: Column(
                children: [
                  LocaleText("secilenler"),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: EdgeInsets.zero,
                    itemCount: _manuallyLoadedStks.length,
                    itemBuilder: (context, index) {
                      final stk = _manuallyLoadedStks[index];
                      return Padding(
                        padding: EdgeInsets.symmetric(horizontal: deviceWidthSize(context, 5)),
                        child: ListTile(
                          leading: stk.logo != null
                              ? CachedNetworkImage(
                                  imageUrl: stk.logo ?? "",
                                  width: deviceWidthSize(context, 30),
                                  height: deviceWidthSize(context, 30),
                                  fit: BoxFit.cover,
                                  errorWidget: (context, error, stackTrace) {
                                    return Container(
                                      width: deviceWidthSize(context, 30),
                                      height: deviceWidthSize(context, 30),
                                      color: Colors.grey,
                                    );
                                  },
                                  placeholder: (context, url) => Container(
                                    width: deviceWidthSize(context, 30),
                                    height: deviceWidthSize(context, 30),
                                    color: Colors.grey,
                                  ),
                                )
                              : Container(
                                  width: deviceWidthSize(context, 30),
                                  height: deviceWidthSize(context, 30),
                                  color: Colors.grey,
                                ),
                          title: Text(
                            stk.name ?? "",
                            style: AppTheme.semiBoldTextStyle(
                              context,
                              14,
                            ),
                          ),
                          trailing: Checkbox(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(5),
                            ),
                            value: selectedStkIdList.contains(stk.id.toString()),
                            activeColor: AppTheme.primaryColor,
                            onChanged: (value) async {
                              setState(() {
                                if (value!) {
                                  if (selectedStkIdList.length >= 2) {
                                    ToastWidgets.errorToast(context, "select_favorite_stk_max_error".locale);
                                    return;
                                  }
                                  selectedStkIdList.add(stk.id.toString());
                                } else {
                                  selectedStkIdList.remove(stk.id.toString());
                                }
                              });
                              await _loadSelectedStks();
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        Expanded(
          child: isLoading
              ? const CircularProgressIndicator()
              : FirestorePagination(
                  padding: const EdgeInsets.only(bottom: 200),
                  limit: 7,
                  isLive: true,
                  initialLoader: const Center(child: CircularProgressIndicator()),
                  bottomLoader: const LinearProgressIndicator(),
                  query: tabIndex == 0
                      ? context.read<STKProvider>().filterTextFav == ""
                          ? FirebaseFirestore.instance.collection('stklar').where('isActive', isEqualTo: true).orderBy(
                                context.read<STKProvider>().sortTextFav == ""
                                    ? "favoriteCount"
                                    : context.read<STKProvider>().sortTextFav,
                              )
                          : FirebaseFirestore.instance.collection('stklar').where('isActive', isEqualTo: true).where(
                              "categories",
                              arrayContainsAny: [context.read<STKProvider>().filterTextFav]).orderBy(
                              context.read<STKProvider>().sortTextFav == ""
                                  ? "favoriteCount"
                                  : context.read<STKProvider>().sortTextFav,
                            )
                      : context.read<STKProvider>().filterTextFav == ""
                          ? FirebaseFirestore.instance
                              .collection('stklar')
                              .where('isActive', isEqualTo: true)
                              .where('type', isEqualTo: _types[tabIndex])
                              .orderBy(context.read<STKProvider>().sortTextFav == ""
                                  ? "favoriteCount"
                                  : context.read<STKProvider>().sortTextFav)
                          : FirebaseFirestore.instance
                              .collection('stklar')
                              .where('isActive', isEqualTo: true)
                              .where('type', isEqualTo: _types[tabIndex])
                              .where("categories",
                                  arrayContainsAny: [context.read<STKProvider>().filterTextFav]).orderBy(
                              context.read<STKProvider>().sortTextFav == ""
                                  ? "favoriteCount"
                                  : context.read<STKProvider>().sortTextFav,
                            ),
                  itemBuilder: (context, docs, index) {
                    final stk = StkModel.fromJson(docs[index].data() as Map<String, dynamic>);

                    // Eğer bu STK manuel yüklenenler arasındaysa, tekrar gösterme
                    if (_manuallyLoadedStks.any((element) => element.id == stk.id)) {
                      return const SizedBox.shrink();
                    }

                    return Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: deviceWidthSize(context, 10),
                        vertical: deviceHeightSize(context, 10),
                      ),
                      child: ListTile(
                        leading: stk.logo != null
                            ? CachedNetworkImage(
                                imageUrl: stk.logo ?? "",
                                width: deviceWidthSize(context, 50),
                                height: deviceWidthSize(context, 50),
                                fit: BoxFit.cover,
                                errorWidget: (context, error, stackTrace) {
                                  return Container(
                                    width: deviceWidthSize(context, 50),
                                    height: deviceWidthSize(context, 50),
                                    color: Colors.grey,
                                  );
                                },
                                placeholder: (context, url) => Container(
                                  width: deviceWidthSize(context, 50),
                                  height: deviceWidthSize(context, 50),
                                  color: Colors.grey,
                                ),
                              )
                            : Container(
                                width: deviceWidthSize(context, 50),
                                height: deviceWidthSize(context, 50),
                                color: Colors.grey,
                              ),
                        title: Text(
                          stk.name ?? "",
                          style: AppTheme.semiBoldTextStyle(
                            context,
                            16,
                          ),
                        ),
                        trailing: Checkbox(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(5),
                          ),
                          value: selectedStkIdList.contains(stk.id.toString()),
                          activeColor: AppTheme.primaryColor,
                          onChanged: (value) async {
                            setState(() {
                              if (value!) {
                                if (selectedStkIdList.length >= 2) {
                                  ToastWidgets.errorToast(context, "select_favorite_stk_max_error".locale);
                                  return;
                                }
                                selectedStkIdList.add(stk.id.toString());
                              } else {
                                selectedStkIdList.remove(stk.id.toString());
                              }
                            });
                            await _loadSelectedStks();
                          },
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  final List<String> _types = [
    "",
    "select_favorite_stk_association_type",
    "select_favorite_stk_foundation_type",
    "select_favorite_stk_special_permission_type",
  ];
  final List<String> _categories = [
    "",
    "select_favorite_stk_animals",
    "select_favorite_stk_poverty",
    "select_favorite_stk_education",
    "select_favorite_stk_health",
    "select_favorite_stk_agriculture",
    "select_favorite_stk_refugees",
    "select_favorite_stk_law",
    "select_favorite_stk_earthquake",
    "select_favorite_stk_food",
    "select_favorite_stk_religious",
    "select_favorite_stk_social_entrepreneurship",
    "select_favorite_stk_entrepreneurship",
    "select_favorite_stk_culture_art",
    "select_favorite_stk_sports",
  ];

  List<Map<String, String>> filters = [
    {
      "name": "select_favorite_stk_filter_earthquake",
      "value": "depremBolgesi",
    },
    {
      "name": "select_favorite_stk_filter_special_status",
      "value": "specialStatus",
    },
    {
      "name": "select_favorite_stk_filter_all",
      "value": "",
    },
  ];

  List<Map<String, String>> sorts = [
    {
      "name": "select_favorite_stk_sort_name",
      "value": "name",
    },
    {
      "name": "select_favorite_stk_sort_favorite_count",
      "value": "favoriteCount",
    },
    {
      "name": "select_favorite_stk_sort_donor_count",
      "value": "donorCount",
    },
  ];

  Padding filterAndSort(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        right: deviceWidthSize(context, 20),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          PopupMenuButton<String>(
            color: Colors.white,
            surfaceTintColor: Colors.white,
            itemBuilder: (context) => [
              ...List.generate(
                sorts.length,
                (index) => PopupMenuItem(
                  value: sorts[index]["value"],
                  child: Text(sorts[index]["name"]!.locale,
                      style: context.read<STKProvider>().sortTextFav == sorts[index]["value"]
                          ? AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor)
                          : AppTheme.normalTextStyle(context, 14)),
                ),
              ),
            ],
            onSelected: (value) async {
              setState(() {
                isLoading = true;
              });
              await Future.delayed(const Duration(milliseconds: 500));
              setState(() {
                isLoading = false;
              });
              context.read<STKProvider>().sortTextFav = value;
            },
            child: Icon(
              Icons.sort_rounded,
              color: context.read<STKProvider>().sortTextFav == ""
                  ? AppTheme.secondaryColor.withOpacity(0.5)
                  : AppTheme.primaryColor,
            ),
          ),
          SizedBox(
            width: deviceWidthSize(context, 10),
          ),
          PopupMenuButton<String>(
            color: Colors.white,
            surfaceTintColor: Colors.white,
            itemBuilder: (context) => [
              ...List.generate(
                _categories.length,
                (index) => PopupMenuItem(
                  value: _categories[index],
                  child: Text(index == 0 ? "select_favorite_stk_filter_all".locale : _categories[index].locale,
                      style: context.read<STKProvider>().filterTextFav == _categories[index]
                          ? AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor)
                          : AppTheme.normalTextStyle(context, 14)),
                ),
              ),
            ],
            onSelected: (value) async {
              context.read<STKProvider>().filterTextFav = value;
              setState(() {
                isLoading = true;
              });
              await Future.delayed(const Duration(milliseconds: 500));
              setState(() {
                isLoading = false;
              });
            },
            child: Icon(
              Icons.filter_alt_rounded,
              color: context.read<STKProvider>().filterTextFav == ""
                  ? AppTheme.secondaryColor.withOpacity(0.5)
                  : AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }
}
