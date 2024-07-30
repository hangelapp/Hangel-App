import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/views/about_us_page.dart';
import 'package:hangel/views/frequently_asked_questions_page.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/bottom_sheet_widget.dart';
import 'package:hangel/widgets/text_view_bottom_sheet.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({Key? key}) : super(key: key);
  static const routeName = '/settings';
  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          const AppBarWidget(
            title: "Ayarlar",
          ),
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: deviceWidthSize(context, 16),
                ),
                child: Column(
                  children: [
                    //Hakkımızda
                    //Kullanıcı sözleşmesi
                    //Gizlilik sözleşmesi
                    //S.S.S
                    SizedBox(
                      height: deviceHeightSize(context, 10),
                    ),
                    ListTile(
                      title: Text(
                        "Hakkımızda",
                        style: AppTheme.semiBoldTextStyle(context, 16),
                      ),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                              deviceWidthSize(context, 10))),
                      leading: const Icon(
                        Icons.info_rounded,
                        color: AppTheme.primaryColor,
                      ),
                      onTap: () {
                        Navigator.pushNamed(context, AboutUsPage.routeName);
                      },
                    ),
                    Divider(
                      color: AppTheme.secondaryColor.withOpacity(0.1),
                    ),
                    ListTile(
                      title: Text(
                        "Kullanıcı Sözleşmesi",
                        style: AppTheme.semiBoldTextStyle(context, 16),
                      ),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                              deviceWidthSize(context, 10))),
                      leading: const Icon(
                        Icons.description_rounded,
                        color: AppTheme.primaryColor,
                      ),
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          shape: const RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.vertical(top: Radius.circular(20)),
                          ),
                          builder: (context) => const BottomSheetWidget(
                            title: "Kullanıcı Sözleşmesi",
                            child: TextViewBottomSheet(
                                text: """
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
Bu Sözleşmeyle ilgili herhangi bir sorunuz varsa lütfen bize https://www.jotform.com/tr/form-templates/iletisim-sayfasi adresinden ulaşabilirsiniz.
"""),
                          ),
                        );
                      },
                    ),
                    Divider(
                      color: AppTheme.secondaryColor.withOpacity(0.1),
                    ),
                    ListTile(
                      title: Text(
                        "Gizlilik Sözleşmesi",
                        style: AppTheme.semiBoldTextStyle(context, 16),
                      ),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                              deviceWidthSize(context, 10))),
                      leading: const Icon(
                        Icons.privacy_tip_rounded,
                        color: AppTheme.primaryColor,
                      ),
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          shape: const RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.vertical(top: Radius.circular(20)),
                          ),
                          builder: (context) => const BottomSheetWidget(
                            title: "Gizlilik Sözleşmesi",
                            child: TextViewBottomSheet(text: """
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
Bu Gizlilik Sözleşmesi ile ilgili herhangi bir sorunuz varsa lütfen bize https://www.jotform.com/tr/form-templates/iletisim-sayfasi adresinden ulaşabilirsiniz.

8. Yürürlük
Bu Gizlilik Sözleşmesi, 12 Mart 2024 tarihinde yürürlüğe girmiştir.

"""),
                          ),
                        );
                      },
                    ),

                    Divider(
                      color: AppTheme.secondaryColor.withOpacity(0.1),
                    ),

                    ListTile(
                      title: Text(
                        "S.S.S",
                        style: AppTheme.semiBoldTextStyle(context, 16),
                      ),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                              deviceWidthSize(context, 10))),
                      leading: const Icon(
                        Icons.question_answer_rounded,
                        color: AppTheme.primaryColor,
                      ),
                      onTap: () {
                        Navigator.pushNamed(
                            context, FrequentlyAskedQuestionsPage.routeName);
                      },
                    ),
                  ],
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}
