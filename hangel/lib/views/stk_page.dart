import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_pagination/firebase_pagination.dart';
import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:hangel/views/stk_detail_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/list_item_widget.dart';
import 'package:hangel/widgets/search_widget.dart';
import 'package:provider/provider.dart';

class STKPage extends StatefulWidget {
  const STKPage({Key? key}) : super(key: key);
  static const routeName = '/STK';
  @override
  State<STKPage> createState() => _STKPageState();
}

class _STKPageState extends State<STKPage> {
  final TextEditingController _searchController = TextEditingController();
  bool isLoading = false;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: DefaultTabController(
        length: 4,
        child: Column(
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
            SearchWidget(
              context,
              onChanged: (value) {
                context.read<STKProvider>().searchText = value;
              },
              controller: _searchController,
            ),
            SizedBox(
              height: deviceHeightSize(context, 10),
            ),
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
                        text: e.locale,
                      ),
                    )
                    .toList(),
              ),
            ),
            Expanded(
              child: TabBarView(
                children: List.generate(
                  _tabs.length,
                  (tabIndex) => Column(
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
                              "stk_page_stks".locale,
                              style: AppTheme.boldTextStyle(context, 20),
                            ),
                          ),
                          filterAndSort(context),
                        ],
                      ),
                      Expanded(
                        child: isLoading
                            ? Center(child: CircularProgressIndicator())
                            : FirestorePagination(
                                padding: EdgeInsets.zero,
                                limit: 5,
                                initialLoader: Center(child: CircularProgressIndicator()),
                                bottomLoader: LinearProgressIndicator(),
                                query: tabIndex == 0
                                    ? context.read<STKProvider>().filterText == ""
                                        ? FirebaseFirestore.instance
                                            .collection('stklar')
                                            .where('isActive', isEqualTo: true)
                                            .orderBy(
                                              context.read<STKProvider>().sortText == ""
                                                  ? "favoriteCount"
                                                  : context.read<STKProvider>().sortText,
                                            )
                                        : FirebaseFirestore.instance
                                            .collection('stklar')
                                            .where('isActive', isEqualTo: true)
                                            .where("categories",
                                                arrayContainsAny: [context.read<STKProvider>().filterText]).orderBy(
                                            context.read<STKProvider>().sortText == ""
                                                ? "favoriteCount"
                                                : context.read<STKProvider>().sortText,
                                          )
                                    : context.read<STKProvider>().filterText == ""
                                        ? FirebaseFirestore.instance
                                            .collection('stklar')
                                            .where('isActive', isEqualTo: true)
                                            .where('type', isEqualTo: _types[tabIndex]) // Apply tab filter
                                            .orderBy(context.read<STKProvider>().sortText == ""
                                                ? "favoriteCount"
                                                : context.read<STKProvider>().sortText)
                                        : FirebaseFirestore.instance
                                            .collection('stklar')
                                            .where('isActive', isEqualTo: true)
                                            .where('type', isEqualTo: _types[tabIndex]) // Apply tab filter
                                            .where("categories",
                                                arrayContainsAny: [context.read<STKProvider>().filterText]).orderBy(
                                            context.read<STKProvider>().sortText == ""
                                                ? "favoriteCount"
                                                : context.read<STKProvider>().sortText,
                                          ),
                                itemBuilder: (context, docs, index) {
                                  final stk = StkModel.fromJson(docs[index].data() as Map<String, dynamic>);
                                  return ListItemWidget(context,
                                      logo: stk.logo,
                                      title: stk.name.toString(),
                                      sector: stk.categories.first,
                                      desc: stk.detailText, onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => STKDetailPage(
                                          stkModel: stk,
                                        ),
                                      ),
                                    );
                                  });
                                  // Do something cool with the data
                                },
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  final List<String> _types = [
    "",
    "select_favorite_stk_association".locale,
    "select_favorite_stk_foundation".locale,
    "select_favorite_stk_special_permission".locale,
  ];

  final List<String> _tabs = [
    "stk_page_all".locale,
    "stk_page_associations".locale,
    "stk_page_foundations".locale,
    "stk_page_special_permissions".locale,
  ];

  List<Map<String, String>> filters = [
    {
      "name": "stk_page_filter_earthquake_zone".locale,
      "value": "depremBolgesi",
    },
    {
      "name": "stk_page_filter_special_status".locale,
      "value": "specialStatus",
    },
    {
      "name": "stk_page_filter_all".locale,
      "value": "",
    },
  ];

  List<Map<String, String>> sorts = [
    {
      "name": "stk_page_sort_by_name".locale,
      "value": "name",
    },
    {
      "name": "stk_page_sort_by_favorite".locale,
      "value": "favoriteCount",
    },
    {
      "name": "stk_page_sort_by_donor".locale,
      "value": "donorCount",
    },
  ];

  final List<String> _categories = [
    "",
    "select_favorite_stk_animals".locale,
    "select_favorite_stk_poverty".locale,
    "select_favorite_stk_education".locale,
    "select_favorite_stk_health".locale,
    "select_favorite_stk_agriculture".locale,
    "select_favorite_stk_refugees".locale,
    "select_favorite_stk_law".locale,
    "select_favorite_stk_earthquake".locale,
    "select_favorite_stk_food".locale,
    "select_favorite_stk_religious".locale,
    "select_favorite_stk_social_entrepreneurship".locale,
    "select_favorite_stk_entrepreneurship".locale,
    "select_favorite_stk_culture_art".locale,
    "select_favorite_stk_sports".locale,
  ];

  Padding filterAndSort(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        right: deviceWidthSize(context, 20),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
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
                      style: context.read<STKProvider>().sortText == sorts[index]["value"]
                          ? AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor)
                          : AppTheme.normalTextStyle(context, 14)),
                ),
              ),
            ],
            onSelected: (value) async {
              setState(() {
                isLoading = true;
              });
              await Future.delayed(Durations.short1);
              setState(() {
                isLoading = false;
              });
              context.read<STKProvider>().sortText = value;
              print(value);
            },
            child: Icon(
              Icons.sort_rounded,
              color: context.read<STKProvider>().sortText == ""
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
                _categories.length,
                (index) => PopupMenuItem(
                  value: _categories[index],
                  child: Text(index == 0 ? "stk_page_filter_all".locale : _categories[index],
                      style: context.read<STKProvider>().filterText == _categories[index]
                          ? AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor)
                          : AppTheme.normalTextStyle(context, 14)),
                ),
              ),
            ],
            onSelected: (value) async {
              context.read<STKProvider>().filterText = value;
              setState(() {
                isLoading = true;
              });
              await Future.delayed(Durations.short1);
              setState(() {
                isLoading = false;
              });
            },
            child: Icon(
              Icons.filter_alt_rounded,
              color: context.read<STKProvider>().filterText == ""
                  ? AppTheme.secondaryColor.withOpacity(0.5)
                  : AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }
}
