import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/firebase_options.dart';
import 'package:hangel/views/about_us_page.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/views/stk_volunteers_page.dart';
import 'package:hangel/views/donation_history_page.dart';
import 'package:hangel/views/frequently_asked_questions_page.dart';
import 'package:hangel/views/home_page.dart';
import 'package:hangel/views/auth/onboarding_page.dart';
import 'package:hangel/views/auth/register_page.dart';
import 'package:hangel/views/select_favorite_stk_page.dart';
import 'package:hangel/views/settings_page.dart';
import 'package:hangel/views/support_page.dart';
import 'package:hangel/views/vounteer_form.dart';
import 'package:hive_flutter/adapters.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'helpers/locator.dart';
import 'helpers/provider_list.dart';
import 'views/splash_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  setupLocator();
  await Hive.initFlutter();
  await Hive.openBox("user");

  await initializeDateFormatting('tr_TR', null);
  
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(
    MultiProvider(
      providers: providers,
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hangel',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
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
      ),
      initialRoute: SplashPage.routeName,
      routes: {
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
        VolunteerForm.routeName: (context) => const VolunteerForm()
      },
    );
  }
}
