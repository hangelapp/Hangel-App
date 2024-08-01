import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/models/where_model.dart';
import 'package:hangel/services/firestore_services.dart';
import '../helpers/locator.dart';
import '../models/general_response_model.dart';
import '../services/firebase_auth_services.dart';

class LoginRegisterPageController {
  final _firebaseAuthServices = locator<FirebaseAuthServices>();
  final _firestoreServices = locator<FirestoreServices>();
  // final _apiServices = locator<ApiServices>();
  // final _usersPath = 'users';

  Future<GeneralResponseModel> verifyPhoneNumber({
    required String phoneNumber,
    required String name,
    required String verificationId,
    required String smsCode,
  }) async {
    try {
      User user = await _firebaseAuthServices.verifyPhoneNumber(verificationId, smsCode);
      if (user.uid.isEmpty) {
        return GeneralResponseModel(
          success: false,
          message: 'Kayıt yapılamadı',
        );
      } else {
        print("Verify Phone Number Success : " + user.uid);
        UserModel userModel = UserModel.fromFirebaseUser(user);

        if ((await isUserExist(user.uid)) == false) {
          userModel.name = name;
          userModel.image = "";
          userModel.createdAt = DateTime.now();

          GeneralResponseModel responseModel = await _firestoreServices.setData(
            userModel.toJson(),
            'users/${userModel.uid}',
          );

          if (responseModel.success == false) {
            return GeneralResponseModel(
              success: false,
              message: 'Kayıt yapılamadı',
            );
          } else {
            HiveHelpers.addUserToHive(userModel);
          }
        }
        HiveHelpers.addUserToHive(userModel);
        return GeneralResponseModel(
          success: true,
          message: 'Kayıt yapıldı',
        );
      }
    } catch (e) {
      print("Verify Phone Number Error : " + e.toString());
      return GeneralResponseModel(
        success: false,
        message: 'Doğrulama kodu yanlış.',
      );
    }
  }

  Future<bool> isUserExist(String uid) async {
    try {
      var data = await _firestoreServices.getData('users', wheres: [
        WhereModel(
          'uid',
          isEqualTo: uid,
        )
      ]);
      if (kDebugMode) {
        print("isUserExist : ${data.first.data()}");
      }
      UserModel userModel = UserModel.fromJson(data.first.data() as Map<String, dynamic>);
      if (userModel.uid == null || userModel.phone == null) {
        return false;
      } else {
        HiveHelpers.addUserToHive(userModel);
        return true;
      }
    } catch (e) {
      print("isUserExist Error : " + e.toString());
      return false;
    }
  }

  Future<bool> isPhoneNumberExist(String phoneNumber) async {
    try {
      var data = await _firestoreServices.getData('users', wheres: [
        WhereModel(
          'phone',
          isEqualTo: phoneNumber.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", ""),
        )
      ]);

      if (data.length > 0) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      print("isPhoneNumberExist Error : " + e.toString());
      return false;
    }
  }
}
