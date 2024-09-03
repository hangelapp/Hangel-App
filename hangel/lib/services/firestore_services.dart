import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/general_response_model.dart';
import '../models/user_model.dart';
import '../models/where_model.dart';

class FirestoreServices {
  final _firestore = FirebaseFirestore.instance;

  //Döküman ya da koleksiyon referansı döndürür
  getRef(String path) {
    List pathList = path.split("/");
    print("Path List : $pathList");
    var ref;

    for (int i = 0; i < pathList.length; i++) {
      if (pathList[i] == "") {
        pathList.removeAt(i);
      }
      if (i == 0) {
        ref = _firestore.collection(pathList[i]);
      } else if (i % 2 == 0) {
        ref = ref.collection(pathList[i]);
      } else {
        ref = ref.doc(pathList[i]);
      }
    }

    return ref;
  }

  Future<GeneralResponseModel> addUser(UserModel userModel) async {
    try {
      await _firestore.collection("users").doc(userModel.uid).set(userModel.toJson());
      return GeneralResponseModel(
        success: true,
        message: "User added successfully",
      );
    } catch (e) {
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }

  Future<GeneralResponseModel> setData(Map<String, dynamic> json, String path) async {
    try {
      await getRef(path).set(json);
      return GeneralResponseModel(
        success: true,
        message: "Bilgiler eklendi!",
      );
    } catch (e) {
      print("Set Data Error : $e");
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }

  Future<List<QueryDocumentSnapshot>> getData(String path, {List<WhereModel>? wheres}) async {
    try {
      if (wheres != null && wheres.isNotEmpty) {
        var collection = getRef(path);
        var query = getWhere(
          wheres.first,
          collection,
        );

        wheres.removeAt(0);
        for (var where in wheres) {
          query = getWhere(where, query);
        }
        var data = await query.get();

        return data.docs;
      } else {
        var data = await getRef(path).get();
        return data.docs;
      }
    } catch (e) {
      print("Get Data Error $path : $e");
      return [];
    }
  }

  getWhere(
    WhereModel whereModel,
    var query,
  ) {
    query = query.where(
      whereModel.field,
      arrayContains: whereModel.arrayContains,
      arrayContainsAny: whereModel.arrayContainsAny,
      isEqualTo: whereModel.isEqualTo,
      isGreaterThan: whereModel.isGreaterThan,
      isGreaterThanOrEqualTo: whereModel.isGreaterThanOrEqualTo,
      isLessThan: whereModel.isLessThan,
      isLessThanOrEqualTo: whereModel.isLessThanOrEqualTo,
      isNull: whereModel.isNull,
      isNotEqualTo: whereModel.isNotEqualTo,
      whereIn: whereModel.whereIn,
      whereNotIn: whereModel.whereNotIn,
    );

    return query;
  }

  Future<GeneralResponseModel> updateData(String path, Map<String, dynamic> map) async {
    try {
      // Firestore'da doküman mı yoksa koleksiyon mu olduğunu kontrol ediyorsun.
      if (isDoc(path)) {
        // Doküman güncelleme (sadece mevcut alanları günceller).
        await getRef(path).set(map, SetOptions(merge: true)); // Merge seçeneği ile güncellemeyi yap
      } else {
        // Koleksiyon güncelleme (mevcut ve yeni alanları ekler).
        await getRef(path).set(map, SetOptions(merge: true)); // Merge seçeneği ile yeni alanları ekler
      }
      return GeneralResponseModel(
        success: true,
        message: "Bilgiler kaydedildi!",
      );
    } catch (e) {
      if (kDebugMode) {
        print("Update Data Error : $e");
      }
      return GeneralResponseModel(
        success: false,
        message: e.toString(),
      );
    }
  }

  // Future<GeneralResponseModel> updateData(
  //     String path, Map<String, dynamic> map) async {
  //   try {
  //     if (isDoc(path)) {
  //       await getRef(path).update(map);
  //     } else {
  //       await getRef(path).set(map, SetOptions(merge: true));
  //     }
  //     return GeneralResponseModel(
  //       success: true,
  //       message: "Bilgiler güncellendi!",
  //     );
  //   } catch (e) {
  //     if (kDebugMode) {
  //       print("Update Data Error : $e");
  //     }
  //     return GeneralResponseModel(
  //       success: false,
  //       message: e.toString(),
  //     );
  //   }
  // }

  Future<String> addData(
    String path,
    Map<String, dynamic> json,
  ) async {
    try {
      //add and return id
      if (isDoc(path)) {
        var doc = await getRef(path).add(json);
        return doc.id;
      } else {
        await getRef(path).add(json);
        return "";
      }
    } catch (e) {
      if (kDebugMode) {
        print("Add Data Error : $e");
      }
      return "";
    }
  }

  isDoc(String path) {
    List pathList = path.split("/");
    if (pathList.length % 2 == 0) {
      return false;
    } else {
      return true;
    }
  }

  Future<GeneralResponseModel> deleteData(String path) {
    try {
      getRef(path).delete();
      return Future.value(
        GeneralResponseModel(
          success: true,
          message: "Silme işlemi başarılı",
        ),
      );
    } catch (e) {
      if (kDebugMode) {
        print("Delete Data Error : $e");
      }
      return Future.value(
        GeneralResponseModel(
          success: false,
          message: "Silme işlemi başarısız",
        ),
      );
    }
  }

  Future<GeneralResponseModel> deleteAccount({required String uid}) async {
    try {
      await _firestore.collection("users").doc(uid).delete();
      return GeneralResponseModel(
        success: true,
        message: "Hesap silindi",
      );
    } catch (e) {
      return GeneralResponseModel(
        success: false,
        message: "Hesap silinirken bir hata oluştu!",
      );
    }
  }
}
