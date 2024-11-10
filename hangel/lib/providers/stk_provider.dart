import 'package:cloud_firestore/cloud_firestore.dart';
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

import '../helpers/send_mail_helper.dart';

class STKProvider with ChangeNotifier {
  final _stkController = locator<STKController>();

  STKProvider() {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await getSTKs();
    });
  }

  int page = 1;
  int limit = 10;

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

  String _filterTextFav = "";
  String get filterTextFav => _filterTextFav;
  set filterTextFav(String value) {
    _filterTextFav = value;
    notifyListeners();
  }

  String _sortText = "";
  String get sortText => _sortText;
  set sortText(String value) {
    _sortText = value;
    notifyListeners();
  }

  String _sortTextFav = "";
  String get sortTextFav => _sortTextFav;
  set sortTextFav(String value) {
    _sortTextFav = value;
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

  List<String> get stkSectors => _stkList.map((e) => e.fieldOfBenefit ?? "").toList().toSet().toList();

  LoadingState _favoriteSTKState = LoadingState.loaded;
  LoadingState get favoriteSTKState => _favoriteSTKState;
  set favoriteSTKState(LoadingState value) {
    _favoriteSTKState = value;
    notifyListeners();
  }

  String checkAddedTime(DateTime? addedTime) {
    if (addedTime == null) return "Kaydet";
    final now = DateTime.now();
    final difference = now.difference(addedTime).inDays;

    if (difference < 30) {
      if (difference < 29) {
        return "${30 - difference} gün sonra güncellenebilir...";
      } else {
        return "1 günden az kaldı...";
      }
    } else {
      return "Kaydet";
    }
  }

  void nextPage() {
    page++;
    notifyListeners();
  }

  //getSTKById
  Future<StkModel?> getSTKById(String id) async {
    _loadingState = LoadingState.loading;
    notifyListeners();

    try {
      var firestore = FirebaseFirestore.instance;

      // Query to get the specific STK by ID
      var docSnapshot = await firestore.collection("stklar").where("id", isEqualTo: id).limit(1).get();

      if (docSnapshot.docs.isNotEmpty) {
        // If the document exists, convert it to STKModel
        StkModel stkModel = StkModel.fromJson(docSnapshot.docs.first.data());

        _loadingState = LoadingState.loaded;
        notifyListeners();
        return stkModel;
      } else {
        // If no such document exists, return null
        _loadingState = LoadingState.error;
        notifyListeners();
        return null;
      }
    } catch (e) {
      // Handle errors
      print("Error fetching STK by ID: $e");
      _loadingState = LoadingState.error;
      notifyListeners();
      return null;
    }
  }

  //getSTK
  Future getSTKs() async {
    var firestore = FirebaseFirestore.instance;

    // Calculate the starting index for pagination
    int startAtIndex = (page - 1) * limit;

    // Query to fetch paginated data
    var query = firestore
        .collection("stklar")
        .where("isActive", isEqualTo: true)
        .orderBy("creationDate") // Ensure that you are ordering by a field
        .startAt([startAtIndex]) // Start at the calculated index
        .limit(limit) // Limit the number of results
        .snapshots();

    _loadingState = LoadingState.loading;
    notifyListeners();

    try {
      // Fetch the data
      var querySnapshot = await query.first; // .first is used to get the first result of the snapshot

      // Process the results
      List<StkModel> fetchedStkList = querySnapshot.docs.map((doc) {
        return StkModel.fromJson(doc.data());
      }).toList();

      stkList.clear();
      // Add the results to the list
      stkList.addAll(fetchedStkList);

      _loadingState = LoadingState.loaded;
      notifyListeners();
    } catch (e) {
      // Handle errors here
      print("Error fetching STKs: $e");
      _loadingState = LoadingState.error;
      notifyListeners();
    }
  }

  Future<List<StkModel>> getFavoriteSTKs() async {
    if (HiveHelpers.getUserFromHive().favoriteStks.isEmpty) {
      return [];
    }
    List<StkModel> tempData = [];
    _loadingState = LoadingState.loading;
    notifyListeners();
    tempData = await _stkController.getFavoriteSTKs(HiveHelpers.getUserFromHive().favoriteStks);
    _loadingState = LoadingState.loaded;
    notifyListeners();
    return tempData;
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
        _stkList.sort((a, b) => (b.creationDate ?? DateTime(2020)).compareTo(a.creationDate ?? DateTime(2020)));
        break;

      default:
    }
    notifyListeners();
  }

  Future<GeneralResponseModel>  sendForm(
    STKFormModel stkFormModel, {
    ImageModel? logoImage,
    PlatformFile? statuteFile,
    PlatformFile? activityCertificateFile,
    ImageModel? photoImage,
    PlatformFile? governoratePermissionDocument,
    PlatformFile? stkIlMudurluguYetkiBelgesi,
  }) async {
    _sendFormState = LoadingState.loading;
    notifyListeners();

    // Form verilerini ve dosyaları STKController'a gönderiyoruz
    final response = await _stkController.sendForm(
      stkFormModel: stkFormModel,
      logoImage: logoImage,
      statuteFile: statuteFile,
      activityCertificateFile: activityCertificateFile,
      photoImage: photoImage,
      governoratePermissionDocument: governoratePermissionDocument,
      stkIlMudurluguYetkiBelgesi: stkIlMudurluguYetkiBelgesi,
    );

    // Başvuruyu yapan kişiye ve STK email adresine bilgi maili gönderiyoruz
    List<String> emails = [];
    stkFormModel.email != "" ? emails.add(stkFormModel.email!) : null;
    stkFormModel.applicantEmail != "" ? emails.add(stkFormModel.applicantEmail!) : null;
    await SendMailHelper.sendMail(
      to: emails,
      subject: "STK Başvurusu",
      body: "STK Başvurusu",
      html: '''
<!DOCTYPE html>
<html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@800&display=swap');
      .logo {
        font-family: 'Poppins', sans-serif;
        font-weight: 800;
        color: #DC4D01;
        font-size: 24px;
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <div style="text-align: center;">
      <div class="logo">hangel</div>
      <h2>Başvurunuzu aldık, en kısa sürede sizinle iletişime geçeceğiz.</h2>
    </div>
  </body>
</html>
    ''',
    );

    _sendFormState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  Future<GeneralResponseModel> addRemoveFavoriteSTK(List<String>? updatedFavoriteStks) async {
    if (updatedFavoriteStks == null) {
      print("STK id bulunamadı");
      return Future.value(GeneralResponseModel(
        success: false,
        message: "STK id bulunamadı",
      ));
    }
    if (updatedFavoriteStks.length > 2) {
      return Future.value(GeneralResponseModel(
        success: false,
        message: "En fazla 2 STK seçilebilir",
      ));
    } else if (updatedFavoriteStks.isEmpty) {
      return Future.value(GeneralResponseModel(
        success: false,
        message: "En az 1 STK seçilmelidir",
      ));
    }
    //Local kullanıcıyı al
    UserModel userModel = HiveHelpers.getUserFromHive();
    //Kopyasını oluştur
    UserModel newModel = userModel;
    //Kopyalananda STK'ları güncelle
    newModel.favoriteStks = updatedFavoriteStks;
    //Favori ekleme günü
    newModel.favoriteAddedDate = DateTime.now();
    //Uygulama geneline bu değişiklikten haber ver
    HiveHelpers.addUserToHive(newModel);
    //Database'de bu güncellemeyi yap.
    var response = await _stkController.addRemoveFavoriteSTK();
    return response;
  }
}
