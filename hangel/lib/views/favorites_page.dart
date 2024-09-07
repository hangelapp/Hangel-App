import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
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

class _FavoritesPageState extends State<FavoritesPage> {
  List<StkModel> stkModels = [];
  List<BrandModel> brandModels = [];
  TabController? _tabController;
  final TextEditingController _searchController = TextEditingController();
  // UserModel userModel = userModel;

  @override
  Widget build(BuildContext context) {
    // stkModels = context.watch<STKProvider>().stkList;
    // brandModels = context.watch<BrandProvider>().brandList;
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
              padding: EdgeInsets.only(left: deviceWidthSize(context, 20), top: 20),
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
                  FutureBuilder(
                    future: context.read<BrandProvider>().getFilteredOffers(userModel.favoriteBrands),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        // Veriler yüklenirken bir yükleniyor göstergesi göstermek için kullanılabilir.
                        return Center(child: CircularProgressIndicator());
                      } else if (snapshot.hasError) {
                        // Hata durumunu işlemek için.
                        return Center(child: Text('Bir hata oluştu: ${snapshot.error}'));
                      } else if (snapshot.hasData) {
                        Set<BrandModel>? data = context.read<BrandProvider>().favoriteBrandList;

                        // Eğer veri boşsa, nullStkWidget gösterilir.
                        if (data.isEmpty) {
                          return nullBrandWidget(context);
                        }

                        List<BrandModel> uniqueData = [];

                        data.where((item) => !uniqueData.any((model) => model.id == item.id)).forEach((item) {
                          uniqueData.add(item);
                        });

                        // Veri varsa, stkItem widget'larını döndür.
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
                  // Expanded(
                  //   child: FirestorePagination(
                  //     padding: EdgeInsets.zero,
                  //     limit: 5,
                  //     initialLoader: CircularProgressIndicator(),
                  //     bottomLoader: LinearProgressIndicator(),
                  //     query: FirebaseFirestore.instance
                  //         .collection("stklar")
                  //         .where(FieldPath.documentId, whereIn: userModel.favoriteStks)
                  //         .orderBy('favoriteCount', descending: true),
                  //     itemBuilder: (context, docs, index) {
                  //       final stk = StkModel.fromJson(docs[index].data() as Map<String, dynamic>);
                  //       return ListItemWidget(context,
                  //           logo: stk.logo,
                  //           title: stk.name.toString(),
                  //           sector: stk.categories.first,
                  //           desc: stk.detailText, onTap: () {
                  //         Navigator.push(
                  //           context,
                  //           MaterialPageRoute(
                  //             builder: (context) => STKDetailPage(
                  //               stkModel: stk,
                  //             ),
                  //           ),
                  //         );
                  //       });
                  //       // Do something cool with the data
                  //     },
                  //   ),
                  // ),
                  FutureBuilder(
                    future: context.read<STKProvider>().getFavoriteSTKs(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        // Veriler yüklenirken bir yükleniyor göstergesi göstermek için kullanılabilir.
                        return Center(child: CircularProgressIndicator());
                      } else if (snapshot.hasError) {
                        // Hata durumunu işlemek için.
                        return Center(child: Text('Bir hata oluştu: ${snapshot.error}'));
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

  stkItem(BuildContext context, StkModel stk) {
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
