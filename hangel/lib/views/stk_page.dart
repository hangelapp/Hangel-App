import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:hangel/views/stk_detail_page.dart';
import 'package:hangel/views/stk_form_widget.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/bottom_sheet_widget.dart';
import 'package:hangel/widgets/list_item_widget.dart';
import 'package:hangel/widgets/search_widget.dart';
import 'package:provider/provider.dart';

class STKPage extends StatefulWidget {
  const STKPage({Key? key}) : super(key: key);
  static const routeName = '/STK';
  @override
  State<STKPage> createState() => _STKPageState();
}

class _STKPageState extends State<STKPage> with TickerProviderStateMixin {
  List<StkModel> _stkList = [];
  final TextEditingController _searchController = TextEditingController();

  List<Map<String, String>> filters = [
    {
      "name": "Deprem Bölgesi",
      "value": "depremBolgesi",
    },
    {
      "name": "Özel Statü",
      "value": "specialStatus",
    },
    {
      "name": "Tümü",
      "value": "",
    },
  ];

  List<Map<String, String>> sorts = [
    {
      "name": "En yeniden en eskiye",
      "value": "enYenidenEnEskiye",
    },
    {
      "name": "En eskiden en yeniye",
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

  final List<String> _tabs = [
    "Tümü",
    "Dernek",
    "Vakıf",
    "Özel İzinli",
  ];

  TabController? _tabController;

  @override
  void initState() {
    _tabController = TabController(length: 4, vsync: this);
    SchedulerBinding.instance.addPostFrameCallback((_) {
      // context.read<STKProvider>().getSTKs();
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    _stkList = context.watch<STKProvider>().stkList;

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
            child: context.watch<STKProvider>().loadingState == LoadingState.loading
                ? const Center(child: CircularProgressIndicator())
                : TabBarView(
                    controller: _tabController,
                    children: List.generate(
                      _tabs.length,
                      (tabIndex) => Stack(
                        children: [
                          SingleChildScrollView(
                            child: Column(
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
                                        "STK'lar",
                                        style: AppTheme.boldTextStyle(context, 20),
                                      ),
                                    ),
                                    filterAndSort(context),
                                  ],
                                ),

                                ...List.generate(
                                  _stkList.length,
                                  (index) {
                                    bool isSearch = _stkList[index]
                                        .name!
                                        .toLowerCase()
                                        .contains(_searchController.text.toLowerCase());
                                    bool isFilter = false;
                                    String filterText = context.read<STKProvider>().filterText;
                                    switch (filterText) {
                                      case "depremBolgesi":
                                        isFilter = _stkList[index].inEarthquakeZone!;
                                        break;
                                      case "specialStatus":
                                        isFilter = _stkList[index].specialStatus != null;
                                        break;
                                      default:
                                        isFilter = _stkList[index]
                                            .fieldOfBenefit!
                                            .toLowerCase()
                                            .contains(filterText.toLowerCase());
                                        break;
                                    }

                                    _stkList[index]
                                        .fieldOfBenefit!
                                        .toLowerCase()
                                        .contains(context.read<STKProvider>().filterText.toLowerCase());

                                    bool isReturn = isSearch &&
                                        isFilter &&
                                        (_stkList[index].type == _tabs[tabIndex] || _tabs[tabIndex] == "Tümü");
                                    return isReturn
                                        ? ListItemWidget(
                                            context,
                                            logo: _stkList[index].logo,
                                            title: _stkList[index].name.toString(),
                                            desc: _stkList[index].detailText,
                                            onTap: () {
                                              Navigator.push(
                                                context,
                                                MaterialPageRoute(
                                                  builder: (context) => STKDetailPage(
                                                    stkModel: _stkList[index],
                                                  ),
                                                ),
                                              );
                                            },
                                          )
                                        : Container();
                                  },
                                ),
                                SizedBox(
                                  height: deviceHeightSize(context, 80),
                                ),
                              ],
                            ),
                          ),
                          Positioned(
                            bottom: deviceHeightSize(context, 10),
                            right: deviceWidthSize(context, 20),
                            child: FloatingActionButton(
                              heroTag: "stk-1",
                              shape: const CircleBorder(),
                              onPressed: () {
                                showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  builder: (context) => const BottomSheetWidget(
                                    title: "STK Başvuru Formu",
                                    isMinPadding: true,
                                    child: STKFormWidget(),
                                  ),
                                );
                              },
                              backgroundColor: AppTheme.primaryColor,
                              child: Image.asset(
                                "assets/icons/apply.png",
                                width: deviceWidthSize(context, 24),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
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
                      style: context.read<STKProvider>().sortText == sorts[index]["value"]
                          ? AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor)
                          : AppTheme.normalTextStyle(context, 14)),
                ),
              ),
            ],
            onSelected: (value) {
              context.read<STKProvider>().sortSTK(value);
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
                context.read<STKProvider>().stkSectors.length,
                (index) => PopupMenuItem(
                  value: context.read<STKProvider>().stkSectors[index],
                  child: Text(context.read<STKProvider>().stkSectors[index],
                      style: context.read<STKProvider>().filterText == context.read<STKProvider>().stkSectors[index]
                          ? AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor)
                          : AppTheme.normalTextStyle(context, 14)),
                ),
              ),
              ...List.generate(
                filters.length,
                (index) => PopupMenuItem(
                  value: filters[index]["value"],
                  child: Text(filters[index]["name"] ?? "",
                      style: context.read<STKProvider>().filterText == filters[index]["value"]
                          ? AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor)
                          : AppTheme.normalTextStyle(context, 14)),
                ),
              ),
            ],
            onSelected: (value) {
              if (value == "Tümü") {
                value = "";
              }
              context.read<STKProvider>().filterText = value;
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
