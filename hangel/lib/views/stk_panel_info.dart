import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/views/utilities.dart'; // generateDigit() fonksiyonu burada tanımlı varsayılıyor
import 'package:hangel/widgets/form_field_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/toast_widgets.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';

import '../models/stk_model.dart';
import '../models/stk_submission_model.dart';

class STKPanelInfo extends StatefulWidget {
  const STKPanelInfo({super.key});
  static const routeName = '/stkPanelInfo';

  @override
  State<STKPanelInfo> createState() => _STKPanelInfoState();
}

class _STKPanelInfoState extends State<STKPanelInfo> {
  bool isLoading = true;
  bool isVerify = false;
  final _formKey = GlobalKey<FormState>();
  StkModel? stkModel;

  // Düzenlenebilir alanlar; başlangıçta boş bırakılıyor.
  final TextEditingController _detailController = TextEditingController(); // Hakkında
  final TextEditingController _phoneController = TextEditingController(); // Telefon
  final TextEditingController _mailController = TextEditingController(); // Mail
  final TextEditingController _addressController = TextEditingController(); // Adres
  final TextEditingController _websiteController = TextEditingController(); // Web Sitesi

  // Telefon için maskeleme: "+90 ### ### ## ##"
  final MaskTextInputFormatter phoneMaskFormatter = MaskTextInputFormatter(
    mask: '+90 ### ### ## ##',
    filter: {"#": RegExp(r'[0-9]')},
    type: MaskAutoCompletionType.lazy,
  );

  // Email doğrulaması için regex
  final RegExp emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');

  // Web sitesi doğrulaması için regex
  final RegExp urlRegex = RegExp(
    r'^(https?:\/\/)?' // protocol (isteğe bağlı)
    r'((([a-zA-Z0-9\-\.]+)\.([a-zA-Z]{2,5}))|' // domain name
    r'(([0-9]{1,3}\.){3}[0-9]{1,3}))' // ya da IP adresi
    r'(\:[0-9]{1,5})?' // port (isteğe bağlı)
    r'(\/[^\s]*)?$', // path (isteğe bağlı)
  );

  // Aktif (bekliyor statüsünde olan) stk_edit başvuru sayısını tutan değişken.
  int _activeSubmissionCount = 0;

  @override
  void initState() {
    super.initState();
    _checkUserVerification();
  }

  Future<void> _checkUserVerification() async {
    String? stkId;
    // Kullanıcının STK olup olmadığını kontrol ediyoruz.
    await FirebaseFirestore.instance.collection("users").doc(HiveHelpers.getUid()).get().then((value) {
      final userData = value.data();
      if (userData != null) {
        setState(() {
          isVerify = userData["isSTKUser"] != null && (userData["isSTKUser"] as String).split(",").first == "true";
          stkId = (userData["isSTKUser"] as String).split(",").last;
        });
      }
    });

    if (!isVerify) {
      Navigator.pushNamedAndRemoveUntil(context, AppView.routeName, (route) => false);
    } else {
      await FirebaseFirestore.instance.collection("stklar").where("id", isEqualTo: stkId).get().then(
        (value) {
          if (!value.docs.first.exists) return;
          setState(() {
            stkModel = StkModel.fromJson(value.docs.first.data());
            isLoading = false;
          });
        },
      );

      // Aktif başvuruları sorgulayalım.
      await _fetchActiveSubmissions();
    }
  }

  Future<void> _fetchActiveSubmissions() async {
    QuerySnapshot query = await FirebaseFirestore.instance
        .collection("stkSubmissions")
        .where("type", isEqualTo: "stk_edit")
        .where("status", isEqualTo: "bekliyor")
        .where("stkId", isEqualTo: stkModel!.id)
        .get();
    setState(() {
      _activeSubmissionCount = query.docs.length;
    });
  }

  @override
  void dispose() {
    _detailController.dispose();
    _phoneController.dispose();
    _mailController.dispose();
    _addressController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return isLoading
        ? Scaffold(
            appBar: AppBar(title: const Text("Bilgileri Güncelle")),
            body: const Center(child: CircularProgressIndicator()),
          )
        : Scaffold(
            appBar: AppBar(title: const Text("Bilgileri Güncelle")),
            body: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Aktif başvuru sayısı ve uyarı notu
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Aktif olarak $_activeSubmissionCount tane güncelleme isteğiniz bulunmaktadır.",
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const Padding(
                            padding: EdgeInsets.only(top: 4.0),
                            child: Text(
                              "ℹ️ Sadece değiştirilmesini istediğiniz alanı güncelleyip formu gönderin.",
                              style: TextStyle(color: Colors.red, fontSize: 12),
                            ),
                          ),
                          const Padding(
                            padding: EdgeInsets.only(top: 4.0),
                            child: Text(
                              "ℹ️ Başvuru durumunuzu destek bölümünden takip edebilirsiniz.",
                              style: TextStyle(color: Colors.red, fontSize: 12),
                            ),
                          ),
                          const Padding(
                            padding: EdgeInsets.only(top: 4.0),
                            child: Text(
                              "ℹ️ Aynı anda 3 aktif güncelleme isteğinden fazla bildirimde bulunamazsınız.",
                              style: TextStyle(color: Colors.red, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Hakkında alanı
                    FormFieldWidget(
                      context,
                      controller: _detailController,
                      title: "Hakkında",
                      minLines: 3,
                      maxLines: 5,
                    ),
                    const SizedBox(height: 10),
                    // Telefon alanı (maske uygulanmış)
                    FormFieldWidget(
                      context,
                      controller: _phoneController,
                      title: "Telefon",
                      keyboardType: TextInputType.phone,
                      inputFormatters: [phoneMaskFormatter],
                    ),
                    const SizedBox(height: 10),
                    // Mail alanı (email doğrulaması)
                    FormFieldWidget(
                      context,
                      controller: _mailController,
                      title: "Mail",
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 10),
                    // Adres alanı
                    FormFieldWidget(
                      context,
                      controller: _addressController,
                      title: "Adres",
                    ),
                    const SizedBox(height: 10),
                    // Web Sitesi alanı (URL doğrulaması)
                    FormFieldWidget(
                      context,
                      controller: _websiteController,
                      title: "Web Sitesi",
                    ),
                    const SizedBox(height: 20),
                    GeneralButtonWidget(
                      // Eğer aktif başvuru sayısı 3 veya fazlaysa, buton tıklanırsa toast ile uyarı gösterilir.
                      onPressed: (_activeSubmissionCount >= 3)
                          ? () {
                              ToastWidgets.errorToast(context,
                                  "*Not: Aynı anda 3 aktif güncelleme isteğinden fazla bildirimde bulunamazsınız.");
                            }
                          : _submitUpdateRequest,
                      text: "Güncelleme Talebi Gönder",
                      isLoading: false,
                    ),
                  ],
                ),
              ),
            ),
          );
  }

  void _submitUpdateRequest() async {
    if (!_formKey.currentState!.validate()) return;

    // Kullanıcının girdiği verileri ayrı bir JSON yapısı olarak hazırlıyoruz.
    Map<String, dynamic> changes = {
      "hakkinda": _detailController.text,
      "telefon": _phoneController.text,
      "mail": _mailController.text,
      "adres": _addressController.text,
      "websitesi": _websiteController.text,
    };

    String submissionId = generateDigit();

    // STKSubmissionsModel üzerinden bir model oluşturuyoruz.
    STKSubmissionsModel submissionModel = STKSubmissionsModel(
      id: submissionId,
      type: "stk_edit",
      content: "STK Bilgi Güncelleme Talebi",
      status: "bekliyor",
      stkId: stkModel!.id,
      messages: changes.entries.map((entry) => "${entry.key}: ${entry.value}").toList(),
      userId: HiveHelpers.getUid(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    // İşlem sırasında kullanıcıya loading göstermek için dialog açıyoruz.
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    await FirebaseFirestore.instance.collection("stkSubmissions").add(submissionModel.toJson()).then((value) {
      Navigator.pop(context); // Loading dialog'u kapatıyoruz
      ToastWidgets.successToast(context, "Güncelleme talebi gönderildi!");
      Navigator.pop(context); // İsteğe bağlı: önceki sayfaya dönüş
      // Gönderim sonrası aktif başvuru sayısını yeniden sorgulayalım.
      _fetchActiveSubmissions();
    }).catchError((error) {
      Navigator.pop(context);
      ToastWidgets.errorToast(context, "Hata: $error");
    });
  }
}
