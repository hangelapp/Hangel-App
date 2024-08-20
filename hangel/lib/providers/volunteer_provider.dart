import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';

import '../helpers/locator.dart';
import '../helpers/send_mail_helper.dart';
import '../models/general_response_model.dart';
import '../models/image_model.dart';
import '../models/volunteer_model.dart';
import '../services/firestore_services.dart';
import '../services/storage_service.dart';
import 'login_register_page_provider.dart';

class VolunteerProvider with ChangeNotifier {
  final _firestoreService = locator<FirestoreServices>();
  final _storageService = locator<StorageServices>();
  final _volunteerFormPath = 'volunteerForm';

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

  Future<GeneralResponseModel> sendForm(
      {required VolunteerModel volunteerModel,
      required ImageModel image,
      required PlatformFile? cv,
      required Uint8List imageByte,
      required Uint8List cvByte}) async {
    _sendFormState = LoadingState.loading;
    notifyListeners();
    try {
      // Add form data to Firestore and get formId
      final formId = await _firestoreService.addData(_volunteerFormPath, volunteerModel.toJson());

      String? imageUrl;
      String? cvUrl;

      imageUrl = await _storageService.uploadImagebyByte(
        "$_volunteerFormPath/$formId",
        imageByte, // ImageModel for web might need adjustment
      );

      cvUrl = await _storageService.uploadImagebyByte(
        "$_volunteerFormPath/$formId",
        cvByte,
      );

      // final cvFile = io.File(cv!.path!);
      // final cvBytes = await cvFile.readAsBytes();
      // cvUrl = await _storageService.uploadImagebyByte("$_volunteerFormPath/$formId", cvBytes);
      // Handle file uploads for mobile platforms
      // imageUrl = await _storageService.uploadImage(
      //   "$_volunteerFormPath/$formId",
      //   io.File(image.file!.path),
      // );

      // Update the volunteer model with URLs
      volunteerModel.image = imageUrl;
      volunteerModel.cv = cvUrl;

      // Send email with HTML table
      SendMailHelper.sendMail(
        to: ["hangelturkiye@gmail.com"],
        // to: ["cakirg685@gmail.com"],
        subject: "Gönüllülük Başvurusu",
        body: "Gönüllülük Başvurusu",
        html: volunteerModel.toHtmlTable(),
      );

      // Update Firestore with URLs
      return await _firestoreService.updateData(
        "$_volunteerFormPath/$formId",
        {
          "image": imageUrl,
          "cv": cvUrl,
        },
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
