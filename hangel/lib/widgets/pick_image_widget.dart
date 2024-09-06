import 'dart:io';

import '../models/image_model.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/material.dart';
import '../constants/app_theme.dart';
import '../constants/size.dart';
import '../views/utilities.dart';
import '../widgets/toast_widgets.dart';

class PickImageWidget extends StatefulWidget {
  const PickImageWidget(
    BuildContext context, {
    Key? key,
    required this.title,
    required this.onImagePicked,
    required this.onImageRemoved,
    this.isRequired = false,
    // this.formType = FormType.add,
    this.selectedImages = const [],
    this.imageURL = "",
    this.isSelectOnlyOne = false,
    this.widgetSize = 80,
    this.infoText = "",
  }) : super(key: key);
  final String title;
  final Function onImagePicked;
  final Function onImageRemoved;
  final List<ImageModel?> selectedImages;
  final String imageURL;
  final bool isSelectOnlyOne;
  final double widgetSize;
  // final FormType formType;
  final bool isRequired;
  final String infoText;

  @override
  State<PickImageWidget> createState() => _PickImageWidgetState();
}

class _PickImageWidgetState extends State<PickImageWidget> {
  bool isImagePicked = false;
  Uint8List imageData = Uint8List(0);
  @override
  void initState() {
    super.initState();
    Future.delayed(
      Duration.zero,
      () async {
        imageData = await assetToUint8List('assets/images/correctImage.png');
        setState(() {});
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // widget.formType == FormType.add ||
    isImagePicked = widget.imageURL.isEmpty ? widget.selectedImages.isNotEmpty : widget.imageURL.isNotEmpty;
    return Column(
      children: [
        Row(
          children: [
            Text(
              widget.title,
              style: AppTheme.semiBoldTextStyle(context, 16),
            ),
            if (widget.isRequired)
              Text(
                " *",
                style: AppTheme.semiBoldTextStyle(context, 16, color: AppTheme.red),
              ),
          ],
        ),
        SizedBox(
          height: deviceHeightSize(context, 10),
        ),
        SizedBox(
          width: deviceWidth(context),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (!(widget.isSelectOnlyOne && widget.selectedImages.isNotEmpty)) addImageButton(context),
                SizedBox(width: deviceWidthSize(context, 10)),
                ...List.generate(
                  widget.selectedImages.length,
                  (index) => imageContainer(context, index, imageData),
                ),
              ],
            ),
          ),
        ),
        if (widget.infoText.isNotEmpty)
          Padding(
            padding: EdgeInsets.only(
              top: deviceHeightSize(context, 8),
            ),
            child: Text(
              widget.infoText,
              style: AppTheme.lightTextStyle(context, 14),
            ),
          ),
        SizedBox(height: deviceHeightSize(context, 16)),
      ],
    );
  }

  void pickImage(BuildContext context) async {
    try {
      if (widget.isSelectOnlyOne) {
        if (kIsWeb) {
          // Web için dosya seçimi
          FilePickerResult? result = await FilePicker.platform.pickFiles(
            type: FileType.custom,
            allowedExtensions: ['jpg', 'png', 'jpeg'],
          );
          if (result != null && result.files.isNotEmpty) {
            final file = result.files.first;
            final XFile xFile = XFile.fromData(
              file.bytes!,
              name: file.name,
              mimeType: file.extension,
            );
            widget.onImagePicked.call([xFile]);
          } else {
            ToastWidgets.errorToast(context, "Görsel seçilmedi.");
          }
        } else {
          // Mobil için dosya seçimi
          final XFile? pickedFile = await ImagePicker().pickImage(
            imageQuality: 50,
            source: ImageSource.gallery,
          );
          if (pickedFile != null) {
            widget.onImagePicked.call([pickedFile]);
          } else {
            ToastWidgets.errorToast(context, "Görsel seçilmedi.");
          }
        }
      } else {
        if (kIsWeb) {
          // Web için birden fazla dosya seçimi
          FilePickerResult? result = await FilePicker.platform.pickFiles(
            type: FileType.custom,
            allowedExtensions: ['jpg', 'png', 'jpeg'],
            allowMultiple: true,
          );
          if (result != null && result.files.isNotEmpty) {
            final List<XFile> xFiles = result.files
                .map((file) => XFile.fromData(
                      file.bytes!,
                      name: file.name,
                      mimeType: file.extension,
                    ))
                .toList();
            widget.onImagePicked.call(xFiles);
          } else {
            ToastWidgets.errorToast(context, "Görsel seçilmedi.");
          }
        } else {
          // Mobil için birden fazla dosya seçimi
          final List<XFile> pickedFiles = await ImagePicker().pickMultiImage(
            imageQuality: 50,
          );
          if (pickedFiles.isNotEmpty) {
            widget.onImagePicked.call(pickedFiles);
          } else {
            ToastWidgets.errorToast(context, "Görsel seçilmedi.");
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print("Pick Image Error: $e");
      }
      ToastWidgets.errorToast(context, "Görsel seçme işlemi sırasında bir hata oluştu.");
    }
  }

  // void pickImage(BuildContext context) {
  //   if (widget.isSelectOnlyOne) {
  //     if (kIsWeb) {
  //       //Select one file
  //       FilePicker.platform.pickFiles(
  //         type: FileType.custom,
  //         allowedExtensions: ['jpg', 'png', 'jpeg'],
  //       ).then((value) {
  //         if (value != null) {
  //           widget.onImagePicked.call([value.files.first]);
  //         } else {
  //           ToastWidgets.errorToast(context, "Görsel seçilmedi.");
  //         }
  //       });
  //     } else {
  //       ImagePicker()
  //           .pickImage(
  //         imageQuality: 50,
  //         source: ImageSource.gallery,
  //       )
  //           .then((value) {
  //         if (value != null) {
  //           widget.onImagePicked.call([value]);
  //         } else {
  //           ToastWidgets.errorToast(context, "Görsel seçilmedi.");
  //         }
  //       });
  //     }
  //   } else {
  //     ImagePicker()
  //         .pickMultiImage(
  //       imageQuality: 50,
  //     )
  //         .then((value) {
  //       if (value != []) {
  //         widget.onImagePicked.call(value);
  //       } else {
  //         ToastWidgets.errorToast(context, "Görsel seçilmedi.");
  //       }
  //     });
  //   }
  // }

  addImageButton(BuildContext context) {
    return GestureDetector(
      onTap: () {
        pickImage(context);
      },
      child: Container(
        height: deviceHeightSize(context, 80),
        width: deviceWidthSize(context, 80),
        decoration: BoxDecoration(
          color: AppTheme.green.withOpacity(0.1),
          // border: Border.all(
          //   color: AppTheme.green,
          // ),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: Icon(
            Icons.photo_library_rounded,
            color: AppTheme.green,
            size: deviceHeightSize(context, 32),
          ),
        ),
      ),
    );
  }

  imageContainer(BuildContext context, int index, Uint8List correctPng) {
    return SizedBox(
      height: deviceHeightSize(context, widget.widgetSize + widget.widgetSize * 0.1),
      width: deviceWidthSize(context, widget.widgetSize + widget.widgetSize * 0.1),
      child: Stack(
        children: [
          Container(
            height: deviceHeightSize(context, widget.widgetSize),
            width: deviceWidthSize(context, widget.widgetSize),
            margin: EdgeInsets.only(
              right: deviceWidthSize(context, 10),
              top: deviceHeightSize(context, 10),
            ),
            decoration: const BoxDecoration(
                // image: DecorationImage(
                //   //BURADA RESMİN YÜKLENMESİYLE ALAKALI SORUN VAR DÜZELT
                //   image: widget.selectedImages[index]?.url == null && kIsWeb == false
                //       ? FileImage(
                //           File(widget.selectedImages[index]!.file!.path),
                //         )
                //       : kIsWeb && widget.selectedImages[index]!.url == null
                //           ? MemoryImage(widget.selectedImages[index]!.platformFile!.bytes!)
                //           : NetworkImage(widget.selectedImages[index]!.url ?? "") as ImageProvider,
                //   fit: BoxFit.cover,
                // ),
                ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: widget.selectedImages[index]?.url == null && kIsWeb == false
                  ? Image.file(
                      File(widget.selectedImages[index]?.file?.path ?? ""),
                      errorBuilder: (context, error, stackTrace) {
                        return Image.asset(
                          "assets/images/correctImage.png",
                          fit: BoxFit.contain,
                          alignment: Alignment.center,
                        );
                      },
                      fit: BoxFit.cover,
                    )
                  : kIsWeb && widget.selectedImages[index]?.url == null
                      ? Image.memory(
                          widget.selectedImages.first?.platformFile?.bytes ?? Uint8List(0),
                          errorBuilder: (context, error, stackTrace) {
                            return Image.asset(
                              "assets/images/correctImage.png",
                              fit: BoxFit.contain,
                              alignment: Alignment.center,
                            );
                          },
                          fit: BoxFit.cover,
                        )
                      : widget.selectedImages[index]?.url != null
                          ? Image.network(
                              widget.selectedImages[index]!.url!,
                              errorBuilder: (context, error, stackTrace) {
                                return Image.asset(
                                  "assets/images/correctImage.png",
                                  fit: BoxFit.contain,
                                  alignment: Alignment.center,
                                );
                              },
                              fit: BoxFit.cover,
                            )
                          : Image.memory(
                              widget.selectedImages.first?.platformFile?.bytes ?? Uint8List(0),
                              errorBuilder: (context, error, stackTrace) {
                                return Image.asset(
                                  "assets/images/correctImage.png",
                                  fit: BoxFit.contain,
                                  alignment: Alignment.center,
                                );
                              },
                              fit: BoxFit.cover,
                            ),
            ),
          ),
          Positioned(
            top: 0,
            right: 0,
            child: GestureDetector(
              onTap: () {
                widget.onImageRemoved.call(widget.selectedImages[index]);
              },
              child: Container(
                height: deviceHeightSize(context, 20),
                width: deviceWidthSize(context, 20),
                decoration: const BoxDecoration(
                  color: AppTheme.red,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(
                    Icons.close,
                    color: Colors.white,
                    size: deviceHeightSize(context, 16),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
