import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/helpers/date_format_helper.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/helpers/url_launcher_helper.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:provider/provider.dart';
import '../widgets/app_bar_widget.dart';
import '../widgets/app_name_widget.dart';
import '../widgets/dialog_widgets.dart';
import '../widgets/general_button_widget.dart';
import '../widgets/gradient_widget.dart';
import '../widgets/toast_widgets.dart';
import 'utilities.dart';

class BrandDetailPage extends StatefulWidget {
  const BrandDetailPage({Key? key, required this.brandModel}) : super(key: key);
  final BrandModel brandModel;
  @override
  State<BrandDetailPage> createState() => _BrandDetailPageState();
}

class _BrandDetailPageState extends State<BrandDetailPage> with SingleTickerProviderStateMixin {
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
                        // BackdropFilter(
                        //   filter: ui.ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        //   child: Container(
                        //     color: backgroundColor?.withOpacity(0.2) ?? Colors.grey.withOpacity(0.5),
                        //   ),
                        // ),
                        listItemImage2(
                          context,
                          title: widget.brandModel.name,
                          img: widget.brandModel.logo,
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
                            DecoratedBox(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1), // Gölgenin rengi (hafif şeffaf)
                                    blurRadius: 8, // Gölgenin yumuşaklığı (yüksek değer daha yumuşak gölge)
                                    offset: const Offset(2, 2), // Gölgenin konumu (x, y ekseninde)
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
                            // Container(
                            //     width: deviceWidthSize(context, 50),
                            //     height: deviceHeightSize(context, 50),
                            //     decoration: BoxDecoration(
                            //       boxShadow: AppTheme.shadowList,
                            //       color: AppTheme.white,
                            //       shape: BoxShape.circle,
                            //     ),
                            //     clipBehavior: Clip.antiAlias,
                            //     child: widget.brandModel.logo != null
                            //         ? Image.network(
                            //             widget.brandModel.logo ?? "",
                            //             fit: BoxFit.contain,
                            //             width: deviceWidthSize(context, 50),
                            //             height: deviceHeightSize(context, 50),
                            //             alignment: Alignment.center,
                            //             errorBuilder: (context, error, stackTrace) => Center(
                            //               child: Text(
                            //                 widget.brandModel.name![0],
                            //                 style: AppTheme.boldTextStyle(context, 28, color: AppTheme.black),
                            //               ),
                            //             ),
                            //           )
                            //         : Center(
                            //             child: Text(
                            //               widget.brandModel.name![0],
                            //               style: AppTheme.boldTextStyle(context, 28, color: AppTheme.white),
                            //             ),
                            //           )),
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
                                    style:
                                        AppTheme.normalTextStyle(context, 14, color: AppTheme.black.withOpacity(0.7)),
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
                                    .addRemoveFavoriteBrand(widget.brandModel.id!)
                                    .then((value) {
                                  setState(() {});
                                  if (value.success == true) {
                                    ToastWidgets.successToast(context, "İşlem Başarılı!");
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
                                      HiveHelpers.getUserFromHive().favoriteBrands.contains(widget.brandModel.id)
                                          ? Icons.favorite_rounded
                                          : Icons.favorite_border_rounded,
                                      color: AppTheme.primaryColor,
                                      size: deviceFontSize(context, 24),
                                    ),
                                    // Text(
                                    //   widget.brandModel.favoriteCount.toString(),
                                    //   style: AppTheme.normalTextStyle(
                                    //     context,
                                    //     14,
                                    //   ),
                                    // ),
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
                          child: Text(
                            "Bilgilendirmeler",
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
                                  "Yaptığın alışverişlerde %${(widget.brandModel.donationRate ?? 0.12)} oranında bağış yapma imkanı!",
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
                                  "Bağış ödemesi için ortalama zaman: 75 gün",
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
                                style: ButtonStyle(padding: WidgetStatePropertyAll(EdgeInsets.zero)),
                                child: Text(
                                  "Genel Bonus Koşulları",
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
                        // Align(
                        //   alignment: Alignment.centerLeft,
                        //   child: Text(
                        //     (widget.brandModel.detailText ?? "") +
                        //         " " +
                        //         (widget.brandModel.detailText ?? "") +
                        //         " " +
                        //         (widget.brandModel.detailText ?? ""),
                        //     style: AppTheme.normalTextStyle(context, 14, color: AppTheme.black.withOpacity(0.7)),
                        //   ),
                        // ),
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
                                tagItem(context, color: AppTheme.blue, text: "Deprem Bölgesi"),
                              if (widget.brandModel.isSocialEnterprise == true)
                                tagItem(context, color: AppTheme.green, text: "Sosyal Girişim"),
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
                          builder: (context) => DialogWidgets().rowCircularButtonDialogWidget(
                            context,
                            onAcceptButtonPressed: () async {
                              if (HiveHelpers.getUserFromHive().phone == null) {
                                ScaffoldMessenger.of(context)
                                    .showSnackBar(SnackBar(content: Text("Sistemde kayıtlı cep telefonu bulunamadı!")));
                                return;
                              }
                              // htpss://ad.reklm.com/aff_c?offer_id={OFFER_ID}&aff_id=35329&aff_sub={AFF_SUB_ID}&aff_sub2={uniquedeger}
                              print(
                                  "TRACKİNG LİNK\n${widget.brandModel.link}&aff_sub=${widget.brandModel.id}&aff_sub2=${HiveHelpers.getUserFromHive().phone}");
                              UrlLauncherHelper()
                                  .launch(
                                      "${widget.brandModel.link}&aff_sub=${widget.brandModel.id}&aff_sub2=${HiveHelpers.getUserFromHive().phone}")
                                  .whenComplete(
                                    () => Navigator.pop(context),
                                  );
                            },
                            title: "Bilgilendirme",
                            buttonText: "Yönlendir",
                            content:
                                "Şu an beta yayınındayız. Yapılan alışverişler bağışlarım menüsünde görünmeyebilir. Bu süre zarfında bizi sosyal medya hesaplarımızdan takip edebilirsiniz."
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
                const Text(
                  "Sonraki alışverişinden bağış kazanacağından emin olman için bilmen gerekenler",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16.0),
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSection(context, "Adblock ve diğer tarayıcı eklentilerini devre dışı bırakın",
                            "Adblock gibi reklam önleyici programlar ve tarayıcı eklentileri çerezlerinizi kullanır ve/veya siler. Bu durumda Hangel üzerinden mağaza geçerek alışverişinizi tamamlasanız bile çerezleriniz takip edilemediğinden mağaza bağışlarınızı yansıtmayacaktır."),
                        _buildSection(
                            context,
                            "İnternet tarayıcınızın çerezlere izin verecek şekilde etkinleştirildiğinden emin olun",
                            "Mağazalar, Hangel üzerinden yaptığınız satın alma işlemini tanımlamak için çerezleri kullanır. Tanımlaması yapıldıktan sonra bağış hesabınıza eklenir. Platformumuz üzerinden mağazaya gitmeden önce lütfen tarayıcınızın çerezlere izin verdiğinden emin olun."),
                        _buildSection(
                            context,
                            "Herhangi bir tarayıcıda özel veya gizli bir pencere ile alışverişinizi tamamlamayın",
                            "Çerezlerinizin takibi gizli sekmede yapılamadığından, Hangel üzerinden gerçekleştirilen tıklama bilgileri mağazaya iletilemez. Bu nedenle bağışınız yansımayacaktır. Tıklama bilgisi bulunmadığından bağışınızın manuel eklenmesi de mümkün olmayacaktır."),
                        _buildSection(context, "Diğer para iadesi/bağış programları kullanmayın",
                            "Hangel gibi diğer para iadesi/bağış/ödül/puan programları kullanıldığında aynı şekilde çerez takibi yapıldığı için mağazalar bağışlarınızı yansıtmamaktadır. Bu nedenle, alışverişinizi tamamlarken yalnızca Hangel’in açık olmasını tavsiye ediyoruz."),
                        _buildSection(context, "Yalnızca Hangel'de bulunan kupon kodlarını kullanın",
                            "Hangel platformunda listelenmeyen bir kupon kodu kullandıysanız (mağazanın kupon kodları, kupon kodu sitelerinden alınan kod gibi), bağışınız genelde mağaza tarafından yansıtılmamaktadır. Mağazalar kendi koşullarını belirlemekte olduğu için sitemizde belirtilmeyen kupon kodları kullanıldığında bağış tanımı yapılmamaktadır."),
                        _buildSection(
                            context,
                            "Fiyat karşılaştırma veya kupon kodu sitelerini Hangel üzerinden alışverişiniz öncesinde ziyaret etmeyin",
                            "Fiyat karşılaştırma ve kupon kodu siteleri, Hangel gibi mağazalardan satış komisyonu almaktadır. Bu işlem, yine Hangel gibi çerezlerinizin takibi ile sağlanmaktadır. Hangel ile alışverişinizi tamamlamadan önce bu siteleri ziyaret ettiğiniz takdirde çerezleriniz silinir/üzerine yazılır."),
                        _buildSection(
                            context,
                            "Mağazanın mobil uygulamasını (AliExpress ve/veya birkaç mağaza hariç) kullanmayın",
                            "Bir mobil cihaz üzerinden alışveriş yapıyorsanız, yalnızca web mağazalarının / rezervasyon hizmetinin tarayıcı sürümlerini kullanın. Satın alma/rezervasyon işlemlerinizi gerçekleştirmek için mağazanın mobil uygulamasını kullandığınız takdirde birkaç mağaza haricinde bağış verilmemektedir."),
                        _buildSection(context, "Alışveriş sepetinize yalnızca Hangel'e tıkladıktan sonra ürün ekleyin",
                            "Bazı mağazalar, alışverişinizi tamamlayarak Hangel’den bağış kazanmanızın koşulu olarak alışveriş sepetinizin boş olmasını istemektedirler."),
                        _buildSection(context, "Bağış yansımama problemini sık yaşıyorsanız çerezlerinizi temizleyin",
                            "Bağış yansımama problemini sık yaşıyorsanız çerezlerinizi temizlemenizi tavsiye ediyoruz."),
                        _buildSection(context, "Hangel üzerinden mağazaya tıklamadan alışverişinizi tamamlamayın",
                            "Hangel'e tıklamadan önce mağazayı ziyaret ettiyseniz, mağaza ilk önce doğrudan çerez takibini yapamadığından Hangel bağışlarınızı yansıtmayacaktır."),
                        _buildSection(
                            context,
                            "Hangel ile ortak olan mağazaların reklamını yapan siteleri ziyaret etmekten kaçının",
                            "Satın alma işleminiz sırasında reklam afişleri veya linkleri olan başka sekmeleriniz varsa, bağışınız yansımayacaktır."),
                        _buildSection(context, "Telefonla sipariş vermeyin",
                            "Telefonla sipariş/rezervasyonlarda hiçbir mağaza bağış vermemektedir."),
                        _buildSection(
                            context,
                            "Başka bir ülkenin mağaza sayfasından sipariş vermeyin (örn. AliExpress Rusya)",
                            "Sadece Hangel platformunun linkleri üzerinden yapılan alışverişler için bağış kazanabilirsiniz."),
                        _buildSection(context, "Alışverişinizi tamamlamadan önce mağazanın özel koşullarına göz atın",
                            "Bazı ürünler veya satıcılar da bağış programına dahil edilmeyebilir."),
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
                    child: const Text("Tamam"),
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
            // SizedBox(
            //   height: deviceHeightSize(context, 8),
            // ),
            // Text(
            //   (title ?? "").removeBrackets(),
            //   textAlign: TextAlign.center,
            //   style: AppTheme.boldTextStyle(context, 20, color: AppTheme.white),
            // ),
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
        "value": widget.brandModel.favoriteCount,
      },
      {
        "title": "İşlem Sayısı",
        "value": "0",
      },
    ];
    List<Map<String, dynamic>> categories = [
      {
        "title": "Kategoriler",
        "value": widget.brandModel.categories?.map(
          (e) => e.name,
        )
      },
      {"title": "Bağış Oranı", "value": widget.brandModel.donationRate.toString() + "%"},
      {"title": "Deprem Bölgesi mi?", "value": (widget.brandModel.inEarthquakeZone ?? false) ? "Evet" : "Hayır"},
      // {
      //   "title":"Sosyal Şirket mi?",
      //   "value": (widget.brandModel.isSocialEnterprise??false)?"Evet":"Hayır"
      // },
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
            // border: Border.all(
            //   color: AppTheme.primaryColor,
            //   width: 2,
            // ),
          ),
          labelPadding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 10),
          ),
          dividerColor: Colors.transparent,
          overlayColor: WidgetStateProperty.all(Colors.transparent),
          tabs: const [
            Tab(
              child: Text(
                "Bilgiler",
              ),
            ),
            Tab(
              child: Text(
                "İstatistikler",
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
