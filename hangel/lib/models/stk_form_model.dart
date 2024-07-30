class STKFormModel {
  String? name;
  String? fullName;
  String? website;
  String? mail;
  String? phone;
  String? founder;
  String? contactPerson;
  String? contactPersonPhone;
  String? contactPersonMail;
  String? selectedSector;
  String? address;
  String? city;
  String? district;
  List<String?> categories;
  List<String?> bmCategories;
  String? logoImage;
  String? bannerImage;
  String? tuzukPDF;
  String? faaliyetImage;
  String? type;
  String? neighborhood;

  STKFormModel({
    this.name,
    this.fullName,
    this.website,
    this.mail,
    this.phone,
    this.founder,
    this.contactPerson,
    this.contactPersonPhone,
    this.contactPersonMail,
    this.selectedSector,
    this.address,
    this.city,
    this.district,
    this.categories = const <String>[],
    this.bmCategories = const <String>[],
    this.logoImage,
    this.bannerImage,
    this.tuzukPDF,
    this.faaliyetImage,
    this.type,
    this.neighborhood,
  });

  factory STKFormModel.fromJson(Map<String, dynamic> json) {
    return STKFormModel(
      name: json['name'],
      fullName: json['fullName'],
      website: json['website'],
      mail: json['mail'],
      phone: json['phone'],
      founder: json['founder'],
      contactPerson: json['contactPerson'],
      contactPersonPhone: json['contactPersonPhone'],
      contactPersonMail: json['contactPersonMail'],
      selectedSector: json['sector'],
      address: json['address'],
      city: json['city'],
      district: json['district'],
      categories: json['categories'],
      bmCategories: json['bmCategories'],
      logoImage: json['logoImage'],
      bannerImage: json['bannerImage'],
      tuzukPDF: json['vergiImage'],
      faaliyetImage: json['faaliyetImage'],
      type: json['type'],
      neighborhood: json['neighborhood'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'fullName': fullName,
      'website': website,
      'mail': mail,
      'phone': phone,
      'founder': founder,
      'contactPerson': contactPerson,
      'contactPersonPhone': contactPersonPhone,
      'contactPersonMail': contactPersonMail,
      'sector': selectedSector,
      'address': address,
      'city': city,
      'district': district,
      'categories': categories,
      'bmCategories': bmCategories,
      'logoImage': logoImage,
      'bannerImage': bannerImage,
      'vergiImage': tuzukPDF,
      'faaliyetImage': faaliyetImage,
      'type': type,
      'neighborhood': neighborhood,
    };
  }

  String toHTMLTable() {
    return """
    <table>
      <tr>
        <td>Adı</td>
        <td>$name</td>
      </tr>
      <tr>
        <td>Tam Adı</td>
        <td>$fullName</td>
      </tr>
      <tr>
        <td>Web Sitesi</td>
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
        <td>$selectedSector</td>
      </tr>
      <tr>
        <td>Adres</td>
        <td>$address</td>
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
        <td$categories</td>
      </tr>
      <tr>
        <td>BM Kategoriler</td>
        <td$bmCategories</td>
      </tr>
      <tr>
        <td>Logo</td>
        <td>$logoImage</td>
      </tr>
      <tr>
        <td>Banner</td>
        <td>$bannerImage</td>
      </tr>
      <tr>
        <td>Vergi</td>
        <td><img src="$tuzukPDF" /></td>
      </tr>
      <tr>
        <td>Faaliyet</td>
        <td><img src="$faaliyetImage" /></td>
      </tr>
      <tr>
        <td>Tür</td>
        <td>$type</td>
      </tr>
    </table>
    """;
  }
}
