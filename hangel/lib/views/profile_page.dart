import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
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
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/list_item_widget.dart';
import 'package:provider/provider.dart';

import '../providers/stk_provider.dart';
import '../widgets/app_bar_widget.dart';
import '../widgets/user_information_form.dart';
import 'brand_form_widget.dart';
import 'stk_form_widget.dart';
import 'utilities.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({Key? key}) : super(key: key);

  static const routeName = '/profile';

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> with TickerProviderStateMixin {
  UserModel user = HiveHelpers.getUserFromHive();
  @override
  void initState() {
    _tabController = TabController(length: 3, vsync: this);
    SchedulerBinding.instance.addPostFrameCallback((_) {
      // context.read<ProfilePageProvider>().getProfile();
      _tabController!.addListener(() {
        setState(() {});
      });
    });
    // Bağış verilerini internetten çek
    fetchDonationStatistics();
    super.initState();
  }

  // Toplam Bağış Miktarı ve Bağış İşlem Sayısı için state değerleri
  double totalDonationAmount = 0.0;
  int donationCount = 0;
  // Bağış istatistiklerini çekme fonksiyonu
  Future<void> fetchDonationStatistics() async {
    try {
      Query query = FirebaseFirestore.instance
          .collection('donations')
          .where('userId', isEqualTo: user.uid); // Kullanıcıya ait bağışlar

      var snapshot = await query.get();

      double totalAmount = snapshot.docs.fold(0.0, (sum, doc) {
        double saleAmount = (doc['saleAmount'] as num?)?.toDouble() ?? 0.0;
        return sum + saleAmount;
      });

      setState(() {
        totalDonationAmount = totalAmount; // Toplam bağış miktarını ayarla
        donationCount = snapshot.docs.length; // Bağış işlem sayısını ayarla
      });
    } catch (e) {
      print("Bağış istatistiklerini çekerken hata oluştu: $e");
    }
  }

  TabController? _tabController;

  //format phone number to +90 812 345 78 90
  String formatPhoneNumber(String phone) {
    String formattedPhone =
        "${phone.substring(0, 3)} ${phone.substring(3, 6)} ${phone.substring(6, 9)} ${phone.substring(9, 11)} ${phone.substring(11, 13)}";
    return formattedPhone;
  }

  @override
  Widget build(BuildContext context) {
    user = context.watch<ProfilePageProvider>().user;
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
                      //İsim değiştirme artık Bilgileri Güncelle altında olacak.
                      // Positioned(
                      //   right: 0,
                      //   child: GestureDetector(
                      //     onTap: () {
                      //       showModalBottomSheet(
                      //         context: context,
                      //         isScrollControlled: true,
                      //         backgroundColor: Colors.transparent,
                      //         builder: (dialogContext) {
                      //           return const BottomSheetWidget(title: "İsim Değiştir", child: UserNameForm());
                      //         },
                      //       );
                      //     },
                      //     child: Icon(
                      //       Icons.edit,
                      //       color: AppTheme.white,
                      //       size: deviceFontSize(context, 24),
                      //     ),
                      //   ),
                      // )
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
                physics: AlwaysScrollableScrollPhysics(),
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
            // border: Border.fromBorderSide(
            //   BorderSide(
            //     color: Colors.white,
            //     width: 4,
            //   ),
            // ),
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
                builder: (context) => const BottomSheetWidget(title: "Fotoğraf Ekle", child: AddPhotoForm()),
              );
            },
            child: Container(
              width: 30,
              height: 30,
              decoration: const BoxDecoration(
                color: AppTheme.secondaryColor,
                shape: BoxShape.circle,
                // border: Border.fromBorderSide(
                //   BorderSide(
                //     color: Colors.white,
                //     width: 2,
                //   ),
                // ),
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
    List<Map<String, dynamic>> statics = [
      {
        "icon": Icons.money_outlined,
        "title": "Toplam Bağış Miktarı",
        "value": "${totalDonationAmount.toStringAsFixed(2)} TL",
      },
      {
        "icon": Icons.wifi_protected_setup_sharp,
        "title": "Bağış İşlem Sayısı",
        "value": "$donationCount",
      },
      {
        "icon": Icons.date_range_rounded,
        "title": "Üye Olduğu Tarih",
        "value": HiveHelpers.getUserFromHive().createdAt == null
            ? "-"
            : DateFormatHelper.getDate(HiveHelpers.getUserFromHive().createdAt.toString(), context)
      },
    ];
    List<Map<String, dynamic>> volunteerInfo = [
      {"icon": Icons.contact_emergency_outlined, "title": "Görev Aldığı Kuruluşlar", "value": "-"},
      {"icon": Icons.account_tree_rounded, "title": "Proje Sayısı", "value": "0"},
      {"icon": Icons.one_x_mobiledata_sharp, "title": "Toplam Saat", "value": "0"},
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
            : DateFormatHelper.getDate(HiveHelpers.getUserFromHive().birthDate.toString(), context)
      },
      {
        "icon": Icons.location_on_rounded,
        "title": "İl/İlçe/Mahalle",
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
              // border: Border.all(
              //   color: AppTheme.primaryColor,
              //   width: 2,
              // ),
            ),
            dividerColor: Colors.transparent,
            overlayColor: WidgetStateProperty.all(Colors.transparent),
            tabs: [
              Tab(
                child: const Text(
                  "Kişisel Bilgiler",
                  style: TextStyle(fontSize: 12),
                ),
              ),
              const Tab(
                child: Text(
                  "Gönüllülük",
                  style: TextStyle(fontSize: 12),
                ),
              ),
              const Tab(
                child: Text(
                  "İstatistikler",
                  style: TextStyle(fontSize: 12),
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
            "Desteklediğin STK'lar",
            style: AppTheme.boldTextStyle(context, 16),
          ),
        ),
        FutureBuilder(
          future: context.read<STKProvider>().getFavoriteSTKs(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              // Veriler yüklenirken bir yükleniyor göstergesi göstermek için kullanılabilir.
              return CircularProgressIndicator();
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
              return Column(
                children: data.map<Widget>((stk) {
                  return stkItem(context, stk);
                }).toList(),
              );
            }

            // Diğer durumlar için, boş durum widget'ını döndür.
            return nullStkWidget(context);
          },
        ),

        // ...List.generate(
        //     HiveHelpers.getUserFromHive().favoriteStks.length == 0 ? 1 : context.watch<STKProvider>().stkList.length,
        //     (index) => HiveHelpers.getUserFromHive().favoriteStks.length == 0
        //         ? nullStkWidget(context)
        //         : HiveHelpers.getUserFromHive().favoriteStks.contains(context.watch<STKProvider>().stkList[index].id)
        //             ? stkItem(context, index)
        //             : const SizedBox()),

        //Bu kısım şimdlik kapalı
        // Container(
        //   margin: const EdgeInsets.symmetric(vertical: 15),
        //   padding: EdgeInsets.symmetric(
        //     horizontal: deviceWidthSize(context, 20),
        //   ),
        //   child: GeneralButtonWidget(
        //       onPressed: () {
        //         showModalBottomSheet(
        //           context: context,
        //           isScrollControlled: true,
        //           builder: (context) => const BottomSheetWidget(
        //             title: "Gönüllü Başvuru Formu",
        //             isMinPadding: true,
        //             child: VolunteerForm(),
        //           ),
        //         );
        //       },
        //       text: "Gönüllü olmak istiyorum"),
        // ),
        Container(
          margin: const EdgeInsets.only(bottom: 15, top: 30),
          padding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 20),
          ),
          child: GeneralButtonWidget(
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
              text: "STK Başvuru Formu"),
        ),
        Container(
          margin: const EdgeInsets.only(bottom: 150),
          padding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 20),
          ),
          child: GeneralButtonWidget(
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
              text: "Marka Başvuru Formu"),
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
                        return const BottomSheetWidget(
                            isMinPadding: true, title: "Kişisel Bilgiler", child: UserInformationForm());
                      });
                },
                child: Container(
                  padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    //  borderRadius: BorderRadius.circular(5),
                  ),
                  margin: EdgeInsets.only(left: 20),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        "Bilgileri Güncelle",
                        style: TextStyle(
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      SizedBox(width: 4),
                      Container(
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor,
                          shape: BoxShape.circle,
                          // border: Border.all(
                          //   color: AppTheme.white,
                          //   width: 2,
                          // ),
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
            : SizedBox(),
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
