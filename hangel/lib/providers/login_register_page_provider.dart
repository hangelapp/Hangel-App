import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:hangel/services/firestore_services.dart';

import '../controllers/login_register_page_controller.dart';
import '../helpers/hive_helpers.dart';
import '../helpers/locator.dart';
import '../models/general_response_model.dart';
import '../models/user_model.dart';
import '../views/auth/register_page.dart';
import '../views/user_ban_page.dart';

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

  DateTime? _correctDateTime;
  DateTime? get correctDateTime => _correctDateTime;
  set correctDateTime(DateTime? value) {
    _correctDateTime = value;
    notifyListeners();
  }

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

  List<int> selectedOptions = List.filled(3, 0);

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
    try {
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
    } catch (e) {
      print(e);
      return GeneralResponseModel(success: false);
    }
  }

  Future<GeneralResponseModel> verifyPhoneNumber(String smsCode,List<String>? favoriteStksList, context) async {
    try {
      smsCodeState = LoadingState.loading;
      notifyListeners();

      GeneralResponseModel responseModel = await _loginRegisterPageController.verifyPhoneNumber(
          favoriteStksList: favoriteStksList,
          phoneNumber: _phoneNumber, name: _name, verificationId: _verificationId, smsCode: smsCode, context: context);
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
        if (user.isActive?["isActive"] == false) {
          print("Kullanıcı banlanmış");
          HiveHelpers.logout();
          smsCodeState = LoadingState.loaded;
          notifyListeners();
          Navigator.pushNamedAndRemoveUntil(context, UserBanPage.routeName, (route) => false);
          return GeneralResponseModel(
            success: false,
            message: "Kullanıcı banlandı",
          );
        }
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

  Future<ConfirmationResult?> sendOTP() async {
    try {
      FirebaseAuth auth = FirebaseAuth.instance;
      smsCodeSentState = LoadingState.loading;
      notifyListeners();
      // var verifier = RecaptchaVerifier(auth: FirebaseAuthWeb.instance,container: "container");
      ConfirmationResult result = await auth.signInWithPhoneNumber(_phoneNumber);
      print("OTP Sent to $phoneNumber");
      setConfirmationResult(result);
      setPhoneLoginPageType(PhoneLoginPageType.verify);
      smsCodeSentState = LoadingState.loaded;
      notifyListeners();
      return result;
    } catch (e) {
      print(e);
      smsCodeSentState = LoadingState.loaded;
      notifyListeners();
      throw Exception("Web authtentication error");
    } finally {
      smsCodeSentState = LoadingState.loaded;
      notifyListeners();
    }
  }

  Future<GeneralResponseModel> authenticate(String otp, String phoneNumber, String name, context) async {
    try {
      smsCodeState = LoadingState.loading;
      notifyListeners();
      GeneralResponseModel generalResponseModel = GeneralResponseModel();
      bool isExist = false;
      if (confirmationResult == null) throw Exception("Kod gönderilmemiş");
      UserCredential userCredential = await confirmationResult!.confirm(otp);
      userCredential.additionalUserInfo!.isNewUser ? print("Authentication Successful") : isExist = true;
      User? user = userCredential.user;
      if (user == null) {
        print("Kullanıcı kaydolurken hatayla karşılaşıldı.");
        generalResponseModel = GeneralResponseModel(success: false, message: "Kullanıcı veritabanında bulunamadı");
        throw Exception("Kullanıcı kaydolurken hatayla karşılaşıldı.");
      } else {
        print("Verify Phone Number Success : " + user.uid);
        UserModel userModel = UserModel.fromFirebaseUser(user);
        if ((await _loginRegisterPageController.isUserExist(user.uid, context)) == false) {
          userModel.name = name;
          userModel.phone = phoneNumber;
          userModel.image = "";
          userModel.createdAt = DateTime.now();
          FirestoreServices firestoreServices = FirestoreServices();
          GeneralResponseModel responseModel = await firestoreServices.setData(
            userModel.toJson(),
            'users/${userModel.uid}',
          );

          if (responseModel.success == false) {
            generalResponseModel = GeneralResponseModel(
              success: false,
              message: 'Kayıt yapılamadı',
            );
          } else {
            HiveHelpers.addUserToHive(userModel);
          }
        }
        HiveHelpers.addUserToHive(userModel);
        generalResponseModel = GeneralResponseModel(
          success: true,
          message: 'Kayıt yapıldı',
        );
      }
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
        if (user.isActive?["isActive"] == false) {
          print("Kullanıcı banlanmış");
          HiveHelpers.logout();
          smsCodeState = LoadingState.loaded;
          notifyListeners();
          Navigator.pushNamedAndRemoveUntil(context, UserBanPage.routeName, (route) => false);
          return GeneralResponseModel(
            success: false,
            message: "Kullanıcı pasif!",
          );
        }
        // Kullanıcıyı Hive'a ekle
        HiveHelpers.addUserToHive(user);
        print(user);
        generalResponseModel = GeneralResponseModel(success: true, message: isExist.toString());
      }

      smsCodeState = LoadingState.loaded;
      notifyListeners();
      generalResponseModel = GeneralResponseModel(success: true, message: isExist.toString());
      return generalResponseModel;
    } on FirebaseAuthException catch (e) {
      smsCodeState = LoadingState.loaded;
      notifyListeners();
      if (e.code == "invalid-verification-code") {
        return GeneralResponseModel(success: false, message: "Girilen doğrulama kodu yanlış!");
      }
      return GeneralResponseModel(success: false, message: e.toString());
    } catch (e) {
      smsCodeState = LoadingState.loaded;
      notifyListeners();
      return GeneralResponseModel(success: false, message: e.toString());
    } finally {
      smsCodeState = LoadingState.loaded;
      notifyListeners();
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
  Future<UserModel?> getUserByPhoneNumber(context, String phoneNumber) async {
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
        if (user.isActive?["isActive"] == false) {
          print("Kullanıcı banlanmış");
          HiveHelpers.logout();

          Navigator.pushNamedAndRemoveUntil(context, UserBanPage.routeName, (route) => false);
          return null;
        }
        // Kullanıcıyı Hive'a ekle
        HiveHelpers.addUserToHive(user);
        return user;
      } else {
        return null;
      }
    } catch (e) {
      print('Error getting user by phone numbera: $e');
      return null;
    }
  }

  Future<UserModel?> getUserById(String uid, context) async {
    try {
      // Firestore'daki kullanıcı koleksiyonunu sorgula
      DocumentSnapshot snapshot = await FirebaseFirestore.instance.collection('users').doc(uid).get();
      var data = snapshot.data() as Map<String?, dynamic>;
      UserModel user = UserModel.fromJson(data);

      // Kullanıcıyı Hive'a ekle
      HiveHelpers.addUserToHive(user);
      return user;
    } catch (e) {
      print('Error getting user by phone numberb: $e');
      HiveHelpers.logout();
      await FirebaseAuth.instance.signOut();
      print("Kullanıcı banlanmış");
      Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (context) => const RegisterPage()), (route) => false);

      return null;
    }
  }
}
