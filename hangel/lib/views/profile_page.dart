import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/date_format_helper.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/providers/profile_page_provider.dart';
import 'package:hangel/views/stk_detail_page.dart';
import 'package:hangel/widgets/add_photo_form.dart';
import 'package:hangel/widgets/app_name_widget.dart';
import 'package:hangel/widgets/bottom_sheet_widget.dart';
import 'package:hangel/widgets/list_item_widget.dart';

import 'package:hangel/widgets/user_information_form.dart';
import 'package:hangel/widgets/user_name_form.dart';
import 'package:provider/provider.dart';

import '../providers/stk_provider.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({Key? key}) : super(key: key);

  static const routeName = '/profile';

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage>
    with TickerProviderStateMixin {
  UserModel user = HiveHelpers.getUserFromHive();
  @override
  void initState() {
    _tabController = TabController(length: 2, vsync: this);
    SchedulerBinding.instance.addPostFrameCallback((_) {
      // context.read<ProfilePageProvider>().getProfile();
      _tabController!.addListener(() {
        setState(() {});
      });
    });
    super.initState();
  }

  TabController? _tabController;

  //format phone number to +90 812 345 78 90
  String formatPhoneNumber(String phone) {
    String formattedPhone = phone.substring(0, 3) +
        " " +
        phone.substring(3, 6) +
        " " +
        phone.substring(6, 9) +
        " " +
        phone.substring(9, 11) +
        " " +
        phone.substring(11, 13);
    return formattedPhone;
  }

  @override
  Widget build(BuildContext context) {
    user = context.watch<ProfilePageProvider>().user;
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.only(
                top: deviceTopPadding(context),
                left: deviceWidthSize(context, 30),
                right: deviceWidthSize(context, 30),
                bottom: deviceHeightSize(context, 30),
              ),
              decoration: const BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(30),
                  bottomRight: Radius.circular(30),
                ),
              ),
              width: deviceWidth(context),
              child: Column(
                children: [
                  SizedBox(
                    height: deviceHeightSize(context, 20),
                  ),
                  profilePhotoWidget(),
                  SizedBox(
                    height: deviceHeightSize(context, 20),
                  ),
                  SizedBox(
                    width: deviceWidthSize(context, 300),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Text(
                          (user.name ?? ""),
                          textAlign: TextAlign.center,
                          style: AppTheme.semiBoldTextStyle(context, 24,
                              color: Colors.white),
                        ),
                        Positioned(
                          right: 0,
                          child: GestureDetector(
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (dialogContext) {
                                  return const BottomSheetWidget(
                                      title: "İsim Değiştir",
                                      child: UserNameForm());
                                },
                              );
                            },
                            child: Icon(
                              Icons.edit,
                              color: AppTheme.white,
                              size: deviceFontSize(context, 24),
                            ),
                          ),
                        )
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(
              height: deviceHeightSize(context, 20),
            ),
            _tabView(context),
            // Padding(
            //   padding: EdgeInsets.all(30.0),
            //   child: Row(
            //     children: [
            //       Expanded(
            //         child: profileItem(context, "assets/icons/class.svg",
            //             "${user. ?? ""}"),
            //       ),
            //       SizedBox(
            //         width: deviceWidthSize(context, 20),
            //       ),
            //       Expanded(
            //         child: profileItem(context, "assets/icons/level.svg",
            //             "${user.level ?? ""}. Seviye"),
            //       ),
            //     ],
            //   ),
            // ),
            // Align(
            //   alignment: Alignment.centerLeft,
            //   child: Padding(
            //     padding: EdgeInsets.only(
            //       left: deviceWidthSize(context, 30),
            //       bottom: deviceHeightSize(context, 10),
            //     ),
            //     child: Text(
            //       "Hangi sınava hazırlanıyorsun?",
            //       style: AppTheme.semiBoldTextStyle(context, 18),
            //     ),
            //   ),
            // ),
            // Padding(
            //   padding:
            //       EdgeInsets.symmetric(horizontal: deviceWidthSize(context, 30)),
            //   child: profileItem(
            //     context,
            //     "assets/icons/exam.svg",
            //     "Liseye Geçiş Sınavı (LGS)",
            //   ),
            // ),
          ],
        ),
      ),
    );
  }

  Container profileItem(BuildContext context, String icon, String text) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: deviceWidthSize(context, 20),
        vertical: deviceHeightSize(context, 30),
      ),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(13),
      ),
      child: Row(
        children: [
          SvgPicture.asset(
            icon,
            width: deviceWidthSize(context, 20),
            height: deviceWidthSize(context, 20),
          ),
          SizedBox(
            width: deviceWidthSize(context, 16),
          ),
          Expanded(
            child: Text(
              text,
              style: AppTheme.semiBoldTextStyle(context, 18),
            ),
          ),
        ],
      ),
    );
  }

  Stack profilePhotoWidget() {
    return Stack(
      children: [
        Container(
          width: deviceWidthSize(context, 220),
          height: deviceWidthSize(context, 220),
          decoration: const BoxDecoration(
            color: AppTheme.secondaryColor,
            shape: BoxShape.circle,
            border: Border.fromBorderSide(
              BorderSide(
                color: Colors.white,
                width: 8,
              ),
            ),
          ),
          child: CachedNetworkImage(
            imageUrl: user.image ?? "",
            imageBuilder: (context, imageProvider) => Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                image: DecorationImage(
                  image: imageProvider,
                  fit: BoxFit.cover,
                ),
              ),
            ),
            placeholder: (context, url) => Center(
              child: (user.name ?? "").isEmpty || user.name == null
                  ? const AppNameWidget(
                      fontSize: 40,
                      secondaryColor: AppTheme.white,
                    )
                  : Text(
                      nameText(user.name ?? ""),
                      style: AppTheme.blackTextStyle(context, 48,
                          color: AppTheme.white),
                    ),
            ),
            errorWidget: (context, url, error) => Center(
              child: (user.name ?? "").isEmpty || user.name == null
                  ? const AppNameWidget(
                      fontSize: 40,
                      secondaryColor: AppTheme.white,
                    )
                  : Text(
                      nameText(user.name ?? ""),
                      style: AppTheme.blackTextStyle(context, 48,
                          color: AppTheme.white),
                    ),
            ),
          ),
        ),
        Positioned(
          top: 0,
          right: 0,
          child: GestureDetector(
            onTap: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => const BottomSheetWidget(
                    title: "Fotoğraf Ekle", child: AddPhotoForm()),
              );
            },
            child: Container(
              width: deviceWidthSize(context, 55),
              height: deviceWidthSize(context, 55),
              decoration: const BoxDecoration(
                color: AppTheme.secondaryColor,
                shape: BoxShape.circle,
                border: Border.fromBorderSide(
                  BorderSide(
                    color: Colors.white,
                    width: 4,
                  ),
                ),
              ),
              child: Center(
                child: Icon(
                  Icons.edit,
                  color: Colors.white,
                  size: deviceFontSize(context, 24),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  String nameText(String name) {
    try {
      List<String> names = name.split(" ");
      String text = "";
      for (int i = 0; i < names.length; i++) {
        if (names[i].length > 0) {
          text += names[i][0];
        }
      }
      return text.toUpperCase();
    } catch (e) {
      return "";
    }
  }

  _tabView(BuildContext context) {
    List<Map<String, dynamic>> statics = [
      {
        "icon": Icons.people_rounded,
        "title": "Toplam Bağış Sayısı",
        "value": "0",
      },
      {
        "icon": Icons.volunteer_activism_rounded,
        "title": "Toplam Bağış Miktarı",
        "value": "0",
      },
      {
        "icon": Icons.date_range_rounded,
        "title": "Üye Olduğu Tarih",
        "value": HiveHelpers.getUserFromHive().createdAt == null
            ? "-"
            : DateFormatHelper.getDate(
                HiveHelpers.getUserFromHive().createdAt.toString(), context)
      },
    ];

    List<Map<String, dynamic>> info = [
      {
        "icon": Icons.person_rounded,
        "title": "Cinsiyet",
        "value": HiveHelpers.getUserFromHive().gender ?? "-",
      },
      {
        "icon": Icons.email_rounded,
        "title": "Email",
        "value": HiveHelpers.getUserFromHive().email ?? "-",
      },
      {
        "icon": Icons.phone_rounded,
        "title": "Telefon",
        "value": HiveHelpers.getUserFromHive().phone == null
            ? "-"
            : formatPhoneNumber(HiveHelpers.getUserFromHive().phone ?? ""),
      },
      {
        "icon": Icons.cake_rounded,
        "title": "Doğum Tarihi",
        "value": HiveHelpers.getUserFromHive().birthDate == null
            ? "-"
            : DateFormatHelper.getDate(
                HiveHelpers.getUserFromHive().birthDate.toString(), context)
      },
      {
        "icon": Icons.location_on_rounded,
        "title": "İl/İlçe/Mahalle",
        "value": HiveHelpers.getUserFromHive().city == null
            ? "-"
            : HiveHelpers.getUserFromHive().city ??
                "-" +
                    "/" +
                    (HiveHelpers.getUserFromHive().district ?? "-") +
                    "/" +
                    (HiveHelpers.getUserFromHive().neighberhood ?? "-"),
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
            dividerColor: Colors.transparent,
            overlayColor: MaterialStateProperty.all(Colors.transparent),
            tabs: [
              Tab(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      "Kişisel Bilgiler",
                    ),
                    if (_tabController!.index == 0)
                      Row(
                        children: [
                          SizedBox(
                            width: deviceWidthSize(context, 8),
                          ),
                          GestureDetector(
                            onTap: () {
                              showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  builder: (context) {
                                    return const BottomSheetWidget(
                                        isMinPadding: true,
                                        title: "Kişisel Bilgiler",
                                        child: UserInformationForm());
                                  });
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppTheme.white,
                                  width: 2,
                                ),
                              ),
                              padding:
                                  EdgeInsets.all(deviceWidthSize(context, 3)),
                              child: const Icon(
                                Icons.edit_rounded,
                                color: AppTheme.white,
                                size: 15,
                              ),
                            ),
                          ),
                        ],
                      ),
                  ],
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
          height: deviceHeightSize(context, 4),
        ),
        _tabController!.index == 0
            ? _personalInfo(context, info)
            : _personalInfo(context, statics),
        SizedBox(
          height: deviceHeightSize(context, 20),
        ),
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 20),
          ),
          alignment: Alignment.centerLeft,
          child: Text(
            "Desteklediğin STK'lar",
            style: AppTheme.boldTextStyle(context, 16),
          ),
        ),
        ...List.generate(
            context.watch<STKProvider>().stkList.length,
            (index) => HiveHelpers.getUserFromHive()
                    .favoriteStks
                    .contains(context.watch<STKProvider>().stkList[index].id)
                ? stkItem(context, index)
                : const SizedBox()),
      ],
    );
  }

  _personalInfo(BuildContext context, List<Map<String, dynamic>> info) {
    return Column(
      children: [
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
                Icon(
                  info[index]["icon"] as IconData,
                  color: AppTheme.primaryColor,
                  size: deviceFontSize(context, 24),
                ),
                SizedBox(
                  width: deviceWidthSize(context, 10),
                ),
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
                    info[index]["value"]!,
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

  _statistics(BuildContext context, List<Map<String, dynamic>> statics) {
    return SizedBox(
      height: deviceHeightSize(context, 100),
      width: deviceWidth(context),
      child: Column(
        children: [
          SizedBox(
            height: deviceHeightSize(context, 10),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                SizedBox(
                  width: deviceWidthSize(context, 20),
                ),
                ...List.generate(
                  statics.length,
                  (index) => Container(
                    margin: EdgeInsets.only(
                      right: deviceWidthSize(context, 10),
                    ),
                    padding: EdgeInsets.symmetric(
                      horizontal: deviceWidthSize(context, 10),
                      vertical: deviceHeightSize(context, 5),
                    ),
                    height: deviceHeightSize(context, 80),
                    width: deviceWidthSize(context, 140),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          statics[index]["title"]!,
                          textAlign: TextAlign.center,
                          style: AppTheme.normalTextStyle(
                            context,
                            14,
                          ),
                        ),
                        SizedBox(
                          height: deviceHeightSize(context, 5),
                        ),
                        Text(
                          statics[index]["value"]!,
                          textAlign: TextAlign.center,
                          style: AppTheme.semiBoldTextStyle(
                            context,
                            18,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  stkItem(BuildContext context, int index) {
    StkModel stkModel = context.watch<STKProvider>().stkList[index];
    return ListItemWidget(
      context,
      title: stkModel.name ?? "",
      logo: stkModel.logo ?? "",
      desc: stkModel.detailText ?? "",
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) {
              return STKDetailPage(
                stkModel: stkModel,
              );
            },
          ),
        );
      },
    );
  }
}
