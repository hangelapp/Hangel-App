import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/models/brand_form_model.dart';
import 'package:hangel/models/image_model.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import 'package:hangel/widgets/dropdown_widget.dart';
import 'package:hangel/widgets/form_field_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:hangel/widgets/pick_image_widget.dart';
import 'package:hangel/widgets/toast_widgets.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

class BrandFormWidget extends StatefulWidget {
  const BrandFormWidget({Key? key}) : super(key: key);

  @override
  State<BrandFormWidget> createState() => _BrandFormWidgetState();
}

class _BrandFormWidgetState extends State<BrandFormWidget> {
  int selectedIndex = -1;
  final TextEditingController _brandNameController = TextEditingController();

  final TextEditingController _brandMailController = TextEditingController();
  final TextEditingController _brandPhoneController = TextEditingController();
  final TextEditingController _brandFounderController = TextEditingController();
  final TextEditingController _brandWebsiteController = TextEditingController();
  final TextEditingController _brandContactPersonController =
      TextEditingController();
  final TextEditingController _brandContactPersonPhoneController =
      TextEditingController();
  final TextEditingController _brandContactPersonMailController =
      TextEditingController();
  final TextEditingController _brandContactPersonJob = TextEditingController();
  final TextEditingController _brandVergiNoController = TextEditingController();

  List<ImageModel?> _logoImage = [];
  List<ImageModel?> _bannerImage = [];
  List<ImageModel?> _vergiImage = [];

  List<int> _selectedCategories = [-1];
  List<TextEditingController> _categoryControllers = [
    TextEditingController(),
  ];

  List<String> iller = [];
  List<String> ilceler = [];
  List<String> mahalleler = [];
  String? selectedIl;
  String? selectedIlce;
  String? selectedMahalle;
  String jsonData = "";
  bool isSocialEnterprise = false;

  @override
  void initState() {
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      //get iller from json file /assets/il-ilce.json
      jsonData = await DefaultAssetBundle.of(context)
          .loadString("assets/il-ilce.json");
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
              controller: _brandNameController,
              title: "Marka Adı",
              isRequired: true,
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                "Marka Başvurusu Yapan Yetkili Kişi Bilgileri",
                style: AppTheme.semiBoldTextStyle(
                  context,
                  16,
                  color: AppTheme.darkBlue,
                ),
              ),
            ),
            FormFieldWidget(
              context,
              controller: _brandContactPersonController,
              title: "Adı Soyadı",
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _brandContactPersonPhoneController,
              keyboardType: TextInputType.phone,
              title: "Telefon Numarası",
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _brandContactPersonMailController,
              title: "Mail Adresi",
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _brandContactPersonJob,
              title: "Görevi/Pozisyonu",
              isRequired: true,
            ),
            PickImageWidget(
              context,
              title: "Markanın Logosu",
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
              infoText:
                  "Markanın logosu, 512x512 boyutlarında, png veya jpg formatında olmalıdır.",
            ),

            PickImageWidget(
              context,
              title: "Markanın Banner Görseli",
              onImagePicked: (List<XFile?> image) {
                setState(() {
                  _bannerImage.add(ImageModel(
                    imageType: ImageType.asset,
                    file: image[0]!,
                  ));
                });
              },
              selectedImages: _bannerImage,
              isSelectOnlyOne: true,
              onImageRemoved: (ImageModel? image) {
                setState(() {
                  _bannerImage = [];
                });
              },
              infoText:
                  "Markanın logosu, 800x500 boyutlarında, png veya jpg formatında olmalıdır.",
            ),
            FormFieldWidget(
              context,
              controller: _brandWebsiteController,
              title: "Markanın Web Sitesi",
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _brandMailController,
              title: "Markanın Mail Adresi",
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _brandPhoneController,
              keyboardType: TextInputType.phone,
              title: "Markanın Telefon Numarası",
              isRequired: true,
            ),
            FormFieldWidget(
              context,
              controller: _brandFounderController,
              title: "Markanın Kurucusunun Adı Soyadı",
              isRequired: true,
            ),
            DropdownWidget(
              context,
              titles: _sectors,
              selectedIndex: selectedIndex,
              onChanged: (value) {
                setState(() {
                  selectedIndex = _sectors.indexOf(value!);
                });
              },
              title: "Sektör",
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
            PickImageWidget(
              context,
              title: "Markanın Vergi Levhası",
              isSelectOnlyOne: true,
              onImagePicked: (List<XFile?> image) {
                setState(() {
                  _vergiImage.add(ImageModel(
                    imageType: ImageType.asset,
                    file: image[0]!,
                  ));
                });
              },
              selectedImages: _vergiImage,
              onImageRemoved: (ImageModel? image) {
                setState(() {
                  _vergiImage = [];
                });
              },
            ),
            FormFieldWidget(
              context,
              controller: _brandVergiNoController,
              keyboardType: TextInputType.number,
              title: "Markanın Vergi Numarası",
              isRequired: true,
            ),
            CheckboxListTile(
              value: isSocialEnterprise,
              contentPadding: EdgeInsets.zero,
              onChanged: (value) {
                setState(() {
                  isSocialEnterprise = value!;
                });
              },
              checkboxShape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(3),
              ),
              activeColor: AppTheme.primaryColor,
              title: Text(
                "Sosyal Girişim",
                style: AppTheme.normalTextStyle(context, 16),
              ),
            ),

            //! Kategori ve bağış oranı (her kategori için ayrı ayrı)
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
                            if (_selectedCategories.any((element) =>
                                element == _categories.indexOf(value!))) {
                              ToastWidgets.errorToast(
                                  context, "Bu kategori zaten ekli.");
                              return;
                            }
                            setState(() {
                              _selectedCategories[index] =
                                  _categories.indexOf(value!);
                            });
                          },
                          title: "Kategori",
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
                                });
                              },
                            ),
                          ),
                        ),
                    ],
                  ),
                  if (_selectedCategories[index] != -1)
                    Padding(
                      padding: EdgeInsets.only(
                        left: deviceWidthSize(context, 30),
                      ),
                      child: FormFieldWidget(
                        context,
                        controller: _categoryControllers[index],
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                          signed: false,
                        ),
                        title: "Bağış Oranı",
                        isRequired: true,
                      ),
                    ),
                ],
              ),
            ),
            //kategori ekle butonu
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
                    "+ Kategori Ekle",
                    style: AppTheme.semiBoldTextStyle(
                      context,
                      16,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ),
            SizedBox(height: deviceHeightSize(context, 20)),
            GeneralButtonWidget(
              text: "Gönder",
              isLoading: context.watch<BrandProvider>().sendFormState ==
                  LoadingState.loading,
              onPressed: () {
                if (_brandNameController.text.isNotEmpty &&
                    _brandWebsiteController.text.isNotEmpty &&
                    _brandMailController.text.isNotEmpty &&
                    _brandPhoneController.text.isNotEmpty &&
                    _brandFounderController.text.isNotEmpty &&
                    _brandContactPersonController.text.isNotEmpty &&
                    _brandContactPersonPhoneController.text.isNotEmpty &&
                    _brandContactPersonMailController.text.isNotEmpty &&
                    selectedIndex != -1 &&
                    selectedIl != null &&
                    selectedIlce != null &&
                    selectedMahalle != null &&
                    _logoImage.isNotEmpty &&
                    _bannerImage.isNotEmpty &&
                    _vergiImage.isNotEmpty &&
                    _selectedCategories.any((element) => element != -1) &&
                    _categoryControllers
                        .every((element) => element.text.isNotEmpty)) {
                  context
                      .read<BrandProvider>()
                      .sendForm(
                        BrandFormModel(
                          name: _brandNameController.text,
                          website: _brandWebsiteController.text,
                          mail: _brandMailController.text,
                          phone: _brandPhoneController.text,
                          founder: _brandFounderController.text,
                          contactPerson: _brandContactPersonController.text,
                          contactPersonPhone:
                              _brandContactPersonPhoneController.text,
                          contactPersonMail:
                              _brandContactPersonMailController.text,
                          sector: _sectors[selectedIndex],
                          city: selectedIl!,
                          district: selectedIlce!,
                          neighborhood: selectedMahalle!,
                          categories: _selectedCategories
                              .map(
                                (e) => CategoryModel(
                                  name: _categories[e],
                                  donationRate: double.parse(
                                      _categoryControllers[
                                              _selectedCategories.indexOf(e)]
                                          .text
                                          .replaceAll(",", ".")),
                                ),
                              )
                              .toList(),
                          isSocialEnterprise: isSocialEnterprise,
                          vergiNo: _brandVergiNoController.text,
                        ),
                        logoImage: _logoImage,
                        bannerImage: _bannerImage,
                        vergiImage: _vergiImage,
                      )
                      .then((value) {
                    if (value.success == true) {
                      Navigator.pop(context);
                    }
                    ToastWidgets.responseToast(context, value);
                  });
                } else {
                  ToastWidgets.errorToast(
                      context, "Lütfen tüm alanları doldurunuz.");
                }
              },
            ),
            SizedBox(
                height: deviceHeightSize(context, 30) +
                    MediaQuery.of(context).viewInsets.bottom),
          ],
        ),
      ),
    );
  }

  final List<String> _sectors = [
    "Tarim Ve Hayvancilik Avcilik Ve İlgili Hizmet Faaliyetleri",
    "Ormancılık Ve Tomrukçuluk",
    "Balikçilik Ve Su Ürünleri",
    "Kömür Ve Linyit Madenciliğ",
    "Ham Petrol Ve Doğal Gaz Çıkarılması",
    "Gıda, İçecek Ve Tütün",
    "Tekstil, Giyim Eşyası Ve Deri",
    "Orman Ürünleri Ve Mobilya",
    "Kağit Ve Kağit Ürünleri Basim",
    "Kimya İlaç Petrol Lastik Ve Plastik Ürünler",
    "Taş Ve Toprağa Dayalı",
    "Ana Metal Sanayi",
    "Metal Eşya Makine Elektrikli Cihazlar Ve Ulaşim Araçlari",
    "Diğer İmalat Sanayii",
    "Elektrik Gaz Ve Buhar",
    "İnşaat Ve Bayındırlık İşleri",
    "Ticaret Toptan Ticaret",
    "Perakende Ticaret",
    "Ulaştirma Ve Depolama",
    "Finansman Şirketleri",
    "Varlık Yönetim Şirketleri",
    "Bankalar",
    "Sigorta Şirketleri",
    "Finansal Kiralama Ve Faktoring Şirketleri",
    "Holdingler Ve Yatırım Şirketleri",
    "Diğer Mali Kuruluşlar",
    "Araci Kurumlar",
    "Gayrimenkul Yatırım Ortaklıkları",
    "Menkul Kiymet Yatirim Ortakliklari",
    "Girişim Sermayesi Yatırım Ortaklıkları",
    "Spor Eğlence Boş Zamanlari Değerlendirme Hizmetleri",
    "İnsan Sağliği Ve Sosyal Hizmetler",
    "Yaratici Sanatlar Gösteri Sanatlari Ve Eğlence Faaliyetleri",
    "Spor Faaliyetleri Eğlence Ve Oyun Faaliyetleri",
    "Bilişim",
    "Savunma",
    "Hukuk Ve Muhasebe Faaliyetleri",
    "İdare Merkezi Faaliyetleri; İdari Danışmanlık Faaliyetleri",
    "Mimarlik Ve Mühendislik Faaliyetleri; Teknik Muayene Ve Analiz",
    "Bilimsel Araştirma Ve Geliştirme Faaliyetleri",
    "Reklamcilik Ve Pazar Araştırması",
    "Diğer Profesyonel, Bilimsel Ve Teknik Faaliyetler",
    "Veterinerlik Hizmetleri",
    "Kiralama Ve Leasing Faaliyetleri",
    "İstihdam Faaliyetleri",
    "Seyahat Acentesi, Tur Operatörü Ve Diğer Rezervasyon Hizmetleri İle İlgili Faaliyetler",
    "Güvenlik Ve Soruşturma Faaliyetleri",
    "Binalar Ve Çevre Düzenlemesi Faaliyetleri",
    "Büro Yönetimi, Büro Desteği Ve Diğer Şirket Destek Faaliyetleri",
    "Gayrimenkul Faaliyetleri",
    "Konaklama",
    "Yiyecek Ve İçecek Hizmetleri",
    "Bilgi Hizmet Faaliyetleri",
    "Yayımcılık",
    "Telekomünikasyon",
    "Diğer",
  ];

  final List<String> _categories = [
    "Tekstil",
    "Sağlık Gereçleri",
    "Sağlık Hizmetleri",
    "Elektronik",
    "Yedek Parça",
    "Teknik Servis",
    "Danışmanlık",
    "Gayrimenkul",
    "Aracılık Hizmetleri",
    "Yazılım",
    "İnşaat Malzemeleri",
    "İnşaat Hizmetleri",
    "Lojistik",
    "Otomotiv",
    "Konaklama",
    "Yeme içme",
    "Mimar",
    "Beyaz Eşya & Ankastre ",
    "Elektrikli Ev Aletleri",
    "Kişisel Bakım",
    "Ev ve Yaşam",
    "Müzik Enstrüman ve Ekipman",
    "Telefon",
    "Televizyon ve Ses Sistemleri ",
    "Bilgisayar ve Tablet ",
    "Konsol, Oyun & Oyuncu Ekipmanları ",
    "Kamera & Fotoğraf Makinesi ",
    "Ofis Malzeme Mobilyaları",
    "Spor ve Outdoor",
    "Kitap",
    "Kırtasiye",
    "5000 TL üzeri Alışverişler",
    "Kampanyalı Ürünler",
  ];
}
