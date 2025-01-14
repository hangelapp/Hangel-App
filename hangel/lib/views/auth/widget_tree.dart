import 'package:flutter/material.dart';
import 'package:hangel/views/auth/register_page.dart';
import 'package:hangel/views/splash_page.dart';

import 'auth.dart';

class WidgetTree extends StatefulWidget {
  const WidgetTree({super.key, this.stkId});
  static const routeName = '/widget-tree';
  final String? stkId; // DEEP LINK İLE ALINAN STK ID

  @override
  State<WidgetTree> createState() => _WidgetTreeState();
}

class _WidgetTreeState extends State<WidgetTree> {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder(
      stream: Auth().authStateChanges,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          // Eğer kullanıcı giriş yapmışsa SplashPage'e stkId ile gidiyoruz
          return SplashPage(stkId: widget.stkId);
        } else {
          // Kullanıcı giriş yapmamışsa RegisterPage'e stkId ile gidiyoruz
          return const RegisterPage();
        }
      },
    );
  }
}
