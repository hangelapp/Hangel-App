import 'package:hive_flutter/hive_flutter.dart';
import '../models/user_model.dart';

class HiveHelpers {
  static Future<void> addUserToHive(UserModel userModel) async {
    try {
      Map<String, dynamic> userJson = userModel.toJson();
      // print('Adding user to Hive: $userJson');
      await Hive.box('user').put('userModel', userJson);
      print('User added to hive: ${userModel.uid}');
    } catch (error) {
      print('User added to hive error: ${error.toString()}');
    }
  }

  static UserModel getUserFromHive() {
    try {
      final data = Hive.box('user').get('userModel');
      if (data != null) {
        // print("User data retrieved from Hive: $data");
        return UserModel.fromJson(Map<String, dynamic>.from(data));
      } else {
        print("No user data found in Hive.");
        return UserModel();
      }
    } catch (e) {
      print("get user error: $e");
      return UserModel();
    }
  }

  static String getUid() {
    try {
      UserModel userModel = HiveHelpers.getUserFromHive();
      return userModel.uid ?? '';
    } catch (e) {
      print("getUid error: $e");
      return '';
    }
  }

  static Future<void> logout() async {
    await Hive.box('user').delete('userModel');
  }
}
