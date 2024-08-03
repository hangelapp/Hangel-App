import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:hangel/controllers/stk_controller.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/helpers/locator.dart';
import 'package:hangel/models/general_response_model.dart';
import 'package:hangel/models/image_model.dart';
import 'package:hangel/models/stk_form_model.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/providers/login_register_page_provider.dart';

class STKProvider with ChangeNotifier {
  final _stkController = locator<STKController>();

  List<StkModel> _stkList = [];
  List<StkModel> get stkList => _stkList;
  set stkList(List<StkModel> value) {
    _stkList = value;
    notifyListeners();
  }

  LoadingState _loadingState = LoadingState.loaded;
  LoadingState get loadingState => _loadingState;
  set loadingState(LoadingState value) {
    _loadingState = value;
    notifyListeners();
  }

  LoadingState _addSTKState = LoadingState.loaded;
  LoadingState get addSTKState => _addSTKState;
  set addSTKState(LoadingState value) {
    _addSTKState = value;
    notifyListeners();
  }

  LoadingState _deleteSTKState = LoadingState.loaded;
  LoadingState get deleteSTKState => _deleteSTKState;
  set deleteSTKState(LoadingState value) {
    _deleteSTKState = value;
    notifyListeners();
  }

  String _filterText = "";
  String get filterText => _filterText;
  set filterText(String value) {
    _filterText = value;
    notifyListeners();
  }

  String _sortText = "";
  String get sortText => _sortText;
  set sortText(String value) {
    _sortText = value;
    notifyListeners();
  }

  String _searchText = '';
  String get searchText => _searchText;
  set searchText(String value) {
    _searchText = value;
    notifyListeners();
  }

  LoadingState _sendFormState = LoadingState.loaded;
  LoadingState get sendFormState => _sendFormState;
  set sendFormState(LoadingState value) {
    _sendFormState = value;
    notifyListeners();
  }

  List<String> get stkSectors =>
      _stkList.map((e) => e.fieldOfBenefit ?? "").toList().toSet().toList();

  LoadingState _favoriteSTKState = LoadingState.loaded;
  LoadingState get favoriteSTKState => _favoriteSTKState;
  set favoriteSTKState(LoadingState value) {
    _favoriteSTKState = value;
    notifyListeners();
  }

  //getSTK
  Future getSTKs() async {
    if (stkList.isNotEmpty) {
      return;
    }
    _loadingState = LoadingState.loading;
    notifyListeners();
    _stkList = await _stkController.getSTKs();
    _loadingState = LoadingState.loaded;
    notifyListeners();
  }

  //addSTK
  Future<GeneralResponseModel> addSTK(StkModel stkModel) async {
    _addSTKState = LoadingState.loading;
    notifyListeners();
    final response = await _stkController.addSTK(stkModel);
    _addSTKState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  //updateSTK
  Future<GeneralResponseModel> updateSTK(StkModel stkModel) async {
    _addSTKState = LoadingState.loading;
    notifyListeners();
    final response = await _stkController.updateSTK(stkModel);
    _addSTKState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  //deleteSTK
  Future<GeneralResponseModel> deleteSTK(String id) async {
    _deleteSTKState = LoadingState.loading;
    notifyListeners();
    final response = await _stkController.deleteSTK(id);
    _deleteSTKState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  void sortSTK(String value) {
    _sortText = value;
    for (var element in _stkList) {
      print(element.toJson().toString());
    }
    switch (value) {
      case "A-Z":
        _stkList.sort((a, b) => a.name!.compareTo(b.name!));
        break;
      case "Z-A":
        _stkList.sort((a, b) => b.name!.compareTo(a.name!));
        break;
      case "enYenidenEnEskiye":
        _stkList.sort((a, b) => a.creationDate!.compareTo(b.creationDate!));
        break;
      case "enEskidenEnYeniye":
        _stkList.sort((a, b) => (b.creationDate ?? DateTime(2020))
            .compareTo(a.creationDate ?? DateTime(2020)));
        break;

      default:
    }
    notifyListeners();
  }

  Future<GeneralResponseModel> sendForm(
      {required STKFormModel stkFormModel,
      required List<ImageModel?> logoImage,
      required List<ImageModel?> bannerImage,
      required PlatformFile? tuzukPDF,
      required List<ImageModel?> faaliyetImage}) async {
    _sendFormState = LoadingState.loading;
    notifyListeners();
    final response = await _stkController.sendForm(
      stkFormModel: stkFormModel,
      logoImage: logoImage,
      bannerImage: bannerImage,
      tuzukPDF: tuzukPDF,
      faaliyetImage: faaliyetImage,
    );
    _sendFormState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  Future<GeneralResponseModel> addRemoveFavoriteSTK(String? id) {
    if (id == null) {
      return Future.value(GeneralResponseModel(
        success: false,
        message: "STK id bulunamadı",
      ));
    }
    UserModel userModel = HiveHelpers.getUserFromHive();
    UserModel newModel = userModel;
    if (userModel.favoriteStks.contains(id)) {
      newModel.favoriteStks.remove(id);
    } else {
      newModel.favoriteStks = [...newModel.favoriteStks,id];
      
    }
    HiveHelpers.addUserToHive(newModel);

    return _stkController.addRemoveFavoriteSTK(id);
  }
}
