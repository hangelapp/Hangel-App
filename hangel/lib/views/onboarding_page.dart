import 'package:flutter/material.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/widgets/dropdown_widget.dart';
import 'package:hangel/widgets/toast_widgets.dart';
import 'package:provider/provider.dart';

import '../constants/app_theme.dart';
import '../constants/size.dart';
import '../models/onboarding_model.dart';
import 'register_page.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({Key? key}) : super(key: key);
  static const String routeName = '/onboarding';
  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage>
    with TickerProviderStateMixin {
  List<OnboardingModel> pages = [];

  int currentIndex = 0;

  final PageController _pageController = PageController();

  @override
  void initState() {
    pages = [
      OnboardingModel(
        title: 'Gönüllü olarak herhangi bir STK’da çalışıyor musun?',
        options: [
          "Evet, çalışıyorum.",
          "Hayır, çalışmıyorum ve çalışmayı da düşünmüyorum.",
          "Şuan çalışmıyorum ama gönüllü çalışmak isterdim.",
        ],
        image: const AssetImage("assets/gifs/volunteering.gif"),
      ),
      OnboardingModel(
        title: 'Düzenli olarak STK’lara aylık ne kadar bağış yapıyorsun?',
        options: [
          "0",
          "1-50 TL",
          "50 - 100 TL",
          "100 - 500 TL",
          "500 - 1.000 TL",
          "1000 - 2.000 TL",
          "2000 - 5.000 TL",
          "5000 - 10.000 TL",
          "10.000 - 20.0000 TL",
        ],
        image: const AssetImage("assets/gifs/donation.gif"),
      ),
      OnboardingModel(
        title: 'Sosyal girişimcilikle alakalı ne kadar bilgi sahibisin?',
        options: [
          "Hiç bilgim yok.",
          "Az çok biliyorum.",
          "Çok iyi biliyorum.",
        ],
        image: const AssetImage("assets/gifs/knowledge.gif"),
      ),
    ];

    super.initState();
  }

  @override
  dispose() {
    _pageController.dispose();
    pages.forEach((element) {
      element.image.evict();
    });
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.white,
      body: Column(
        children: [
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              allowImplicitScrolling: false,

              //never scrollable
              physics: const NeverScrollableScrollPhysics(),
              itemCount: pages.length,
              onPageChanged: (value) => setState(() {
                currentIndex = value;
              }),
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Column(
                    children: [
                      SizedBox(height: deviceTopPadding(context)),
                      Expanded(
                        child: Padding(
                          padding: EdgeInsets.symmetric(
                              horizontal: deviceWidthSize(context, 20)),
                          child: Column(
                            children: [
                              const Spacer(),
                              Container(
                                height: deviceHeightSize(context, 300),
                                width: deviceWidthSize(context, 300),
                                decoration: BoxDecoration(
                                  image: DecorationImage(
                                    image: pages[index].image,
                                  ),
                                ),
                              ),
                              SizedBox(height: deviceHeightSize(context, 20)),
                              Text(
                                pages[index].title,
                                textAlign: TextAlign.center,
                                style: AppTheme.semiBoldTextStyle(context, 24),
                              ),
                              SizedBox(height: deviceHeightSize(context, 4)),
                              DropdownWidget(
                                context,
                                titles: pages[index].options,
                                selectedIndex: context
                                    .watch<LoginRegisterPageProvider>()
                                    .selectedOptions[index],
                                onChanged: (value) {
                                  int valueIndex =
                                      pages[index].options.indexOf(value!);
                                  context
                                      .read<LoginRegisterPageProvider>()
                                      .setSelectedOption(
                                        index,
                                        valueIndex,
                                      );
                                },
                              ),
                              const Spacer(),
                              SizedBox(height: deviceHeightSize(context, 20)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: EdgeInsets.symmetric(
              horizontal: deviceWidthSize(context, 30),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    pages.length,
                    (index) => buildDot(index: index),
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    if (context
                            .read<LoginRegisterPageProvider>()
                            .selectedOptions[currentIndex] ==
                        -1) {
                      ToastWidgets.errorToast(
                          context, "Lütfen bir seçim yapınız");
                      return;
                    }
                    if (currentIndex != pages.length - 1) {
                      setState(() {
                        currentIndex++;
                        _pageController.animateToPage(
                          currentIndex,
                          duration: const Duration(milliseconds: 200),
                          curve: Curves.easeIn,
                        );
                      });
                    } else {
                      Navigator.pushReplacementNamed(
                          context, RegisterPage.routeName);
                    }
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        currentIndex != pages.length - 1
                            ? "Devam Et"
                            : "Kayıt Ol",
                        style: AppTheme.semiBoldTextStyle(context, 24).copyWith(
                          height: 1.5,
                        ),
                      ),
                      SizedBox(width: deviceWidthSize(context, 10)),
                      Icon(
                        Icons.arrow_forward,
                        color: AppTheme.black,
                        size: deviceWidthSize(context, 30),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: deviceHeightSize(context, 50)),
        ],
      ),
    );
  }

  buildDot({required int index}) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: EdgeInsets.only(right: deviceWidthSize(context, 5)),
      height: deviceHeightSize(context, 10),
      width: deviceWidthSize(context, currentIndex == index ? 20 : 10),
      decoration: BoxDecoration(
        color: currentIndex == index ? AppTheme.primaryColor : Colors.grey,
        borderRadius: BorderRadius.circular(20),
      ),
    );
  }
}
