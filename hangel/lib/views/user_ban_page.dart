import 'package:flutter/material.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:provider/provider.dart';

import '../constants/app_theme.dart';
import '../providers/login_register_page_provider.dart';
import '../widgets/locale_text.dart';
import 'auth/register_page.dart';

class UserBanPage extends StatelessWidget {
  const UserBanPage({super.key});
  static const routeName = '/user_ban_page';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                LocaleText(
                  'user_ban_page_description',
                  textAlign: TextAlign.center,
                  style: AppTheme.normalTextStyle(context, 16),
                ),
                ElevatedButton(
                    onPressed: () {
                      context.read<LoginRegisterPageProvider>().setPhoneLoginPageType(PhoneLoginPageType.login);
                      Navigator.pushNamedAndRemoveUntil(context, RegisterPage.routeName, (route) => false);
                    },
                    child: Text('register_page_login'.locale))
              ],
            ),
          ),
        ],
      ),
    );
  }
}
