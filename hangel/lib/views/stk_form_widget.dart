import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart'; // Import for input formatters
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/models/general_response_model.dart';
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

  final TextEditingController _stkNameController = TextEditingController();
  final TextEditingController _stkFullNameController = TextEditingController();
  final TextEditingController _stkSicilNoController = TextEditingController();
  final TextEditingController _stkVergiNoController = TextEditingController();
  final TextEditingController _stkIbanController = TextEditingController();

  final TextEditingController _stkMailController = TextEditingController();
  final TextEditingController _stkPhoneController = TextEditingController();
  final TextEditingController _stkFounderController = TextEditingController();
  final TextEditingController _stkWebsiteController = TextEditingController();
  final TextEditingController _stkContactPersonController = TextEditingController();
  final TextEditingController _stkContactPersonPhoneController = TextEditingController();
  final TextEditingController _stkContactPersonMailController = TextEditingController();
  final TextEditingController _stkContactPersonJob = TextEditingController();
  final TextEditingController _stkAddressController = TextEditingController();
  final TextEditingController _stkFederasyonlar = TextEditingController();

  List<ImageModel?> _logoImage = [];
  PlatformFile? _tuzukPDF;
  PlatformFile? _faaliyetPDF;

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
    _stkFounderController.dispose();
    _stkWebsiteController.dispose();
    _stkContactPersonController.dispose();
    _stkContactPersonPhoneController.dispose();
    _stkContactPersonMailController.dispose();
    _stkContactPersonJob.dispose();
    _stkAddressController.dispose();
    _stkSicilNoController.dispose();
    _stkFederasyonlar.dispose();
    _stkIbanController.dispose();
    super.dispose();
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
              FormFieldWidget(
                context,
                controller: _stkSicilNoController,
                title: "STK Kütük No",
                isRequired: true,
                keyboardType: TextInputType.number,
                inputFormatters: [numberFormatter],
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Geçersiz Kütük Numarası';
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _stkVergiNoController,
                title: "STK Vergi No",
                isRequired: true,
                keyboardType: TextInputType.number,
                inputFormatters: [numberFormatter],
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Geçersiz Vergi Numarası';
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _stkNameController,
                title: "STK Kısa Adı",
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Geçersiz Kısa İsim';
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _stkFullNameController,
                title: "STK Tam Adı",
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Geçersiz Tam İsim';
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _stkIbanController,
                title: "STK IBAN Numarası",
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty || !isValid(value.replaceAll(RegExp(r'\s+'), ''))) {
                    return 'Geçersiz IBAN Numarası';
                  }
                  return null;
                },
              ),
              SizedBox(height: 20),
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
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Geçersiz Ad Soyad';
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _stkContactPersonPhoneController,
                title: "Telefon Numarası",
                keyboardType: TextInputType.phone,
                isRequired: true,
                inputFormatters: [phoneMaskFormatter],
                validator: (value) {
                  if (value == null || value.isEmpty || !phoneMaskFormatter.isFill()) {
                    return 'Geçersiz Telefon Numarası';
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _stkContactPersonMailController,
                title: "Mail Adresi",
                keyboardType: TextInputType.emailAddress,
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty || !emailRegex.hasMatch(value)) {
                    return 'Geçersiz Mail Adresi';
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _stkContactPersonJob,
                title: "Görevi/Pozisyonu",
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Geçersiz Görev/Pozisyon';
                  }
                  return null;
                },
              ),
              PickImageWidget(
                context,
                title: "STK'nın Logosu",
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
                infoText: "Markanın logosu, 512x512 boyutlarında, png veya jpg formatında olmalıdır.",
                isRequired: true,
              ),
              FormFieldWidget(
                context,
                controller: _stkWebsiteController,
                title: "STK'nın Web Sitesi",
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty || !urlRegex.hasMatch(value)) {
                    return 'Geçersiz Web sitesi';
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _stkMailController,
                title: "STK'nın Mail Adresi",
                keyboardType: TextInputType.emailAddress,
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty || !emailRegex.hasMatch(value)) {
                    return 'Geçersiz Mail Adresi';
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _stkPhoneController,
                title: "STK'nın Telefon Numarası",
                keyboardType: TextInputType.phone,
                isRequired: true,
                inputFormatters: [phoneMaskFormatter],
                validator: (value) {
                  if (value == null || value.isEmpty || !phoneMaskFormatter.isFill()) {
                    return 'Geçersiz Telefon Numarası';
                  }
                  return null;
                },
              ),
              FormFieldWidget(
                context,
                controller: _stkFounderController,
                title: "STK'nın Kurucusunun Adı Soyadı",
                isRequired: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Geçersiz Kurucu Adı Soyadı';
                  }
                  return null;
                },
              ),
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
                title: "İl",
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
                  title: "İlçe",
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
                  title: "Mahalle",
                  isRequired: true,
                ),
              if (selectedMahalle != null)
                FormFieldWidget(
                  context,
                  controller: _stkAddressController,
                  title: "Sokak ve Kapı Numarası",
                  isRequired: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Geçersiz Sokak ve Kapı Numarası';
                    }
                    return null;
                  },
                ),
              PickFileWidget(
                context,
                title: "STK'nın Barkodlu Tüzük",
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
              PickFileWidget(
                context,
                title: "STK'nın Faaliyet Belgesi",
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
                infoText: "Dosya, Pdf formatında ve 6mb'dan küçük olmalıdır.",
                selectedFile: _faaliyetPDF,
                isRequired: true,
              ),
              FormFieldWidget(
                context,
                controller: _stkFederasyonlar,
                title: "STK'nın Bağlı Bulunduğu Federasyon ve Konfederasyonlar",
                isRequired: false,
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
                    if (!_selectedCategories.contains(value)) {
                      _selectedCategories.add(value!);
                    }
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
                  if (_formKey.currentState?.validate() ?? false) {
                    if (_logoImage.isEmpty) {
                      ToastWidgets.errorToast(context, "Logo doğru biçimde yüklenmedi.");
                      return;
                    }
                    if (selectedIl == null ||
                        selectedIlce == null ||
                        selectedMahalle == null ||
                        _stkAddressController.text.isEmpty) {
                      ToastWidgets.errorToast(context, "Adres bilgilerinde hata var.");
                      return;
                    }
                    if (_tuzukPDF == null) {
                      ToastWidgets.errorToast(context, "Tüzük dosyasında hata var.");
                      return;
                    }
                    if (_faaliyetPDF == null) {
                      ToastWidgets.errorToast(context, "Faaliyet belgesinde hata var.");
                      return;
                    }
                    if (_selectedSectorIndex == -1) {
                      ToastWidgets.errorToast(context, "Faaliyet alanı bilgisinde hata var.");
                      return;
                    }
                    if (_selectedCategories.isEmpty) {
                      ToastWidgets.errorToast(context, "Kategori bilgisinde hata var.");
                      return;
                    }
                    if (selectedBMs.isEmpty) {
                      ToastWidgets.errorToast(context, "BM amaçları bilgisinde hata var");
                      return;
                    }
                    if (_selectedType == -1) {
                      ToastWidgets.errorToast(context, "STK türünde hata var");
                      return;
                    }
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
                            contactPersonJob: _stkContactPersonJob.text,
                            contactPersonPhone: _stkContactPersonPhoneController.text,
                            contactPersonMail: _stkContactPersonMailController.text,
                            address: _stkAddressController.text,
                            city: selectedIl!,
                            district: selectedIlce!,
                            neighborhood: selectedMahalle!,
                            categories: _selectedCategories,
                            bmCategories: selectedBMs,
                            selectedSector: _sectors[_selectedSectorIndex],
                            sicilNo: _stkSicilNoController.text,
                            vergiNo: _stkVergiNoController.text,
                            iban: _stkIbanController.text,
                            time: DateTime.now(),
                            type: _types[_selectedType],
                            federations: _stkFederasyonlar.text,
                            fullName: _stkFullNameController.text,
                          ),
                          logoImage: _logoImage,
                          tuzukPDF: _tuzukPDF,
                          faaliyetImage: _faaliyetPDF,
                        )
                        .then((GeneralResponseModel responseModel) {
                      if (responseModel.success == true) {
                        Navigator.pop(context);
                      }
                      ToastWidgets.responseToast(context, responseModel);
                    });
                  } else {
                    ToastWidgets.errorToast(
                        context, "Eksik bilgi girdiniz! Lütfen girdiğiniz verileri tekrar gözden geçirin");
                    return;
                  }
                },
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
    "Temiz Su Ve Sanitasyon",
    "Erişilebilir Ve Temiz Enerji",
    "İnsana Yakışır İş Ve Ekonomik Büyüme",
    "Sanayi, Yenilikçilik Ve Altyapı",
    "Eşitsizliklerin Azaltılması",
    "Sürdürülebilir Şehirler Ve Topluluklar",
    "Sorumlu Üretim Ve Tüketim",
    "İklim Eylemi",
    "Sudaki Yaşam",
    "Karasal Yaşam",
    "Barış, Adalet Ve Güçlü Kurumlar",
    "Amaçlar İçin Ortaklıklar",
  ];
}
