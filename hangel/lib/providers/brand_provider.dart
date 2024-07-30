import 'package:flutter/material.dart';
import 'package:hangel/controllers/brand_controller.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/helpers/locator.dart';

import 'package:hangel/models/brand_form_model.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/models/general_response_model.dart';
import 'package:hangel/models/image_model.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/providers/login_register_page_provider.dart';

class BrandProvider with ChangeNotifier {
  final _brandController = locator<BrandController>();

  List<BrandModel> _brandList = [];
  List<BrandModel> get brandList => _brandList;
  set brandList(List<BrandModel> value) {
    _brandList = value;
    notifyListeners();
  }

  LoadingState _loadingState = LoadingState.loaded;
  LoadingState get loadingState => _loadingState;
  set loadingState(LoadingState value) {
    _loadingState = value;
    notifyListeners();
  }

  LoadingState _addBrandState = LoadingState.loaded;
  LoadingState get addBrandState => _addBrandState;
  set addBrandState(LoadingState value) {
    _addBrandState = value;
    notifyListeners();
  }

  LoadingState _deleteBrandState = LoadingState.loaded;
  LoadingState get deleteBrandState => _deleteBrandState;
  set deleteBrandState(LoadingState value) {
    _deleteBrandState = value;
    notifyListeners();
  }

  String _searchText = '';
  String get searchText => _searchText;
  set searchText(String value) {
    _searchText = value;
    notifyListeners();
  }

  List<String> get brandSectors =>
      _brandList.map((e) => e.sector ?? "").toList().toSet().toList();

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

  LoadingState _sendFormState = LoadingState.loaded;
  LoadingState get sendFormState => _sendFormState;
  set sendFormState(LoadingState value) {
    _sendFormState = value;
    notifyListeners();
  }

  String _selectedSTKID = "";
  String get selectedSTKID => _selectedSTKID;
  set selectedSTKID(String value) {
    _selectedSTKID = value;
    notifyListeners();
  }

  //getBrand
  Future getBrands() async {
    if (_brandList.isNotEmpty) {
      return;
    }
    _loadingState = LoadingState.loading;
    notifyListeners();
    _brandList = await _brandController.getBrands();
    _loadingState = LoadingState.loaded;
    notifyListeners();
  }

  //addBrand
  Future<GeneralResponseModel> addBrand(BrandModel brandModel) async {
    _addBrandState = LoadingState.loading;
    notifyListeners();
    final response = await _brandController.addBrand(brandModel);

    _addBrandState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  //updateBrand
  Future<GeneralResponseModel> updateBrand(BrandModel brandModel) async {
    _addBrandState = LoadingState.loading;
    notifyListeners();
    final response = await _brandController.updateBrand(brandModel);
    _addBrandState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  //deleteBrand
  Future<GeneralResponseModel> deleteBrand(String id) async {
    _deleteBrandState = LoadingState.loading;
    notifyListeners();
    final response = await _brandController.deleteBrand(id);
    _deleteBrandState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  void sortBrands(String value) {
    _sortText = value;
    switch (value) {
      case "A-Z":
        _brandList.sort((a, b) => a.name!.compareTo(b.name!));
        break;
      case "Z-A":
        _brandList.sort((a, b) => b.name!.compareTo(a.name!));
        break;
      case "enYenidenEnEskiye":
        _brandList.sort((a, b) => a.creationDate!.compareTo(b.creationDate!));
        break;
      case "enEskidenEnYeniye":
        _brandList.sort((a, b) => b.creationDate!.compareTo(a.creationDate!));
        break;
      case "bagisOraniYuksektenDusuge":
        _brandList.sort((a, b) => b.donationRate!.compareTo(a.donationRate!));
        break;
      case "bagisOraniDusuktenYuksege":
        _brandList.sort((a, b) => a.donationRate!.compareTo(b.donationRate!));
        break;

      default:
    }
    notifyListeners();
  }

  Future<GeneralResponseModel> sendForm(BrandFormModel brandFormModel,
      {required List<ImageModel?> logoImage,
      required List<ImageModel?> bannerImage,
      required List<ImageModel?> vergiImage}) async {
    _sendFormState = LoadingState.loading;
    notifyListeners();
    final response = await _brandController.sendForm(
      brandFormModel: brandFormModel,
      logoImage: logoImage,
      bannerImage: bannerImage,
      vergiImage: vergiImage,
    );

    _sendFormState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  Future<GeneralResponseModel> addRemoveFavoriteBrand(String id) async {
    UserModel userModel = HiveHelpers.getUserFromHive();
    if (userModel.favoriteBrands.contains(id) == false) {
      userModel.favoriteBrands.add(id);
    } else {
      userModel.favoriteBrands.remove(id);
    }

    HiveHelpers.addUserToHive(userModel);
    final response = await _brandController.addRemoveFavoriteBrand(id);
    return response;
  }
}
