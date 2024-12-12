import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart'; // Localization için gerekli
import 'package:hangel/models/image_model.dart';
import 'package:hangel/models/stk_form_model.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:hangel/widgets/dropdown_select_widget.dart';
import 'package:hangel/widgets/dropdown_widget.dart';
import 'package:hangel/widgets/form_field_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/pick_file_widget.dart';
import 'package:hangel/widgets/pick_image_widget.dart';
import 'package:hangel/widgets/toast_widgets.dart';
import 'package:iban/iban.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import 'package:provider/provider.dart';

import '../providers/login_register_page_provider.dart';

class STKFormWidget extends StatefulWidget {
  const STKFormWidget({Key? key}) : super(key: key);

  @override
  State<STKFormWidget> createState() => _STKFormWidgetState();
}

class _STKFormWidgetState extends State<STKFormWidget> {
  final _formKey = GlobalKey<FormState>();

  // Controllers for form fields
  final TextEditingController _stkNameController = TextEditingController();
  final TextEditingController _stkFullNameController = TextEditingController();
  final TextEditingController _stkDescriptionController = TextEditingController();
  final TextEditingController _stkIDNoController = TextEditingController();
  final TextEditingController _stkVergiNoController = TextEditingController();
  final TextEditingController _stkVergiDairesiController = TextEditingController();
  final TextEditingController _stkIbanController = TextEditingController();
  final TextEditingController _stkMailController = TextEditingController();
  final TextEditingController _stkPhoneController = TextEditingController();
  final TextEditingController _stkWebsiteController = TextEditingController();
  final TextEditingController _stkAddressController = TextEditingController();
  final TextEditingController _stkKurulusYiliController = TextEditingController();
  final TextEditingController _stkIzinBaslamaController = TextEditingController();
  final TextEditingController _stkIzinBitisController = TextEditingController();
  final TextEditingController _stkFaaliyetNoController = TextEditingController();
  final TextEditingController _stkKampanyaAdiController = TextEditingController();
  final TextEditingController _stkDogumTarihiController = TextEditingController();
  final TextEditingController _stkIzninAmaciController = TextEditingController();

  // Başvuruyu yapan kişinin bilgileri
  final TextEditingController _contactPersonNameController = TextEditingController();
  final TextEditingController _contactPersonPhoneController = TextEditingController();
  final TextEditingController _contactPersonMailController = TextEditingController();
  final TextEditingController _contactPersonJobController = TextEditingController();
  final TextEditingController _contactPersonRelationController = TextEditingController();

  List<ImageModel?> _logoImage = [];
  List<ImageModel?> _photoImage = [];
  PlatformFile? _tuzukPDF;
  PlatformFile? _faaliyetPDF;
  PlatformFile? _valilikIzinBelgesi;
  PlatformFile? _stkIlMudurluguYetkiBelgesi;

  List<String> _selectedCategories = [];
  List<String> _selectedBeneficiaries = [];
  int _selectedSectorIndex = -1;
  List<String> selectedBMs = [];
  int _selectedTypeIndex = -1;

  List<String> iller = [];
  List<String> ilceler = [];
  List<String> mahalleler = [];
  String? selectedIl;
  String? selectedIlce;
  String? selectedMahalle;
  String jsonData = "";

  // Input formatters and regex patterns
  final phoneMaskFormatter = MaskTextInputFormatter(
    mask: '+90 ### ### ## ##',
    filter: {"#": RegExp(r'[0-9]')},
  );

  final numberFormatter = FilteringTextInputFormatter.digitsOnly;

  final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');

  final urlRegex = RegExp(r'^(https?:\/\/)?' // protocol
      r'((([a-zA-Z0-9\-\.]+)\.([a-zA-Z]{2,5}))|' // domain name
      r'(([0-9]{1,3}\.){3}[0-9]{1,3}))' // OR ip (v4) address
      r'(\:[0-9]{1,5})?' // port
      r'(\/[^\s]*)?$' // path
      );

  final _idNoFormatter = MaskTextInputFormatter(
    mask: '##-###-##',
    filter: {"#": RegExp(r'[0-9]')},
  );

  @override
  void initState() {
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      // Get iller from json file /assets/il-ilce.json
      jsonData = await DefaultAssetBundle.of(context).loadString("assets/il-ilce.json");
      setState(() {
        final jsonResult = jsonDecode(jsonData);
        for (var item in jsonResult) {
          if (!iller.contains(item["İL"])) {
            iller.add(item["İL"]);
          }
        }
      });
    });
    super.initState();
  }

  @override
  void dispose() {
    _stkNameController.dispose();
    _stkFullNameController.dispose();
    _stkMailController.dispose();
    _stkPhoneController.dispose();
    _stkWebsiteController.dispose();
    _contactPersonNameController.dispose();
    _contactPersonPhoneController.dispose();
    _contactPersonMailController.dispose();
    _contactPersonJobController.dispose();
    _stkAddressController.dispose();
    _stkIDNoController.dispose();
    _stkVergiNoController.dispose();
    _stkVergiDairesiController.dispose();
    _stkIbanController.dispose();
    _stkKurulusYiliController.dispose();
    _stkIzinBaslamaController.dispose();
    _stkIzinBitisController.dispose();
    _stkFaaliyetNoController.dispose();
    _stkKampanyaAdiController.dispose();
    _stkDogumTarihiController.dispose();
    _stkIzninAmaciController.dispose();
    _contactPersonRelationController.dispose();
    super.dispose();
    context.read<STKProvider>().loadingState = LoadingState.loaded;
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: deviceWidthSize(context, 22),
        ),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Türü Dropdown
              DropdownWidget(
                context,
                titles: _types.map((e) => e['label']!).toList(),
                selectedIndex: _selectedTypeIndex,
                onChanged: (value) {
                  setState(() {
                    _selectedTypeIndex = _types.indexWhere((e) => e['label'] == value);
                  });
                },
                title: "stk_form_type".locale,
                isRequired: true,
              ),
              SizedBox(height: 10),

              // Conditional Fields Based on Type
              if (_selectedTypeIndex != -1 &&
                  _types[_selectedTypeIndex]['key'] != "stk_form_type_special_permission") ...[
                // ID No
                FormFieldWidget(
                  context,
                  controller: _stkIDNoController,
                  title: _getIDNoTitle().locale,
                  isRequired: true,
                  hintText: "11-222-33",
                  keyboardType: TextInputType.number,
                  inputFormatters: [_idNoFormatter],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_id_no'.locale;
                    }
                    if (!_idNoFormatter.isFill()) {
                      return 'stk_form_invalid_id_no'.locale;
                    }
                    return null;
                  },
                ),
                // Vergi No
                FormFieldWidget(
                  context,
                  controller: _stkVergiNoController,
                  title: "stk_form_tax_number".locale,
                  isRequired: true,
                  keyboardType: TextInputType.number,
                  inputFormatters: [numberFormatter],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_tax_number'.locale;
                    }
                    return null;
                  },
                ),
                // Vergi Dairesi
                FormFieldWidget(
                  context,
                  controller: _stkVergiDairesiController,
                  title: "stk_form_tax_office".locale,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_tax_office'.locale;
                    }
                    return null;
                  },
                ),
                // Kısa Adı
                FormFieldWidget(
                  context,
                  controller: _stkNameController,
                  title: "stk_form_short_name".locale,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_short_name'.locale;
                    }
                    return null;
                  },
                ),
                // Tam Adı
                FormFieldWidget(
                  context,
                  controller: _stkFullNameController,
                  title: "stk_form_full_name".locale,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_full_name'.locale;
                    }
                    return null;
                  },
                ),
                // Hakkında
                FormFieldWidget(
                  context,
                  controller: _stkDescriptionController,
                  title: "stk_form_description".locale,
                  maxLines: 3,
                  minLines: 3,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_description'.locale;
                    }
                    return null;
                  },
                ),
                // Kuruluş Yılı
                FormFieldWidget(
                  context,
                  controller: _stkKurulusYiliController,
                  title: "stk_form_establishment_year".locale,
                  isRequired: true,
                  keyboardType: TextInputType.number,
                  inputFormatters: [numberFormatter],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_establishment_year'.locale;
                    }
                    return null;
                  },
                ),
                // IBAN No
                FormFieldWidget(
                  context,
                  controller: _stkIbanController,
                  title: "stk_form_iban_no".locale,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty || !isValid(value.replaceAll(RegExp(r'\s+'), ''))) {
                      return 'stk_form_invalid_iban'.locale;
                    }
                    return null;
                  },
                ),
                // Logosu
                PickImageWidget(
                  context,
                  title: "stk_form_logo".locale,
                  onImagePicked: (List<XFile?> image) {
                    setState(() {
                      _logoImage = [
                        ImageModel(
                          imageType: ImageType.asset,
                          file: image[0]!,
                        ),
                      ];
                    });
                  },
                  selectedImages: _logoImage,
                  isSelectOnlyOne: true,
                  onImageRemoved: (ImageModel? image) {
                    setState(() {
                      _logoImage = [];
                    });
                  },
                  infoText: "stk_form_logo_info".locale,
                  isRequired: true,
                ),
                // Web Sitesi
                FormFieldWidget(
                  context,
                  controller: _stkWebsiteController,
                  title: "stk_form_website".locale,
                  isRequired: false,
                  validator: (value) {
                    if (value == null || value.isEmpty) return null;
                    if (!urlRegex.hasMatch(value)) {
                      return 'stk_form_invalid_website'.locale;
                    }
                    return null;
                  },
                ),
                // Mail Adresi
                FormFieldWidget(
                  context,
                  controller: _stkMailController,
                  title: "stk_form_email".locale,
                  keyboardType: TextInputType.emailAddress,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty || !emailRegex.hasMatch(value)) {
                      return 'stk_form_invalid_email'.locale;
                    }
                    return null;
                  },
                ),
                // Telefon Numarası
                FormFieldWidget(
                  context,
                  controller: _stkPhoneController,
                  title: "stk_form_phone".locale,
                  keyboardType: TextInputType.phone,
                  isRequired: true,
                  inputFormatters: [phoneMaskFormatter],
                  validator: (value) {
                    if (value == null || value.isEmpty || !phoneMaskFormatter.isFill()) {
                      return 'stk_form_invalid_phone'.locale;
                    }
                    return null;
                  },
                ),
                // İl
                DropdownWidget(
                  context,
                  titles: iller,
                  selectedIndex: selectedIl != null ? iller.indexOf(selectedIl!) : -1,
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
                          if (!ilceler.contains(item["İLÇE"])) {
                            ilceler.add(item["İLÇE"]);
                          }
                        }
                      }
                    });
                  },
                  title: "stk_form_city".locale,
                  isRequired: true,
                ),
                // İlçe
                if (selectedIl != null)
                  DropdownWidget(
                    context,
                    titles: ilceler,
                    selectedIndex: selectedIlce != null ? ilceler.indexOf(selectedIlce!) : -1,
                    onChanged: (value) {
                      setState(() {
                        selectedIlce = value;
                        selectedMahalle = null;
                        mahalleler = [];
                        final jsonResult = jsonDecode(jsonData);
                        for (var item in jsonResult) {
                          if (item["İLÇE"] == selectedIlce) {
                            if (!mahalleler.contains(item["MAHALLE"])) {
                              mahalleler.add(item["MAHALLE"]);
                            }
                          }
                        }
                      });
                    },
                    title: "stk_form_district".locale,
                    isRequired: true,
                  ),
                // Mahalle
                if (selectedIlce != null)
                  DropdownWidget(
                    context,
                    titles: mahalleler,
                    selectedIndex: selectedMahalle != null ? mahalleler.indexOf(selectedMahalle!) : -1,
                    onChanged: (value) {
                      setState(() {
                        selectedMahalle = value;
                      });
                    },
                    title: "stk_form_neighborhood".locale,
                    isRequired: true,
                  ),
                // Geriye Kalan Adres Bilgileri
                if (selectedMahalle != null)
                  FormFieldWidget(
                    context,
                    controller: _stkAddressController,
                    title: "stk_form_remaining_address".locale,
                    isRequired: true,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'stk_form_invalid_remaining_address'.locale;
                      }
                      return null;
                    },
                  ),
                // Barkodlu Dernek Tüzüğü, Vakıf Senedi
                PickFileWidget(
                  context,
                  title: "stk_form_statute".locale,
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
                  infoText: "stk_form_statute_info".locale,
                  selectedFile: _tuzukPDF,
                  isRequired: true,
                ),
                // Faaliyet Belgesi
                PickFileWidget(
                  context,
                  title: "stk_form_activity_certificate".locale,
                  onFilePicked: (PlatformFile file) {
                    setState(() {
                      _faaliyetPDF = file;
                    });
                  },
                  onFileRemoved: () {
                    setState(() {
                      _faaliyetPDF = null;
                    });
                  },
                  infoText: "stk_form_activity_certificate_info".locale,
                  selectedFile: _faaliyetPDF,
                  isRequired: true,
                ),
                // STK Genel Müdürlüğündeki Faaliyet Alanı
                DropdownWidget(
                  context,
                  titles: _sectors.map((e) => e['label']!).toList(),
                  title: "stk_form_activity_area".locale,
                  isRequired: true,
                  selectedIndex: _selectedSectorIndex,
                  onChanged: (value) {
                    setState(() {
                      _selectedSectorIndex = _sectors.indexWhere((e) => e['label'] == value);
                    });
                  },
                ),
                // Faydalanıcılar (Kategoriler yerine)
                DropdownSelectWidget(
                  context,
                  titles: _beneficiaries.map((e) => e['label']!).toList(),
                  onSelect: (value) {
                    setState(() {
                      if (!_selectedBeneficiaries.contains(value)) {
                        _selectedBeneficiaries.add(value!);
                      }
                    });
                  },
                  onRemove: (value) {
                    setState(() {
                      _selectedBeneficiaries.remove(value!);
                    });
                  },
                  title: "stk_form_beneficiaries".locale,
                  isRequired: true,
                  selectedItems: _selectedBeneficiaries,
                  selectedIndex: -1,
                ),
                // BM'nin Sürdürülebilir Kalkınma Amaçları
                DropdownSelectWidget(
                  context,
                  titles: _bmItems.map((e) => e['label']!).toList(),
                  onSelect: (value) {
                    setState(() {
                      if (!selectedBMs.contains(value)) {
                        selectedBMs.add(value!);
                      }
                    });
                  },
                  onRemove: (value) {
                    setState(() {
                      selectedBMs.remove(value!);
                    });
                  },
                  title: "stk_form_un_sdgs".locale,
                  isRequired: true,
                  selectedItems: selectedBMs,
                  isNumbered: true,
                  selectedIndex: -1,
                ),
                SizedBox(height: 20),
                // Başvuruyu Yapan Kişinin Bilgileri
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    "stk_form_applicant_info".locale,
                    style: AppTheme.semiBoldTextStyle(
                      context,
                      16,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
                FormFieldWidget(
                  context,
                  controller: _contactPersonNameController,
                  title: "stk_form_applicant_name".locale,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_applicant_name'.locale;
                    }
                    return null;
                  },
                ),
                FormFieldWidget(
                  context,
                  controller: _contactPersonPhoneController,
                  title: "stk_form_applicant_phone".locale,
                  keyboardType: TextInputType.phone,
                  isRequired: true,
                  inputFormatters: [phoneMaskFormatter],
                  validator: (value) {
                    if (value == null || value.isEmpty || !phoneMaskFormatter.isFill()) {
                      return 'stk_form_invalid_applicant_phone'.locale;
                    }
                    return null;
                  },
                ),
                FormFieldWidget(
                  context,
                  controller: _contactPersonMailController,
                  title: "stk_form_applicant_email".locale,
                  keyboardType: TextInputType.emailAddress,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty || !emailRegex.hasMatch(value)) {
                      return 'stk_form_invalid_applicant_email'.locale;
                    }
                    return null;
                  },
                ),
                FormFieldWidget(
                  context,
                  controller: _contactPersonJobController,
                  title: "stk_form_applicant_position".locale,
                  isRequired: _types[_selectedTypeIndex]['key'] != "stk_form_type_special_permission",
                  validator: (value) {
                    if ((_types[_selectedTypeIndex]['key'] != "stk_form_type_special_permission") &&
                        (value == null || value.isEmpty)) {
                      return 'stk_form_invalid_applicant_position'.locale;
                    }
                    return null;
                  },
                ),
              ] else if (_selectedTypeIndex != -1 &&
                  _types[_selectedTypeIndex]['key'] == "stk_form_type_special_permission") ...[
                // Valilik İzin Belgesi
                PickFileWidget(
                  context,
                  title: "stk_form_governorate_permission_document".locale,
                  onFilePicked: (PlatformFile file) {
                    setState(() {
                      _valilikIzinBelgesi = file;
                    });
                  },
                  onFileRemoved: () {
                    setState(() {
                      _valilikIzinBelgesi = null;
                    });
                  },
                  infoText: "stk_form_governorate_permission_document_info".locale,
                  selectedFile: _valilikIzinBelgesi,
                  isRequired: true,
                ),
                // STK İl Müdürlüğü Yetki Belgesi
                PickFileWidget(
                  context,
                  title: "stk_form_stk_il_mudurlugu_yetki_belgesi".locale,
                  onFilePicked: (PlatformFile file) {
                    setState(() {
                      _stkIlMudurluguYetkiBelgesi = file;
                    });
                  },
                  onFileRemoved: () {
                    setState(() {
                      _stkIlMudurluguYetkiBelgesi = null;
                    });
                  },
                  infoText: "stk_form_stk_il_mudurlugu_yetki_belgesi_info".locale,
                  selectedFile: _stkIlMudurluguYetkiBelgesi,
                  isRequired: true,
                ),
                // İzin Başlama Tarihi
                FormFieldWidget(
                  context,
                  controller: _stkIzinBaslamaController,
                  title: "stk_form_permission_start_date".locale,
                  isRequired: true,
                  readOnly: true,
                  ontap: () => _selectDate(context, _stkIzinBaslamaController),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_permission_start_date'.locale;
                    }
                    return null;
                  },
                ),
                // İzin Bitiş Tarihi
                FormFieldWidget(
                  context,
                  controller: _stkIzinBitisController,
                  title: "stk_form_permission_end_date".locale,
                  isRequired: true,
                  readOnly: true,
                  ontap: () => _selectDate(context, _stkIzinBitisController),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_permission_end_date'.locale;
                    }
                    return null;
                  },
                ),
                // İzni Veren Valilik
                DropdownWidget(
                  context,
                  titles: iller,
                  selectedIndex: selectedIl != null ? iller.indexOf(selectedIl!) : -1,
                  onChanged: (value) {
                    setState(() {
                      selectedIl = value;
                    });
                  },
                  title: "stk_form_permission_granting_governorate".locale,
                  isRequired: true,
                ),
                // Faaliyet No
                FormFieldWidget(
                  context,
                  controller: _stkFaaliyetNoController,
                  title: "stk_form_activity_number".locale,
                  isRequired: true,
                  keyboardType: TextInputType.number,
                  hintText: "11-222-33",
                  inputFormatters: [_idNoFormatter],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_activity_number'.locale;
                    }
                    if (!_idNoFormatter.isFill()) {
                      return 'stk_form_invalid_activity_number'.locale;
                    }
                    return null;
                  },
                ),
                // Kampanyanın Adı
                FormFieldWidget(
                  context,
                  controller: _stkKampanyaAdiController,
                  title: "stk_form_campaign_name".locale,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_campaign_name'.locale;
                    }
                    return null;
                  },
                ),
                // Doğum Tarihi
                FormFieldWidget(
                  context,
                  controller: _stkDogumTarihiController,
                  title: "stk_form_birth_date".locale,
                  isRequired: true,
                  readOnly: true,
                  ontap: () => _selectDate(context, _stkDogumTarihiController),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_birth_date'.locale;
                    }
                    return null;
                  },
                ),
                // Fotoğrafı
                PickImageWidget(
                  context,
                  title: "stk_form_photo".locale,
                  onImagePicked: (List<XFile?> image) {
                    setState(() {
                      _photoImage = [
                        ImageModel(
                          imageType: ImageType.asset,
                          file: image[0]!,
                        ),
                      ];
                    });
                  },
                  selectedImages: _photoImage,
                  isSelectOnlyOne: true,
                  onImageRemoved: (ImageModel? image) {
                    setState(() {
                      _photoImage = [];
                    });
                  },
                  infoText: "stk_form_photo_info".locale,
                  isRequired: true,
                ),
                // IBAN No
                FormFieldWidget(
                  context,
                  controller: _stkIbanController,
                  title: "stk_form_iban_no".locale,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty || !isValid(value.replaceAll(RegExp(r'\s+'), ''))) {
                      return 'stk_form_invalid_iban'.locale;
                    }
                    return null;
                  },
                ),
                // Web Sitesi
                FormFieldWidget(
                  context,
                  controller: _stkWebsiteController,
                  title: "stk_form_website".locale,
                  isRequired: false,
                  validator: (value) {
                    if (value == null || value.isEmpty) return null;
                    if (!urlRegex.hasMatch(value)) {
                      return 'stk_form_invalid_website'.locale;
                    }
                    return null;
                  },
                ),
                // İl
                DropdownWidget(
                  context,
                  titles: iller,
                  selectedIndex: selectedIl != null ? iller.indexOf(selectedIl!) : -1,
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
                          if (!ilceler.contains(item["İLÇE"])) {
                            ilceler.add(item["İLÇE"]);
                          }
                        }
                      }
                    });
                  },
                  title: "stk_form_city".locale,
                  isRequired: true,
                ),
                // İlçe
                if (selectedIl != null)
                  DropdownWidget(
                    context,
                    titles: ilceler,
                    selectedIndex: selectedIlce != null ? ilceler.indexOf(selectedIlce!) : -1,
                    onChanged: (value) {
                      setState(() {
                        selectedIlce = value;
                        selectedMahalle = null;
                        mahalleler = [];
                        final jsonResult = jsonDecode(jsonData);
                        for (var item in jsonResult) {
                          if (item["İLÇE"] == selectedIlce) {
                            if (!mahalleler.contains(item["MAHALLE"])) {
                              mahalleler.add(item["MAHALLE"]);
                            }
                          }
                        }
                      });
                    },
                    title: "stk_form_district".locale,
                    isRequired: true,
                  ),
                // Mahalle
                if (selectedIlce != null)
                  DropdownWidget(
                    context,
                    titles: mahalleler,
                    selectedIndex: selectedMahalle != null ? mahalleler.indexOf(selectedMahalle!) : -1,
                    onChanged: (value) {
                      setState(() {
                        selectedMahalle = value;
                      });
                    },
                    title: "stk_form_neighborhood".locale,
                    isRequired: true,
                  ),
                // Geriye Kalan Adres Bilgileri
                if (selectedMahalle != null)
                  FormFieldWidget(
                    context,
                    controller: _stkAddressController,
                    title: "stk_form_remaining_address".locale,
                    isRequired: true,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'stk_form_invalid_remaining_address'.locale;
                      }
                      return null;
                    },
                  ),
                // İznin Amacı
                FormFieldWidget(
                  context,
                  controller: _stkIzninAmaciController,
                  title: "stk_form_permission_purpose".locale,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_permission_purpose'.locale;
                    }
                    return null;
                  },
                ),
                // Hakkında
                FormFieldWidget(
                  context,
                  controller: _stkDescriptionController,
                  title: "stk_form_description".locale,
                  maxLines: 3,
                  minLines: 3,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_description'.locale;
                    }
                    return null;
                  },
                ),
                // Faydalanıcılar (Kategoriler yerine)
                DropdownSelectWidget(
                  context,
                  titles: _beneficiaries.map((e) => e['label']!).toList(),
                  onSelect: (value) {
                    setState(() {
                      if (!_selectedBeneficiaries.contains(value)) {
                        _selectedBeneficiaries.add(value!);
                      }
                    });
                  },
                  onRemove: (value) {
                    setState(() {
                      _selectedBeneficiaries.remove(value!);
                    });
                  },
                  title: "stk_form_beneficiaries".locale,
                  isRequired: true,
                  selectedItems: _selectedBeneficiaries,
                  selectedIndex: -1,
                ),
                // BM'nin Sürdürülebilir Kalkınma Amaçları
                DropdownSelectWidget(
                  context,
                  titles: _bmItems.map((e) => e['label']!).toList(),
                  onSelect: (value) {
                    setState(() {
                      if (!selectedBMs.contains(value)) {
                        selectedBMs.add(value!);
                      }
                    });
                  },
                  onRemove: (value) {
                    setState(() {
                      selectedBMs.remove(value!);
                    });
                  },
                  title: "stk_form_un_sdgs".locale,
                  isRequired: true,
                  selectedItems: selectedBMs,
                  isNumbered: true,
                  selectedIndex: -1,
                ),
                SizedBox(height: 20),
                // Başvuruyu Yapan Kişinin Bilgileri
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    "stk_form_applicant_info".locale,
                    style: AppTheme.semiBoldTextStyle(
                      context,
                      16,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
                FormFieldWidget(
                  context,
                  controller: _contactPersonNameController,
                  title: "stk_form_applicant_name".locale,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_applicant_name'.locale;
                    }
                    return null;
                  },
                ),
                FormFieldWidget(
                  context,
                  controller: _contactPersonPhoneController,
                  title: "stk_form_applicant_phone".locale,
                  keyboardType: TextInputType.phone,
                  isRequired: true,
                  inputFormatters: [phoneMaskFormatter],
                  validator: (value) {
                    if (value == null || value.isEmpty || !phoneMaskFormatter.isFill()) {
                      return 'stk_form_invalid_applicant_phone'.locale;
                    }
                    return null;
                  },
                ),
                FormFieldWidget(
                  context,
                  controller: _contactPersonMailController,
                  title: "stk_form_applicant_email".locale,
                  keyboardType: TextInputType.emailAddress,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty || !emailRegex.hasMatch(value)) {
                      return 'stk_form_invalid_applicant_email'.locale;
                    }
                    return null;
                  },
                ),
                FormFieldWidget(
                  context,
                  controller: _contactPersonRelationController,
                  title: "stk_form_applicant_relation".locale,
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'stk_form_invalid_applicant_relation'.locale;
                    }
                    return null;
                  },
                ),
              ],

              SizedBox(height: deviceHeightSize(context, 10)),
              GeneralButtonWidget(
                text: "stk_form_submit".locale,
                isLoading: context.watch<STKProvider>().sendFormState == LoadingState.loading,
                onPressed: _submitForm,
              ),
              SizedBox(
                height: deviceHeightSize(context, 30) + MediaQuery.of(context).viewInsets.bottom,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Get ID No title based on selected type
  String _getIDNoTitle() {
    if (_selectedTypeIndex != -1) {
      String selectedKey = _types[_selectedTypeIndex]['key']!;
      if (selectedKey == "stk_form_type_association" || selectedKey == "stk_form_type_sports_club") {
        return "stk_form_registry_number";
      } else if (selectedKey == "stk_form_type_foundation") {
        return "stk_form_registry_number_foundation";
      } else if (selectedKey == "stk_form_type_special_permission") {
        return "stk_form_activity_number";
      }
    }
    return "ID No";
  }

  // Date picker for selecting dates
  void _selectDate(BuildContext context, TextEditingController controller) async {
    DateTime initialDate = DateTime.now();
    DateTime firstDate = DateTime(1900);
    DateTime lastDate = DateTime(2100);

    final DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: lastDate,
      locale: Locale('tr'), // Dil ayarı
    );

    if (pickedDate != null) {
      setState(() {
        controller.text = "${pickedDate.day}/${pickedDate.month}/${pickedDate.year}";
      });
    }
  }

  // Submit form
  // Submit form
  void _submitForm() async {
    if (context.read<STKProvider>().sendFormState == LoadingState.loading) return;
    if (_formKey.currentState == null) return;
    if (_logoImage.isEmpty) {
      Get.snackbar("Eksik Veri", "Logo resmi secilmedi.");
      return;
    }
    if (_formKey.currentState!.validate()) {
      // Seçilen türün anahtarını alıyoruz
      String selectedTypeKey = _types[_selectedTypeIndex]['label']!;

      // Başvuruyu yapan kişinin bilgileri
      String applicantName = _contactPersonNameController.text;
      String applicantPhone = _contactPersonPhoneController.text;
      String applicantEmail = _contactPersonMailController.text;
      String? applicantPosition = _contactPersonJobController.text;
      String? applicantRelation = _contactPersonRelationController.text;

      // Ortak alanları alıyoruz
      String iban = _stkIbanController.text;
      String website = _stkWebsiteController.text;
      String email = _stkMailController.text;
      String phone = _stkPhoneController.text;
      String city = selectedIl ?? '';
      String district = selectedIlce ?? '';
      String neighborhood = selectedMahalle ?? '';
      String address = _stkAddressController.text;
      String description = _stkDescriptionController.text;
      // Faydalanıcılar ve BM amaçları
      List<String> beneficiaries = _selectedBeneficiaries.map((e) {
        int index = _beneficiaries.indexWhere((element) => element['label'] == e);
        return _beneficiaries[index]['key']!;
      }).toList();

      List<String> unSdgs = selectedBMs.map((e) {
        int index = _bmItems.indexWhere((element) => element['label'] == e);
        return _bmItems[index]['key']!;
      }).toList();

      // STKFormModel'i oluşturuyoruz
      STKFormModel stkFormModel = STKFormModel(
        type: selectedTypeKey,
        iban: iban,
        website: website,
        email: email,
        phone: phone,
        city: city,
        district: district,
        neighborhood: neighborhood,
        description: description,
        address: address,
        beneficiaries: beneficiaries
            .map(
              (e) => e.locale,
            )
            .toList(),
        unSdgs: unSdgs
            .map(
              (e) => e.locale,
            )
            .toList(),
        applicantName: applicantName,
        applicantPhone: applicantPhone,
        applicantEmail: applicantEmail,
        applicantPosition: applicantPosition,
        applicantRelation: applicantRelation,
      );

      // Seçilen türe göre alanları ekliyoruz
      if (selectedTypeKey != "stk_form_type_special_permission") {
        // Diğer türler için alanlar
        stkFormModel.idNo = _stkIDNoController.text;
        stkFormModel.taxNumber = _stkVergiNoController.text;
        stkFormModel.taxOffice = _stkVergiDairesiController.text;
        stkFormModel.shortName = _stkNameController.text;
        stkFormModel.fullName = _stkFullNameController.text;
        stkFormModel.establishmentYear = _stkKurulusYiliController.text;
        stkFormModel.activityArea = _sectors[_selectedSectorIndex]['label'];
      } else {
        // Özel izin ile yardım toplayan için alanlar
        stkFormModel.permissionStartDate = _stkIzinBaslamaController.text;
        stkFormModel.permissionEndDate = _stkIzinBitisController.text;
        stkFormModel.permissionGrantingGovernorate = selectedIl;
        stkFormModel.activityNumber = _stkFaaliyetNoController.text;
        stkFormModel.campaignName = _stkKampanyaAdiController.text;
        stkFormModel.birthDate = _stkDogumTarihiController.text;
        stkFormModel.permissionPurpose = _stkIzninAmaciController.text;
      }

      // Form verilerini gönderiyoruz
      var response = await context.read<STKProvider>().sendForm(
            stkFormModel,
            logoImage: _logoImage.isNotEmpty ? _logoImage[0] : null,
            statuteFile: _tuzukPDF,
            activityCertificateFile: _faaliyetPDF,
            photoImage: _photoImage.isNotEmpty ? _photoImage[0] : null,
            governoratePermissionDocument: _valilikIzinBelgesi,
            stkIlMudurluguYetkiBelgesi: _stkIlMudurluguYetkiBelgesi,
          );

      if (response.success ?? false) {
        // Başarılı mesajı göster
        ToastWidgets.successToast(context, response.message ?? "stk_form_submission_success".locale);
        // Formu sıfırlayabilirsiniz veya başka bir sayfaya yönlendirebilirsiniz
        _formKey.currentState!.reset();
        setState(() {
          _selectedTypeIndex = -1;
          _selectedSectorIndex = -1;
          _selectedBeneficiaries.clear();
          selectedBMs.clear();
          _logoImage.clear();
          _photoImage.clear();
          _tuzukPDF = null;
          _faaliyetPDF = null;
          _valilikIzinBelgesi = null;
          _stkIlMudurluguYetkiBelgesi = null;
          selectedIl = null;
          selectedIlce = null;
          selectedMahalle = null;
          ilceler.clear();
          mahalleler.clear();
          Navigator.pop(context);
        });
      } else {
        // Hata mesajı göster
        ToastWidgets.errorToast(context, response.message ?? "stk_form_submission_error".locale);
      }
    } else {
      // Validasyon hatası
      ToastWidgets.errorToast(context, "stk_form_validation_error".locale);
    }
  }

  // Türler listesi güncellendi
  final List<Map<String, String>> _types = [
    {"key": "stk_form_type_association", "label": "stk_form_type_association".locale},
    {"key": "stk_form_type_foundation", "label": "stk_form_type_foundation".locale},
    {"key": "stk_form_type_sports_club", "label": "stk_form_type_sports_club".locale},
    {"key": "stk_form_type_special_permission", "label": "stk_form_type_special_permission".locale},
  ];

  // Sektörler listesi güncellendi
  final List<Map<String, String>> _sectors = [
    {"key": "stk_form_sector_professional_associations", "label": "stk_form_sector_professional_associations".locale},
    {"key": "stk_form_sector_religious_services", "label": "stk_form_sector_religious_services".locale},
    {"key": "stk_form_sector_sports", "label": "stk_form_sector_sports".locale},
    {"key": "stk_form_sector_humanitarian_aid", "label": "stk_form_sector_humanitarian_aid".locale},
    {"key": "stk_form_sector_education_research", "label": "stk_form_sector_education_research".locale},
    {"key": "stk_form_sector_culture_art_tourism", "label": "stk_form_sector_culture_art_tourism".locale},
    {"key": "stk_form_sector_social_values", "label": "stk_form_sector_social_values".locale},
    {"key": "stk_form_sector_environment", "label": "stk_form_sector_environment".locale},
    {"key": "stk_form_sector_health", "label": "stk_form_sector_health".locale},
    {"key": "stk_form_sector_personal_development", "label": "stk_form_sector_personal_development".locale},
    {"key": "stk_form_sector_urban_development", "label": "stk_form_sector_urban_development".locale},
    {"key": "stk_form_sector_advocacy", "label": "stk_form_sector_advocacy".locale},
    {"key": "stk_form_sector_disabilities", "label": "stk_form_sector_disabilities".locale},
    {"key": "stk_form_sector_thought_based", "label": "stk_form_sector_thought_based".locale},
    {"key": "stk_form_sector_public_support", "label": "stk_form_sector_public_support".locale},
    {"key": "stk_form_sector_food_agriculture", "label": "stk_form_sector_food_agriculture".locale},
    {"key": "stk_form_sector_diaspora", "label": "stk_form_sector_diaspora".locale},
    {"key": "stk_form_sector_international_cooperation", "label": "stk_form_sector_international_cooperation".locale},
    {"key": "stk_form_sector_veterans", "label": "stk_form_sector_veterans".locale},
    {"key": "stk_form_sector_elderly_children", "label": "stk_form_sector_elderly_children".locale},
    {"key": "stk_form_sector_children", "label": "stk_form_sector_children".locale},
    {"key": "stk_form_sector_other", "label": "stk_form_sector_other".locale},
  ];

  // Faydalanıcılar listesi güncellendi
  final List<Map<String, String>> _beneficiaries = [
    {"key": "stk_form_beneficiaries_animals", "label": "stk_form_beneficiaries_animals".locale},
    {"key": "stk_form_beneficiaries_poor", "label": "stk_form_beneficiaries_poor".locale},
    {"key": "stk_form_beneficiaries_education", "label": "stk_form_beneficiaries_education".locale},
    {"key": "stk_form_beneficiaries_health", "label": "stk_form_beneficiaries_health".locale},
    {"key": "stk_form_beneficiaries_agriculture", "label": "stk_form_beneficiaries_agriculture".locale},
    {"key": "stk_form_beneficiaries_refugees", "label": "stk_form_beneficiaries_refugees".locale},
    {"key": "stk_form_beneficiaries_law", "label": "stk_form_beneficiaries_law".locale},
    {"key": "stk_form_beneficiaries_earthquake", "label": "stk_form_beneficiaries_earthquake".locale},
    {"key": "stk_form_beneficiaries_food", "label": "stk_form_beneficiaries_food".locale},
    {"key": "stk_form_beneficiaries_religious", "label": "stk_form_beneficiaries_religious".locale},
    {
      "key": "stk_form_beneficiaries_social_entrepreneurship",
      "label": "stk_form_beneficiaries_social_entrepreneurship".locale
    },
    {"key": "stk_form_beneficiaries_entrepreneurship", "label": "stk_form_beneficiaries_entrepreneurship".locale},
    {"key": "stk_form_beneficiaries_culture_art", "label": "stk_form_beneficiaries_culture_art".locale},
    {"key": "stk_form_beneficiaries_sports", "label": "stk_form_beneficiaries_sports".locale},
    {"key": "stk_form_beneficiaries_nature", "label": "stk_form_beneficiaries_nature".locale},
  ];

  // BM Sürdürülebilir Kalkınma Amaçları listesi güncellendi
  final List<Map<String, String>> _bmItems = [
    {"key": "stk_form_un_goal_no_poverty", "label": "stk_form_un_goal_no_poverty".locale},
    {"key": "stk_form_un_goal_zero_hunger", "label": "stk_form_un_goal_zero_hunger".locale},
    {"key": "stk_form_un_goal_good_health", "label": "stk_form_un_goal_good_health".locale},
    {"key": "stk_form_un_goal_quality_education", "label": "stk_form_un_goal_quality_education".locale},
    {"key": "stk_form_un_goal_gender_equality", "label": "stk_form_un_goal_gender_equality".locale},
    {"key": "stk_form_un_goal_clean_water", "label": "stk_form_un_goal_clean_water".locale},
    {"key": "stk_form_un_goal_clean_energy", "label": "stk_form_un_goal_clean_energy".locale},
    {"key": "stk_form_un_goal_decent_work", "label": "stk_form_un_goal_decent_work".locale},
    {"key": "stk_form_un_goal_industry", "label": "stk_form_un_goal_industry".locale},
    {"key": "stk_form_un_goal_reduced_inequalities", "label": "stk_form_un_goal_reduced_inequalities".locale},
    {"key": "stk_form_un_goal_sustainable_cities", "label": "stk_form_un_goal_sustainable_cities".locale},
    {"key": "stk_form_un_goal_responsible_consumption", "label": "stk_form_un_goal_responsible_consumption".locale},
    {"key": "stk_form_un_goal_climate_action", "label": "stk_form_un_goal_climate_action".locale},
    {"key": "stk_form_un_goal_life_below_water", "label": "stk_form_un_goal_life_below_water".locale},
    {"key": "stk_form_un_goal_life_on_land", "label": "stk_form_un_goal_life_on_land".locale},
    {"key": "stk_form_un_goal_peace_justice", "label": "stk_form_un_goal_peace_justice".locale},
    {"key": "stk_form_un_goal_partnerships", "label": "stk_form_un_goal_partnerships".locale},
  ];
}
