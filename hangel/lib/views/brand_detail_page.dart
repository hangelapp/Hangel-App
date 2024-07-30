import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/date_format_helper.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/helpers/url_launcher_helper.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:hangel/views/home_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/app_name_widget.dart';
import 'package:hangel/widgets/dialog_widgets.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/gradient_widget.dart';
import 'package:hangel/widgets/toast_widgets.dart';
import 'package:provider/provider.dart';

class BrandDetailPage extends StatefulWidget {
  const BrandDetailPage({Key? key, required this.brandModel}) : super(key: key);
  final BrandModel brandModel;
  @override
  State<BrandDetailPage> createState() => _BrandDetailPageState();
}

class _BrandDetailPageState extends State<BrandDetailPage>
    with SingleTickerProviderStateMixin {
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
                SingleChildScrollView(
                  child: Padding(
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
                          logo: widget.brandModel.name,
                          onTap: () {},
                        ),
                        // Container(
                        //   width: double.infinity,
                        //   height: deviceHeightSize(context, 200),
                        //   decoration: BoxDecoration(
                        //     boxShadow: AppTheme.shadowListBig(),
                        //     image: DecorationImage(
                        //       image: NetworkImage(widget.brandModel.logo ?? ""),
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
                                  image: widget.brandModel.logo != null
                                      ? DecorationImage(
                                          image: NetworkImage(
                                              widget.brandModel.logo ?? ""),
                                          fit: BoxFit.cover,
                                        )
                                      : null,
                                ),
                                child: widget.brandModel.logo == null
                                    ? Center(
                                        child: Text(
                                          widget.brandModel.name![0],
                                          style: AppTheme.boldTextStyle(
                                              context, 28,
                                              color: AppTheme.white),
                                        ),
                                      )
                                    : null),
                            SizedBox(
                              width: deviceWidthSize(context, 12),
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.brandModel.name ?? "",
                                    style: AppTheme.boldTextStyle(context, 16),
                                  ),
                                  SizedBox(
                                    height: deviceHeightSize(context, 2),
                                  ),
                                  Text(
                                    widget.brandModel.sector ?? "",
                                    style: AppTheme.normalTextStyle(context, 14,
                                        color: AppTheme.black.withOpacity(0.7)),
                                  ),
                                ],
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
                            //         "%${(widget.brandModel.donationRate ?? 0.12) * 100}",
                            //         style: AppTheme.semiBoldTextStyle(
                            //           context,
                            //           18,
                            //         ),
                            //       ),
                            //     ],
                            //   ),
                            // )
                            GestureDetector(
                              onTap: () {
                                context
                                    .read<BrandProvider>()
                                    .addRemoveFavoriteBrand(
                                        widget.brandModel.id!)
                                    .then((value) {
                                  setState(() {});
                                  if (value.success == true) {
                                    ToastWidgets.successToast(
                                        context, "İşlem Başarılı!");
                                  }
                                });
                              },
                              child: Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: deviceWidthSize(context, 10),
                                  vertical: deviceHeightSize(context, 5),
                                ),
                                child: Column(
                                  children: [
                                    Icon(
                                      HiveHelpers.getUserFromHive()
                                              .favoriteBrands
                                              .contains(widget.brandModel.id)
                                          ? Icons.favorite_rounded
                                          : Icons.favorite_border_rounded,
                                      color: AppTheme.primaryColor,
                                      size: deviceFontSize(context, 24),
                                    ),
                                    Text(
                                      widget.brandModel.favoriteCount
                                          .toString(),
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

                        _tabView(context),

                        SizedBox(
                          height: deviceHeightSize(context, 10),
                        ),
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
                            "Yaptığın alışverişlerde %${(widget.brandModel.donationRate ?? 0.12) * 100} oranında bağış yapma imkanı!",
                            style: AppTheme.semiBoldTextStyle(context, 16,
                                color: AppTheme.black),
                          ),
                        ),
                        SizedBox(
                          height: deviceHeightSize(context, 10),
                        ),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            (widget.brandModel.detailText ?? "") +
                                " " +
                                (widget.brandModel.detailText ?? "") +
                                " " +
                                (widget.brandModel.detailText ?? ""),
                            style: AppTheme.normalTextStyle(context, 14,
                                color: AppTheme.black.withOpacity(0.7)),
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
                                      (widget.brandModel.creationDate ?? "")
                                          .toString(),
                                      context),
                                  style: AppTheme.normalTextStyle(context, 14,
                                      color: AppTheme.primaryColor),
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
                              if (widget.brandModel.inEarthquakeZone == true)
                                tagItem(context,
                                    color: AppTheme.blue,
                                    text: "Deprem Bölgesi"),
                              if (widget.brandModel.isSocialEnterprise == true)
                                tagItem(context,
                                    color: AppTheme.green,
                                    text: "Sosyal Girişim"),
                            ],
                          ),
                        ),
                        SizedBox(
                          height: deviceHeightSize(context, 100),
                        ),
                      ],
                    ),
                  ),
                ),
                const GradientWidget(height: 80),
                Positioned(
                    bottom: deviceHeightSize(context, 30),
                    left: deviceWidthSize(context, 20),
                    right: deviceWidthSize(context, 20),
                    child: GeneralButtonWidget(
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (context) =>
                              DialogWidgets().rowCircularButtonDialogWidget(
                            context,
                            onAcceptButtonPressed: () {
                              UrlLauncherHelper().launch(
                                  "https://exchange.bytedex.io/ref/A68R1V");
                            },
                            title: "Bilgilendirme",
                            buttonText: "Yönlendir",
                            content:
                                "Şu an beta yayınındayız. Yapılan alışverişler veya beta yayını süresince bağışa dönüşmeyecek. Bu süre zarfında bizi sosyal medya hesaplarımızdan takip edebilirsiniz."
                            // \n\nBu alışveriş ile hangi STK’ya bağış yapmak istersiniz?",
                            // "Şu an beta yayınındayız. Yapılan alışverişler veya beta yayını süresince bağışa dönüşmeyecek. Bu süre zarfında bizi sosyal medya hesaplarımızdan takip edebilirsiniz.",

                            // extraWidget: Wrap(
                            //   runSpacing: deviceHeightSize(context, 10),
                            //   spacing: deviceWidthSize(context, 10),
                            //   alignment: WrapAlignment.center,
                            //   runAlignment: WrapAlignment.center,
                            //   children: List.generate(
                            //       context.watch<STKProvider>().stkList.length,
                            //       (index) => HiveHelpers.getUserFromHive()
                            //               .favoriteStks
                            //               .contains(context
                            //                   .watch<STKProvider>()
                            //                   .stkList[index]
                            //                   .id)
                            //           ? stkItem(context, index)
                            //           : const SizedBox()),
                            // ),
                            ,
                            color: AppTheme.primaryColor,
                          ),
                        );
                      },
                      text: "Alışverişe Başla",
                      buttonColor: AppTheme.primaryColor,
                    ))
              ],
            ),
          ),
        ],
      ),
    );
  }

  GestureDetector stkItem(BuildContext context, int index) {
    StkModel stkModel = context.watch<STKProvider>().stkList[index];
    int randomIndex = (stkModel.name ?? "").length % randomColors.length;
    return GestureDetector(
      onTap: () {
        context.read<BrandProvider>().selectedSTKID = stkModel.id ?? "";
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: EdgeInsets.symmetric(
          horizontal: deviceWidthSize(context, 10),
          vertical: deviceHeightSize(context, 5),
        ),
        width: deviceWidthSize(context, 100),
        decoration: BoxDecoration(
            color: randomColors[randomIndex].withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: context.watch<BrandProvider>().selectedSTKID == stkModel.id
                ? Border.all(color: randomColors[randomIndex], width: 2)
                : null),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const AppNameWidget(
              fontSize: 16,
            ),
            SizedBox(
              height: deviceHeightSize(context, 8),
            ),
            Text(
              stkModel.name ?? "",
              textAlign: TextAlign.center,
              style: AppTheme.boldTextStyle(context, 14, color: AppTheme.black),
            ),
          ],
        ),
      ),
    );
  }

  Container tagItem(BuildContext context,
      {required String text, required Color color}) {
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
    ];
    List<Map<String, dynamic>> categories = widget.brandModel.categories!
        .map((e) => {
              "title": e.name,
              "value": ((e.donationRate ?? 0) * 100).toString() + "%"
            })
        .toList();

    return Column(
      children: [
        TabBar(
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
            horizontal: deviceWidthSize(context, 10),
          ),
          dividerColor: Colors.transparent,
          overlayColor: MaterialStateProperty.all(Colors.transparent),
          tabs: const [
            Tab(
              child: Text(
                "Kategoriler",
              ),
            ),
            Tab(
              child: Text(
                "İstatistikler",
              ),
            ),
          ],
        ),
        SizedBox(
          height: deviceHeightSize(
              context,
              _tabController?.index == 0
                  ? ((categories.length * 60)) + 10
                  : 180),
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
