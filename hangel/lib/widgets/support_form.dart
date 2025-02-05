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
  const SupportForm({super.key});

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
  final List<String> _userTypes = [
    "support_form_user_type_individual".locale,
    "support_form_user_type_stk_manager".locale,
    "support_form_user_type_brand_manager".locale
  ];

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
              title: "support_form_name".locale,
              isRequired: true,
              isEditable: false,
            ),
            FormFieldWidget(
              context,
              controller: _emailController,
              title: "support_form_email".locale,
              isRequired: true,
              isEditable: false,
            ),
            FormFieldWidget(
              context,
              controller: _telephoneController,
              title: "support_form_phone".locale,
              keyboardType: TextInputType.phone,
              isRequired: true,
              isEditable: false,
            ),
            DropdownWidget(
              context,
              titles: _userTypes,
              title: "support_form_user_type".locale,
              selectedIndex: selectedIndex,
              isRequired: true,
              onChanged: (value) {
                context.read<ProfilePageProvider>().supportSelectedIndex = _userTypes.indexOf(value!);
              },
            ),
            FormFieldWidget(
              context,
              controller: _subjectController,
              title: "support_form_subject".locale,
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _messageController,
              title: "support_form_message".locale,
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
                  ToastWidgets.errorToast(context, "support_form_invalid_email".locale);
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
                  ToastWidgets.errorToast(context, "support_form_fill_all_fields".locale);
                  setState(() {
                    isLoading = false;
                  });
                  return;
                }
                if (!_emailController.text.contains("@") || !_emailController.text.contains(".")) {
                  ToastWidgets.errorToast(context, "support_form_invalid_email".locale);
                  setState(() {
                    isLoading = false;
                  });
                  return;
                }
                if (_telephoneController.text.length < 10) {
                  ToastWidgets.errorToast(context, "support_form_invalid_phone".locale);
                  setState(() {
                    isLoading = false;
                  });
                  return;
                }
                await FirebaseFirestore.instance.collection("forms").add({
                  "subject": "iletişim", // Formun tipi burada kullanılıyor
                  "status": "active",
                  "applicantUid": HiveHelpers.getUid(),
                  "applicantTime": DateTime.now(),
                  "form": {
                    "name": _nameController.text,
                    "mail": _emailController.text,
                    "phone": _telephoneController.text,
                    "message": _messageController.text
                  },
                });
                await SendMailHelper.sendMail(
                  to: ["turkiye@hangel.org"],
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
              text: "support_form_send".locale,
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
