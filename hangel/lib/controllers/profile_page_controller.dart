import 'dart:io';

import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/helpers/locator.dart';
import 'package:hangel/models/general_response_model.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/services/firestore_services.dart';
import 'package:hangel/services/storage_service.dart';

class ProfilePageController {
  final _firestoreService = locator<FirestoreServices>();
  final _storageServices = locator<StorageServices>();

  Future<GeneralResponseModel> uploadImage(File file) async {
    final url = await _storageServices.uploadImage(
        "users/${HiveHelpers.getUserFromHive().uid!}", file);
    if (url.isEmpty) {
      return GeneralResponseModel(
          message: "Fotoğraf yüklenirken bir hata oluştu", success: false);
    } else {
      //update user image url
      GeneralResponseModel responseModel = await _firestoreService.updateData(
          'users/${HiveHelpers.getUserFromHive().uid!}', {'image': url});
      if (responseModel.success == true) {
        //update user image url in hive
        UserModel user = HiveHelpers.getUserFromHive();
        user.image = url;
        HiveHelpers.addUserToHive(user);
        return GeneralResponseModel(
            message: "Fotoğraf başarıyla yüklendi", success: true);
      } else {
        return GeneralResponseModel(
            message: "Fotoğraf yüklenirken bir hata oluştu", success: false);
      }
    }
  }

  Future<GeneralResponseModel> updateProfile(Map<String, String> map) async {
    try {
      GeneralResponseModel responseModel = await _firestoreService.updateData(
          'users/${HiveHelpers.getUserFromHive().uid!}', map);
      return responseModel;
    } catch (e) {
      print("updateProfile Error : " + e.toString());
      return GeneralResponseModel(
          message: "Profil güncellenirken bir hata oluştu", success: false);
    }
  }
}
