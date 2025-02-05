// brand_form_model.dart
import 'brand_model.dart';

class BrandFormModel {
  String? applicationType;
  String? name;
  String? website;
  String? mail;
  String? phone;
  String? contactPerson;
  String? contactPersonPhone;
  String? contactPersonMail;
  String? city;
  String? district;
  String? neighborhood;
  List<CategoryModel>? categories;
  String? logoImage;
  String? vergiNo;
  String? iban;
  // Ekstra alanlar: Sosyal İşletmeler ve Kooperatifler için
  List<String>? beneficiaries;
  List<String>? unSdgs;
  bool? isDepremBolgesi;

  BrandFormModel({
    this.applicationType,
    this.name,
    this.website,
    this.mail,
    this.phone,
    this.contactPerson,
    this.contactPersonPhone,
    this.contactPersonMail,
    this.city,
    this.district,
    this.neighborhood,
    this.categories,
    this.logoImage,
    this.vergiNo,
    this.iban,
    this.beneficiaries,
    this.unSdgs,
    this.isDepremBolgesi,
  });

  factory BrandFormModel.fromJson(Map<String, dynamic> json) {
    return BrandFormModel(
      applicationType: json['applicationType'],
      name: json['name'],
      website: json['website'],
      mail: json['mail'],
      phone: json['phone'],
      contactPerson: json['contactPerson'],
      contactPersonPhone: json['contactPersonPhone'],
      contactPersonMail: json['contactPersonMail'],
      city: json['city'],
      district: json['district'],
      neighborhood: json['neighborhood'],
      categories: json['categories'] != null
          ? (json['categories'] as List)
              .map((e) => CategoryModel.fromJson(e))
              .toList()
          : null,
      logoImage: json['logoImage'],
      vergiNo: json['vergiNo'],
      iban: json['iban'],
      beneficiaries: json['beneficiaries'] != null
          ? List<String>.from(json['beneficiaries'])
          : null,
      unSdgs:
          json['unSdgs'] != null ? List<String>.from(json['unSdgs']) : null,
      isDepremBolgesi: json['isDepremBolgesi'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'applicationType': applicationType,
      'name': name,
      'website': website,
      'mail': mail,
      'phone': phone,
      'contactPerson': contactPerson,
      'contactPersonPhone': contactPersonPhone,
      'contactPersonMail': contactPersonMail,
      'city': city,
      'district': district,
      'neighborhood': neighborhood,
      'categories': categories?.map((e) => e.toJson()).toList(),
      'logoImage': logoImage,
      'vergiNo': vergiNo,
      'iban': iban,
      'beneficiaries': beneficiaries,
      'unSdgs': unSdgs,
      'isDepremBolgesi': isDepremBolgesi,
    };
  }

  String toHtmlTable() {
    return '''
      <table border="1">
        <tr><th>Alan</th><th>Değer</th></tr>
        <tr><td>Başvuru Tipi</td><td>${applicationType ?? '-'}</td></tr>
        <tr><td>Marka Adı</td><td>${name ?? '-'}</td></tr>
        <tr><td>Web Sitesi</td><td>${website ?? '-'}</td></tr>
        <tr><td>E-posta</td><td>${mail ?? '-'}</td></tr>
        <tr><td>Telefon</td><td>${phone ?? '-'}</td></tr>
        <tr><td>İlgili Kişi</td><td>${contactPerson ?? '-'}</td></tr>
        <tr><td>İlgili Kişi Telefonu</td><td>${contactPersonPhone ?? '-'}</td></tr>
        <tr><td>İlgili Kişi E-posta</td><td>${contactPersonMail ?? '-'}</td></tr>
        <tr><td>Şehir</td><td>${city ?? '-'}</td></tr>
        <tr><td>İlçe</td><td>${district ?? '-'}</td></tr>
        <tr><td>Mahalle</td><td>${neighborhood ?? '-'}</td></tr>
        <tr><td>Kategoriler</td><td>${categories != null ? categories!.map((e) => e.name).join(', ') : '-'}</td></tr>
        <tr><td>Logo Resmi</td><td>${logoImage ?? '-'}</td></tr>
        <tr><td>Vergi Numarası</td><td>${vergiNo ?? '-'}</td></tr>
        <tr><td>IBAN</td><td>${iban ?? '-'}</td></tr>
        <tr><td>Faydalanıcılar</td><td>${beneficiaries != null ? beneficiaries!.join(', ') : '-'}</td></tr>
        <tr><td>BM Sürdürülebilir Kalkınma Amaçları</td><td>${unSdgs != null ? unSdgs!.join(', ') : '-'}</td></tr>
        <tr><td>Deprem Bölgesi</td><td>${isDepremBolgesi != null ? (isDepremBolgesi! ? 'Evet' : 'Hayır') : '-'}</td></tr>
      </table>
    ''';
  }
}
