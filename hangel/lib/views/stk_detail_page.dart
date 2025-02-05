import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/helpers/date_format_helper.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/app_name_widget.dart';
import 'package:hangel/views/select_favorite_stk_page.dart';

class STKDetailPage extends StatefulWidget {
  const STKDetailPage({super.key, required this.stkModel});
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
                          img: widget.stkModel.logo,
                          onTap: () {},
                        ),
                        SizedBox(
                          height: deviceHeightSize(context, 30),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            DecoratedBox(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 8,
                                    offset: const Offset(2, 2),
                                  ),
                                ],
                              ),
                              child: CircleAvatar(
                                radius: 35,
                                backgroundColor: AppTheme.white,
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(60),
                                  child: widget.stkModel.logo != null
                                      ? Image.network(
                                          widget.stkModel.logo!,
                                          fit: BoxFit.contain,
                                          alignment: Alignment.center,
                                          errorBuilder: (context, error, stackTrace) => Center(
                                            child: Text(
                                              widget.stkModel.name![0],
                                              style: AppTheme.boldTextStyle(context, 28, color: AppTheme.black),
                                            ),
                                          ),
                                        )
                                      : Center(
                                          child: Text(
                                            widget.stkModel.name![0],
                                            style: AppTheme.boldTextStyle(context, 28, color: AppTheme.black),
                                          ),
                                        ),
                                ),
                              ),
                            ),
                            SizedBox(
                              width: deviceWidthSize(context, 12),
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.stkModel.name ?? "",
                                    style: AppTheme.boldTextStyle(context, 16),
                                  ),
                                  SizedBox(
                                    height: deviceHeightSize(context, 2),
                                  ),
                                  Text(
                                    widget.stkModel.categories.isNotEmpty ? widget.stkModel.categories.first : "",
                                    style:
                                        AppTheme.normalTextStyle(context, 14, color: AppTheme.black.withOpacity(0.7)),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(
                              width: deviceWidthSize(context, 10),
                            ),
                            InkWell(
                              onTap: () {
                                Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => const SelectFavoriteStkPage(
                                        inTree: true,
                                      ),
                                    ));
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
                                      widget.stkModel.favoriteCount!.length.toString(),
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
                            "stk_detail_about".locale,
                            style: AppTheme.semiBoldTextStyle(context, 16, color: AppTheme.black),
                          ),
                        ),
                        SizedBox(
                          height: deviceHeightSize(context, 10),
                        ),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
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
                                  text: "stk_detail_join_date_label".locale,
                                  style: AppTheme.normalTextStyle(context, 14, color: AppTheme.black.withOpacity(0.7)),
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
                                tagItem(context, color: AppTheme.blue, text: "stk_detail_earthquake_zone".locale),
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
    String? img,
    required Function()? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        width: deviceWidth(context),
        height: deviceHeight(context) * 0.1,
        margin: EdgeInsets.only(
          right: deviceWidthSize(context, 10),
        ),
        decoration: BoxDecoration(
          color: AppTheme.white,
          boxShadow: AppTheme.shadowList,
          borderRadius: BorderRadius.circular(13),
        ),
        duration: Durations.extralong4,
        curve: Curves.fastOutSlowIn,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            img != null
                ? Image.network(
                    img,
                    width: deviceWidth(context) * 0.4,
                    height: deviceHeight(context) * 0.09,
                    alignment: Alignment.center,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => const Center(
                      child: AppNameWidget(
                        fontSize: 32,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  )
                : const AppNameWidget(
                    fontSize: 48,
                    color: AppTheme.primaryColor,
                  ),
          ],
        ),
      ),
    );
  }

  Widget _tabView(BuildContext context) {
    List<Map<String, dynamic>> statics = [
      {
        "title": "stk_detail_total_donation".locale,
        "value": "${(widget.stkModel.totalDonation ?? 0).toStringAsFixed(0)} ₺",
        "icon": Icons.money
      },
      {
        "title": "stk_detail_process_count".locale,
        "value": (widget.stkModel.processCount ?? 0).toString(),
        "icon": Icons.plus_one
      },
      {
        "title": "stk_detail_donor_count".locale,
        "value": (widget.stkModel.totalDonor ?? 0).toString(),
        "icon": Icons.people
      },
    ];
    List<Map<String, dynamic>> categories = [
      {
        "title": "stk_detail_type".locale,
        "value": widget.stkModel.type ?? "",
      },
      {
        "title": "stk_detail_categories".locale,
        "value": widget.stkModel.categories.join(", "),
      },
      {
        "title": "stk_detail_un_goals".locale,
        "value": widget.stkModel.bmCategories.join(", "),
      },
      {
        "title": "stk_detail_field".locale,
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
            ),
            labelPadding: EdgeInsets.symmetric(
              horizontal: deviceWidthSize(context, 20),
            ),
            dividerColor: Colors.transparent,
            overlayColor: WidgetStateProperty.all(Colors.transparent),
            tabs: [
              Tab(
                child: Text(
                  "stk_detail_general_info".locale,
                ),
              ),
              Tab(
                child: Text(
                  "stk_detail_statistics".locale,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: deviceHeightSize(context, _tabController!.index == 0 ? 300 : 230),
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
                if (info[index]["icon"] != null) Icon(info[index]["icon"], color: AppTheme.primaryColor),
                const SizedBox(width: 15),
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
                      12,
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
