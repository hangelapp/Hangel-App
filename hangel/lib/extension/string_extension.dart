extension StringExtension on String {
  String removeBrackets() {
    RegExp regex = RegExp(r'\[.*?\]');
    return replaceAll(regex, '').trim();
  }
}