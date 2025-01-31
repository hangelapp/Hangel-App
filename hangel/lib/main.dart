import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart'; // YENİ
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:get/get.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/views/auth/auth.dart';
import 'package:hangel/views/stk_detail_page.dart';
import 'package:hangel/views/stk_panel_qr.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'constants/app_theme.dart';
import 'constants/preferences_keys.dart';
import 'firebase_options.dart';
import 'helpers/locator.dart';
import 'helpers/provider_list.dart';
import 'managers/language_manager.dart';
import 'managers/locale_manager.dart';
import 'views/about_us_page.dart';
import 'views/app_view.dart';
import 'views/auth/onboarding_page.dart';
import 'views/auth/register_page.dart';
import 'views/auth/widget_tree.dart';
import 'views/donation_history_page.dart';
import 'views/frequently_asked_questions_page.dart';
import 'views/home_page.dart';
import 'views/select_favorite_stk_page.dart';
import 'views/settings_page.dart';
import 'views/splash_page.dart';
import 'views/stk_panel.dart';
import 'views/stk_panel_support.dart';
import 'views/stk_volunteers_page.dart';
import 'views/support_page.dart';
import 'views/user_ban_page.dart';
import 'views/vounteer_form.dart';
import 'widgets/missing_donation_form_widget.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  setupLocator();

  await LocaleManager.prefrencesInit();

  final localeString = LocaleManager.instance.getStringValue(PreferencesKeys.LOCALE);
  Locale? initialLocale;

  if (localeString.isNotEmpty) {
    final localeParts = localeString.split('_');
    if (localeParts.length == 2) {
      initialLocale = Locale(localeParts[0], localeParts[1]);
    } else {
      initialLocale = Locale(localeString);
    }
  } else {
    initialLocale = Get.deviceLocale ?? const Locale('tr', 'TR');
  }

  await initializeDateFormatting(
    initialLocale.toString(),
    null,
  );

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  if (!kIsWeb) await initializeLocalNotifications();

  // Deep link için STK ID
  String? stkId = await _handleInitialDynamicLink();
  if (!kIsWeb) {
    // Uygulama çalışırken deep link gelirse dinle
    FirebaseDynamicLinks.instance.onLink.listen((PendingDynamicLinkData dynamicLinkData) async {
      final Uri deepLink = dynamicLinkData.link;
      final deepLinkStkId = _extractStkIdFromLink(deepLink.toString());
      if (deepLinkStkId != null) {
        // Bu noktada istenirse bir state management yöntemiyle (GetX, Provider, vs.)
        // uygulama içinde bu veriyi güncelleyebilirsiniz.
        // Şimdilik basitlik olsun diye print atıyoruz.
        print("Runtime deep link STK ID: $deepLinkStkId");
        if (Auth().currentUser != null) {
          await FirebaseFirestore.instance
              .collection("stklar")
              .where("id", isEqualTo: deepLinkStkId)
              .get()
              .then((value) {
            if (value.docs.isNotEmpty) {
              StkModel stkModel = StkModel.fromJson(value.docs.first.data());
              Get.to(() => STKDetailPage(stkModel: stkModel));
            }
          });
        } else {
          Get.to(() => SelectFavoriteStkPage(inTree: false, selectedSTKIds: [deepLinkStkId]));
        }
      }
    }).onError((error) {
      print('onLink error: $error');
    });
  }

  runApp(
    MultiProvider(
      providers: providers,
      child: MyApp(initialLocale: initialLocale, stkId: stkId),
    ),
  );
}

FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("Handling a background message: ${message.messageId}");
}

void _showNotification(RemoteNotification notification) async {
  var androidPlatformChannelSpecifics = const AndroidNotificationDetails(
    'default_channel', // channel id
    'General Notifications', // channel name
    importance: Importance.max,
    priority: Priority.high,
  );
  var platformChannelSpecifics = NotificationDetails(android: androidPlatformChannelSpecifics);
  await flutterLocalNotificationsPlugin.show(
    0,
    notification.title,
    notification.body,
    platformChannelSpecifics,
    payload: 'Default_Sound',
  );
}

Future<void> initializeLocalNotifications() async {
  FirebaseMessaging messaging = FirebaseMessaging.instance;

  NotificationSettings settings =
      await messaging.requestPermission(alert: true, badge: true, sound: true, provisional: false);
  print('User granted permission: ${settings.authorizationStatus}');
  if (settings.authorizationStatus == AuthorizationStatus.authorized) {
    try {
      String? apnsToken = await messaging.getAPNSToken();
      if (apnsToken != null) {
        LocaleManager.instance.setStringValue(PreferencesKeys.APN, apnsToken);
        print("APNS Token: $apnsToken");
        String? firebaseToken = await messaging.getToken();
        print("Firebase Token: $firebaseToken");
      } else {
        print("APNS token henüz ayarlanmadı, Firebase token alınamıyor.");
      }
    } catch (e) {}
  }

  String? firebaseToken = await messaging.getToken();
  print("Firebase Token: $firebaseToken");
  if (firebaseToken != null) {
    LocaleManager.instance.setStringValue(PreferencesKeys.FIREBASE_TOKEN, firebaseToken);
  }

  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  var initializationSettingsAndroid = const AndroidInitializationSettings('@mipmap/ic_launcher');
  var initializationSettingsIOS = const DarwinInitializationSettings();
  var initializationSettings = InitializationSettings(
    android: initializationSettingsAndroid,
    iOS: initializationSettingsIOS,
  );
  await flutterLocalNotificationsPlugin.initialize(initializationSettings);

  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('Got a message whilst in the foreground!');
    print('Message data: ${message.data}');
    if (message.notification != null) {
      print('Message also contained a notification: ${message.notification}');
      _showNotification(message.notification!);
    }
  });
}

// İlk olarak uygulama açıldığında deep link var mı kontrol et
Future<String?> _handleInitialDynamicLink() async {
  if (kIsWeb) return null;
  final PendingDynamicLinkData? initialLink = await FirebaseDynamicLinks.instance.getInitialLink();
  if (initialLink != null) {
    final Uri deepLink = initialLink.link;
    return _extractStkIdFromLink(deepLink.toString());
  }
  return null;
}

// Linkten stkId'yi çek
String? _extractStkIdFromLink(String link) {
  // Örnek: www.hangel.org/123456
  // Bu durumda linkin sonunda yer alan kısım STK ID varsayılıyor
  // Link formatına göre değiştirebilirsiniz
  final uri = Uri.parse(link);
  if (uri.host == 'www.hangel.org' && uri.pathSegments.isNotEmpty) {
    return uri.pathSegments.last; // "123456"
  }
  return null;
}

class MyApp extends StatelessWidget {
  final Locale initialLocale;
  final String? stkId; // DEEP LINK STK ID PARAMETRESİ

  MyApp({super.key, required this.initialLocale, this.stkId});

  final ThemeData themeData = ThemeData(
    primaryColor: AppTheme.primaryColor,
    primarySwatch: MaterialColor(
      AppTheme.primaryColor.value,
      const {
        50: AppTheme.primaryColor,
        100: AppTheme.primaryColor,
        200: AppTheme.primaryColor,
        300: AppTheme.primaryColor,
        400: AppTheme.primaryColor,
        500: AppTheme.primaryColor,
        600: AppTheme.primaryColor,
        700: AppTheme.primaryColor,
        800: AppTheme.primaryColor,
        900: AppTheme.primaryColor,
      },
    ),
    useMaterial3: true,
  );

  @override
  Widget build(BuildContext context) {
    final langInstance = LanguageManager.instance;

    Locale localeToUse = initialLocale;
    if (!langInstance.supportedLocales.any((locale) => locale.languageCode == initialLocale.languageCode)) {
      localeToUse = langInstance.trLocale;
    } else {
      localeToUse =
          langInstance.supportedLocales.firstWhere((locale) => locale.languageCode == initialLocale.languageCode);
    }

    return GetMaterialApp(
      title: 'Hangel',
      locale: localeToUse,
      translations: langInstance,
      fallbackLocale: langInstance.trLocale,
      supportedLocales: langInstance.supportedLocales,
      localeResolutionCallback: (deviceLocale, supportedLocales) {
        if (deviceLocale == null) {
          return langInstance.trLocale;
        }
        for (var locale in supportedLocales) {
          if (locale.languageCode == deviceLocale.languageCode) {
            return locale;
          }
        }
        return langInstance.trLocale;
      },
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      debugShowCheckedModeBanner: false,
      theme: themeData,
      initialRoute: WidgetTree.routeName,
      routes: {
        WidgetTree.routeName: (context) => WidgetTree(stkId: stkId), // STK ID WidgetTree'ye gönderiliyor
        AppView.routeName: (context) => const AppView(),
        SplashPage.routeName: (context) => SplashPage(stkId: stkId), // STK ID SplashPage'e gönderiliyor
        HomePage.routeName: (context) => const HomePage(),
        OnboardingPage.routeName: (context) => const OnboardingPage(),
        RegisterPage.routeName: (context) =>
            RegisterPage(stkIds: [if (stkId != null) stkId!]), // STK ID RegisterPage'e gönderiliyor
        STKVolunteersPage.routeName: (context) => const STKVolunteersPage(),
        SettingsPage.routeName: (context) => const SettingsPage(),
        AboutUsPage.routeName: (context) => const AboutUsPage(),
        SelectFavoriteStkPage.routeName: (context) => const SelectFavoriteStkPage(),
        SupportPage.routeName: (context) => const SupportPage(),
        DonationHistoryPage.routeName: (context) => const DonationHistoryPage(),
        FrequentlyAskedQuestionsPage.routeName: (context) => const FrequentlyAskedQuestionsPage(),
        VolunteerForm.routeName: (context) => const VolunteerForm(),
        MissingDonationFormPage.routeName: (context) => const MissingDonationFormPage(),
        UserBanPage.routeName: (context) => const UserBanPage(),
        STKPanel.routeName: (context) => const STKPanel(),
        STKPanelQr.routeName: (context) => const STKPanelQr(),
        StkPanelSupport.routeName: (context) => const StkPanelSupport(),
      },
    );
  }
}
