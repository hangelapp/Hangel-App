import 'package:hangel/models/brand_model.dart';

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

  BrandFormModel({
    this.name,
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
  });

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
          ? (json['categories'] as List)
              .map((e) => CategoryModel.fromJson(e))
              .toList()
          : null,
      logoImage: json['logoImage'],
      bannerImage: json['bannerImage'],
      vergiImage: json['vergiImage'],
      vergiNo: json['vergiNo'],
      neighborhood: json['neighborhood'],
      isSocialEnterprise: json['isSocialEnterprise'],
    );
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
    };
  }

  String toHTMLTable() {
    return """
    <table>
      <tr>
        <td>İsim</td>
        <td>$name</td>
      </tr>
      <tr>
        <td>Website</td>
        <td>$website</td>
      </tr>
      <tr>
        <td>Mail</td>
        <td>$mail</td>
      </tr>
      <tr>
        <td>Telefon</td>
        <td>$phone</td>
      </tr>
      <tr>
        <td>Kurucu</td>
        <td>$founder</td>
      </tr>
      <tr>
        <td>İletişim Kişisi</td>
        <td>$contactPerson</td>
      </tr>
      <tr>
        <td>İletişim Kişisi Telefon</td>
        <td>$contactPersonPhone</td>
      </tr>
      <tr>
        <td>İletişim Kişisi Mail</td>
        <td>$contactPersonMail</td>
      </tr>
      <tr>
        <td>Sektör</td>
        <td>$sector</td>
      </tr>
      <tr>
        <td>Şehir</td>
        <td>$city</td>
      </tr>
      <tr>
        <td>İlçe</td>
        <td>$district</td>
      </tr>
      <tr>
        <td>Mahalle</td>
        <td>$neighborhood</td>
      </tr>
      <tr>
        <td>Kategoriler</td>
        <td>${categories?.map((e) => e.name).toList().join(", ")}</td>
      </tr>
      <tr>
        <td>Logo</td>
        <td><img src="$logoImage" /></td>
      </tr>
      <tr>
        <td>Banner</td>
        <td><img src="$bannerImage" /></td>
      </tr>
      <tr>
        <td>Vergi</td>
        <td><img src="$vergiImage" /></td>
      </tr>
      <tr>
        <td>Sosyal Girişim</td>
        <td>${isSocialEnterprise == true ? "Evet" : "Hayır"}</td>
      </tr>
     
    </table>
    """;
  }
}
