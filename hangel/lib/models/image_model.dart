import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';

enum ImageType { asset, network }

class ImageModel {
  String? id;
  String? url;
  XFile? file;
  PlatformFile? platformFile;
  ImageType? imageType;

  ImageModel({
    this.id,
    this.url,
    this.file,
    this.platformFile,
    this.imageType,
  });

  //to string
  @override
  String toString() {
    return 'ImageModel{id: $id, url: $url, file: $file, imageType: $imageType}';
  }
}
