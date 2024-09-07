import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/providers/profile_page_provider.dart';
import 'package:hangel/widgets/dropdown_widget.dart';
import 'package:provider/provider.dart';

import '../constants/size.dart';
import '../helpers/hive_helpers.dart';
import '../helpers/send_mail_helper.dart';
import 'form_field_widget.dart';
import 'general_button_widget.dart';
import 'toast_widgets.dart';

class SupportForm extends StatefulWidget {
  const SupportForm({Key? key}) : super(key: key);

  @override
  State<SupportForm> createState() => _SupportFormState();
}

class _SupportFormState extends State<SupportForm> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _messageController = TextEditingController();
  final TextEditingController _subjectController = TextEditingController();
  final TextEditingController _telephoneController = TextEditingController();
  bool isLoading = false;
  final List<String> _userTypes = ["Bireysel Kullanıcıyım", "STK Yöneticisiyim", "Marka Yöneticisiyim"];

  int selectedIndex = -1;
  @override
  void initState() {
    _telephoneController.text = HiveHelpers.getUserFromHive().phone ?? "";
    _emailController.text = HiveHelpers.getUserFromHive().email ?? "";
    _nameController.text = HiveHelpers.getUserFromHive().name ?? "";
    super.initState();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _messageController.dispose();
    _subjectController.dispose();
    _telephoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    selectedIndex = context.watch<ProfilePageProvider>().supportSelectedIndex;

    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: deviceWidthSize(context, 20),
        ),
        child: Column(
          children: [
            FormFieldWidget(
              context,
              controller: _nameController,
              title: "Ad Soyad",
              isRequired: true,
              isEditable: false,
            ),
            FormFieldWidget(
              context,
              controller: _emailController,
              title: "E-Posta",
              isRequired: true,
              isEditable: false,
            ),
            FormFieldWidget(
              context,
              controller: _telephoneController,
              title: "Telefon",
              keyboardType: TextInputType.phone,
              isRequired: true,
              isEditable: false,
            ),
            DropdownWidget(
              context,
              titles: _userTypes,
              title: "Kullanıcı Tipi",
              selectedIndex: selectedIndex,
              isRequired: true,
              onChanged: (value) {
                context.read<ProfilePageProvider>().supportSelectedIndex = _userTypes.indexOf(value!);
              },
            ),
            FormFieldWidget(
              context,
              controller: _subjectController,
              title: "Konu",
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _messageController,
              title: "Mesaj",
              isRequired: true,
              maxLines: 5,
              minLines: 2,
            ),
            GeneralButtonWidget(
              onPressed: () async {
                setState(() {
                  isLoading = true;
                });
                if (!_emailController.text.isValidEmail()) {
                  ToastWidgets.errorToast(context, "E-posta adresinizde hata var!");
                  setState(() {
                    isLoading = false;
                  });
                  return;
                }
                if (_nameController.text.isEmpty ||
                    _emailController.text.isEmpty ||
                    _telephoneController.text.isEmpty ||
                    _subjectController.text.isEmpty ||
                    _messageController.text.isEmpty ||
                    selectedIndex == -1) {
                  ToastWidgets.errorToast(context, "Lütfen tüm alanları doldurun");
                  setState(() {
                    isLoading = false;
                  });
                  return;
                }
                if (!_emailController.text.contains("@") || !_emailController.text.contains(".")) {
                  ToastWidgets.errorToast(context, "Lütfen geçerli bir e-posta girin");
                  setState(() {
                    isLoading = false;
                  });
                  return;
                }
                if (_telephoneController.text.length < 10) {
                  ToastWidgets.errorToast(context, "Lütfen geçerli bir telefon numarası girin");
                  setState(() {
                    isLoading = false;
                  });
                  return;
                }
                await FirebaseFirestore.instance.collection("forms").add({
                  "subject": "İletişim",
                  "status": "active",
                  "form": {
                    "name": _nameController.text,
                    "mail": _emailController.text,
                    "phone": _telephoneController.text,
                    "message": _messageController.text
                  },
                });
                await SendMailHelper.sendMail(
                  to: [_emailController.text],
                  subject: _subjectController.text,
                  body: "",
                  html: """
                      <p> Ad Soyad: ${_nameController.text} </p>
                      <p> E-Posta: ${_emailController.text} </p>
                      <p> Telefon: ${_telephoneController.text} </p>
                      <p> Mesaj: ${_messageController.text} </p>
                      """,
                ).then((value) {
                  ToastWidgets.responseToast(context, value);
                  setState(() {
                    isLoading = false;
                  });
                  Navigator.pop(context);
                });
              },
              text: "Gönder",
              isLoading: isLoading,
            ),
            SizedBox(
              height: deviceHeightSize(context, 20) + MediaQuery.of(context).viewInsets.bottom,
            )
          ],
        ),
      ),
    );
  }
}
