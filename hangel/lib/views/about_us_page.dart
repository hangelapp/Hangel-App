import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/social_media_widget.dart';

class AboutUsPage extends StatefulWidget {
  const AboutUsPage({Key? key}) : super(key: key);
  static const routeName = '/about_us';
  @override
  State<AboutUsPage> createState() => _AboutUsPageState();
}

class _AboutUsPageState extends State<AboutUsPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          const AppBarWidget(
            title: "Hakkımızda",
          ),
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: deviceWidthSize(context, 16),
                ),
                child: Column(
                  children: [
                    SvgPicture.asset(
                      "assets/images/about_us.svg",
                      width: deviceWidthSize(context, 300),
                      fit: BoxFit.cover,
                    ),
                    SizedBox(
                      height: deviceHeightSize(context, 10),
                    ),
                    Text(
                      """
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
                      textAlign: TextAlign.left,
                      style: AppTheme.normalTextStyle(context, 16),
                    ),
                    SizedBox(
                      height: deviceHeightSize(context, 20),
                    ),
                    //Social media icons
                    SocialMediaWidget(context),
                    SizedBox(
                      height: deviceHeightSize(context, 40),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
