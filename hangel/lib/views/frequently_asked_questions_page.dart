import 'package:flutter/material.dart';
import 'package:hangel/widgets/app_bar_widget.dart';

import '../constants/app_theme.dart';
import '../constants/size.dart';

class FrequentlyAskedQuestionsPage extends StatefulWidget {
  const FrequentlyAskedQuestionsPage({Key? key}) : super(key: key);
  static const routeName = '/frequently-asked-questions';
  @override
  State<FrequentlyAskedQuestionsPage> createState() =>
      _FrequentlyAskedQuestionsPageState();
}

class _FrequentlyAskedQuestionsPageState
    extends State<FrequentlyAskedQuestionsPage> {
  int selectedIndex = -1;
  List<SSSModel> sssList = [
    SSSModel(
        baslik: "Hangi veriler politikanız nedir?",
        tanim:
            "Üyelerin (kullanıcıların) bize sağladığı adları, adresleri, e-posta adreslerini ve Hediye Yardımı beyanlarını saklıyoruz. Ayrıca yöneticiler tarafından bize sağlanan ilgili kişi adlarını, adreslerini, e-posta adreslerini ve telefon numaralarını da belirli amaçlarla saklıyoruz. Ayrıca kullanıcıların hangel üzerinden desteklediği STK ve alışveriş yaptığı marka bilgilerini tutuyoruz."),
    SSSModel(
        baslik:
            "Verilerinizi 'depoladığımız' ve 'işlediğimiz' yasal dayanaklar nelerdir?",
        tanim:
            "Üyeliğinizi, desteklediğiniz amaçları ve sağladığınız bağışları kaydedebilmemizde 'meşru menfaat' bulunduğu için verilerinizi saklıyoruz. Hesabınızla ilgili bilgileri size düzenli olarak göndereceğiz ve yaptığınız değişiklikleri onaylayacağız. Ayrıca teklifler, önemli ipuçları, yeni özellikler vb. ile ilgili olabilecek çeşitli pazarlama e-postaları da gönderiyoruz. Bu e-postalar için açık 'onay'a ihtiyacımız var ve bunun doğru bir şekilde kaydedildiğinden emin olmak için mevcut hedef kitlemizden yeniden onay istedik."),
    SSSModel(
        baslik: "Verilerimin silinmesini isteyebilir miyim?",
        tanim:
            "Hakkınızda tuttuğumuz bilgilerin bu bilgilerin değiştirilmesini veya silinmesini isteme hakkına sahipsiniz. Verilerinizin gizli tutulmasını ve yalnızca ilgili kişiler tarafından faaliyetlerimizin gerçekleştirilmesi amacıyla kullanılmasını sağlayacaktır. Sağladığımız hizmetleri (örn. e-posta pazarlaması, sorgu yönetimi vb.) sunmak için gerekli olmadığı sürece bu bilgileri hiçbir resmî kuruluşla paylaşmayız."),
    SSSModel(
        baslik: "Yaptığım doğrudan bağış neden hesabımda görünmüyor?",
        tanim:
            "Bir amaç için Doğrudan Bağış yaptıysanız bağışın destekçi hesabınızda görünmesi bir kaç hafta kadar sürebilir. Bu süre sonunda doğrudan bağışınız görünmüyorsa, lütfen Bize iletişim formu seçeneğini kullanarak bizimle iletişime geçin."),
    SSSModel(
        baslik: "Aylık yıllık abonelik ücreti var mı?",
        tanim:
            "Kullanıcılar, markalar, STK’lar veya özel izin ile bağış toplayan kişiler hiç bir şekilde aidat veya benzeri bir ödeme yapmazlar."),
    SSSModel(
        baslik:
            "Kullanıcılar destekledikleri amaçları hangi koşullarda değiştirebilirler?",
        tanim:
            "İlk üye olduğunda 1 dernek seçmiyoruz bir amacı destek üzere gelen kullanıcının çapraz destekler ile farklı amaçları da desteklemesini amaçladığımız için en az 2 amacı desteklemesini bekliyoruz. 2’den fazla dernek seçilmesini desteklememizin sebebi ise desteklenen amacın daha etkin bağış toplayabilmesi."),
    SSSModel(
        baslik: "Desteklediğim amacımı ne zamana değiştirebilirim?",
        tanim: "Seçim yaptığın tarihten 21 gün sonra değiştirebilirsin."),
    SSSModel(
        baslik: "Bağış Yüzdesi ve Hediye Yardımı - Nasıl çalışır?",
        tanim:
            "Yaptığınız alışverişlerden elde edilen komisyonlar artık hangel ile sosyal faydaya dönüşüyor. Desteğinizle sosyal faydaya ortak oluyor, sosyal sorunların çözümüne ortak oluyorsunuz."),
    SSSModel(
        baslik: "Nasıl üye olurum?",
        tanim:
            "Kullandığınız telefonun altyapısına göre App Store den mail uygulamayı ediniyorsunuz."),
    SSSModel(
        baslik: "Hangel sosyal etki fonu",
        tanim:
            "Sosyal Etkisi fonumuz, sosyal sorunlarımızı çözmeyi amaçlayan sosyal girişimlerindeki destekleyen ve çözüm için sürdürülebilirlik açısından hayati önem taşıyan kuruluşlara cansuyu amacıyla çok ihtiyaç duyulan gelirin sağlanmasına yardımcı olur. Okullardan, hayır kurumlarından (hem büyük hem de küçük), topluluk gruplarından, amatör spor kulüplerinden ve sosyal girişimlerden oluşan bu muhteşem koleksiyonun devam etmek için umutsuzca ek desteğe ihtiyacı var. Ne kadar büyük ya da küçük olursa olsun tüm iyi amaçları destekleme konusunda tutkuluyuz; Birlikte etkili bir fark yaratmak için Veren Bir Ulus inşa ediyoruz. Yatılısınız bekliyoruz."),
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.white,
      appBar: const PreferredSize(
        preferredSize: Size.fromHeight(80),
        child: AppBarWidget(
          title: "Sıkça Sorulan Sorular",
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            ...List.generate(
              sssList.length,
              (index) => sssListItemWidget(context, index),
            ),
          ],
        ),
      ),
    );
  }

  Widget sssListItemWidget(BuildContext context, int index) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 900),
      width: deviceWidth(context),
      margin: EdgeInsets.symmetric(
        horizontal: deviceWidthSize(context, 20),
        vertical: deviceHeightSize(context, 5),
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: AppTheme.black.withOpacity(0.05),
            blurRadius: 44,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: () {
              setState(() {
                if (selectedIndex == index) {
                  selectedIndex = -1;
                } else {
                  selectedIndex = index;
                }
              });
            },
            child: Container(
              decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(15),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.black
                          .withOpacity(index == selectedIndex ? 0.1 : 0),
                      blurRadius: 44,
                      offset: const Offset(0, 4),
                    ),
                  ]),
              padding: EdgeInsets.symmetric(
                      horizontal: deviceHeightSize(context, 20))
                  .copyWith(
                      top: deviceHeightSize(context, 20),
                      bottom: deviceHeightSize(
                          context, index == selectedIndex ? 10 : 0)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  SizedBox(
                    width: deviceWidthSize(context, 270),
                    child: Text(
                      sssList[index].baslik!,
                      style: AppTheme.boldTextStyle(context, 15),
                    ),
                  ),
                  Icon(
                    index == selectedIndex
                        ? Icons.remove_circle
                        : Icons.add_circle,
                    color: AppTheme.primaryColor,
                    size: deviceWidthSize(context, 20),
                  ),
                ],
              ),
            ),
          ),
          AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
            padding: EdgeInsets.symmetric(
              horizontal: deviceWidthSize(context, 20),
              vertical:
                  deviceHeightSize(context, index == selectedIndex ? 10 : 5),
            ),
            child: Text(
              sssList[index].tanim ?? "",
              maxLines: index == selectedIndex ? 100 : 2,
              overflow: TextOverflow.ellipsis,
              style: AppTheme.normalTextStyle(context, 13).copyWith(
                color: AppTheme.black.withOpacity(0.6),
                fontWeight: FontWeight.w300,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SSSModel {
  String? baslik;
  String? tanim;
  SSSModel({this.baslik, this.tanim});
}
