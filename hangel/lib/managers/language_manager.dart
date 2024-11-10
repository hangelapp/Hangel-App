import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../constants/preferences_keys.dart';
import 'locale_manager.dart';

class LanguageManager extends Translations {
  static final LanguageManager _instance = LanguageManager();
  static LanguageManager get instance => _instance;
  LanguageManager();

  Locale get enLocale => const Locale("en", "US");
  Locale get trLocale => const Locale("tr", "TR");
  Locale get frLocale => const Locale("fr", "FR");
  Locale get arLocale => const Locale("ar");

  List<Locale> get supportedLocales => [enLocale, trLocale, frLocale, arLocale];

  Future<void> updateLocale(Locale locale) async {
    await Get.updateLocale(locale);
    await LocaleManager.instance.setStringValue(PreferencesKeys.LOCALE, locale.languageCode);
  }

  @override
  Map<String, Map<String, String>> get keys => {
        'tr_TR': {
          "user_ban_page_description": "Hesabınız pasif olarak işaretlendi. Bir yanlışlık olduğunu düşünüyorsanız bizimle iletişime geçebilirsiniz.",
          "stk_form_validation_error": "Lütfen gerekli alanları doldurunuz",
          "stk_form_type": "Türü",
          "stk_form_type_association": "Dernek",
          "stk_form_type_foundation": "Vakıf",
          "stk_form_type_sports_club": "Spor Kulübü",
          "stk_form_type_special_permission": "Özel izin ile yardım toplayan",
          "stk_form_invalid_id_no": "Lütfen geçerli bir ID No giriniz",
          "stk_form_tax_number": "Vergi No",
          "stk_form_invalid_tax_number": "Lütfen geçerli bir vergi numarası giriniz",
          "stk_form_tax_office": "Vergi Dairesi",
          "stk_form_invalid_tax_office": "Lütfen geçerli bir vergi dairesi giriniz",
          "stk_form_short_name": "Kısa Adı",
          "stk_form_invalid_short_name": "Lütfen geçerli bir kısa ad giriniz",
          "stk_form_full_name": "Tam Adı",
          "stk_form_invalid_full_name": "Lütfen geçerli bir tam ad giriniz",
          "stk_form_establishment_year": "Kuruluş Yılı",
          "stk_form_invalid_establishment_year": "Lütfen geçerli bir kuruluş yılı giriniz",
          "stk_form_iban_no": "IBAN No",
          "stk_form_invalid_iban": "Lütfen geçerli bir IBAN giriniz",
          "stk_form_logo": "Logosu",
          "stk_form_logo_info": "Logonuz, 512x512 boyutlarında, png veya jpg formatında olmalıdır.",
          "stk_form_website": "Web Sitesi",
          "stk_form_invalid_website": "Lütfen geçerli bir web sitesi giriniz",
          "stk_form_email": "Mail Adresi",
          "stk_form_invalid_email": "Lütfen geçerli bir mail adresi giriniz",
          "stk_form_phone": "Telefon Numarası",
          "stk_form_invalid_phone": "Lütfen geçerli bir telefon numarası giriniz",
          "stk_form_city": "İl",
          "stk_form_district": "İlçe",
          "stk_form_neighborhood": "Mahalle",
          "stk_form_remaining_address": "Geriye Kalan Adres Bilgileri",
          "stk_form_invalid_remaining_address": "Lütfen adres bilgilerini giriniz",
          "stk_form_statute": "Barkodlu Dernek Tüzüğü, Vakıf Senedi",
          "stk_form_statute_info": "Dosya, pdf formatında ve 6mb'dan küçük olmalıdır.",
          "stk_form_activity_certificate": "Faaliyet Belgesi",
          "stk_form_activity_certificate_info":
              "Dosya, pdf formatında ve 6mb'dan küçük olmalıdır. Son 7 iş günü içinde alınmış olmalıdır.",
          "stk_form_activity_area": "STK Genel Müdürlüğündeki Faaliyet Alanı",
          "stk_form_beneficiaries": "Faydalanıcılar",
          "stk_form_un_sdgs": "BM'nin Sürdürülebilir Kalkınma Amaçları",
          "stk_form_applicant_info": "Başvuruyu Yapan Kişinin Bilgileri",
          "stk_form_applicant_name": "Adı Soyadı",
          "stk_form_invalid_applicant_name": "Lütfen geçerli bir ad soyad giriniz",
          "stk_form_applicant_phone": "Telefon Numarası",
          "stk_form_invalid_applicant_phone": "Lütfen geçerli bir telefon numarası giriniz",
          "stk_form_applicant_email": "Mail Adresi",
          "stk_form_invalid_applicant_email": "Lütfen geçerli bir mail adresi giriniz",
          "stk_form_applicant_position": "Görevi",
          "stk_form_invalid_applicant_position": "Lütfen geçerli bir görev giriniz",
          "stk_form_governorate_permission_document": "Valilik İzin Belgesi",
          "stk_form_governorate_permission_document_info": "Dosya, jpg veya pdf formatında olmalıdır.",
          "stk_form_stk_il_mudurlugu_yetki_belgesi": "STK İl Müdürlüğü Yetki Belgesi",
          "stk_form_stk_il_mudurlugu_yetki_belgesi_info": "Dosya, jpg veya pdf formatında olmalıdır.",
          "stk_form_permission_start_date": "İzin Başlama Tarihi",
          "stk_form_invalid_permission_start_date": "Lütfen geçerli bir tarih seçiniz",
          "stk_form_permission_end_date": "İzin Bitiş Tarihi",
          "stk_form_invalid_permission_end_date": "Lütfen geçerli bir tarih seçiniz",
          "stk_form_permission_granting_governorate": "İzni Veren Valilik",
          "stk_form_activity_number": "Faaliyet No",
          "stk_form_invalid_activity_number": "Lütfen geçerli bir faaliyet no giriniz",
          "stk_form_campaign_name": "Kampanyanın Adı",
          "stk_form_invalid_campaign_name": "Lütfen geçerli bir kampanya adı giriniz",
          "stk_form_birth_date": "Doğum Tarihi",
          "stk_form_invalid_birth_date": "Lütfen geçerli bir tarih seçiniz",
          "stk_form_photo": "Fotoğrafı",
          "stk_form_photo_info": "Fotoğraf, png veya jpg formatında olmalıdır.",
          "stk_form_permission_purpose": "İznin Amacı",
          "stk_form_invalid_permission_purpose": "Lütfen iznin amacını giriniz",
          "stk_form_applicant_relation": "Yakınlık Derecesi",
          "stk_form_invalid_applicant_relation": "Lütfen yakınlık derecesini giriniz",
          "stk_form_submit": "Gönder",
          "stk_form_registry_number": "Kütük No",
          "stk_form_registry_number_foundation": "Sicil No",
          "stk_form_sector_professional_associations": "Mesleki ve Dayanışma Dernekleri",
          "stk_form_sector_religious_services":
              "Dini Hizmetlerin Gerçekleştirilmesine Yönelik Faaliyet Gösteren Dernekler",
          "stk_form_sector_sports": "Spor ve Spor İle İlgili Dernekleri",
          "stk_form_sector_humanitarian_aid": "İnsani Yardım Dernekleri",
          "stk_form_sector_education_research": "Eğitim Araştırma Dernekleri",
          "stk_form_sector_culture_art_tourism": "Kültür, Sanat ve Turizm Dernekleri",
          "stk_form_sector_social_values": "Toplumsal Değerleri Yaşatma Dernekleri",
          "stk_form_sector_environment": "Çevre Doğal Hayat Hayvanları Koruma Dernekleri",
          "stk_form_sector_health": "Sağlık Alanında Faaliyet Gösteren Dernekler",
          "stk_form_sector_personal_development": "Bireysel Öğreti ve Toplumsal Gelişim Dernekleri",
          "stk_form_sector_urban_development": "İmar, Şehircilik ve Kalkındırma Dernekleri",
          "stk_form_sector_advocacy": "Hak ve Savunuculuk Dernekleri",
          "stk_form_sector_disabilities": "Engelli Dernekleri",
          "stk_form_sector_thought_based": "Düşünce Temelli Dernekler",
          "stk_form_sector_public_support": "Kamu Kurumları ve Personelini Destekleyen Dernekleri",
          "stk_form_sector_food_agriculture": "Gıda, Tarım ve Hayvancılık Alanında Faaliyet Gösteren Dernekler",
          "stk_form_sector_diaspora": "Dış Türkler İle Dayanışma Dernekleri",
          "stk_form_sector_international_cooperation": "Uluslararası Teşekküller ve İşbirliği Dernekleri",
          "stk_form_sector_veterans": "Şehit Yakını ve Gazi Dernekleri",
          "stk_form_sector_elderly_children": "Yaşlı ve Çocuklara Yönelik Dernekler",
          "stk_form_sector_children": "Çocuk Dernekleri",
          "stk_form_sector_other": "Diğer",
          "stk_form_beneficiaries_animals": "Hayvanlar",
          "stk_form_beneficiaries_poor": "Yoksullar",
          "stk_form_beneficiaries_education": "Eğitim",
          "stk_form_beneficiaries_health": "Sağlık",
          "stk_form_beneficiaries_agriculture": "Tarım",
          "stk_form_beneficiaries_refugees": "Mülteci",
          "stk_form_beneficiaries_law": "Hukuk",
          "stk_form_beneficiaries_earthquake": "Deprem",
          "stk_form_beneficiaries_food": "Gıda",
          "stk_form_beneficiaries_religious": "Dini",
          "stk_form_beneficiaries_social_entrepreneurship": "Sosyal Girişimcilik",
          "stk_form_beneficiaries_entrepreneurship": "Girişimcilik",
          "stk_form_beneficiaries_culture_art": "Kültür Sanat",
          "stk_form_beneficiaries_sports": "Spor",
          "stk_form_un_goal_no_poverty": "Yoksulluğa Son",
          "stk_form_un_goal_zero_hunger": "Açlığa Son",
          "stk_form_un_goal_good_health": "Sağlık ve Kaliteli Yaşam",
          "stk_form_un_goal_quality_education": "Nitelikli Eğitim",
          "stk_form_un_goal_gender_equality": "Toplumsal Cinsiyet Eşitliği",
          "stk_form_un_goal_clean_water": "Temiz Su ve Sanitasyon",
          "stk_form_un_goal_clean_energy": "Erişilebilir ve Temiz Enerji",
          "stk_form_un_goal_decent_work": "İnsana Yakışır İş ve Ekonomik Büyüme",
          "stk_form_un_goal_industry": "Sanayi, Yenilikçilik ve Altyapı",
          "stk_form_un_goal_reduced_inequalities": "Eşitsizliklerin Azaltılması",
          "stk_form_un_goal_sustainable_cities": "Sürdürülebilir Şehirler ve Topluluklar",
          "stk_form_un_goal_responsible_consumption": "Sorumlu Üretim ve Tüketim",
          "stk_form_un_goal_climate_action": "İklim Eylemi",
          "stk_form_un_goal_life_below_water": "Sudaki Yaşam",
          "stk_form_un_goal_life_on_land": "Karasal Yaşam",
          "stk_form_un_goal_peace_justice": "Barış, Adalet ve Güçlü Kurumlar",
          "stk_form_un_goal_partnerships": "Amaçlar İçin Ortaklıklar",
          "missing_donation_form_page_title": "Bağışım Gözükmüyor",
          "missing_donation_form_brand": "Marka",
          "missing_donation_form_order_number": "Sipariş Numarası",
          "missing_donation_form_date": "Tarih",
          "missing_donation_form_cart_amount": "Sepet Tutarı",
          "missing_donation_form_registry_id": "Sicil ID",
          "missing_donation_form_phone": "Telefon Numarası",
          "missing_donation_form_send": "Gönder",
          "missing_donation_form_fill_all_fields": "Lütfen tüm alanları doldurun",
          "missing_donation_form_invalid_phone": "Lütfen geçerli bir telefon numarası girin",
          "missing_donation_form_success": "Başvurunuz başarıyla gönderildi",
          "missing_donation_form_error": "Başvurunuz gönderilirken bir hata oluştu",
          "support_form_name": "Ad Soyad",
          "support_form_email": "E-Posta",
          "support_form_phone": "Telefon",
          "support_form_user_type": "Kullanıcı Tipi",
          "support_form_user_type_individual": "Bireysel Kullanıcıyım",
          "support_form_user_type_stk_manager": "STK Yöneticisiyim",
          "support_form_user_type_brand_manager": "Marka Yöneticisiyim",
          "support_form_subject": "Konu",
          "support_form_message": "Mesaj",
          "support_form_send": "Gönder",
          "support_form_invalid_email": "Lütfen geçerli bir e-posta girin",
          "support_form_invalid_phone": "Lütfen geçerli bir telefon numarası girin",
          "support_form_fill_all_fields": "Lütfen tüm alanları doldurun",
          "support_form_invalid_name": "Lütfen geçerli bir ad soyad girin",
          "support_form_invalid_subject": "Lütfen bir konu girin",
          "support_form_invalid_message": "Lütfen bir mesaj girin",
          "donation_history_page_my_donation_not_showing": "Bağışım gözükmüyor",

          'settings_page_change_language': 'Dil Değiştir',
          // HomePage Keys...
          'home_page_donation_rate': 'Bağış Oranı',
          'home_page_connection_problem': 'Bağlantı Problemi!',
          'home_page_search_brand': 'Marka Ara',
          'home_page_brands': 'Markalar',
          'home_page_all': 'Tümü',
          'home_page_sort_donation_rate_desc': 'Bağış oranı yüksekten düşüğe',
          'home_page_sort_donation_rate_asc': 'Bağış oranı düşükten yükseğe',
          'home_page_sort_newest_oldest': 'En yeniden en eskiye',
          'home_page_sort_oldest_newest': 'En eskiden en yeniye',
          'home_page_sort_a_z': 'A-Z',
          'home_page_sort_z_a': 'Z-A',

          // RegisterPage Keys...
          'register_page_create_account': 'Hesap oluşturun',
          'register_page_login': 'Giriş yapın',
          'register_page_full_name': 'Ad Soyad',
          'register_page_phone_number': 'Telefon Numarası',
          'register_page_enter_phone': 'Telefon numaranızı girin',
          'register_page_user_agreement': 'Kullanıcı Sözleşmesi\'ni okudum ve kabul ediyorum.',
          'register_page_privacy_agreement': 'Gizlilik Sözleşmesi\'ni okudum ve kabul ediyorum.',
          'register_page_error_fill_all_fields': 'Lütfen tüm alanları doğru doldurunuz!',
          'register_page_error_accept_agreements': 'Lütfen sözleşmeleri onaylayın!',
          'register_page_error_unexpected': 'Beklenmeyen bir hatayla karşılaşıldı. Lütfen tekrar deneyin',
          'register_page_error_invalid_code': 'Lütfen kodu doğru giriniz!',
          'register_page_verify_code_prompt': 'Lütfen telefonunuza gelen 6 haneli kodu giriniz.',
          'register_page_resend_code': 'Tekrar Gönder',
          'register_page_didnt_receive_code': 'Doğrulama kodu gelmedi mi?',
          'register_page_verify': 'Doğrula',
          'register_page_login_register_prompt_login': 'Hesabınız yok mu? ',
          'register_page_login_register_prompt_register': 'Hesabınız var mı? ',
          'register_page_login_register_action_login': 'Giriş Yap',
          'register_page_login_register_action_register': 'Kayıt Ol',

          // AboutUsPage Keys...
          'about_us_page_title': 'Hakkımızda',
          'about_us_page_description': """
  Hangel, insanların alışverişlerinden elde ettikleri puanları sivil toplum kuruluşlarına (STK) bağışlamalarını sağlayan bir uygulamadır. Misyonumuz, bağış yapmayı kolaylaştırmak ve her bireyin sevdiği STK'ları desteklemesine imkan vermektir.

  Nasıl Çalışır?
  Hangel uygulamasını indirin ve bir hesap oluşturun.
  Sevdiğiniz STK'ları uygulamada seçin.
  Alışverişlerinizde kredi kartınız veya banka kartınızla Hangel'i ödeme yöntemi olarak seçin.
  Harcamalarınızdan puan kazanın.
  Kazandığınız puanları seçtiğiniz STK'lara bağışlayın.

  Neden Hangel?
  Kolay ve pratik: Bağış yapmak için dakikalar harcamanıza gerek yok. Alışverişlerinizden puan kazanarak sevdiğiniz STK'ları destekleyebilirsiniz.
  Güvenli ve şeffaf: Tüm işlemleriniz güvenli bir şekilde gerçekleşir. Bağışlarınızın nereye gittiğini şeffaf bir şekilde takip edebilirsiniz.
  Sosyal sorumluluk: Hangel ile alışverişlerinizin bir anlamı olsun. Sevdiğiniz STK'lara katkıda bulunarak topluma fayda sağlayabilirsiniz.

  Hangel ile şunları yapabilirsiniz:
  Sevdiğiniz STK'ları destekleyin.
  Bağışlarınızın nereye gittiğini takip edin.
  Alışverişlerinizden puan kazanarak daha fazla bağış yapın.
  Sosyal sorumluluk projelerine katkıda bulunun.

  Hangel'e Katılın!
  Hangel'e katılarak siz de sevdiğiniz STK'lara katkıda bulunabilir ve topluma fayda sağlayabilirsiniz. Hemen uygulamayı indirin ve fark yaratmaya başlayın!
  """,

          // AppViewPage Keys...
          'app_view_about_us_title': 'Hakkımızda',
          'app_view_drawer_greeting': 'Merhaba,',
          'app_view_drawer_profile': 'Profilim',
          'app_view_drawer_donations': 'Bağışlarım',
          'app_view_drawer_stks': "Stk'lar",
          'app_view_drawer_volunteer': 'Gönüllü',
          'app_view_drawer_social_companies': 'Sosyal Şirketler',
          'app_view_drawer_settings': 'Ayarlar',
          'app_view_drawer_contact': 'İletişim',
          'app_view_drawer_version': 'v1.0.1',
          'app_view_drawer_logout': 'Çıkış Yap',
          'app_view_drawer_delete_account': 'Hesabımı Sil',

          'app_view_bottom_nav_markets': 'Markalar',
          'app_view_bottom_nav_volunteer': 'Gönüllü',
          'app_view_bottom_nav_favorites': 'Favoriler',
          'app_view_bottom_nav_stks': "STK' lar",
          'app_view_bottom_nav_profile': 'Profil',

          'app_view_exit_dialog_title': 'Çıkış Yap',
          'app_view_exit_dialog_content':
              'Alışverişlerin ile sosyal faydaya ortak olmaya devam etmen için çıkış yapmaman gerekiyor.',
          'app_view_exit_dialog_button_accept': 'Çıkış Yap',
          'app_view_exit_dialog_button_cancel': 'Vazgeç',

          'app_view_delete_account_dialog_title': 'Hesabımı Sil',
          'app_view_delete_account_dialog_content':
              'Alışverişlerin ile sosyal faydaya ortak olmaya devam etmen için hesabını silmemen gerekiyor.\nBu işlem geri alınamaz!',
          'app_view_delete_account_dialog_button_accept': 'Hesabımı Sil',
          'app_view_delete_account_dialog_button_cancel': 'Vazgeç',

          'app_view_reauth_dialog_title': 'Oturum Süresi Doldu',
          'app_view_reauth_dialog_content': 'Hesabınızı silmek için lütfen tekrar giriş yapın.',
          'app_view_reauth_dialog_button_ok': 'Tamam',

          'app_view_privacy_dialog_title': 'Gizlilik ve İzinler',
          'app_view_privacy_dialog_content_part1':
              'Uygulamamız, size daha iyi ve kişiselleştirilmiş bir deneyim sunmak için izninize ihtiyaç duyar.',
          'app_view_privacy_dialog_button_accept': 'Devam Et',
          'app_view_privacy_dialog_button_cancel': 'İptal',

          'app_view_contact_support': 'İletişime Geç',
          'app_view_version': 'v1.0.1',

          // Close button in dialogs
          'close': 'Kapat',

          // BrandDetailPage Keys...
          'brand_detail_page_bilgilendirmeler': 'Bilgilendirmeler',
          'brand_detail_page_deprem_bolgesi': 'Deprem Bölgesi',
          'brand_detail_page_sosyal_girisim': 'Sosyal Girişim',
          'brand_detail_page_toplam_bagis': 'Toplam Bağış',
          'brand_detail_page_favori': 'Favori',
          'brand_detail_page_islem_sayisi': 'İşlem Sayısı',
          'brand_detail_page_kategoriler': 'Kategoriler',
          'brand_detail_page_bagis_orani': 'Bağış Oranı',
          'brand_detail_page_deprem_bolgesi_mi': 'Deprem Bölgesi mi?',
          'brand_detail_page_genel_bonus_kosullari': 'Genel Bonus Koşulları',
          'brand_detail_page_alisverise_basla': 'Alışverişe Başla',
          'brand_detail_page_sonraki_alisveris_kosullari_title':
              'Sonraki alışverişinden bağış kazanacağından emin olman için bilmen gerekenler',
          'brand_detail_page_sonraki_alisveris_kosullari_content1':
              'Uygulamamız, size daha iyi ve kişiselleştirilmiş bir deneyim sunmak için izninize ihtiyaç duyar.',
          'brand_detail_page_sonraki_alisveris_kosullari_content2':
              'Lütfen devam etmek için "Onayla" butonuna tıklayın.',
          'brand_detail_page_tamam': 'Tamam',
          'brand_detail_page_bagis_yansimama_mesaji1': 'Yaptığın alışverişlerde %',
          'brand_detail_page_bagis_yansimama_mesaji2': ' oranında bağış yapma imkanı!',
          'brand_detail_page_bagis_yansimama_mesaji3': 'Bağış ödemesi için ortalama zaman: 75 gün',
          'brand_detail_page_bagis_yansimama_mesaji4': 'Genel Bonus Koşulları',
          'brand_detail_page_bagis_yansimama_mesaji5':
              'Sonraki alışverişinden bağış kazanacağından emin olman için bilmen gerekenler',
          'brand_detail_page_bagis_yansimama_mesaji6': 'Bu işlem geri alınamaz!',
          'brand_detail_page_bagis_yansimama_mesaji7':
              'Alışverişlerin ile sosyal faydaya ortak olmaya devam etmen için çıkış yapmaman gerekiyor.',
          'brand_detail_page_bagis_yansimama_mesaji8':
              'Alışverişlerin ile sosyal faydaya ortak olmaya devam etmen için hesabını silmemen gerekiyor.\nBu işlem geri alınamaz!',
          'brand_detail_page_alisveris_hata_mesaji1': 'Sistemde kayıtlı cep telefonu bulunamadı!',
          'brand_detail_page_alisveris_hata_mesaji2': 'Kullanıcı bilgilerinizde hata var!',
          'brand_detail_page_alisveris_hata_mesaji3': 'En az 2 STK\'yı favoriye eklemeniz gerekmektedir!',
          'brand_detail_page_alisveris_hata_mesaji4':
              'Alışverişinizi tamamlamadan önce mağazanın özel koşullarına göz atın',

          // BrandFormWidget Keys...
          'brand_form_page_marka_adi': 'Marka Adı',
          'brand_form_page_gecersiz_marka_adi': 'Geçersiz Marka Adı',
          'brand_form_page_yetkili_kisi_bilgileri': 'Marka Başvurusu Yapan Yetkili Kişi Bilgileri',
          'brand_form_page_ad_soyad': 'Adı Soyadı',
          'brand_form_page_gecersiz_ad_soyad': 'Geçersiz Ad Soyad',
          'brand_form_page_telefon_numarasi': 'Telefon Numarası',
          'brand_form_page_gecersiz_telefon_numarasi': 'Geçersiz Telefon Numarası',
          'brand_form_page_iban_numarasi': 'IBAN Numarası',
          'brand_form_page_gecersiz_iban_numarasi': 'Geçersiz IBAN Numarası',
          'brand_form_page_mail_adresi': 'Mail Adresi',
          'brand_form_page_gecersiz_mail_adresi': 'Geçersiz Mail Adresi',
          'brand_form_page_gorevi_pozisyonu': 'Görevi/Pozisyonu',
          'brand_form_page_gecersiz_gorev_pozisyonu': 'Geçersiz Görev Pozisyonu',
          'brand_form_page_logo': 'Markanın Logosu',
          'brand_form_page_logo_info': 'Markanın logosu, 512x512 boyutlarında, png veya jpg formatında olmalıdır.',
          'brand_form_page_banner_gorseli': 'Markanın Banner Görseli',
          'brand_form_page_banner_gorseli_info':
              'Markanın banner görseli, 800x500 boyutlarında, png veya jpg formatında olmalıdır.',
          'brand_form_page_web_sitesi': 'Markanın Web Sitesi',
          'brand_form_page_gecersiz_web_sitesi': 'Geçersiz Web Site',
          'brand_form_page_markanin_mail_adresi': 'Markanın Mail Adresi',
          'brand_form_page_markanin_telefon_numarasi': 'Markanın Telefon Numarası',
          'brand_form_page_kurucu_ad_soyad': 'Markanın Kurucusunun Adı Soyadı',
          'brand_form_page_sektor': 'Sektör',
          'brand_form_page_il': 'İl',
          'brand_form_page_gecersiz_il': 'Geçersiz İl',
          'brand_form_page_ilce': 'İlçe',
          'brand_form_page_gecersiz_ilce': 'Geçersiz İlçe',
          'brand_form_page_mahalle': 'Mahalle',
          'brand_form_page_gecersiz_mahalle': 'Geçersiz Mahalle',
          'brand_form_page_vergi_levhasi': 'Vergi Levhası',
          'brand_form_page_vergi_levhasi_info': 'Vergi levhası pdf formatında olmalıdır.',
          'brand_form_page_vergi_numarasi': 'Vergi Numarası',
          'brand_form_page_gecersiz_vergi_numarasi': 'Geçersiz Vergi Numarası',
          'brand_form_page_vergi_dairesi': 'Vergi Dairesi',
          'brand_form_page_gecersiz_vergi_dairesi': 'Geçersiz Vergi Dairesi',
          'brand_form_page_sosyal_girisim': 'Sosyal Girişim',
          'brand_form_page_kategori': 'Kategori',
          'brand_form_page_gecersiz_kategori': 'Geçersiz Kategori',
          'brand_form_page_bagis_orani': 'Bağış Oranı',
          'brand_form_page_gecersiz_bagis_orani': 'Geçersiz Bağış Oranı',
          'brand_form_page_kategori_zaten_ekli': 'Bu kategori zaten ekli.',
          'brand_form_page_kategori_ekle': '+ Kategori Ekle',
          'brand_form_page_gonder': 'Gönder',
          'brand_form_page_logo_hatasi': 'Logo bilgisinde hata var.',
          'brand_form_page_banner_hatasi': 'Banner bilgisinde hata var.',
          'brand_form_page_sektor_hatasi': 'Sektör bilgisinde hata var.',
          'brand_form_page_adres_hatasi': 'Adres bilgisinde hata var.',
          'brand_form_page_vergi_levhasi_hatasi': 'Vergi levhası bilgisinde hata var.',
          'brand_form_page_kategori_hatasi': 'Kategori bilgisinde hata var.',
          'brand_form_page_kategori_orani_hatasi': 'Kategori bilgisinde hata var.',
          'brand_form_page_eksik_bilgi': 'Eksik bilgi girdiniz! Lütfen girdiğiniz verileri tekrar gözden geçirin',
          'brand_form_page_sonraki_alisverisin':
              'Sonraki alışverişinden bağış kazanacağından emin olman için bilmen gerekenler',
          'brand_form_page_adblock': 'Adblock ve diğer tarayıcı eklentilerini devre dışı bırakın',
          'brand_form_page_adblock_content':
              'Adblock gibi reklam önleyici programlar ve tarayıcı eklentileri çerezlerinizi kullanır ve/veya siler. Bu durumda Hangel üzerinden mağaza geçerek alışverişinizi tamamlasanız bile çerezleriniz takip edilemediğinden mağaza bağışlarınızı yansıtmayacaktır.',
          'brand_form_page_internet_tarayicisi':
              'İnternet tarayıcınızın çerezlere izin verecek şekilde etkinleştirildiğinden emin olun',
          'brand_form_page_internet_tarayicisi_content':
              'Mağazalar, Hangel üzerinden yaptığınız satın alma işlemini tanımlamak için çerezleri kullanır. Tanımlaması yapıldıktan sonra bağış hesabınıza eklenir. Platformumuz üzerinden mağazaya gitmeden önce lütfen tarayıcınızın çerezlere izin verdiğinden emin olun.',
          'brand_form_page_gizli_pencere':
              'Herhangi bir tarayıcıda özel veya gizli bir pencere ile alışverişinizi tamamlamayın',
          'brand_form_page_gizli_pencere_content':
              'Çerezlerinizin takibi gizli sekmede yapılamadığından, Hangel üzerinden gerçekleştirilen tıklama bilgileri mağazaya iletilemez. Bu nedenle bağışınız yansımayacaktır. Tıklama bilgisi bulunmadığından bağışınızın manuel eklenmesi de mümkün olmayacaktır.',
          'brand_form_page_diger_programlar': 'Diğer para iadesi/bağış programları kullanmayın',
          'brand_form_page_diger_programlar_content':
              'Hangel gibi diğer para iadesi/bağış/ödül/puan programları kullanıldığında aynı şekilde çerez takibi yapıldığı için mağazalar bağışlarınızı yansıtmamaktadır. Bu nedenle, alışverişinizi tamamlarken yalnızca Hangel’in açık olmasını tavsiye ediyoruz.',
          'brand_form_page_kupon_kodu': 'Yalnızca Hangel\'de bulunan kupon kodlarını kullanın',
          'brand_form_page_kupon_kodu_content':
              'Hangel platformunda listelenmeyen bir kupon kodu kullandıysanız (mağazanın kupon kodları, kupon kodu sitelerinden alınan kod gibi), bağışınız genelde mağaza tarafından yansıtılmamaktadır. Mağazalar kendi koşullarını belirlemekte olduğu için sitemizde belirtilmeyen kupon kodları kullanıldığında bağış tanımı yapılmamaktadır.',
          'brand_form_page_fiyat_karsilastirma':
              'Fiyat karşılaştırma veya kupon kodu sitelerini Hangel üzerinden alışverişiniz öncesinde ziyaret etmeyin',
          'brand_form_page_fiyat_karsilastirma_content':
              'Fiyat karşılaştırma ve kupon kodu siteleri, Hangel gibi mağazalardan satış komisyonu almaktadır. Bu işlem, yine Hangel gibi çerezlerinizin takibi ile sağlanmaktadır. Hangel ile alışverişinizi tamamlamadan önce bu siteleri ziyaret ettiğiniz takdirde çerezleriniz silinir/üzerine yazılır.',
          'brand_form_page_mobil_uygulama':
              'Mağazanın mobil uygulamasını (AliExpress ve/veya birkaç mağaza hariç) kullanmayın',
          'brand_form_page_mobil_uygulama_content':
              'Bir mobil cihaz üzerinden alışveriş yapıyorsanız, yalnızca web mağazalarının / rezervasyon hizmetinin tarayıcı sürümlerini kullanın. Satın alma/rezervasyon işlemlerinizi gerçekleştirmek için mağazanın mobil uygulamasını kullandığınız takdirde birkaç mağaza haricinde bağış verilmemektedir.',
          'brand_form_page_sepet': 'Alışveriş sepetinize yalnızca Hangel\'e tıkladıktan sonra ürün ekleyin',
          'brand_form_page_sepet_content':
              'Bazı mağazalar, alışverişinizi tamamlayarak Hangel’den bağış kazanmanızın koşulu olarak alışveriş sepetinizin boş olmasını istemektedirler.',
          'brand_form_page_diger_para_iadesi': 'Bağış yansımama problemini sık yaşıyorsanız çerezlerinizi temizleyin',
          'brand_form_page_diger_para_iadesi_content':
              'Bağış yansımama problemini sık yaşıyorsanız çerezlerinizi temizlemenizi tavsiye ediyoruz.',
          'brand_form_page_site_ziyaret': 'Hangel üzerinden mağazaya tıklamadan alışverişinizi tamamlamayın',
          'brand_form_page_site_ziyaret_content':
              'Hangel\'e tıklamadan önce mağazayı ziyaret ettiyseniz, mağaza ilk önce doğrudan çerez takibini yapamadığından Hangel bağışlarınızı yansıtmayacaktır.',
          'brand_form_page_ortak_sirketler':
              'Hangel ile ortak olan mağazaların reklamını yapan siteleri ziyaret etmekten kaçının',
          'brand_form_page_ortak_sirketler_content':
              'Satın alma işleminiz sırasında reklam afişleri veya linkleri olan başka sekmeleriniz varsa, bağışınız yansımayacaktır.',
          'brand_form_page_telefon_siparis': 'Telefonla sipariş vermeyin',
          'brand_form_page_telefon_siparis_content':
              'Telefonla sipariş/rezervasyonlarda hiçbir mağaza bağış vermemektedir.',
          'brand_form_page_farkli_ulke':
              'Başka bir ülkenin mağaza sayfasından sipariş vermeyin (örn. AliExpress Rusya)',
          'brand_form_page_farkli_ulke_content':
              'Sadece Hangel platformunun linkleri üzerinden yapılan alışverişler için bağış kazanabilirsiniz.',
          'brand_form_page_markanin_ozel_kosullari':
              'Alışverişinizi tamamlamadan önce mağazanın özel koşullarına göz atın',
          'brand_form_page_markanin_ozel_kosullari_content':
              'Bazı ürünler veya satıcılar da bağış programına dahil edilmeyebilir.',
          'brand_form_page_tamam': 'Tamam',

          // DonationHistoryPage Keys...
          'donation_history_page_bagislarim': 'Bağışlarım',
          'donation_history_page_total_donation_error': 'Toplam bağış miktarı alınırken bir hata oluştu.',
          'donation_history_page_realized_donation': 'Gerçekleşen Bağış',
          'donation_history_page_no_donations': 'Hiç bağış bulunamadı.',
          'donation_history_page_donation_details': 'Bağış Detayları',
          'donation_history_page_stk1_error': 'STK1 bilgisi alınamadı',
          'donation_history_page_stk2_error': 'STK2 bilgisi alınamadı',
          'donation_history_page_close': 'Kapat',
          'donation_history_page_donated_stks': 'Bağış Yapılan STK\'lar',
          'donation_history_page_brand': 'Marka',
          'donation_history_page_brand_loading': 'Marka Yükleniyor...',
          'donation_history_page_retry_brand': 'Markayı Yeniden Yükle',
          'donation_history_page_brand_info_error': 'Marka Bilgisi Alınamadı',
          'donation_history_page_amount': 'Tutar',
          'donation_history_page_donation_amount': 'Bağış Tutarı',
          'donation_history_page_order_number': 'Sipariş Numarası',
          'donation_history_page_order_date': 'Sipariş Tarihi',

          // FavoritesPage Keys...
          'favorites_page_title': 'Favorilerim',
          'favorites_page_search_hint': 'Arama yapın...',
          'favorites_page_favorilerim': 'Favorilerim',
          'favorites_page_markalar': 'Markalar',
          'favorites_page_stklar': "STK'lar",
          'favorites_page_error_occurred': 'Bir hata oluştu.',
          'favorites_page_no_favorites_brands': 'Favori markanız bulunmamaktadır.',
          'favorites_page_no_favorites_stks': 'Favori STK\'nız bulunmamaktadır.',
          'favorites_page_brand_loading': 'Marka Yükleniyor...',
          'favorites_page_retry_brand': 'Markayı Yeniden Yükle',
          'favorites_page_brand_info_error': 'Marka Bilgisi Alınamadı',
          'favorites_page_amount': 'Tutar',

          // FrequentlyAskedQuestionsPage Keys...
          'faq_page_title': 'Sıkça Sorulan Sorular',
          'faq_question_1_title': 'Hangi veriler politikanız nedir?',
          'faq_question_1_description':
              'Üyelerin (kullanıcıların) bize sağladığı adları, adresleri, e-posta adreslerini ve Hediye Yardımı beyanlarını saklıyoruz. Ayrıca yöneticiler tarafından bize sağlanan ilgili kişi adlarını, adreslerini, e-posta adreslerini ve telefon numaralarını da belirli amaçlarla saklıyoruz. Ayrıca kullanıcıların hangel üzerinden desteklediği STK ve alışveriş yaptığı marka bilgilerini tutuyoruz.',
          'faq_question_2_title': "Verilerinizi 'depoladığımız' ve 'işlediğimiz' yasal dayanaklar nelerdir?",
          'faq_question_2_description':
              "Üyeliğinizi, desteklediğiniz amaçları ve sağladığınız bağışları kaydedebilmemizde 'meşru menfaat' bulunduğu için verilerinizi saklıyoruz. Hesabınızla ilgili bilgileri size düzenli olarak göndereceğiz ve yaptığınız değişiklikleri onaylayacağız. Ayrıca teklifler, önemli ipuçları, yeni özellikler vb. ile ilgili olabilecek çeşitli pazarlama e-postaları da gönderiyoruz. Bu e-postalar için açık 'onay'a ihtiyacımız var ve bunun doğru bir şekilde kaydedildiğinden emin olmak için mevcut hedef kitlemizden yeniden onay istedik.",
          'faq_question_3_title': "Verilerimin silinmesini isteyebilir miyim?",
          'faq_question_3_description':
              "Hakkınızda tuttuğumuz bilgilerin bu bilgilerin değiştirilmesini veya silinmesini isteme hakkına sahipsiniz. Verilerinizin gizli tutulmasını ve yalnızca ilgili kişiler tarafından faaliyetlerimizin gerçekleştirilmesi amacıyla kullanılmasını sağlayacaktır. Sağladığımız hizmetleri (örn. e-posta pazarlaması, sorgu yönetimi vb.) sunmak için gerekli olmadığı sürece bu bilgileri hiçbir resmî kuruluşla paylaşmayız.",
          'faq_question_4_title': "Yaptığım doğrudan bağış neden hesabımda görünmüyor?",
          'faq_question_4_description':
              "Bir amaç için Doğrudan Bağış yaptıysanız bağışın destekçi hesabınızda görünmesi bir kaç hafta kadar sürebilir. Bu süre sonunda doğrudan bağışınız görünmüyorsa, lütfen Bize iletişim formu seçeneğini kullanarak bizimle iletişime geçin.",
          'faq_question_5_title': "Aylık yıllık abonelik ücreti var mı?",
          'faq_question_5_description':
              "Kullanıcılar, markalar, STK’lar veya özel izin ile bağış toplayan kişiler hiç bir şekilde aidat veya benzeri bir ödeme yapmazlar.",
          'faq_question_6_title': "Kullanıcılar destekledikleri amaçları hangi koşullarda değiştirebilirler?",
          'faq_question_6_description':
              "İlk üye olduğunda 1 dernek seçmiyoruz bir amacı destek üzere gelen kullanıcının çapraz destekler ile farklı amaçları da desteklemesini amaçladığımız için en az 2 amacı desteklemesini bekliyoruz. 2’den fazla dernek seçilmesini desteklememizin sebebi ise desteklenen amacın daha etkin bağış toplayabilmesi.",
          'faq_question_7_title': "Desteklediğim amacımı ne zamana değiştirebilirim?",
          'faq_question_7_description': "Seçim yaptığın tarihten 21 gün sonra değiştirebilirsin.",
          'faq_question_8_title': "Bağış Yüzdesi ve Hediye Yardımı - Nasıl çalışır?",
          'faq_question_8_description':
              "Yaptığınız alışverişlerden elde edilen komisyonlar artık hangel ile sosyal faydaya dönüşüyor. Desteğinizle sosyal faydaya ortak oluyor, sosyal sorunların çözümüne ortak oluyorsunuz.",
          'faq_question_9_title': "Nasıl üye olurum?",
          'faq_question_9_description':
              "Kullandığınız telefonun altyapısına göre App Store den mail uygulamayı ediniyorsunuz.",
          'faq_question_10_title': "Hangel sosyal etki fonu",
          'faq_question_10_description':
              "Sosyal Etkisi fonumuz, sosyal sorunlarımızı çözmeyi amaçlayan sosyal girişimlerindeki destekleyen ve çözüm için sürdürülebilirlik açısından hayati önem taşıyan kuruluşlara cansuyu amacıyla çok ihtiyaç duyulan gelirin sağlanmasına yardımcı olur. Okullardan, hayır kurumlarından (hem büyük hem de küçük), topluluk gruplarından, amatör spor kulüplerinden ve sosyal girişimlerden oluşan bu muhteşem koleksiyonun devam etmek için umutsuzca ek desteğe ihtiyacı var. Ne kadar büyük ya da küçük olursa olsun tüm iyi amaçları destekleme konusunda tutkuluyuz; Birlikte etkili bir fark yaratmak için Veren Bir Ulus inşa ediyoruz. Yatılısınız bekliyoruz.",

          // ProfilePage Keys...
          'profile_page_title': 'Profilim',
          'profile_page_add_photo': 'Fotoğraf Ekle',
          'profile_page_supported_ngos': 'Desteklediğin STK\'lar',
          'profile_page_error_occurred': 'Bir hata oluştu.',
          'profile_page_total_donation': 'Toplam Bağış Miktarı',
          'profile_page_donation_count': 'Bağış İşlem Sayısı',
          'profile_page_membership_date': 'Üye Olduğu Tarih',
          'profile_page_volunteer_organizations': 'Görev Aldığı Kuruluşlar',
          'profile_page_project_count': 'Proje Sayısı',
          'profile_page_total_hours': 'Toplam Saat',
          'profile_page_gender': 'Cinsiyet',
          'profile_page_email': 'Email',
          'profile_page_phone': 'Telefon',
          'profile_page_birth_date': 'Doğum Tarihi',
          'profile_page_location': 'İl/İlçe/Mahalle',
          'profile_page_update_info': 'Bilgileri Güncelle',
          'profile_page_stk_application_form': 'STK Başvuru Formu',
          'profile_page_stk_application_form_button': 'STK Başvuru Formu',
          'profile_page_brand_application_form_button': 'Marka Başvuru Formu',
          'profile_page_stk_volunteer_form_button': 'Gönüllü İlanı Formu',

          'profile_page_personal_info': 'Kişisel Bilgiler',
          'profile_page_volunteer': 'Gönüllü',
          'profile_page_statistics': 'İstatistikler',

          'profile_page_no_supported_ngos': 'Desteklenen STK\'lar bulunmamaktadır.',
          // STKDetailPage Keys...
          'stk_detail_about': 'Hakkında',
          'stk_detail_join_date_label': 'Platforma Katılma Tarihi: ',
          'stk_detail_earthquake_zone': 'Deprem Bölgesi',
          'stk_detail_total_donation': 'Toplam Bağış',
          'stk_detail_process_count': 'İşlem Sayısı',
          'stk_detail_donor_count': 'Bağışçı Sayısı',
          'stk_detail_type': 'Türü',
          'stk_detail_categories': 'Kategorileri',
          'stk_detail_un_goals': 'BM Sürdürülebilirlik Amaçları',
          'stk_detail_field': 'Alanı',
          'stk_detail_general_info': 'Genel Bilgiler',
          'stk_detail_statistics': 'İstatistikler',
          // STKFormWidget Keys...
          'stk_form_invalid_registry_number': 'Geçersiz Kütük Numarası',
          'stk_form_invalid_tax_number': 'Geçersiz Vergi Numarası',
          'stk_form_invalid_short_name': 'Geçersiz Kısa İsim',
          'stk_form_invalid_full_name': 'Geçersiz Tam İsim',
          'stk_form_invalid_iban': 'Geçersiz IBAN Numarası',
          'stk_form_invalid_contact_person_name': 'Geçersiz Ad Soyad',
          'stk_form_invalid_contact_person_phone': 'Geçersiz Telefon Numarası',
          'stk_form_invalid_contact_person_email': 'Geçersiz Mail Adresi',
          'stk_form_invalid_contact_person_job': 'Geçersiz Görev/Pozisyon',
          'stk_form_invalid_website': 'Geçersiz Web sitesi',
          'stk_form_invalid_email': 'Geçersiz Mail Adresi',
          'stk_form_invalid_phone': 'Geçersiz Telefon Numarası',
          'stk_form_invalid_founder_name': 'Geçersiz Kurucu Adı Soyadı',
          'stk_form_invalid_logo': 'Logo doğru biçimde yüklenmedi.',
          'stk_form_invalid_address_info': 'Adres bilgilerinde hata var.',
          'stk_form_invalid_tuzuk': 'Tüzük dosyasında hata var.',
          'stk_form_invalid_faaliyet': 'Faaliyet belgesinde hata var.',
          'stk_form_invalid_sector': 'Faaliyet alanı bilgisinde hata var.',
          'stk_form_invalid_category': 'Kategori bilgisinde hata var.',
          'stk_form_invalid_bm': 'BM amaçları bilgisinde hata var',
          'stk_form_invalid_type': 'STK türünde hata var',
          'stk_form_incomplete_info': 'Eksik bilgi girdiniz! Lütfen girdiğiniz verileri tekrar gözden geçirin',
          // SelectFavoriteStkPage Keys...
          'select_favorite_stk_title': 'Favori STK Seç',
          'select_favorite_stk_skip': 'Atla',
          'select_favorite_stk_instruction':
              '30 gün süreyle desteklemek istediğin STK’yı seç. Unutma desteklediğin STK’yı 30 gün sonra değiştirebilirsin.',
          'select_favorite_stk_all': 'Tümü',
          'select_favorite_stk_association': 'Dernek',
          'select_favorite_stk_foundation': 'Vakıf',
          'select_favorite_stk_special_permission': 'Özel İzinli',
          'select_favorite_stk_min_error': 'En az 2 STK seçmelisiniz!',
          'select_favorite_stk_max_error': 'En fazla 2 STK seçebilirsiniz!',
          'select_favorite_stk_success': 'Favori STK\'lar başarıyla güncellendi',
          'select_favorite_stk_error_code': 'Bir hata ile karşılaşıldı!\nHata Kodu:00321',
          'select_favorite_stk_sort_name': 'İsme Göre',
          'select_favorite_stk_sort_favorite_count': 'Favori Sayısına Göre',
          'select_favorite_stk_sort_donor_count': 'Bağışçı Sayısına Göre',
          'select_favorite_stk_filter_all': 'Tümü',
          'select_favorite_stk_filter_earthquake': 'Deprem Bölgesi',
          'select_favorite_stk_filter_special_status': 'Özel Statü',
          'select_favorite_stk_animals': 'Hayvanlar',
          'select_favorite_stk_poverty': 'Yoksullar',
          'select_favorite_stk_education': 'Eğitim',
          'select_favorite_stk_health': 'Sağlık',
          'select_favorite_stk_agriculture': 'Tarım',
          'select_favorite_stk_refugees': 'Mülteci',
          'select_favorite_stk_law': 'Hukuk',
          'select_favorite_stk_earthquake': 'Deprem',
          'select_favorite_stk_food': 'Gıda',
          'select_favorite_stk_religious': 'Dini',
          'select_favorite_stk_social_entrepreneurship': 'Sosyal Girişimcilik',
          'select_favorite_stk_entrepreneurship': 'Girişimcilik',
          'select_favorite_stk_culture_art': 'Kültür Sanat',
          'select_favorite_stk_sports': 'Spor',
          'marka_favorilemediniz': 'Henüz bir Marka favorilemediniz.',
          'stk_eklemediniz': 'Henüz bir STK eklemediniz.',
          'marka_gozat': 'Markalara Göz At',
          // STKPage Keys...
          'stk_page_all': 'Tümü',
          'stk_page_associations': 'Dernek',
          'stk_page_foundations': 'Vakıf',
          'stk_page_special_permissions': 'Özel İzinli',
          'stk_page_stks': 'STK\'lar',
          'stk_page_filter_earthquake_zone': 'Deprem Bölgesi',
          'stk_page_filter_special_status': 'Özel Statü',
          'stk_page_filter_all': 'Tümü',
          'stk_page_sort_by_name': 'İsme Göre',
          'stk_page_sort_by_favorite': 'Favori Sayısına Göre',
          'stk_page_sort_by_donor': 'Bağışçı Sayısına Göre',
          'basvuruldu': 'Başvuruldu',
          'basvur': 'Başvur',
          'kisi_basvurdu': 'kişi başvurdu',
          'gonullu_ilanlari': 'STK Gönüllü İlanları',
          // SettingsPage Keys...
          'settings_page_title': 'Ayarlar',
          'settings_page_about_us': 'Hakkımızda',
          'settings_page_user_agreement': 'Kullanıcı Sözleşmesi',
          'settings_page_privacy_policy': 'Gizlilik Sözleşmesi',
          'settings_page_faq': 'S.S.S',
          'settings_page_user_agreement_text': """
  Hangel uygulamasını kullanmadan önce bu Kullanıcı Sözleşmesi'ni ("Sözleşme") dikkatlice okumanız önemlidir. Bu Sözleşme, Hangel'in ("Şirket", "biz", "bize") sunduğu Hangel uygulamasını ("Uygulama") kullanımınızla ilgili şartları ve koşulları belirler.

  1. Kabul
  Uygulamayı kullanarak bu Sözleşmeyi kabul etmiş sayılırsınız. Bu Sözleşmeyi kabul etmiyorsanız Uygulamayı kullanmamalısınız.

  2. Değişiklikler
  Bu Sözleşmeyi zaman zaman değiştirebiliriz. Değişiklikler yürürlüğe girdiğinde sizi bilgilendireceğiz. Değişiklikleri kabul etmiyorsanız Uygulamayı kullanmayı bırakmalısınız.

  3. Uygulamanın Kullanımı
  Uygulamayı yalnızca yasal ve etik amaçlar için kullanabilirsiniz. Uygulamayı kullanarak aşağıdakileri yapmayı kabul etmiyorsunuz:
  Yasa dışı veya zararlı herhangi bir faaliyet için Uygulamayı kullanmak.
  Telif hakkı, ticari marka veya diğer fikri mülkiyet haklarını ihlal eden herhangi bir içerik yüklemek veya paylaşmak.
  Nefret söylemi, tehdit veya taciz içeren herhangi bir içerik yüklemek veya paylaşmak.
  Spam veya istenmeyen e-posta göndermek.
  Virüs veya diğer zararlı yazılımlar yüklemek veya yaymak.
  Şirketin veya üçüncü tarafların sistemlerine yetkisiz erişim sağlamaya çalışmak.

  4. Mülkiyet
  Uygulama ve tüm içeriği Şirket'e aittir. Uygulamayı kullanmanız size herhangi bir mülkiyet hakkı vermez.

  5. Sorumluluk Reddi
  Uygulamayı "olduğu gibi" ve "mevcut olduğu şekilde" kabul edersiniz. Şirket, Uygulamanın kesintisiz veya hatasız çalışacağını garanti etmez. Şirket, Uygulamanın kullanımıyla bağlantılı olarak ortaya çıkan herhangi bir doğrudan veya dolaylı zarardan sorumlu değildir.

  6. Fesih
  Şirket, herhangi bir zamanda ve herhangi bir nedenle, Uygulamanıza erişimi sonlandırma veya Uygulamayı kapatma hakkına sahiptir.

  7. Uyuşmazlık Çözümü
  Bu Sözleşmeden kaynaklanan veya bu Sözleşmeyle ilgili herhangi bir uyuşmazlık, Türkiye Cumhuriyeti yasalarına göre çözümlenecektir.

  8. Yürürlük
  Bu Sözleşme, 12 Mart 2024 tarihinde yürürlüğe girmiştir.

  9. İletişim
  Bu Sözleşmeyle ilgili herhangi bir sorunuz varsa lütfen bizimle iletişime geçin.
  """,
          'settings_page_privacy_policy_text': """
  Hangel uygulamasını kullanmadan önce bu Gizlilik Sözleşmesi'ni ("Sözleşme") dikkatlice okumanız önemlidir. Bu Sözleşme, Hangel'in ("Şirket", "biz", "bize") hangi bilgileri topladığını, bu bilgileri nasıl kullandığını ve paylaştığını ve bu bilgileri korumak için aldığımız önlemleri açıklar.

  1. Topladığımız Bilgiler
  Sizden aşağıdaki bilgileri toplayabiliriz:
  Kişisel Bilgiler: Adınız, soyadınız, e-posta adresiniz, telefon numaranız, adresiniz ve doğum tarihiniz gibi bilgileri içerir.
  Hesap Bilgileri: Kullanıcı adınız, şifreniz ve profil resminiz gibi bilgileri içerir.
  Alışveriş Bilgileri: Satın aldığınız ürünler, alışveriş tarihleriniz ve tutarlarınız gibi bilgileri içerir.
  Cihaz Bilgileri: IP adresiniz, işletim sisteminiz, tarayıcı türünüz ve benzeri bilgiler gibi cihazınız hakkında bilgi içerir.
  Kullanım Bilgileri: Hangel uygulamasını nasıl kullandığınız hakkında bilgi içerir.

  2. Bilgileri Nasıl Kullanıyoruz
  Topladığımız bilgileri aşağıdaki amaçlar için kullanabiliriz:
  Hangel uygulamasını size sunmak ve geliştirmek: Hesabınızı oluşturmak, alışverişlerinizi işlemek ve size en iyi deneyimi sunmak için bilgilerinizi kullanırız.
  İletişim kurmak: Sizi uygulama ile ilgili güncellemeler, promosyonlar ve diğer bilgiler hakkında bilgilendirmek için bilgilerinizi kullanırız.
  Reklam sunmak: Size ilgi alanlarınızla alakalı reklamlar sunmak için bilgilerinizi kullanırız.
  Araştırma ve geliştirme: Hangel uygulamasını ve hizmetlerimizi geliştirmek için bilgilerinizi kullanırız.
  Yasal gerekliliklere uymak: Yasal gerekliliklere uymak ve yasal taleplere yanıt vermek için bilgilerinizi kullanırız.

  3. Bilgileri Nasıl Paylaşıyoruz
  Topladığınız bilgileri aşağıdaki durumlarda üçüncü taraflarla paylaşabiliriz:
  Hizmet sağlayıcılar: Hangel uygulamasını size sunmak için kullandığımız üçüncü taraf hizmet sağlayıcılarıyla bilgilerinizi paylaşabiliriz.
  Yasal gereklilikler: Yasal gerekliliklere uymak veya yasal taleplere yanıt vermek için bilgilerinizi paylaşabiliriz.
  Reklamverenler: Size ilgi alanlarınızla alakalı reklamlar sunmak için bilgilerinizi reklamverenlerle paylaşabiliriz.
  Anonimleştirilmiş veriler: Kişisel olarak sizi tanımlamayan anonimleştirilmiş verileri araştırma ve geliştirme amaçlı olarak üçüncü taraflarla paylaşabiliriz.

  4. Güvenlik
  Bilgilerinizi korumak için teknik ve idari güvenlik önlemleri alıyoruz. Bu önlemler şunları içerir:
  Verilerinizin şifrelenmesi
  Güvenli veri merkezlerinin kullanımı
  Erişim kontrollerinin uygulanması
  Güvenlik personelinin eğitilmesi

  5. Haklarınız
  Kişisel bilgilerinizle ilgili aşağıdaki haklara sahipsiniz:
  Erişim: Kişisel bilgilerinizin bir kopyasını talep etme hakkınız vardır.
  Düzeltilme: Hatalı veya eksik olan kişisel bilgilerinizi düzeltme hakkınız vardır.
  Silme: Kişisel bilgilerinizin silinmesini talep etme hakkınız vardır.
  İşlemeyi kısıtlama: Kişisel bilgilerinizin işlenmesini kısıtlama hakkınız vardır.
  Taşınabilirlik: Kişisel bilgilerinizi başka bir kontrolcüye aktarma hakkınız vardır.
  İtiraz: Kişisel bilgilerinizin işlenmesine itiraz etme hakkınız vardır.

  6. Değişiklikler
  Bu Gizlilik Sözleşmesi'ni zaman zaman değiştirebiliriz. Değişiklikler yürürlüğe girdiğinde sizi bilgilendireceğiz.

  7. İletişim
  Bu Gizlilik Sözleşmesi ile ilgili herhangi bir sorunuz varsa lütfen bizimle iletişime geçin.

  8. Yürürlük
  Bu Gizlilik Sözleşmesi, 12 Mart 2024 tarihinde yürürlüğe girmiştir.
  """,
          // BrandDetailPage Keys...

          'yes': 'Evet',
          'no': 'Hayır',
          'info': 'Bilgiler',
          'statistics': 'İstatistikler',
          'ara': 'Ara',

          // BrandDetailPage Keys...

          'brand_detail_page_join_date_label': 'Platforma Katılma Tarihi: ',
        },
        'en_US': {
          "user_ban_page_description": "Your account has been marked as inactive. If you think there is a mistake, you can contact us.",
          "stk_form_validation_error": "Please fill in the required fields",
          "stk_form_type": "Type",
          "stk_form_type_association": "Association",
          "stk_form_type_foundation": "Foundation",
          "stk_form_type_sports_club": "Sports Club",
          "stk_form_type_special_permission": "Collecting donations with special permission",
          "stk_form_invalid_id_no": "Please enter a valid ID No",
          "stk_form_tax_number": "Tax Number",
          "stk_form_invalid_tax_number": "Please enter a valid tax number",
          "stk_form_tax_office": "Tax Office",
          "stk_form_invalid_tax_office": "Please enter a valid tax office",
          "stk_form_short_name": "Short Name",
          "stk_form_invalid_short_name": "Please enter a valid short name",
          "stk_form_full_name": "Full Name",
          "stk_form_invalid_full_name": "Please enter a valid full name",
          "stk_form_establishment_year": "Establishment Year",
          "stk_form_invalid_establishment_year": "Please enter a valid establishment year",
          "stk_form_iban_no": "IBAN No",
          "stk_form_invalid_iban": "Please enter a valid IBAN",
          "stk_form_logo": "Logo",
          "stk_form_logo_info": "Your logo must be 512x512 in size, in PNG or JPG format.",
          "stk_form_website": "Website",
          "stk_form_invalid_website": "Please enter a valid website",
          "stk_form_email": "Email Address",
          "stk_form_invalid_email": "Please enter a valid email address",
          "stk_form_phone": "Phone Number",
          "stk_form_invalid_phone": "Please enter a valid phone number",
          "stk_form_city": "City",
          "stk_form_district": "District",
          "stk_form_neighborhood": "Neighborhood",
          "stk_form_remaining_address": "Remaining Address Information",
          "stk_form_invalid_remaining_address": "Please enter the address details",
          "stk_form_statute": "Association Statute, Foundation Deed",
          "stk_form_statute_info": "The file must be in PDF format and less than 6MB.",
          "stk_form_activity_certificate": "Activity Certificate",
          "stk_form_activity_certificate_info":
              "The file must be in PDF format, less than 6MB, and obtained within the last 7 business days.",
          "stk_form_activity_area": "Activity Area in Directorate",
          "stk_form_beneficiaries": "Beneficiaries",
          "stk_form_un_sdgs": "UN Sustainable Development Goals",
          "stk_form_applicant_info": "Applicant Information",
          "stk_form_applicant_name": "Name and Surname",
          "stk_form_invalid_applicant_name": "Please enter a valid name",
          "stk_form_applicant_phone": "Phone Number",
          "stk_form_invalid_applicant_phone": "Please enter a valid phone number",
          "stk_form_applicant_email": "Email Address",
          "stk_form_invalid_applicant_email": "Please enter a valid email address",
          "stk_form_applicant_position": "Position",
          "stk_form_invalid_applicant_position": "Please enter a valid position",
          "stk_form_governorate_permission_document": "Governorate Permission Document",
          "stk_form_governorate_permission_document_info": "The file must be in JPG or PDF format.",
          "stk_form_stk_il_mudurlugu_yetki_belgesi": "Directorate Authorization Certificate",
          "stk_form_stk_il_mudurlugu_yetki_belgesi_info": "The file must be in JPG or PDF format.",
          "stk_form_permission_start_date": "Permission Start Date",
          "stk_form_invalid_permission_start_date": "Please select a valid date",
          "stk_form_permission_end_date": "Permission End Date",
          "stk_form_invalid_permission_end_date": "Please select a valid date",
          "stk_form_permission_granting_governorate": "Granting Governorate",
          "stk_form_activity_number": "Activity Number",
          "stk_form_invalid_activity_number": "Please enter a valid activity number",
          "stk_form_campaign_name": "Campaign Name",
          "stk_form_invalid_campaign_name": "Please enter a valid campaign name",
          "stk_form_birth_date": "Date of Birth",
          "stk_form_invalid_birth_date": "Please select a valid date",
          "stk_form_photo": "Photo",
          "stk_form_photo_info": "The photo must be in PNG or JPG format.",
          "stk_form_permission_purpose": "Purpose of Permission",
          "stk_form_invalid_permission_purpose": "Please enter the purpose of the permission",
          "stk_form_applicant_relation": "Relationship Degree",
          "stk_form_invalid_applicant_relation": "Please enter the relationship degree",
          "stk_form_submit": "Submit",
          "stk_form_registry_number": "Registry Number",
          "stk_form_registry_number_foundation": "Foundation Number",
          "stk_form_sector_professional_associations": "Professional Associations",
          "stk_form_sector_religious_services": "Religious Services Associations",
          "stk_form_sector_sports": "Sports and Related Associations",
          "stk_form_sector_humanitarian_aid": "Humanitarian Aid Associations",
          "stk_form_sector_education_research": "Educational Research Associations",
          "stk_form_sector_culture_art_tourism": "Culture, Art, and Tourism Associations",
          "stk_form_sector_social_values": "Social Values Associations",
          "stk_form_sector_environment": "Environment and Wildlife Protection Associations",
          "stk_form_sector_health": "Health Associations",
          "stk_form_sector_personal_development": "Personal and Social Development Associations",
          "stk_form_sector_urban_development": "Urban Planning and Development Associations",
          "stk_form_sector_advocacy": "Advocacy Associations",
          "stk_form_sector_disabilities": "Associations for People with Disabilities",
          "stk_form_sector_thought_based": "Thought-Based Associations",
          "stk_form_sector_public_support": "Public Support Associations",
          "stk_form_sector_food_agriculture": "Food and Agriculture Associations",
          "stk_form_sector_diaspora": "Diaspora Associations",
          "stk_form_sector_international_cooperation": "International Cooperation Associations",
          "stk_form_sector_veterans": "Veterans' Associations",
          "stk_form_sector_elderly_children": "Associations for Elderly and Children",
          "stk_form_sector_children": "Children's Associations",
          "stk_form_sector_other": "Other",
          "stk_form_beneficiaries_animals": "Animals",
          "stk_form_beneficiaries_poor": "The Poor",
          "stk_form_beneficiaries_education": "Education",
          "stk_form_beneficiaries_health": "Health",
          "stk_form_beneficiaries_agriculture": "Agriculture",
          "stk_form_beneficiaries_refugees": "Refugees",
          "stk_form_beneficiaries_law": "Law",
          "stk_form_beneficiaries_earthquake": "Earthquake",
          "stk_form_beneficiaries_food": "Food",
          "stk_form_beneficiaries_religious": "Religious",
          "stk_form_beneficiaries_social_entrepreneurship": "Social Entrepreneurship",
          "stk_form_beneficiaries_entrepreneurship": "Entrepreneurship",
          "stk_form_beneficiaries_culture_art": "Culture and Art",
          "stk_form_beneficiaries_sports": "Sports",
          "stk_form_un_goal_no_poverty": "No Poverty",
          "stk_form_un_goal_zero_hunger": "Zero Hunger",
          "stk_form_un_goal_good_health": "Good Health and Well-being",
          "stk_form_un_goal_quality_education": "Quality Education",
          "stk_form_un_goal_gender_equality": "Gender Equality",
          "stk_form_un_goal_clean_water": "Clean Water and Sanitation",
          "stk_form_un_goal_clean_energy": "Affordable and Clean Energy",
          "stk_form_un_goal_decent_work": "Decent Work and Economic Growth",
          "stk_form_un_goal_industry": "Industry, Innovation, and Infrastructure",
          "stk_form_un_goal_reduced_inequalities": "Reduced Inequalities",
          "stk_form_un_goal_sustainable_cities": "Sustainable Cities and Communities",
          "stk_form_un_goal_responsible_consumption": "Responsible Consumption and Production",
          "stk_form_un_goal_climate_action": "Climate Action",
          "stk_form_un_goal_life_below_water": "Life Below Water",
          "stk_form_un_goal_life_on_land": "Life on Land",
          "stk_form_un_goal_peace_justice": "Peace, Justice, and Strong Institutions",
          "stk_form_un_goal_partnerships": "Partnerships for the Goals",
          "missing_donation_form_page_title": "My Donation is Not Showing",
          "missing_donation_form_brand": "Brand",
          "missing_donation_form_order_number": "Order Number",
          "missing_donation_form_date": "Date",
          "missing_donation_form_cart_amount": "Cart Amount",
          "missing_donation_form_registry_id": "Registry ID",
          "missing_donation_form_phone": "Phone Number",
          "missing_donation_form_send": "Send",
          "missing_donation_form_fill_all_fields": "Please fill all fields",
          "missing_donation_form_invalid_phone": "Please enter a valid phone number",
          "missing_donation_form_success": "Your request has been sent successfully",
          "missing_donation_form_error": "An error occurred while sending your request",
          "support_form_name": "Name Surname",
          "support_form_email": "Email",
          "support_form_phone": "Phone",
          "support_form_user_type": "User Type",
          "support_form_user_type_individual": "I am an Individual User",
          "support_form_user_type_stk_manager": "I am an NGO Manager",
          "support_form_user_type_brand_manager": "I am a Brand Manager",
          "support_form_subject": "Subject",
          "support_form_message": "Message",
          "support_form_send": "Send",
          "support_form_invalid_email": "Please enter a valid email",
          "support_form_invalid_phone": "Please enter a valid phone number",
          "support_form_fill_all_fields": "Please fill all fields",
          "support_form_invalid_name": "Please enter a valid name",
          "support_form_invalid_subject": "Please enter a subject",
          "support_form_invalid_message": "Please enter a message",
          "donation_history_page_my_donation_not_showing": "My donation is not showing",

          'settings_page_change_language': 'Change Language',

          // HomePage Keys...

          'home_page_donation_rate': 'Donation Rate',

          'home_page_connection_problem': 'Connection Problem!',

          'home_page_search_brand': 'Search Brand',

          'home_page_brands': 'Brands',

          'home_page_all': 'All',

          'home_page_sort_donation_rate_desc': 'Donation rate high to low',

          'home_page_sort_donation_rate_asc': 'Donation rate low to high',

          'home_page_sort_newest_oldest': 'Newest to oldest',

          'home_page_sort_oldest_newest': 'Oldest to newest',

          'home_page_sort_a_z': 'A-Z',

          'home_page_sort_z_a': 'Z-A',

          // RegisterPage Keys...

          'register_page_create_account': 'Create Account',

          'register_page_login': 'Log In',

          'register_page_full_name': 'Full Name',

          'register_page_phone_number': 'Phone Number',

          'register_page_enter_phone': 'Enter your phone number',

          'register_page_user_agreement': 'I have read and accept the User Agreement.',

          'register_page_privacy_agreement': 'I have read and accept the Privacy Agreement.',

          'register_page_error_fill_all_fields': 'Please fill all fields correctly!',

          'register_page_error_accept_agreements': 'Please accept the agreements!',

          'register_page_error_unexpected': 'An unexpected error occurred. Please try again',

          'register_page_error_invalid_code': 'Please enter the code correctly!',

          'register_page_verify_code_prompt': 'Please enter the 6-digit code sent to your phone.',

          'register_page_resend_code': 'Resend',

          'register_page_didnt_receive_code': 'Didn’t receive the verification code?',

          'register_page_verify': 'Verify',

          'register_page_login_register_prompt_login': 'Don’t have an account? ',

          'register_page_login_register_prompt_register': 'Already have an account? ',

          'register_page_login_register_action_login': 'Log In',

          'register_page_login_register_action_register': 'Register',

          // AboutUsPage Keys...

          'about_us_page_title': 'About Us',

          'about_us_page_description': """

  Hangel is an application that allows people to donate the points they earn from their shopping to non-governmental organizations (NGOs). Our mission is to facilitate donations and enable every individual to support the NGOs they love.


  How It Works?

  Download the Hangel app and create an account.

  Select your favorite NGOs in the app.

  Choose Hangel as the payment method with your credit or debit card during your shopping.

  Earn points from your purchases.

  Donate the points you earn to the NGOs you selected.


  Why Hangel?

  Easy and practical: No need to spend minutes to make a donation. You can support your favorite NGOs by earning points from your shopping.

  Safe and transparent: All your transactions are conducted securely. You can transparently track where your donations go.

  Social responsibility: Let your shopping have a meaning with Hangel. Contribute to society by supporting your favorite NGOs.


  With Hangel, you can:

  Support your favorite NGOs.

  Track where your donations go.

  Earn points from your purchases to make more donations.

  Contribute to social responsibility projects.


  Join Hangel!

  By joining Hangel, you can also contribute to the NGOs you love and benefit society. Download the app now and start making a difference!

  """,

          // AppViewPage Keys...

          'app_view_about_us_title': 'About Us',

          'app_view_drawer_greeting': 'Hello,',

          'app_view_drawer_profile': 'My Profile',

          'app_view_drawer_donations': 'My Donations',

          'app_view_drawer_stks': "NGOs",

          'app_view_drawer_volunteer': 'Volunteer',

          'app_view_drawer_social_companies': 'Social Companies',

          'app_view_drawer_settings': 'Settings',

          'app_view_drawer_contact': 'Contact',

          'app_view_drawer_version': 'v1.0.1',

          'app_view_drawer_logout': 'Log Out',

          'app_view_drawer_delete_account': 'Delete My Account',

          'app_view_bottom_nav_markets': 'Markets',

          'app_view_bottom_nav_volunteer': 'Volunteer',

          'app_view_bottom_nav_favorites': 'Favorites',

          'app_view_bottom_nav_stks': "NGOs",

          'app_view_bottom_nav_profile': 'Profile',

          'app_view_exit_dialog_title': 'Log Out',

          'app_view_exit_dialog_content':
              'You need to stay logged in to continue contributing to social good with your shopping.',

          'app_view_exit_dialog_button_accept': 'Log Out',

          'app_view_exit_dialog_button_cancel': 'Cancel',

          'app_view_delete_account_dialog_title': 'Delete My Account',

          'app_view_delete_account_dialog_content':
              'You need to keep your account to continue contributing to social good with your shopping.\nThis action cannot be undone!',

          'app_view_delete_account_dialog_button_accept': 'Delete My Account',

          'app_view_delete_account_dialog_button_cancel': 'Cancel',

          'app_view_reauth_dialog_title': 'Session Expired',

          'app_view_reauth_dialog_content': 'Please log in again to delete your account.',

          'app_view_reauth_dialog_button_ok': 'Okay',

          'app_view_privacy_dialog_title': 'Privacy and Permissions',

          'app_view_privacy_dialog_content_part1':
              'Our application needs your permission to provide you with a better and personalized experience.',

          'app_view_privacy_dialog_button_accept': 'Continue',

          'app_view_privacy_dialog_button_cancel': 'Cancel',

          'app_view_contact_support': 'Contact Support',

          'app_view_version': 'v1.0.1',

          // Close button in dialogs

          'close': 'Close',

          // BrandDetailPage Keys...

          'brand_detail_page_bilgilendirmeler': 'Information',

          'brand_detail_page_deprem_bolgesi': 'Earthquake Zone',

          'brand_detail_page_sosyal_girisim': 'Social Initiative',

          'brand_detail_page_toplam_bagis': 'Total Donation',

          'brand_detail_page_favori': 'Favorite',

          'brand_detail_page_islem_sayisi': 'Transaction Count',

          'brand_detail_page_kategoriler': 'Categories',

          'brand_detail_page_bagis_orani': 'Donation Rate',

          'brand_detail_page_deprem_bolgesi_mi': 'Is it an earthquake zone?',

          'brand_detail_page_genel_bonus_kosullari': 'General Bonus Conditions',

          'brand_detail_page_alisverise_basla': 'Start Shopping',

          'brand_detail_page_sonraki_alisveris_kosullari_title':
              'What you need to know to ensure you earn donations from your next purchase',

          'brand_detail_page_sonraki_alisveris_kosullari_content1':
              'Our application needs your permission to provide you with a better and personalized experience.',

          'brand_detail_page_sonraki_alisveris_kosullari_content2': 'Please click the "Approve" button to continue.',

          'brand_detail_page_tamam': 'Okay',

          'brand_detail_page_bagis_yansimama_mesaji1': 'You have the opportunity to donate %',

          'brand_detail_page_bagis_yansimama_mesaji2': ' from your purchases!',

          'brand_detail_page_bagis_yansimama_mesaji3': 'Average time for donation payment: 75 days',

          'brand_detail_page_bagis_yansimama_mesaji4': 'General Bonus Conditions',

          'brand_detail_page_bagis_yansimama_mesaji5':
              'What you need to know to ensure you earn donations from your next purchase',

          'brand_detail_page_bagis_yansimama_mesaji6': 'This action cannot be undone!',

          'brand_detail_page_bagis_yansimama_mesaji7':
              'You need to stay logged in to continue contributing to social good with your shopping.',

          'brand_detail_page_bagis_yansimama_mesaji8':
              'You need to keep your account to continue contributing to social good with your shopping.\nThis action cannot be undone!',

          'brand_detail_page_alisveris_hata_mesaji1': 'No registered phone number found in the system!',

          'brand_detail_page_alisveris_hata_mesaji2': 'There is an error in your user information!',

          'brand_detail_page_alisveris_hata_mesaji3': 'You must add at least 2 NGOs to favorites!',

          'brand_detail_page_alisveris_hata_mesaji4':
              'Check the specific conditions of the store before completing your purchase',

          // BrandFormWidget Keys...

          'brand_form_page_marka_adi': 'Brand Name',

          'brand_form_page_gecersiz_marka_adi': 'Invalid Brand Name',

          'brand_form_page_yetkili_kisi_bilgileri': 'Authorized Person Details for Brand Application',

          'brand_form_page_ad_soyad': 'Full Name',

          'brand_form_page_gecersiz_ad_soyad': 'Invalid Full Name',

          'brand_form_page_telefon_numarasi': 'Phone Number',

          'brand_form_page_gecersiz_telefon_numarasi': 'Invalid Phone Number',

          'brand_form_page_iban_numarasi': 'IBAN Number',

          'brand_form_page_gecersiz_iban_numarasi': 'Invalid IBAN Number',

          'brand_form_page_mail_adresi': 'Email Address',

          'brand_form_page_gecersiz_mail_adresi': 'Invalid Email Address',

          'brand_form_page_gorevi_pozisyonu': 'Role/Position',

          'brand_form_page_gecersiz_gorev_pozisyonu': 'Invalid Role Position',

          'brand_form_page_logo': 'Brand Logo',

          'brand_form_page_logo_info': 'The brand logo must be in 512x512 dimensions, in png or jpg format.',

          'brand_form_page_banner_gorseli': 'Brand Banner Image',

          'brand_form_page_banner_gorseli_info':
              'The brand banner image must be in 800x500 dimensions, in png or jpg format.',

          'brand_form_page_web_sitesi': 'Brand Website',

          'brand_form_page_gecersiz_web_sitesi': 'Invalid Website',

          'brand_form_page_markanin_mail_adresi': 'Brand Email Address',

          'brand_form_page_markanin_telefon_numarasi': 'Brand Phone Number',

          'brand_form_page_kurucu_ad_soyad': "Founder's Name and Surname",

          'brand_form_page_sektor': 'Sector',

          'brand_form_page_il': 'Province',

          'brand_form_page_gecersiz_il': 'Invalid Province',

          'brand_form_page_ilce': 'District',

          'brand_form_page_gecersiz_ilce': 'Invalid District',

          'brand_form_page_mahalle': 'Neighborhood',

          'brand_form_page_gecersiz_mahalle': 'Invalid Neighborhood',

          'brand_form_page_vergi_levhasi': 'Tax Document',

          'brand_form_page_vergi_levhasi_info': 'The tax document must be in pdf format.',

          'brand_form_page_vergi_numarasi': 'Tax Number',

          'brand_form_page_gecersiz_vergi_numarasi': 'Invalid Tax Number',

          'brand_form_page_vergi_dairesi': 'Tax Office',

          'brand_form_page_gecersiz_vergi_dairesi': 'Invalid Tax Office',

          'brand_form_page_sosyal_girisim': 'Social Initiative',

          'brand_form_page_kategori': 'Category',

          'brand_form_page_gecersiz_kategori': 'Invalid Category',

          'brand_form_page_bagis_orani': 'Donation Rate',

          'brand_form_page_gecersiz_bagis_orani': 'Invalid Donation Rate',

          'brand_form_page_kategori_zaten_ekli': 'This category is already added.',

          'brand_form_page_kategori_ekle': '+ Add Category',

          'brand_form_page_gonder': 'Submit',

          'brand_form_page_logo_hatasi': 'There is an error in the logo information.',

          'brand_form_page_banner_hatasi': 'There is an error in the banner information.',

          'brand_form_page_sektor_hatasi': 'There is an error in the sector information.',

          'brand_form_page_adres_hatasi': 'There is an error in the address information.',

          'brand_form_page_vergi_levhasi_hatasi': 'There is an error in the tax document information.',

          'brand_form_page_kategori_hatasi': 'There is an error in the category information.',

          'brand_form_page_kategori_orani_hatasi': 'There is an error in the category rate information.',

          'brand_form_page_eksik_bilgi': 'You have entered incomplete information! Please review the data you entered.',

          'brand_form_page_sonraki_alisverisin':
              'Things you need to know to ensure you earn a donation from your next purchase',

          'brand_form_page_adblock': 'Disable Adblock and other browser extensions',

          'brand_form_page_adblock_content':
              'Ad-blocking programs and browser extensions like Adblock use and/or delete your cookies. In this case, even if you complete your purchase by passing through the store via Hangel, your cookies cannot be tracked, and thus, the store will not reflect your donations.',

          'brand_form_page_internet_tarayicisi': 'Ensure that your internet browser is enabled to allow cookies',

          'brand_form_page_internet_tarayicisi_content':
              'Stores use cookies to identify the purchase you make through Hangel. Once identified, it will be added to your donation account. Before going to the store via our platform, please ensure your browser is set to allow cookies.',

          'brand_form_page_gizli_pencere':
              'Do not complete your purchase with a private or incognito window in any browser',

          'brand_form_page_gizli_pencere_content':
              'Since your cookies cannot be tracked in incognito mode, the click data from your actions performed through Hangel cannot be transmitted to the store. Therefore, your donation will not be reflected. Since there is no click data, your donation cannot be added manually.',

          'brand_form_page_diger_programlar': 'Do not use other cashback/donation programs',

          'brand_form_page_diger_programlar_content':
              'When using other cashback/donation/reward/points programs like Hangel, the same cookie tracking is done, so stores do not reflect your donations. Therefore, we recommend keeping only Hangel open while completing your purchase.',

          'brand_form_page_kupon_kodu': 'Use only coupon codes available on Hangel',

          'brand_form_page_kupon_kodu_content':
              'If you used a coupon code that is not listed on the Hangel platform (such as codes obtained from coupon code sites), your donation is generally not reflected by the store. Since stores set their own conditions, donations are not defined when coupon codes not mentioned on our site are used.',

          'brand_form_page_fiyat_karsilastirma':
              'Do not visit price comparison or coupon code sites before shopping through Hangel',

          'brand_form_page_fiyat_karsilastirma_content':
              'Price comparison and coupon code sites receive sales commissions from stores like Hangel. This process is also done through tracking your cookies. If you visit these sites before completing your purchase with Hangel, your cookies may be deleted/overwritten.',

          'brand_form_page_mobil_uygulama':
              'Do not use the store’s mobile application (except for AliExpress and/or a few stores)',

          'brand_form_page_mobil_uygulama_content':
              'If you are shopping from a mobile device, use only the browser versions of web stores/reservation services. If you use the store’s mobile application to complete your purchase/reservation, donations will not be given, except for a few stores.',

          'brand_form_page_sepet': 'Only add products to your shopping cart after clicking on Hangel',

          'brand_form_page_sepet_content':
              'Some stores require that your shopping cart be empty in order to earn a donation by completing your purchase from Hangel.',

          'brand_form_page_diger_para_iadesi':
              'If you frequently experience donation non-reflection issues, clear your cookies',

          'brand_form_page_diger_para_iadesi_content':
              'If you frequently experience donation non-reflection issues, we recommend clearing your cookies.',

          'brand_form_page_site_ziyaret': 'Do not complete your purchase without clicking on the store through Hangel',

          'brand_form_page_site_ziyaret_content':
              'If you visited the store before clicking on Hangel, the store cannot first track cookies directly, and thus, Hangel will not reflect your donations.',

          'brand_form_page_ortak_sirketler': 'Avoid visiting sites that advertise stores partnered with Hangel',

          'brand_form_page_ortak_sirketler_content':
              'If you have other tabs with advertising banners or links during your purchase, your donation will not be reflected.',

          'brand_form_page_telefon_siparis': 'Do not place orders by phone',

          'brand_form_page_telefon_siparis_content': 'No store gives donations for orders/reservations made by phone.',

          'brand_form_page_farkli_ulke':
              'Do not place orders from a store page of another country (e.g., AliExpress Russia)',

          'brand_form_page_farkli_ulke_content':
              'You can only earn donations for purchases made through the links on the Hangel platform.',

          'brand_form_page_markanin_ozel_kosullari':
              'Check the store’s special conditions before completing your purchase',

          'brand_form_page_markanin_ozel_kosullari_content':
              'Some products or sellers may not be included in the donation program.',

          'brand_form_page_tamam': 'OK',

          // DonationHistoryPage Keys...

          'donation_history_page_bagislarim': 'My Donations',

          'donation_history_page_total_donation_error': 'An error occurred while retrieving the total donation amount.',

          'donation_history_page_realized_donation': 'Realized Donation',

          'donation_history_page_no_donations': 'No donations found.',

          'donation_history_page_donation_details': 'Donation Details',

          'donation_history_page_stk1_error': 'STK1 information could not be retrieved',

          'donation_history_page_stk2_error': 'STK2 information could not be retrieved',

          'donation_history_page_close': 'Close',

          'donation_history_page_donated_stks': 'Donated NGOs',

          'donation_history_page_brand': 'Brand',

          'donation_history_page_brand_loading': 'Loading Brand...',

          'donation_history_page_retry_brand': 'Reload Brand',

          'donation_history_page_brand_info_error': 'Brand Information Could Not Be Retrieved',

          'donation_history_page_amount': 'Amount',

          'donation_history_page_donation_amount': 'Donation Amount',

          'donation_history_page_order_number': 'Order Number',

          'donation_history_page_order_date': 'Order Date',

          // FavoritesPage Keys...

          'favorites_page_title': 'My Favorites',

          'favorites_page_search_hint': 'Search...',

          'favorites_page_favorilerim': 'My Favorites',

          'favorites_page_markalar': 'Brands',

          'favorites_page_stklar': 'NGOs',

          'favorites_page_error_occurred': 'An error occurred.',

          'favorites_page_no_favorites_brands': 'You have no favorite brands.',

          'favorites_page_no_favorites_stks': 'You have no favorite NGOs.',

          'favorites_page_brand_loading': 'Loading Brand...',

          'favorites_page_retry_brand': 'Reload Brand',

          'favorites_page_brand_info_error': 'Brand Information Could Not Be Retrieved',

          'favorites_page_amount': 'Amount',

          // FrequentlyAskedQuestionsPage Keys...

          'faq_page_title': 'Frequently Asked Questions',

          'faq_question_1_title': 'What is your data policy?',

          'faq_question_1_description':
              'We store names, addresses, email addresses, and Gift Aid declarations provided by members (users). We also store names, addresses, email addresses, and phone numbers of relevant persons provided to us by administrators for specific purposes. Additionally, we keep information about the NGOs supported by users through Hangel and the brands they shop from.',

          'faq_question_2_title': "What are the legal bases for 'storing' and 'processing' your data?",

          'faq_question_2_description':
              "We store your data because there is a 'legitimate interest' in being able to record your membership, the purposes you support, and the donations you make. We will regularly send you information related to your account and confirm any changes you make. We also send various marketing emails that may be related to offers, important tips, new features, etc. We need explicit 'consent' for these emails, and to ensure it is recorded correctly, we have asked for re-consent from our existing audience.",

          'faq_question_3_title': "Can I request my data to be deleted?",

          'faq_question_3_description':
              "You have the right to request the modification or deletion of the information we hold about you. We will ensure that your data is kept confidential and used only by relevant parties for the purpose of carrying out our activities. We will not share this information with any official organization unless necessary to provide our services (e.g., email marketing, query management, etc.).",

          'faq_question_4_title': "Why doesn't the direct donation I made appear in my account?",

          'faq_question_4_description':
              "If you made a Direct Donation for a purpose, it may take a few weeks for the donation to appear in your supporter account. If your direct donation does not appear after this period, please contact us using the contact form option.",

          'faq_question_5_title': "Is there a monthly or annual subscription fee?",

          'faq_question_5_description':
              "Users, brands, NGOs, or individuals collecting donations with special permission do not pay any fees or similar payments.",

          'faq_question_6_title': "Under what conditions can users change the purposes they support?",

          'faq_question_6_description':
              "We do not select one association when a user first registers to support a purpose; instead, we expect them to support at least 2 purposes, allowing cross-support of different purposes. The reason for allowing the selection of more than 2 associations is that the supported purpose can gather donations more effectively.",

          'faq_question_7_title': "When can I change my supported purpose?",

          'faq_question_7_description': "You can change it 21 days after the date you made your choice.",

          'faq_question_8_title': "Donation Percentage and Gift Aid - How does it work?",

          'faq_question_8_description':
              "The commissions earned from your purchases are now turning into social benefits with Hangel. By your support, you are becoming a partner in social benefit and contributing to the solution of social issues.",

          'faq_question_9_title': "How do I become a member?",

          'faq_question_9_description':
              "You obtain the application from the App Store according to the infrastructure of the phone you are using.",

          'faq_question_10_title': "Hangel Social Impact Fund",

          'faq_question_10_description':
              "Our Social Impact Fund helps provide much-needed revenue for organizations that aim to solve our social issues and are vital for sustainability in their social initiatives. This amazing collection, which includes schools, charities (both large and small), community groups, amateur sports clubs, and social enterprises, desperately needs additional support to continue. We are passionate about supporting all good causes, no matter how big or small; Together, we are building a Giving Nation to make a meaningful impact. We look forward to your contributions.",

          // ProfilePage Keys...

          'profile_page_title': 'My Profile',

          'profile_page_add_photo': 'Add Photo',

          'profile_page_supported_ngos': 'NGOs You Support',

          'profile_page_error_occurred': 'An error occurred.',

          'profile_page_total_donation': 'Total Donation Amount',

          'profile_page_donation_count': 'Number of Donation Transactions',

          'profile_page_membership_date': 'Membership Date',

          'profile_page_volunteer_organizations': 'Organizations Where You Volunteered',

          'profile_page_project_count': 'Number of Projects',

          'profile_page_total_hours': 'Total Hours',

          'profile_page_gender': 'Gender',

          'profile_page_email': 'Email',

          'profile_page_phone': 'Phone',

          'profile_page_birth_date': 'Date of Birth',

          'profile_page_location': 'City/District/Neighborhood',

          'profile_page_update_info': 'Update Information',

          'profile_page_stk_application_form': 'NGO Application Form',

          'profile_page_stk_application_form_button': 'NGO Application Form',

          'profile_page_brand_application_form_button': 'Brand Application Form',

          'profile_page_personal_info': 'Personal Information',

          'profile_page_volunteer': 'Volunteer',

          'profile_page_statistics': 'Statistics',

          'profile_page_no_supported_ngos': 'No supported NGOs found.',

          // STKDetailPage Keys...

          'stk_detail_about': 'About',

          'stk_detail_join_date_label': 'Joining Date: ',

          'stk_detail_earthquake_zone': 'Earthquake Zone',

          'stk_detail_total_donation': 'Total Donation',

          'stk_detail_process_count': 'Number of Transactions',

          'stk_detail_donor_count': 'Number of Donors',

          'stk_detail_type': 'Type',

          'stk_detail_categories': 'Categories',

          'stk_detail_un_goals': 'UN Sustainable Development Goals',

          'stk_detail_field': 'Field',

          'stk_detail_general_info': 'General Information',

          'stk_detail_statistics': 'Statistics',

          // STKFormWidget Keys...

          'stk_form_invalid_registry_number': 'Invalid Registry Number',

          'stk_form_invalid_tax_number': 'Invalid Tax Number',

          'stk_form_invalid_short_name': 'Invalid Short Name',

          'stk_form_invalid_full_name': 'Invalid Full Name',

          'stk_form_invalid_iban': 'Invalid IBAN Number',

          'stk_form_invalid_contact_person_name': 'Invalid Full Name',

          'stk_form_invalid_contact_person_phone': 'Invalid Phone Number',

          'stk_form_invalid_contact_person_email': 'Invalid Email Address',

          'stk_form_invalid_contact_person_job': 'Invalid Job/Position',

          'stk_form_invalid_website': 'Invalid Website',

          'stk_form_invalid_email': 'Invalid Email Address',

          'stk_form_invalid_phone': 'Invalid Phone Number',

          'stk_form_invalid_founder_name': 'Invalid Founder Name',

          'stk_form_invalid_logo': 'Logo was not uploaded correctly.',

          'stk_form_invalid_address_info': 'There is an error in the address information.',

          'stk_form_invalid_tuzuk': 'There is an error in the bylaws file.',

          'stk_form_invalid_faaliyet': 'There is an error in the activity document.',

          'stk_form_invalid_sector': 'There is an error in the activity area information.',

          'stk_form_invalid_category': 'There is an error in the category information.',

          'stk_form_invalid_bm': 'There is an error in the UN goals information.',

          'stk_form_invalid_type': 'There is an error in the NGO type.',

          'stk_form_incomplete_info':
              'You have entered incomplete information! Please review the data you have entered.',

          // SelectFavoriteStkPage Keys...

          'select_favorite_stk_title': 'Select Favorite NGO',

          'select_favorite_stk_skip': 'Skip',

          'select_favorite_stk_instruction':
              'Select the NGO you want to support for 30 days. Remember, you can change your supported NGO after 30 days.',

          'select_favorite_stk_all': 'All',

          'select_favorite_stk_association': 'Association',

          'select_favorite_stk_foundation': 'Foundation',

          'select_favorite_stk_special_permission': 'Special Permission',

          'select_favorite_stk_min_error': 'You must select at least 2 NGOs!',

          'select_favorite_stk_max_error': 'You can select a maximum of 2 NGOs!',

          'select_favorite_stk_success': 'Favorite NGOs updated successfully',

          'select_favorite_stk_error_code': 'An error occurred!\nError Code:00321',

          'select_favorite_stk_sort_name': 'Sort by Name',

          'select_favorite_stk_sort_favorite_count': 'Sort by Favorite Count',

          'select_favorite_stk_sort_donor_count': 'Sort by Donor Count',

          'select_favorite_stk_filter_all': 'All',

          'select_favorite_stk_filter_earthquake': 'Earthquake Zone',

          'select_favorite_stk_filter_special_status': 'Special Status',

          'select_favorite_stk_animals': 'Animals',

          'select_favorite_stk_poverty': 'Poor',

          'select_favorite_stk_education': 'Education',

          'select_favorite_stk_health': 'Health',

          'select_favorite_stk_agriculture': 'Agriculture',

          'select_favorite_stk_refugees': 'Refugees',

          'select_favorite_stk_law': 'Law',

          'select_favorite_stk_earthquake': 'Earthquake',

          'select_favorite_stk_food': 'Food',

          'select_favorite_stk_religious': 'Religious',

          'select_favorite_stk_social_entrepreneurship': 'Social Entrepreneurship',

          'select_favorite_stk_entrepreneurship': 'Entrepreneurship',

          'select_favorite_stk_culture_art': 'Culture and Art',

          'select_favorite_stk_sports': 'Sports',

          'marka_favorilemediniz': 'You have not favorited any Brands yet.',

          'stk_eklemediniz': 'You have not added any NGOs yet.',

          'marka_gozat': 'Browse Brands',

          // STKPage Keys...

          'stk_page_all': 'All',

          'stk_page_associations': 'Associations',

          'stk_page_foundations': 'Foundations',

          'stk_page_special_permissions': 'Special Permissions',

          'stk_page_stks': 'NGOs',

          'stk_page_filter_earthquake_zone': 'Earthquake Zone',

          'stk_page_filter_special_status': 'Special Status',

          'stk_page_filter_all': 'All',

          'stk_page_sort_by_name': 'By Name',

          'stk_page_sort_by_favorite': 'By Favorite Count',

          'stk_page_sort_by_donor': 'By Donor Count',

          'basvuruldu': 'Applied',

          'basvur': 'Apply',

          'kisi_basvurdu': 'people applied',

          'gonullu_ilanlari': 'NGO Volunteer Listings',

          // SettingsPage Keys...

          'settings_page_title': 'Settings',

          'settings_page_about_us': 'About Us',

          'settings_page_user_agreement': 'User Agreement',

          'settings_page_privacy_policy': 'Privacy Policy',

          'settings_page_faq': 'FAQs',

          'settings_page_user_agreement_text': """

  It is important to read this User Agreement ("Agreement") carefully before using the Hangel application ("Application"). This Agreement establishes the terms and conditions related to your use of the Hangel application ("Company", "we", "us").


  1. Acceptance

  By using the Application, you are deemed to have accepted this Agreement. If you do not accept this Agreement, you should not use the Application.


  2. Changes

  We may change this Agreement from time to time. We will inform you when changes come into effect. If you do not accept the changes, you should stop using the Application.


  3. Use of the Application

  You can only use the Application for legal and ethical purposes. By using the Application, you agree not to:

  Use the Application for any illegal or harmful activities.

  Upload or share any content that infringes copyright, trademark, or other intellectual property rights.

  Upload or share any content that contains hate speech, threats, or harassment.

  Send spam or unsolicited emails.

  Upload or distribute viruses or other harmful software.

  Attempt unauthorized access to the Company's or third parties' systems.


  4. Ownership

  The Application and all content belong to the Company. Your use of the Application does not
  """,

          // Privacy Policy Text...

          'settings_page_privacy_policy_text': """
  3. How We Share Your Information

  We may share the information we collect with third parties in the following situations:

  Service providers: We may share your information with third-party service providers we use to provide you with the Hangel application.

  Legal requirements: We may share your information to comply with legal requirements or respond to legal requests.

  Advertisers: We may share your information with advertisers to present you with ads related to your interests.

  Anonymized data: We may share anonymized data that does not personally identify you with third parties for research and development purposes.


  4. Security

  We take technical and administrative security measures to protect your information. These measures include:

  Encryption of your data

  Use of secure data centers

  Implementation of access controls

  Training of security personnel


  5. Your Rights

  You have the following rights regarding your personal information:

  Access: You have the right to request a copy of your personal information.

  Correction: You have the right to correct any inaccurate or incomplete personal information.

  Deletion: You have the right to request the deletion of your personal information.

  Restriction of processing: You have the right to restrict the processing of your personal information.

  Portability: You have the right to transfer your personal information to another controller.

  Objection: You have the right to object to the processing of your personal information.


  6. Changes

  We may change this Privacy Policy from time to time. We will inform you when changes come into effect.


  7. Contact

  If you have any questions about this Privacy Policy, please contact us.


  8. Effective Date

  This Privacy Policy has been effective since March 12, 2024.

  """,

          // BrandDetailPage Keys...

          'yes': 'Yes',

          'no': 'No',

          'info': 'Information',

          'statistics': 'Statistics',

          'search': 'Search',

          // BrandDetailPage Keys...

          'brand_detail_page_join_date_label': 'Date of Joining the Platform: '
        },
        'fr_FR': {
          "user_ban_page_description": "Votre compte a été marqué comme inactif. Si vous pensez qu'il y a une erreur, vous pouvez nous contacter.",
          "stk_form_validation_error": "Veuillez remplir les champs obligatoires",
          "stk_form_type": "Type",
          "stk_form_type_association": "Association",
          "stk_form_type_foundation": "Fondation",
          "stk_form_type_sports_club": "Club de sport",
          "stk_form_type_special_permission": "Collecte de dons avec autorisation spéciale",
          "stk_form_invalid_id_no": "Veuillez entrer un numéro d'ID valide",
          "stk_form_tax_number": "Numéro fiscal",
          "stk_form_invalid_tax_number": "Veuillez entrer un numéro fiscal valide",
          "stk_form_tax_office": "Bureau des impôts",
          "stk_form_invalid_tax_office": "Veuillez entrer un bureau des impôts valide",
          "stk_form_short_name": "Nom court",
          "stk_form_invalid_short_name": "Veuillez entrer un nom court valide",
          "stk_form_full_name": "Nom complet",
          "stk_form_invalid_full_name": "Veuillez entrer un nom complet valide",
          "stk_form_establishment_year": "Année de fondation",
          "stk_form_invalid_establishment_year": "Veuillez entrer une année de fondation valide",
          "stk_form_iban_no": "IBAN",
          "stk_form_invalid_iban": "Veuillez entrer un IBAN valide",
          "stk_form_logo": "Logo",
          "stk_form_logo_info": "Votre logo doit être au format PNG ou JPG, de 512x512 pixels.",
          "stk_form_website": "Site web",
          "stk_form_invalid_website": "Veuillez entrer un site web valide",
          "stk_form_email": "Adresse e-mail",
          "stk_form_invalid_email": "Veuillez entrer une adresse e-mail valide",
          "stk_form_phone": "Numéro de téléphone",
          "stk_form_invalid_phone": "Veuillez entrer un numéro de téléphone valide",
          "stk_form_city": "Ville",
          "stk_form_district": "District",
          "stk_form_neighborhood": "Quartier",
          "stk_form_remaining_address": "Informations complémentaires sur l'adresse",
          "stk_form_invalid_remaining_address": "Veuillez entrer les détails de l'adresse",
          "stk_form_statute": "Statuts de l'association ou de la fondation",
          "stk_form_statute_info": "Le fichier doit être au format PDF et faire moins de 6 Mo.",
          "stk_form_activity_certificate": "Certificat d'activité",
          "stk_form_activity_certificate_info":
              "Le fichier doit être au format PDF, faire moins de 6 Mo, et daté de moins de 7 jours ouvrables.",
          "stk_form_activity_area": "Domaine d'activité à la direction",
          "stk_form_beneficiaries": "Bénéficiaires",
          "stk_form_un_sdgs": "Objectifs de développement durable de l'ONU",
          "stk_form_applicant_info": "Informations sur le demandeur",
          "stk_form_applicant_name": "Nom et prénom",
          "stk_form_invalid_applicant_name": "Veuillez entrer un nom valide",
          "stk_form_applicant_phone": "Numéro de téléphone",
          "stk_form_invalid_applicant_phone": "Veuillez entrer un numéro de téléphone valide",
          "stk_form_applicant_email": "Adresse e-mail",
          "stk_form_invalid_applicant_email": "Veuillez entrer une adresse e-mail valide",
          "stk_form_applicant_position": "Poste",
          "stk_form_invalid_applicant_position": "Veuillez entrer un poste valide",
          "stk_form_governorate_permission_document": "Document d'autorisation du gouvernorat",
          "stk_form_governorate_permission_document_info": "Le fichier doit être au format JPG ou PDF.",
          "stk_form_stk_il_mudurlugu_yetki_belgesi": "Certificat d'autorisation de la direction",
          "stk_form_stk_il_mudurlugu_yetki_belgesi_info": "Le fichier doit être au format JPG ou PDF.",
          "stk_form_permission_start_date": "Date de début de l'autorisation",
          "stk_form_invalid_permission_start_date": "Veuillez sélectionner une date valide",
          "stk_form_permission_end_date": "Date de fin de l'autorisation",
          "stk_form_invalid_permission_end_date": "Veuillez sélectionner une date valide",
          "stk_form_permission_granting_governorate": "Gouvernorat ayant accordé l'autorisation",
          "stk_form_activity_number": "Numéro d'activité",
          "stk_form_invalid_activity_number": "Veuillez entrer un numéro d'activité valide",
          "stk_form_campaign_name": "Nom de la campagne",
          "stk_form_invalid_campaign_name": "Veuillez entrer un nom de campagne valide",
          "stk_form_birth_date": "Date de naissance",
          "stk_form_invalid_birth_date": "Veuillez sélectionner une date valide",
          "stk_form_photo": "Photo",
          "stk_form_photo_info": "La photo doit être au format PNG ou JPG.",
          "stk_form_permission_purpose": "Objet de l'autorisation",
          "stk_form_invalid_permission_purpose": "Veuillez entrer l'objet de l'autorisation",
          "stk_form_applicant_relation": "Lien de parenté",
          "stk_form_invalid_applicant_relation": "Veuillez entrer un lien de parenté valide",
          "stk_form_submit": "Envoyer",
          "stk_form_registry_number": "Numéro de registre",
          "stk_form_registry_number_foundation": "Numéro de fondation",
          "stk_form_sector_professional_associations": "Associations professionnelles",
          "stk_form_sector_religious_services": "Associations de services religieux",
          "stk_form_sector_sports": "Associations sportives",
          "stk_form_sector_humanitarian_aid": "Associations d'aide humanitaire",
          "stk_form_sector_education_research": "Associations d'éducation et de recherche",
          "stk_form_sector_culture_art_tourism": "Associations culturelles, artistiques et touristiques",
          "stk_form_sector_social_values": "Associations de valeurs sociales",
          "stk_form_sector_environment": "Associations de protection de l'environnement et des animaux",
          "stk_form_sector_health": "Associations de santé",
          "stk_form_sector_personal_development": "Associations de développement personnel et social",
          "stk_form_sector_urban_development": "Associations de développement urbain",
          "stk_form_sector_advocacy": "Associations de plaidoyer",
          "stk_form_sector_disabilities": "Associations pour les personnes handicapées",
          "stk_form_sector_thought_based": "Associations basées sur la pensée",
          "stk_form_sector_public_support": "Associations de soutien aux institutions publiques",
          "stk_form_sector_food_agriculture": "Associations agroalimentaires",
          "stk_form_sector_diaspora": "Associations de diaspora",
          "stk_form_sector_international_cooperation": "Associations de coopération internationale",
          "stk_form_sector_veterans": "Associations d'anciens combattants",
          "stk_form_sector_elderly_children": "Associations pour les personnes âgées et les enfants",
          "stk_form_sector_children": "Associations pour enfants",
          "stk_form_sector_other": "Autres",
          "stk_form_beneficiaries_animals": "Animaux",
          "stk_form_beneficiaries_poor": "Pauvres",
          "stk_form_beneficiaries_education": "Éducation",
          "stk_form_beneficiaries_health": "Santé",
          "stk_form_beneficiaries_agriculture": "Agriculture",
          "stk_form_beneficiaries_refugees": "Réfugiés",
          "stk_form_beneficiaries_law": "Droit",
          "stk_form_beneficiaries_earthquake": "Tremblement de terre",
          "stk_form_beneficiaries_food": "Alimentation",
          "stk_form_beneficiaries_religious": "Religieux",
          "stk_form_beneficiaries_social_entrepreneurship": "Entrepreneuriat social",
          "stk_form_beneficiaries_entrepreneurship": "Entrepreneuriat",
          "stk_form_beneficiaries_culture_art": "Culture et art",
          "stk_form_beneficiaries_sports": "Sports",
          "stk_form_un_goal_no_poverty": "Pas de pauvreté",
          "stk_form_un_goal_zero_hunger": "Faim zéro",
          "stk_form_un_goal_good_health": "Bonne santé et bien-être",
          "stk_form_un_goal_quality_education": "Éducation de qualité",
          "stk_form_un_goal_gender_equality": "Égalité des sexes",
          "stk_form_un_goal_clean_water": "Eau propre et assainissement",
          "stk_form_un_goal_clean_energy": "Énergie propre et abordable",
          "stk_form_un_goal_decent_work": "Travail décent et croissance économique",
          "stk_form_un_goal_industry": "Industrie, innovation et infrastructure",
          "stk_form_un_goal_reduced_inequalities": "Réduction des inégalités",
          "stk_form_un_goal_sustainable_cities": "Villes et communautés durables",
          "stk_form_un_goal_responsible_consumption": "Consommation et production responsables",
          "stk_form_un_goal_climate_action": "Action climatique",
          "stk_form_un_goal_life_below_water": "Vie aquatique",
          "stk_form_un_goal_life_on_land": "Vie terrestre",
          "stk_form_un_goal_peace_justice": "Paix, justice et institutions efficaces",
          "stk_form_un_goal_partnerships": "Partenariats pour les objectifs",
          "missing_donation_form_page_title": "Mon Don N'apparaît Pas",
          "missing_donation_form_brand": "Marque",
          "missing_donation_form_order_number": "Numéro de Commande",
          "missing_donation_form_date": "Date",
          "missing_donation_form_cart_amount": "Montant du Panier",
          "missing_donation_form_registry_id": "ID d'Enregistrement",
          "missing_donation_form_phone": "Numéro de Téléphone",
          "missing_donation_form_send": "Envoyer",
          "missing_donation_form_fill_all_fields": "Veuillez remplir tous les champs",
          "missing_donation_form_invalid_phone": "Veuillez entrer un numéro de téléphone valide",
          "missing_donation_form_success": "Votre demande a été envoyée avec succès",
          "missing_donation_form_error": "Une erreur est survenue lors de l'envoi de votre demande",
          "support_form_name": "Nom Prénom",
          "support_form_email": "E-mail",
          "support_form_phone": "Téléphone",
          "support_form_user_type": "Type d'utilisateur",
          "support_form_user_type_individual": "Je suis un utilisateur individuel",
          "support_form_user_type_stk_manager": "Je suis un gestionnaire d'ONG",
          "support_form_user_type_brand_manager": "Je suis un gestionnaire de marque",
          "support_form_subject": "Sujet",
          "support_form_message": "Message",
          "support_form_send": "Envoyer",
          "support_form_invalid_email": "Veuillez entrer une adresse e-mail valide",
          "support_form_invalid_phone": "Veuillez entrer un numéro de téléphone valide",
          "support_form_fill_all_fields": "Veuillez remplir tous les champs",
          "support_form_invalid_name": "Veuillez entrer un nom valide",
          "support_form_invalid_subject": "Veuillez entrer un sujet",
          "support_form_invalid_message": "Veuillez entrer un message",
          "donation_history_page_my_donation_not_showing": "Mon don n'apparaît pas",

          'settings_page_change_language': 'Changer la langue',

          // HomePage Keys...

          'home_page_donation_rate': 'Taux de Don',

          'home_page_connection_problem': 'Problème de Connexion!',

          'home_page_search_brand': 'Rechercher une Marque',

          'home_page_brands': 'Marques',

          'home_page_all': 'Tous',

          'home_page_sort_donation_rate_desc': 'Taux de don du plus élevé au plus bas',

          'home_page_sort_donation_rate_asc': 'Taux de don du plus bas au plus élevé',

          'home_page_sort_newest_oldest': 'Du plus récent au plus ancien',

          'home_page_sort_oldest_newest': 'Du plus ancien au plus récent',

          'home_page_sort_a_z': 'A-Z',

          'home_page_sort_z_a': 'Z-A',

          // RegisterPage Keys...

          'register_page_create_account': 'Créer un Compte',

          'register_page_login': 'Connexion',

          'register_page_full_name': 'Nom Prénom',

          'register_page_phone_number': 'Numéro de Téléphone',

          'register_page_enter_phone': 'Entrez votre numéro de téléphone',

          'register_page_user_agreement': 'J\'ai lu et j\'accepte les Conditions d\'Utilisation.',

          'register_page_privacy_agreement': 'J\'ai lu et j\'accepte la Politique de Confidentialité.',

          'register_page_error_fill_all_fields': 'Veuillez remplir correctement tous les champs!',

          'register_page_error_accept_agreements': 'Veuillez accepter les accords!',

          'register_page_error_unexpected': 'Une erreur inattendue s\'est produite. Veuillez réessayer',

          'register_page_error_invalid_code': 'Veuillez entrer le code correct!',

          'register_page_verify_code_prompt': 'Veuillez entrer le code à 6 chiffres envoyé à votre téléphone.',

          'register_page_resend_code': 'Renvoyer',

          'register_page_didnt_receive_code': 'Vous n\'avez pas reçu le code de vérification?',

          'register_page_verify': 'Vérifier',

          'register_page_login_register_prompt_login': 'Vous n\'avez pas de compte?',

          'register_page_login_register_prompt_register': 'Vous avez déjà un compte?',

          'register_page_login_register_action_login': 'Connexion',

          'register_page_login_register_action_register': 'S\'inscrire',

          // AboutUsPage Keys...

          'about_us_page_title': 'À Propos de Nous',

          'about_us_page_description': """

  Hangel est une application permettant aux gens de faire des dons de points accumulés lors de leurs achats à des organisations à but non lucratif (ONG). Notre mission est de faciliter le don et de permettre à chacun de soutenir les ONG de son choix.


  Comment ça marche?

  Téléchargez l\'application Hangel et créez un compte.

  Sélectionnez vos ONG préférées dans l\'application.

  Lors de vos achats, choisissez Hangel comme mode de paiement avec votre carte de crédit ou carte bancaire.

  Gagnez des points grâce à vos achats.

  Faites don des points gagnés aux ONG que vous avez choisies.


  Pourquoi Hangel?

  Facile et pratique : Pas besoin de passer des minutes à faire un don. Soutenez les ONG que vous aimez en gagnant des points lors de vos achats.

  Sécurisé et transparent : Toutes vos transactions sont sécurisées. Suivez vos dons de manière transparente.

  Responsabilité sociale : Donnez un sens à vos achats avec Hangel. En soutenant les ONG que vous aimez, vous contribuez au bien-être de la société.


  Avec Hangel, vous pouvez:

  Soutenir les ONG que vous aimez.

  Suivre où vont vos dons.

  Faire plus de dons en gagnant des points lors de vos achats.

  Contribuer à des projets de responsabilité sociale.


  Rejoignez Hangel!

  En rejoignant Hangel, vous pouvez également contribuer aux ONG que vous aimez et avoir un impact positif dans la société. Téléchargez l'application et commencez à faire la différence dès aujourd'hui!

  """,

          // AppViewPage Keys...

          'app_view_about_us_title': 'À Propos de Nous',

          'app_view_drawer_greeting': 'Bonjour,',

          'app_view_drawer_profile': 'Mon Profil',

          'app_view_drawer_donations': 'Mes Dons',

          'app_view_drawer_stks': "ONG",

          'app_view_drawer_volunteer': 'Bénévole',

          'app_view_drawer_social_companies': 'Entreprises Sociales',

          'app_view_drawer_settings': 'Paramètres',

          'app_view_drawer_contact': 'Contact',

          'app_view_drawer_version': 'v1.0.1',

          'app_view_drawer_logout': 'Déconnexion',

          'app_view_drawer_delete_account': 'Supprimer le Compte',

          'app_view_bottom_nav_markets': 'Marques',

          'app_view_bottom_nav_volunteer': 'Bénévole',

          'app_view_bottom_nav_favorites': 'Favoris',

          'app_view_bottom_nav_stks': "ONG",

          'app_view_bottom_nav_profile': 'Profil',

          'app_view_exit_dialog_title': 'Déconnexion',

          'app_view_exit_dialog_content':
              'Pour continuer à participer à des actions sociales avec vos achats, il est conseillé de ne pas vous déconnecter.',

          'app_view_exit_dialog_button_accept': 'Déconnexion',

          'app_view_exit_dialog_button_cancel': 'Annuler',

          'app_view_delete_account_dialog_title': 'Supprimer le Compte',

          'app_view_delete_account_dialog_content':
              'Pour continuer à participer à des actions sociales avec vos achats, il est conseillé de ne pas supprimer votre compte.\nCette action est irréversible!',

          'app_view_delete_account_dialog_button_accept': 'Supprimer le Compte',

          'app_view_delete_account_dialog_button_cancel': 'Annuler',

          'app_view_reauth_dialog_title': 'Session Expirée',

          'app_view_reauth_dialog_content': 'Veuillez vous reconnecter pour supprimer votre compte.',

          'app_view_reauth_dialog_button_ok': 'OK',

          'app_view_privacy_dialog_title': 'Confidentialité et Permissions',

          'app_view_privacy_dialog_content_part1':
              'Notre application a besoin de votre permission pour vous offrir une expérience meilleure et personnalisée.',

          'app_view_privacy_dialog_button_accept': 'Continuer',

          'app_view_privacy_dialog_button_cancel': 'Annuler',

          'app_view_contact_support': 'Contacter le Support',

          'app_view_version': 'v1.0.1',

          // Close button in dialogs

          'close': 'Fermer',

          // BrandDetailPage Keys...

          'brand_detail_page_bilgilendirmeler': 'Informations',

          'brand_detail_page_deprem_bolgesi': 'Zone Sismique',

          'brand_detail_page_sosyal_girisim': 'Initiative Sociale',

          'brand_detail_page_toplam_bagis': 'Total des Dons',

          'brand_detail_page_favori': 'Favori',

          'brand_detail_page_islem_sayisi': 'Nombre de Transactions',

          'brand_detail_page_kategoriler': 'Catégories',

          'brand_detail_page_bagis_orani': 'Taux de Don',

          'brand_detail_page_deprem_bolgesi_mi': 'Est-ce une Zone Sismique?',

          'brand_detail_page_genel_bonus_kosullari': 'Conditions Générales de Bonus',

          'brand_detail_page_alisverise_basla': 'Commencer à Acheter',

          'brand_detail_page_sonraki_alisveris_kosullari_title':
              'Ce qu\'il faut savoir pour gagner des dons lors de votre prochain achat',

          'brand_detail_page_sonraki_alisveris_kosullari_content1':
              'Notre application a besoin de votre autorisation pour vous offrir une expérience meilleure et personnalisée.',

          'brand_detail_page_sonraki_alisveris_kosullari_content2': 'Veuillez cliquer sur "Confirmer" pour continuer.',

          'brand_detail_page_tamam': 'OK',

          'brand_detail_page_bagis_yansimama_mesaji1':
              'Lors de vos achats, vous avez la possibilité de faire un don de %',

          'brand_detail_page_bagis_yansimama_mesaji2': '!',

          'brand_detail_page_bagis_yansimama_mesaji3': 'Temps moyen pour le paiement des dons : 75 jours',

          'brand_detail_page_bagis_yansimama_mesaji4': 'Conditions Générales de Bonus',

          'brand_detail_page_bagis_yansimama_mesaji5':
              'Ce qu\'il faut savoir pour gagner des dons lors de votre prochain achat',

          'brand_detail_page_bagis_yansimama_mesaji6': 'Cette action est irréversible!',

          'brand_detail_page_bagis_yansimama_mesaji7':
              'Pour continuer à participer à des actions sociales avec vos achats, il est conseillé de ne pas vous déconnecter.',

          'brand_detail_page_bagis_yansimama_mesaji8':
              'Pour continuer à participer à des actions sociales avec vos achats, il est conseillé de ne pas supprimer votre compte.\nCette action est irréversible!',

          'brand_detail_page_alisveris_hata_mesaji1': 'Aucun numéro de téléphone enregistré dans le système!',

          'brand_detail_page_alisveris_hata_mesaji2': 'Erreur dans les informations de l\'utilisateur!',

          'brand_detail_page_alisveris_hata_mesaji3': 'Vous devez ajouter au moins 2 ONG en favoris!',

          'brand_detail_page_alisveris_hata_mesaji4':
              'Avant de finaliser votre achat, veuillez consulter les conditions spécifiques du magasin',

          // BrandFormWidget Keys...

          'brand_form_page_marka_adi': 'Nom de la marque',

          'brand_form_page_gecersiz_marka_adi': 'Nom de marque invalide',

          'brand_form_page_yetkili_kisi_bilgileri': 'Informations de la personne responsable de la demande de marque',

          'brand_form_page_ad_soyad': 'Nom et Prénom',

          'brand_form_page_gecersiz_ad_soyad': 'Nom et prénom invalide',

          'brand_form_page_telefon_numarasi': 'Numéro de téléphone',

          'brand_form_page_gecersiz_telefon_numarasi': 'Numéro de téléphone invalide',

          'brand_form_page_iban_numarasi': 'Numéro IBAN',

          'brand_form_page_gecersiz_iban_numarasi': 'Numéro IBAN invalide',

          'brand_form_page_mail_adresi': 'Adresse e-mail',

          'brand_form_page_gecersiz_mail_adresi': 'Adresse e-mail invalide',

          'brand_form_page_gorevi_pozisyonu': 'Fonction/Poste',

          'brand_form_page_gecersiz_gorev_pozisyonu': 'Fonction/Poste invalide',

          'brand_form_page_logo': 'Logo de la marque',

          'brand_form_page_logo_info': 'Le logo de la marque doit être au format png ou jpg, de dimensions 512x512.',

          'brand_form_page_banner_gorseli': 'Image bannière de la marque',

          'brand_form_page_banner_gorseli_info':
              'L’image bannière de la marque doit être au format png ou jpg, de dimensions 800x500.',

          'brand_form_page_web_sitesi': 'Site Web de la marque',

          'brand_form_page_gecersiz_web_sitesi': 'Site Web invalide',

          'brand_form_page_markanin_mail_adresi': 'Adresse e-mail de la marque',

          'brand_form_page_markanin_telefon_numarasi': 'Numéro de téléphone de la marque',

          'brand_form_page_kurucu_ad_soyad': 'Nom du fondateur de la marque',

          'brand_form_page_sektor': 'Secteur',

          'brand_form_page_il': 'Province',

          'brand_form_page_gecersiz_il': 'Province invalide',

          'brand_form_page_ilce': 'District',

          'brand_form_page_gecersiz_ilce': 'District invalide',

          'brand_form_page_mahalle': 'Quartier',

          'brand_form_page_gecersiz_mahalle': 'Quartier invalide',

          'brand_form_page_vergi_levhasi': 'Certificat fiscal',

          'brand_form_page_vergi_levhasi_info': 'Le certificat fiscal doit être au format pdf.',

          'brand_form_page_vergi_numarasi': 'Numéro fiscal',

          'brand_form_page_gecersiz_vergi_numarasi': 'Numéro fiscal invalide',

          'brand_form_page_vergi_dairesi': 'Bureau fiscal',

          'brand_form_page_gecersiz_vergi_dairesi': 'Bureau fiscal invalide',

          'brand_form_page_sosyal_girisim': 'Entreprise sociale',

          'brand_form_page_kategori': 'Catégorie',

          'brand_form_page_gecersiz_kategori': 'Catégorie invalide',

          'brand_form_page_bagis_orani': 'Taux de don',

          'brand_form_page_gecersiz_bagis_orani': 'Taux de don invalide',

          'brand_form_page_kategori_zaten_ekli': 'Cette catégorie est déjà ajoutée.',

          'brand_form_page_kategori_ekle': '+ Ajouter une catégorie',

          'brand_form_page_gonder': 'Envoyer',

          'brand_form_page_logo_hatasi': 'Erreur dans les informations du logo.',

          'brand_form_page_banner_hatasi': 'Erreur dans les informations de la bannière.',

          'brand_form_page_sektor_hatasi': 'Erreur dans les informations du secteur.',

          'brand_form_page_adres_hatasi': 'Erreur dans les informations de l’adresse.',

          'brand_form_page_vergi_levhasi_hatasi': 'Erreur dans les informations du certificat fiscal.',

          'brand_form_page_kategori_hatasi': 'Erreur dans les informations de la catégorie.',

          'brand_form_page_kategori_orani_hatasi': 'Erreur dans le taux de catégorie.',

          'brand_form_page_eksik_bilgi': 'Informations incomplètes! Veuillez vérifier les données saisies',

          'brand_form_page_sonraki_alisverisin':
              'Pour être sûr de gagner des dons sur votre prochain achat, voici ce qu’il faut savoir',

          'brand_form_page_adblock': 'Désactivez Adblock et les autres extensions de navigateur',

          'brand_form_page_adblock_content':
              'Les programmes anti-publicité comme Adblock et certaines extensions de navigateur utilisent et/ou suppriment vos cookies. Dans ce cas, même si vous terminez votre achat en passant par Hangel, les cookies ne pourront pas être suivis et vos dons ne seront pas attribués.',

          'brand_form_page_internet_tarayicisi':
              'Assurez-vous que votre navigateur est activé pour autoriser les cookies',

          'brand_form_page_internet_tarayicisi_content':
              'Les magasins utilisent des cookies pour identifier votre achat effectué via Hangel. Une fois identifié, il est ajouté à votre compte de dons. Avant de passer au magasin via notre plateforme, veuillez vous assurer que votre navigateur autorise les cookies.',

          'brand_form_page_gizli_pencere':
              'Ne finalisez pas votre achat dans une fenêtre privée ou de navigation incognito',

          'brand_form_page_gizli_pencere_content':
              'Comme vos cookies ne sont pas suivis en mode incognito, les informations de clic réalisées via Hangel ne pourront pas être transmises au magasin. De ce fait, votre don ne sera pas crédité. En l’absence d’informations de clic, l’ajout manuel de votre don sera également impossible.',

          'brand_form_page_diger_programlar': 'N’utilisez pas d’autres programmes de cashback ou de don',

          'brand_form_page_diger_programlar_content':
              'Lorsque d’autres programmes de cashback/don/récompense/points comme Hangel sont utilisés, les magasins ne reconnaissent pas vos dons en raison de l’utilisation commune des cookies. Nous vous recommandons donc de n’utiliser que Hangel pour finaliser votre achat.',

          'brand_form_page_kupon_kodu': 'Utilisez uniquement les codes de réduction présents sur Hangel',

          'brand_form_page_kupon_kodu_content':
              'Si vous avez utilisé un code de réduction non listé sur Hangel (comme des codes du magasin ou des sites de coupons), votre don risque de ne pas être attribué par le magasin. Les magasins établissant leurs propres conditions, les dons ne sont pas pris en compte avec les codes non spécifiés sur notre site.',

          'brand_form_page_fiyat_karsilastirma':
              'N’utilisez pas de sites de comparaison de prix ou de codes de réduction avant votre achat sur Hangel',

          'brand_form_page_fiyat_karsilastirma_content':
              'Les sites de comparaison de prix et de codes de réduction perçoivent des commissions de vente des magasins, comme Hangel, en suivant vos cookies. Si vous visitez ces sites avant de finaliser votre achat sur Hangel, vos cookies seront supprimés ou écrasés.',

          'brand_form_page_mobil_uygulama':
              'N’utilisez pas l’application mobile du magasin (sauf AliExpress et certains autres magasins)',

          'brand_form_page_mobil_uygulama_content':
              'Si vous effectuez vos achats via un appareil mobile, utilisez uniquement les versions de navigateur des magasins / services de réservation. Si vous utilisez l’application mobile du magasin pour réaliser votre achat, aucun don ne sera attribué, sauf pour certains magasins.',

          'brand_form_page_sepet':
              'Ajoutez des produits à votre panier d\'achat uniquement après avoir cliqué sur Hangel',

          'brand_form_page_sepet_content':
              'Certaines boutiques exigent que votre panier d\'achat soit vide pour que vous puissiez compléter l\'achat et bénéficier des dons Hangel.',

          'brand_form_page_diger_para_iadesi':
              'Si vous rencontrez fréquemment des problèmes d’affichage de dons, effacez vos cookies',

          'brand_form_page_diger_para_iadesi_content':
              'Si vous rencontrez fréquemment des problèmes d’affichage de dons, nous vous recommandons de nettoyer vos cookies.',

          'brand_form_page_site_ziyaret': 'Ne complétez pas votre achat sans cliquer sur la boutique via Hangel',

          'brand_form_page_site_ziyaret_content':
              'Si vous avez visité la boutique sans cliquer d\'abord sur Hangel, la boutique ne suivra pas correctement les cookies et vos dons ne seront pas crédités.',

          'brand_form_page_ortak_sirketler':
              'Évitez de visiter les sites faisant la publicité de boutiques partenaires de Hangel',

          'brand_form_page_ortak_sirketler_content':
              'Si vous avez des onglets avec des bannières ou liens publicitaires ouverts pendant votre achat, vos dons ne seront pas crédités.',

          'brand_form_page_telefon_siparis': 'Ne passez pas de commande par téléphone',

          'brand_form_page_telefon_siparis_content':
              'Aucune boutique n’offre de dons pour les commandes/réservations effectuées par téléphone.',

          'brand_form_page_farkli_ulke':
              'N\'effectuez pas de commande depuis la page boutique d’un autre pays (par exemple, AliExpress Russie)',

          'brand_form_page_farkli_ulke_content':
              'Les dons ne sont disponibles que pour les achats effectués via les liens de la plateforme Hangel.',

          'brand_form_page_markanin_ozel_kosullari':
              'Consultez les conditions spécifiques de la boutique avant de compléter votre achat',

          'brand_form_page_markanin_ozel_kosullari_content':
              'Certains produits ou vendeurs peuvent ne pas être inclus dans le programme de dons.',

          'brand_form_page_tamam': 'D\'accord',

          // DonationHistoryPage Keys...

          'donation_history_page_bagislarim': 'Mes dons',

          'donation_history_page_total_donation_error': 'Erreur lors de l\'obtention du montant total des dons.',

          'donation_history_page_realized_donation': 'Don Réalisé',

          'donation_history_page_no_donations': 'Aucun don trouvé.',

          'donation_history_page_donation_details': 'Détails du Don',

          'donation_history_page_stk1_error': 'Impossible d\'obtenir les informations STK1',

          'donation_history_page_stk2_error': 'Impossible d\'obtenir les informations STK2',

          'donation_history_page_close': 'Fermer',

          'donation_history_page_donated_stks': 'STK Donnés',

          'donation_history_page_brand': 'Marque',

          'donation_history_page_brand_loading': 'Chargement de la marque...',

          'donation_history_page_retry_brand': 'Recharger la Marque',

          'donation_history_page_brand_info_error': 'Impossible d\'obtenir les informations de la marque',

          'donation_history_page_amount': 'Montant',

          'donation_history_page_donation_amount': 'Montant du Don',

          'donation_history_page_order_number': 'Numéro de Commande',

          'donation_history_page_order_date': 'Date de Commande',

          // FavoritesPage Keys...

          'favorites_page_title': 'Mes Favoris',

          'favorites_page_search_hint': 'Effectuer une recherche...',

          'favorites_page_favorilerim': 'Mes Favoris',

          'favorites_page_markalar': 'Marques',

          'favorites_page_stklar': 'STK',

          'favorites_page_error_occurred': 'Une erreur est survenue.',

          'favorites_page_no_favorites_brands': 'Aucune marque favorite.',

          'favorites_page_no_favorites_stks': 'Aucun STK favori.',

          'favorites_page_brand_loading': 'Chargement de la marque...',

          'favorites_page_retry_brand': 'Recharger la Marque',

          'favorites_page_brand_info_error': 'Impossible d\'obtenir les informations de la marque',

          'favorites_page_amount': 'Montant',

          // FrequentlyAskedQuestionsPage Keys...

          'faq_page_title': 'Questions Fréquemment Posées',

          'faq_question_1_title': 'Quelles données conservons-nous dans notre politique?',

          'faq_question_1_description':
              'Nous conservons les noms, adresses, adresses électroniques et déclarations de cadeaux d\'assistance fournis par les membres (utilisateurs). Nous conservons également les noms des personnes de contact, adresses, adresses électroniques et numéros de téléphone fournis par les administrateurs à certaines fins. De plus, nous enregistrons les informations des STK soutenus et des marques achetées via Hangel.',

          'faq_question_2_title':
              "Quels sont les fondements légaux pour le 'stockage' et le 'traitement' de vos données?",

          'faq_question_2_description':
              'Nous conservons vos données en raison de notre "intérêt légitime" à enregistrer votre adhésion, les objectifs que vous soutenez, et les dons que vous fournissez. Nous vous enverrons des informations périodiques concernant votre compte et confirmerons les modifications que vous effectuez. Nous envoyons également divers e-mails marketing liés à des offres, des conseils importants, de nouvelles fonctionnalités, etc. Pour ces e-mails, nous avons besoin d\'un consentement explicite et nous avons demandé une nouvelle confirmation pour garantir un enregistrement correct auprès de notre audience actuelle.',

          'faq_question_3_title': "Puis-je demander la suppression de mes données?",

          'faq_question_3_description':
              "Vous avez le droit de demander la modification ou la suppression des informations que nous détenons à votre sujet. Nous garantissons que vos données sont conservées en toute confidentialité et ne sont utilisées que par les personnes concernées pour réaliser nos activités. Nous ne partageons ces informations avec aucune institution officielle, sauf si cela est nécessaire pour fournir les services que nous proposons (par exemple, marketing par e-mail, gestion des requêtes, etc.).",

          'faq_question_4_title': "Pourquoi mon don direct n'apparaît-il pas dans mon compte?",

          'faq_question_4_description':
              "Si vous avez effectué un don direct pour un objectif, il peut falloir quelques semaines pour que le don apparaisse dans votre compte de soutien. Si votre don direct n'apparaît pas après cette période, veuillez nous contacter en utilisant l'option de formulaire de contact.",

          'faq_question_5_title': "Y a-t-il des frais d'abonnement mensuels ou annuels?",

          'faq_question_5_description':
              "Les utilisateurs, marques, ONG ou personnes collectant des dons avec autorisation spéciale ne paient en aucun cas de cotisations ou de frais similaires.",

          'faq_question_6_title':
              "Dans quelles conditions les utilisateurs peuvent-ils modifier les objectifs qu'ils soutiennent?",

          'faq_question_6_description':
              "Lors de la première inscription, un utilisateur qui soutient une cause ne choisit pas uniquement une association. Nous encourageons les utilisateurs à soutenir au moins deux causes afin de promouvoir le soutien croisé de différents objectifs, permettant une collecte de dons plus efficace pour les causes soutenues.",

          'faq_question_7_title': "Quand puis-je changer l'objectif que je soutiens?",

          'faq_question_7_description': "Vous pouvez le modifier 21 jours après la date de votre sélection initiale.",

          'faq_question_8_title': "Pourcentage de dons et aide-cadeau - Comment cela fonctionne-t-il?",

          'faq_question_8_description':
              "Les commissions obtenues sur vos achats sont désormais transformées en impact social avec Hangel. Avec votre soutien, vous contribuez à un impact social et participez à la résolution des problèmes sociaux.",

          'faq_question_9_title': "Comment puis-je m'inscrire?",

          'faq_question_9_description':
              "Selon l'infrastructure de votre téléphone, téléchargez l'application depuis l'App Store.",

          'faq_question_10_title': "Fonds d'impact social de Hangel",

          'faq_question_10_description':
              "Notre Fonds d'Impact Social aide à fournir des revenus indispensables aux organisations soutenant des initiatives sociales visant à résoudre nos problèmes sociaux et qui sont vitales pour la durabilité des solutions. Ce magnifique groupe, composé d'écoles, d'organismes de bienfaisance (grands et petits), de groupes communautaires, de clubs sportifs amateurs et d'entreprises sociales, a désespérément besoin de soutien supplémentaire pour continuer. Nous sommes passionnés par le soutien de toutes les bonnes causes, grandes ou petites; Ensemble, nous bâtissons une Nation Donatrice pour faire une différence significative. Rejoignez-nous.",

          // ProfilePage Keys...

          'profile_page_title': 'Mon Profil',

          'profile_page_add_photo': 'Ajouter une Photo',

          'profile_page_supported_ngos': 'ONG Soutenues',

          'profile_page_error_occurred': 'Une erreur est survenue.',

          'profile_page_total_donation': 'Montant Total des Dons',

          'profile_page_donation_count': 'Nombre de Dons',

          'profile_page_membership_date': 'Date d\'Adhésion',

          'profile_page_volunteer_organizations': 'Organisations de Bénévolat',

          'profile_page_project_count': 'Nombre de Projets',

          'profile_page_total_hours': 'Heures Totales',

          'profile_page_gender': 'Sexe',

          'profile_page_email': 'E-mail',

          'profile_page_phone': 'Téléphone',

          'profile_page_birth_date': 'Date de Naissance',

          'profile_page_location': 'Région/Ville/Quartier',

          'profile_page_update_info': 'Mettre à Jour les Informations',

          'profile_page_stk_application_form': 'Formulaire de Demande ONG',

          'profile_page_stk_application_form_button': 'Formulaire de Demande ONG',

          'profile_page_brand_application_form_button': 'Formulaire de Demande de Marque',

          'profile_page_personal_info': 'Informations Personnelles',

          'profile_page_volunteer': 'Bénévole',

          'profile_page_statistics': 'Statistiques',

          'profile_page_no_supported_ngos': 'Aucune ONG Soutenue.',

          // STKDetailPage Keys...

          'stk_detail_about': 'À Propos',

          'stk_detail_join_date_label': 'Date d\'Adhésion à la Plateforme: ',

          'stk_detail_earthquake_zone': 'Zone Sismique',

          'stk_detail_total_donation': 'Total des Dons',

          'stk_detail_process_count': 'Nombre de Transactions',

          'stk_detail_donor_count': 'Nombre de Donateurs',

          'stk_detail_type': 'Type',

          'stk_detail_categories': 'Catégories',

          'stk_detail_un_goals': 'Objectifs de Durabilité de l’ONU',

          'stk_detail_field': 'Domaine',

          'stk_detail_general_info': 'Informations Générales',

          'stk_detail_statistics': 'Statistiques',

          // STKFormWidget Keys...

          'stk_form_invalid_registry_number': 'Numéro de Registre Invalide',

          'stk_form_invalid_tax_number': 'Numéro de Taxe Invalide',

          'stk_form_invalid_short_name': 'Nom Abrégé Invalide',

          'stk_form_invalid_full_name': 'Nom Complet Invalide',

          'stk_form_invalid_iban': 'Numéro IBAN Invalide',

          'stk_form_invalid_contact_person_name': 'Nom Prénom Invalide',

          'stk_form_invalid_contact_person_phone': 'Numéro de Téléphone Invalide',

          'stk_form_invalid_contact_person_email': 'Adresse Email Invalide',

          'stk_form_invalid_contact_person_job': 'Poste/Position Invalide',

          'stk_form_invalid_website': 'Site Web Invalide',

          'stk_form_invalid_email': 'Adresse Email Invalide',

          'stk_form_invalid_phone': 'Numéro de Téléphone Invalide',

          'stk_form_invalid_founder_name': 'Nom Complet du Fondateur Invalide',

          'stk_form_invalid_logo': 'Le logo n’a pas été chargé correctement.',

          'stk_form_invalid_address_info': 'Erreur dans les informations d’adresse.',

          'stk_form_invalid_tuzuk': 'Erreur dans le document des statuts.',

          'stk_form_invalid_faaliyet': 'Erreur dans le document d’activité.',

          'stk_form_invalid_sector': 'Erreur dans l’information du secteur d’activité.',

          'stk_form_invalid_category': 'Erreur dans l’information de catégorie.',

          'stk_form_invalid_bm': 'Erreur dans les informations des objectifs de l’ONU.',

          'stk_form_invalid_type': 'Erreur dans le type d’ONG',

          'stk_form_incomplete_info': 'Informations incomplètes! Veuillez vérifier les données saisies.',

          // SelectFavoriteStkPage Keys...

          'select_favorite_stk_title': 'Sélectionnez ONG Préférée',

          'select_favorite_stk_skip': 'Passer',

          'select_favorite_stk_instruction':
              'Sélectionnez l’ONG que vous souhaitez soutenir pendant 30 jours. Rappelez-vous que vous pouvez changer l’ONG soutenue après 30 jours.',

          'select_favorite_stk_all': 'Tous',

          'select_favorite_stk_association': 'Association',

          'select_favorite_stk_foundation': 'Fondation',

          'select_favorite_stk_special_permission': 'Autorisation Spéciale',

          'select_favorite_stk_min_error': 'Vous devez sélectionner au moins 2 ONG!',

          'select_favorite_stk_max_error': 'Vous ne pouvez sélectionner que jusqu’à 2 ONG!',

          'select_favorite_stk_success': 'Les ONG favorites ont été mises à jour avec succès',

          'select_favorite_stk_error_code': 'Une erreur est survenue! Code d’erreur: 00321',

          'select_favorite_stk_sort_name': 'Par Nom',

          'select_favorite_stk_sort_favorite_count': 'Par Nombre de Favoris',

          'select_favorite_stk_sort_donor_count': 'Par Nombre de Donateurs',

          'select_favorite_stk_filter_all': 'Tous',

          'select_favorite_stk_filter_earthquake': 'Zone Sismique',

          'select_favorite_stk_filter_special_status': 'Statut Spécial',

          'select_favorite_stk_animals': 'Animaux',

          'select_favorite_stk_poverty': 'Pauvreté',

          'select_favorite_stk_education': 'Éducation',

          'select_favorite_stk_health': 'Santé',

          'select_favorite_stk_agriculture': 'Agriculture',

          'select_favorite_stk_refugees': 'Réfugiés',

          'select_favorite_stk_law': 'Droit',

          'select_favorite_stk_earthquake': 'Séisme',

          'select_favorite_stk_food': 'Alimentation',

          'select_favorite_stk_religious': 'Religieux',

          'select_favorite_stk_social_entrepreneurship': 'Entrepreneuriat Social',

          'select_favorite_stk_entrepreneurship': 'Entrepreneuriat',

          'select_favorite_stk_culture_art': 'Culture et Art',

          'select_favorite_stk_sports': 'Sports',

          'marka_favorilemediniz': 'Vous n’avez pas encore de Marque en favori.',

          'stk_eklemediniz': 'Vous n’avez pas encore ajouté d’ONG.',

          'marka_gozat': 'Explorer les Marques',

          // STKPage Keys...

          'stk_page_all': 'Tous',

          'stk_page_associations': 'Associations',

          'stk_page_foundations': 'Fondations',

          'stk_page_special_permissions': 'Autorisation Spéciale',

          'stk_page_stks': 'ONGs',

          'stk_page_filter_earthquake_zone': 'Zone Sismique',

          'stk_page_filter_special_status': 'Statut Spécial',

          'stk_page_filter_all': 'Tous',

          'stk_page_sort_by_name': 'Par Nom',

          'stk_page_sort_by_favorite': 'Par Nombre de Favoris',

          'stk_page_sort_by_donor': 'Par Nombre de Donateurs',

          'basvuruldu': 'Postulé',

          'basvur': 'Postuler',

          'kisi_basvurdu': 'personnes ont postulé',

          'gonullu_ilanlari': 'Annonces de Bénévolat des ONG',

          // SettingsPage Keys...

          'settings_page_title': 'Paramètres',

          'settings_page_about_us': 'À Propos de Nous',

          'settings_page_user_agreement': 'Conditions d’Utilisation',

          'settings_page_privacy_policy': 'Politique de Confidentialité',

          'settings_page_faq': 'FAQ',

          'settings_page_user_agreement_text': """

  Il est important de lire attentivement ce Contrat d’Utilisateur avant d’utiliser l’application Hangel ("Contrat"). Ce Contrat définit les conditions d’utilisation de l’application Hangel ("Application") fournie par Hangel ("Entreprise", "nous").


  1. Acceptation

  En utilisant l’application, vous acceptez ce Contrat. Si vous n’acceptez pas ce Contrat, vous ne devez pas utiliser l’application.


  2. Modifications

  Nous pouvons modifier ce Contrat de temps à autre. Nous vous informerons lorsque les modifications entreront en vigueur. Si vous n’acceptez pas les modifications, vous devez cesser d’utiliser l’application.



  Avant d'utiliser l'application Hangel, il est important de lire attentivement ce Contrat d'Utilisateur ("Contrat"). Ce Contrat définit les termes et conditions de l'utilisation de l'application Hangel ("Application") fournie par Hangel ("Entreprise", "nous", "notre").


  3. Utilisation de l'Application

  Vous ne devez utiliser l'Application qu'à des fins légales et éthiques. En utilisant l'Application, vous acceptez de ne pas:

  - Utiliser l'Application pour des activités illégales ou nuisibles.

  - Télécharger ou partager du contenu qui enfreint les droits d'auteur, marques ou autres droits de propriété intellectuelle.

  - Télécharger ou partager du contenu contenant des discours haineux, menaces ou harcèlement.

  - Envoyer du spam ou des courriers indésirables.

  - Télécharger ou distribuer des virus ou autres logiciels nuisibles.

  - Essayer d'obtenir un accès non autorisé aux systèmes de l'Entreprise ou de tiers.


  4. Propriété

  L'Application et tout son contenu sont la propriété de l'Entreprise. L'utilisation de l'Application ne vous accorde aucun droit de propriété.


  5. Déni de Responsabilité

  Vous acceptez l'Application "en l'état" et "telle que disponible". L'Entreprise ne garantit pas un fonctionnement ininterrompu ou sans erreur de l'Application. L'Entreprise ne sera pas responsable des dommages directs ou indirects résultant de l'utilisation de l'Application.


  6. Résiliation

  L'Entreprise se réserve le droit de suspendre l'accès à l'Application ou de fermer l'Application à tout moment et pour toute raison.


  7. Résolution des Litiges

  Tout litige découlant de ce Contrat ou lié à celui-ci sera résolu selon les lois de la République de Turquie.


  8. Entrée en Vigueur

  Ce Contrat est en vigueur à compter du 12 mars 2024.


  9. Contact

  Pour toute question relative à ce Contrat, veuillez nous contacter.

  """,

          'settings_page_privacy_policy_text': """

  Avant d'utiliser l'application Hangel, il est important de lire attentivement cette Politique de Confidentialité ("Politique"). Cette Politique explique les informations que Hangel ("Entreprise", "nous", "notre") collecte, comment nous utilisons et partageons ces informations, et les mesures que nous prenons pour les protéger.


  1. Informations Collectées

  Nous pouvons collecter les informations suivantes:

  - Informations Personnelles: Cela inclut votre nom, prénom, adresse e-mail, numéro de téléphone, adresse et date de naissance.

  - Informations de Compte: Cela inclut votre nom d'utilisateur, mot de passe et photo de profil.

  - Informations d'Achat: Cela inclut les produits achetés, les dates d'achat et les montants.

  - Informations sur l'Appareil: Cela inclut votre adresse IP, système d'exploitation, type de navigateur, etc.

  - Informations d'Utilisation: Cela inclut des informations sur votre utilisation de l'application Hangel.


  2. Utilisation des Informations

  Nous pouvons utiliser les informations collectées aux fins suivantes:

  - Fournir et améliorer l'application Hangel: Nous utilisons vos informations pour créer votre compte, traiter vos achats et vous offrir la meilleure expérience possible.

  - Communiquer: Nous utilisons vos informations pour vous tenir informé des mises à jour, promotions et autres informations concernant l'application.

  - Publicité: Nous utilisons vos informations pour vous proposer des publicités correspondant à vos intérêts.

  - Recherche et développement: Nous utilisons vos informations pour améliorer l'application Hangel et nos services.

  - Conformité légale: Nous utilisons vos informations pour respecter les exigences légales et répondre aux demandes juridiques.


  3. Partage des Informations

  Nous pouvons partager les informations collectées avec des tiers dans les cas suivants:

  - Prestataires de Services: Nous partageons vos informations avec des prestataires tiers pour fournir l'application Hangel.

  - Exigences légales: Nous partageons vos informations pour se conformer aux exigences légales ou répondre aux demandes juridiques.

  - Annonceurs: Nous partageons vos informations avec des annonceurs pour vous proposer des publicités adaptées à vos intérêts.

  - Données anonymisées: Nous partageons des données anonymisées, qui ne permettent pas de vous identifier personnellement, avec des tiers pour des fins de recherche et développement.


  4. Sécurité

  Nous prenons des mesures techniques et administratives pour protéger vos informations, notamment:

  - Cryptage des données

  - Utilisation de centres de données sécurisés

  - Mise en place de contrôles d'accès

  - Formation du personnel de sécurité


  5. Vos Droits

  Vous avez les droits suivants concernant vos informations personnelles:

  - Accès: Vous avez le droit de demander une copie de vos informations personnelles.

  - Rectification: Vous avez le droit de corriger les informations personnelles incorrectes ou incomplètes.

  - Suppression: Vous avez le droit de demander la suppression de vos informations personnelles.

  - Restriction du traitement: Vous avez le droit de restreindre le traitement de vos informations personnelles.

  - Portabilité: Vous avez le droit de transférer vos informations personnelles à un autre contrôleur.

  - Opposition: Vous avez le droit de vous opposer au traitement de vos informations personnelles.


  6. Modifications

  Nous pouvons modifier cette Politique de Confidentialité de temps en temps. Nous vous informerons lorsque les modifications entreront en vigueur.


  7. Contact

  Pour toute question concernant cette Politique de Confidentialité, veuillez nous contacter.


  8. Entrée en Vigueur

  Cette Politique de Confidentialité est en vigueur à compter du 12 mars 2024.

  """,

          'yes': 'Oui',

          'no': 'Non',

          'info': 'Informations',

          'statistics': 'Statistiques',

          'ara': 'Rechercher',

          'brand_detail_page_join_date_label': 'Date d’Adhésion à la Plateforme: '
        },
        'ar': {
          "user_ban_page_description": "لقد تم وضع علامة على حسابك على أنه غير نشط. إذا كنت تعتقد أن هناك خطأ، يمكنك الاتصال بنا.",
          "stk_form_validation_error": "يرجى تعبئة الحقول المطلوبة",
          "stk_form_type": "النوع",
          "stk_form_type_association": "جمعية",
          "stk_form_type_foundation": "مؤسسة",
          "stk_form_type_sports_club": "نادي رياضي",
          "stk_form_type_special_permission": "جمع تبرعات بإذن خاص",
          "stk_form_invalid_id_no": "يرجى إدخال رقم هوية صالح",
          "stk_form_tax_number": "الرقم الضريبي",
          "stk_form_invalid_tax_number": "يرجى إدخال رقم ضريبي صالح",
          "stk_form_tax_office": "مكتب الضرائب",
          "stk_form_invalid_tax_office": "يرجى إدخال مكتب ضرائب صالح",
          "stk_form_short_name": "الاسم المختصر",
          "stk_form_invalid_short_name": "يرجى إدخال اسم مختصر صالح",
          "stk_form_full_name": "الاسم الكامل",
          "stk_form_invalid_full_name": "يرجى إدخال اسم كامل صالح",
          "stk_form_establishment_year": "سنة التأسيس",
          "stk_form_invalid_establishment_year": "يرجى إدخال سنة تأسيس صالحة",
          "stk_form_iban_no": "رقم IBAN",
          "stk_form_invalid_iban": "يرجى إدخال رقم IBAN صالح",
          "stk_form_logo": "الشعار",
          "stk_form_logo_info": "يجب أن يكون الشعار بصيغة PNG أو JPG وبحجم 512x512.",
          "stk_form_website": "الموقع الإلكتروني",
          "stk_form_invalid_website": "يرجى إدخال موقع إلكتروني صالح",
          "stk_form_email": "البريد الإلكتروني",
          "stk_form_invalid_email": "يرجى إدخال بريد إلكتروني صالح",
          "stk_form_phone": "رقم الهاتف",
          "stk_form_invalid_phone": "يرجى إدخال رقم هاتف صالح",
          "stk_form_city": "المدينة",
          "stk_form_district": "المنطقة",
          "stk_form_neighborhood": "الحي",
          "stk_form_remaining_address": "تفاصيل العنوان المتبقية",
          "stk_form_invalid_remaining_address": "يرجى إدخال تفاصيل العنوان",
          "stk_form_statute": "نظام الجمعية أو المؤسسة",
          "stk_form_statute_info": "يجب أن يكون الملف بصيغة PDF وأقل من 6 ميجابايت.",
          "stk_form_activity_certificate": "شهادة النشاط",
          "stk_form_activity_certificate_info":
              "يجب أن يكون الملف بصيغة PDF وأقل من 6 ميجابايت، وأن يكون صادرًا خلال آخر 7 أيام عمل.",
          "stk_form_activity_area": "مجال النشاط في المديرية",
          "stk_form_beneficiaries": "المستفيدون",
          "stk_form_un_sdgs": "أهداف التنمية المستدامة للأمم المتحدة",
          "stk_form_applicant_info": "معلومات مقدم الطلب",
          "stk_form_applicant_name": "الاسم الكامل",
          "stk_form_invalid_applicant_name": "يرجى إدخال اسم صالح",
          "stk_form_applicant_phone": "رقم الهاتف",
          "stk_form_invalid_applicant_phone": "يرجى إدخال رقم هاتف صالح",
          "stk_form_applicant_email": "البريد الإلكتروني",
          "stk_form_invalid_applicant_email": "يرجى إدخال بريد إلكتروني صالح",
          "stk_form_applicant_position": "الوظيفة",
          "stk_form_invalid_applicant_position": "يرجى إدخال وظيفة صالحة",
          "stk_form_governorate_permission_document": "وثيقة إذن المحافظة",
          "stk_form_governorate_permission_document_info": "يجب أن يكون الملف بصيغة JPG أو PDF.",
          "stk_form_stk_il_mudurlugu_yetki_belgesi": "شهادة تفويض المديرية",
          "stk_form_stk_il_mudurlugu_yetki_belgesi_info": "يجب أن يكون الملف بصيغة JPG أو PDF.",
          "stk_form_permission_start_date": "تاريخ بدء الإذن",
          "stk_form_invalid_permission_start_date": "يرجى اختيار تاريخ صالح",
          "stk_form_permission_end_date": "تاريخ انتهاء الإذن",
          "stk_form_invalid_permission_end_date": "يرجى اختيار تاريخ صالح",
          "stk_form_permission_granting_governorate": "المحافظة المانحة للإذن",
          "stk_form_activity_number": "رقم النشاط",
          "stk_form_invalid_activity_number": "يرجى إدخال رقم نشاط صالح",
          "stk_form_campaign_name": "اسم الحملة",
          "stk_form_invalid_campaign_name": "يرجى إدخال اسم حملة صالح",
          "stk_form_birth_date": "تاريخ الميلاد",
          "stk_form_invalid_birth_date": "يرجى اختيار تاريخ صالح",
          "stk_form_photo": "الصورة",
          "stk_form_photo_info": "يجب أن تكون الصورة بصيغة PNG أو JPG.",
          "stk_form_permission_purpose": "غرض الإذن",
          "stk_form_invalid_permission_purpose": "يرجى إدخال غرض الإذن",
          "stk_form_applicant_relation": "درجة القرابة",
          "stk_form_invalid_applicant_relation": "يرجى إدخال درجة قرابة صالحة",
          "stk_form_submit": "إرسال",
          "stk_form_registry_number": "رقم السجل",
          "stk_form_registry_number_foundation": "رقم المؤسسة",
          "stk_form_sector_professional_associations": "الجمعيات المهنية",
          "stk_form_sector_religious_services": "جمعيات الخدمات الدينية",
          "stk_form_sector_sports": "جمعيات رياضية",
          "stk_form_sector_humanitarian_aid": "جمعيات الإغاثة الإنسانية",
          "stk_form_sector_education_research": "جمعيات التعليم والبحث",
          "stk_form_sector_culture_art_tourism": "جمعيات الثقافة والفنون والسياحة",
          "stk_form_sector_social_values": "جمعيات القيم الاجتماعية",
          "stk_form_sector_environment": "جمعيات حماية البيئة والحياة البرية",
          "stk_form_sector_health": "جمعيات الصحة",
          "stk_form_sector_personal_development": "جمعيات التطوير الشخصي والاجتماعي",
          "stk_form_sector_urban_development": "جمعيات التنمية الحضرية",
          "stk_form_sector_advocacy": "جمعيات المناصرة",
          "stk_form_sector_disabilities": "جمعيات لذوي الإعاقة",
          "stk_form_sector_thought_based": "جمعيات فكرية",
          "stk_form_sector_public_support": "جمعيات دعم المؤسسات العامة",
          "stk_form_sector_food_agriculture": "جمعيات الغذاء والزراعة",
          "stk_form_sector_diaspora": "جمعيات المغتربين",
          "stk_form_sector_international_cooperation": "جمعيات التعاون الدولي",
          "stk_form_sector_veterans": "جمعيات المحاربين القدامى",
          "stk_form_sector_elderly_children": "جمعيات لكبار السن والأطفال",
          "stk_form_sector_children": "جمعيات للأطفال",
          "stk_form_sector_other": "أخرى",
          "stk_form_beneficiaries_animals": "الحيوانات",
          "stk_form_beneficiaries_poor": "الفقراء",
          "stk_form_beneficiaries_education": "التعليم",
          "stk_form_beneficiaries_health": "الصحة",
          "stk_form_beneficiaries_agriculture": "الزراعة",
          "stk_form_beneficiaries_refugees": "اللاجئون",
          "stk_form_beneficiaries_law": "القانون",
          "stk_form_beneficiaries_earthquake": "الزلزال",
          "stk_form_beneficiaries_food": "الغذاء",
          "stk_form_beneficiaries_religious": "الدينية",
          "stk_form_beneficiaries_social_entrepreneurship": "ريادة الأعمال الاجتماعية",
          "stk_form_beneficiaries_entrepreneurship": "ريادة الأعمال",
          "stk_form_beneficiaries_culture_art": "الثقافة والفنون",
          "stk_form_beneficiaries_sports": "الرياضة",
          "stk_form_un_goal_no_poverty": "لا للفقر",
          "stk_form_un_goal_zero_hunger": "لا للجوع",
          "stk_form_un_goal_good_health": "الصحة الجيدة والرفاه",
          "stk_form_un_goal_quality_education": "التعليم الجيد",
          "stk_form_un_goal_gender_equality": "المساواة بين الجنسين",
          "stk_form_un_goal_clean_water": "المياه النظيفة والصرف الصحي",
          "stk_form_un_goal_clean_energy": "طاقة نظيفة ومتاحة",
          "stk_form_un_goal_decent_work": "العمل اللائق والنمو الاقتصادي",
          "stk_form_un_goal_industry": "الصناعة والابتكار والبنية التحتية",
          "stk_form_un_goal_reduced_inequalities": "تقليل الفوارق",
          "stk_form_un_goal_sustainable_cities": "مدن ومجتمعات مستدامة",
          "stk_form_un_goal_responsible_consumption": "الاستهلاك والإنتاج المسؤولان",
          "stk_form_un_goal_climate_action": "العمل المناخي",
          "stk_form_un_goal_life_below_water": "الحياة تحت الماء",
          "stk_form_un_goal_life_on_land": "الحياة على اليابسة",
          "stk_form_un_goal_peace_justice": "السلام والعدل والمؤسسات القوية",
          "stk_form_un_goal_partnerships": "الشراكات لتحقيق الأهداف",
          "missing_donation_form_page_title": "تبرعي لا يظهر",
          "missing_donation_form_brand": "العلامة التجارية",
          "missing_donation_form_order_number": "رقم الطلب",
          "missing_donation_form_date": "التاريخ",
          "missing_donation_form_cart_amount": "قيمة السلة",
          "missing_donation_form_registry_id": "معرف التسجيل",
          "missing_donation_form_phone": "رقم الهاتف",
          "missing_donation_form_send": "إرسال",
          "missing_donation_form_fill_all_fields": "يرجى ملء جميع الحقول",
          "missing_donation_form_invalid_phone": "يرجى إدخال رقم هاتف صالح",
          "missing_donation_form_success": "تم إرسال طلبك بنجاح",
          "missing_donation_form_error": "حدث خطأ أثناء إرسال طلبك",
          "support_form_name": "الاسم الكامل",
          "support_form_email": "البريد الإلكتروني",
          "support_form_phone": "الهاتف",
          "support_form_user_type": "نوع المستخدم",
          "support_form_user_type_individual": "أنا مستخدم فردي",
          "support_form_user_type_stk_manager": "أنا مدير منظمة غير حكومية",
          "support_form_user_type_brand_manager": "أنا مدير علامة تجارية",
          "support_form_subject": "الموضوع",
          "support_form_message": "الرسالة",
          "support_form_send": "إرسال",
          "support_form_invalid_email": "يرجى إدخال بريد إلكتروني صالح",
          "support_form_invalid_phone": "يرجى إدخال رقم هاتف صالح",
          "support_form_fill_all_fields": "يرجى ملء جميع الحقول",
          "support_form_invalid_name": "يرجى إدخال اسم صالح",
          "support_form_invalid_subject": "يرجى إدخال موضوع",
          "support_form_invalid_message": "يرجى إدخال رسالة",
          "donation_history_page_my_donation_not_showing": "تبرعي لا يظهر",

          'settings_page_change_language': 'تغيير اللغة',

          // HomePage Keys...

          'home_page_donation_rate': 'معدل التبرع',

          'home_page_connection_problem': 'مشكلة في الاتصال!',

          'home_page_search_brand': 'ابحث عن علامة تجارية',

          'home_page_brands': 'علامات تجارية',

          'home_page_all': 'الكل',

          'home_page_sort_donation_rate_desc': 'معدل التبرع من الأعلى إلى الأدنى',

          'home_page_sort_donation_rate_asc': 'معدل التبرع من الأدنى إلى الأعلى',

          'home_page_sort_newest_oldest': 'من الأحدث إلى الأقدم',

          'home_page_sort_oldest_newest': 'من الأقدم إلى الأحدث',

          'home_page_sort_a_z': 'أ-ي',

          'home_page_sort_z_a': 'ي-أ',

          // RegisterPage Keys...

          'register_page_create_account': 'إنشاء حساب',

          'register_page_login': 'تسجيل الدخول',

          'register_page_full_name': 'الاسم الكامل',

          'register_page_phone_number': 'رقم الهاتف',

          'register_page_enter_phone': 'أدخل رقم هاتفك',

          'register_page_user_agreement': 'لقد قرأت وأوافق على "اتفاقية المستخدم".',

          'register_page_privacy_agreement': 'لقد قرأت وأوافق على "اتفاقية الخصوصية".',

          'register_page_error_fill_all_fields': 'يرجى ملء جميع الحقول بشكل صحيح!',

          'register_page_error_accept_agreements': 'يرجى قبول الاتفاقيات!',

          'register_page_error_unexpected': 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى',

          'register_page_error_invalid_code': 'يرجى إدخال الرمز بشكل صحيح!',

          'register_page_verify_code_prompt': 'يرجى إدخال الرمز المكون من 6 أرقام الذي تم إرساله إلى هاتفك.',

          'register_page_resend_code': 'إعادة إرسال',

          'register_page_didnt_receive_code': 'لم تتلقَ رمز التحقق؟',

          'register_page_verify': 'تحقق',

          'register_page_login_register_prompt_login': 'ليس لديك حساب؟ ',

          'register_page_login_register_prompt_register': 'هل لديك حساب؟ ',

          'register_page_login_register_action_login': 'تسجيل الدخول',

          'register_page_login_register_action_register': 'سجل',

          // AboutUsPage Keys...

          'about_us_page_title': 'معلومات عنا',

          // AppViewPage Keys...

          'app_view_about_us_title': 'معلومات عنا',

          'app_view_drawer_greeting': 'مرحبًا،',

          'app_view_drawer_profile': 'ملفي',

          'app_view_drawer_donations': 'تبرعاتي',

          'app_view_drawer_stks': "المنظمات غير الحكومية",

          'app_view_drawer_volunteer': 'متطوع',

          'app_view_drawer_social_companies': 'شركات اجتماعية',

          'app_view_drawer_settings': 'الإعدادات',

          'app_view_drawer_contact': 'اتصل بنا',

          'app_view_drawer_version': 'v1.0.1',

          'app_view_drawer_logout': 'تسجيل الخروج',

          'app_view_drawer_delete_account': 'حذف حسابي',

          'app_view_bottom_nav_markets': 'علامات تجارية',

          'app_view_bottom_nav_volunteer': 'متطوع',

          'app_view_bottom_nav_favorites': 'المفضلات',

          'app_view_bottom_nav_stks': "المنظمات غير الحكومية",

          'app_view_bottom_nav_profile': 'ملف',

          'app_view_exit_dialog_title': 'تسجيل الخروج',

          'app_view_exit_dialog_content':
              'لا يجب عليك تسجيل الخروج للاستمرار في المشاركة في الفائدة الاجتماعية من خلال مشترياتك.',

          'app_view_exit_dialog_button_accept': 'تسجيل الخروج',

          'app_view_exit_dialog_button_cancel': 'إلغاء',

          'app_view_delete_account_dialog_title': 'حذف حسابي',

          'app_view_delete_account_dialog_content':
              'لا يجب عليك حذف حسابك للاستمرار في المشاركة في الفائدة الاجتماعية من خلال مشترياتك.\nلا يمكن التراجع عن هذه العملية!',

          'app_view_delete_account_dialog_button_accept': 'حذف حسابي',

          'app_view_delete_account_dialog_button_cancel': 'إلغاء',

          'app_view_reauth_dialog_title': 'انتهت مدة الجلسة',

          'app_view_reauth_dialog_content': 'يرجى تسجيل الدخول مرة أخرى لحذف حسابك.',

          'app_view_reauth_dialog_button_ok': 'حسناً',

          'app_view_privacy_dialog_title': 'الخصوصية والإذن',

          // HomePage Keys...

          'about_us_page_description': """

  Hangel هو تطبيق يمكّن الأشخاص من التبرع بالنقاط التي يحصلون عليها من مشترياتهم للجمعيات الأهلية (NGO). مهمتنا هي تسهيل عملية التبرع وتمكين كل فرد من دعم الجمعيات الأهلية التي يحبها.


  كيف يعمل؟

  قم بتنزيل تطبيق Hangel وأنشئ حسابًا.

  اختر الجمعيات الأهلية التي تحبها في التطبيق.

  اختر Hangel كطريقة للدفع عند مشترياتك باستخدام بطاقة الائتمان أو بطاقة البنك الخاصة بك.

  احصل على نقاط من نفقاتك.

  تبرع بالنقاط التي حصلت عليها للجمعيات الأهلية التي اخترتها.


  لماذا Hangel؟

  سهل وعملية: لا تحتاج إلى قضاء دقائق للتبرع. يمكنك دعم الجمعيات الأهلية التي تحبها من خلال كسب النقاط من مشترياتك.

  آمن وشفاف: تتم جميع عملياتك بشكل آمن. يمكنك متابعة أين تذهب تبرعاتك بشكل شفاف.

  المسؤولية الاجتماعية: دع مشترياتك تحمل معنى مع Hangel. يمكنك إحداث فرق في المجتمع من خلال المساهمة للجمعيات الأهلية التي تحبها.


  يمكنك القيام بما يلي مع Hangel:

  دعم الجمعيات الأهلية التي تحبها.

  تتبع أين تذهب تبرعاتك.

  احصل على نقاط من مشترياتك لزيادة تبرعاتك.

  ساهم في المشاريع الاجتماعية.


  انضم إلى Hangel!

  من خلال الانضمام إلى Hangel، يمكنك المساهمة للجمعيات الأهلية التي تحبها وإفادة المجتمع. قم بتنزيل التطبيق الآن وابدأ في إحداث فرق!

  """,

          'app_view_privacy_dialog_content_part1': 'تحتاج تطبيقنا إلى إذنك لتقديم تجربة أفضل وأكثر تخصيصًا لك.',

          'app_view_privacy_dialog_button_accept': 'استمر',

          'app_view_privacy_dialog_button_cancel': 'إلغاء',

          'app_view_contact_support': 'اتصل بالدعم',

          'app_view_version': 'v1.0.1',

          // Close button in dialogs

          'close': 'إغلاق',

          // BrandDetailPage Keys...

          'brand_detail_page_bilgilendirmeler': 'إشعارات',

          'brand_detail_page_deprem_bolgesi': 'منطقة الزلزال',

          'brand_detail_page_sosyal_girisim': 'مبادرة اجتماعية',

          'brand_detail_page_toplam_bagis': 'إجمالي التبرع',

          'brand_detail_page_favori': 'المفضلة',

          'brand_detail_page_islem_sayisi': 'عدد العمليات',

          'brand_detail_page_kategoriler': 'الفئات',

          'brand_detail_page_bagis_orani': 'معدل التبرع',

          'brand_detail_page_deprem_bolgesi_mi': 'هل هي منطقة زلزال؟',

          'brand_detail_page_genel_bonus_kosullari': 'شروط المكافأة العامة',

          'brand_detail_page_alisverise_basla': 'ابدأ التسوق',

          'brand_detail_page_sonraki_alisveris_kosullari_title':
              'ما تحتاج إلى معرفته لتضمن كسب التبرع من عملية الشراء التالية',

          'brand_detail_page_sonraki_alisveris_kosullari_content1':
              'تحتاج تطبيقنا إلى إذنك لتقديم تجربة أفضل وأكثر تخصيصًا لك.',

          'brand_detail_page_sonraki_alisveris_kosullari_content2': 'يرجى النقر على زر "موافقة" للاستمرار.',

          'brand_detail_page_tamam': 'حسناً',

          'brand_detail_page_bagis_yansimama_mesaji1': 'يمكنك التبرع بنسبة %',

          'brand_detail_page_bagis_yansimama_mesaji2': ' من مشترياتك!',

          'brand_detail_page_bagis_yansimama_mesaji3': 'متوسط وقت دفع التبرع: 75 يومًا',

          'brand_detail_page_bagis_yansimama_mesaji4': 'شروط المكافأة العامة',

          'brand_detail_page_bagis_yansimama_mesaji5': 'ما تحتاج إلى معرفته لتضمن كسب التبرع من عملية الشراء التالية',

          'brand_detail_page_bagis_yansimama_mesaji6': 'لا يمكن التراجع عن هذه العملية!',

          'brand_detail_page_bagis_yansimama_mesaji7':
              'لا يجب عليك تسجيل الخروج للاستمرار في المشاركة في الفائدة الاجتماعية من خلال مشترياتك.',

          'brand_detail_page_bagis_yansimama_mesaji8': 'لا يجب عليك حذف حسابك للاستمرار في المشاركة في الف',

          'brand_form_page_markanin_mail_adresi': 'البريد الإلكتروني للعلامة التجارية',

          'brand_form_page_markanin_telefon_numarasi': 'رقم هاتف العلامة التجارية',

          'brand_form_page_kurucu_ad_soyad': 'اسم وعائلة مؤسس العلامة التجارية',

          'brand_form_page_sektor': 'القطاع',

          'brand_form_page_il': 'المحافظة',

          'brand_form_page_gecersiz_il': 'محافظة غير صالحة',

          'brand_form_page_ilce': 'المنطقة',

          'brand_form_page_gecersiz_ilce': 'منطقة غير صالحة',

          'brand_form_page_mahalle': 'الحي',

          'brand_form_page_gecersiz_mahalle': 'حي غير صالح',

          'brand_form_page_vergi_levhasi': 'السجل الضريبي',

          'brand_form_page_vergi_levhasi_info': 'يجب أن يكون السجل الضريبي بصيغة PDF.',

          'brand_form_page_vergi_numarasi': 'رقم الضريبة',

          'brand_form_page_gecersiz_vergi_numarasi': 'رقم ضريبة غير صالح',

          'brand_form_page_vergi_dairesi': 'الدائرة الضريبية',

          'brand_form_page_gecersiz_vergi_dairesi': 'دائرة ضريبية غير صالحة',

          'brand_form_page_sosyal_girisim': 'مبادرة اجتماعية',

          'brand_form_page_kategori': 'الفئة',

          'brand_form_page_gecersiz_kategori': 'فئة غير صالحة',

          'brand_form_page_bagis_orani': 'معدل التبرع',

          'brand_form_page_gecersiz_bagis_orani': 'معدل تبرع غير صالح',

          'brand_form_page_kategori_zaten_ekli': 'هذه الفئة مضافة بالفعل.',

          'brand_form_page_kategori_ekle': '+ إضافة فئة',

          'brand_form_page_gonder': 'إرسال',

          'brand_form_page_logo_hatasi': 'يوجد خطأ في معلومات الشعار.',

          'brand_form_page_banner_hatasi': 'يوجد خطأ في معلومات البانر.',

          'brand_form_page_sektor_hatasi': 'يوجد خطأ في معلومات القطاع.',

          'brand_form_page_adres_hatasi': 'يوجد خطأ في معلومات العنوان.',

          'brand_form_page_vergi_levhasi_hatasi': 'يوجد خطأ في معلومات السجل الضريبي.',

          'brand_form_page_kategori_hatasi': 'يوجد خطأ في معلومات الفئة.',

          'brand_form_page_kategori_orani_hatasi': 'يوجد خطأ في معلومات الفئة.',

          'brand_form_page_eksik_bilgi': 'أدخلت معلومات ناقصة! يرجى مراجعة البيانات المدخلة مرة أخرى.',

          'brand_form_page_sonraki_alisverisin': 'ما تحتاج إلى معرفته لتضمن كسب التبرع من عملية الشراء التالية',

          'brand_form_page_adblock': 'قم بإيقاف Adblock والإضافات الأخرى للمتصفح',

          'brand_form_page_adblock_content':
              'تستخدم برامج منع الإعلانات مثل Adblock وملحقات المتصفح ملفات تعريف الارتباط الخاصة بك وتقوم بحذفها. في هذه الحالة، حتى إذا قمت بإجراء عملية شراء عبر المتجر باستخدام Hangel، فلن يتم تتبع ملفات تعريف الارتباط الخاصة بك، وبالتالي لن تنعكس تبرعات المتجر.',

          'brand_form_page_internet_tarayicisi': 'تأكد من أن متصفح الإنترنت لديك مفعل للسماح بملفات تعريف الارتباط',

          'brand_form_page_internet_tarayicisi_content':
              'تستخدم المتاجر ملفات تعريف الارتباط لتعريف عملية الشراء التي قمت بها عبر Hangel. بعد التعريف، يتم إضافتها إلى حساب التبرعات الخاص بك. قبل الذهاب إلى المتجر عبر منصتنا، يرجى التأكد من أن متصفحك يسمح بملفات تعريف الارتباط.',

          'brand_form_page_gizli_pencere': 'لا تكمل عملية الشراء في نافذة خاصة أو سرية في أي متصفح',

          'brand_form_page_gizli_pencere_content':
              'لا يمكن تتبع ملفات تعريف الارتباط الخاصة بك في وضع التصفح السري، لذلك لن يمكن نقل معلومات النقرات التي تتم عبر Hangel إلى المتجر. لذلك، لن ينعكس تبرعك. نظرًا لعدم وجود معلومات نقر، لن يكون من الممكن أيضًا إضافة تبرعك يدويًا.',

          'brand_form_page_diger_programlar': 'لا تستخدم برامج استرداد النقود/التبرعات الأخرى',

          'brand_form_page_diger_programlar_content':
              'عندما يتم استخدام برامج استرداد النقود/التبرعات/المكافآت/النقاط الأخرى مثل Hangel، فلن تعكس المتاجر تبرعاتك بسبب نفس تتبع ملفات تعريف الارتباط. لذلك، نوصي بأن يكون Hangel هو البرنامج الوحيد المفتوح أثناء إتمام عملية الشراء.',

          'brand_form_page_kupon_kodu': 'استخدم فقط رموز القسائم الموجودة في Hangel',

          'brand_form_page_kupon_kodu_content':
              'إذا كنت قد استخدمت رمز قسيمة غير مدرج على منصة Hangel (مثل رموز قسيمة المتجر أو الرموز المستلمة من مواقع رموز القسيمة)، فمن المحتمل أن لا تعكس المتاجر تبرعك. لأن المتاجر تحدد شروطها الخاصة، فلن يتم تعريف التبرع عند استخدام رموز القسيمة غير المعلنة على موقعنا.',

          'brand_form_page_fiyat_karsilastirma':
              'لا تزور مواقع مقارنة الأسعار أو رموز القسائم قبل إتمام عملية الشراء عبر Hangel',

          'brand_form_page_fiyat_karsilastirma_content':
              'تستقبل مواقع مقارنة الأسعار ورموز القسائم عمولة من المتاجر مثل Hangel. يتم ذلك أيضًا من خلال تتبع ملفات تعريف الارتباط الخاصة بك مثل Hangel. إذا قمت بزيارة هذه المواقع قبل إتمام عملية الشراء مع Hangel، فسيتم حذف/كتابة ملفات تعريف الارتباط الخاصة بك.',

          'brand_form_page_mobil_uygulama': 'لا تستخدم تطبيق المتجر المحمول (باستثناء AliExpress وبعض المتاجر الأخرى)',

          'brand_form_page_mobil_uygulama_content':
              'إذا كنت تتسوق عبر جهاز محمول، استخدم فقط النسخ المستعرضة لمتاجر الويب / خدمات الحجز. إذا قمت باستخدام تطبيق المتجر المحمول لإتمام عمليات الشراء/الحجز، فلن يتم تقديم تبرع باستثناء بعض المتاجر.',

          'brand_form_page_sepet': 'أضف المنتجات إلى سلة التسوق الخاصة بك فقط بعد النقر على Hangel',

          'brand_form_page_sepet_content':
              'تطلب بعض المتاجر أن تكون سلة التسوق فارغة كشرط لكسب التبرع من Hangel بعد إتمام عملية الشراء.',

          'brand_form_page_diger_para_iadesi':
              'إذا كنت تواجه مشكلة عدم عكس التبرعات بشكل متكرر، قم بمسح ملفات تعريف الارتباط الخاصة بك',

          'brand_form_page_diger_para_iadesi_content':
              'إذا كنت تواجه مشكلة عدم عكس التبرعات بشكل متكرر، نوصي بمسح ملفات تعريف الارتباط الخاصة بك.',

          'brand_form_page_site_ziyaret': 'لا تكمل عملية الشراء دون النقر على المتجر عبر Hangel',

          'brand_form_page_site_ziyaret_content':
              'إذا قمت بزيارة المتجر قبل النقر على Hangel، فلن تعكس المتاجر تبرعاتك لأن Hangel لم تتمكن من تتبع ملفات تعريف الارتباط بشكل مباشر.',

          'brand_form_page_ortak_sirketler': 'تجنب زيارة المواقع التي تعلن عن المتاجر المتعاونة مع Hangel',

          'brand_form_page_ortak_sirketler_content':
              'إذا كانت لديك نوافذ أخرى بها لافتات إعلانات أو روابط أثناء عملية الشراء، فلن يتم عكس تبرعك.',

          'brand_form_page_telefon_siparis': 'لا تطلب عبر الهاتف',

          'brand_form_page_telefon_siparis_content': 'لا تقدم أي متاجر تبرعات في الطلبات/الحجوزات الهاتفية.',

          'brand_form_page_farkli_ulke': 'لا تطلب من صفحة متجر لدولة أخرى (مثل AliExpress روسيا)',

          'brand_form_page_farkli_ulke_content':
              'يمكنك كسب التبرعات فقط من عمليات الشراء التي تتم عبر روابط منصة Hangel.',

          'brand_form_page_markanin_ozel_kosullari': 'قبل إتمام عملية الشراء، راجع الشروط الخاصة بالمتجر',

          'brand_form_page_markanin_ozel_kosullari_content': 'قد لا تشمل بعض المنتجات أو البائعين في برنامج التبرعات.',

          'brand_form_page_tamam': 'تم',

          // DonationHistoryPage Keys...

          'donation_history_page_bagislarim': 'تبرعاتي',

          'donation_history_page_total_donation_error': 'حدث خطأ أثناء استرجاع إجمالي مبلغ التبرعات.',

          'donation_history_page_realized_donation': 'تبرع تم تحقيقه',

          'donation_history_page_no_donations': 'لم يتم العثور على أي تبرعات.',

          'donation_history_page_donation_details': 'تفاصيل التبرع',

          'donation_history_page_stk1_error': 'لم يتم استرجاع معلومات STK1',

          'donation_history_page_stk2_error': 'لم يتم استرجاع معلومات STK2',

          'donation_history_page_close': 'إغلاق',

          'donation_history_page_donated_stks': 'المنظمات التي تم التبرع لها',

          'donation_history_page_brand': 'ماركة',

          'donation_history_page_brand_loading': 'جارٍ تحميل الماركة...',

          'donation_history_page_retry_brand': 'إعادة تحميل الماركة',

          'donation_history_page_brand_info_error': 'لم يتم استرجاع معلومات الماركة',

          'donation_history_page_amount': 'المبلغ',

          'donation_history_page_donation_amount': 'مبلغ التبرع',

          'donation_history_page_order_number': 'رقم الطلب',

          'donation_history_page_order_date': 'تاريخ الطلب',

          // FavoritesPage Keys...

          'favorites_page_title': 'المفضلة',

          'favorites_page_search_hint': 'ابحث...',

          'favorites_page_favorilerim': 'مفضلتي',

          'favorites_page_markalar': 'الماركات',

          'favorites_page_stklar': 'المنظمات غير الحكومية',

          'favorites_page_error_occurred': 'حدث خطأ.',

          'favorites_page_no_favorites_brands': 'لا توجد ماركات مفضلة.',

          'favorites_page_no_favorites_stks': 'لا توجد منظمات غير حكومية مفضلة.',

          'favorites_page_brand_loading': 'جارٍ تحميل الماركة...',

          'favorites_page_retry_brand': 'إعادة تحميل الماركة',

          'favorites_page_brand_info_error': 'لم يتم استرجاع معلومات الماركة',

          'favorites_page_amount': 'المبلغ',

          // FrequentlyAskedQuestionsPage Keys...

          'faq_page_title': 'الأسئلة الشائعة',

          'faq_question_1_title': 'ما هي بيانات سياستكم؟',

          'faq_question_1_description':
              'نحتفظ بالأسماء والعناوين وعناوين البريد الإلكتروني وبيانات هدية المساعدة التي يقدمها الأعضاء (المستخدمون) لنا. كما نحتفظ بأسماء وعناوين البريد الإلكتروني وأرقام الهواتف للأشخاص المعنيين المقدمة من المديرين لأغراض معينة. كما نحتفظ بمعلومات المنظمات غير الحكومية التي يدعمها المستخدمون ومعلومات العلامات التجارية التي يتسوقون منها.',

          'faq_question_2_title': 'ما هي الأسس القانونية التي نحتفظ بها ونعالج بها بياناتكم؟',

          'faq_question_2_description':
              'نظرًا لوجود "مصلحة مشروعة" في تسجيل عضويتكم والأهداف التي تدعمونها والتبرعات التي تقدمونها، نحتفظ ببياناتكم. سنرسل لكم معلومات حول حسابكم بانتظام وسنؤكد التغييرات التي تجريها. كما نرسل رسائل بريد إلكتروني تسويقية متنوعة قد تتعلق بالعروض، ونصائح هامة، وميزات جديدة، إلخ. نحتاج إلى "موافقة" واضحة لهذه الرسائل، وقد طلبنا إعادة التأكيد من جمهورنا المستهدف الحالي لضمان تسجيل ذلك بشكل صحيح.',

          'faq_question_3_title': 'هل يمكنني طلب حذف بياناتي؟',

          'faq_question_3_description':
              'لديك الحق في طلب تعديل أو حذف المعلومات التي نحتفظ بها عنك. ستحافظ على سرية بياناتك وستستخدم فقط من قبل الأشخاص المعنيين لأغراض تنفيذ عملياتنا. لن نشارك هذه المعلومات مع أي جهة رسمية ما لم يكن ذلك ضروريًا لتقديم الخدمات التي نقدمها (مثل التسويق عبر البريد الإلكتروني، إدارة الاستفسارات، إلخ).',

          'faq_question_4_title': 'لماذا لا تظهر التبرعات المباشرة التي قدمتها في حسابي؟',

          'faq_question_4_description':
              'إذا قمت بتقديم تبرع مباشر لغرض ما، قد يستغرق ظهور التبرع في حساب الداعم الخاص بك عدة أسابيع. إذا لم يظهر تبرعك المباشر بعد هذه الفترة، يرجى الاتصال بنا باستخدام خيار نموذج الاتصال.',

          'faq_question_5_title': 'هل هناك رسوم اشتراك شهرية سنوية؟',

          'faq_question_5_description':
              'لا يدفع المستخدمون أو العلامات التجارية أو المنظمات غير الحكومية أو الأشخاص الذين يجمعون التبرعات بإذن خاص أي رسوم أو مدفوعات مماثلة.',

          'faq_question_6_title': 'في أي ظروف يمكن للمستخدمين تغيير الأهداف التي يدعمونها؟',

          'faq_question_6_description':
              'عند التسجيل كعضو، لا نختار منظمة واحدة، بل نهدف إلى دعم أهداف متعددة للمستخدمين الذين يأتون لدعم هدف معين، لذا نتوقع أن يدعموا على الأقل هدفين. السبب في دعم اختيار أكثر من اثنين من المنظمات هو أن الهدف المدعوم يمكن أن يجمع تبرعات أكثر فعالية.',

          'faq_question_7_title': 'متى يمكنني تغيير هدفي المدعوم؟',

          'faq_question_7_description': 'يمكنك تغيير ذلك بعد 21 يومًا من تاريخ الاختيار.',

          'faq_question_8_title': 'نسبة التبرع وهدية المساعدة - كيف تعمل؟',

          'faq_question_8_description':
              "العمولات التي تم الحصول عليها من مشترياتك أصبحت الآن تتحول إلى فائدة اجتماعية مع هانجل. بدعمك، أصبحت شريكًا في الفائدة الاجتماعية وفي حل المشكلات الاجتماعية.",

          'faq_question_9_title': "كيف أكون عضوًا؟",

          'faq_question_9_description': "يمكنك الحصول على التطبيق من متجر التطبيقات وفقًا لبنية هاتفك.",

          'faq_question_10_title': "صندوق التأثير الاجتماعي هانجل",

          'faq_question_10_description':
              "يساعد صندوق التأثير الاجتماعي لدينا في توفير الدخل الذي تشتد الحاجة إليه لدعم المنظمات التي تهدف إلى حل مشكلاتنا الاجتماعية، والتي تعتبر حيوية للاستدامة. هذه المجموعة الرائعة المكونة من المدارس، والجمعيات الخيرية (الكبيرة والصغيرة)، ومجموعات المجتمع، والأندية الرياضية الهواة، والمشاريع الاجتماعية بحاجة ماسة إلى دعم إضافي للاستمرار. نحن شغوفون بدعم جميع القضايا الجيدة، كبيرة كانت أم صغيرة؛ معًا، نبني أمة عطاء لصنع فرق فعال. نحن في انتظار مساهمتك.",

          // ProfilePage Keys...

          'profile_page_title': 'ملفي الشخصي',

          'profile_page_add_photo': 'إضافة صورة',

          'profile_page_supported_ngos': 'المنظمات غير الحكومية التي تدعمها',

          'profile_page_error_occurred': 'حدث خطأ.',

          'profile_page_total_donation': 'إجمالي مبلغ التبرع',

          'profile_page_donation_count': 'عدد معاملات التبرع',

          'profile_page_membership_date': 'تاريخ العضوية',

          'profile_page_volunteer_organizations': 'المنظمات التي تطوعت بها',

          'profile_page_project_count': 'عدد المشاريع',

          'profile_page_total_hours': 'إجمالي الساعات',

          'profile_page_gender': 'الجنس',

          'profile_page_email': 'البريد الإلكتروني',

          'profile_page_phone': 'الهاتف',

          'profile_page_birth_date': 'تاريخ الميلاد',

          'profile_page_location': 'مدينة/منطقة/حي',

          'profile_page_update_info': 'تحديث المعلومات',

          'profile_page_stk_application_form': 'نموذج طلب المنظمة غير الحكومية',

          'profile_page_stk_application_form_button': 'نموذج طلب المنظمة غير الحكومية',

          'profile_page_brand_application_form_button': 'نموذج طلب العلامة التجارية',

          'profile_page_personal_info': 'المعلومات الشخصية',

          'profile_page_volunteer': 'متطوع',

          'profile_page_statistics': 'الإحصائيات',

          'profile_page_no_supported_ngos': 'لا توجد منظمات غير حكومية مدعومة.',

          // STKDetailPage Keys...

          'stk_detail_about': 'حول',

          'stk_detail_join_date_label': 'تاريخ الانضمام: ',

          'stk_detail_earthquake_zone': 'منطقة الزلزال',

          'stk_detail_total_donation': 'إجمالي التبرع',

          'stk_detail_process_count': 'عدد العمليات',

          'stk_detail_donor_count': 'عدد المتبرعين',

          'stk_detail_type': 'النوع',

          'stk_detail_categories': 'الفئات',

          'stk_detail_un_goals': 'أهداف الأمم المتحدة للتنمية المستدامة',

          'stk_detail_field': 'المجال',

          'stk_detail_general_info': 'معلومات عامة',

          'stk_detail_statistics': 'الإحصائيات',

          // STKFormWidget Keys...

          'stk_form_invalid_registry_number': 'رقم السجل غير صالح',

          'stk_form_invalid_tax_number': 'رقم الضريبة غير صالح',

          'stk_form_invalid_short_name': 'اسم قصير غير صالح',

          'stk_form_invalid_full_name': 'اسم كامل غير صالح',

          'stk_form_invalid_iban': 'رقم IBAN غير صالح',

          'stk_form_invalid_contact_person_name': 'اسم العائلة غير صالح',

          'stk_form_invalid_contact_person_phone': 'رقم الهاتف غير صالح',

          'stk_form_invalid_contact_person_email': 'عنوان البريد الإلكتروني غير صالح',

          'stk_form_invalid_contact_person_job': 'المسمى الوظيفي غير صالح',

          'stk_form_invalid_website': 'موقع إلكتروني غير صالح',

          'stk_form_invalid_email': 'عنوان البريد الإلكتروني غير صالح',

          'stk_form_invalid_phone': 'رقم الهاتف غير صالح',

          'stk_form_invalid_founder_name': 'اسم مؤسس غير صالح',

          'stk_form_invalid_logo': 'لم يتم تحميل الشعار بشكل صحيح.',

          'stk_form_invalid_address_info': 'يوجد خطأ في معلومات العنوان.',

          'stk_form_invalid_tuzuk': 'يوجد خطأ في وثيقة النظام.',

          'stk_form_invalid_faaliyet': 'يوجد خطأ في وثيقة النشاط.',

          'stk_form_invalid_sector': 'يوجد خطأ في معلومات مجال النشاط.',

          'stk_form_invalid_category': 'يوجد خطأ في معلومات الفئة.',

          'stk_form_invalid_bm': 'يوجد خطأ في معلومات أهداف الأمم المتحدة.',

          'stk_form_invalid_type': 'يوجد خطأ في نوع المنظمة غير الحكومية.',

          'stk_form_incomplete_info': 'لقد أدخلت معلومات غير مكتملة! يرجى مراجعة البيانات المدخلة.',

          // SelectFavoriteStkPage Keys...

          'select_favorite_stk_title': 'اختر المنظمة غير الحكومية المفضلة',

          'select_favorite_stk_skip': 'تخطي',

          'select_favorite_stk_instruction':
              'اختر المنظمة غير الحكومية التي ترغب في دعمها لمدة 30 يومًا. تذكر أنه يمكنك تغيير المنظمة غير الحكومية التي تدعمها بعد 30 يومًا.',

          'select_favorite_stk_all': 'الجميع',

          'select_favorite_stk_association': 'جمعية',

          'select_favorite_stk_foundation': 'مؤسسة',

          'select_favorite_stk_special_permission': 'مصرح بها بشكل خاص',

          'select_favorite_stk_min_error': 'يجب عليك اختيار 2 منظمة غير حكومية على الأقل!',

          'select_favorite_stk_max_error': 'يمكنك اختيار 2 منظمة غير حكومية كحد أقصى!',

          'select_favorite_stk_success': 'تم تحديث المنظمات غير الحكومية المفضلة بنجاح',

          'select_favorite_stk_error_code': 'حدث خطأ!\nرمز الخطأ: 00321',

          'select_favorite_stk_sort_name': 'حسب الاسم',

          'select_favorite_stk_sort_favorite_count': 'حسب عدد المفضلات',

          'select_favorite_stk_sort_donor_count': 'حسب عدد المتبرعين',

          'select_favorite_stk_filter_all': 'الجميع',

          'select_favorite_stk_filter_earthquake': 'منطقة الزلزال',

          'select_favorite_stk_filter_special_status': 'الحالة الخاصة',

          'select_favorite_stk_animals': 'الحيوانات',

          'select_favorite_stk_poverty': 'الفقراء',

          'select_favorite_stk_education': 'التعليم',

          'select_favorite_stk_health': 'الصحة',

          'select_favorite_stk_agriculture': 'الزراعة',

          'select_favorite_stk_refugees': 'اللاجئون',

          'select_favorite_stk_law': 'القانون',

          'select_favorite_stk_earthquake': 'الزلزال',

          'select_favorite_stk_food': 'الغذاء',

          'select_favorite_stk_religious': 'ديني',

          'select_favorite_stk_social_entrepreneurship': 'ريادة الأعمال الاجتماعية',

          'select_favorite_stk_entrepreneurship': 'ريادة الأعمال',

          'select_favorite_stk_culture_art': 'الثقافة والفنون',

          'select_favorite_stk_sports': 'الرياضة',

          'marka_favorilemediniz': 'لم تقم بعد بإضافة علامة مفضلة.',

          'stk_eklemediniz': 'لم تقم بعد بإضافة منظمة غير حكومية.',

          'marka_gozat': 'تصفح العلامات التجارية',

          // STKPage Keys...

          'stk_page_all': 'الجميع',

          'stk_page_associations': 'جمعية',

          'stk_page_foundations': 'مؤسسة',

          'stk_page_special_permissions': 'تصاريح خاصة',

          'stk_page_stks': 'المنظمات غير الحكومية',

          'stk_page_filter_earthquake_zone': 'منطقة الزلزال',

          'stk_page_filter_special_status': 'الحالة الخاصة',

          'stk_page_filter_all': 'الجميع',

          'stk_page_sort_by_name': 'حسب الاسم',

          'stk_page_sort_by_favorite': 'حسب عدد المفضلات',

          'stk_page_sort_by_donor': 'حسب عدد المتبرعين',

          'basvuruldu': 'تم التقديم',

          'basvur': 'تقدم',

          'kisi_basvurdu': 'شخص قدم طلبًا',

          'gonullu_ilanlari': 'إعلانات المتطوعين للمنظمات غير الحكومية',

          // SettingsPage Keys...

          'settings_page_title': 'الإعدادات',

          'settings_page_about_us': 'معلومات عنا',

          'settings_page_user_agreement': 'اتفاقية المستخدم',

          'settings_page_privacy_policy': 'سياسة الخصوصية',

          'settings_page_faq': 'الأسئلة الشائعة',

          'settings_page_user_agreement_text': """

  من المهم قراءة هذه الاتفاقية ("الاتفاقية") بعناية قبل استخدام تطبيق Hangel. تحدد هذه الاتفاقية الشروط والأحكام المتعلقة باستخدامك لتطبيق Hangel ("التطبيق") المقدم من Hangel ("الشركة"، "نحن"، "لنا").


  1. القبول

  باستخدامك للتطبيق، تعتبر قد قبلت هذه الاتفاقية. إذا كنت لا توافق على هذه الاتفاقية، يجب عليك عدم استخدام التطبيق.


  2. التعديلات

  يمكننا تعديل هذه الاتفاقية من حين لآخر. سنقوم بإبلاغك عندما تصبح التعديلات سارية. إذا كنت لا توافق على التعديلات، يجب عليك التوقف عن استخدام التطبيق.


  3. استخدام التطبيق

  يمكنك استخدام التطبيق فقط لأغراض قانونية وأخلاقية. تقبل عدم القيام بما يلي عند استخدام التطبيق:

  - استخدام التطبيق لأي نشاط غير قانوني أو ضار.

  - تحميل أو مشاركة أي محتوى ينتهك حقوق الطبع والنشر أو العلامات التجارية أو حقوق الملكية الفكرية الأخرى.

  - تحميل أو مشاركة أي محتوى يتضمن خطاب كراهية أو تهديدات أو مضايقات.

  - إرسال رسائل بريد إلكتروني مزعجة أو غير مرغوب فيها.

  - تحميل أو نشر فيروسات أو برامج ضارة أخرى.

  - محاولة الوصول غير المصرح به إلى أنظمة الشركة أو الأطراف الثالثة.


  4. الملكية

  التطبيق وجميع المحتويات ملك للشركة. لا يمنحك استخدام التطبيق أي حقوق ملكية.


  5. إخلاء المسؤولية

  تقبل التطبيق "كما هو" و "كما هو متوفر". لا تضمن الشركة أن يعمل التطبيق بشكل مستمر أو بدون أخطاء. لا تتحمل الشركة أي مسؤولية عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام التطبيق.


  6. الإنهاء

  تحتفظ الشركة بالحق في إنهاء وصولك إلى التطبيق أو إغلاقه في أي وقت ولأي سبب.


  7. حل النزاعات

  سيتم حل أي نزاع ينشأ عن هذه الاتفاقية أو يتعلق بها وفقًا لقوانين الجمهورية التركية.


  8. السريان

  تدخل هذه الاتفاقية حيز التنفيذ اعتبارًا من 12 مارس 2024.

  """,

          'settings_page_privacy_policy_text': """

  من المهم قراءة هذه الاتفاقية ("الاتفاقية") بعناية قبل استخدام تطبيق Hangel. توضح هذه الاتفاقية ("الشركة"، "نحن"، "لنا") المعلومات التي نجمعها، وكيف نستخدمها ونشاركها، والإجراءات التي نتخذها لحماية هذه المعلومات.


  1. المعلومات التي نجمعها

  يمكننا جمع المعلومات التالية منك:

  - المعلومات الشخصية: تتضمن اسمك، اسم العائلة، عنوان بريدك الإلكتروني، رقم هاتفك، عنوانك وتاريخ ميلادك.

  - معلومات الحساب: تتضمن اسم المستخدم وكلمة المرور وصورة ملفك الشخصي.

  - معلومات الشراء: تتضمن المنتجات التي اشتريتها، تواريخ الشراء ومبالغها.

  - معلومات الجهاز: تتضمن معلومات حول جهازك مثل عنوان IP ونظام التشغيل ونوع المتصفح.

  - معلومات الاستخدام: تتضمن معلومات حول كيفية استخدامك لتطبيق Hangel.


  2. كيف نستخدم المعلومات

  يمكننا استخدام المعلومات التي نجمعها للأغراض التالية:

  - تقديم وتطوير تطبيق Hangel: نستخدم معلوماتك لإنشاء حسابك، معالجة مشترياتك وتقديم أفضل تجربة لك.

  - التواصل: نستخدم معلوماتك لإبلاغك بالتحديثات والعروض والمعلومات الأخرى المتعلقة بالتطبيق.

  - تقديم الإعلانات: نستخدم معلوماتك لتقديم إعلانات تتعلق بمصالحك.

  - البحث والتطوير: نستخدم معلوماتك لتحسين تطبيق Hangel وخدماتنا.

  - الامتثال للمتطلبات القانونية: نستخدم معلوماتك للامتثال للمتطلبات القانونية والاستجابة للطلبات القانونية.


  3. كيف نشارك المعلومات

  يمكننا مشاركة المعلومات التي نجمعها مع أطراف ثالثة في الحالات التالية:

  - مقدمو الخدمات: يمكننا مشاركة معلوماتك مع مقدمي الخدمات من الأطراف الثالثة الذين نستخدمهم لتقديم تطبيق Hangel لك.

  - المتطلبات القانونية: يمكننا مشاركة معلوماتك للامتثال للمتطلبات القانونية أو الاستجابة للطلبات القانونية.

  - المعلنون: يمكننا مشاركة معلوماتك مع المعلنين لتقديم إعلانات تتعلق بمصالحك.

  - البيانات المجهولة: يمكننا مشاركة البيانات المجهولة التي لا تحدد هويتك مع أطراف ثالثة لأغراض البحث والتطوير.


  4. الأمان

  نتخذ إجراءات أمان تقنية وإدارية لحماية معلوماتك. تشمل هذه الإجراءات:

  - تشفير بياناتك

  - استخدام مراكز بيانات آمنة

  - تنفيذ ضوابط الوصول

  - تدريب موظفي الأمن


  5. حقوقك

  لديك الحقوق التالية فيما يتعلق بمعلوماتك الشخصية:

  - الوصول: لديك الحق في طلب نسخة من معلوماتك الشخصية.

  - التصحيح: لديك الحق في تصحيح معلوماتك الشخصية غير الصحيحة أو الناقصة.

  - الحذف: لديك الحق في طلب حذف معلوماتك الشخصية.

  - تقييد المعالجة: لديك الحق في تقييد معالجة معلوماتك الشخصية.

  - القابلية للنقل: لديك الحق في نقل معلوماتك الشخصية إلى جهة تحكم أخرى.

  - الاعتراض: لديك الحق في الاعتراض على معالجة معلوماتك الشخصية.


  6. التعديلات

  يمكننا تعديل هذه الاتفاقية من حين لآخر. سنقوم بإبلاغك عندما تصبح التعديلات سارية.


  7. الاتصال

  إذا كان لديك أي أسئلة حول هذه الاتفاقية، يرجى الاتصال بنا.


  8. السريان

  تدخل هذه الاتفاقية حيز التنفيذ اعتبارًا من 12 مارس 2024.

  """,

          // BrandDetailPage Keys...

          'yes': 'نعم',

          'no': 'لا',

          'info': 'المعلومات',

          'statistics': 'الإحصائيات',

          'ara': 'ابحث',

          // BrandDetailPage Keys...

          'brand_detail_page_join_date_label': 'تاريخ الانضمام إلى المنصة: '
        }
      };
}
