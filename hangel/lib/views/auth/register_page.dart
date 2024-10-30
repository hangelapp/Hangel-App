import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart'; // Import for TapGestureRecognizer
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/general_response_model.dart';
import 'package:hangel/providers/app_view_provider.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/views/home_page.dart';
import 'package:hangel/views/select_favorite_stk_page.dart';
import 'package:hangel/views/vounteer_form.dart';
import 'package:intl_phone_number_input/intl_phone_number_input.dart';
import 'package:libphonenumber/libphonenumber.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import '../../constants/app_theme.dart';
import '../../constants/constants.dart';
import '../../constants/size.dart';
import '../../providers/login_register_page_provider.dart';
import '../../widgets/app_bar_widget.dart';
import '../../widgets/form_field_widget.dart';
import '../../widgets/general_button_widget.dart';
import '../../widgets/toast_widgets.dart';
import '../../widgets/locale_text.dart'; // Ensure LocaleText is imported

class RegisterPage extends StatefulWidget {
  const RegisterPage({Key? key}) : super(key: key);

  static const routeName = '/register';

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _maskFormatter = MaskTextInputFormatter(
      mask: '(###) ### ## ##', filter: {"#": RegExp(r'[0-9]')}, type: MaskAutoCompletionType.lazy);
  PhoneNumber _phoneNumber = PhoneNumber(isoCode: 'TR');
  bool _isValidNumber = true;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _verifyController = TextEditingController();

  final ScrollController _scrollController = ScrollController();

  PhoneLoginPageType _phoneLoginPageType = PhoneLoginPageType.login;
  int resendSecond = 120;

  Timer? _timer;

  bool _isUserAgreementAccepted = false; // User Agreement acceptance
  bool _isPrivacyAgreementAccepted = false; // Privacy Agreement acceptance

  @override
  void initState() {
    SchedulerBinding.instance.addPostFrameCallback((timeStamp) {
      _phoneController.addListener(_formatPhoneNumber);
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
                    height: deviceHeightSize(context, _phoneLoginPageType == PhoneLoginPageType.login ? 200 : 150),
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
          LocaleText(
            _phoneLoginPageType == PhoneLoginPageType.register
                ? 'register_page_create_account'.locale
                : 'register_page_login'.locale,
            style: AppTheme.lightTextStyle(context, 28),
          ),
          SizedBox(
            height: deviceHeightSize(context, _phoneLoginPageType == PhoneLoginPageType.register ? 20 : 30),
          ),
          if (_phoneLoginPageType == PhoneLoginPageType.register)
            FormFieldWidget(
              context,
              controller: _nameController,
              title: 'register_page_full_name'.locale,
              ontap: () {},
            ),
          // Uluslararası telefon numarası girişi
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LocaleText(
                'register_page_phone_number',
                style: AppTheme.semiBoldTextStyle(context, 16),
              ),
              SizedBox(height: deviceHeightSize(context, 5)),
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: deviceWidthSize(context, 10),
                ),
                decoration: BoxDecoration(
                  color: AppTheme.white,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.darkBlue.withOpacity(0.2),
                      blurRadius: 22,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: InternationalPhoneNumberInput(
                  onInputChanged: (PhoneNumber number) {
                    _phoneNumber = number;
                  },
                  selectorConfig: SelectorConfig(
                    selectorType: PhoneInputSelectorType.DROPDOWN,
                    showFlags: false,
                    trailingSpace: false,
                    setSelectorButtonAsPrefixIcon: true,
                    useBottomSheetSafeArea: true,
                  ),
                  ignoreBlank: false,
                  autoValidateMode: AutovalidateMode.disabled,
                  selectorTextStyle: AppTheme.lightTextStyle(context, 16),
                  initialValue: _phoneNumber,
                  spaceBetweenSelectorAndTextField: 12,
                  textFieldController: _phoneController,
                  formatInput: false, // Formatlamayı manuel yapıyoruz
                  inputDecoration: InputDecoration(
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    disabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    hintText: 'register_page_enter_phone'.locale,
                    hintStyle: AppTheme.lightTextStyle(context, 14, color: Colors.grey),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(
            height: deviceHeightSize(context, _phoneLoginPageType == PhoneLoginPageType.register ? 20 : 30),
          ),
          // Agreements
          if (_phoneLoginPageType == PhoneLoginPageType.register) ...[
            CheckboxListTile(
              value: _isUserAgreementAccepted,
              onChanged: (bool? value) {
                setState(() {
                  _isUserAgreementAccepted = value ?? false;
                });
              },
              title: RichText(
                text: TextSpan(
                  text: '',
                  style: AppTheme.lightTextStyle(context, 14),
                  children: [
                    TextSpan(
                      text: 'register_page_user_agreement'
                          .locale
                          .substring(0, ('register_page_user_agreement'.locale.length - 1) ~/ 2),
                      style: AppTheme.lightTextStyle(context, 14),
                    ),
                    TextSpan(
                      text: 'register_page_user_agreement'
                          .locale
                          .substring(('register_page_user_agreement'.locale.length - 1) ~/ 2),
                      style: AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () {
                          _showAgreementDialog('settings_page_user_agreement', AppConstants.USER_AGREEMENT);
                        },
                    ),
                  ],
                ),
              ),
              controlAffinity: ListTileControlAffinity.leading,
            ),
            CheckboxListTile(
              value: _isPrivacyAgreementAccepted,
              onChanged: (bool? value) {
                setState(() {
                  _isPrivacyAgreementAccepted = value ?? false;
                });
              },
              title: RichText(
                text: TextSpan(
                  text: '',
                  style: AppTheme.lightTextStyle(context, 14),
                  children: [
                    TextSpan(
                      text: 'register_page_privacy_agreement'
                          .locale
                          .substring(0, ('register_page_privacy_agreement'.locale.length - 1) ~/ 2),
                      style: AppTheme.lightTextStyle(context, 14),
                    ),
                    TextSpan(
                      text: 'register_page_privacy_agreement'
                          .locale
                          .substring(('register_page_privacy_agreement'.locale.length - 1) ~/ 2),
                      style: AppTheme.boldTextStyle(context, 14, color: AppTheme.primaryColor),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () {
                          _showAgreementDialog('settings_page_privacy_policy', AppConstants.SECRET_AGREEMENT);
                        },
                    ),
                  ],
                ),
              ),
              controlAffinity: ListTileControlAffinity.leading,
            ),
            SizedBox(
              height: deviceHeightSize(context, 20),
            ),
          ],
          // GİRİŞ YAP VEYA KAYDOL BUTONU
          GeneralButtonWidget(
            onPressed: () async {
              try {
                print(_phoneNumber.phoneNumber);
                // Boşluk kontrolü
                if ((_nameController.text.isEmpty && _phoneLoginPageType == PhoneLoginPageType.register) ||
                    (_phoneController.text.isEmpty || !_isValidNumber || _phoneNumber.phoneNumber == null)) {
                  ToastWidgets.errorToast(context, 'register_page_error_fill_all_fields'.locale);
                  return;
                }

                // Agreement checks
                if (_phoneLoginPageType == PhoneLoginPageType.register) {
                  if (!_isUserAgreementAccepted || !_isPrivacyAgreementAccepted) {
                    ToastWidgets.errorToast(context, 'register_page_error_accept_agreements'.locale);
                    return;
                  }
                }

                // Telefon numarası formatlama
                String formattedPhoneNumber = _phoneNumber.phoneNumber!;
                context.read<LoginRegisterPageProvider>().phoneNumber = '$formattedPhoneNumber';

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

                // Süreyi ayarla
                setState(() {
                  resendSecond = 120;
                });

                // Provider verilerini güncelle
                context.read<LoginRegisterPageProvider>().name = _nameController.text;

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
                  print("Sms kodu gönderildi");
                } else {
                  ToastWidgets.errorToast(context, 'register_page_error_unexpected'.locale);
                  context.read<LoginRegisterPageProvider>().setPhoneLoginPageType(PhoneLoginPageType.login);
                  Navigator.pushNamedAndRemoveUntil(context, RegisterPage.routeName, (route) => false);
                }
              } catch (e) {
                ToastWidgets.errorToast(context, 'register_page_error_unexpected'.locale);
                Navigator.pushReplacementNamed(context, RegisterPage.routeName);
                return;
              }
            },
            isLoading: context.watch<LoginRegisterPageProvider>().smsCodeSentState == LoadingState.loading,
            text: _phoneLoginPageType == PhoneLoginPageType.login
                ? 'register_page_login'.locale
                : 'register_page_create_account'.locale,
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
                text: _phoneLoginPageType == PhoneLoginPageType.login
                    ? 'register_page_login_register_prompt_login'.locale
                    : 'register_page_login_register_prompt_register'.locale,
                style: AppTheme.lightTextStyle(context, 16),
                children: [
                  TextSpan(
                    text: _phoneLoginPageType == PhoneLoginPageType.login
                        ? 'register_page_login_register_action_register'.locale
                        : 'register_page_login_register_action_login'.locale,
                    style: AppTheme.boldTextStyle(context, 16, color: AppTheme.primaryColor),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _formatPhoneNumber() {
    String text = _phoneController.text;
    // Sadece rakamları al
    text = text.replaceAll(RegExp(r'[^\d]'), '');
    // Maskeyi uygula
    if (text.length > 0) {
      text = '($text';
    }
    if (text.length > 4) {
      text = text.substring(0, 4) + ') ' + text.substring(4);
    }
    if (text.length > 9) {
      text = text.substring(0, 9) + ' ' + text.substring(9);
    }
    if (text.length > 12) {
      text = text.substring(0, 12) + ' ' + text.substring(12);
    }
    // Metni güncelle
    _phoneController.value = TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }

  Widget verifySmsCodeWidget(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: deviceWidthSize(context, 20)),
        child: Column(
          children: [
            LocaleText(
              'register_page_verify_code_prompt',
              textAlign: TextAlign.center,
              style: AppTheme.lightTextStyle(context, 28),
            ),
            SizedBox(
              height: deviceHeightSize(context, 30),
            ),
            Pinput(
              length: 6,
              autofocus: true,
              scrollPadding: EdgeInsets.only(bottom: 100),
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
              },
              onChanged: (value) {
                if (value.length == 6) {}
              },
              forceErrorState: context.watch<LoginRegisterPageProvider>().smsCodeState == LoadingState.error,
              errorPinTheme: PinTheme(
                decoration: BoxDecoration(
                  color: AppTheme.white,
                  borderRadius: BorderRadius.circular(10),
                ),
                width: deviceWidthSize(context, 50),
                height: deviceHeightSize(context, 60),
                textStyle: AppTheme.boldTextStyle(context, 24, color: AppTheme.yellow),
              ),
              errorText: 'register_page_error_invalid_code'.locale,
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
                LocaleText(
                  'register_page_didnt_receive_code',
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
                  child: LocaleText(
                    'register_page_resend_code',
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
                  ToastWidgets.errorToast(context, 'register_page_error_invalid_code'.locale);
                } else {
                  String phoneNum = _phoneNumber.phoneNumber!;
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
              text: 'register_page_verify'.locale,
            )
          ],
        ),
      ),
    );
  }

  void _showAgreementDialog(String title, String content) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: LocaleText(title), // Assuming titles are fixed
          content: SingleChildScrollView(
            child: Text(content),
          ),
          actions: [
            TextButton(
              child: LocaleText('close'), // You might want to add 'close' key to localization
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }
}
