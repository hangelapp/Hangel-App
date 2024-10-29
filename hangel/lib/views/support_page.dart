import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/bottom_sheet_widget.dart';

import '../widgets/general_button_widget.dart';
import '../widgets/gradient_widget.dart';
import '../widgets/locale_text.dart';
import '../widgets/support_form.dart';

class SupportPage extends StatefulWidget {
  const SupportPage({Key? key}) : super(key: key);
  static const String routeName = "/supportPage";

  @override
  State<SupportPage> createState() => _SupportPageState();
}

class _SupportPageState extends State<SupportPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Column(
            children: [
              AppBarWidget(title: 'support_page_title'.locale),
              Expanded(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: EdgeInsets.all(deviceHeightSize(context, 20)),
                    child: Column(
                      children: [
                        SvgPicture.asset(
                          "assets/images/support.svg",
                          width: deviceWidthSize(context, 300),
                        ),
                        SizedBox(
                          height: deviceHeightSize(context, 20),
                        ),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: LocaleText(
                            'support_page_contact_us',
                            style: AppTheme.semiBoldTextStyle(context, 20),
                          ),
                        ),
                        SizedBox(
                          height: deviceHeightSize(context, 10),
                        ),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: LocaleText(
                            'support_page_description',
                            style: AppTheme.normalTextStyle(context, 16),
                          ),
                        ),
                        SizedBox(
                          height: deviceHeightSize(context, 40),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const GradientWidget(
            height: 80,
          ),
          Positioned(
            bottom: deviceHeightSize(context, 20),
            left: deviceWidthSize(context, 20),
            right: deviceWidthSize(context, 20),
            child: GeneralButtonWidget(
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(20),
                      topRight: Radius.circular(20),
                    ),
                  ),
                  builder: (context) => BottomSheetWidget(
                    isMinPadding: true,
                    title: 'support_page_contact_modal_title'.locale,
                    child: SupportForm(),
                  ),
                );
              },
              buttonColor: AppTheme.primaryColor,
              text: 'support_page_contact_button'.locale,
            ),
          )
        ],
      ),
    );
  }
}
