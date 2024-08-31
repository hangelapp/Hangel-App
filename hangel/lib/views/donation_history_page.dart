import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/donation_model.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/providers/donation_provider.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/circle_logo_widget.dart';
import 'package:provider/provider.dart';

import 'utilities.dart';

class DonationHistoryPage extends StatefulWidget {
  const DonationHistoryPage({Key? key}) : super(key: key);
  static const routeName = '/donation-history-page';
  @override
  State<DonationHistoryPage> createState() => _DonationHistoryPageState();
}

class _DonationHistoryPageState extends State<DonationHistoryPage> {
  String totalDonationAmount = "27,22";
  UserModel user = HiveHelpers.getUserFromHive();
  @override
  void initState() {
    super.initState();
    context.read<DonationProvider>().getDonations();
  }

  @override
  Widget build(BuildContext context) {
    var donations = context.watch<DonationProvider>().donations;
    // totalDonationAmount = donationHistory
    //     .map((e) => e.donationAmount == -1 ? 0.0 : (e.donationAmount ?? 0))
    //     .reduce((value, element) => value + element);
    Size size = MediaQuery.sizeOf(context);
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
                buildDonationCount,
                buildDonationFilter(size),
                const SizedBox(height: 20),
                ...List.generate(
                  donations.length,
                  (i) => Stack(
                    children: [
                      ListTile(
                        tileColor: AppTheme.white,
                        leading: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                              (donations[i].shoppingDate?.day ?? "").toString(),
                              style: const TextStyle(
                                fontSize: 12, // Yazı boyutunu ayarlayın
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            Text(
                              "${getTurkishMonth(donations[i].shoppingDate?.month)} ${donations[i].shoppingDate?.year ?? ""}",
                              style: const TextStyle(
                                fontSize: 10, // Yazı boyutunu ayarlayın
                                fontWeight: FontWeight.w400, // Gerekirse ağırlığı ayarlayın
                              ),
                            ),
                            Text(
                              "${(donations[i].shoppingDate?.hour ?? "").toString().padLeft(2, '0')}:${(donations[i].shoppingDate?.minute ?? "").toString().padLeft(2, '0')}",
                              style: const TextStyle(
                                fontSize: 10, // Yazı boyutunu ayarlayın
                                fontWeight: FontWeight.w300,
                              ),
                            ),
                          ],
                        ),
                        title: Row(
                          children: [
                            CircleLogoWidget(
                              logoUrl: donations[i].brandId ?? "",
                              logoName: donations[i].brandId?[0] ?? "",
                            ),
                            const SizedBox(
                              width: 3,
                            ),
                            Flexible(child: Text(donations[i].brandId ?? "-")),
                          ],
                        ),
                        subtitle: Row(
                          children: [
                            CircleLogoWidget(
                              logoUrl: donations[i].stkId1 ?? "",
                              logoName: donations[i].stkId1?[0] ?? "",
                            ),
                            const SizedBox(
                              width: 3,
                            ),
                            Flexible(child: Text(donations[i].stkId1 ?? "-")),
                          ],
                        ),
                        trailing: SizedBox(
                          width: size.width * 0.30,
                          child: Row(
                            children: [
                              Column(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        "Tutar: ",
                                        style: AppTheme.boldTextStyle(context, 14),
                                      ),
                                      Text(
                                        "${(donations[i].saleAmount ?? "-").toString()} TL",
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      Text(
                                        "Durum: ",
                                        style: AppTheme.boldTextStyle(context, 14),
                                      ),
                                      Text(("İnceleniyor").toString()),
                                    ],
                                  ),
                                ],
                              ),
                              const Spacer(),
                              const Icon(Icons.keyboard_arrow_right)
                            ],
                          ),
                        ),
                        onTap: () {},
                      ),
                      const Divider(
                        height: 1,
                        color: Color.fromARGB(45, 158, 158, 158),
                      ),

                      // Container(
                      //   decoration: BoxDecoration(
                      //     color: AppTheme.white,
                      //     boxShadow: [
                      //       BoxShadow(
                      //         color: AppTheme.secondaryColor.withOpacity(0.1),
                      //         blurRadius: 44,
                      //         offset: const Offset(0, 5),
                      //       ),
                      //     ],
                      //   ),
                      //   margin: EdgeInsets.symmetric(
                      //     // horizontal: deviceWidthSize(context, 20),
                      //     vertical: deviceHeightSize(context, 8),
                      //   ),
                      //   padding: EdgeInsets.symmetric(
                      //     horizontal: deviceWidthSize(context, 20),
                      //     vertical: deviceHeightSize(context, 10),
                      //   ),
                      //   child: Column(
                      //     children: [
                      //       SizedBox(
                      //         height: deviceHeightSize(context, 10),
                      //       ),
                      //       Row(
                      //         mainAxisAlignment: MainAxisAlignment.start,
                      //         crossAxisAlignment: CrossAxisAlignment.start,
                      //         children: [

                      //           Expanded(
                      //             child: Column(
                      //               children: [
                      //                 Container(
                      //                   width: deviceWidthSize(context, 50),
                      //                   height: deviceWidthSize(context, 50),
                      //                   decoration: BoxDecoration(
                      //                     color: AppTheme.primaryColor,
                      //                     borderRadius: BorderRadius.circular(10),
                      //                     image: DecorationImage(
                      //                       image: AssetImage(
                      //                         donationHistory[index].brandLogo ?? "",
                      //                       ),
                      //                       fit: BoxFit.cover,
                      //                     ),
                      //                   ),
                      //                 ),
                      //                 SizedBox(
                      //                   height: deviceHeightSize(context, 6),
                      //                 ),
                      //                 Text(
                      //                   donationHistory[index].brandName ?? "",
                      //                   textAlign: TextAlign.center,
                      //                   style: AppTheme.semiBoldTextStyle(context, 16),
                      //                 ),
                      //               ],
                      //             ),
                      //           ),
                      //           SizedBox(
                      //             width: deviceWidthSize(context, 4),
                      //           ),
                      //           Padding(
                      //             padding: EdgeInsets.only(top: deviceHeightSize(context, 18)),
                      //             child: Icon(
                      //               Icons.switch_left_rounded,
                      //               color: AppTheme.primaryColor,
                      //               size: deviceFontSize(context, 24),
                      //             ),
                      //           ),
                      //           SizedBox(
                      //             width: deviceWidthSize(context, 4),
                      //           ),
                      //           Expanded(
                      //             child: Column(
                      //               children: [
                      //                 Container(
                      //                   width: deviceWidthSize(context, 50),
                      //                   height: deviceWidthSize(context, 50),
                      //                   decoration: BoxDecoration(
                      //                     color: AppTheme.primaryColor,
                      //                     borderRadius: BorderRadius.circular(10),
                      //                     image: DecorationImage(
                      //                       image: AssetImage(
                      //                         donationHistory[index].stkLogo ?? "",
                      //                       ),
                      //                       fit: BoxFit.cover,
                      //                     ),
                      //                   ),
                      //                 ),
                      //                 SizedBox(
                      //                   height: deviceHeightSize(context, 6),
                      //                 ),
                      //                 Text(
                      //                   donationHistory[index].stkName ?? "",
                      //                   textAlign: TextAlign.center,
                      //                   style: AppTheme.semiBoldTextStyle(context, 16),
                      //                 ),
                      //               ],
                      //             ),
                      //           ),
                      //         ],
                      //       ),
                      //       SizedBox(
                      //         height: deviceHeightSize(context, 10),
                      //       ),
                      //       Text(
                      //         (donationHistory[index].donationAmount ?? 0).toStringAsFixed(2) == "-1.00"
                      //             ? "Hesaplanıyor..."
                      //             : (donationHistory[index].donationAmount ?? 0).toStringAsFixed(2) + " TL",
                      //         textAlign: TextAlign.center,
                      //         style: AppTheme.semiBoldTextStyle(context, 24),
                      //       ),
                      //       SizedBox(
                      //         height: deviceHeightSize(context, 4),
                      //       ),
                      //       RichText(
                      //         text: TextSpan(
                      //           children: [
                      //             TextSpan(
                      //               text: "Sepet Tutarı: ",
                      //               style: AppTheme.semiBoldTextStyle(context, 16, color: AppTheme.darkGreen),
                      //             ),
                      //             TextSpan(
                      //               text: (donationHistory[index].cardAmount ?? 0).toStringAsFixed(2) == "-1.00"
                      //                   ? "Hesaplanıyor..."
                      //                   : (donationHistory[index].cardAmount ?? 0).toStringAsFixed(2) + " TL",
                      //               style: AppTheme.lightTextStyle(context, 16, color: AppTheme.darkGreen),
                      //             ),
                      //           ],
                      //         ),
                      //       ),
                      //     ],
                      //   ),
                      // ),
                      // Positioned(
                      //   top: deviceHeightSize(context, 0),
                      //   right: deviceWidthSize(context, 30),
                      //   child: Container(
                      //       height: deviceWidthSize(context, 20),
                      //       decoration: BoxDecoration(
                      //         color: AppTheme.yellow,
                      //         borderRadius: BorderRadius.circular(5),
                      //       ),
                      //       child: Padding(
                      //         padding: EdgeInsets.symmetric(
                      //           horizontal: deviceWidthSize(context, 10),
                      //         ),
                      //         child: Center(
                      //           child: Text(
                      //             DateFormatHelper.getDate(donationHistory[index].shoppingDate.toString(), context),
                      //             style: AppTheme.normalTextStyle(
                      //               context,
                      //               14,
                      //               color: AppTheme.white,
                      //             ),
                      //           ),
                      //         ),
                      //       )),
                      // ),
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

  Widget get buildDonationCount => Container(
        decoration: const BoxDecoration(
          color: AppTheme.primaryColor,
        ),
        margin: EdgeInsets.symmetric(
          // horizontal: deviceWidthSize(context, 20),
          vertical: deviceHeightSize(context, 10),
        ),
        padding: EdgeInsets.symmetric(
          horizontal: deviceWidthSize(context, 20),
          vertical: deviceHeightSize(context, 10),
        ),
        width: double.infinity,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name ?? user.phone ?? "-",
                  style: AppTheme.semiBoldTextStyle(context, 15, color: Colors.white),
                ),
                Text(
                  "$totalDonationAmount TL",
                  style: AppTheme.semiBoldTextStyle(context, 15, color: Colors.white),
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  // "${totalDonationAmount.toStringAsFixed(2)} TL",
                  "Gerçekleşen Bağış",
                  style: AppTheme.lightTextStyle(context, 14, color: Colors.white),
                ),
                Text(
                  "$totalDonationAmount TL",
                  style: AppTheme.lightTextStyle(context, 14, color: Colors.white),
                ),
              ],
            ),
          ],
        ),
      );

  Widget buildDonationFilter(Size size) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Container(
            padding: EdgeInsets.zero,
            decoration:
                BoxDecoration(borderRadius: BorderRadius.circular(5), border: Border.all(color: AppTheme.primaryColor)),
            width: deviceHeightSize(context, 200),
            height: size.height * 0.05,
            child: DropdownButton(
              value: "hepsi",
              padding: EdgeInsets.zero,
              style: AppTheme.normalTextStyle(context, 13),
              isExpanded: true,
              underline: const SizedBox.shrink(),
              icon: Card(
                  color: AppTheme.primaryColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                  child: const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: AppTheme.white,
                  )),
              items: [
                DropdownMenuItem(
                  value: "hepsi",
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text(
                      "Hepsi",
                      style: AppTheme.normalTextStyle(context, 13),
                    ),
                  ),
                ),
                DropdownMenuItem(
                  value: "inceleniyor",
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text(
                      "İnceleniyor",
                      style: AppTheme.normalTextStyle(context, 13),
                    ),
                  ),
                ),
                DropdownMenuItem(
                  value: "onaylandı",
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text(
                      "Onaylandı",
                      style: AppTheme.normalTextStyle(context, 13),
                    ),
                  ),
                ),
              ],
              onChanged: (value) {},
            ),
          ),
          Container(
            padding: EdgeInsets.zero,
            decoration:
                BoxDecoration(borderRadius: BorderRadius.circular(5), border: Border.all(color: AppTheme.primaryColor)),
            width: deviceHeightSize(context, 200),
            height: size.height * 0.05,
            child: DropdownButton(
              value: "son-1-ay",
              padding: EdgeInsets.zero,
              style: AppTheme.normalTextStyle(context, 13),
              isExpanded: true,
              underline: const SizedBox.shrink(),
              icon: Card(
                  color: AppTheme.primaryColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                  child: const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: AppTheme.white,
                  )),
              items: [
                DropdownMenuItem(
                  value: "son-1-ay",
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text(
                      "Son 1 ay",
                      style: AppTheme.normalTextStyle(context, 13),
                    ),
                  ),
                ),
                DropdownMenuItem(
                  value: "son-1-hafta",
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text(
                      "Son 1 hafta",
                      style: AppTheme.normalTextStyle(context, 13),
                    ),
                  ),
                ),
                DropdownMenuItem(
                  value: "son-1-sene",
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text(
                      "Son 1 sene",
                      style: AppTheme.normalTextStyle(context, 13),
                    ),
                  ),
                ),
              ],
              onChanged: (value) {},
            ),
          )
        ],
      );
}
