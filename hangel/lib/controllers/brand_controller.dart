import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/helpers/locator.dart';
import 'package:hangel/helpers/send_mail_helper.dart';
import 'package:hangel/models/brand_form_model.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/models/general_response_model.dart';
import 'package:hangel/models/image_model.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/services/firestore_services.dart';
import 'package:hangel/services/storage_service.dart';

class BrandController {
  final _firestoreService = locator<FirestoreServices>();
  final _storageService = locator<StorageServices>();
  final brandsPath = 'markalar';
  final brandFormsPath = 'markaForm';

  Future<GeneralResponseModel> addBrand(BrandModel brandModel) async {
    try {
      String id = await _firestoreService.addData(brandsPath, brandModel.toJson());
      await _firestoreService.updateData(brandsPath + id, {
        'id': id,
      });
      return GeneralResponseModel(
        success: true,
        message: "Brand added successfully",
      );
    } catch (e) {
      print(e);
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }

  Future<GeneralResponseModel> updateBrand(BrandModel brandModel) async {
    try {
      await _firestoreService.updateData(brandsPath, brandModel.toJson());
      return GeneralResponseModel(
        success: true,
        message: "Brand updated successfully",
      );
    } catch (e) {
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }

  Future<GeneralResponseModel> deleteBrand(String id) async {
    try {
      await _firestoreService.deleteData(brandsPath + id);
      return GeneralResponseModel(
        success: true,
        message: "Brand deleted successfully",
      );
    } catch (e) {
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }

  Future<List<BrandModel>> getBrands() async {
    List brandList = await _firestoreService.getData(brandsPath);
    return brandList.map((e) {
      BrandModel model = BrandModel.fromJson(e.data() as Map<String, dynamic>);
      model.id = e.id;
      return model;
    }).toList();
  }

  Future<GeneralResponseModel> sendForm(
      {required BrandFormModel brandFormModel, required List<ImageModel?> logoImage}) async {
    try {
      final formId = await _firestoreService.addData(brandFormsPath, brandFormModel.toJson());
      final logoImageUrls = await _storageService.uploadImagebyByte(
          "$brandFormsPath/$formId", await logoImage.first!.file!.readAsBytes());

      brandFormModel.logoImage = logoImageUrls;

      SendMailHelper.sendMail(
        to: ["turkiye@hangel.org"],
        subject: "Marka Başvurusu",
        body: "Marka Başvurusu",
        html: brandFormModel.toHtmlTable(),
      );
      await _firestoreService.addData("forms", {
        "subject": "Marka Başvurusu",
        "status": "active",
        "form": brandFormModel.toJson(),
      });
      return await _firestoreService.updateData(
        "$brandFormsPath/$formId",
        {
          'logoImage': logoImageUrls,
        },
      );
    } catch (e) {
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }

  Future<GeneralResponseModel> addRemoveFavoriteBrand(String id) async {
    try {
      String userId = HiveHelpers.getUid();
      UserModel userModel = HiveHelpers.getUserFromHive();

      await _firestoreService.updateData("users/$userId", {
        'favoriteBrands': userModel.favoriteBrands,
      });
      return GeneralResponseModel(
        success: true,
        message: "Brand added successfully",
      );
    } catch (e) {
      print("addRemoveFavoriteBrand : " + e.toString());
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }
}
