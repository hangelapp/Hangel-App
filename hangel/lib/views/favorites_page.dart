import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:hangel/views/stk_detail_page.dart';
import 'package:hangel/views/utilities.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/list_item_widget.dart';
import 'package:provider/provider.dart';

import '../helpers/hive_helpers.dart';
import '../models/user_model.dart';
import '../providers/brand_provider.dart';
import '../widgets/search_widget.dart';
import 'brand_detail_page.dart';

class FavoritesPage extends StatefulWidget {
  const FavoritesPage({Key? key}) : super(key: key);
  static const routeName = '/favorites';
  
  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> with SingleTickerProviderStateMixin {
  List<StkModel> stkModels = [];
  List<BrandModel> brandModels = [];
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // TabController'ı başlatın
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    UserModel userModel = HiveHelpers.getUserFromHive();
    
    return DefaultTabController(
      length: 2,
      child: Scaffold(
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
              title: "favorites_page_title".locale,
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
              hintText: "favorites_page_search_hint".locale,
            ),
            Container(
              alignment: Alignment.centerLeft,
              padding: EdgeInsets.only(left: deviceWidthSize(context, 20), top: 20),
              child: Text(
                "favorites_page_favorilerim".locale,
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
                ),
                dividerColor: Colors.transparent,
                overlayColor: WidgetStateProperty.all(Colors.transparent),
                tabs:  [
                  Tab(
                    text: "favorites_page_markalar".locale,
                  ),
                  Tab(
                    text: "favorites_page_stklar".locale,
                  ),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  FutureBuilder(
                    future: context.read<BrandProvider>().getFilteredOffers(userModel.favoriteBrands),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        // Veriler yüklenirken bir yükleniyor göstergesi göstermek için kullanılabilir.
                        return Center(child: CircularProgressIndicator());
                      } else if (snapshot.hasError) {
                        // Hata durumunu işlemek için.
                        return Center(child: Text('favorites_page_error_occurred'.locale));
                      } else if (snapshot.hasData) {
                        Set<BrandModel>? data = context.read<BrandProvider>().favoriteBrandList;

                        // Eğer veri boşsa, nullBrandWidget gösterilir.
                        if (data.isEmpty) {
                          return nullBrandWidget(context);
                        }

                        List<BrandModel> uniqueData = [];

                        data.where((item) => !uniqueData.any((model) => model.id == item.id)).forEach((item) {
                          uniqueData.add(item);
                        });

                        // Veri varsa, ListItemWidget'ları döndür.
                        return SingleChildScrollView(
                          child: Column(
                            children: uniqueData.map<Widget>((brand) {
                              return ListItemWidget(
                                context,
                                sector: brand.sector,
                                logo: brand.logo,
                                title: brand.name,
                                desc: brand.detailText,
                                donationRate: brand.donationRate,
                                onTap: () async {
                                  await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => BrandDetailPage(
                                        brandModel: brand,
                                      ),
                                    ),
                                  ).then(
                                    (value) => setState(() {}),
                                  );
                                },
                              );
                            }).toList(),
                          ),
                        );
                      }

                      // Diğer durumlar için, boş durum widget'ını döndür.
                      return nullBrandWidget(context);
                    },
                  ),
                  FutureBuilder(
                    future: context.read<STKProvider>().getFavoriteSTKs(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        // Veriler yüklenirken bir yükleniyor göstergesi göstermek için kullanılabilir.
                        return Center(child: CircularProgressIndicator());
                      } else if (snapshot.hasError) {
                        // Hata durumunu işlemek için.
                        return Center(child: Text('favorites_page_error_occurred'.locale));
                      } else if (snapshot.hasData) {
                        List<StkModel>? data = snapshot.data;

                        // Eğer veri boşsa, nullStkWidget gösterilir.
                        if (data == null || data.isEmpty) {
                          return nullStkWidget(context);
                        }

                        // Veri varsa, stkItem widget'larını döndür.
                        return SingleChildScrollView(
                          child: Column(
                            children: data.map<Widget>((stk) {
                              return stkItem(context, stk);
                            }).toList(),
                          ),
                        );
                      }

                      // Diğer durumlar için, boş durum widget'ını döndür.
                      return nullStkWidget(context);
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget stkItem(BuildContext context, StkModel stk) {
    return ListItemWidget(
      context,
      title: stk.name ?? "",
      logo: stk.logo ?? "",
      desc: stk.detailText ?? "",
      sector: stk.categories.first,
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) {
              return STKDetailPage(
                stkModel: stk,
              );
            },
          ),
        ).then(
          (value) {
            setState(() {});
          },
        );
      },
    );
  }
}
