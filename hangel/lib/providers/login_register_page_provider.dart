import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:hangel/views/favorites_page.dart';
import '../controllers/login_register_page_controller.dart';
import '../helpers/locator.dart';
import '../models/general_response_model.dart';
import '../views/brands_page.dart';
import '../views/home_page.dart';
import '../views/profile_page.dart';
import '../views/stk_page.dart';

enum PhoneLoginPageType { register, login, verify }

enum LoadingState { loading, loaded, error }

class LoginRegisterPageProvider with ChangeNotifier {
  final _loginRegisterPageController = locator<LoginRegisterPageController>();

  String _phoneNumber = "";
  String _verificationId = "";
  String _smsCode = "";
  String _name = "";
  int _selectedIndex = -1;
  LoadingState smsCodeSentState = LoadingState.loaded;
  LoadingState smsCodeState = LoadingState.loaded;
  PhoneLoginPageType _phoneLoginPageType = PhoneLoginPageType.login;

  String verificationCode = "";
  int? _resendToken;

  int timerTick = -1;

  Map<String, DateTime> selectedDate = {
    "0": DateTime.now(),
    "1": DateTime.now(),
    "2": DateTime.now(),
  };

  String get phoneNumber => _phoneNumber;
  String get verificationId => _verificationId;
  String get smsCode => _smsCode;
  String get name => _name;
  int get selectedIndex => _selectedIndex;
  int? get resendToken => _resendToken;
  PhoneLoginPageType get phoneLoginPageType => _phoneLoginPageType;

  set phoneNumber(String value) => _phoneNumber = value;
  set smsCode(String value) => _smsCode = value;
  set name(String value) => _name = value;
  set selectedIndex(int value) => selectedIndex = value;

  List<int> selectedOptions = List.filled(3, -1);

  void setSelectedOption(int index, int value) {
    selectedOptions[index] = value;
    notifyListeners();
  }

  void clear() {
    _phoneNumber = "";
    _verificationId = "";
    _smsCode = "";
    _name = "";
  }

  Widget _selectedWidget = const HomePage();
  Widget get selectedWidget => _selectedWidget;
  set selectedWidget(Widget value) {
    _selectedWidget = value;
    notifyListeners();
  }

  List<Widget> widgetOptions = <Widget>[
    const HomePage(),
    const BrandsPage(),
    const FavoritesPage(),
    const STKPage(),
    const ProfilePage(),
  ];

  Future sendVerificationCode() async {
    smsCodeSentState = LoadingState.loading;
    notifyListeners();
    timerTick = 120;

    //verify phone number with firebase
    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: _phoneNumber,
      verificationCompleted: (PhoneAuthCredential credential) {
        print("verificationCompleted");
        smsCodeSentState = LoadingState.loaded;
        notifyListeners();
      },
      verificationFailed: (FirebaseAuthException e) {
        print("verificationFailed $e");
        smsCodeSentState = LoadingState.error;
        notifyListeners();
      },
      codeSent: (String verificationId, int? resendToken) async {
        print("codeSent");

        setPhoneLoginPageType(PhoneLoginPageType.verify);
        setVerificationId(verificationId);
        setResendToken(resendToken);
        smsCodeSentState = LoadingState.loaded;
        notifyListeners();
        // await SmsAutoFill().listenForCode();
        // SmsAutoFill().code.listen((event) {
        //   // _verifyController.text = event;
        // });
      },
      codeAutoRetrievalTimeout: (String verificationId) {
        print("codeAutoRetrievalTimeout");
        setVerificationId(verificationId);
        smsCodeSentState = LoadingState.loaded;
        notifyListeners();
      },
    );
  }

  Future<GeneralResponseModel> verifyPhoneNumber(String smsCode) async {
    smsCodeState = LoadingState.loading;
    notifyListeners();

    GeneralResponseModel responseModel =
        await _loginRegisterPageController.verifyPhoneNumber(
      phoneNumber: _phoneNumber,
      name: _name,
      verificationId: _verificationId,
      smsCode: smsCode,
    );
    smsCodeState = LoadingState.loaded;
    notifyListeners();
    return responseModel;
  }

  Future<GeneralResponseModel> isPhoneNumberExist() async {
    smsCodeSentState = LoadingState.loading;
    notifyListeners();
    bool isExist = await _loginRegisterPageController.isPhoneNumberExist(
        _phoneNumber
            .replaceAll(" ", "")
            .replaceAll("(", "")
            .replaceAll(")", ""));
    smsCodeSentState = LoadingState.loaded;
    notifyListeners();
    if (isExist) {
      setPhoneLoginPageType(PhoneLoginPageType.login);
    } else {
      setPhoneLoginPageType(PhoneLoginPageType.register);
    }
    return GeneralResponseModel(
      success: isExist,
      message: isExist
          ? "Kullanıcı bulundu"
          : "Kullanıcı bulunamadı, lütfen kayıt olun!",
    );
  }

  setTimerTick(int timerTick) {
    this.timerTick = timerTick;
    notifyListeners();
  }

  setResendToken(int? resendToken) {
    _resendToken = resendToken;
    notifyListeners();
  }

  setVerificationCode(String verificationCode) {
    this.verificationCode = verificationCode;
    notifyListeners();
  }

  setPhoneLoginPageType(PhoneLoginPageType phoneLoginPageType) {
    _phoneLoginPageType = phoneLoginPageType;
    notifyListeners();
  }

  setVerificationId(String verificationId) {
    _verificationId = verificationId;
    notifyListeners();
  }

  void addSelectedDate(DateTime selectedDate, int id) {
    this.selectedDate[id.toString()] = selectedDate;
    notifyListeners();
  }
}
