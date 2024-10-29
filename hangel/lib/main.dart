import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:get/get.dart';
import 'package:hive_flutter/adapters.dart';
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
import 'views/stk_volunteers_page.dart';
import 'views/support_page.dart';
import 'views/vounteer_form.dart';
import 'widgets/missing_donation_form_widget.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  setupLocator();
  await Hive.initFlutter();
  await Hive.openBox("user");
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
  runApp(
    MultiProvider(
      providers: providers,
      child: MyApp(initialLocale: initialLocale),
    ),
  );
}

class MyApp extends StatelessWidget {
  final Locale initialLocale;

  MyApp({Key? key, required this.initialLocale}) : super(key: key);

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

    // Desteklenen locale olup olmadığını kontrol et
    Locale localeToUse = initialLocale;
    if (!langInstance.supportedLocales.any((locale) => locale.languageCode == initialLocale.languageCode)) {
      localeToUse = langInstance.trLocale;
    } else {
      // Tam eşleşen Locale nesnesini al
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
        WidgetTree.routeName: (context) => const WidgetTree(),
        AppView.routeName: (context) => const AppView(),
        SplashPage.routeName: (context) => const SplashPage(),
        HomePage.routeName: (context) => const HomePage(),
        OnboardingPage.routeName: (context) => const OnboardingPage(),
        RegisterPage.routeName: (context) => const RegisterPage(),
        STKVolunteersPage.routeName: (context) => const STKVolunteersPage(),
        SettingsPage.routeName: (context) => const SettingsPage(),
        AboutUsPage.routeName: (context) => const AboutUsPage(),
        SelectFavoriteStkPage.routeName: (context) => const SelectFavoriteStkPage(),
        SupportPage.routeName: (context) => const SupportPage(),
        DonationHistoryPage.routeName: (context) => const DonationHistoryPage(),
        FrequentlyAskedQuestionsPage.routeName: (context) => const FrequentlyAskedQuestionsPage(),
        VolunteerForm.routeName: (context) => const VolunteerForm(),
        MissingDonationFormPage.routeName: (context) => const MissingDonationFormPage(),
      },
    );
  }
}
