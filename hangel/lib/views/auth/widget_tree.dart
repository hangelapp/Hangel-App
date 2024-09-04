import 'package:flutter/material.dart';
import 'package:hangel/views/auth/register_page.dart';
import 'package:hangel/views/splash_page.dart';

import 'auth.dart';

class WidgetTree extends StatefulWidget {
  const WidgetTree({super.key});
  static const routeName = '/widget-tree';

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
          return SplashPage();
        } else {
          return const RegisterPage();
        }
      },
    );
  }
}
