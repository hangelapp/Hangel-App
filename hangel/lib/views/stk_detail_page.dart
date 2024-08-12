import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/date_format_helper.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/views/donation_history_page.dart';
import 'package:hangel/views/home_page.dart';
import 'package:hangel/views/select_favorite_stk_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/app_name_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';

import 'utilities.dart';

class STKDetailPage extends StatefulWidget {
  const STKDetailPage({Key? key, required this.stkModel}) : super(key: key);
  final StkModel stkModel;
  @override
  State<STKDetailPage> createState() => _STKDetailPageState();
}

class _STKDetailPageState extends State<STKDetailPage> with SingleTickerProviderStateMixin {
  TabController? _tabController;

  @override
  void initState() {
    _tabController = TabController(length: 2, vsync: this);
    _tabController!.addListener(() {
      setState(() {});
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.white,
      body: Column(
        children: [
          const AppBarWidget(),
          Expanded(
            child: Stack(
              children: [
                SizedBox(
                  width: deviceWidth(context),
                  height: deviceHeight(context),
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: deviceWidthSize(context, 20),
                          ),
                          child: Column(
                            children: [
                              SizedBox(
                                height: deviceHeightSize(context, 10),
                              ),
                              listItemImage2(
                                context,
                                logo: widget.stkModel.name,
                                onTap: () {},
                              ),
                              // Container(
                              //   width: double.infinity,
                              //   height: deviceHeightSize(context, 200),
                              //   decoration: BoxDecoration(
                              //     boxShadow: AppTheme.shadowListBig(),
                              //     image: DecorationImage(
                              //       image: NetworkImage(widget.stkModel.logo ?? ""),
                              //       fit: BoxFit.cover,
                              //     ),
                              //     borderRadius: BorderRadius.circular(13),
                              //   ),
                              // ),
                              SizedBox(
                                height: deviceHeightSize(context, 30),
                              ),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                      width: deviceWidthSize(context, 50),
                                      height: deviceHeightSize(context, 50),
                                      decoration: BoxDecoration(
                                        boxShadow: AppTheme.shadowList,
                                        color: AppTheme.primaryColor,
                                        shape: BoxShape.circle,
                                        image: widget.stkModel.logo != null
                                            ? DecorationImage(
                                                image: NetworkImage(widget.stkModel.logo ?? ""),
                                                fit: BoxFit.cover,
                                              )
                                            : null,
                                      ),
                                      child: widget.stkModel.logo == null
                                          ? Center(
                                              child: Text(
                                                widget.stkModel.name![0],
                                                style: AppTheme.boldTextStyle(context, 28, color: AppTheme.white),
                                              ),
                                            )
                                          : null),
                                  SizedBox(
                                    width: deviceWidthSize(context, 12),
                                  ),
                                  Expanded(
                                    child: Text(
                                      widget.stkModel.name ?? "",
                                      style: AppTheme.boldTextStyle(context, 16),
                                    ),
                                  ),
                                  SizedBox(
                                    width: deviceWidthSize(context, 10),
                                  ),
                                  // Container(
                                  //   padding: EdgeInsets.symmetric(
                                  //     horizontal: deviceWidthSize(context, 10),
                                  //     vertical: deviceHeightSize(context, 5),
                                  //   ),
                                  //   decoration: BoxDecoration(
                                  //     color: AppTheme.primaryColor.withOpacity(0.1),
                                  //     borderRadius: BorderRadius.circular(8),
                                  //   ),
                                  //   child: Row(
                                  //     children: [
                                  //       Icon(
                                  //         Icons.volunteer_activism_rounded,
                                  //         color: AppTheme.primaryColor,
                                  //         size: deviceFontSize(context, 24),
                                  //       ),
                                  //       SizedBox(
                                  //         width: deviceWidthSize(context, 6),
                                  //       ),
                                  //       Text(
                                  //         "%${(widget.stkModel.donationRate ?? 0.12) * 100}",
                                  //         style: AppTheme.semiBoldTextStyle(
                                  //           context,
                                  //           18,
                                  //         ),
                                  //       ),
                                  //     ],
                                  //   ),
                                  // )
                                  InkWell(
                                    onTap: () {
                                      Navigator.push(context, MaterialPageRoute(builder: (context) => const SelectFavoriteStkPage(),));
                                      // context
                                      //     .read<STKProvider>()
                                      //     .addRemoveFavoriteSTK(
                                      //         widget.stkModel.id)
                                      //     .then((value) {
                                      //   setState(() {});
                                      //   if (value.success == true) {
                                      //     ToastWidgets.successToast(
                                      //         context, "İşlem Başarılı!");
                                      //   }
                                      // });
                                    },
                                    child: Container(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: deviceWidthSize(context, 10),
                                        vertical: deviceHeightSize(context, 5),
                                      ),
                                      child: Column(
                                        children: [
                                          Icon(
                                            HiveHelpers.getUserFromHive().favoriteStks.contains(widget.stkModel.id)
                                                ? Icons.favorite
                                                : Icons.favorite_border,
                                            color: AppTheme.primaryColor,
                                            size: deviceFontSize(context, 24),
                                          ),
                                          Text(
                                            widget.stkModel.favoriteCount.toString(),
                                            style: AppTheme.normalTextStyle(
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
                              SizedBox(
                                height: deviceHeightSize(context, 10),
                              ),
                              Divider(
                                color: AppTheme.secondaryColor.withOpacity(0.1),
                                thickness: 1,
                              ),
                              SizedBox(
                                height: deviceHeightSize(context, 10),
                              ),
                            ],
                          ),
                        ),
                        _tabView(context),
                        SizedBox(
                          height: deviceHeightSize(context, 10),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: deviceWidthSize(context, 20),
                          ),
                          child: Column(
                            children: [
                              Divider(
                                color: AppTheme.secondaryColor.withOpacity(0.1),
                                thickness: 1,
                              ),
                              SizedBox(
                                height: deviceHeightSize(context, 4),
                              ),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  "Hakkında",
                                  style: AppTheme.semiBoldTextStyle(context, 16, color: AppTheme.black),
                                ),
                              ),
                              SizedBox(
                                height: deviceHeightSize(context, 10),
                              ),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  (widget.stkModel.detailText ?? "") +
                                      " " +
                                      (widget.stkModel.detailText ?? "") +
                                      " " +
                                      (widget.stkModel.detailText ?? ""),
                                  style: AppTheme.normalTextStyle(context, 14, color: AppTheme.black.withOpacity(0.7)),
                                ),
                              ),
                              SizedBox(
                                height: deviceHeightSize(context, 10),
                              ),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: RichText(
                                  text: TextSpan(
                                    children: [
                                      TextSpan(
                                        text: "Platforma Katılma Tarihi: ",
                                        style: AppTheme.normalTextStyle(context, 14,
                                            color: AppTheme.black.withOpacity(0.7)),
                                      ),
                                      TextSpan(
                                        text: DateFormatHelper.getDate(
                                            (widget.stkModel.creationDate ?? "").toString(), context),
                                        style: AppTheme.normalTextStyle(context, 14, color: AppTheme.primaryColor),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              SizedBox(
                                height: deviceHeightSize(context, 10),
                              ),
                              SizedBox(
                                width: deviceWidth(context),
                                child: Wrap(
                                  direction: Axis.horizontal,
                                  alignment: WrapAlignment.start,
                                  children: [
                                    if (widget.stkModel.inEarthquakeZone == true)
                                      tagItem(context, color: AppTheme.blue, text: "Deprem Bölgesi"),
                                  ],
                                ),
                              ),
                              SizedBox(
                                height: deviceHeightSize(context, 30),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // const GradientWidget(height: 80),
                // Positioned(
                //     bottom: deviceHeightSize(context, 30),
                //     left: deviceWidthSize(context, 20),
                //     right: deviceWidthSize(context, 20),
                //     child: GeneralButtonWidget(
                //       onPressed: () {
                //         //uygulama beta sürümünde dialog
                //             UrlLauncherHelper()
                //                 .launch("https://www.instagram.com/hangeltr");
                //         // showDialog(
                //         //   context: context,
                //         //   builder: (context) =>
                //         //       DialogWidgets().rowCircularButtonDialogWidget(
                //         //     context,
                //         //     onAcceptButtonPressed: () =>
                //         //     title: "Beta Sürüm",
                //         //     content: "Uygulama beta sürümündedir.",
                //         //     color: AppTheme.primaryColor,
                //         //   ),
                //         // );
                //       },
                //       text: "Bağış Yap",
                //       buttonColor: AppTheme.primaryColor,
                //     ))
              ],
            ),
          ),
        ],
      ),
    );
  }

  Container tagItem(BuildContext context, {required String text, required Color color}) {
    return Container(
      margin: EdgeInsets.only(
        right: deviceWidthSize(context, 6),
        top: deviceHeightSize(context, 6),
      ),
      padding: EdgeInsets.symmetric(
        horizontal: deviceWidthSize(context, 10),
        vertical: deviceHeightSize(context, 5),
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: AppTheme.normalTextStyle(context, 14, color: color),
      ),
    );
  }

  GestureDetector listItemImage2(
    BuildContext context, {
    required String? logo,
    required Function()? onTap,
  }) {
    int randomIndex = (logo ?? "").length % randomColors.length;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: deviceWidth(context),
        height: deviceHeightSize(context, 200),
        margin: EdgeInsets.only(
          right: deviceWidthSize(context, 10),
        ),
        decoration: BoxDecoration(
          color: randomColors[randomIndex],
          boxShadow: AppTheme.shadowList,
          borderRadius: BorderRadius.circular(13),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const AppNameWidget(
              fontSize: 48,
              color: AppTheme.white,
            ),
            SizedBox(
              height: deviceHeightSize(context, 8),
            ),
            Text(
              logo ?? "",
              textAlign: TextAlign.center,
              style: AppTheme.boldTextStyle(context, 20, color: AppTheme.white),
            ),
          ],
        ),
      ),
    );
  }

  _tabView(BuildContext context) {
    List<Map<String, dynamic>> statics = [
      {
        "title": "Toplam Bağış",
        "value": "0",
      },
      {
        "title": "Favori",
        "value": "0",
      },
      {
        "title": "İşlem Sayısı",
        "value": "0",
      },
      {
        "title": "Bağışçı Sayısı",
        "value": "0",
      },
      {
        "title": "Seçim Sayısı",
        "value": "0",
      }
    ];
    List<Map<String, dynamic>> categories = [
      {
        "title": "Türü",
        "value": widget.stkModel.type ?? "",
      },
      {
        "title": "Kategorileri",
        "value": widget.stkModel.categories.join(", "),
      },
      {
        "title": "BM Sürdürülebilirlik Amaçları",
        "value": widget.stkModel.bmCategories.join(", "),
      },
      {
        "title": "Alanı",
        "value": widget.stkModel.fieldOfBenefit,
      },
    ];

    return Column(
      children: [
        Padding(
          padding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 20),
          ),
          child: TabBar(
            controller: _tabController,
            indicatorColor: Colors.transparent,
            labelColor: AppTheme.primaryColor,
            labelStyle: AppTheme.boldTextStyle(context, 14),
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
            labelPadding: EdgeInsets.symmetric(
              horizontal: deviceWidthSize(context, 20),
            ),
            dividerColor: Colors.transparent,
            overlayColor: WidgetStateProperty.all(Colors.transparent),
            tabs: const [
              Tab(
                child: Text(
                  "Genel Bilgiler",
                ),
              ),
              Tab(
                child: Text(
                  "İstatistikler",
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: deviceHeightSize(context, _tabController!.index == 0 ? 230 : 280),
          width: deviceWidth(context),
          child: TabBarView(
            controller: _tabController,
            children: [
              _personalInfo(context, categories),
              _personalInfo(context, statics),
            ],
          ),
        )
      ],
    );
  }

  _personalInfo(BuildContext context, List<Map<String, dynamic>> info) {
    return Column(
      children: [
        SizedBox(
          height: deviceHeightSize(context, 10),
        ),
        ...List.generate(
          info.length,
          (index) => Container(
            margin: EdgeInsets.symmetric(
              horizontal: deviceWidthSize(context, 20),
              vertical: deviceHeightSize(context, 4),
            ),
            padding: EdgeInsets.symmetric(
              horizontal: deviceWidthSize(context, 20),
              vertical: deviceHeightSize(context, 12),
            ),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.02),
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.center,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(
                  flex: _tabController!.index == 0 ? 1 : 2,
                  child: Text(
                    info[index]["title"]!,
                    textAlign: TextAlign.start,
                    style: AppTheme.normalTextStyle(
                      context,
                      12,
                    ),
                  ),
                ),
                Text(
                  ":",
                  textAlign: TextAlign.start,
                  style: AppTheme.normalTextStyle(
                    context,
                    12,
                  ),
                ),
                SizedBox(
                  width: deviceHeightSize(context, 5),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    info[index]["value"]!.toString(),
                    textAlign: TextAlign.start,
                    style: AppTheme.semiBoldTextStyle(
                      context,
                      14,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
