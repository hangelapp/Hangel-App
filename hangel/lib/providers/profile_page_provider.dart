import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hangel/controllers/profile_page_controller.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/helpers/locator.dart';
import 'package:hangel/models/general_response_model.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:image_picker/image_picker.dart';

class ProfilePageProvider with ChangeNotifier {
  final _profilePageController = locator<ProfilePageController>();
  UserModel get user => HiveHelpers.getUserFromHive();

  LoadingState _loadingState = LoadingState.loaded;
  LoadingState get loadingState => _loadingState;
  set loadingState(LoadingState value) {
    _loadingState = value;
    notifyListeners();
  }

  LoadingState _addButtonState = LoadingState.loaded;
  LoadingState get addButtonState => _addButtonState;
  set addButtonState(LoadingState value) {
    _addButtonState = value;
    notifyListeners();
  }

  XFile? _image;
  XFile? get image => _image;
  set image(XFile? value) {
    _image = value;
    notifyListeners();
  }

  int _supportSelectedIndex = -1;
  int get supportSelectedIndex => _supportSelectedIndex;
  set supportSelectedIndex(int value) {
    _supportSelectedIndex = value;
    notifyListeners();
  }

  Future<GeneralResponseModel> uploadImage() async {
    _addButtonState = LoadingState.loading;
    notifyListeners();
    if (_image == null) {
      _addButtonState = LoadingState.loaded;
      notifyListeners();
      return GeneralResponseModel(
          message: "Fotoğraf yüklenirken bir hata oluştu", success: false);
    }
    final response =
        await _profilePageController.uploadImage(File(_image!.path));
    _addButtonState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  Future<GeneralResponseModel> updateProfile(
      Map<String, String> map, UserModel userModel) async {
    _addButtonState = LoadingState.loading;
    notifyListeners();
    final response = await _profilePageController.updateProfile(map);
    if (response.success == true) {
      HiveHelpers.addUserToHive(userModel);
    }
    _addButtonState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  void clear() {
    _image = null;
  }
}
