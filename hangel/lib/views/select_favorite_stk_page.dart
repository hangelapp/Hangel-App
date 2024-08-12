import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/gradient_widget.dart';
import 'package:hangel/widgets/list_item_widget.dart';
import 'package:hangel/widgets/search_widget.dart';
import 'package:hangel/widgets/toast_widgets.dart';
import 'package:provider/provider.dart';

import '../helpers/hive_helpers.dart';
import '../models/general_response_model.dart';
import '../models/user_model.dart';
import 'vounteer_form.dart';

class SelectFavoriteStkPage extends StatefulWidget {
  const SelectFavoriteStkPage({Key? key}) : super(key: key);
  static const routeName = '/select-favorite-stk-page';
  @override
  State<SelectFavoriteStkPage> createState() => _SelectFavoriteStkPageState();
}

class _SelectFavoriteStkPageState extends State<SelectFavoriteStkPage> with SingleTickerProviderStateMixin {
  List<String> selectedStkIdList = [];
  final TextEditingController _searchController = TextEditingController();
  TabController? _tabController;

  UserModel user = HiveHelpers.getUserFromHive();
  final List<String> _tabs = [
    "Tümü",
    "Dernek",
    "Vakıf",
    "Özel İzinli",
  ];
  @override
  void initState() {
    _tabController = TabController(length: 4, vsync: this);

    SchedulerBinding.instance.addPostFrameCallback((_) {
      context.read<STKProvider>().getSTKs();
      if (user.favoriteStks.isNotEmpty) {
        setState(() {
          selectedStkIdList.addAll(user.favoriteStks);
        });
      }
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          const AppBarWidget(
            title: "Favori STK Seç",
            // leading: SizedBox(width: deviceWidthSize(context, 45)),
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
                              "30 gün süreyle desteklemek istediğin STK’yı seç. Unutma desteklediğin STK’yı 30 gün sonra değiştirebilirsin.",
                              textAlign: TextAlign.center,
                              style: AppTheme.lightTextStyle(
                                context,
                                14,
                              ),
                            ),
                          ),
                          SizedBox(height: deviceHeightSize(context, 10)),
                          SearchWidget(
                            context,
                            onChanged: (value) {
                              context.read<STKProvider>().searchText = value;
                            },
                            controller: _searchController,
                          ),
                          SizedBox(height: deviceHeightSize(context, 10)),
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: deviceWidthSize(context, 20),
                            ),
                            alignment: Alignment.centerLeft,
                            child: TabBar(
                              controller: _tabController,
                              indicatorColor: Colors.transparent,
                              tabAlignment: TabAlignment.start,
                              labelColor: AppTheme.primaryColor,
                              labelStyle: AppTheme.boldTextStyle(context, 14),
                              unselectedLabelStyle: AppTheme.normalTextStyle(context, 14),
                              indicatorSize: TabBarIndicatorSize.tab,
                              indicator: BoxDecoration(
                                borderRadius: BorderRadius.circular(10),
                                color: AppTheme.primaryColor.withOpacity(0.1),
                              ),
                              labelPadding: EdgeInsets.symmetric(
                                horizontal: deviceWidthSize(context, 20),
                              ),
                              dividerColor: Colors.transparent,
                              isScrollable: true,
                              overlayColor: WidgetStateProperty.all(Colors.transparent),
                              tabs: _tabs
                                  .map(
                                    (e) => Tab(
                                      text: e,
                                    ),
                                  )
                                  .toList(),
                            ),
                          ),
                          Expanded(
                              child: TabBarView(
                                  controller: _tabController,
                                  children: List.generate(_tabs.length, (tabIndex) => viewWidget(context, tabIndex))))
                        ],
                      ),
                      const GradientWidget(height: 80),
                      Positioned(
                        bottom: deviceHeightSize(context, 20),
                        left: deviceWidthSize(context, 20),
                        right: deviceWidthSize(context, 20),
                        child: GeneralButtonWidget(
                          onPressed: () async {
                            //Yükleniyorsa tıklanmasın
                            if (context.read<STKProvider>().favoriteSTKState == LoadingState.loading) {
                              print("object");
                              return;
                            }
                            //Favori eklenme süresini kontrol et
                            String? control = context.read<STKProvider>().checkAddedTime(user.favoriteAddedDate);
                            if (control != "Kaydet") {
                              ToastWidgets.errorToast(context, control);
                              return;
                            }
                            //2 STK şartı kontrolü
                            if (selectedStkIdList.length < 2) {
                              ToastWidgets.errorToast(context, "En az 2 STK seçmelisiniz!");
                              return;
                            }
                            if (selectedStkIdList.length > 2) {
                              ToastWidgets.errorToast(context, "En fazla 2 STK seçebilirsiniz!");
                              return;
                            }
                            //İşleme başlarken yükleniyor animasyonu
                            context.read<STKProvider>().favoriteSTKState = LoadingState.loading;
                            await context.read<STKProvider>().addRemoveFavoriteSTK(selectedStkIdList).then((response) {
                              if (response.success ?? false) {
                                context.read<STKProvider>().favoriteSTKState = LoadingState.loaded;
                                ToastWidgets.successToast(context, "Favori STK'ları başarıyla güncellendi");
                              } else {
                                context.read<STKProvider>().favoriteSTKState = LoadingState.loaded;
                                ToastWidgets.errorToast(
                                    context, response.message ?? "Bir hata ile karşılaşıldı!\nHata Kodu:00321");
                              }
                            });
                            context.read<STKProvider>().favoriteSTKState = LoadingState.loaded;
                            
                            if (context.read<LoginRegisterPageProvider>().selectedOptions.any(
                                      (element) => element == -1,
                                    ) ==
                                false) {
                              if (context.read<LoginRegisterPageProvider>().selectedOptions[0] == 2) {
                                Navigator.pushReplacementNamed(context, VolunteerForm.routeName);
                                return;
                              }
                            }
                            Navigator.pop(context);
                          },
                          text: context.read<STKProvider>().checkAddedTime(user.favoriteAddedDate),
                          isLoading: context.watch<STKProvider>().favoriteSTKState == LoadingState.loading,
                          buttonColor: AppTheme.primaryColor,
                        ),
                      )
                    ],
                  ),
                )
        ],
      ),
    );
  }

  Column viewWidget(BuildContext context, int tabIndex) {
    return Column(
        children: List.generate(
      context.watch<STKProvider>().stkList.length,
      (index) {
        bool isSearch = context
            .watch<STKProvider>()
            .stkList[index]
            .name!
            .toLowerCase()
            .contains(_searchController.text.toLowerCase());
        bool isReturn = isSearch &&
            (context.watch<STKProvider>().stkList[index].type == _tabs[tabIndex] || _tabs[tabIndex] == "Tümü");
        return isReturn
            ? Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: deviceWidthSize(context, 10),
                  vertical: deviceHeightSize(context, 10),
                ),
                child: ListTile(
                  leading: listItemImage2(
                    context,
                    logo: context.watch<STKProvider>().stkList[index].name,
                    onTap: () {},
                  ),
                  title: Text(
                    context.watch<STKProvider>().stkList[index].name ?? "",
                    style: AppTheme.semiBoldTextStyle(
                      context,
                      16,
                    ),
                  ),
                  trailing: Checkbox(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(5),
                    ),
                    value: selectedStkIdList.contains(
                      context.read<STKProvider>().stkList[index].id.toString(),
                    ),
                    activeColor: AppTheme.primaryColor,
                    onChanged: (value) {
                      setState(() {
                        if (value!) {
                          if (selectedStkIdList.length == 2) {
                            ToastWidgets.errorToast(context, "En fazla 2 STK seçebilirsiniz!");
                            return;
                          }
                          selectedStkIdList.add(context.read<STKProvider>().stkList[index].id.toString());
                        } else {
                          selectedStkIdList.remove(
                            context.read<STKProvider>().stkList[index].id.toString(),
                          );
                        }
                      });
                    },
                  ),
                ),
              )
            : Container();
      },
    ));
  }
}
