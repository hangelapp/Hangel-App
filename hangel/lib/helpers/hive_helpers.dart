import 'package:hive_flutter/hive_flutter.dart';
import '../models/user_model.dart';

class HiveHelpers {
  static void addUserToHive(UserModel userModel) {
    Hive.box('user')
        .put('userModel', userModel.toJson())
        // .then((value) => print('User added to hive: ${userModel.uid}'))
        .then((value) => print(""))
        .onError((error, stackTrace) => print('User added to hive error: ${error.toString()}'));
  }

  static UserModel getUserFromHive() {
    try {
      final data = Hive.box('user').get('userModel');
      // print("get user data " + data.toString());
      return UserModel.fromJson(Map<String, dynamic>.from((data ?? {})));
    } catch (e) {
      print("get user error" + e.toString());
      return UserModel();
    }
  }

  static String getUid() {
    try {
      UserModel userModel = HiveHelpers.getUserFromHive();
      return userModel.uid!;
    } catch (e) {
      return '';
    }
  }

  static void logout() {
    Hive.box('user').delete('userModel');
  }
}
