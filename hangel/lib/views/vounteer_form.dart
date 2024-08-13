import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/image_model.dart';
import 'package:hangel/models/volunteer_model.dart';
import 'package:hangel/providers/volunteer_provider.dart';
import 'package:hangel/views/app_view.dart';
import 'package:hangel/widgets/dropdown_widget.dart';
import 'package:hangel/widgets/form_field_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/pick_file_widget.dart';
import 'package:hangel/widgets/pick_image_widget.dart';
import 'package:hangel/widgets/toast_widgets.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../providers/login_register_page_provider.dart';

class VolunteerForm extends StatefulWidget {
  const VolunteerForm({Key? key}) : super(key: key);
  static const routeName = 'volunteer-form';

  @override
  State<VolunteerForm> createState() => _VolunteerFormState();
}

class _VolunteerFormState extends State<VolunteerForm> {
  final TextEditingController expertiseAreasController = TextEditingController();
  final TextEditingController totalYearsOfWorkController = TextEditingController();
  final TextEditingController stkAddressController = TextEditingController();

  List<ImageModel?> volunteerImage = [];
  PlatformFile? resumePDF;
  Uint8List? cvByte;
  Uint8List? imageByte;

  List<String> cities = [];
  List<String> districts = [];
  List<String> neighborhoods = [];
  int selectedAlanIndex = -1;
  int selectedStatuIndex = -1;
  int selectedmusaitVakitIndex = -1;
  int selectedMezunIndex = -1;

  List<String> iller = [];
  List<String> ilceler = [];
  List<String> mahalleler = [];
  String? selectedIl;
  String? selectedIlce;
  String? selectedMahalle;
  String jsonData = "";

  @override
  void initState() {
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      //get iller from json file /assets/il-ilce.json
      jsonData = await DefaultAssetBundle.of(context).loadString("assets/il-ilce.json");
      setState(() {
        final jsonResult = jsonDecode(jsonData);
        for (var item in jsonResult) {
          if (iller.contains(item["İL"])) {
            continue;
          }
          iller.add(item["İL"]);
        }
      });
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              DropdownWidget(
                context,
                titles: _alanlar,
                selectedIndex: selectedAlanIndex,
                title: "Gönüllü Olarak Görev Almak İstediğiniz Alan",
                onChanged: (p0) {
                  if (p0 == null) return;
                  setState(() {
                    selectedAlanIndex = _alanlar.indexOf(p0);
                  });
                },
                isRequired: true,
              ),
              DropdownWidget(
                context,
                titles: _statuler,
                selectedIndex: selectedStatuIndex,
                title: "Statü (Fiziki, Online, Her ikisi)",
                onChanged: (p0) {
                  if (p0 == null) return;
                  setState(() {
                    selectedStatuIndex = _statuler.indexOf(p0);
                  });
                },
                isRequired: true,
              ),
              FormFieldWidget(
                context,
                controller: expertiseAreasController,
                title: "Yetkin Olduğunuz Alanlar",
                hintText: "Örneğin: Yazılım, Sağlık",
                isRequired: true,
              ),
              DropdownWidget(
                context,
                titles: _musaitVakitler,
                selectedIndex: selectedmusaitVakitIndex,
                title: "Müsait olduğunuz Gün Saat Aralığı",
                onChanged: (p0) {
                  if (p0 == null) return;
                  setState(() {
                    selectedmusaitVakitIndex = _musaitVakitler.indexOf(p0);
                  });
                },
                isRequired: true,
              ),
              DropdownWidget(
                context,
                titles: _mezuniyetler,
                selectedIndex: selectedMezunIndex,
                title: "Mezuniyet Durumu",
                onChanged: (p0) {
                  if (p0 == null) return;
                  setState(() {
                    selectedMezunIndex = _mezuniyetler.indexOf(p0);
                  });
                },
                isRequired: true,
              ),
              FormFieldWidget(
                context,
                controller: totalYearsOfWorkController,
                title: "Toplam Çalışma Yılı",
                hintText: "Örneğin: 5",
                isRequired: true,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              ),
              PickImageWidget(
                context,
                title: "Gönüllü Fotoğrafı",
                onImagePicked: (List<XFile?> image) async {
                  print("Seçilen image: ${await image.first?.readAsBytes()}");
                  if (image.isNotEmpty && (image[0] != null)) {
                    try {
                      imageByte = await image.first?.readAsBytes();
                      setState(() {
                        print("Adding image to volunteerImage list");
                        ImageModel imageModel = ImageModel(
                          imageType: ImageType.asset,
                          file: image[0],
                        );
                        volunteerImage = [...volunteerImage, imageModel];
                      });
                    } catch (e) {
                      print("HATA: " + e.toString());
                    }
                  } else {
                    print("HATA: Seçilen görsel null veya boş.");
                  }
                },
                selectedImages: volunteerImage.isNotEmpty
                    ? volunteerImage.first != null
                        ? volunteerImage
                        : []
                    : [],
                isSelectOnlyOne: true,
                onImageRemoved: (ImageModel? image) {
                  print("Removing image");
                  setState(() {
                    volunteerImage = [];
                  });
                },
                infoText: "Fotoğraf, 512x512 boyutlarında, png veya jpg formatında olmalıdır.",
              ),
              PickFileWidget(
                context,
                title: "Özgeçmiş (PDF)",
                onFilePicked: (PlatformFile file) {
                  setState(() {
                    resumePDF = file;
                    cvByte = file.bytes;
                  });
                },
                onFileRemoved: () {
                  setState(() {
                    resumePDF = null;
                  });
                },
                infoText: "Dosya, Pdf formatında ve 6mb'dan küçük olmalıdır.",
                selectedFile: resumePDF,
              ),
              DropdownWidget(
                context,
                titles: iller,
                selectedIndex: iller.indexOf(selectedIl ?? ""),
                onChanged: (value) {
                  setState(() {
                    selectedIl = value;
                    selectedIlce = null;
                    selectedMahalle = null;
                    ilceler = [];
                    mahalleler = [];
                    final jsonResult = jsonDecode(jsonData);
                    for (var item in jsonResult) {
                      if (item["İL"] == selectedIl) {
                        if (ilceler.contains(item["İLÇE"])) {
                          continue;
                        }
                        ilceler.add(item["İLÇE"]);
                      }
                    }
                  });
                },
                title: "İl",
                isRequired: true,
              ),
              if (selectedIl != null)
                DropdownWidget(
                  context,
                  titles: ilceler,
                  selectedIndex: ilceler.indexOf(selectedIlce ?? ""),
                  onChanged: (value) {
                    setState(() {
                      selectedIlce = value;
                      selectedMahalle = null;
                      mahalleler = [];
                      final jsonResult = jsonDecode(jsonData);
                      for (var item in jsonResult) {
                        if (item["İLÇE"] == selectedIlce) {
                          if (mahalleler.contains(item["MAHALLE"])) {
                            continue;
                          }
                          mahalleler.add(item["MAHALLE"]);
                        }
                      }
                    });
                  },
                  title: "İlçe",
                  isRequired: true,
                ),
              if (selectedIlce != null)
                DropdownWidget(
                  context,
                  titles: mahalleler,
                  selectedIndex: mahalleler.indexOf(selectedMahalle ?? ""),
                  onChanged: (value) {
                    setState(() {
                      selectedMahalle = value;
                    });
                  },
                  title: "Mahalle",
                  isRequired: true,
                ),
              if (selectedMahalle != null)
                FormFieldWidget(
                  context,
                  controller: stkAddressController,
                  title: "Sokak ve Kapı Numarası",
                  isRequired: true,
                ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  SizedBox(
                    width: deviceWidth(context) * 0.4,
                    child: GeneralButtonWidget(
                        onPressed: () {
                          Navigator.pushNamedAndRemoveUntil(
                            context,
                            AppView.routeName,
                            (route) => false,
                          );
                        },
                        text: "Atla ->"),
                  ),
                  SizedBox(
                    width: deviceWidth(context) * 0.4,
                    child: GeneralButtonWidget(
                      isLoading: context.watch<VolunteerProvider>().sendFormState == LoadingState.loading,
                      onPressed: () async {
                        if ((expertiseAreasController.text.isNotEmpty &&
                            totalYearsOfWorkController.text.isNotEmpty &&
                            stkAddressController.text.isNotEmpty &&
                            selectedIl != null &&
                            selectedIlce != null &&
                            selectedMahalle != null &&
                            selectedAlanIndex != -1 &&
                            selectedMezunIndex != -1 &&
                            selectedStatuIndex != -1 &&
                            selectedmusaitVakitIndex != -1 &&
                            volunteerImage.isNotEmpty &&
                            resumePDF != null)) {
                          // Save form data
                          VolunteerModel model = VolunteerModel(
                              volunteerAreas: _alanlar.elementAt(selectedAlanIndex),
                              status: _statuler.elementAt(selectedStatuIndex),
                              expertiseAreas: expertiseAreasController.text,
                              availableTimeSlots: _musaitVakitler.elementAt(selectedmusaitVakitIndex),
                              educationLevel: _mezuniyetler.elementAt(selectedMezunIndex),
                              totalYearsOfWork: int.parse(totalYearsOfWorkController.text),
                              city: selectedIl,
                              district: selectedIlce,
                              neighborhood: selectedMahalle,
                              address: stkAddressController.text,
                              image: null,
                              cv: null);
                          print("${volunteerImage.first ?? "LAN"}");
                          await context
                              .read<VolunteerProvider>()
                              .sendForm(
                                  imageByte: imageByte!,
                                  cvByte: cvByte ?? resumePDF?.bytes ?? Uint8List(0),
                                  volunteerModel: model,
                                  image: volunteerImage.first!,
                                  cv: resumePDF)
                              .then(
                            (value) {
                              if (value.success == true) {
                                ToastWidgets.successToast(
                                  context,
                                  "Form başarıyla gönderildi.",
                                );
                              } else {
                                ToastWidgets.errorToast(
                                  context,
                                  "Beklenmeyen bir hatayla karşılaşıldı",
                                );
                              }
                            },
                          );
                          Navigator.pop(context);
                        } else {
                          ToastWidgets.errorToast(
                            context,
                            "Lütfen tüm alanları doldurunuz.",
                          );
                        }
                      },
                      text: "Kaydet",
                      buttonColor: Colors.red,
                    ),
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  final List<String> _alanlar = [
    "Hayvanlar",
    "Yoksullar",
    "Eğitim",
    "Sağlık",
    "Tarım",
    "Mülteci",
    "Hukuk",
    "Deprem",
    "Gıda",
    "Dini",
    "Sosyal girişimcilik",
    "Girişimcilik",
    "Kültür Sanat",
    "Spor",
  ];

  final List<String> _statuler = ["Fiziki", "Online", "Her ikisi"];
  final List<String> _musaitVakitler = ["Hafta içi 9:00 - 17:00", "Hafta sonu 9:00 - 17:00"];
  final List<String> _mezuniyetler = [
    "İlkokul Mezunu",
    "Ortaokul Mezunu",
    "Lise Mezunu",
    "Ön Lisans Mezunu",
    "Lisans Mezunu",
    "Yüksek Lisans Mezunu",
    "Doktora Mezunu",
    "Diğer"
  ];
}
