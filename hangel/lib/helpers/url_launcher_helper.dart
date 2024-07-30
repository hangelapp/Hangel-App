import 'package:url_launcher/url_launcher.dart';

class UrlLauncherHelper {
  Future<void> launch(String url) async {
    final Uri _url = Uri.parse(url);
    print(_url);
    if (!await launchUrl(_url, mode: LaunchMode.externalApplication)) {
      throw 'Could not launch $_url';
    }
  }
}
