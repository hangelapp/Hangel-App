import 'dart:io';

import 'package:app_tracking_transparency/app_tracking_transparency.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/providers/app_view_provider.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/views/auth/register_page.dart';
import 'package:hangel/views/donation_history_page.dart';
import 'package:hangel/views/settings_page.dart';
import 'package:hangel/views/splash_page.dart';
import 'package:hangel/widgets/dialog_widgets.dart';
import 'package:hangel/widgets/menu_item_widget.dart';
import 'package:persistent_bottom_nav_bar/persistent_bottom_nav_bar.dart';
import 'package:provider/provider.dart';

import '../widgets/bottom_sheet_widget.dart';
import '../widgets/support_form.dart';
import '../widgets/locale_text.dart'; // LocaleText import edildi

class AppView extends StatefulWidget {
  const AppView({Key? key}) : super(key: key);
  static const routeName = '/app';
  @override
  State<AppView> createState() => _AppViewState();
}

final PersistentTabController tabcontroller = PersistentTabController(initialIndex: 0);

class _AppViewState extends State<AppView> {
  List<Widget> widgetOptions = <Widget>[];
  Widget? selectedWidget;
  bool isLoading = false;

  Future<void> initAppTracking() async {
    if (Platform.isIOS) {
      final TrackingStatus status = await AppTrackingTransparency.trackingAuthorizationStatus;

      if (status == TrackingStatus.notDetermined) {
        // await showCustomPrivacyDialog();

        await AppTrackingTransparency.requestTrackingAuthorization();
      }

      final uuid = await AppTrackingTransparency.getAdvertisingIdentifier();
      print("Reklam Tanımlayıcısı: $uuid");
    } else {
      print("İOS DEĞİL");
    }
  }

  Future<void> showCustomPrivacyDialog() async {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: LocaleText('app_view_privacy_dialog_title'), // Başlık lokalize edildi
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LocaleText(
                  'app_view_privacy_dialog_content_part1',
                  style: AppTheme.lightTextStyle(context, 14),
                ),
                SizedBox(height: deviceHeightSize(context, 10)),
              ],
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: LocaleText('app_view_privacy_dialog_button_cancel'), // "İptal"

              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: LocaleText('app_view_privacy_dialog_button_accept'), // "Devam Et"

              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  @override
  void initState() {
    super.initState();
    initAppTracking();
  }

  @override
  Widget build(BuildContext context) {
    widgetOptions = context.watch<AppViewProvider>().widgetOptions;
    selectedWidget = context.watch<AppViewProvider>().selectedWidget;
    return Scaffold(
      drawer: drawerWidget(context),
      body: PersistentTabView(
        context,
        controller: tabcontroller,
        stateManagement: false,
        screens: widgetOptions,
        padding: const EdgeInsets.symmetric(vertical: 3),
        navBarStyle: NavBarStyle.style14,
        backgroundColor: Colors.white,
        animationSettings: const NavBarAnimationSettings(
            navBarItemAnimation: ItemAnimationSettings(curve: Curves.linear, duration: Durations.long2),
            screenTransitionAnimation: ScreenTransitionAnimationSettings(
              screenTransitionAnimationType: ScreenTransitionAnimationType.slide,
              animateTabTransition: true,
              curve: Curves.ease,
              duration: Durations.medium4,
            )),
        items: [
          PersistentBottomNavBarItem(
            icon: const Icon(Icons.shopping_bag_rounded),
            activeColorPrimary: AppTheme.primaryColor,
            inactiveColorPrimary: CupertinoColors.systemGrey,
            title: 'app_view_bottom_nav_markets'.locale, // "Markalar"
          ),
          PersistentBottomNavBarItem(
            icon: const Icon(Icons.handshake_rounded),
            title: 'app_view_bottom_nav_volunteer'.locale, // "Gönüllü"
            activeColorPrimary: AppTheme.primaryColor,
            inactiveColorPrimary: CupertinoColors.systemGrey,
          ),
          PersistentBottomNavBarItem(
            icon: const Padding(
              padding: EdgeInsets.only(top: 0),
              child: Center(
                child: Icon(
                  Icons.favorite_rounded,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
            inactiveIcon: const Center(
              child: Padding(
                padding: EdgeInsets.only(top: 0),
                child: Icon(
                  Icons.favorite_outline_rounded,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
            title: 'app_view_bottom_nav_favorites'.locale, // "Favoriler"
            activeColorPrimary: AppTheme.red,
            inactiveColorPrimary: CupertinoColors.systemGrey,
          ),
          PersistentBottomNavBarItem(
            icon: const Icon(Icons.volunteer_activism_rounded),
            title: 'app_view_bottom_nav_stks'.locale, // "STK' lar"
            activeColorPrimary: AppTheme.primaryColor,
            inactiveColorPrimary: CupertinoColors.systemGrey,
          ),
          PersistentBottomNavBarItem(
            icon: const Icon(Icons.person_rounded),
            title: 'app_view_bottom_nav_profile'.locale, // "Profil"
            activeColorPrimary: AppTheme.primaryColor,
            inactiveColorPrimary: CupertinoColors.systemGrey,
          ),
        ],
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
                  LocaleText(
                    'app_view_drawer_greeting',
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
              title: 'app_view_drawer_profile'.locale, // "Profilim"
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
              title: 'app_view_drawer_donations'.locale, // "Bağışlarım"
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
              title: 'app_view_drawer_stks'.locale, // "Stk'lar"
              icon: Icon(
                Icons.volunteer_activism_rounded,
                color: AppTheme.primaryColor,
                size: deviceFontSize(context, 24),
              ),
              iconColor: AppTheme.primaryColor,
              onTap: () {
                context.read<BrandProvider>().filterText = "socialEnterprise";
                context.read<AppViewProvider>().selectedWidget = widgetOptions.elementAt(3);
                tabcontroller.jumpToTab(3);
                Navigator.pop(context);
              },
            ),
            SizedBox(
              height: deviceHeightSize(context, 6),
            ),
            MenuItemWidget(
              title: 'app_view_drawer_volunteer'.locale, // "Gönüllü"
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
              title: 'app_view_drawer_social_companies'.locale, // "Sosyal Şirketler"
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
              title: 'app_view_drawer_settings'.locale, // "Ayarlar"
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
              title: 'app_view_drawer_contact'.locale, // "İletişim"
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
                  builder: (context) => BottomSheetWidget(
                      isMinPadding: true,
                      title: 'app_view_contact_support'.locale,
                      child: SupportForm()), // "İletişime Geç"
                );
              },
            ),
            const Spacer(),
            SizedBox(
              height: deviceHeightSize(context, 6),
            ),
            LocaleText(
              'app_view_version', // "v1.0.1"
              style: AppTheme.lightTextStyle(context, 14),
            ),
            MenuItemWidget(
              title: 'app_view_drawer_logout'.locale, // "Çıkış Yap"
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
                    title: 'app_view_exit_dialog_title'.locale, // "Çıkış Yap"
                    buttonText: 'app_view_exit_dialog_button_accept'.locale, // "Çıkış Yap"
                    cancelButtonText: 'app_view_exit_dialog_button_cancel'.locale, // "Vazgeç"
                    content: 'app_view_exit_dialog_content'.locale, // "Alışverişlerin ile ..."
                    color: AppTheme.red,
                    onAcceptButtonPressed: () async {
                      await FirebaseAuth.instance.signOut();
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
            MenuItemWidget(
              title: 'app_view_drawer_delete_account'.locale, // "Hesabımı Sil"
              icon: Icon(
                Icons.delete_forever_outlined,
                color: Colors.grey,
                size: deviceFontSize(context, 24),
              ),
              iconColor: Colors.grey,
              titleColor: Colors.grey,
              onTap: () {
                showDialog(
                  context: context,
                  builder: (context) => DialogWidgets().rowCircularButtonDialogWidget(context,
                      title: 'app_view_delete_account_dialog_title'.locale, // "Hesabımı Sil"
                      buttonText: 'app_view_delete_account_dialog_button_accept'.locale, // "Hesabımı Sil"
                      cancelButtonText: 'app_view_delete_account_dialog_button_cancel'.locale, // "Vazgeç"
                      isLoading: isLoading,
                      cancelButtonColor: Colors.green,
                      content: 'app_view_delete_account_dialog_content'.locale, // "Alışverişlerin ile ..."
                      color: Colors.grey, onAcceptButtonPressed: () async {
                    setState(() {
                      isLoading = true;
                    });

                    User? user = FirebaseAuth.instance.currentUser;

                    if (user != null) {
                      try {
                        await FirebaseFirestore.instance.collection("users").doc(user.uid).delete();

                        await user.delete();
                      } on FirebaseAuthException catch (e) {
                        if (e.code == 'requires-recent-login') {
                          _showReauthenticationDialog();
                        } else {
                          print('Error deleting user: $e');
                        }
                      }
                    }

                    await FirebaseAuth.instance.signOut();
                    HiveHelpers.logout();
                    context.read<LoginRegisterPageProvider>().setPhoneLoginPageType(PhoneLoginPageType.login);

                    setState(() {
                      isLoading = false;
                    });

                    Navigator.pushNamedAndRemoveUntil(context, SplashPage.routeName, (route) => false);
                  }),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showReauthenticationDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: LocaleText('app_view_reauth_dialog_title'), // "Oturum Süresi Doldu"
        content: LocaleText('app_view_reauth_dialog_content'), // "Hesabınızı silmek için ..."
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);

              Navigator.pushNamed(context, RegisterPage.routeName);
            },
            child: LocaleText('app_view_reauth_dialog_button_ok'), // "Tamam"
          ),
        ],
      ),
    );
  }
}
