import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/views/auth/register_page.dart';
import 'package:hangel/views/select_favorite_stk_page.dart';
// import 'package:hangel/views/onboarding_page.dart';
import 'package:hangel/widgets/app_name_widget.dart';
import 'package:provider/provider.dart';

// import '../constants/app_theme.dart';
import '../constants/size.dart';
import '../providers/login_register_page_provider.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({Key? key}) : super(key: key);
  static const routeName = '/';
  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> with TickerProviderStateMixin {
  double _opacity = 0;
  // double _left = 50;
  // double _right = 50;

  @override
  void initState() {
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    );

    Future.delayed(const Duration(milliseconds: 500), () {
      setState(() {
        _opacity = 1;
      });
    }).then(
      (value) => Future.delayed(const Duration(milliseconds: 500), () {
        try {
          setState(() {
            // _left = 0;
            // _right = 0;
          });
        } catch (e) {
          print(e);
        }
      }),
    );

    Future.delayed(const Duration(seconds: 2), () {
      if (HiveHelpers.getUid() != "") {
        context.read<LoginRegisterPageProvider>().getUserById(HiveHelpers.getUid());
        if (HiveHelpers.getUserFromHive().favoriteStks.isEmpty) {
          Navigator.pushReplacementNamed(
              context, SelectFavoriteStkPage.routeName);
          return;
        }
        Navigator.pushReplacementNamed(context, AppView.routeName);
      } else {
        Navigator.pushReplacementNamed(context, RegisterPage.routeName);
      }
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: SizedBox(
          width: deviceFontSize(context, 153),
          child: AnimatedOpacity(
              duration: const Duration(milliseconds: 500),
              opacity: _opacity,
              child: const AppNameWidget(fontSize: 40)),
          // child: Stack(
          //   alignment: Alignment.center,
          //   children: [
          //     AnimatedPositioned(
          //       right: deviceWidthSize(context, _left),
          //       duration: const Duration(milliseconds: 500),
          //       curve: Curves.easeInOut,
          //       child: Opacity(
          //         opacity: _left == 0 ? 1 : 0,
          //         child: Text(
          //           "angel",
          //           style: AppTheme.blackTextStyle(context, 40,
          //               color: AppTheme.secondaryColor),
          //         ),
          //       ),
          //     ),
          //     AnimatedPositioned(
          //       left: deviceWidthSize(context, _right),
          //       duration: const Duration(milliseconds: 500),
          //       curve: Curves.easeInOut,
          //       child: AnimatedOpacity(
          //         duration: const Duration(milliseconds: 500),
          //         opacity: _opacity,
          //         child: Container(
          //           alignment: Alignment.centerRight,
          //           color: Colors.white,
          //           child: Text(
          //             "H",
          //             style: AppTheme.blackTextStyle(context, 40,
          //                 color: AppTheme.primaryColor),
          //           ),
          //         ),
          //       ),
          //     ),
          //   ],
          // ),
        ),
      ),
    );
  }
}
