import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
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
      final Reference ref;
      if (kIsWeb) {
        ref =
            FirebaseStorage.instance.refFromURL("gs://hangel-1.appspot.com").child(path).child(fileName);
      } else {
        ref = FirebaseStorage.instance.ref().child(path).child(fileName);
      }
      final uploadTask = ref.putData(fileBytes);
      final snapshot = await uploadTask.whenComplete(() => null);
      final downloadUrl = await snapshot.ref.getDownloadURL();
      return downloadUrl;
    } catch (e) {
      print("Error uploading image: $e");
      rethrow; // Rethrow the exception to handle it in the calling code
    }
  }

  // Yeni eklenen: Dosyaları (örneğin PDF) yüklemek için genel bir metod
  Future<String> uploadFile(String path, PlatformFile file) async {
    try {
      final fileName = file.name;
      final ref = _firebaseStorage.ref().child(path).child(fileName);
      final uploadTask = ref.putData(
        file.bytes!,
        SettableMetadata(contentType: _getContentType(file.extension)),
      );
      final snapshot = await uploadTask.whenComplete(() => null);
      final downloadUrl = await snapshot.ref.getDownloadURL();
      return downloadUrl;
    } catch (e) {
      print("Error uploading file: $e");
      rethrow;
    }
  }

  // Dosyanın Content-Type'ını belirlemek için yardımcı metod
  String _getContentType(String? extension) {
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  }
}
