import 'dart:io';

import '../models/image_model.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/material.dart';
import '../constants/app_theme.dart';
import '../constants/size.dart';
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

  @override
  Widget build(BuildContext context) {
    // widget.formType == FormType.add ||
    isImagePicked = widget.imageURL.isEmpty
        ? widget.selectedImages.isNotEmpty
        : widget.imageURL.isNotEmpty;

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
                style: AppTheme.semiBoldTextStyle(context, 16,
                    color: AppTheme.red),
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
                if (!(widget.isSelectOnlyOne &&
                    widget.selectedImages.isNotEmpty))
                  addImageButton(context),
                SizedBox(width: deviceWidthSize(context, 10)),
                ...List.generate(
                  widget.selectedImages.length,
                  (index) => imageContainer(context, index),
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

  void pickImage(BuildContext context) {
    if (widget.isSelectOnlyOne) {
      if (kIsWeb) {
        //Select one file
        FilePicker.platform.pickFiles(
          type: FileType.custom,
          allowedExtensions: ['jpg', 'png', 'jpeg'],
        ).then((value) {
          if (value != null) {
            widget.onImagePicked.call([value.files.first]);
          } else {
            ToastWidgets.errorToast(context, "Görsel seçilmedi.");
          }
        });
      } else {
        ImagePicker()
            .pickImage(
          imageQuality: 50,
          source: ImageSource.gallery,
        )
            .then((value) {
          if (value != null) {
            widget.onImagePicked.call([value]);
          } else {
            ToastWidgets.errorToast(context, "Görsel seçilmedi.");
          }
        });
      }
    } else {
      ImagePicker()
          .pickMultiImage(
        imageQuality: 50,
      )
          .then((value) {
        if (value != []) {
          widget.onImagePicked.call(value);
        } else {
          ToastWidgets.errorToast(context, "Görsel seçilmedi.");
        }
      });
    }
  }

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
          border: Border.all(
            color: AppTheme.green,
          ),
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

  imageContainer(BuildContext context, int index) {
    return Container(
      height: deviceHeightSize(
          context, widget.widgetSize + widget.widgetSize * 0.1),
      width:
          deviceWidthSize(context, widget.widgetSize + widget.widgetSize * 0.1),
      child: Stack(
        children: [
          Container(
            height: deviceHeightSize(context, widget.widgetSize),
            width: deviceWidthSize(context, widget.widgetSize),
            margin: EdgeInsets.only(
              right: deviceWidthSize(context, 10),
              top: deviceHeightSize(context, 10),
            ),
            decoration: BoxDecoration(
              image: DecorationImage(
                image: widget.selectedImages[index]?.url == null &&
                        kIsWeb == false
                    ? FileImage(
                        File(widget.selectedImages[index]!.file!.path),
                      )
                    : kIsWeb && widget.selectedImages[index]!.url == null
                        ? MemoryImage(
                            widget.selectedImages[index]!.platformFile!.bytes!)
                        : NetworkImage(widget.selectedImages[index]!.url ?? "")
                            as ImageProvider,
                fit: BoxFit.cover,
              ),
              borderRadius: BorderRadius.circular(10),
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
