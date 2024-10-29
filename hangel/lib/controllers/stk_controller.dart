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

  Future<GeneralResponseModel> sendForm({
    required STKFormModel stkFormModel,
    ImageModel? logoImage,
    PlatformFile? statuteFile,
    PlatformFile? activityCertificateFile,
    ImageModel? photoImage,
    PlatformFile? governoratePermissionDocument,
    PlatformFile? stkIlMudurluguYetkiBelgesi,
  }) async {
    try {
      // İlk olarak, STK formunu Firestore'a ekliyoruz ve belge ID'sini alıyoruz
      final stkFormId = await _firestoreService.addData(
        _stksFormPath,
        stkFormModel.toJson(),
      );

      // Firebase Storage'a dosyaları yüklüyoruz ve URL'lerini alıyoruz
      // 1. Logo resmi
      if (logoImage != null && logoImage.file != null) {
        final logoImageUrl = await _storageService.uploadImagebyByte(
          "$_stksFormPath/$stkFormId/logo",
          await logoImage.file!.readAsBytes(),
        );
        stkFormModel.logoImage = logoImageUrl;
      }

      // 2. Tüzük PDF
      if (statuteFile != null) {
        final statuteFileUrl = await _storageService.uploadFile(
          "$_stksFormPath/$stkFormId/statute",
          statuteFile,
        );
        stkFormModel.statuteFileUrl = statuteFileUrl;
      }

      // 3. Faaliyet Belgesi
      if (activityCertificateFile != null) {
        final activityCertificateFileUrl = await _storageService.uploadFile(
          "$_stksFormPath/$stkFormId/activity_certificate",
          activityCertificateFile,
        );
        stkFormModel.activityCertificateFileUrl = activityCertificateFileUrl;
      }

      // 4. Fotoğraf (Özel izinli yardım toplayan için)
      if (photoImage != null && photoImage.file != null) {
        final photoImageUrl = await _storageService.uploadImagebyByte(
          "$_stksFormPath/$stkFormId/photo",
          await photoImage.file!.readAsBytes(),
        );
        stkFormModel.photoImageUrl = photoImageUrl;
      }

      // 5. Valilik İzin Belgesi
      if (governoratePermissionDocument != null) {
        final governoratePermissionDocumentUrl = await _storageService.uploadFile(
          "$_stksFormPath/$stkFormId/governorate_permission_document",
          governoratePermissionDocument,
        );
        stkFormModel.governoratePermissionDocumentUrl = governoratePermissionDocumentUrl;
      }

      // 6. STK İl Müdürlüğü Yetki Belgesi
      if (stkIlMudurluguYetkiBelgesi != null) {
        final stkIlMudurluguYetkiBelgesiUrl = await _storageService.uploadFile(
          "$_stksFormPath/$stkFormId/stk_il_mudurlugu_yetki_belgesi",
          stkIlMudurluguYetkiBelgesi,
        );
        stkFormModel.stkIlMudurluguYetkiBelgesiUrl = stkIlMudurluguYetkiBelgesiUrl;
      }

      // Dosyaların URL'lerini içeren güncellenmiş STK formunu Firestore'da güncelliyoruz
      await _firestoreService.updateData(
        "$_stksFormPath/$stkFormId",
        stkFormModel.toJson(),
      );

      // Admin email adresine başvuru detaylarını gönderiyoruz
      await SendMailHelper.sendMail(
        to: ["turkiye@hangel.org"], // Admin email adresi
        subject: "Yeni STK Başvurusu",
        body: "Yeni STK Başvurusu",
        html: stkFormModel.toHTMLTable(),
      );

      // Başvuru formunu genel "forms" koleksiyonuna ekliyoruz
      await _firestoreService.addData("forms", {
        "subject": "STK Başvurusu",
        "status": "active",
        "form": stkFormModel.toJson(),
      });

      return GeneralResponseModel(
        success: true,
        message: "Başvuru başarıyla gönderildi.",
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
