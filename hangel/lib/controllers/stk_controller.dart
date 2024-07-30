import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/helpers/locator.dart';
import 'package:hangel/helpers/send_mail_helper.dart';
import 'package:hangel/models/general_response_model.dart';
import 'package:hangel/models/image_model.dart';
import 'package:hangel/models/stk_form_model.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/services/firestore_services.dart';
import 'package:hangel/services/storage_service.dart';

class STKController {
  final _firestoreService = locator<FirestoreServices>();
  final _storageService = locator<StorageServices>();
  final _stksPath = 'stklar';
  final _stksFormPath = 'stkForm';

  Future<GeneralResponseModel> addSTK(StkModel stkModel) async {
    try {
      String id = await _firestoreService.addData(_stksPath, stkModel.toJson());
      await _firestoreService.updateData(_stksPath + id, {
        'id': id,
      });
      return GeneralResponseModel(
        success: true,
        message: "STK added successfully",
      );
    } catch (e) {
      print(e);
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }

  Future<GeneralResponseModel> updateSTK(StkModel stkModel) async {
    try {
      await _firestoreService.updateData(_stksPath, stkModel.toJson());
      return GeneralResponseModel(
        success: true,
        message: "STK updated successfully",
      );
    } catch (e) {
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }

  Future<GeneralResponseModel> deleteSTK(String id) async {
    try {
      await _firestoreService.deleteData(_stksPath + id);
      return GeneralResponseModel(
        success: true,
        message: "STK deleted successfully",
      );
    } catch (e) {
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }

  Future<List<StkModel>> getSTKs() async {
    List stkList = await _firestoreService.getData(_stksPath);
    return stkList.map((e) {
      StkModel model = StkModel.fromJson(e.data() as Map<String, dynamic>);
      model.id = e.id;
      return model;
    }).toList();
  }

  Future<GeneralResponseModel> sendForm(
      {required STKFormModel stkFormModel,
      required List<ImageModel?> logoImage,
      required List<ImageModel?> bannerImage,
      required PlatformFile? tuzukPDF,
      required List<ImageModel?> faaliyetImage}) async {
    try {
      //add stk form and get id
      final stkFormId =
          await _firestoreService.addData(_stksFormPath, stkFormModel.toJson());

      //then add images to firebase storage and get urls and update stk
      //form with urls
      final logoImageUrl = await _storageService.uploadImage(
        "$_stksFormPath/$stkFormId",
        File(logoImage.first!.file!.path),
      );

      final bannerImageUrl = await _storageService.uploadImage(
        "$_stksFormPath/$stkFormId",
        File(bannerImage.first!.file!.path),
      );

      final tuzukPDFUrl = await _storageService.uploadImage(
        "$_stksFormPath/$stkFormId",
        File(tuzukPDF!.path!),
      );

      final faaliyetImageUrl = await _storageService.uploadImage(
        "$_stksFormPath/$stkFormId",
        File(faaliyetImage.first!.file!.path),
      );
      stkFormModel.logoImage = logoImageUrl;
      stkFormModel.bannerImage = bannerImageUrl;
      stkFormModel.tuzukPDF = tuzukPDFUrl;
      stkFormModel.faaliyetImage = faaliyetImageUrl;
      SendMailHelper.sendMail(
        to: ["mykynk1@gmail.com","ihadiguzel@gmail.com"],
        subject: "STK Başvurusu",
        body: "STK Başvurusu",
        html: stkFormModel.toHTMLTable(),
      );
      return await _firestoreService.updateData(
        "$_stksFormPath/$stkFormId",
        {
          "logoImage": logoImageUrl,
          "bannerImage": bannerImageUrl,
          "tuzukPDF": tuzukPDFUrl,
          "faaliyetImage": faaliyetImageUrl,
        },
      );
    } catch (e) {
      print(e);
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }

  Future<GeneralResponseModel> addRemoveFavoriteSTK(
    String id,
  ) async {
    try {
      String userId = HiveHelpers.getUid();
      UserModel userModel = HiveHelpers.getUserFromHive();

      await _firestoreService.updateData("users/$userId", {
        'favoriteStks': userModel.favoriteStks,
      });
      return GeneralResponseModel(
        success: true,
        message: "Brand added successfully",
      );
    } catch (e) {
      print("addRemoveFavoriteStks : " + e.toString());
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }
}
