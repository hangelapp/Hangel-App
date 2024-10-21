import 'package:flutter/material.dart';
import '../constants/size.dart';

class AppTheme {
  // static const Color primaryColor = Color(0xFFF90058);
  // static const Color primaryColor = Color(0xFF39ff14);
  static const Color primaryColor = Color(0xFFF34723);
  static const Color secondaryColor = Color(0xFF1F1F1F);
  static const Color darkBlue = Color(0xFF37474F);
  static const Color red = Color(0xFFFF5964);
  static const Color errorRed = Color(0xFFff686b);
  static const Color white = Color(0xFFFFFFFF);
  static const Color blue = Color(0xFF35A7FF);
  static const Color lightBlue = Color(0xFFA8DADC);
  static const Color black = Color(0xFF000000);
  static const Color darkGreen = Color.fromARGB(255, 64, 145, 100);
  static const Color green = Color(0xFF76C893);
  static const Color green2 = Color(0xFF92E3A9);
  static const Color yellow = Color(0xFFFFC100);

  static const appFontFamily = 'Poppins';

  static TextStyle normalTextStyle(BuildContext context, double size, {Color color = black}) => TextStyle(
        fontSize: deviceFontSize(context, size),
        fontFamily: appFontFamily,
        color: color,
      );
  static TextStyle lightTextStyle(BuildContext context, double size, {Color color = black}) => TextStyle(
        fontSize: deviceFontSize(context, size),
        fontFamily: appFontFamily,
        fontWeight: FontWeight.w300,
        color: color,
      );
  static TextStyle boldTextStyle(BuildContext context, double size, {Color color = black}) => TextStyle(
        fontSize: deviceFontSize(context, size),
        fontFamily: appFontFamily,
        fontWeight: FontWeight.bold,
        color: color,
      );
  static TextStyle semiBoldTextStyle(BuildContext context, double size, {Color color = black}) => TextStyle(
      fontSize: deviceFontSize(context, size), fontFamily: appFontFamily, fontWeight: FontWeight.w600, color: color);
  static TextStyle semiBoldTextStyleWithUnderline(BuildContext context, double size, {Color color = black}) =>
      TextStyle(
          fontSize: deviceFontSize(context, size),
          fontFamily: appFontFamily,
          fontWeight: FontWeight.w600,
          color: color,
          decoration: TextDecoration.underline);
  static TextStyle extraBoldTextStyle(BuildContext context, double size, {Color color = black}) => TextStyle(
        fontSize: deviceFontSize(context, size),
        fontFamily: appFontFamily,
        fontWeight: FontWeight.w800,
        color: color,
      );
  static TextStyle blackTextStyle(BuildContext context, double size, {Color color = black}) => TextStyle(
        fontSize: deviceFontSize(context, size),
        fontFamily: appFontFamily,
        fontWeight: FontWeight.w900,
        color: color,
      );

  static List<BoxShadow> shadowList = [
    BoxShadow(
      color: AppTheme.darkBlue.withOpacity(0.2),
      blurRadius: 11,
      offset: const Offset(0, 5),
    ),
  ];
  static List<BoxShadow> shadowListBig({double radius = 44}) => [
        BoxShadow(
          color: AppTheme.darkBlue.withOpacity(0.1),
          blurRadius: radius,
          offset: const Offset(0, 5),
        ),
      ];

  static InputDecoration borderInputDecoration({String? hintText}) => InputDecoration(
        hintText: hintText,
        fillColor: lightBlue.withOpacity(0.2),
        filled: true,
        border: InputBorder.none,
        focusedBorder: InputBorder.none,
        enabledBorder: InputBorder.none
      );

  static InputDecoration noneBorderInputDecoration({String? hintText}) => InputDecoration(
        hintText: hintText,
        border: InputBorder.none,
        focusedBorder: InputBorder.none,
        enabledBorder: InputBorder.none,
      );
}
