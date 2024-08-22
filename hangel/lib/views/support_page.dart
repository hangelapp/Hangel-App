import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/bottom_sheet_widget.dart';

import '../widgets/general_button_widget.dart';
import '../widgets/gradient_widget.dart';
import '../widgets/support_form.dart';

class SupportPage extends StatefulWidget {
  const SupportPage({Key? key}) : super(key: key);
  static const String routeName = "/supportPage";

  @override
  State<SupportPage> createState() => _SupportPageState();
}

class _SupportPageState extends State<SupportPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Column(
            children: [
              const AppBarWidget(title: "Destek"),
              Expanded(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: EdgeInsets.all(deviceHeightSize(context, 20)),
                    child: Column(
                      children: [
                        SvgPicture.asset(
                          "assets/images/support.svg",
                          width: deviceWidthSize(context, 300),
                        ),
                        SizedBox(
                          height: deviceHeightSize(context, 20),
                        ),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            "Bize Ulaşın",
                            style: AppTheme.semiBoldTextStyle(context, 20),
                          ),
                        ),
                        SizedBox(
                          height: deviceHeightSize(context, 10),
                        ),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            """Merhaba Değerli Veliler,

Anaokulu uygulamamızdaki destek sayfasına hoş geldiniz! Buradan bize sorularınızı iletebilir, taleplerinizi iletebilir veya geri bildirimde bulunabilirsiniz. Ancak, lütfen unutmayın, bu form aracılığıyla bizimle iletişime geçtiğinizde, okulla değil doğrudan "Obilsis" ile iletişim kuruyorsunuz.

Anaokulu uygulamamızda sizlere daha iyi hizmet sunmak için elimizden geleni yapıyoruz. Sizlerden gelen her soru, talep ve geri bildirim bizim için değerlidir. Hızlı ve etkili bir şekilde size yanıt vermek için buradayız.

Sorularınızı iletmek veya destek talebinde bulunmak için aşağıdaki iletişim formunu kullanabilirsiniz. Lütfen iletişim bilgilerinizi doğru ve eksiksiz olarak girin. En kısa sürede sizinle iletişime geçeceğiz.

Teşekkür ederiz!

Saygılarımızla,
Obilsis Ekibi

""",
                            style: AppTheme.normalTextStyle(context, 16),
                          ),
                        ),
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
          const GradientWidget(
            height: 80,
          ),
          Positioned(
            bottom: deviceHeightSize(context, 20),
            left: deviceWidthSize(context, 20),
            right: deviceWidthSize(context, 20),
            child: GeneralButtonWidget(
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(20),
                      topRight: Radius.circular(20),
                    ),
                  ),
                  builder: (context) => const BottomSheetWidget(
                    isMinPadding: true,
                    title: "İletişime Geç",
                    child: SupportForm(),
                  ),
                );
              },
              buttonColor: AppTheme.primaryColor,
              text: 'İletişime Geç',
            ),
          )
        ],
      ),
    );
  }
}
