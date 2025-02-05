import 'package:hangel/extension/string_extension.dart';

class AppConstants {
  static const BASE_URL = 'https://us-central1-decremental-1.cloudfunctions.net/api/';
  static const REKLAM_ACTION_BASE_URL = "https://reklamaction.api.hasoffers.com/Apiv3/json";
  static const GELIR_ORTAKLARI_BASE_URL = "https://gelirortaklari.api.hasoffers.com/Apiv3/json";
  static const REKLAM_ACTION_API_KEY = "71544d66c9a671a9963e9a9eb0f18f43c3f8b74c5c5fcd061a8c6de6ca735a38";
  static const GELIR_ORTAKLARI_API_KEY = "891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3";

  static String DETAIL_TEXT(String val) =>
      "$val e-ticaret yoluyla hizmet veren bir kuruluştur.$val müşteri odaklı yaklaşımıyla 20 yılı aşkın bir süredir sizlere hizmet vermektedir. $val ürünleri kaliteli ve sağlam olmasının yanında hesaplıdır.";

  static String USER_AGREEMENT = 'settings_page_user_agreement_text'.locale;
  static String SECRET_AGREEMENT = 'settings_page_privacy_policy_text'.locale;
}
