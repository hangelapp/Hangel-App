import 'dart:math';

import 'package:auto_size_text/auto_size_text.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/helpers/date_format_helper.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/appeal_status_model.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/providers/profile_page_provider.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/views/stk_detail_page.dart';
import 'package:hangel/widgets/add_photo_form.dart';
import 'package:hangel/widgets/app_name_widget.dart';
import 'package:hangel/widgets/bottom_sheet_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/list_item_widget.dart';
import 'package:hangel/widgets/locale_text.dart';
import 'package:provider/provider.dart';

import '../providers/login_register_page_provider.dart';
import '../providers/stk_provider.dart';
import '../widgets/app_bar_widget.dart';
import '../widgets/user_information_form.dart';
import 'brand_form_widget.dart';
import 'stk_form_widget.dart';
import 'utilities.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  static const routeName = '/profile';

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> with TickerProviderStateMixin {
  UserModel user = HiveHelpers.getUserFromHive();
  List<AppealStatusModel> appealStatuses = [];
  @override
  void initState() {
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      _tabController!.addListener(() {
        setState(() {});
      });
      await fetchDonationStatistics();
      await context.read<ProfilePageProvider>().checkApplicationStatus();
      await showUpdateUserInformationDialog(context);
    });
    super.initState();
  }

  Future<void> showUpdateUserInformationDialog(context) async {
    ScaffoldMessenger.of(context).clearMaterialBanners();
    if (user.getDynamicProfileCompleteness() < 70) return;
    int rand = Random().nextInt(100);
    if (rand < 95) return;
    ScaffoldMessenger.of(context).showMaterialBanner(
      MaterialBanner(
        elevation: 0,
        leading: InkWell(
          onTap: () {
            ScaffoldMessenger.of(context).clearMaterialBanners();
          },
          child: const Padding(
            padding: EdgeInsets.all(2.0),
            child: Icon(
              Icons.close,
            ),
          ),
        ),
        content:
            AutoSizeText("${"profile_doluluk".locale}${user.getDynamicProfileCompleteness().toString()}%", maxLines: 2),
        actions: [
          TextButton(
            child: LocaleText("profile_page_update_info"),
            onPressed: () async {
              WidgetsBinding.instance.addPostFrameCallback((_) async {
                ScaffoldMessenger.of(context).clearMaterialBanners();
                tabcontroller.jumpToTab(4);
                showBottomSheet(
                  context: context,
                  builder: (context) {
                    return BottomSheetWidget(
                      isMinPadding: true,
                      title: "profile_page_update_info".locale,
                      child: const UserInformationForm(),
                    );
                  },
                );
              });
            },
          ),
        ],
      ),
    );
    // showCupertinoModalPopup(
    //   context: context,
    //   builder: (context) => BottomSheetWidget(
    //     title: "title",
    //     child: SizedBox(height: Get.height / 3, child: Text(user.getDynamicProfileCompleteness().toString())),
    //     isMinPadding: true,
    //   ),
    // );
  }

  double totalDonationAmount = 0.0;
  int donationCount = 0;
  Future<void> fetchDonationStatistics() async {
    try {
      Query query = FirebaseFirestore.instance.collection('donations').where('userId', isEqualTo: user.uid);

      var snapshot = await query.get();

      double totalAmount = snapshot.docs.fold(0.0, (sum, doc) {
        double saleAmount = (doc['saleAmount'] as num?)?.toDouble() ?? 0.0;
        return sum + saleAmount;
      });

      setState(() {
        totalDonationAmount = totalAmount;
        donationCount = snapshot.docs.length;
      });
    } catch (e) {
      print("Bağış istatistiklerini çekerken hata oluştu: $e");
    }
  }

  TabController? _tabController;

  String formatPhoneNumber(String phone) {
    String formattedPhone =
        "${phone.substring(0, 3)} ${phone.substring(3, 6)} ${phone.substring(6, 9)} ${phone.substring(9, 11)} ${phone.substring(11, 13)}";
    return formattedPhone;
  }

  @override
  Widget build(BuildContext context) {
    user = context.watch<ProfilePageProvider>().user;
    appealStatuses = context.watch<ProfilePageProvider>().appealStatusList;
    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: true,
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
            // title: "profile_page_title".locale,
          ),
          Container(
            padding: EdgeInsets.only(
              left: deviceWidthSize(context, 30),
              right: deviceWidthSize(context, 30),
              bottom: deviceHeightSize(context, 5),
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
                  height: deviceHeightSize(context, 5),
                ),
                SizedBox(
                  width: deviceWidthSize(context, 300),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Text(
                        (user.name ?? ""),
                        textAlign: TextAlign.center,
                        style: AppTheme.semiBoldTextStyle(context, 24, color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    _tabView(context),
                  ],
                )),
          ),
        ],
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
          width: 120,
          height: 120,
          decoration: const BoxDecoration(
            color: AppTheme.secondaryColor,
            shape: BoxShape.circle,
          ),
          child: CachedNetworkImage(
            imageUrl: user.image ?? "https://www.example.com/1.jpg",
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
                      style: AppTheme.blackTextStyle(context, 48, color: AppTheme.white),
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
                      style: AppTheme.blackTextStyle(context, 48, color: AppTheme.white),
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
                builder: (context) => BottomSheetWidget(title: "profile_page_add_photo".locale, child: const AddPhotoForm()),
              );
            },
            child: Container(
              width: 30,
              height: 30,
              decoration: const BoxDecoration(
                color: AppTheme.secondaryColor,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Icon(
                  Icons.edit,
                  color: Colors.white,
                  size: deviceFontSize(context, 15),
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
        if (names[i].isNotEmpty) {
          text += names[i][0];
        }
      }
      return text.toUpperCase();
    } catch (e) {
      return "";
    }
  }

  Widget _tabView(BuildContext context) {
    bool appealAvailable = appealStatuses
        .where((element) => element.appealStatus != null && element.appealStatus!.contains("active"))
        .isEmpty;
    List<Map<String, dynamic>> statics = [
      {
        "icon": Icons.money_outlined,
        "title": "profile_page_total_donation".locale,
        "value": "${totalDonationAmount.toStringAsFixed(2)} TL",
      },
      {
        "icon": Icons.wifi_protected_setup_sharp,
        "title": "profile_page_donation_count".locale,
        "value": "$donationCount",
      },
      {
        "icon": Icons.date_range_rounded,
        "title": "profile_page_membership_date".locale,
        "value": HiveHelpers.getUserFromHive().createdAt == null
            ? "-"
            : DateFormatHelper.getDate(HiveHelpers.getUserFromHive().createdAt.toString(), context)
      },
    ];
    List<Map<String, dynamic>> volunteerInfo = [
      {"icon": Icons.contact_emergency_outlined, "title": "profile_page_volunteer_organizations".locale, "value": "-"},
      {"icon": Icons.account_tree_rounded, "title": "profile_page_project_count".locale, "value": "0"},
      {"icon": Icons.one_x_mobiledata_sharp, "title": "profile_page_total_hours".locale, "value": "0"},
    ];
    List<Map<String, dynamic>> info = [
      {
        "icon": Icons.person_rounded,
        "title": "profile_page_gender".locale,
        "value": HiveHelpers.getUserFromHive().gender ?? "-",
      },
      {
        "icon": Icons.email_rounded,
        "title": "profile_page_email".locale,
        "value": HiveHelpers.getUserFromHive().email ?? "-",
      },
      {
        "icon": Icons.phone_rounded,
        "title": "profile_page_phone".locale,
        "value": HiveHelpers.getUserFromHive().phone == null
            ? "-"
            : formatPhoneNumber(HiveHelpers.getUserFromHive().phone ?? ""),
      },
      {
        "icon": Icons.cake_rounded,
        "title": "profile_page_birth_date".locale,
        "value": HiveHelpers.getUserFromHive().birthDate == null
            ? "-"
            : DateFormatHelper.getDate(HiveHelpers.getUserFromHive().birthDate.toString(), context)
      },
      {
        "icon": Icons.location_on_rounded,
        "title": "profile_page_location".locale,
        "value": HiveHelpers.getUserFromHive().city == null
            ? "-"
            : HiveHelpers.getUserFromHive().city ??
                "-/${HiveHelpers.getUserFromHive().district ?? "-"}/${HiveHelpers.getUserFromHive().neighberhood ?? "-"}",
      },
    ];
    return Column(
      children: [
        SizedBox(
          height: deviceHeightSize(context, 20),
        ),
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
            dividerColor: Colors.transparent,
            overlayColor: WidgetStateProperty.all(Colors.transparent),
            tabs: [
              Tab(
                child: Text(
                  "profile_page_personal_info".locale,
                  style: const TextStyle(fontSize: 12),
                ),
              ),
              Tab(
                child: Text(
                  "profile_page_volunteer".locale,
                  style: const TextStyle(fontSize: 12),
                ),
              ),
              Tab(
                child: Text(
                  "profile_page_statistics".locale,
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: deviceHeightSize(context, 4),
        ),
        (_tabController!.index == 0)
            ? _personalInfo(context, info)
            : (_tabController!.index == 1)
                ? _volunteerInfo(context, volunteerInfo)
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
            "profile_page_supported_ngos".locale,
            style: AppTheme.boldTextStyle(context, 16),
          ),
        ),
        FutureBuilder(
          future: context.read<STKProvider>().getFavoriteSTKs(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const CircularProgressIndicator();
            } else if (snapshot.hasError) {
              return Center(child: Text('profile_page_error_occurred'.locale));
            } else if (snapshot.hasData) {
              List<StkModel>? data = snapshot.data;

              if (data == null || data.isEmpty) {
                return nullStkWidget(context);
              }

              return Column(
                children: data.map<Widget>((stk) {
                  return stkItem(context, stk);
                }).toList(),
              );
            }

            return nullStkWidget(context);
          },
        ),
        Container(
          margin: const EdgeInsets.only(bottom: 15, top: 30),
          padding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 20),
          ),
          child: GeneralButtonWidget(
            isLoading: context.watch<ProfilePageProvider>().appealloadingState == LoadingState.loading,
            onPressed: appealAvailable
                ? () async {
                    //STK başvuru butonu
                    await showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      builder: (context) => BottomSheetWidget(
                        title: "profile_page_stk_application_form".locale,
                        isMinPadding: true,
                        child: const STKFormWidget(),
                      ),
                    ).then(
                      (value) async {
                        await context.read<ProfilePageProvider>().checkApplicationStatus();
                      },
                    );
                  }
                : null,
            text: appealAvailable
                ? "profile_page_stk_application_form_button".locale
                : "profile_page_stk_application_form_button_disabled".locale,
          ),
        ),
        Container(
          margin: const EdgeInsets.only(bottom: 15),
          padding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 20),
          ),
          child: GeneralButtonWidget(
              onPressed: () async {
                await showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  builder: (context) => BottomSheetWidget(
                    title: "profile_page_brand_application_form_button".locale,
                    isMinPadding: true,
                    child: const BrandFormWidget(),
                  ),
                ).then(
                  (value) async {
                    await context.read<ProfilePageProvider>().checkApplicationStatus();
                  },
                );
              },
              text: "profile_page_brand_application_form_button".locale),
        ),
        Container(
          margin: const EdgeInsets.only(bottom: 15),
          padding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 20),
          ),
          child: Column(
            children: [
              Container(
                alignment: Alignment.centerLeft,
                child: Text(
                  "profile_page_appeal_status".locale,
                  style: AppTheme.boldTextStyle(context, 16),
                ),
              ),
              SizedBox(
                width: deviceWidth(context),
                height: deviceHeightSize(context, 200),
                child: ListView.builder(
                  padding: EdgeInsets.zero,
                  itemCount: appealStatuses.isEmpty ? 1 : appealStatuses.length,
                  itemBuilder: (context, index) {
                    if (appealStatuses.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.all(8.0),
                        // Localization ekle->
                        child: Text("Henüz başvurunuz yok!"),
                      );
                    }
                    return ListTile(
                      titleTextStyle: AppTheme.lightTextStyle(context, 14),
                      shape: const StadiumBorder(),
                      leading: const Icon(Icons.people_alt),
                      title: Text((appealStatuses[index].appealName != null
                          ? appealStatuses[index].appealName! +
                              " (${appealStatuses[index].appealStatus == 'active' ? 'Aktif' : appealStatuses[index].appealStatus == 'passive' ? 'Pasif' : appealStatuses[index].appealStatus ?? '---'})"
                          : "---")),
                      subtitle: Text(appealStatuses[index].appealTime != null
                          ? "${appealStatuses[index].appealTime!.day}.${appealStatuses[index].appealTime!.month}.${appealStatuses[index].appealTime!.year}"
                          : "---"),
                      trailing: const Icon(Icons.arrow_circle_right_outlined),
                      onTap: () {},
                    );
                  },
                ),
              )
            ],
          ),
        ),
      ],
    );
  }

  _volunteerInfo(BuildContext context, List<Map<String, dynamic>> info) {
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

  _personalInfo(BuildContext context, List<Map<String, dynamic>> info) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
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
        (_tabController!.index == 0)
            ? InkWell(
                onTap: () {
                  showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      builder: (context) {
                        return BottomSheetWidget(
                            isMinPadding: true, title: "profile_page_update_info".locale, child: const UserInformationForm());
                      });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                  ),
                  margin: const EdgeInsets.only(left: 20),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        "profile_page_update_info".locale,
                        style: const TextStyle(
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Container(
                        decoration: const BoxDecoration(
                          color: AppTheme.primaryColor,
                          shape: BoxShape.circle,
                        ),
                        padding: EdgeInsets.all(deviceWidthSize(context, 2)),
                        child: const Icon(
                          Icons.edit_rounded,
                          color: AppTheme.white,
                          size: 12,
                        ),
                      )
                    ],
                  ),
                ),
              )
            : const SizedBox(),
      ],
    );
  }

  Widget _statistics(BuildContext context, List<Map<String, dynamic>> statics) {
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
                          statics[index]["title"]!.locale,
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

  stkItem(BuildContext context, StkModel stk) {
    return ListItemWidget(
      context,
      title: stk.name ?? "",
      logo: stk.logo ?? "",
      desc: stk.detailText ?? "",
      logoHeight: deviceHeightSize(context, 60),
      logoWidth: deviceWidthSize(context, 60),
      paddingHorizontal: deviceWidthSize(context, 8),
      paddingVertical: deviceHeightSize(context, 8),
      nullFontSize: 12,
      isActive: stk.isActive,
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
        );
      },
    );
  }
}
