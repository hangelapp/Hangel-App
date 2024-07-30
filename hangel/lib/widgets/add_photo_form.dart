import 'dart:io';

import 'package:hangel/providers/profile_page_provider.dart';

import '/constants/app_theme.dart';
import '/constants/size.dart';
import '/providers/login_register_page_provider.dart';

import '/widgets/general_button_widget.dart';
import '/widgets/toast_widgets.dart';
import 'package:flutter/material.dart';

import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

class AddPhotoForm extends StatefulWidget {
  const AddPhotoForm({Key? key}) : super(key: key);

  @override
  State<AddPhotoForm> createState() => _AddPhotoFormState();
}

class _AddPhotoFormState extends State<AddPhotoForm> {
  XFile? _image;

  @override
  Widget build(BuildContext context) {
    _image = context.watch<ProfilePageProvider>().image;

    return Column(
      children: [
        if (_image != null)
          Container(
            width: deviceWidthSize(context, 200),
            height: deviceWidthSize(context, 200),
            margin: EdgeInsets.only(
              bottom: deviceHeightSize(context, 20),
            ),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.primaryColor,
                width: 5,
              ),
              image: DecorationImage(
                image: FileImage(
                  File(_image!.path),
                ),
                fit: BoxFit.cover,
              ),
            ),
          ),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () {
                  ImagePicker()
                      .pickImage(source: ImageSource.camera)
                      .then((value) {
                    context.read<ProfilePageProvider>().image = value;
                  });
                },
                child: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: deviceWidthSize(context, 20),
                    vertical: deviceHeightSize(context, 20),
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.camera_alt_rounded,
                        size: deviceWidthSize(context, 50),
                        color: AppTheme.primaryColor,
                      ),
                      SizedBox(
                        height: deviceHeightSize(context, 16),
                      ),
                      Text(
                        "Kameradan Çek",
                        textAlign: TextAlign.center,
                        style: AppTheme.semiBoldTextStyle(context, 16),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SizedBox(
              width: deviceWidthSize(context, 20),
            ),
            Expanded(
              child: GestureDetector(
                onTap: () {
                  ImagePicker()
                      .pickImage(source: ImageSource.gallery)
                      .then((value) {
                    context.read<ProfilePageProvider>().image = value;
                  });
                },
                child: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: deviceWidthSize(context, 20),
                    vertical: deviceHeightSize(context, 20),
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.photo_library_rounded,
                        size: deviceWidthSize(context, 50),
                        color: AppTheme.primaryColor,
                      ),
                      SizedBox(
                        height: deviceHeightSize(context, 16),
                      ),
                      Text(
                        "Galeriden\nSeç",
                        textAlign: TextAlign.center,
                        style: AppTheme.semiBoldTextStyle(context, 16),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        SizedBox(
          height: deviceHeightSize(context, 20),
        ),
        GeneralButtonWidget(
          onPressed: () {
            context.read<ProfilePageProvider>().uploadImage().then(
              (value) {
                ToastWidgets.responseToast(context, value);
                if (value.success == true) {
                  Navigator.pop(context);
                }
              },
            );
          },
          isLoading: context.watch<ProfilePageProvider>().addButtonState ==
              LoadingState.loading,
          buttonColor: _image == null
              ? AppTheme.secondaryColor.withOpacity(0.4)
              : AppTheme.secondaryColor,
          text: "Kaydet",
        ),
        SizedBox(
          height: deviceHeightSize(context, 30),
        ),
      ],
    );
  }
}
