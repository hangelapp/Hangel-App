import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_auth_platform_interface/firebase_auth_platform_interface.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../controllers/login_register_page_controller.dart';
import '../helpers/hive_helpers.dart';
import '../helpers/locator.dart';
import '../models/general_response_model.dart';
import '../models/user_model.dart';

enum PhoneLoginPageType { register, login, verify }

enum LoadingState { loading, loaded, error }

class LoginRegisterPageProvider with ChangeNotifier {
  final _loginRegisterPageController = locator<LoginRegisterPageController>();

  String _phoneNumber = "";
  String _verificationId = "";
  String _smsCode = "";
  String _name = "";
  final int _selectedIndex = -1;
  LoadingState smsCodeSentState = LoadingState.loaded;
  LoadingState smsCodeState = LoadingState.loaded;
  PhoneLoginPageType _phoneLoginPageType = PhoneLoginPageType.login;
  ConfirmationResult? confirmationResult;
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

  // Onboarding'de sorulan soruların cevap listesini güncelle
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

  Future<GeneralResponseModel> sendVerificationCode() async {
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
    if (smsCodeSentState == LoadingState.loaded) {
      return GeneralResponseModel(success: false, message: "Error handled");
    } else if (smsCodeSentState == LoadingState.loaded) {
      return GeneralResponseModel(success: true, message: "Successfully sended");
    } else if (smsCodeSentState == LoadingState.loading) {
      return GeneralResponseModel(success: true, message: "Verify loading");
    } else {
      return GeneralResponseModel(success: false, message: "Error handled");
    }
  }

  Future<GeneralResponseModel> verifyPhoneNumber(String smsCode) async {
    try {
      smsCodeState = LoadingState.loading;
      notifyListeners();

      GeneralResponseModel responseModel = await _loginRegisterPageController.verifyPhoneNumber(
        phoneNumber: _phoneNumber,
        name: _name,
        verificationId: _verificationId,
        smsCode: smsCode,
      );
      QuerySnapshot querySnapshot = await FirebaseFirestore.instance
          .collection('users')
          .where('phone', isEqualTo: phoneNumber.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", ""))
          .limit(1)
          .get();
      // Eğer kullanıcı mevcutsa
      if (querySnapshot.docs.isNotEmpty) {
        // Belgeyi al
        var data = querySnapshot.docs.first.data() as Map<String, dynamic>;
        UserModel user = UserModel.fromJson(data);

        // Kullanıcıyı Hive'a ekle
        HiveHelpers.addUserToHive(user);
        print(user);
      }

      smsCodeState = LoadingState.loaded;
      notifyListeners();
      return responseModel;
    } on Exception catch (e) {
      smsCodeState = LoadingState.loaded;
      notifyListeners();
      return GeneralResponseModel(success: false, data: null, message: e.toString());
    }
  }

  Future<GeneralResponseModel> isPhoneNumberExist() async {
    smsCodeSentState = LoadingState.loading;
    notifyListeners();
    bool isExist = await _loginRegisterPageController
        .isPhoneNumberExist(_phoneNumber.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", ""));
    smsCodeSentState = LoadingState.loaded;
    notifyListeners();
    if (isExist) {
      setPhoneLoginPageType(PhoneLoginPageType.login);
    } else {
      setPhoneLoginPageType(PhoneLoginPageType.register);
    }
    return GeneralResponseModel(
      success: isExist,
      message: isExist ? "Kullanıcı bulundu" : "Kullanıcı bulunamadı, lütfen kayıt olun!",
    );
  }

  Future<ConfirmationResult> sendOTP() async {
    FirebaseAuth auth = FirebaseAuth.instance;
    var verifier = RecaptchaVerifier(auth: FirebaseAuthPlatform.instance);
    ConfirmationResult result =
        await auth.signInWithPhoneNumber(_phoneNumber, verifier);
    print("OTP Sent to $phoneNumber");
    setConfirmationResult(result);
    setPhoneLoginPageType(PhoneLoginPageType.verify);
    smsCodeSentState = LoadingState.loaded;
    notifyListeners();
    return result;
  }

  Future<GeneralResponseModel> authenticate(String otp) async {
    try {
      if (confirmationResult == null) throw Exception("Kod gönderilmemiş");
      UserCredential userCredential = await confirmationResult!.confirm(otp);
      userCredential.additionalUserInfo!.isNewUser ? print("Authentication Successful") : print("User already exists");
      QuerySnapshot querySnapshot = await FirebaseFirestore.instance
          .collection('users')
          .where('phone', isEqualTo: phoneNumber.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", ""))
          .limit(1)
          .get();
      // Eğer kullanıcı mevcutsa
      if (querySnapshot.docs.isNotEmpty) {
        // Belgeyi al
        var data = querySnapshot.docs.first.data() as Map<String, dynamic>;
        UserModel user = UserModel.fromJson(data);

        // Kullanıcıyı Hive'a ekle
        HiveHelpers.addUserToHive(user);
        print(user);
        return GeneralResponseModel(success: true);
      }

      smsCodeState = LoadingState.loaded;
      notifyListeners();
      return GeneralResponseModel(success: true);
    } catch (e) {
      return GeneralResponseModel(success: false,message: e.toString());
    }
  }

  setTimerTick(int timerTick) {
    this.timerTick = timerTick;
    notifyListeners();
  }

  setConfirmationResult(ConfirmationResult confirmationResult) {
    this.confirmationResult = confirmationResult;
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

  // Örnek kullanıcı kontrol fonksiyonu (Firebase Firestore gibi bir veritabanında kontrol edebilirsiniz)
  Future<UserModel?> getUserByPhoneNumber(String phoneNumber) async {
    try {
      // Firestore'daki kullanıcı koleksiyonunu sorgula
      QuerySnapshot querySnapshot = await FirebaseFirestore.instance
          .collection('users')
          .where('phone', isEqualTo: phoneNumber.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", ""))
          .limit(1)
          .get();

      // Eğer kullanıcı mevcutsa
      if (querySnapshot.docs.isNotEmpty) {
        // Belgeyi al
        var data = querySnapshot.docs.first.data() as Map<String?, dynamic>;
        UserModel user = UserModel.fromJson(data);

        // Kullanıcıyı Hive'a ekle
        HiveHelpers.addUserToHive(user);
        return user;
      } else {
        return null;
      }
    } catch (e) {
      print('Error getting user by phone number: $e');
      return null;
    }
  }

  Future<UserModel?> getUserById(String uid) async {
    try {
      // Firestore'daki kullanıcı koleksiyonunu sorgula
      DocumentSnapshot snapshot = await FirebaseFirestore.instance.collection('users').doc(uid).get();
      var data = snapshot.data() as Map<String?, dynamic>;
      UserModel user = UserModel.fromJson(data);

      // Kullanıcıyı Hive'a ekle
      HiveHelpers.addUserToHive(user);
      return user;
    } catch (e) {
      print('Error getting user by phone number: $e');
      return null;
    }
  }
}
