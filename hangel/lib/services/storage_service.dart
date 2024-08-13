import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/services.dart';
import 'package:uuid/uuid.dart';
// import 'package:image_picker/image_picker.dart';

class StorageServices {
  final _firebaseStorage = FirebaseStorage.instance;

  // Future<List<String>> uploadImages(String path, List<XFile> files) async {
  //   final List<String> imageUrls = [];
  //   for (var file in files) {
  //     final ref =
  //         _firebaseStorage.ref().child(path).child(file.path.split('/').last);
  //     final uploadTask = ref.putFile(File(file.path));
  //     final snapshot = await uploadTask.whenComplete(() => null);
  //     final downloadUrl = await snapshot.ref.getDownloadURL();
  //     imageUrls.add(downloadUrl);
  //   }
  //   return imageUrls;
  // }

  Future<String> uploadImage(String path, File file) async {
    final ref = _firebaseStorage.ref().child(path).child(file.path.split('/').last);
    final uploadTask = ref.putFile(file);
    final snapshot = await uploadTask.whenComplete(() => null);
    final downloadUrl = await snapshot.ref.getDownloadURL();
    return downloadUrl;
  }

  Future<String> uploadImagebyByte(String path, Uint8List fileBytes) async {
    try {
      final fileName = const Uuid().v4();
      final ref = FirebaseStorage.instance.ref().child(path).child(fileName);
      final uploadTask = ref.putData(fileBytes);
      final snapshot = await uploadTask.whenComplete(() => null);
      final downloadUrl = await snapshot.ref.getDownloadURL();
      return downloadUrl;
    } catch (e) {
      print("Error uploading image: $e");
      rethrow; // Rethrow the exception to handle it in the calling code
    }
  }
}
