import 'package:get/utils.dart';

extension StringExtension on String {
  String removeBrackets() {
    RegExp regex = RegExp(r'\[.*?\]');
    return replaceAll(regex, '').trim();
  }

  String removeTypes() {
    return this.substring(0,this.indexOf("|"));
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

  String toTitleCaseTR() {
    if (this.isEmpty) return this;

    return this.split(' ').map((word) {
      if (word.isEmpty) return word;

      String firstLetter = word[0];
      String remaining = word.substring(1);

      // Handle Turkish-specific uppercase transformations
      firstLetter = _turkishToUpper(firstLetter);

      return '$firstLetter$remaining';
    }).join(' ');
  }

  String _turkishToUpper(String char) {
    switch (char) {
      case 'i':
        return 'İ';
      case 'ı':
        return 'I';
      case 'ğ':
        return 'Ğ';
      case 'ü':
        return 'Ü';
      case 'ş':
        return 'Ş';
      case 'ö':
        return 'Ö';
      case 'ç':
        return 'Ç';
      default:
        return char.toUpperCase();
    }
  }

}
