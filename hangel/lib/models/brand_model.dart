class BrandModel {
  String? id; // Offer
  final String? name; // Offer
  String? logo; // Contain
  final String? sector; // Contain
  final bool? inEarthquakeZone; // Default Value false
  final bool? isSocialEnterprise; // Default Value false
  final double? donationRate; // Offer
  final DateTime? creationDate; // Default Value Datetime.now
  final String? bannerImage; // Contain
  final String? detailText; //Default Value text shema
  final String? link; // Contain
  final List<CategoryModel>? categories; // Contain
  final int favoriteCount; // Default value 0 Closed for now

  BrandModel({
    this.id,
    this.name,
    this.logo,
    this.sector,
    this.inEarthquakeZone,
    this.isSocialEnterprise,
    this.donationRate,
    this.creationDate,
    this.bannerImage,
    this.detailText,
    this.link,
    this.categories,
    this.favoriteCount = 157,
  });

  factory BrandModel.fromJson(Map<String, dynamic> json) {
    return BrandModel(
      id: json['id'],
      name: json['name'],
      logo: json['logo'],
      sector: json['sector'],
      inEarthquakeZone: json['inEarthquakeZone'],
      isSocialEnterprise: json['isSocialEnterprise'],
      donationRate: json['donationRate'],
      creationDate: DateTime.tryParse(json['creationDate'].toString()),
      bannerImage: json['bannerImage'],
      detailText: json['detailText'],
      link: json['link'],
      categories: json['categories'] != null
          ? (json['categories'] as List).map((e) => CategoryModel.fromJson(e)).toList()
          : null,
      favoriteCount: json['favoriteCount'] ?? 157,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'logo': logo,
      'sector': sector,
      'inEarthquakeZone': inEarthquakeZone,
      'isSocialEnterprise': isSocialEnterprise,
      'donationRate': donationRate,
      'creationDate': creationDate,
      'bannerImage': bannerImage,
      'detailText': detailText,
      'link': link,
      'categories': categories?.map((e) => e.toJson()).toList(),
      'favoriteCount': favoriteCount,
    };
  }
}

class CategoryModel {
  String? name;
  double? donationRate;

  CategoryModel({
    this.name,
    this.donationRate,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      name: json['name'],
      donationRate: json['donationRate'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'donationRate': donationRate,
    };
  }
}
