import 'dart:developer';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../constants/app_theme.dart';
import '../constants/size.dart';
import 'toast_widgets.dart';

enum FormType { add, edit }

class PickFileWidget extends StatefulWidget {
  const PickFileWidget(
    BuildContext context, {
    super.key,
    required this.title,
    required this.onFilePicked,
    required this.onFileRemoved,
    this.isRequired = false,
    this.formType = FormType.add,
    this.selectedFile,
    this.fileURL = "",
    this.infoText = "",
  });
  final String title;
  final Function onFilePicked;
  final Function onFileRemoved;
  final PlatformFile? selectedFile;
  final String fileURL;
  final String infoText;
  final FormType formType;
  final bool isRequired;

  @override
  State<PickFileWidget> createState() => _PickFileWidgetState();
}

class _PickFileWidgetState extends State<PickFileWidget> {
  bool isFilePicked = false;
  @override
  Widget build(BuildContext context) {
    log(widget.fileURL.split("/").last);
    isFilePicked = widget.formType == FormType.add || widget.fileURL.isEmpty
        ? widget.selectedFile != null
        : widget.fileURL.isNotEmpty;

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
        GestureDetector(
          onTap: () {
            if (isFilePicked == false) {
              pickFile(context);
            }
          },
          child: Container(
            width: MediaQuery.of(context).size.width,
            decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: const [BoxShadow(color: Colors.black87, offset: Offset(1, 1), blurRadius: 1)]
                // border: Border.all(
                //   color: AppTheme.darkBlue.withOpacity(0.3),
                // ),
                ),
            child: isFilePicked ? fileWidget(context) : pickFileWidget(context),
          ),
        ),
        if (widget.infoText.isNotEmpty)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: deviceHeightSize(context, 4),
              ),
              Text(
                widget.infoText,
                style: AppTheme.normalTextStyle(
                  context,
                  14,
                ),
              ),
            ],
          ),
        SizedBox(height: deviceHeightSize(context, 16)),
      ],
    );
  }

  SizedBox pickFileWidget(BuildContext context) {
    return SizedBox(
      height: deviceHeightSize(context, 50),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.attach_file,
            size: 20,
            color: AppTheme.darkBlue.withOpacity(0.7),
          ),
          SizedBox(
            width: deviceWidthSize(context, 4),
          ),
          Text(
            "Dosya Seç",
            style: AppTheme.normalTextStyle(context, 14, color: AppTheme.darkBlue.withOpacity(0.7)),
          ),
        ],
      ),
    );
  }

  fileWidget(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(
        vertical: deviceHeightSize(context, 4),
      ),
      padding: EdgeInsets.symmetric(
        horizontal: deviceWidthSize(context, 16),
        vertical: deviceHeightSize(context, 12),
      ),
      child: Row(
        children: [
          fileIcon(
              context,
              widget.formType == FormType.add || widget.fileURL.isEmpty
                  ? widget.selectedFile!.extension!
                  : widget.fileURL.split(".").last),
          SizedBox(
            width: deviceWidthSize(context, 8),
          ),
          Expanded(
            child: Text(
              widget.formType == FormType.add || widget.fileURL.isEmpty
                  ? widget.selectedFile!.name
                  : widget.fileURL.split("/").last,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTheme.normalTextStyle(context, 12),
            ),
          ),
          GestureDetector(
            onTap: () {
              widget.onFileRemoved.call();
            },
            child: const Icon(
              Icons.close,
              color: AppTheme.red,
            ),
          ),
        ],
      ),
    );
  }

  SizedBox fileIcon(BuildContext context, String extensionName) {
    return SizedBox(
      width: deviceWidthSize(context, 35),
      height: deviceWidthSize(context, 35),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(
            Icons.insert_drive_file,
            size: deviceWidthSize(context, 35),
            color: AppTheme.darkBlue,
          ),
          Positioned(
            bottom: deviceHeightSize(context, 5),
            child: Text(
              extensionName.toString(),
              style: AppTheme.boldTextStyle(context, 8, color: AppTheme.white),
            ),
          ),
        ],
      ),
    );
  }

  void pickFile(BuildContext context) {
    print("pick file");
    FilePicker.platform.pickFiles(
      type: FileType.custom,
      // //audio files
      withData: true, // Bu satırı ekleyin

      allowedExtensions: [
        "pdf",
        "jpg",
        "png",
      ],
    ).then((value) {
      if (value == null) return;
      for (var element in value.files) {
        if (element.size < 60000000) {
          widget.onFilePicked(element);
        } else {
          ToastWidgets.errorToast(context, "Dosya boyutu 60MB'dan büyük olamaz");
        }
      }
    });
  }
}
