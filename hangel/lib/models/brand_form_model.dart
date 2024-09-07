import 'brand_model.dart';

class BrandFormModel {
  String? name;
  String? website;
  String? mail;
  String? phone;
  String? founder;
  String? contactPerson;
  String? contactPersonPhone;
  String? contactPersonMail;
  String? sector;
  String? city;
  String? district;
  List<CategoryModel>? categories;
  String? logoImage;
  String? bannerImage;
  String? vergiImage;
  String? vergiNo;
  String? neighborhood;
  bool? isSocialEnterprise;
  String? iban;

  BrandFormModel(
      {this.name,
      this.website,
      this.mail,
      this.phone,
      this.founder,
      this.contactPerson,
      this.contactPersonPhone,
      this.contactPersonMail,
      this.sector,
      this.city,
      this.district,
      this.categories,
      this.logoImage,
      this.bannerImage,
      this.vergiImage,
      this.vergiNo,
      this.neighborhood,
      this.isSocialEnterprise,
      this.iban});

  factory BrandFormModel.fromJson(Map<String, dynamic> json) {
    return BrandFormModel(
        name: json['name'],
        website: json['website'],
        mail: json['mail'],
        phone: json['phone'],
        founder: json['founder'],
        contactPerson: json['contactPerson'],
        contactPersonPhone: json['contactPersonPhone'],
        contactPersonMail: json['contactPersonMail'],
        sector: json['sector'],
        city: json['city'],
        district: json['district'],
        categories: json['categories'] != null
            ? (json['categories'] as List).map((e) => CategoryModel.fromJson(e)).toList()
            : null,
        logoImage: json['logoImage'],
        bannerImage: json['bannerImage'],
        vergiImage: json['vergiImage'],
        vergiNo: json['vergiNo'],
        neighborhood: json['neighborhood'],
        isSocialEnterprise: json['isSocialEnterprise'],
        iban: json["iban"]);
  }
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'website': website,
      'mail': mail,
      'phone': phone,
      'founder': founder,
      'contactPerson': contactPerson,
      'contactPersonPhone': contactPersonPhone,
      'contactPersonMail': contactPersonMail,
      'sector': sector,
      'city': city,
      'district': district,
      'categories': categories?.map((e) => e.toJson()).toList(),
      'logoImage': logoImage,
      'bannerImage': bannerImage,
      'vergiImage': vergiImage,
      'vergiNo': vergiNo,
      'neighborhood': neighborhood,
      'isSocialEnterprise': isSocialEnterprise,
      "iban": iban
    };
  }

  String toHtmlTable() {
    return '''
      <table border="1">
        <tr><th>Alan</th><th>Değer</th></tr>
        <tr><td>Ad</td><td>${name ?? '-'}</td></tr>
        <tr><td>Web Sitesi</td><td>${website ?? '-'}</td></tr>
        <tr><td>E-posta</td><td>${mail ?? '-'}</td></tr>
        <tr><td>Telefon</td><td>${phone ?? '-'}</td></tr>
        <tr><td>Kurucu</td><td>${founder ?? '-'}</td></tr>
        <tr><td>İlgili Kişi</td><td>${contactPerson ?? '-'}</td></tr>
        <tr><td>İlgili Kişi Telefonu</td><td>${contactPersonPhone ?? '-'}</td></tr>
        <tr><td>İlgili Kişi E-posta</td><td>${contactPersonMail ?? '-'}</td></tr>
        <tr><td>Sektör</td><td>${sector ?? '-'}</td></tr>
        <tr><td>Şehir</td><td>${city ?? '-'}</td></tr>
        <tr><td>İlçe</td><td>${district ?? '-'}</td></tr>
        <tr><td>Kategoriler</td><td>${categories != null ? categories!.map((e) => e.name).join(', ') : '-'}</td></tr>
        <tr><td>Logo Resmi</td><td>${logoImage ?? '-'}</td></tr>
        <tr><td>Banner Resmi</td><td>${bannerImage ?? '-'}</td></tr>
        <tr><td>Vergi Levhası Resmi</td><td>${vergiImage ?? '-'}</td></tr>
        <tr><td>Vergi Numarası</td><td>${vergiNo ?? '-'}</td></tr>
        <tr><td>Mahalle</td><td>${neighborhood ?? '-'}</td></tr>
        <tr><td>Sosyal Girişim mi?</td><td>${isSocialEnterprise != null ? (isSocialEnterprise! ? 'Evet' : 'Hayır') : '-'}</td></tr>
        <tr><td>IBAN</td><td>${iban ?? '-'}</td></tr>
      </table>
    ''';
  }
}
