import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/views/brand_detail_page.dart';
import 'package:hangel/views/brand_form_widget.dart';
import 'package:hangel/widgets/bottom_sheet_widget.dart';
import 'package:hangel/widgets/list_item_widget.dart';
import 'package:hangel/widgets/search_widget.dart';
import 'package:provider/provider.dart';

class BrandsPage extends StatefulWidget {
  const BrandsPage({Key? key}) : super(key: key);
  static const routeName = '/brands';
  @override
  State<BrandsPage> createState() => _BrandsPageState();
}

class _BrandsPageState extends State<BrandsPage> {
  List<BrandModel> _brandList = [];
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = false;
  @override
  void initState() {
    SchedulerBinding.instance.addPostFrameCallback((_) {
      context.read<BrandProvider>().getBrands();
    });
    _scrollController.addListener(() async {
      if (_scrollController.position.pixels == _scrollController.position.maxScrollExtent && !_isLoading) {
        await _loadMoreData();
      }
    });
    super.initState();
  }

  Future<void> _loadMoreData() async {
    setState(() {
      _isLoading = true;
    });
    context.read<BrandProvider>().nextPage();
    await context.read<BrandProvider>().getOffers().whenComplete(
          () => setState(() => _isLoading = false),
        );
  }

  List<Map<String, String>> filters = [
    {
      "name": "Deprem Bölgesi",
      "value": "depremBolgesi",
    },
    {
      "name": "Sosyal Girişim",
      "value": "socialEnterprise",
    },
    {
      "name": "Tümü",
      "value": "",
    },
  ];

  List<Map<String, String>> sorts = [
    {
      "name": "Bağış oranı yüksekten düşüğe",
      "value": "bagisOraniYuksektenDusuge",
    },
    {
      "name": "Bağış oranı düşükten yükseğe",
      "value": "bagisOraniDusuktenYuksege",
    },
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

  @override
  Widget build(BuildContext context) {
    _brandList = context.watch<BrandProvider>().brandList;
    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          SizedBox(height: deviceTopPadding(context)),
          SearchWidget(
            context,
            onChanged: (value) {
              context.read<BrandProvider>().searchText = value;
            },
            controller: _searchController,
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
                              "Markalar",
                              style: AppTheme.boldTextStyle(context, 20),
                            ),
                          ),
                          filterAndSort(context),
                        ],
                      ),
                      Expanded(
                        child: ListView.builder(
                          controller: _scrollController,
                          itemCount: _brandList.length,
                          itemBuilder: (context, index) {
                            bool isSearch =
                                _brandList[index].name!.toLowerCase().contains(_searchController.text.toLowerCase());
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
                                isFilter =
                                    (_brandList[index].sector ?? "").toLowerCase().contains(filterText.toLowerCase());
                                break;
                            }

                            (_brandList[index].sector ?? "")
                                .toLowerCase()
                                .contains(context.read<BrandProvider>().filterText.toLowerCase());

                            bool isReturn = isSearch && isFilter;
                            return isReturn
                                ? ListItemWidget(
                                    context,
                                    logo: _brandList[index].logo,
                                    title: (_brandList[index].name??"").removeBrackets(),
                                    desc: _brandList[index].detailText,
                                    donationRate: _brandList[index].donationRate,
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
                      _isLoading?const LinearProgressIndicator():const SizedBox.shrink()
                    ],
                  ),
          )
        ],
      ),
      floatingActionButton: FloatingActionButton(
        shape: const CircleBorder(),
        onPressed: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            builder: (context) => const BottomSheetWidget(
              title: "Marka Başvuru Formu",
              isMinPadding: true,
              child: BrandFormWidget(),
            ),
          );
        },
        backgroundColor: AppTheme.primaryColor,
        child: Image.asset(
          "assets/icons/apply.png",
          width: deviceWidthSize(context, 24),
        ),
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
