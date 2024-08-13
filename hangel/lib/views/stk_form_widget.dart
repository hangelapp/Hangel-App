import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/models/general_response_model.dart';
import 'package:hangel/models/image_model.dart';
import 'package:hangel/models/stk_form_model.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:hangel/widgets/dropdown_select_widget.dart';
import 'package:hangel/widgets/dropdown_widget.dart';
import 'package:hangel/widgets/form_field_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/pick_file_widget.dart';
import 'package:hangel/widgets/pick_image_widget.dart';
import 'package:hangel/widgets/toast_widgets.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

class STKFormWidget extends StatefulWidget {
  const STKFormWidget({Key? key}) : super(key: key);

  @override
  State<STKFormWidget> createState() => _stkFormWidgetState();
}

class _stkFormWidgetState extends State<STKFormWidget> {
  final TextEditingController _stkNameController = TextEditingController();
  final TextEditingController _stkFullNameController = TextEditingController();

  final TextEditingController _stkMailController = TextEditingController();
  final TextEditingController _stkPhoneController = TextEditingController();
  final TextEditingController _stkFounderController = TextEditingController();
  final TextEditingController _stkWebsiteController = TextEditingController();
  final TextEditingController _stkContactPersonController = TextEditingController();
  final TextEditingController _stkContactPersonPhoneController = TextEditingController();
  final TextEditingController _stkContactPersonMailController = TextEditingController();
  final TextEditingController _stkContactPersonJob = TextEditingController();
  final TextEditingController _stkAddressController = TextEditingController();

  List<ImageModel?> _logoImage = [];
  List<ImageModel?> _bannerImage = [];
  PlatformFile? _tuzukPDF;
  List<ImageModel?> _faaliyetImage = [];

  final List<String> _selectedCategories = [];
  int _selectedSectorIndex = -1;
  List<String> selectedBMs = [];
  int _selectedType = -1;

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
    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: deviceWidthSize(context, 22),
        ),
        child: Column(
          children: [
            FormFieldWidget(
              context,
              controller: _stkNameController,
              title: "STK Kısa Adı",
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _stkFullNameController,
              title: "STK Tam Adı",
              isRequired: true,
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                "STK Başvurusu Yapan Yetkili Kişi Bilgileri",
                style: AppTheme.semiBoldTextStyle(
                  context,
                  16,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
            FormFieldWidget(
              context,
              controller: _stkContactPersonController,
              title: "Adı Soyadı",
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _stkContactPersonPhoneController,
              title: "Telefon Numarası",
              keyboardType: TextInputType.phone,
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _stkContactPersonMailController,
              title: "Mail Adresi",
              keyboardType: TextInputType.emailAddress,
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _stkContactPersonJob,
              title: "Görevi/Pozisyonu",
              isRequired: true,
            ),
            PickImageWidget(
              context,
              title: "STK'nın Logosu",
              onImagePicked: (List<XFile?> image) {
                setState(() {
                  _logoImage.add(ImageModel(
                    imageType: ImageType.asset,
                    file: image[0]!,
                  ));
                });
              },
              selectedImages: _logoImage,
              isSelectOnlyOne: true,
              onImageRemoved: (ImageModel? image) {
                setState(() {
                  _logoImage = [];
                });
              },
              infoText: "Markanın logosu, 512x512 boyutlarında, png veya jpg formatında olmalıdır.",
            ),
            PickImageWidget(
              context,
              title: "STK'nın Banner Görseli",
              isSelectOnlyOne: true,
              onImagePicked: (List<XFile?> image) {
                setState(() {
                  _bannerImage.add(ImageModel(
                    imageType: ImageType.asset,
                    file: image[0]!,
                  ));
                });
              },
              selectedImages: _bannerImage,
              onImageRemoved: (ImageModel? image) {
                setState(() {
                  _bannerImage = [];
                });
              },
              infoText: "Markanın logosu, 800x500 boyutlarında, png veya jpg formatında olmalıdır.",
            ),
            FormFieldWidget(
              context,
              controller: _stkWebsiteController,
              title: "STK'nın Web Sitesi",
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _stkMailController,
              title: "STK'nın Mail Adresi",
              keyboardType: TextInputType.emailAddress,
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _stkPhoneController,
              title: "STK'nın Telefon Numarası",
              keyboardType: TextInputType.phone,
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _stkFounderController,
              title: "STK'nın Kurucusunun Adı Soyadı",
              isRequired: true,
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
                controller: _stkAddressController,
                title: "Sokak ve Kapı Numarası",
                isRequired: true,
              ),
            PickFileWidget(
              context,
              title: "STK'nın Barkodlu Vergi Tüzüğü",
              onFilePicked: (PlatformFile file) {
                setState(() {
                  _tuzukPDF = file;
                });
              },
              onFileRemoved: () {
                setState(() {
                  _tuzukPDF = null;
                });
              },
              infoText: "Dosya, Pdf formatında ve 6mb'dan küçük olmalıdır.",
              selectedFile: _tuzukPDF,
              isRequired: true,
            ),
            PickImageWidget(
              context,
              title: "STK'nın Faaliyet Belgesi",
              isSelectOnlyOne: true,
              onImagePicked: (List<XFile?> image) {
                setState(() {
                  _faaliyetImage.add(ImageModel(
                    imageType: ImageType.asset,
                    file: image[0]!,
                  ));
                });
              },
              selectedImages: _faaliyetImage,
              onImageRemoved: (ImageModel? image) {
                setState(() {
                  _faaliyetImage = [];
                });
              },
            ),
            DropdownWidget(
              context,
              titles: _sectors,
              title: "STK Genel Müdürlüğündeki Faaliyet Alanı",
              isRequired: true,
              selectedIndex: _selectedSectorIndex,
              onChanged: (value) {
                setState(() {
                  _selectedSectorIndex = _sectors.indexOf(value!);
                });
              },
            ),
            DropdownSelectWidget(
              context,
              titles: _categories,
              onSelect: (value) {
                setState(() {
                  _selectedCategories.add(value!);
                });
              },
              onRemove: (value) {
                setState(() {
                  _selectedCategories.remove(value!);
                });
              },
              title: "Kategorisi",
              isRequired: true,
              selectedItems: _selectedCategories,
              selectedIndex: -1,
            ),
            DropdownSelectWidget(
              context,
              titles: _bmItems,
              onSelect: (value) {
                setState(() {
                  selectedBMs.add(value!);
                });
              },
              onRemove: (value) {
                setState(() {
                  selectedBMs.remove(value!);
                });
              },
              title:
                  "BM’nin sürdürülebilir kalkınma amaçlarından hangilerini destekliyor? (Birden fazla amaç seçebilirsiniz.)",
              isRequired: true,
              selectedItems: selectedBMs,
              isNumbered: true,
              selectedIndex: -1,
            ),
            DropdownWidget(
              context,
              titles: _types,
              selectedIndex: _selectedType,
              onChanged: (value) {
                setState(() {
                  _selectedType = _types.indexOf(value!);
                });
              },
              title: "Türü",
              isRequired: true,
            ),
            SizedBox(height: deviceHeightSize(context, 10)),
            GeneralButtonWidget(
              text: "Gönder",
              isLoading: context.watch<STKProvider>().sendFormState == LoadingState.loading,
              onPressed: () {
                if (context.read<STKProvider>().sendFormState == LoadingState.loading) {
                  return;
                }

                if (_stkNameController.text.isNotEmpty &&
                    _stkFullNameController.text.isNotEmpty &&
                    _stkContactPersonController.text.isNotEmpty &&
                    _stkContactPersonPhoneController.text.isNotEmpty &&
                    _stkContactPersonMailController.text.isNotEmpty &&
                    _stkContactPersonJob.text.isNotEmpty &&
                    _logoImage.isNotEmpty &&
                    _bannerImage.isNotEmpty &&
                    _stkWebsiteController.text.isNotEmpty &&
                    _stkMailController.text.isNotEmpty &&
                    _stkPhoneController.text.isNotEmpty &&
                    _stkFounderController.text.isNotEmpty &&
                    selectedIl != null &&
                    selectedIlce != null &&
                    selectedMahalle != null &&
                    _stkAddressController.text.isNotEmpty &&
                    _tuzukPDF != null &&
                    _faaliyetImage.isNotEmpty &&
                    _selectedSectorIndex != -1 &&
                    _selectedCategories.isNotEmpty &&
                    selectedBMs.isNotEmpty &&
                    _selectedType != -1) {
                  context
                      .read<STKProvider>()
                      .sendForm(
                        stkFormModel: STKFormModel(
                          name: _stkNameController.text,
                          website: _stkWebsiteController.text,
                          mail: _stkMailController.text,
                          phone: _stkPhoneController.text,
                          founder: _stkFounderController.text,
                          contactPerson: _stkContactPersonController.text,
                          contactPersonPhone: _stkContactPersonPhoneController.text,
                          contactPersonMail: _stkContactPersonMailController.text,
                          address: _stkAddressController.text,
                          city: selectedIl!,
                          district: selectedIlce!,
                          neighborhood: selectedMahalle!,
                          categories: _selectedCategories,
                          bmCategories: selectedBMs,
                          selectedSector: _sectors[_selectedSectorIndex],
                        ),
                        logoImage: _logoImage,
                        bannerImage: _bannerImage,
                        tuzukPDF: _tuzukPDF,
                        faaliyetImage: _faaliyetImage,
                      )
                      .then((GeneralResponseModel responseModel) {
                    if (responseModel.success == true) {
                      Navigator.pop(context);
                    }

                    ToastWidgets.responseToast(context, responseModel);
                  });
                } else {
                  ToastWidgets.errorToast(
                    context,
                    "Lütfen tüm alanları doldurunuz.",
                  );
                }
              },
            ),
            SizedBox(height: deviceHeightSize(context, 30) + MediaQuery.of(context).viewInsets.bottom),
          ],
        ),
      ),
    );
  }

  final List<String> _sectors = [
    "Mesleki Ve Dayanisma Dernekleri",
    "Dini Hizmetlerin Gerçekleştirilmesine Yönelik Faaliyet Gösteren Dernekler",
    "Spor Ve Spor İle İlgili Dernekleri",
    "İnsani Yardim Dernekleri",
    "Eğitim Araştırma Dernekleri",
    "Kültür, Sanat Ve Turizm Dernekleri",
    "Toplumsal Değerleri Yaşatma Dernekleri",
    "Çevre Doğal Hayat Hayvanları Koruma Dernekleri",
    "Sağlık Alanında Faaliyet Gösteren Dernekler",
    "Bireysel Öğreti Ve Toplumsal Gelişim Dernekleri",
    "İmar, Şehircilik Ve Kalkındırma Dernekleri",
    "Hak Ve Savunuculuk Dernekleri",
    "Engelli Dernekleri",
    "Düşünce Temelli Dernekler",
    "Kamu Kurumlari Ve Personelini Destekleyen Dernekleri",
    "Gida, Tarim Ve Hayvancilik Alaninda Faaliyet Göste",
    "Dış Türkler İle Dayanışma Dernekleri",
    "Uluslararası Teşekküller Ve İşbirliği Dernekleri",
    "Şehit Yakını Ve Gazi Dernekleri",
    "Yasli Ve Çocuklara Yönelik Dernekler",
    "Çocuk Dernekleri",
    "Diğer",
  ];

  final List<String> _categories = [
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

  final List<String> _types = [
    "Dernek",
    "Vakıf",
    "Özel İzinli",
  ];

  final List<String> _bmItems = [
    "Yoksulluğa Son",
    "Açlığa Son",
    "Sağlık Ve Kaliteli Yaşam",
    "Nitelikli Eğitim",
    "Toplumsal Cinsiyet Eşitliği",
    "Temiz Su Ve Sanitasyo",
    "Erişilebilir Ve Temiz Enerji",
    "İnsana Yakışır Iş Ve Ekonomik Büyüme",
    "Sanayi, Yenilikçilik Ve Altyapı",
    "Eşitsizliklerin Azaltılması",
    "Sürdürülebilir Şehirler Ve Topluluklar",
    "Sorumlu Üretim Ve Tüketim",
    "İklim Eylemi",
    "Sudaki Yaşa",
    "Karasal Yaşam",
    "Barış, Adalet Ve Güçlü Kurumlar",
    "Amaçlar İçin Ortaklıklar",
  ];
}
