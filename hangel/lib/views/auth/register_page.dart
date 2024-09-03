import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/general_response_model.dart';
import 'package:hangel/providers/app_view_provider.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/views/home_page.dart';
import 'package:hangel/views/auth/onboarding_page.dart';
import 'package:hangel/views/select_favorite_stk_page.dart';
import 'package:hangel/views/vounteer_form.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import '../../constants/app_theme.dart';
import '../../constants/size.dart';
import '../../providers/login_register_page_provider.dart';
import '../../widgets/app_bar_widget.dart';
import '../../widgets/form_field_widget.dart';
import '../../widgets/general_button_widget.dart';
import '../../widgets/toast_widgets.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({Key? key}) : super(key: key);

  static const routeName = '/register';

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _maskFormatter = MaskTextInputFormatter(
      mask: '(###) ### ## ##', filter: {"#": RegExp(r'[0-9]')}, type: MaskAutoCompletionType.lazy);

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _verifyController = TextEditingController();

  final ScrollController _scrollController = ScrollController();

  PhoneLoginPageType _phoneLoginPageType = PhoneLoginPageType.login;
  int resendSecond = 120;

  Timer? _timer;

  @override
  void initState() {
    SchedulerBinding.instance.addPostFrameCallback((timeStamp) {
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (resendSecond > 0) {
          setState(() {
            resendSecond--;
          });
        }
      });
    });
    super.initState();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _nameController.dispose();
    _phoneController.dispose();
    _verifyController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    _phoneLoginPageType = context.watch<LoginRegisterPageProvider>().phoneLoginPageType;
    return Scaffold(
      backgroundColor: AppTheme.white,
      body: Column(
        children: [
          const AppBarWidget(
            leading: SizedBox(),
          ),
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  SvgPicture.asset(
                    _phoneLoginPageType == PhoneLoginPageType.verify
                        ? "assets/images/verification.svg"
                        : "assets/images/register.svg",
                    height: deviceHeightSize(context, _phoneLoginPageType == PhoneLoginPageType.login ? 360 : 280),
                  ),
                  SizedBox(
                    height: deviceHeightSize(context, 20),
                  ),
                  _phoneLoginPageType == PhoneLoginPageType.verify
                      ? verifySmsCodeWidget(context)
                      : loginRegisterWidget(context),
                  SizedBox(
                    height: deviceHeightSize(context, 20),
                  )
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Padding loginRegisterWidget(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: deviceWidthSize(context, 20)),
      child: Column(
        children: [
          Text(
            _phoneLoginPageType == PhoneLoginPageType.register ? "Hesap oluşturun" : "Giriş yapın",
            style: AppTheme.lightTextStyle(context, 28),
          ),
          SizedBox(
            height: deviceHeightSize(context, _phoneLoginPageType == PhoneLoginPageType.register ? 20 : 30),
          ),
          if (_phoneLoginPageType == PhoneLoginPageType.register)
            FormFieldWidget(
              context,
              controller: _nameController,
              title: "Ad Soyad",
              ontap: () {
                _scrollController.animateTo(
                  deviceHeightSize(context, 200),
                  duration: const Duration(milliseconds: 500),
                  curve: Curves.ease,
                );
              },
            ),
          FormFieldWidget(
            context,
            inputFormatters: <TextInputFormatter>[
              FilteringTextInputFormatter.digitsOnly,
              _maskFormatter,
            ],
            keyboardType: TextInputType.phone,
            controller: _phoneController,
            leading: Row(
              children: [
                SizedBox(
                  width: deviceWidthSize(context, 5),
                ),
                Text(
                  "+90",
                  style: AppTheme.lightTextStyle(context, 16),
                ),
                SizedBox(
                  width: deviceWidthSize(context, 10),
                ),
                Container(
                  width: deviceWidthSize(context, 1),
                  height: deviceHeightSize(context, 20),
                  color: Colors.grey,
                ),
              ],
            ),
            ontap: () {
              _scrollController.animateTo(
                deviceHeightSize(context, 200),
                duration: const Duration(milliseconds: 500),
                curve: Curves.ease,
              );
            },
            title: "Telefon Numarası",
          ),
          SizedBox(
            height: deviceHeightSize(context, _phoneLoginPageType == PhoneLoginPageType.register ? 20 : 30),
          ),

          //GİRİŞ YAP VEYA KAYDOL BUTONU
          GeneralButtonWidget(
            onPressed: () async {
              try {
// Null check
                if ((_nameController.text.isEmpty && _phoneLoginPageType == PhoneLoginPageType.register) ||
                    _phoneController.text.isEmpty) {
                  ToastWidgets.errorToast(context, "Lütfen tüm alanları doldurunuz!");
                  return;
                }

                //Telefon numarası formatlama
                context.read<LoginRegisterPageProvider>().phoneNumber =
                    "+90${_phoneController.text.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", "")}";

                // Login olurken telefon numarası kontrolü
                if (_phoneLoginPageType == PhoneLoginPageType.login) {
                  GeneralResponseModel generalResponseModel =
                      await context.read<LoginRegisterPageProvider>().isPhoneNumberExist();
                  if (generalResponseModel.success == false) {
                    ToastWidgets.errorToast(context, generalResponseModel.message ?? "");
                    FocusScope.of(context).unfocus();
                    context.read<LoginRegisterPageProvider>().setPhoneLoginPageType(PhoneLoginPageType.login);
                    Navigator.pushReplacementNamed(context, RegisterPage.routeName);
                    return;
                  }
                }

                // Onbarding'de cevaplanmamış soru varsa tekrar onboarding ekranına at
                // if (_phoneLoginPageType == PhoneLoginPageType.register &&
                //     (context.read<LoginRegisterPageProvider>().selectedOptions.any((element) => element == -1) ==
                //         true)) {
                //   Navigator.pushReplacementNamed(context, OnboardingPage.routeName);
                //   return;
                // }

                // Süreyi ayarla
                setState(() {
                  resendSecond = 120;
                });

                // Provider verilerini güncelle
                context.read<LoginRegisterPageProvider>().name = _nameController.text;
                context.read<LoginRegisterPageProvider>().phoneNumber =
                    "+90${_phoneController.text.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", "")}";

                // KOD GÖNDERME AŞAMASI
                GeneralResponseModel response;
                if (kIsWeb) {
                  await context.read<LoginRegisterPageProvider>().sendOTP();
                  response = GeneralResponseModel(success: true);
                } else {
                  response = await context.read<LoginRegisterPageProvider>().sendVerificationCode();
                }
                // Gönderilmediyse hata döndür ve kayıt ol sayfasına yönlendir.
                if (response.success == true) {
                  print("Sms code sended");
                } else {
                  ToastWidgets.errorToast(context,
                      "Girilen telefon numarası sistemde zaten kayıtlı ya da girdiğiniz verilerde hata olabilir!");
                  print("BURAYA GELDİ");
                  context.read<LoginRegisterPageProvider>().setPhoneLoginPageType(PhoneLoginPageType.login);
                  Navigator.pushNamedAndRemoveUntil(context, RegisterPage.routeName, (route) => false);
                }
              } catch (e) {
                ToastWidgets.errorToast(context, "Beklenmeyen bir hatayla karşılaşıldı. Lütfen tekrar deneyin");
                Navigator.pushReplacementNamed(context, RegisterPage.routeName);
                return;
              }
            },
            isLoading: context.watch<LoginRegisterPageProvider>().smsCodeSentState == LoadingState.loading,
            text: _phoneLoginPageType == PhoneLoginPageType.login ? "Giriş Yap" : "Kayıt Ol",
          ),
          TextButton(
            onPressed: () {
              if (_phoneLoginPageType == PhoneLoginPageType.login) {
                context.read<LoginRegisterPageProvider>().setPhoneLoginPageType(PhoneLoginPageType.register);
                Navigator.pushReplacementNamed(context, RegisterPage.routeName);
              } else {
                context.read<LoginRegisterPageProvider>().setPhoneLoginPageType(PhoneLoginPageType.login);
              }
            },
            child: RichText(
                text: TextSpan(
              text: _phoneLoginPageType == PhoneLoginPageType.login ? "Hesabınız yok mu? " : "Hesabınız var mı? ",
              style: AppTheme.lightTextStyle(context, 16),
              children: [
                TextSpan(
                  text: _phoneLoginPageType == PhoneLoginPageType.login ? "Kayıt Ol" : "Giriş Yap",
                  style: AppTheme.boldTextStyle(context, 16, color: AppTheme.primaryColor),
                ),
              ],
            )),
          ),
        ],
      ),
    );
  }

  Widget verifySmsCodeWidget(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: deviceWidthSize(context, 20)),
      child: Column(
        children: [
          Text(
            "Lütfen telefonunuza gelen 6 haneli kodu giriniz.",
            textAlign: TextAlign.center,
            style: AppTheme.lightTextStyle(context, 28),
          ),
          SizedBox(
            height: deviceHeightSize(context, 30),
          ),
          Pinput(
            length: 6,
            controller: _verifyController,
            cursor: Text("_", style: AppTheme.boldTextStyle(context, 22, color: AppTheme.primaryColor)),
            keyboardType: TextInputType.number,
            defaultPinTheme: PinTheme(
              decoration: BoxDecoration(
                color: AppTheme.white,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.darkBlue.withOpacity(0.2),
                    blurRadius: 11,
                    offset: const Offset(0, 5),
                  ),
                ],
                borderRadius: BorderRadius.circular(10),
              ),
              width: deviceWidthSize(context, 50),
              height: deviceHeightSize(context, 60),
              textStyle: AppTheme.boldTextStyle(context, 24, color: AppTheme.primaryColor),
            ),
            onTap: () {
              print("object");
              _scrollController.animateTo(
                deviceHeightSize(context, 270),
                duration: const Duration(milliseconds: 500),
                curve: Curves.ease,
              );
            },
            onChanged: (value) {
              if (value.length == 6) {
                _scrollController.animateTo(
                  _scrollController.position.maxScrollExtent,
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOut,
                );
              }
            },
            forceErrorState: context.watch<LoginRegisterPageProvider>().smsCodeState == LoadingState.error,
            errorPinTheme: PinTheme(
              decoration: BoxDecoration(
                color: AppTheme.white,
                border: Border.all(color: AppTheme.red),
                borderRadius: BorderRadius.circular(10),
              ),
              width: deviceWidthSize(context, 50),
              height: deviceHeightSize(context, 60),
              textStyle: AppTheme.boldTextStyle(context, 24, color: AppTheme.yellow),
            ),
            errorText: "Hatalı Kod",
            errorTextStyle: AppTheme.normalTextStyle(context, 16, color: AppTheme.red),
          ),
          SizedBox(
            height: deviceHeightSize(context, 20),
          ),
          Column(
            children: [
              Text(
                Duration(seconds: resendSecond).toString().split(".")[0].padLeft(8, "0").substring(3, 8),
                style: AppTheme.lightTextStyle(
                  context,
                  32,
                ),
              ),
              Text(
                "Doğrulama kodu gelmedi mi?",
                style: AppTheme.lightTextStyle(context, 16),
              ),
              TextButton(
                onPressed: () {
                  if (resendSecond == 0) {
                    _verifyController.clear();
                    context.read<LoginRegisterPageProvider>().sendVerificationCode();
                    setState(() {
                      resendSecond = 120;
                    });
                  }
                },
                child: Text(
                  "Tekrar Gönder",
                  style: AppTheme.boldTextStyle(context, 16,
                      color: resendSecond == 0 ? AppTheme.darkBlue : AppTheme.darkBlue.withOpacity(0.3)),
                ),
              ),
            ],
          ),
          SizedBox(
            height: deviceHeightSize(context, 20),
          ),
          GeneralButtonWidget(
            onPressed: () async {
              if (context.read<LoginRegisterPageProvider>().smsCodeState == LoadingState.loading) {
                return;
              }

              if (_verifyController.text.length != 6) {
                ToastWidgets.errorToast(context, "Lütfen kodu doğru giriniz!");
              } else {
                String phoneNum =
                    "+90${_phoneController.text.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", "")}";
                context.read<LoginRegisterPageProvider>().phoneNumber = phoneNum;
                if (kIsWeb) {
                  await context
                      .read<LoginRegisterPageProvider>()
                      .authenticate(_verifyController.text, phoneNum, _nameController.text)
                      .then(
                    (value) {
                      print(value.message);
                      if (value.message == "true") {
                        ToastWidgets.successToast(context, "Giriş yapılıyor...");
                      }
                      if (value.success == true) {
                        if (HiveHelpers.getUserFromHive().favoriteStks.isEmpty) {
                          Navigator.pushReplacement(
                              context, MaterialPageRoute(builder: (context) => SelectFavoriteStkPage(inTree: false)));
                          return;
                        }
                        if (context.read<LoginRegisterPageProvider>().selectedOptions.any(
                                  (element) => element == -1,
                                ) ==
                            false) {
                          if (context.read<LoginRegisterPageProvider>().selectedOptions[0] == 2) {
                            Navigator.pushReplacementNamed(
                              context,
                              VolunteerForm.routeName,
                            );
                            return;
                          }
                        }
                        context.read<AppViewProvider>().selectedWidget = const HomePage();
                        Navigator.pushReplacementNamed(context, AppView.routeName);
                      } else {
                        _verifyController.clear();
                        ToastWidgets.errorToast(context, value.message ?? "");
                      }
                    },
                  );
                } else {
                  context.read<LoginRegisterPageProvider>().verifyPhoneNumber(_verifyController.text).then(
                    (value) {
                      if (value.success == true) {
                        if (HiveHelpers.getUserFromHive().favoriteStks.isEmpty) {
                          Navigator.pushReplacement(
                              context, MaterialPageRoute(builder: (context) => SelectFavoriteStkPage(inTree: false)));
                          return;
                        }
                        if (context.read<LoginRegisterPageProvider>().selectedOptions.any(
                                  (element) => element == -1,
                                ) ==
                            false) {
                          if (context.read<LoginRegisterPageProvider>().selectedOptions[0] == 2) {
                            Navigator.pushReplacementNamed(
                              context,
                              VolunteerForm.routeName,
                            );
                            return;
                          }
                        }
                        context.read<AppViewProvider>().selectedWidget = const HomePage();
                        Navigator.pushReplacementNamed(context, AppView.routeName);
                      } else {
                        ToastWidgets.errorToast(context, value.message ?? "");
                      }
                    },
                  );
                }
              }
            },
            isLoading: context.watch<LoginRegisterPageProvider>().smsCodeState == LoadingState.loading,
            text: "Doğrula",
          )
        ],
      ),
    );
  }
}
