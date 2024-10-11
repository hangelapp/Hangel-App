import 'package:flutter/material.dart';
import '../constants/app_theme.dart';

class AppNameWidget extends StatelessWidget {
  const AppNameWidget(
      {Key? key,
      required this.fontSize,
      this.color = AppTheme.primaryColor,
      this.secondaryColor = AppTheme.secondaryColor})
      : super(key: key);
  final double fontSize;
  final Color color;
  final Color secondaryColor;
  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        children: [
          TextSpan(
            text: "h",
            style: AppTheme.blackTextStyle(context, fontSize, color: color),
          ),
          TextSpan(
            text: "angel",
            style: AppTheme.blackTextStyle(context, fontSize,
                color: color),
          ),
        ],
      ),
    );
  }
}
