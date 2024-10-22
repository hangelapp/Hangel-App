// lib/providers/volunteer_provider.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/models/volunteer_model.dart'; // Güncellenmiş model
import '../helpers/locator.dart';
import '../helpers/send_mail_helper.dart';
import '../models/general_response_model.dart';
import '../models/image_model.dart';
import '../services/firestore_services.dart';
import '../services/storage_service.dart';
import 'login_register_page_provider.dart';

class VolunteerProvider with ChangeNotifier {
  final _firestoreService = locator<FirestoreServices>();
  final _storageService = locator<StorageServices>();
  final _volunteerFormPath = 'volunteerForm';
  List<StkModel> stkVolunteers = [];
  List<StkModel> tempStks = [
    StkModel(
      categories: List.generate(3, (index) => "Deneme"),
    ),
    StkModel(
      categories: List.generate(3, (index) => "Deneme"),
    ),
  ];

  Future<List<StkModel>> getStks() async {
    List<StkModel> stks = [];
    var instance = FirebaseFirestore.instance;
    var data = await instance.collection("stkVolunteers").get();
    data.docs.forEach((e) {
      stks.add(StkModel.fromJson(e.data()));
    });
    return stks;
  }

  LoadingState _loadingState = LoadingState.loaded;
  LoadingState get loadingState => _loadingState;
  set loadingState(LoadingState value) {
    _loadingState = value;
    notifyListeners();
  }

  LoadingState _sendFormState = LoadingState.loaded;
  LoadingState get sendFormState => _sendFormState;
  set sendFormState(LoadingState value) {
    _sendFormState = value;
    notifyListeners();
  }

  Future<GeneralResponseModel> sendForm({
    required VolunteerModel volunteerModel,
    ImageModel? image, // Opsiyonel
    PlatformFile? cv, // Opsiyonel
    Uint8List? imageByte, // Opsiyonel
    Uint8List? cvByte, // Opsiyonel
  }) async {
    _sendFormState = LoadingState.loading;
    notifyListeners();
    try {
      // Add form data to Firestore and get formId
      final formId = await _firestoreService.addData(_volunteerFormPath, volunteerModel.toJson());

      // Send email with HTML table
      SendMailHelper.sendMail(
        to: ["turkiye@hangel.org"],
        subject: "Gönüllülük Başvurusu",
        body: "Gönüllülük Başvurusu",
        html: volunteerModel.toHtmlTable(),
      );

      await _firestoreService.addData("forms", {
        "subject": "Gönüllülük Başvurusu",
        "status": "waiting",
        "form": volunteerModel.toJson(),
      });
      return GeneralResponseModel(
        success: true,
        message: "Gönüllülük başvurusu gönderildi.",
      );
    } catch (e) {
      print("HATA " + e.toString());
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    } finally {
      _sendFormState = LoadingState.loaded;
      notifyListeners();
    }
  }
}
