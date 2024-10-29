import 'package:get/utils.dart';

extension StringExtension on String {
  String removeBrackets() {
    RegExp regex = RegExp(r'\[.*?\]');
    return replaceAll(regex, '').trim();
  }
}

extension EmailValidator on String {
  bool isValidEmail() {
    final RegExp emailRegex = RegExp(
      r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@"
      r"[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$",
    );
    return emailRegex.hasMatch(this);
  }

  String get locale => tr;
  String get unLocale => this;
  String localeWithParams(Map<String, String> params) {
    String localized = this.locale;
    params.forEach((key, value) {
      localized = localized.replaceAll('%{$key}', value);
    });
    return localized;
  }
}
