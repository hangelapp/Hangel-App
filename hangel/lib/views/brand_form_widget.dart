// brand_form_widget.dart
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/models/brand_form_model.dart';
import 'package:hangel/models/image_model.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/widgets/dropdown_select_widget.dart';
import 'package:hangel/widgets/dropdown_widget.dart';
import 'package:hangel/widgets/form_field_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/pick_image_widget.dart';
import 'package:hangel/widgets/toast_widgets.dart';
import 'package:iban/iban.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../models/brand_model.dart';
import '../providers/login_register_page_provider.dart';

class BrandFormWidget extends StatefulWidget {
  const BrandFormWidget({super.key});

  @override
  State<BrandFormWidget> createState() => _BrandFormWidgetState();
}

class _BrandFormWidgetState extends State<BrandFormWidget> {
  final _formKey = GlobalKey<FormState>();

  // Controllers for form fields
  final TextEditingController _brandNameController = TextEditingController();
  final TextEditingController _brandMailController = TextEditingController();
  final TextEditingController _brandPhoneController = TextEditingController();
  // Removed: Brand founder is no longer needed.
  final TextEditingController _brandWebsiteController = TextEditingController();
  final TextEditingController _brandContactPersonController = TextEditingController();
  final TextEditingController _brandContactPersonPhoneController = TextEditingController();
  final TextEditingController _brandContactPersonMailController = TextEditingController();
  final TextEditingController _brandContactPersonJob = TextEditingController();
  final TextEditingController _brandVergiNoController = TextEditingController();
  final TextEditingController _brandVergiDaireController = TextEditingController();
  final TextEditingController _brandIbanController = TextEditingController();

  List<ImageModel?> _logoImage = [];
  // Removed: Banner and vergi levhası image fields are no longer needed.

  // Address data
  List<String> iller = [];
  List<String> ilceler = [];
  List<String> mahalleler = [];
  String? selectedIl;
  String? selectedIlce;
  String? selectedMahalle;
  String jsonData = "";

  // Başvuru Tipi (Application Type) – options: Sosyal İşletmeler, Ticari İşletmeler, Kooperatifler
  int _selectedApplicationTypeIndex = -1;
  final List<Map<String, String>> _applicationTypes = [
    {"key": "brand_form_type_social", "label": "brand_form_type_social".locale},
    {"key": "brand_form_type_commercial", "label": "brand_form_type_commercial".locale},
    {"key": "brand_form_type_cooperative", "label": "brand_form_type_cooperative".locale},
  ];

  // Additional fields for Sosyal İşletmeler ve Kooperatifler
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
    {"key": "stk_form_beneficiaries_social_entrepreneurship", "label": "stk_form_beneficiaries_social_entrepreneurship".locale},
    {"key": "stk_form_beneficiaries_entrepreneurship", "label": "stk_form_beneficiaries_entrepreneurship".locale},
    {"key": "stk_form_beneficiaries_culture_art", "label": "stk_form_beneficiaries_culture_art".locale},
    {"key": "stk_form_beneficiaries_sports", "label": "stk_form_beneficiaries_sports".locale},
    {"key": "stk_form_beneficiaries_nature", "label": "stk_form_beneficiaries_nature".locale},
  ];
  final List<String> _selectedBeneficiaries = [];

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
  final List<String> _selectedBMItems = [];

  // Deprem Bölgesi (Earthquake Zone) switch value
  bool _isDepremBolgesi = false;

  // Kategori ve bağış oranı alanları (her kategori için ayrı)
  final List<int> _selectedCategories = [-1];
  final List<TextEditingController> _categoryControllers = [
    TextEditingController(),
  ];
  final List<String> _categories = [
    "brand_form_page_kategori_tekstil".locale,
    "brand_form_page_kategori_saglik_gerecleri".locale,
    "brand_form_page_kategori_saglik_hizmetleri".locale,
    "brand_form_page_kategori_elektronik".locale,
    "brand_form_page_kategori_yedek_parca".locale,
    "brand_form_page_kategori_teknik_servis".locale,
    "brand_form_page_kategori_danismanlik".locale,
    "brand_form_page_kategori_gayrimenkul".locale,
    "brand_form_page_kategori_aracilik".locale,
    "brand_form_page_kategori_yazilim".locale,
    "brand_form_page_kategori_insaat_malzemeleri".locale,
    "brand_form_page_kategori_insaat_hizmetleri".locale,
    "brand_form_page_kategori_lojistik".locale,
    "brand_form_page_kategori_otomotiv".locale,
    "brand_form_page_kategori_konaklama".locale,
    "brand_form_page_kategori_yeme_icme".locale,
    "brand_form_page_kategori_mimar".locale,
    "brand_form_page_kategori_beyaz_esya".locale,
    "brand_form_page_kategori_elektrikli_ev_aletleri".locale,
    "brand_form_page_kategori_kisisel_bakim".locale,
    "brand_form_page_kategori_ev_ve_yasam".locale,
    "brand_form_page_kategori_muzik_enstruman".locale,
    "brand_form_page_kategori_telefon".locale,
    "brand_form_page_kategori_televizyon".locale,
    "brand_form_page_kategori_bilgisayar".locale,
    "brand_form_page_kategori_konsol".locale,
    "brand_form_page_kategori_kamera".locale,
    "brand_form_page_kategori_ofis_malzemeleri".locale,
    "brand_form_page_kategori_spor_outdoor".locale,
    "brand_form_page_kategori_kitap".locale,
    "brand_form_page_kategori_kirtasiye".locale,
    "brand_form_page_kategori_5000_ustu".locale,
    "brand_form_page_kategori_kampanyali_urunler".locale,
  ];

  @override
  void initState() {
    super.initState();
    SchedulerBinding.instance.addPostFrameCallback((_) async {
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
  }

  @override
  void dispose() {
    _brandNameController.dispose();
    _brandMailController.dispose();
    _brandPhoneController.dispose();
    _brandWebsiteController.dispose();
    _brandContactPersonController.dispose();
    _brandContactPersonPhoneController.dispose();
    _brandContactPersonMailController.dispose();
    _brandContactPersonJob.dispose();
    _brandVergiNoController.dispose();
    _brandVergiDaireController.dispose();
    _brandIbanController.dispose();
    for (var controller in _categoryControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: deviceWidthSize(context, 22)),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Marka Adı
              FormFieldWidget(
                context,
                controller: _brandNameController,
                title: "brand_form_page_marka_adi".locale,
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'brand_form_page_gecersiz_marka_adi'.locale;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 10),
              // Başvuru Tipi Dropdown
              DropdownWidget(
                context,
                titles: _applicationTypes.map((e) => e['label']!).toList(),
                selectedIndex: _selectedApplicationTypeIndex,
                onChanged: (value) {
                  setState(() {
                    _selectedApplicationTypeIndex =
                        _applicationTypes.indexWhere((e) => e['label'] == value);
                  });
                },
                title: "brand_form_page_basvuru_tipi".locale,
                isRequired: true,
              ),
              const SizedBox(height: 10),
              // Yetkili Kişi Bilgileri
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "brand_form_page_yetkili_kisi_bilgileri".locale,
                  style: AppTheme.semiBoldTextStyle(context, 16, color: AppTheme.primaryColor),
                ),
              ),
              FormFieldWidget(
                context,
                controller: _brandContactPersonController,
                title: "brand_form_page_ad_soyad".locale,
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'brand_form_page_gecersiz_ad_soyad'.locale;
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _brandContactPersonPhoneController,
                keyboardType: TextInputType.phone,
                title: "brand_form_page_telefon_numarasi".locale,
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'brand_form_page_gecersiz_telefon_numarasi'.locale;
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _brandContactPersonMailController,
                title: "brand_form_page_mail_adresi".locale,
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'brand_form_page_gecersiz_mail_adresi'.locale;
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _brandContactPersonJob,
                title: "brand_form_page_gorevi_pozisyonu".locale,
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'brand_form_page_gecersiz_gorev_pozisyonu'.locale;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 10),
              // Logo Görseli
              PickImageWidget(
                context,
                title: "brand_form_page_logo".locale,
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
                infoText: "brand_form_page_logo_info".locale,
              ),
              const SizedBox(height: 10),
              // Web Sitesi
              FormFieldWidget(
                context,
                controller: _brandWebsiteController,
                title: "brand_form_page_web_sitesi".locale,
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'brand_form_page_gecersiz_web_sitesi'.locale;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 10),
              // Marka Mail Adresi
              FormFieldWidget(
                context,
                controller: _brandMailController,
                title: "brand_form_page_markanin_mail_adresi".locale,
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'brand_form_page_gecersiz_mail_adresi'.locale;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 10),
              // Marka Telefon Numarası
              FormFieldWidget(
                context,
                controller: _brandPhoneController,
                keyboardType: TextInputType.phone,
                title: "brand_form_page_markanin_telefon_numarasi".locale,
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'brand_form_page_gecersiz_telefon_numarasi'.locale;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 10),
              // Adres Bölümü: İl, İlçe, Mahalle
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
                title: "brand_form_page_il".locale,
                isRequired: true,
              ),
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
                  title: "brand_form_page_ilce".locale,
                  isRequired: true,
                ),
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
                  title: "brand_form_page_mahalle".locale,
                  isRequired: true,
                ),
              const SizedBox(height: 10),
              // Vergi Numarası
              FormFieldWidget(
                context,
                controller: _brandVergiNoController,
                keyboardType: TextInputType.number,
                title: "brand_form_page_vergi_numarasi".locale,
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'brand_form_page_gecersiz_vergi_numarasi'.locale;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 10),
              // Vergi Dairesi
              FormFieldWidget(
                context,
                controller: _brandVergiDaireController,
                keyboardType: TextInputType.text,
                title: "brand_form_page_vergi_dairesi".locale,
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'brand_form_page_gecersiz_vergi_dairesi'.locale;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 10),
              // Ekstra Alanlar: Sosyal İşletme ve Kooperatifler için
              if (_selectedApplicationTypeIndex == 0 || _selectedApplicationTypeIndex == 2) ...[
                // Faydalanıcılar (Beneficiaries)
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
                  title: "brand_form_page_faydalanicilar".locale,
                  isRequired: true,
                  selectedItems: _selectedBeneficiaries,
                  selectedIndex: -1,
                ),
                const SizedBox(height: 10),
                // BM'nin Sürdürülebilir Kalkınma Amaçları
                DropdownSelectWidget(
                  context,
                  titles: _bmItems.map((e) => e['label']!).toList(),
                  onSelect: (value) {
                    setState(() {
                      if (!_selectedBMItems.contains(value)) {
                        _selectedBMItems.add(value!);
                      }
                    });
                  },
                  onRemove: (value) {
                    setState(() {
                      _selectedBMItems.remove(value!);
                    });
                  },
                  title: "brand_form_page_un_sdgs".locale,
                  isRequired: true,
                  selectedItems: _selectedBMItems,
                  isNumbered: true,
                  selectedIndex: -1,
                ),
                const SizedBox(height: 10),
                // Deprem Bölgesi Switch
                SwitchListTile(
                  title: Text("brand_form_page_deprem_bolgesi".locale),
                  value: _isDepremBolgesi,
                  onChanged: (value) {
                    setState(() {
                      _isDepremBolgesi = value;
                    });
                  },
                  activeColor: AppTheme.primaryColor,
                ),
              ],
              const SizedBox(height: 10),
              // IBAN
              FormFieldWidget(
                context,
                controller: _brandIbanController,
                title: "brand_form_page_iban_numarasi".locale,
                isRequired: true,
                validator: (value) {
                  if (value == null ||
                      value.isEmpty ||
                      !isValid(value.replaceAll(RegExp(r'\s+'), ''))) {
                    return 'brand_form_page_gecersiz_iban_numarasi'.locale;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 10),
              // Kategori ve Bağış Oranı (her kategori için ayrı)
              ...List.generate(
                _selectedCategories.length,
                (index) => Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: DropdownWidget(
                            context,
                            titles: _categories,
                            selectedIndex: _selectedCategories[index],
                            onChanged: (value) {
                              if (_selectedCategories
                                  .any((element) => element == _categories.indexOf(value!))) {
                                ToastWidgets.errorToast(
                                    context, "brand_form_page_kategori_zaten_ekli".locale);
                                return;
                              }
                              setState(() {
                                _selectedCategories[index] =
                                    _categories.indexOf(value!);
                              });
                            },
                            title: "brand_form_page_kategori".locale,
                            isRequired: true,
                          ),
                        ),
                        if (index != 0)
                          Padding(
                            padding: EdgeInsets.only(
                                left: deviceHeightSize(context, 10),
                                top: deviceHeightSize(context, 16)),
                            child: ButtonTheme(
                              minWidth: deviceWidthSize(context, 50),
                              height: deviceHeightSize(context, 50),
                              child: MaterialButton(
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                minWidth: deviceWidthSize(context, 50),
                                color: AppTheme.red.withOpacity(0.1),
                                elevation: 0,
                                child: const Icon(
                                  Icons.remove_circle,
                                  color: AppTheme.red,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _selectedCategories.removeAt(index);
                                    _categoryControllers.removeAt(index);
                                  });
                                },
                              ),
                            ),
                          ),
                      ],
                    ),
                    if (_selectedCategories[index] != -1)
                      Padding(
                        padding:
                            EdgeInsets.only(left: deviceWidthSize(context, 30)),
                        child: FormFieldWidget(
                          context,
                          controller: _categoryControllers[index],
                          keyboardType:
                              const TextInputType.numberWithOptions(
                                  decimal: true, signed: false),
                          title: "brand_form_page_bagis_orani".locale,
                          isRequired: true,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'brand_form_page_gecersiz_bagis_orani'.locale;
                            }
                            return null;
                          },
                        ),
                      ),
                  ],
                ),
              ),
              // Kategori ekle butonu
              if (_selectedCategories.length < 3)
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      setState(() {
                        _selectedCategories.add(-1);
                        _categoryControllers.add(TextEditingController());
                      });
                    },
                    child: Text(
                      "brand_form_page_kategori_ekle".locale,
                      style: AppTheme.semiBoldTextStyle(
                          context, 16, color: AppTheme.primaryColor),
                    ),
                  ),
                ),
              SizedBox(
                  height: deviceHeightSize(context, 20) +
                      MediaQuery.of(context).viewInsets.bottom),
              GeneralButtonWidget(
                text: "brand_form_page_gonder".locale,
                isLoading: context.watch<BrandProvider>().sendFormState ==
                    LoadingState.loading,
                onPressed: () {
                  if (_formKey.currentState?.validate() ?? false) {
                    if (_logoImage.isEmpty) {
                      ToastWidgets.errorToast(
                          context, "brand_form_page_logo_hatasi".locale);
                      return;
                    }
                    if (_selectedApplicationTypeIndex == -1) {
                      ToastWidgets.errorToast(
                          context, "brand_form_page_basvuru_tipi_hatasi".locale);
                      return;
                    }
                    if (selectedIl == null ||
                        selectedIlce == null ||
                        selectedMahalle == null) {
                      ToastWidgets.errorToast(
                          context, "brand_form_page_adres_hatasi".locale);
                      return;
                    }
                    if (_selectedCategories.any((element) => element == -1)) {
                      ToastWidgets.errorToast(
                          context, "brand_form_page_kategori_hatasi".locale);
                      return;
                    }
                    if (_categoryControllers
                        .every((element) => element.text.isEmpty)) {
                      ToastWidgets.errorToast(
                          context, "brand_form_page_kategori_orani_hatasi".locale);
                      return;
                    }
                    // Oluşturulan model
                    BrandFormModel brandFormModel = BrandFormModel(
                      applicationType: _applicationTypes[_selectedApplicationTypeIndex]
                          ['key'],
                      name: _brandNameController.text,
                      website: _brandWebsiteController.text,
                      mail: _brandMailController.text,
                      phone: _brandPhoneController.text,
                      contactPerson: _brandContactPersonController.text,
                      contactPersonPhone: _brandContactPersonPhoneController.text,
                      contactPersonMail: _brandContactPersonMailController.text,
                      city: selectedIl,
                      district: selectedIlce,
                      neighborhood: selectedMahalle,
                      categories: _selectedCategories
                          .map(
                            (e) => CategoryModel(
                              name: _categories[e],
                              donationRate: double.parse(
                                _categoryControllers[_selectedCategories.indexOf(e)]
                                    .text
                                    .replaceAll(",", "."),
                              ),
                            ),
                          )
                          .toList(),
                      logoImage: _logoImage.isNotEmpty ? _logoImage[0]?.file?.path : null,
                      vergiNo: _brandVergiNoController.text,
                      iban: _brandIbanController.text,
                      // Ekstra alanlar (Sosyal İşletme ve Kooperatifler için)
                      beneficiaries: (_selectedApplicationTypeIndex == 0 ||
                              _selectedApplicationTypeIndex == 2)
                          ? _selectedBeneficiaries
                              .map((e) {
                                int index = _beneficiaries.indexWhere(
                                    (element) => element['label'] == e);
                                return _beneficiaries[index]['key']!;
                              })
                              .toList()
                          : null,
                      unSdgs: (_selectedApplicationTypeIndex == 0 ||
                              _selectedApplicationTypeIndex == 2)
                          ? _selectedBMItems
                              .map((e) {
                                int index = _bmItems.indexWhere(
                                    (element) => element['label'] == e);
                                return _bmItems[index]['key']!;
                              })
                              .toList()
                          : null,
                      isDepremBolgesi: (_selectedApplicationTypeIndex == 0 ||
                              _selectedApplicationTypeIndex == 2)
                          ? _isDepremBolgesi
                          : null,
                    );
                    context
                        .read<BrandProvider>()
                        .sendForm(brandFormModel, logoImage: _logoImage)
                        .then((value) {
                      if (value.success == true) {
                        Navigator.pop(context);
                      }
                      ToastWidgets.responseToast(context, value);
                    });
                  } else {
                    ToastWidgets.errorToast(
                        context, "brand_form_page_eksik_bilgi".locale);
                    return;
                  }
                },
              ),
              SizedBox(
                  height: deviceHeightSize(context, 30) +
                      MediaQuery.of(context).viewInsets.bottom),
            ],
          ),
        ),
      ),
    );
  }

  final List<String> _sectors = [
    "brand_form_page_sektor_tarim".locale,
    "brand_form_page_sektor_ormancilik".locale,
    "brand_form_page_sektor_balikcilik".locale,
    "brand_form_page_sektor_kumur".locale,
    "brand_form_page_sektor_petroil".locale,
    "brand_form_page_sektor_gida".locale,
    "brand_form_page_sektor_tekstil".locale,
    "brand_form_page_sektor_mobilya".locale,
    "brand_form_page_sektor_kagit".locale,
    "brand_form_page_sektor_kimya".locale,
    "brand_form_page_sektor_tas".locale,
    "brand_form_page_sektor_ana_metal".locale,
    "brand_form_page_sektor_makine".locale,
    "brand_form_page_sektor_diger_imalat".locale,
    "brand_form_page_sektor_elektrik".locale,
    "brand_form_page_sektor_insaat".locale,
    "brand_form_page_sektor_ticaret_toptan".locale,
    "brand_form_page_sektor_perakende".locale,
    "brand_form_page_sektor_ulastirma".locale,
    "brand_form_page_sektor_finansman".locale,
    "brand_form_page_sektor_varlik_yonetim".locale,
    "brand_form_page_sektor_bankalar".locale,
    "brand_form_page_sektor_sigorta".locale,
    "brand_form_page_sektor_faktoring".locale,
    "brand_form_page_sektor_holding".locale,
    "brand_form_page_sektor_diger_mali".locale,
    "brand_form_page_sektor_aracilar".locale,
    "brand_form_page_sektor_gayrimenkul".locale,
    "brand_form_page_sektor_menkul_kıymet".locale,
    "brand_form_page_sektor_girisim_sermayesi".locale,
    "brand_form_page_sektor_spor".locale,
    "brand_form_page_sektor_insan_sagligi".locale,
    "brand_form_page_sektor_yaratici_sanatlar".locale,
    "brand_form_page_sektor_bilisim".locale,
    "brand_form_page_sektor_savunma".locale,
    "brand_form_page_sektor_hukuk".locale,
    "brand_form_page_sektor_mimarlik".locale,
    "brand_form_page_sektor_bilimsel".locale,
    "brand_form_page_sektor_reklamcilik".locale,
    "brand_form_page_sektor_veterinerlik".locale,
    "brand_form_page_sektor_kiralama".locale,
    "brand_form_page_sektor_istihdam".locale,
    "brand_form_page_sektor_seyahat".locale,
    "brand_form_page_sektor_guvenlik".locale,
    "brand_form_page_sektor_binalar".locale,
    "brand_form_page_sektor_buro".locale,
    "brand_form_page_sektor_gayrimenkul_faaliyetleri".locale,
    "brand_form_page_sektor_konaklama".locale,
    "brand_form_page_sektor_yeme_icme".locale,
    "brand_form_page_sektor_mimar".locale,
    "brand_form_page_sektor_beyaz_esya".locale,
    "brand_form_page_sektor_elektrikli_ev_aletleri".locale,
    "brand_form_page_sektor_kisisel_bakim".locale,
    "brand_form_page_sektor_ev_ve_yasam".locale,
    "brand_form_page_sektor_muzik_enstruman".locale,
    "brand_form_page_sektor_telefon".locale,
    "brand_form_page_sektor_televizyon".locale,
    "brand_form_page_sektor_bilgisayar".locale,
    "brand_form_page_sektor_konsol".locale,
    "brand_form_page_sektor_kamera".locale,
    "brand_form_page_sektor_ofis_malzemeleri".locale,
    "brand_form_page_sektor_spor_outdoor".locale,
    "brand_form_page_sektor_kitap".locale,
    "brand_form_page_sektor_kirtasiye".locale,
    "brand_form_page_sektor_5000_ustu".locale,
    "brand_form_page_sektor_kampanyali_urunler".locale,
  ];

  final List<String> _categories = [
    "brand_form_page_kategori_tekstil".locale,
    "brand_form_page_kategori_saglik_gerecleri".locale,
    "brand_form_page_kategori_saglik_hizmetleri".locale,
    "brand_form_page_kategori_elektronik".locale,
    "brand_form_page_kategori_yedek_parca".locale,
    "brand_form_page_kategori_teknik_servis".locale,
    "brand_form_page_kategori_danismanlik".locale,
    "brand_form_page_kategori_gayrimenkul".locale,
    "brand_form_page_kategori_aracilik".locale,
    "brand_form_page_kategori_yazilim".locale,
    "brand_form_page_kategori_insaat_malzemeleri".locale,
    "brand_form_page_kategori_insaat_hizmetleri".locale,
    "brand_form_page_kategori_lojistik".locale,
    "brand_form_page_kategori_otomotiv".locale,
    "brand_form_page_kategori_konaklama".locale,
    "brand_form_page_kategori_yeme_icme".locale,
    "brand_form_page_kategori_mimar".locale,
    "brand_form_page_kategori_beyaz_esya".locale,
    "brand_form_page_kategori_elektrikli_ev_aletleri".locale,
    "brand_form_page_kategori_kisisel_bakim".locale,
    "brand_form_page_kategori_ev_ve_yasam".locale,
    "brand_form_page_kategori_muzik_enstruman".locale,
    "brand_form_page_kategori_telefon".locale,
    "brand_form_page_kategori_televizyon".locale,
    "brand_form_page_kategori_bilgisayar".locale,
    "brand_form_page_kategori_konsol".locale,
    "brand_form_page_kategori_kamera".locale,
    "brand_form_page_kategori_ofis_malzemeleri".locale,
    "brand_form_page_kategori_spor_outdoor".locale,
    "brand_form_page_kategori_kitap".locale,
    "brand_form_page_kategori_kirtasiye".locale,
    "brand_form_page_kategori_5000_ustu".locale,
    "brand_form_page_kategori_kampanyali_urunler".locale,
  ];

  void showKosulDialog(BuildContext context) {
    showDialog(
        context: context,
        builder: (BuildContext context) {
          return Dialog(
            insetPadding:
                EdgeInsets.symmetric(horizontal: deviceWidth(context) * 0.15, vertical: deviceHeight(context) * 0.2),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10.0),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "brand_form_page_sonraki_alisverisin".locale,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16.0),
                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSection(
                              context, "brand_form_page_adblock".locale, "brand_form_page_adblock_content".locale),
                          _buildSection(context, "brand_form_page_internet_tarayicisi".locale,
                              "brand_form_page_internet_tarayicisi_content".locale),
                          _buildSection(context, "brand_form_page_gizli_pencere".locale,
                              "brand_form_page_gizli_pencere_content".locale),
                          _buildSection(context, "brand_form_page_diger_programlar".locale,
                              "brand_form_page_diger_programlar_content".locale),
                          _buildSection(context, "brand_form_page_kupon_kodu".locale,
                              "brand_form_page_kupon_kodu_content".locale),
                          _buildSection(context, "brand_form_page_fiyat_karsilastirma".locale,
                              "brand_form_page_fiyat_karsilastirma_content".locale),
                          _buildSection(context, "brand_form_page_mobil_uygulama".locale,
                              "brand_form_page_mobil_uygulama_content".locale),
                          _buildSection(
                              context, "brand_form_page_sepet".locale, "brand_form_page_sepet_content".locale),
                          _buildSection(context, "brand_form_page_diger_para_iadesi".locale,
                              "brand_form_page_diger_para_iadesi_content".locale),
                          _buildSection(context, "brand_form_page_site_ziyaret".locale,
                              "brand_form_page_site_ziyaret_content".locale),
                          _buildSection(context, "brand_form_page_ortak_sirketler".locale,
                              "brand_form_page_ortak_sirketler_content".locale),
                          _buildSection(context, "brand_form_page_telefon_siparis".locale,
                              "brand_form_page_telefon_siparis_content".locale),
                          _buildSection(context, "brand_form_page_farkli_ulke".locale,
                              "brand_form_page_farkli_ulke_content".locale),
                          _buildSection(context, "brand_form_page_markanin_ozel_kosullari".locale,
                              "brand_form_page_markanin_ozel_kosullari_content".locale),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16.0),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                      child: Text("brand_form_page_tamam".locale),
                    ),
                  ),
                ],
              ),
            ),
          );
        });
  }

  Widget _buildSection(BuildContext context, String title, String content) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: AppTheme.boldTextStyle(context, 14),
          ),
          const SizedBox(height: 8.0),
          Text(
            content,
            style: AppTheme.normalTextStyle(context, 14),
          ),
        ],
      ),
    );
  }
}
