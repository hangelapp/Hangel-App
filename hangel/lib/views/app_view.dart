import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/providers/app_view_provider.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/views/donation_history_page.dart';
import 'package:hangel/views/settings_page.dart';
import 'package:hangel/views/splash_page.dart';
import 'package:hangel/views/support_page.dart';
import 'package:hangel/widgets/dialog_widgets.dart';
import 'package:hangel/widgets/menu_item_widget.dart';
import 'package:persistent_bottom_nav_bar/persistent_bottom_nav_bar.dart';
import 'package:provider/provider.dart';

import '../widgets/bottom_sheet_widget.dart';
import '../widgets/support_form.dart';

class AppView extends StatefulWidget {
  const AppView({Key? key}) : super(key: key);
  static const routeName = '/app';
  @override
  State<AppView> createState() => _AppViewState();
}

// final DrawerMenuController drawerController = DrawerMenuController();
final PersistentTabController tabcontroller = PersistentTabController(initialIndex: 0);

class _AppViewState extends State<AppView> {
  List<Widget> widgetOptions = <Widget>[];
  Widget? selectedWidget;
  @override
  Widget build(BuildContext context) {
    widgetOptions = context.watch<AppViewProvider>().widgetOptions;
    selectedWidget = context.watch<AppViewProvider>().selectedWidget;
    return Scaffold(
      // key: scaffoldKey,
      drawer: drawerWidget(context),
      body: PersistentTabView(
        context,
        controller: tabcontroller,
        stateManagement: false,
        screens: widgetOptions,
        padding: const EdgeInsets.symmetric(vertical: 8),
        navBarStyle: NavBarStyle.style15,
        animationSettings: const NavBarAnimationSettings(
            navBarItemAnimation: ItemAnimationSettings(curve: Curves.linear, duration: Durations.extralong3),
            screenTransitionAnimation: ScreenTransitionAnimationSettings(
                screenTransitionAnimationType: ScreenTransitionAnimationType.slide, animateTabTransition: true)),

        items: [
          PersistentBottomNavBarItem(
            icon: const Icon(Icons.shopping_bag_rounded),
            activeColorPrimary: AppTheme.primaryColor,
            inactiveColorPrimary: CupertinoColors.systemGrey,
            title: ("Markalar"),
          ),
          PersistentBottomNavBarItem(
            icon: const Icon(Icons.handshake_rounded),
            title: ("Gönüllü"),
            activeColorPrimary: AppTheme.primaryColor,
            inactiveColorPrimary: CupertinoColors.systemGrey,
          ),
          PersistentBottomNavBarItem(
            icon: const Padding(
              padding: EdgeInsets.only(top: 4.0),
              child: Center(
                child: Icon(
                  Icons.favorite_rounded,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
            inactiveIcon: const Center(
              child: Padding(
                padding: EdgeInsets.only(top: 4.0),
                child: Icon(
                  Icons.favorite_outline_rounded,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
            title: ("Favoriler"),
            activeColorPrimary: AppTheme.white,
            inactiveColorPrimary: CupertinoColors.systemGrey,
          ),
          PersistentBottomNavBarItem(
            icon: const Icon(Icons.volunteer_activism_rounded),
            title: ("STK' lar"),
            activeColorPrimary: AppTheme.primaryColor,
            inactiveColorPrimary: CupertinoColors.systemGrey,
          ),
          PersistentBottomNavBarItem(
            icon: const Icon(Icons.person_rounded),
            title: ("Profil"),
            activeColorPrimary: AppTheme.primaryColor,
            inactiveColorPrimary: CupertinoColors.systemGrey,
          ),
        ],

        // child: Scaffold(
        //   key: scaffoldKey,
        //   bottomNavigationBar: BottomNavigationBar(
        //     type: BottomNavigationBarType.fixed,
        //     backgroundColor: Colors.white,
        //     selectedItemColor: AppTheme.primaryColor,
        //     unselectedItemColor: AppTheme.secondaryColor.withOpacity(0.5),
        //     selectedLabelStyle: AppTheme.normalTextStyle(context, 14),
        //     unselectedLabelStyle: AppTheme.lightTextStyle(context, 13, color: AppTheme.secondaryColor.withOpacity(0.5)),
        //     showUnselectedLabels: true,
        //     selectedIconTheme: IconThemeData(
        //       size: deviceFontSize(context, 28),
        //     ),
        //     unselectedIconTheme: IconThemeData(
        //       size: deviceFontSize(context, 24),
        //     ),
        //     currentIndex: !widgetOptions.contains(selectedWidget) ? 0 : widgetOptions.indexOf(selectedWidget),
        //     onTap: (index) {
        //       context.read<AppViewProvider>().selectedWidget = widgetOptions.elementAt(index);
        //     },
        //     items: const [
        //       BottomNavigationBarItem(
        //         icon: Icon(Icons.home_rounded),
        //         label: "Anasayfa",
        //       ),
        //       BottomNavigationBarItem(
        //         icon: Icon(Icons.shopping_bag_rounded),
        //         label: "Markalar",
        //       ),
        //       BottomNavigationBarItem(
        //         icon: Icon(Icons.favorite_rounded),
        //         label: "Favoriler",
        //       ),
        //       BottomNavigationBarItem(
        //         icon: Icon(Icons.volunteer_activism_rounded),
        //         label: "STK'lar",
        //       ),
        //       BottomNavigationBarItem(
        //         icon: Icon(Icons.person_rounded),
        //         label: "Profilim",
        //       ),
        //     ],
        //   ),
        //   drawer: drawerWidget(context),
        //   floatingActionButton: FloatingActionButton(
        //     onPressed: () {},
        //     shape: const CircleBorder(),
        //     elevation: 0,
        //     backgroundColor: Colors.white,
        //     child: const Icon(
        //       Icons.favorite_border_outlined,
        //       color: AppTheme.primaryColor,
        //     ),
        //   ),
        //   floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
        //   body: selectedWidget,
        // ),
      ),
    );
  }

  Widget drawerWidget(BuildContext context) {
    return Drawer(
      width: deviceWidth(context) * 0.6,
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
                    style: AppTheme.lightTextStyle(context, 32, color: AppTheme.white),
                  ),
                  Text(
                    (HiveHelpers.getUserFromHive().name ?? "").split(" ").first,
                    style: AppTheme.boldTextStyle(context, 32, color: AppTheme.white),
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
                tabcontroller.jumpToTab(4);
                context.read<AppViewProvider>().selectedWidget = widgetOptions.elementAt(4);
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
                context.read<AppViewProvider>().selectedWidget = widgetOptions.elementAt(3);
                tabcontroller.jumpToTab(3);
                Navigator.pop(context);
              },
            ),
            SizedBox(
              height: deviceHeightSize(context, 6),
            ),
            MenuItemWidget(
              title: "Gönüllü",
              icon: Icon(
                Icons.shopping_bag_rounded,
                color: AppTheme.primaryColor,
                size: deviceFontSize(context, 24),
              ),
              iconColor: AppTheme.primaryColor,
              onTap: () {
                tabcontroller.jumpToTab(1);
                context.read<AppViewProvider>().selectedWidget = widgetOptions.elementAt(1);
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
                context.read<AppViewProvider>().selectedWidget = widgetOptions.elementAt(1);
                tabcontroller.jumpToTab(1);
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
                  builder: (context) =>
                      const BottomSheetWidget(isMinPadding: true, title: "İletişime Geç", child: SupportForm()),
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
                  builder: (context) => DialogWidgets().rowCircularButtonDialogWidget(
                    context,
                    title: "Çıkış Yap",
                    buttonText: "Çıkış Yap",
                    cancelButtonText: "Vazgeç",
                    content:
                        "Alışverişlerin ile sosyal faydaya ortak olmaya devam etmeye devam etmen için çıkış yapmaman gerekiyor.",
                    color: AppTheme.red,
                    onAcceptButtonPressed: () {
                      HiveHelpers.logout();
                      context.read<LoginRegisterPageProvider>().setPhoneLoginPageType(PhoneLoginPageType.login);
                      Navigator.pushNamedAndRemoveUntil(context, SplashPage.routeName, (route) => false);
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
