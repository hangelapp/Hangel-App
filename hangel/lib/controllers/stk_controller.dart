import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
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
    List<StkModel> stks = [];
    stkList.forEach((e) {
      StkModel model = StkModel.fromJson(e.data() as Map<String, dynamic>);
      if (model.isActive == true) {
        model.id = e.id;
        stks = [...stks, model];
      }
    });
    return stks;
  }

  Future<List<StkModel>> getFavoriteSTKs(List<String> favoriteIds) async {
    // 'stklar' koleksiyonundan, 'id' alanı 'favoriteIds' listesinde yer alan kayıtları alıyoruz.
    QuerySnapshot snapshot =
        await FirebaseFirestore.instance.collection("stklar").where("id", whereIn: favoriteIds).get();
    List<StkModel> stks = [];
    // Sorgu sonucunu StkModel listesine dönüştürüyoruz.
    snapshot.docs.forEach((doc) {
      stks.add(StkModel.fromJson(doc.data() as Map<String, dynamic>));
    });
    return stks;
  }

  Future<GeneralResponseModel> sendForm(
      {required STKFormModel stkFormModel,
      required List<ImageModel?> logoImage,
      required PlatformFile? tuzukPDF,
      required PlatformFile? faaliyetImage}) async {
    try {
      //add stk form and get id
      final stkFormId = await _firestoreService.addData(_stksFormPath, stkFormModel.toJson());

      //then add images to firebase storage and get urls and update stk
      //form with urls
      final logoImageUrl = await _storageService.uploadImagebyByte(
        "$_stksFormPath/$stkFormId",
        await logoImage.first!.file!.readAsBytes(),
      );

      final tuzukPDFUrl = await _storageService.uploadImagebyByte(
        "$_stksFormPath/$stkFormId",
        tuzukPDF?.bytes ?? Uint8List(0),
      );

      final faaliyetImageUrl = await _storageService.uploadImagebyByte(
        "$_stksFormPath/$stkFormId",
        faaliyetImage?.bytes ?? Uint8List(0),
      );
      stkFormModel.logoImage = logoImageUrl;
      stkFormModel.tuzukPDF = tuzukPDFUrl;
      stkFormModel.faaliyetImage = faaliyetImageUrl;
      await SendMailHelper.sendMail(
        to: ["turkiye@hangel.org"],
        subject: "STK Başvurusu",
        body: "STK Başvurusu",
        html: stkFormModel.toHTMLTable(),
      );
      await _firestoreService.addData("forms", {
        "subject": "STK Başvurusu",
        "status": "active",
        //
        "form": stkFormModel.toJson(),
      });
      return await _firestoreService.updateData(
        "$_stksFormPath/$stkFormId",
        {
          "logoImage": logoImageUrl,
          "tuzukPDF": tuzukPDFUrl,
          "faaliyetImage": faaliyetImageUrl,
        },
      );
    } catch (e) {
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }

  Future<GeneralResponseModel> addRemoveFavoriteSTK() async {
    try {
      String userId = HiveHelpers.getUid();
      UserModel userModel = HiveHelpers.getUserFromHive();

      await _firestoreService.updateData("users/$userId", {
        'favoriteAddedDate': userModel.favoriteAddedDate,
        'favoriteStks': userModel.favoriteStks,
      });
      print("UPDATE RESPONSE: ");
      // print(response);
      return GeneralResponseModel(
        success: true,
        message: "Brand added successfully",
      );
    } catch (e) {
      print("addRemoveFavoriteStks Error : " + e.toString());
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }
}
