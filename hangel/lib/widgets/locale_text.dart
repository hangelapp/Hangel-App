import 'package:flutter/material.dart' show Text, TextAlign, TextStyle, Widget;
import 'package:hangel/extension/string_extension.dart';

Widget LocaleText(String text, {TextStyle? style, TextAlign? textAlign}) {
  return Text(
    text.locale,
    style: style,
    textAlign: textAlign
  );
}
