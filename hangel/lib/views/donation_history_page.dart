import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/date_format_helper.dart';
import 'package:hangel/models/donation_model.dart';
import 'package:hangel/widgets/app_bar_widget.dart';

class DonationHistoryPage extends StatefulWidget {
  const DonationHistoryPage({Key? key}) : super(key: key);
  static const routeName = '/donation-history-page';
  @override
  State<DonationHistoryPage> createState() => _DonationHistoryPageState();
}

class _DonationHistoryPageState extends State<DonationHistoryPage> {
  double totalDonationAmount = 0;
  List<DonationModel> donationHistory = [
    DonationModel(
      brandLogo: "assets/images/brand_logo.png",
      brandName: "Güzel Otomotiv",
      donationAmount: 100,
      stkLogo: "assets/images/brand_logo.png",
      stkName: "Türk Kızılayı",
      shoppingDate: DateTime.now(),
      cardAmount: 10000,
    ),
    DonationModel(
      brandLogo: "assets/images/brand_logo.png",
      brandName: "Sağlam İnşaat",
      donationAmount: 80,
      stkLogo: "assets/images/brand_logo.png",
      stkName: "Güvercin Severler Derneği",
      shoppingDate: DateTime.now().subtract(const Duration(days: 15)),
      cardAmount: 8700,
    ),
  ];
  @override
  Widget build(BuildContext context) {
    totalDonationAmount = donationHistory
        .map((e) => e.donationAmount ?? 0)
        .reduce((value, element) => value + element);
    return Scaffold(
      body: Column(
        children: [
          const AppBarWidget(
            title: "Bağışlarım",
          ),
          Expanded(
            child: SingleChildScrollView(
                child: Column(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.green2.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  margin: EdgeInsets.symmetric(
                    horizontal: deviceWidthSize(context, 20),
                    vertical: deviceHeightSize(context, 10),
                  ),
                  padding: EdgeInsets.symmetric(
                    horizontal: deviceWidthSize(context, 20),
                    vertical: deviceHeightSize(context, 10),
                  ),
                  width: double.infinity,
                  child: Column(
                    children: [
                      Text(
                        "Toplam Bağış Tutarı",
                        style: AppTheme.semiBoldTextStyle(context, 16),
                      ),
                      SizedBox(
                        height: deviceHeightSize(context, 4),
                      ),
                      Text(
                        "${totalDonationAmount.toStringAsFixed(2)} TL",
                        style: AppTheme.boldTextStyle(context, 32,
                            color: AppTheme.primaryColor),
                      ),
                    ],
                  ),
                ),
                ...List.generate(
                  donationHistory.length,
                  (index) => Stack(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: AppTheme.white,
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.secondaryColor.withOpacity(0.1),
                              blurRadius: 44,
                              offset: const Offset(0, 5),
                            ),
                          ],
                          borderRadius: BorderRadius.circular(10),
                        ),
                        margin: EdgeInsets.symmetric(
                          horizontal: deviceWidthSize(context, 20),
                          vertical: deviceHeightSize(context, 8),
                        ),
                        padding: EdgeInsets.symmetric(
                          horizontal: deviceWidthSize(context, 20),
                          vertical: deviceHeightSize(context, 10),
                        ),
                        child: Column(
                          children: [
                            SizedBox(
                              height: deviceHeightSize(context, 10),
                            ),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    children: [
                                      Container(
                                        width: deviceWidthSize(context, 50),
                                        height: deviceWidthSize(context, 50),
                                        decoration: BoxDecoration(
                                          color: AppTheme.primaryColor,
                                          borderRadius:
                                              BorderRadius.circular(10),
                                          image: DecorationImage(
                                            image: AssetImage(
                                              donationHistory[index]
                                                      .brandLogo ??
                                                  "",
                                            ),
                                            fit: BoxFit.cover,
                                          ),
                                        ),
                                      ),
                                      SizedBox(
                                        height: deviceHeightSize(context, 6),
                                      ),
                                      Text(
                                        donationHistory[index].brandName ?? "",
                                        textAlign: TextAlign.center,
                                        style: AppTheme.semiBoldTextStyle(
                                            context, 16),
                                      ),
                                    ],
                                  ),
                                ),
                                SizedBox(
                                  width: deviceWidthSize(context, 4),
                                ),
                                Padding(
                                  padding: EdgeInsets.only(
                                      top: deviceHeightSize(context, 18)),
                                  child: Icon(
                                    Icons.switch_left_rounded,
                                    color: AppTheme.primaryColor,
                                    size: deviceFontSize(context, 24),
                                  ),
                                ),
                                SizedBox(
                                  width: deviceWidthSize(context, 4),
                                ),
                                Expanded(
                                  child: Column(
                                    children: [
                                      Container(
                                        width: deviceWidthSize(context, 50),
                                        height: deviceWidthSize(context, 50),
                                        decoration: BoxDecoration(
                                          color: AppTheme.primaryColor,
                                          borderRadius:
                                              BorderRadius.circular(10),
                                          image: DecorationImage(
                                            image: AssetImage(
                                              donationHistory[index].stkLogo ??
                                                  "",
                                            ),
                                            fit: BoxFit.cover,
                                          ),
                                        ),
                                      ),
                                      SizedBox(
                                        height: deviceHeightSize(context, 6),
                                      ),
                                      Text(
                                        donationHistory[index].stkName ?? "",
                                        textAlign: TextAlign.center,
                                        style: AppTheme.semiBoldTextStyle(
                                            context, 16),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(
                              height: deviceHeightSize(context, 10),
                            ),
                            Text(
                              "${(donationHistory[index].donationAmount ?? 0).toStringAsFixed(2)} TL",
                              textAlign: TextAlign.center,
                              style: AppTheme.semiBoldTextStyle(context, 24),
                            ),
                            SizedBox(
                              height: deviceHeightSize(context, 4),
                            ),
                            RichText(
                              text: TextSpan(
                                children: [
                                  TextSpan(
                                    text: "Sepet Tutarı: ",
                                    style: AppTheme.semiBoldTextStyle(
                                        context, 16,
                                        color: AppTheme.darkGreen),
                                  ),
                                  TextSpan(
                                    text:
                                        "${(donationHistory[index].cardAmount ?? 0).toStringAsFixed(2)} TL",
                                    style: AppTheme.lightTextStyle(context, 16,
                                        color: AppTheme.darkGreen),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Positioned(
                        top: deviceHeightSize(context, 0),
                        right: deviceWidthSize(context, 30),
                        child: Container(
                            height: deviceWidthSize(context, 20),
                            decoration: BoxDecoration(
                              color: AppTheme.yellow,
                              borderRadius: BorderRadius.circular(5),
                            ),
                            child: Padding(
                              padding: EdgeInsets.symmetric(
                                horizontal: deviceWidthSize(context, 10),
                              ),
                              child: Center(
                                child: Text(
                                  DateFormatHelper.getDate(
                                      donationHistory[index]
                                          .shoppingDate
                                          .toString(),
                                      context),
                                  style: AppTheme.normalTextStyle(
                                    context,
                                    14,
                                    color: AppTheme.white,
                                  ),
                                ),
                              ),
                            )),
                      ),
                    ],
                  ),
                ),
              ],
            )),
          ),
        ],
      ),
    );
  }
}
