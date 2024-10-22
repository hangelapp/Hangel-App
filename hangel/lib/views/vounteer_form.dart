// lib/views/volunteer_form.dart

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../constants/size.dart';
import '../models/general_response_model.dart';
import '../models/volunteer_model.dart'; // Güncellenmiş model
import '../providers/login_register_page_provider.dart';
import '../providers/volunteer_provider.dart';
import '../widgets/dropdown_widget.dart';
import '../widgets/form_field_widget.dart';
import '../widgets/general_button_widget.dart';
import '../widgets/toast_widgets.dart';
import 'app_view.dart';

class VolunteerForm extends StatefulWidget {
  const VolunteerForm({Key? key}) : super(key: key);
  static const routeName = 'volunteer-form';

  @override
  State<VolunteerForm> createState() => _VolunteerFormState();
}

class _VolunteerFormState extends State<VolunteerForm> {
  final TextEditingController baslikController = TextEditingController();
  final TextEditingController aciklamaController = TextEditingController();
  final TextEditingController toplamCalismaSaatiController = TextEditingController();
  final TextEditingController toplamGunController = TextEditingController();
  final TextEditingController kacKisiIhtiyacController = TextEditingController();

  DateTime? baslamaSuresi;
  DateTime? bitisSuresi;

  int selectedSekliIndex = -1;
  int selectedPeriyoduIndex = -1;
  int selectedYasSiniriIndex = -1;
  int selectedYolMasrafiIndex = -1;
  int selectedKonaklamaIndex = -1;
  int selectedYemekIndex = -1;

  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      // Gerekirse başlatma işlemleri
    });
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
    baslikController.dispose();
    aciklamaController.dispose();
    toplamCalismaSaatiController.dispose();
    toplamGunController.dispose();
    kacKisiIhtiyacController.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
        child: SafeArea(
            child: SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey, // Form'un key'ini atıyoruz
        child: Column(
          children: [
            // Başlık
            FormFieldWidget(
              context,
              controller: baslikController,
              title: "Başlık",
              hintText: "İlan Başlığı",
              isRequired: true,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return "Başlık boş olamaz.";
                }
                return null;
              },
            ),
            // Açıklama
            FormFieldWidget(
              context,
              controller: aciklamaController,
              title: "Açıklama",
              hintText: "İlan Açıklaması",
              isRequired: true,
              maxLines: 5,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return "Açıklama boş olamaz.";
                }
                return null;
              },
            ),
            // Başlama ve Bitiş Süresi
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () async {
                      DateTime? pickedDate = await showDatePicker(
                        context: context,
                        initialDate: baslamaSuresi ?? DateTime.now(),
                        firstDate: DateTime.now(),
                        lastDate: DateTime(2100),
                      );
                      if (pickedDate != null) {
                        setState(() {
                          baslamaSuresi = pickedDate;
                        });
                      }
                    },
                    child: AbsorbPointer(
                      child: FormFieldWidget(
                        context,
                        controller: TextEditingController(
                          text: baslamaSuresi != null
                              ? "${baslamaSuresi!.day}/${baslamaSuresi!.month}/${baslamaSuresi!.year}"
                              : "",
                        ),
                        title: "Başlama Süresi",
                        isRequired: true,
                        validator: (value) {
                          if (baslamaSuresi == null) {
                            return "Başlama süresi seçilmelidir.";
                          }
                          return null;
                        },
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: () async {
                      DateTime? pickedDate = await showDatePicker(
                        context: context,
                        initialDate: bitisSuresi ?? DateTime.now(),
                        firstDate: baslamaSuresi ?? DateTime.now(),
                        lastDate: DateTime(2100),
                      );
                      if (pickedDate != null) {
                        setState(() {
                          bitisSuresi = pickedDate;
                        });
                      }
                    },
                    child: AbsorbPointer(
                      child: FormFieldWidget(
                        context,
                        controller: TextEditingController(
                          text: bitisSuresi != null
                              ? "${bitisSuresi!.day}/${bitisSuresi!.month}/${bitisSuresi!.year}"
                              : "",
                        ),
                        title: "Bitiş Süresi",
                        isRequired: true,
                        validator: (value) {
                          if (bitisSuresi == null) {
                            return "Bitiş süresi seçilmelidir.";
                          }
                          if (baslamaSuresi != null && bitisSuresi!.isBefore(baslamaSuresi!)) {
                            return "Bitiş süresi, başlama süresinden önce olamaz.";
                          }
                          return null;
                        },
                      ),
                    ),
                  ),
                ),
              ],
            ),
            // Şekli (online, offline, hibrit )
            DropdownWidget(
              context,
              titles: _sekiller,
              selectedIndex: selectedSekliIndex,
              title: "Şekli",
              onChanged: (p0) {
                if (p0 == null) return;
                setState(() {
                  selectedSekliIndex = _sekiller.indexOf(p0);
                });
              },
              isRequired: true,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return "Şekil seçilmelidir.";
                }
                return null;
              },
            ),
            // Periyodu
            DropdownWidget(
              context,
              titles: _periyotlar,
              selectedIndex: selectedPeriyoduIndex,
              title: "Periyodu",
              onChanged: (p0) {
                if (p0 == null) return;
                setState(() {
                  selectedPeriyoduIndex = _periyotlar.indexOf(p0);
                });
              },
              isRequired: true,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return "Periyot seçilmelidir.";
                }
                return null;
              },
            ),
            // Toplam Çalışma Saati
            FormFieldWidget(
              context,
              controller: toplamCalismaSaatiController,
              title: "Toplam Çalışma Saati",
              hintText: "1 - 225",
              isRequired: true,
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(3),
              ],
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return "Toplam çalışma saati boş olamaz.";
                }
                int? saati = int.tryParse(value);
                if (saati == null || saati < 1 || saati > 225) {
                  return "1 ile 225 arasında bir değer giriniz.";
                }
                return null;
              },
            ),
            // Toplam Gün
            FormFieldWidget(
              context,
              controller: toplamGunController,
              title: "Toplam Gün",
              hintText: "1 - 365",
              isRequired: true,
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(3),
              ],
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return "Toplam gün boş olamaz.";
                }
                int? gunu = int.tryParse(value);
                if (gunu == null || gunu < 1 || gunu > 365) {
                  return "1 ile 365 arasında bir değer giriniz.";
                }
                return null;
              },
            ),
            // Kaç Kişi İhtiyaç
            FormFieldWidget(
              context,
              controller: kacKisiIhtiyacController,
              title: "Kaç Kişiye İhtiyaç Var",
              hintText: "Sayı Giriniz",
              isRequired: true,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return "Kaç kişiye ihtiyaç var boş olamaz.";
                }
                int? kisi = int.tryParse(value);
                if (kisi == null || kisi < 1) {
                  return "Geçerli bir sayı giriniz.";
                }
                return null;
              },
            ),
            // Yaş Sınırı
            DropdownWidget(
              context,
              titles: _yasSinirlari,
              selectedIndex: selectedYasSiniriIndex,
              title: "Yaş Sınırı",
              onChanged: (p0) {
                if (p0 == null) return;
                setState(() {
                  selectedYasSiniriIndex = _yasSinirlari.indexOf(p0);
                });
              },
              isRequired: true,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return "Yaş sınırı seçilmelidir.";
                }
                return null;
              },
            ),
            // Yol Masrafı
            DropdownWidget(
              context,
              titles: _varYok,
              selectedIndex: selectedYolMasrafiIndex,
              title: "Yol Masrafı",
              onChanged: (p0) {
                if (p0 == null) return;
                setState(() {
                  selectedYolMasrafiIndex = _varYok.indexOf(p0);
                });
              },
              isRequired: true,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return "Yol masrafı seçilmelidir.";
                }
                return null;
              },
            ),
            // Konaklama
            DropdownWidget(
              context,
              titles: _varYok,
              selectedIndex: selectedKonaklamaIndex,
              title: "Konaklama",
              onChanged: (p0) {
                if (p0 == null) return;
                setState(() {
                  selectedKonaklamaIndex = _varYok.indexOf(p0);
                });
              },
              isRequired: true,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return "Konaklama seçilmelidir.";
                }
                return null;
              },
            ),
            // Yemek
            DropdownWidget(
              context,
              titles: _varYok,
              selectedIndex: selectedYemekIndex,
              title: "Yemek",
              onChanged: (p0) {
                if (p0 == null) return;
                setState(() {
                  selectedYemekIndex = _varYok.indexOf(p0);
                });
              },
              isRequired: true,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return "Yemek seçilmelidir.";
                }
                return null;
              },
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                SizedBox(
                  width: deviceWidth(context) * 0.8,
                  child: GeneralButtonWidget(
                    isLoading: context.watch<VolunteerProvider>().sendFormState == LoadingState.loading,
                    onPressed: () async {
                      if (_formKey.currentState!.validate()) {
                        // Yeni model oluştur
                        VolunteerModel opportunityModel = VolunteerModel(
                          // Yeni alanlar
                          title: baslikController.text.trim(),
                          description: aciklamaController.text.trim(),
                          startDate: baslamaSuresi!,
                          endDate: bitisSuresi!,
                          shape: _sekiller[selectedSekliIndex],
                          period: _periyotlar[selectedPeriyoduIndex],
                          totalWorkHours: int.parse(toplamCalismaSaatiController.text.trim()),
                          totalDays: int.parse(toplamGunController.text.trim()),
                          requiredPersons: int.parse(kacKisiIhtiyacController.text.trim()),
                          ageLimit: _yasSinirlari[selectedYasSiniriIndex],
                          transportationCost: _varYok[selectedYolMasrafiIndex] == "Var",
                          accommodation: _varYok[selectedKonaklamaIndex] == "Var",
                          meal: _varYok[selectedYemekIndex] == "Var",
                        );

                        // Provider'ın sendForm metodunu çağır
                        GeneralResponseModel response = await context.read<VolunteerProvider>().sendForm(
                              volunteerModel: opportunityModel,
                              image: null, // Opsiyonel, gerekirse ekleyin
                              cv: null, // Opsiyonel, gerekirse ekleyin
                              imageByte: null, // Opsiyonel, gerekirse ekleyin
                              cvByte: null, // Opsiyonel, gerekirse ekleyin
                            );

                        if (response.success == true) {
                          ToastWidgets.successToast(
                            context,
                            "Başvurunuz alınmıştır. En kısa sürede sizinle iletişime geçeceğiz.",
                          );
                          Navigator.pop(context);
                        } else {
                          ToastWidgets.errorToast(
                            context,
                            "Beklenmeyen bir hatayla karşılaşıldı: ${response.message}",
                          );
                        }
                      } else {
                        ToastWidgets.errorToast(
                          context,
                          "Lütfen tüm alanları doğru doldurunuz.",
                        );
                      }
                    },
                    text: "Gönder",
                    buttonColor: Colors.red,
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    )));
  }

  final List<String> _sekiller = ["Online", "Offline", "Hibrit"];
  final List<String> _periyotlar = [
    "Günlük",
    "Haftalık",
    "Aylık",
    "Parttime",
    "Cumartesi",
    "Pazar",
    "Hafta Sonu",
    "Esnek"
  ];
  final List<String> _yasSinirlari = ["16 ve üzeri", "18 ve üzeri", "21 ve üzeri"];
  final List<String> _varYok = ["Var", "Yok"];
}
