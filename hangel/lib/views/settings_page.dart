import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/views/about_us_page.dart';
import 'package:hangel/views/frequently_asked_questions_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/bottom_sheet_widget.dart';
import 'package:hangel/widgets/text_view_bottom_sheet.dart';

import '../managers/language_manager.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({Key? key}) : super(key: key);
  static const routeName = '/settings';

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          AppBarWidget(
            title: "settings_page_title".locale,
          ),
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: deviceWidthSize(context, 16),
                ),
                child: Column(
                  children: [
                    SizedBox(
                      height: deviceHeightSize(context, 10),
                    ),
                    ListTile(
                      title: Text(
                        "settings_page_about_us".locale,
                        style: AppTheme.semiBoldTextStyle(context, 16),
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(deviceWidthSize(context, 10))),
                      leading: const Icon(
                        Icons.info_rounded,
                        color: AppTheme.primaryColor,
                      ),
                      onTap: () {
                        Navigator.pushNamed(context, AboutUsPage.routeName);
                      },
                    ),
                    Divider(
                      color: AppTheme.secondaryColor.withOpacity(0.1),
                    ),
                    ListTile(
                      title: Text(
                        "settings_page_user_agreement".locale,
                        style: AppTheme.semiBoldTextStyle(context, 16),
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(deviceWidthSize(context, 10))),
                      leading: const Icon(
                        Icons.description_rounded,
                        color: AppTheme.primaryColor,
                      ),
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                          ),
                          builder: (context) => BottomSheetWidget(
                            title: "settings_page_user_agreement".locale,
                            child: TextViewBottomSheet(text: "settings_page_user_agreement_text".locale),
                          ),
                        );
                      },
                    ),
                    Divider(
                      color: AppTheme.secondaryColor.withOpacity(0.1),
                    ),
                    ListTile(
                      title: Text(
                        "settings_page_privacy_policy".locale,
                        style: AppTheme.semiBoldTextStyle(context, 16),
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(deviceWidthSize(context, 10))),
                      leading: const Icon(
                        Icons.privacy_tip_rounded,
                        color: AppTheme.primaryColor,
                      ),
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                          ),
                          builder: (context) => BottomSheetWidget(
                            title: "settings_page_privacy_policy".locale,
                            child: TextViewBottomSheet(text: "settings_page_privacy_policy_text".locale),
                          ),
                        );
                      },
                    ),
                    Divider(
                      color: AppTheme.secondaryColor.withOpacity(0.1),
                    ),
                    ListTile(
                      title: Text(
                        "settings_page_faq".locale,
                        style: AppTheme.semiBoldTextStyle(context, 16),
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(deviceWidthSize(context, 10))),
                      leading: const Icon(
                        Icons.question_answer_rounded,
                        color: AppTheme.primaryColor,
                      ),
                      onTap: () {
                        Navigator.pushNamed(context, FrequentlyAskedQuestionsPage.routeName);
                      },
                    ),
                    Divider(
                      color: AppTheme.secondaryColor.withOpacity(0.1),
                    ),
                    ListTile(
                      title: Text(
                        "settings_page_change_language".locale,
                        style: AppTheme.semiBoldTextStyle(context, 16),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(deviceWidthSize(context, 10)),
                      ),
                      leading: const Icon(
                        Icons.language,
                        color: AppTheme.primaryColor,
                      ),
                      onTap: () {
                        _showLanguageSelectionDialog();
                      },
                    ),
                    Divider(
                      color: AppTheme.secondaryColor.withOpacity(0.1),
                    ),
                  ],
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  void _showLanguageSelectionDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("settings_page_change_language".locale),
          content: SingleChildScrollView(
            child: Column(
              children: LanguageManager.instance.supportedLocales.map((locale) {
                return ListTile(
                  title: Text(_getLanguageName(locale)),
                  onTap: () {
                    _changeLanguage(locale);
                    Navigator.of(context).pop();
                  },
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }

  Future<void> _changeLanguage(Locale locale) async {
    await Get.updateLocale(locale);
    await LanguageManager.instance.updateLocale(locale);
  }

  String _getLanguageName(Locale locale) {
    switch (locale.languageCode) {
      case 'tr':
        return 'Türkçe';
      case 'en':
        return 'English';
      case 'fr':
        return 'Français';
      case 'ar':
        return 'العربية';
      default:
        return locale.languageCode;
    }
  }
}
