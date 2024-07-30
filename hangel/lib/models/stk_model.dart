class StkModel {
  String? id;
  final String? logo;
  final String? name;
  final String? country;
  final String? city;
  final String? fieldOfBenefit;
  final bool? inEarthquakeZone;
  final String? specialStatus;
  final DateTime? creationDate;
  final String? bannerImage;
  final String? detailText;
  final String? link;
  final int? donorCount;
  final String? type;
  final List<String> categories;
  final int favoriteCount;
  List<String?> bmCategories;

  StkModel({
    this.id,
    this.logo,
    this.name,
    this.country,
    this.city,
    this.fieldOfBenefit,
    this.inEarthquakeZone,
    this.specialStatus,
    this.creationDate,
    this.bannerImage,
    this.detailText,
    this.link,
    this.donorCount,
    this.type,
    this.categories = const [],
    this.favoriteCount = 157,
    this.bmCategories = const <String>[],
  });

  factory StkModel.fromJson(Map<String, dynamic> json) {
    return StkModel(
      id: json['id'],
      logo: json['logo'],
      name: json['name'],
      country: json['country'],
      city: json['city'],
      fieldOfBenefit: json['fieldOfBenefit'],
      inEarthquakeZone: json['inEarthquakeZone'],
      specialStatus: json['specialStatus'],
      creationDate: DateTime.tryParse(json['creationDate'].toString()),
      bannerImage: json['bannerImage'],
      detailText: json['detailText'],
      link: json['link'],
      donorCount: json['donorCount'],
      type: json['type'],
      categories: List<String>.from(json['categories'] ?? []),
      favoriteCount: json['favoriteCount'] ?? 157,
      bmCategories: List<String>.from(json['bmCategories'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'logo': logo,
      'name': name,
      'country': country,
      'city': city,
      'fieldOfBenefit': fieldOfBenefit,
      'inEarthquakeZone': inEarthquakeZone,
      'specialStatus': specialStatus,
      'creationDate': creationDate,
      'bannerImage': bannerImage,
      'detailText': detailText,
      'link': link,
      'donorCount': donorCount,
      'type': type,
      'categories': categories,
      'favoriteCount': favoriteCount,
      'bmCategories': bmCategories,
    };
  }
}
