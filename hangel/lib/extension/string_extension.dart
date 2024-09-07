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
}