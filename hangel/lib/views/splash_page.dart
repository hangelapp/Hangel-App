import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/views/auth/register_page.dart';
import 'package:hangel/views/select_favorite_stk_page.dart';
import 'package:hangel/views/user_ban_page.dart';

import 'package:hangel/widgets/app_name_widget.dart';
import 'package:provider/provider.dart';

import '../constants/size.dart';
import '../providers/login_register_page_provider.dart';

class SplashPage extends StatefulWidget {
  final String? stkId;
  const SplashPage({Key? key,this.stkId}) : super(key: key);
  static const routeName = '/';
  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> with TickerProviderStateMixin {
  @override
  void initState() {
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      await _initialize();
    });
    super.initState();
  }

  Future<void> _initialize() async {
    if (HiveHelpers.getUid() != "") {
      var result = await context.read<LoginRegisterPageProvider>().getUserById(HiveHelpers.getUid(), context);
      if (result?.isActive?["isActive"] == false) {
          print("Kullanıcı banlanmış");
      HiveHelpers.logout();
        Navigator.pushNamedAndRemoveUntil(context, UserBanPage.routeName, (route) => false);
        return null;
      }
      await Future.delayed(Duration(seconds: result == null ? 3 : 0));
      bool isAppView = false;
      Navigator.popUntil(context, (route) {
        print(route.settings.name);
        if (route.settings.name == AppView.routeName) {
          isAppView = true;
        }
        return true;
      });

      if (!isAppView) {
        Navigator.pushNamedAndRemoveUntil(
          context,
          AppView.routeName,
          (route) => false,
        );
      } else if (HiveHelpers.getUserFromHive().favoriteStks.isEmpty) {
        Navigator.pushReplacement(
            context, MaterialPageRoute(builder: (context) => SelectFavoriteStkPage(inTree: false)));
      }
    } else {
      bool isAppView = false;
      Navigator.popUntil(context, (route) {
        print(route.settings.name);
        if (route.settings.name == RegisterPage.routeName) {
          isAppView = true;
        }
        return true;
      });

      if (!isAppView) {
        Navigator.pushNamedAndRemoveUntil(
          context,
          RegisterPage.routeName,
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: SizedBox(
          width: deviceFontSize(context, 153),
          child: const AppNameWidget(fontSize: 40),
        ),
      ),
    );
  }
}
