import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/locale_text.dart'; // LocaleText import edildi

class AboutUsPage extends StatefulWidget {
  const AboutUsPage({super.key});
  static const routeName = '/about_us';
  @override
  State<AboutUsPage> createState() => _AboutUsPageState();
}

class _AboutUsPageState extends State<AboutUsPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          AppBarWidget(
            title: 'about_us_page_title'.locale, // Başlık lokalize edildi
          ),
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: deviceWidthSize(context, 16),
                ),
                child: Column(
                  children: [
                    SvgPicture.asset(
                      "assets/images/about_us.svg",
                      width: deviceWidthSize(context, 300),
                      fit: BoxFit.cover,
                    ),
                    SizedBox(
                      height: deviceHeightSize(context, 10),
                    ),
                    LocaleText(
                      'about_us_page_description',
                      textAlign: TextAlign.left,
                      style: AppTheme.normalTextStyle(context, 16),
                    ),
                    SizedBox(
                      height: deviceHeightSize(context, 20),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
