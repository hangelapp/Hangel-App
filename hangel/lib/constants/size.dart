import 'dart:io';

import 'package:flutter/material.dart';

double deviceHeight(BuildContext context) => MediaQuery.of(context).size.height;
double deviceHeightSize(BuildContext context, double size) =>
    MediaQuery.of(context).size.height * size * 0.00123;

double deviceWidth(BuildContext context) => MediaQuery.of(context).size.width;
double deviceWidthSize(BuildContext context, double size) =>
    MediaQuery.of(context).size.width * size * 0.0026;

double deviceTopPadding(BuildContext context) =>
    MediaQuery.of(context).padding.top +
    (Platform.isAndroid ? deviceHeightSize(context, 10) : 0);

double deviceFontSize(BuildContext context, double fontSize) {
  //mobile, tablet, desktop,
  if (deviceWidth(context) < 600) {
    return mobileFontSize(context, fontSize);
  } else if (deviceWidth(context) < 1200) {
    return tabletFontSize(context, fontSize);
  } else {
    return desktopFontSize(context, fontSize);
  }
}

double mobileFontSize(BuildContext context, double fontSize) =>
    deviceHeight(context) / deviceWidth(context) * 0.48 * fontSize;

double tabletFontSize(BuildContext context, double fontSize) {
  //landscape
  if (deviceHeight(context) > deviceWidth(context)) {
    return deviceHeight(context) / deviceWidth(context) * 0.48 * fontSize * 2.2;
  } else {
    return deviceWidth(context) / deviceHeight(context) * 0.48 * fontSize * 2.2;
  }
}

double desktopFontSize(BuildContext context, double fontSize) =>
    deviceHeight(context) / deviceWidth(context) * 0.48 * fontSize * 2.2;
