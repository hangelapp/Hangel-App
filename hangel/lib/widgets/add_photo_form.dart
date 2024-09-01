import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../providers/login_register_page_provider.dart';
import '../providers/profile_page_provider.dart';
import 'general_button_widget.dart';
import 'toast_widgets.dart';

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
            width: 200,
            height: 200,
            margin: EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.blue, width: 5),
              image: DecorationImage(
                image: FileImage(File(_image!.path)),
                fit: BoxFit.cover,
              ),
            ),
          ),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => _pickImage(ImageSource.camera),
                child: _buildOptionButton(
                  context,
                  icon: Icons.camera_alt_rounded,
                  text: "Kameradan Çek",
                ),
              ),
            ),
            SizedBox(width: 20),
            Expanded(
              child: GestureDetector(
                onTap: () => _pickImage(ImageSource.gallery),
                child: _buildOptionButton(
                  context,
                  icon: Icons.photo_library_rounded,
                  text: "Galeriden Seç",
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 20),
        GeneralButtonWidget(
          onPressed: () {
            if (_image != null) {
              context.read<ProfilePageProvider>().uploadImage().then((value) {
                ToastWidgets.responseToast(context, value);
                if (value.success == true) {
                  Navigator.pop(context);
                }
              });
            }
          },
          isLoading: context.watch<ProfilePageProvider>().addButtonState == LoadingState.loading,
          buttonColor: _image == null ? Colors.grey.withOpacity(0.4) : Colors.blue,
          text: "Kaydet",
        ),
        SizedBox(height: 30),
      ],
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    final pickedFile = await ImagePicker().pickImage(source: source);
    if (pickedFile != null) {
      final croppedFile = await ImageCropper().cropImage(
        sourcePath: pickedFile.path,
        aspectRatio: CropAspectRatio(ratioX: 1, ratioY: 1),
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: 'Resmi Kırp',
            toolbarColor: Colors.blue,
            toolbarWidgetColor: Colors.white,
            initAspectRatio: CropAspectRatioPreset.square,
            lockAspectRatio: true,
          ),
          IOSUiSettings(
            minimumAspectRatio: 1.0,
          ),
        ],
      );

      if (croppedFile != null) {
        setState(() {
          _image = XFile(croppedFile.path);
          context.read<ProfilePageProvider>().image = _image;
        });
      }
    }
  }

  Widget _buildOptionButton(BuildContext context, {required IconData icon, required String text}) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(13),
      ),
      child: Column(
        children: [
          Icon(icon, size: 50, color: Colors.blue),
          SizedBox(height: 16),
          Text(
            text,
            textAlign: TextAlign.center,
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ],
      ),
    );
  }
}
