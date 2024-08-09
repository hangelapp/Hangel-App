import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:hangel/views/brand_detail_page.dart';
import 'package:hangel/views/stk_detail_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/list_item_widget.dart';
import 'package:provider/provider.dart';

import '../widgets/search_widget.dart';

class FavoritesPage extends StatefulWidget {
  const FavoritesPage({Key? key}) : super(key: key);
  static const routeName = '/favorites';
  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> with SingleTickerProviderStateMixin {
  List<StkModel> stkModels = [];
  List<BrandModel> brandModels = [];
  TabController? _tabController;
  final TextEditingController _searchController = TextEditingController();
  @override
  initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    stkModels = context.watch<STKProvider>().stkList;
    brandModels = context.watch<BrandProvider>().brandList;
    return Scaffold(
      backgroundColor: AppTheme.white,
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
          SizedBox(
            height: deviceHeightSize(context, 20),
          ),
          SearchWidget(
            context,
            onChanged: (value) {
              setState(() {});
            },
            controller: _searchController,
          ),
          Container(
            alignment: Alignment.centerLeft,
            padding: EdgeInsets.only(
              left: deviceWidthSize(context, 20),
              top: 20
            ),
            child: Text(
              "Favorilerim",
              style: AppTheme.boldTextStyle(context, 20),
            ),
          ),
          Padding(
            padding: EdgeInsets.all(
              deviceWidthSize(context, 20),
            ),
            child: TabBar(
              controller: _tabController,
              indicatorColor: Colors.transparent,
              labelColor: AppTheme.primaryColor,
              labelStyle: AppTheme.boldTextStyle(context, 16),
              unselectedLabelStyle: AppTheme.normalTextStyle(context, 14),
              indicatorSize: TabBarIndicatorSize.tab,
              indicator: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: AppTheme.primaryColor.withOpacity(0.1),
                // border: Border.all(
                //   color: AppTheme.primaryColor,
                //   width: 2,
                // ),
              ),
              dividerColor: Colors.transparent,
              overlayColor: WidgetStateProperty.all(Colors.transparent),
              tabs: const [
                Tab(
                  text: "Markalar",
                ),
                Tab(
                  text: "STK'lar",
                ),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                SingleChildScrollView(
                  child: Column(
                    children: List.generate(
                      brandModels.length,
                      (index) => HiveHelpers.getUserFromHive().favoriteBrands.contains(brandModels[index].id) &&
                              brandModels[index].name!.toLowerCase().contains(_searchController.text.toLowerCase())
                          ? ListItemWidget(
                              context,
                              logo: brandModels[index].logo,
                              title: brandModels[index].name,
                              desc: brandModels[index].detailText,
                              donationRate: brandModels[index].donationRate,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => BrandDetailPage(
                                      brandModel: brandModels[index],
                                    ),
                                  ),
                                );
                              },
                            )
                          : Container(),
                    ),
                  ),
                ),
                SingleChildScrollView(
                  child: Column(
                    children: List.generate(
                      stkModels.length,
                      (index) => HiveHelpers.getUserFromHive().favoriteStks.contains(stkModels[index].id) &&
                              stkModels[index].name!.toLowerCase().contains(_searchController.text.toLowerCase())
                          ? ListItemWidget(
                              context,
                              logo: stkModels[index].logo,
                              title: stkModels[index].name,
                              desc: stkModels[index].detailText,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => STKDetailPage(
                                      stkModel: stkModels[index],
                                    ),
                                  ),
                                );
                              },
                            )
                          : Container(),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
