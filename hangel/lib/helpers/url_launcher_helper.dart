import 'package:url_launcher/url_launcher.dart';

class UrlLauncherHelper {
  Future<void> launch(String url) async {
    final Uri url0 = Uri.parse(url);
    print(url0);
    if (!await launchUrl(url0, mode: LaunchMode.externalApplication)) {
      throw 'Could not launch $url0';
    }
  }
}
