import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/helpers/send_mail_helper.dart';
import 'package:hangel/widgets/form_field_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/toast_widgets.dart';

class MissingDonationFormPage extends StatefulWidget {
  const MissingDonationFormPage({super.key});
  static const routeName = '/missing-donation-form';

  @override
  State<MissingDonationFormPage> createState() => _MissingDonationFormPageState();
}

class _MissingDonationFormPageState extends State<MissingDonationFormPage> {
  final TextEditingController _brandController = TextEditingController();
  final TextEditingController _orderNumberController = TextEditingController();
  final TextEditingController _dateController = TextEditingController();
  final TextEditingController _cartAmountController = TextEditingController();
  final TextEditingController _registryIdController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    // Kullanıcının telefon numarasını otomatik doldurmak için
    _phoneController.text = HiveHelpers.getUserFromHive().phone ?? "";
  }

  @override
  void dispose() {
    _brandController.dispose();
    _orderNumberController.dispose();
    _dateController.dispose();
    _cartAmountController.dispose();
    _registryIdController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: deviceWidthSize(context, 20),
        ),
        child: Column(
          children: [
            FormFieldWidget(
              context,
              controller: _brandController,
              title: "missing_donation_form_brand".locale,
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _orderNumberController,
              title: "missing_donation_form_order_number".locale,
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _dateController,
              title: "missing_donation_form_date".locale,
              isRequired: true,
              readOnly: true,
              ontap: _selectDate,
              hintText: "Sipariş Tarihi",
            ),
            FormFieldWidget(
              context,
              controller: _cartAmountController,
              title: "missing_donation_form_cart_amount".locale,
              isRequired: true,
              keyboardType: TextInputType.number,
            ),
            FormFieldWidget(
              context,
              controller: _registryIdController,
              title: "missing_donation_form_registry_id".locale,
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _phoneController,
              title: "missing_donation_form_phone".locale,
              isRequired: true,
              keyboardType: TextInputType.phone,
            ),
            GeneralButtonWidget(
              onPressed: _submitForm,
              text: "missing_donation_form_send".locale,
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

  /// Tarih seçmek için tarih seçici açar
  void _selectDate() async {
    DateTime initialDate = DateTime.now();
    DateTime firstDate = DateTime(2000);
    DateTime lastDate = DateTime.now();

    final DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: lastDate,
      locale: const Locale('tr'), // Dil ayarı
    );

    if (pickedDate != null) {
      setState(() {
        _dateController.text = "${pickedDate.day}/${pickedDate.month}/${pickedDate.year}";
      });
    }
  }

  /// Formu gönderir ve verileri Firestore'a kaydeder
  void _submitForm() async {
    setState(() {
      isLoading = true;
    });

    // Form validasyonu
    if (_brandController.text.isEmpty ||
        _orderNumberController.text.isEmpty ||
        _dateController.text.isEmpty ||
        _cartAmountController.text.isEmpty ||
        _registryIdController.text.isEmpty ||
        _phoneController.text.isEmpty) {
      ToastWidgets.errorToast(context, "missing_donation_form_fill_all_fields".locale);
      setState(() {
        isLoading = false;
      });
      return;
    }

    if (_phoneController.text.length < 10) {
      ToastWidgets.errorToast(context, "missing_donation_form_invalid_phone".locale);
      setState(() {
        isLoading = false;
      });
      return;
    }

    try {
      // Firestore'a kaydetme işlemi
      await FirebaseFirestore.instance.collection("forms").add({
        "subject": "Bağışım Gözükmüyor",
        "status": "active",
        "applicantUid": HiveHelpers.getUid(),
        "applicantTime": DateTime.now(),
        "form": {
          "brand": _brandController.text,
          "orderNumber": _orderNumberController.text,
          "date": _dateController.text,
          "cartAmount": _cartAmountController.text,
          "registryId": _registryIdController.text,
          "phone": _phoneController.text,
        },
      });

      // İsteğe bağlı olarak mail gönderme işlemi
      await SendMailHelper.sendMail(
        to: ["turkiye@hangel.org"],
        subject: "Bağışım Gözükmüyor Başvurusu",
        body: "",
        html: """
          <p><b>Marka:</b> ${_brandController.text}</p>
          <p><b>Sipariş Numarası:</b> ${_orderNumberController.text}</p>
          <p><b>Tarih:</b> ${_dateController.text}</p>
          <p><b>Sepet Tutarı:</b> ${_cartAmountController.text}</p>
          <p><b>Sicil ID Telefon numarası:</b> ${_registryIdController.text}</p>
          <p><b>Telefon Numarası:</b> ${_phoneController.text}</p>
        """,
      );

      ToastWidgets.successToast(context, "missing_donation_form_success".locale);
      Navigator.pop(context);
    } catch (e) {
      ToastWidgets.errorToast(context, "missing_donation_form_error".locale);
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }
}
