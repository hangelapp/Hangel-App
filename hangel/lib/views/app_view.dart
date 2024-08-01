import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/providers/app_view_provider.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/views/donation_history_page.dart';
import 'package:hangel/views/home_page.dart';
import 'package:hangel/views/settings_page.dart';
import 'package:hangel/views/splash_page.dart';
import 'package:hangel/views/support_page.dart';
import 'package:hangel/widgets/dialog_widgets.dart';
import 'package:hangel/widgets/menu_item_widget.dart';
import 'package:provider/provider.dart';

import '../widgets/bottom_sheet_widget.dart';
import '../widgets/support_form.dart';

class AppView extends StatefulWidget {
  const AppView({Key? key}) : super(key: key);
  static const routeName = '/app';
  @override
  State<AppView> createState() => _AppViewState();
}

final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();

class _AppViewState extends State<AppView> {
  List<Widget> widgetOptions = <Widget>[];
  Widget selectedWidget = const HomePage();
  @override
  Widget build(BuildContext context) {
    widgetOptions = context.watch<AppViewProvider>().widgetOptions;
    selectedWidget = context.watch<AppViewProvider>().selectedWidget;
    return Scaffold(
      key: scaffoldKey,
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: AppTheme.secondaryColor.withOpacity(0.5),
        selectedLabelStyle: AppTheme.normalTextStyle(context, 14),
        unselectedLabelStyle: AppTheme.lightTextStyle(context, 13,
            color: AppTheme.secondaryColor.withOpacity(0.5)),
        showUnselectedLabels: true,
        selectedIconTheme: IconThemeData(
          size: deviceFontSize(context, 28),
        ),
        unselectedIconTheme: IconThemeData(
          size: deviceFontSize(context, 24),
        ),
        currentIndex: !widgetOptions.contains(selectedWidget)
            ? 0
            : widgetOptions.indexOf(selectedWidget),
        onTap: (index) {
          context.read<AppViewProvider>().selectedWidget =
              widgetOptions.elementAt(index);
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_rounded),
            label: "Anasayfa",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_bag_rounded),
            label: "Markalar",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.favorite_rounded),
            label: "Favoriler",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.volunteer_activism_rounded),
            label: "STK'lar",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_rounded),
            label: "Profilim",
          ),
        ],
      ),
      drawer: drawerWidget(context),
      body: selectedWidget,
    );
  }

  Drawer drawerWidget(BuildContext context) {
    return Drawer(
      width: deviceWidth(context) * 0.7,
      backgroundColor: AppTheme.white,
      child: SizedBox(
        height: deviceHeight(context),
        child: Column(
          children: [
            Container(
              width: deviceWidth(context),
              height: deviceHeightSize(context, 200),
              padding: EdgeInsets.only(
                top: deviceTopPadding(context),
                left: deviceWidthSize(context, 30),
              ),
              alignment: Alignment.centerLeft,
              decoration: const BoxDecoration(
                color: AppTheme.primaryColor,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Merhaba,",
                    style: AppTheme.lightTextStyle(context, 32,
                        color: AppTheme.white),
                  ),
                  Text(
                    (HiveHelpers.getUserFromHive().name ?? "").split(" ").last,
                    style: AppTheme.boldTextStyle(context, 32,
                        color: AppTheme.white),
                  ),
                ],
              ),
            ),
            const Spacer(),
            MenuItemWidget(
              title: "Profilim",
              icon: Icon(
                Icons.person_rounded,
                color: AppTheme.primaryColor,
                size: deviceFontSize(context, 24),
              ),
              iconColor: AppTheme.primaryColor,
              onTap: () {
                context.read<AppViewProvider>().selectedWidget =
                    widgetOptions.elementAt(4);
                Navigator.pop(context);
              },
            ),
            SizedBox(
              height: deviceHeightSize(context, 6),
            ),
            MenuItemWidget(
              title: "Bağışlarım",
              icon: Icon(
                Icons.history_rounded,
                color: AppTheme.primaryColor,
                size: deviceFontSize(context, 24),
              ),
              iconColor: AppTheme.primaryColor,
              onTap: () {
                Navigator.pushNamed(context, DonationHistoryPage.routeName);
              },
            ),
            SizedBox(
              height: deviceHeightSize(context, 6),
            ),
            MenuItemWidget(
              title: "Stk'lar",
              icon: Icon(
                Icons.volunteer_activism_rounded,
                color: AppTheme.primaryColor,
                size: deviceFontSize(context, 24),
              ),
              iconColor: AppTheme.primaryColor,
              onTap: () {
                context.read<AppViewProvider>().selectedWidget =
                    widgetOptions.elementAt(3);
                Navigator.pop(context);
              },
            ),
            SizedBox(
              height: deviceHeightSize(context, 6),
            ),
            MenuItemWidget(
              title: "Markalar",
              icon: Icon(
                Icons.shopping_bag_rounded,
                color: AppTheme.primaryColor,
                size: deviceFontSize(context, 24),
              ),
              iconColor: AppTheme.primaryColor,
              onTap: () {
                context.read<AppViewProvider>().selectedWidget =
                    widgetOptions.elementAt(1);
                Navigator.pop(context);
              },
            ),
            SizedBox(
              height: deviceHeightSize(context, 6),
            ),
            MenuItemWidget(
              title: "Sosyal Şirketler",
              icon: Icon(
                Icons.business_rounded,
                color: AppTheme.primaryColor,
                size: deviceFontSize(context, 24),
              ),
              iconColor: AppTheme.primaryColor,
              onTap: () {
                context.read<BrandProvider>().filterText = "socialEnterprise";
                context.read<AppViewProvider>().selectedWidget =
                    widgetOptions.elementAt(1);
                Navigator.pop(context);
              },
            ),
            SizedBox(
              height: deviceHeightSize(context, 6),
            ),
            MenuItemWidget(
              title: "Ayarlar",
              iconColor: AppTheme.primaryColor,
              onTap: () {
                Navigator.pushNamed(context, SettingsPage.routeName);
              },
              icon: Icon(
                Icons.settings_rounded,
                color: AppTheme.primaryColor,
                size: deviceFontSize(context, 24),
              ),
            ),
            SizedBox(
              height: deviceHeightSize(context, 6),
            ),
            MenuItemWidget(
              title: "İletişim",
              icon: Icon(
                Icons.phone_rounded,
                color: AppTheme.primaryColor,
                size: deviceFontSize(context, 24),
              ),
              iconColor: AppTheme.primaryColor,
              onTap: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(20),
                      topRight: Radius.circular(20),
                    ),
                  ),
                  builder: (context) => const BottomSheetWidget(
                      isMinPadding: true,
                      title: "İletişime Geç",
                      child: SupportForm()),
                );
                // Navigator.pushNamed(context, SupportPage.routeName);
              },
            ),
            const Spacer(),
            SizedBox(
              height: deviceHeightSize(context, 6),
            ),
            //app version
            Text(
              "v1.0.0 (Beta)",
              style: AppTheme.lightTextStyle(context, 14),
            ),
            MenuItemWidget(
              title: "Çıkış Yap",
              icon: Icon(
                Icons.logout_rounded,
                color: AppTheme.red,
                size: deviceFontSize(context, 24),
              ),
              iconColor: AppTheme.red,
              titleColor: AppTheme.red,
              onTap: () {
                showDialog(
                  context: context,
                  builder: (context) =>
                      DialogWidgets().rowCircularButtonDialogWidget(
                    context,
                    title: "Çıkış Yap",
                    buttonText: "Çıkış Yap",
                    cancelButtonText: "Vazgeç",
                    content:
                        "Alışverişlerin ile sosyal faydaya ortak olmaya devam etmeye devam etmen için çıkış yapmaman gerekiyor.",
                    color: AppTheme.red,
                    onAcceptButtonPressed: () {
                      HiveHelpers.logout();
                      context
                          .read<LoginRegisterPageProvider>()
                          .setPhoneLoginPageType(PhoneLoginPageType.login);
                      Navigator.pushNamedAndRemoveUntil(
                          context, SplashPage.routeName, (route) => false);
                    },
                  ),
                );
              },
            ),
            SizedBox(
              height: deviceHeightSize(context, 40),
            ),
          ],
        ),
      ),
    );
  }
}
