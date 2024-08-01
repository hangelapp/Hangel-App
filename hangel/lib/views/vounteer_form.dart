import 'package:flutter/material.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/widgets/form_field_widget.dart';
import 'package:flutter/services.dart';
import 'package:hangel/widgets/general_button_widget.dart';

class VolunteerForm extends StatefulWidget {
  const VolunteerForm({super.key});
  static const routeName = 'volunteer-form';

  @override
  State<VolunteerForm> createState() => _VolunteerFormState();
}

class _VolunteerFormState extends State<VolunteerForm> {
  // Controllers for each form field
  TextEditingController wantsToVolunteerController = TextEditingController();
  TextEditingController volunteerAreasController = TextEditingController();
  TextEditingController statusController = TextEditingController();
  TextEditingController expertiseAreasController = TextEditingController();
  TextEditingController availableTimeSlotsController = TextEditingController();
  TextEditingController educationLevelController = TextEditingController();
  TextEditingController totalYearsOfWorkController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Gönüllülük Başvuru Formu"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            FormFieldWidget(
              context,
              controller: wantsToVolunteerController,
              title: "Gönüllü Olmak İstiyorum",
              hintText: "Evet / Hayır",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Bu alan zorunludur.';
                }
                return null;
              },
              keyboardType: TextInputType.text,
            ),
            FormFieldWidget(
              context,
              controller: volunteerAreasController,
              title: "Gönüllü Olarak Görev Almak İstediğiniz Alanlar",
              hintText: "Örneğin: Eğitim, Sağlık",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Bu alan zorunludur.';
                }
                return null;
              },
              keyboardType: TextInputType.text,
            ),
            FormFieldWidget(
              context,
              controller: statusController,
              title: "Statü (Fiziki, Online, Her ikisi)",
              hintText: "Örneğin: Fiziki",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Bu alan zorunludur.';
                }
                return null;
              },
              keyboardType: TextInputType.text,
            ),
            FormFieldWidget(
              context,
              controller: expertiseAreasController,
              title: "Yetkin Olduğunuz Alanlar",
              hintText: "Örneğin: Yazılım, Sağlık",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Bu alan zorunludur.';
                }
                return null;
              },
              keyboardType: TextInputType.text,
            ),
            FormFieldWidget(
              context,
              controller: availableTimeSlotsController,
              title: "Müsait Olduğunuz Gün Saat Aralığı",
              hintText: "Örneğin: Hafta içi 9:00 - 17:00",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Bu alan zorunludur.';
                }
                return null;
              },
              keyboardType: TextInputType.text,
            ),
            FormFieldWidget(
              context,
              controller: educationLevelController,
              title: "Mezuniyet Durumu",
              hintText: "Örneğin: Üniversite",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Bu alan zorunludur.';
                }
                return null;
              },
              keyboardType: TextInputType.text,
            ),
            FormFieldWidget(
              context,
              controller: totalYearsOfWorkController,
              title: "Toplam Çalışma Yılı",
              hintText: "Örneğin: 5",
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Bu alan zorunludur.';
                }
                if (int.tryParse(value) == null) {
                  return 'Geçerli bir sayı giriniz.';
                }
                return null;
              },
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                SizedBox(
                  width: deviceWidth(context)/2.3,
                  child: GeneralButtonWidget(
                    onPressed: () {
                      Navigator.pushNamedAndRemoveUntil(
                        context,
                        AppView.routeName,
                        (route) => false,
                      );
                    },
                    text: "Kaydet",
                    buttonColor: Colors.red,
                  ),
                ),
                SizedBox(
                  width: deviceWidth(context)/2.3,
                  child: GeneralButtonWidget(
                    onPressed: () {
                      Navigator.pushNamedAndRemoveUntil(
                        context,
                        AppView.routeName,
                        (route) => false,
                      );
                    },
                    text: "İstemiyorum",
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
