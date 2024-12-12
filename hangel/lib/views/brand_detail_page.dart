import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart'; // Assuming .locale is defined here
import 'package:hangel/helpers/date_format_helper.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/helpers/url_launcher_helper.dart';
import 'package:hangel/models/brand_info_model.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:provider/provider.dart';
import '../widgets/app_bar_widget.dart';
import '../widgets/app_name_widget.dart';
import '../widgets/general_button_widget.dart';
import '../widgets/gradient_widget.dart';
import '../widgets/locale_text.dart'; // Assuming LocaleText widget is defined here
import 'utilities.dart';

class BrandDetailPage extends StatefulWidget {
  const BrandDetailPage({Key? key, required this.brandModel}) : super(key: key);
  final BrandModel brandModel;

  @override
  State<BrandDetailPage> createState() => _BrandDetailPageState();
}

class _BrandDetailPageState extends State<BrandDetailPage> with SingleTickerProviderStateMixin {
  TabController? _tabController;
  bool linkButtonLoading = false;
  BrandInfoModel? brandInfo;

  @override
  void initState() {
    _tabController = TabController(length: 2, vsync: this);
    _tabController!.addListener(() {
      setState(() {});
    });
    Future.delayed(Duration(milliseconds: 100), () async {
      await context.read<BrandProvider>().getBrandInfo(widget.brandModel.id ?? "").then(
        (value) {
          if (!mounted) return;
          setState(() {
            brandInfo = value;
          });
          print("${brandInfo?.brandId.toString()} yüklendi");
        },
      );
    });
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
    _tabController!.dispose();
  }

  @override
  Widget build(BuildContext context) {
    bool favoriteButtonLoading = context.watch<BrandProvider>().favoriteButtonLoading;
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
                          title: widget.brandModel.name,
                          img: widget.brandModel.logo,
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
                                  child: widget.brandModel.logo != null
                                      ? Image.network(
                                          widget.brandModel.logo!,
                                          fit: BoxFit.contain,
                                          alignment: Alignment.center,
                                          errorBuilder: (context, error, stackTrace) => Center(
                                            child: Text(
                                              widget.brandModel.name![0],
                                              style: AppTheme.boldTextStyle(context, 28, color: AppTheme.black),
                                            ),
                                          ),
                                        )
                                      : Center(
                                          child: Text(
                                            widget.brandModel.name![0],
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
                                    (widget.brandModel.name ?? "").removeBrackets(),
                                    style: AppTheme.boldTextStyle(context, 16),
                                  ),
                                  SizedBox(
                                    height: deviceHeightSize(context, 2),
                                  ),
                                  Text(
                                    widget.brandModel.sector ?? "",
                                    style: AppTheme.normalTextStyle(context, 14, color: AppTheme.black.withOpacity(0.7)),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(
                              width: deviceWidthSize(context, 10),
                            ),
                            GestureDetector(
                              onTap: () async {
                                if (favoriteButtonLoading) return;
                                if (brandInfo == null || brandInfo?.brandId == null) return;
                                context.read<BrandProvider>().addRemoveFavoriteBrand(widget.brandModel.id!).then((value) {
                                  setState(() {});
                                });
                                await context.read<BrandProvider>().setFavoriteBrand(brandInfo!.brandId!).then((value) {
                                  setState(() {
                                    brandInfo = value;
                                  });
                                });
                              },
                              child: Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: deviceWidthSize(context, 10),
                                  vertical: deviceHeightSize(context, 5),
                                ),
                                child: favoriteButtonLoading
                                    ? const CircularProgressIndicator()
                                    : Column(
                                        children: [
                                          Icon(
                                            brandInfo?.favoriteIds?.contains(HiveHelpers.getUid()) == true
                                                ? Icons.favorite_rounded
                                                : Icons.favorite_border_rounded,
                                            color: AppTheme.primaryColor,
                                            size: deviceFontSize(context, 24),
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
                        Align(
                          alignment: Alignment.centerLeft,
                          child: LocaleText(
                            "brand_detail_page_bilgilendirmeler",
                            style: AppTheme.semiBoldTextStyle(context, 14, color: AppTheme.black),
                          ),
                        ),
                        Divider(
                          color: AppTheme.secondaryColor.withOpacity(0.1),
                          thickness: 1,
                        ),
                        SizedBox(
                          height: deviceHeightSize(context, 4),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.start,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.info_outline),
                            SizedBox(
                              width: 10,
                            ),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: SizedBox(
                                width: deviceWidth(context) * 0.75,
                                child: Text(
                                  "brand_detail_page_bagis_yansimama_mesaji1".locale +
                                      "${(widget.brandModel.donationRate ?? 0.12)}" +
                                      "brand_detail_page_bagis_yansimama_mesaji2".locale,
                                  style: AppTheme.semiBoldTextStyle(context, 14, color: AppTheme.black),
                                ),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.start,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.info_outline),
                            SizedBox(
                              width: 10,
                            ),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: SizedBox(
                                width: deviceWidth(context) * 0.75,
                                child: Text(
                                  "brand_detail_page_bagis_yansimama_mesaji3".locale,
                                  style: AppTheme.semiBoldTextStyle(context, 14, color: AppTheme.black),
                                ),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.start,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            const Icon(Icons.info_outline),
                            SizedBox(
                              width: 10,
                            ),
                            Align(
                              alignment: Alignment.topLeft,
                              child: TextButton(
                                style: ButtonStyle(padding: WidgetStateProperty.all(EdgeInsets.zero)),
                                child: Text(
                                  "brand_detail_page_genel_bonus_kosullari".locale,
                                  style: AppTheme.semiBoldTextStyleWithUnderline(context, 14, color: AppTheme.black),
                                ),
                                onPressed: () {
                                  showKosulDialog(context);
                                },
                              ),
                            ),
                          ],
                        ),
                        SizedBox(
                          height: deviceHeightSize(context, 10),
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
                                  text: "brand_detail_page_join_date_label".locale,
                                  style: AppTheme.normalTextStyle(context, 14, color: AppTheme.black.withOpacity(0.7)),
                                ),
                                TextSpan(
                                  text: DateFormatHelper.getDate(
                                      (widget.brandModel.creationDate ?? "").toString(), context),
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
                              if (widget.brandModel.inEarthquakeZone == true)
                                tagItem(
                                  context,
                                  color: AppTheme.blue,
                                  text: "brand_detail_page_deprem_bolgesi".locale,
                                ),
                              if (widget.brandModel.isSocialEnterprise == true)
                                tagItem(
                                  context,
                                  color: AppTheme.green,
                                  text: "brand_detail_page_sosyal_girisim".locale,
                                ),
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
                      onPressed: () async {
                        if (HiveHelpers.getUserFromHive().phone == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text("brand_detail_page_alisveris_hata_mesaji1".locale)),
                          );
                          return;
                        }
                        if (HiveHelpers.getUid().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text("brand_detail_page_alisveris_hata_mesaji2".locale)),
                          );
                          return;
                        }
                        if (HiveHelpers.getUserFromHive().favoriteStks.length != 2) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text("brand_detail_page_alisveris_hata_mesaji3".locale)),
                          );
                          return;
                        }
                        setState(() {
                          linkButtonLoading = true;
                        });
                        String aff_sub = HiveHelpers.getUid();
                        String aff_sub2 = generateShortHash();

                        print("TRACKING LINK\n${widget.brandModel.link}&aff_sub=$aff_sub&aff_sub2=$aff_sub2");
                        await FirebaseFirestore.instance.collection("clicks").add({
                          "aff_sub": aff_sub,
                          "aff_sub2": aff_sub2,
                          "time": Timestamp.now(),
                          "link": widget.brandModel.link,
                          "offer_id": widget.brandModel.id,
                          "stk_ids": HiveHelpers.getUserFromHive().favoriteStks,
                          "donation_rate": widget.brandModel.donationRate
                        }).then(
                          (value) {
                            setState(() {
                              linkButtonLoading = false;
                            });
                          },
                        );
                        print(widget.brandModel.link);
                        UrlLauncherHelper()
                            .launch("${widget.brandModel.link}&aff_sub=$aff_sub&aff_sub2=$aff_sub2")
                            .whenComplete(
                              () => Navigator.pop(context),
                            );
                        setState(() {
                          linkButtonLoading = false;
                        });
                      },
                      text: "brand_detail_page_alisverise_basla".locale,
                      buttonColor: AppTheme.primaryColor,
                      isLoading: linkButtonLoading,
                    ))
              ],
            ),
          ),
        ],
      ),
    );
  }

  void showKosulDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          insetPadding:
              EdgeInsets.symmetric(horizontal: deviceWidth(context) * 0.15, vertical: deviceHeight(context) * 0.2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10.0),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "brand_detail_page_sonraki_alisveris_kosullari_title".locale,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16.0),
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSection(
                          context,
                          "brand_form_page_adblock".locale,
                          "brand_form_page_adblock_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_internet_tarayicisi".locale,
                          "brand_form_page_internet_tarayicisi_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_gizli_pencere".locale,
                          "brand_form_page_gizli_pencere_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_diger_programlar".locale,
                          "brand_form_page_diger_programlar_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_kupon_kodu".locale,
                          "brand_form_page_kupon_kodu_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_fiyat_karsilastirma".locale,
                          "brand_form_page_fiyat_karsilastirma_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_mobil_uygulama".locale,
                          "brand_form_page_mobil_uygulama_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_sepet".locale,
                          "brand_form_page_sepet_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_diger_para_iadesi".locale,
                          "brand_form_page_diger_para_iadesi_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_site_ziyaret".locale,
                          "brand_form_page_site_ziyaret_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_ortak_sirketler".locale,
                          "brand_form_page_ortak_sirketler_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_telefon_siparis".locale,
                          "brand_form_page_telefon_siparis_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_farkli_ulke".locale,
                          "brand_form_page_farkli_ulke_content".locale,
                        ),
                        _buildSection(
                          context,
                          "brand_form_page_markanin_ozel_kosullari".locale,
                          "brand_form_page_markanin_ozel_kosullari_content".locale,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16.0),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                    },
                    child: Text("brand_form_page_tamam".locale),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSection(BuildContext context, String title, String content) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8.0),
          Text(
            content,
            style: Theme.of(context).textTheme.bodyMedium,
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
    required String? title,
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
                        color: AppTheme.white,
                      ),
                    ),
                  )
                : const AppNameWidget(
                    fontSize: 48,
                    color: AppTheme.white,
                  ),
          ],
        ),
      ),
    );
  }

  _tabView(BuildContext context) {
    List<Map<String, dynamic>> statics = [
      {
        "title": "brand_detail_page_toplam_bagis".locale,
        "value": "${brandInfo?.totalDonation?.toStringAsFixed(1) ?? "0"} ₺",
      },
      {
        "title": "brand_detail_page_favori".locale,
        "value": "${brandInfo?.favoriteIds?.length ?? "0"}",
      },
      {
        "title": "brand_detail_page_islem_sayisi".locale,
        "value": "${brandInfo?.processCount?.toStringAsFixed(0) ?? "0"}",
      },
    ];
    List<Map<String, dynamic>> categories = [
      {
        "title": "brand_detail_page_kategoriler".locale,
        "value": widget.brandModel.categories?.map((e) => e.name).join(', ') ?? '',
      },
      {
        "title": "brand_detail_page_bagis_orani".locale,
        "value": "${widget.brandModel.donationRate.toString()}%",
      },
      {
        "title": "brand_detail_page_deprem_bolgesi_mi".locale,
        "value": (widget.brandModel.inEarthquakeZone ?? false)
            ? "yes".locale // Assuming "yes" key in localization
            : "no".locale,  // Assuming "no" key in localization
      },
    ];

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
          ),
          labelPadding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 10),
          ),
          dividerColor: Colors.transparent,
          overlayColor: WidgetStateProperty.all(Colors.transparent),
          tabs: [
            Tab(
              child: LocaleText(
                "info", // Assuming "info" key in localization
              ),
            ),
            Tab(
              child: LocaleText(
                "statistics", // Assuming "statistics" key in localization
              ),
            ),
          ],
        ),
        AnimatedContainer(
          height: deviceHeightSize(
              context, _tabController?.index == 0 ? ((categories.length * 70)) + 10 : ((statics.length * 70)) + 10),
          duration: Durations.medium1,
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
                  flex: _tabController?.index == 0 ? 1 : 2,
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
