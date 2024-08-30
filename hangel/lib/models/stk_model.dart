import 'package:cloud_firestore/cloud_firestore.dart';

class StkModel {
  String? id;
  String? logo;
  String? name;
  String? country;
  String? city;
  String? fieldOfBenefit;
  bool? inEarthquakeZone;
  String? specialStatus;
  DateTime? creationDate;
  String? bannerImage;
  String? detailText;
  String? link;
  int? donorCount;
  String? type;
  List<String> categories;
  int favoriteCount;
  List<String> bmCategories;
  String? federasyonlar;
  // String? sicilNo;
  bool? isActive;

  StkModel({
    this.id,
    this.logo,
    // this.sicilNo,
    this.name,
    this.country,
    this.city,
    this.fieldOfBenefit,
    this.inEarthquakeZone,
    this.specialStatus,
    this.creationDate,
    this.federasyonlar,
    this.bannerImage,
    this.detailText,
    this.link,
    this.donorCount,
    this.type,
    this.categories = const [],
    this.favoriteCount = 0,
    this.bmCategories = const <String>[],
    this.isActive,
  });

  factory StkModel.fromJson(Map<String, dynamic> json) {
    return StkModel(
        id: json['id'],
        logo: json['logo'] ?? "",
        // sicilNo: json["sicilNo"],
        name: json['name'] ?? "",
        country: json['country'] ?? "",
        city: json['city'] ?? "",
        federasyonlar: json["federasyonlar"] ?? "",
        fieldOfBenefit: json['fieldOfBenefit'] ?? "",
        inEarthquakeZone: json['inEarthquakeZone'] ?? false,
        specialStatus: json['specialStatus'] ?? "",
        creationDate: json['creationDate'] != null
            ? (json['creationDate'] is Timestamp
                ? (json['creationDate'] as Timestamp).toDate()
                : DateTime.parse(json['creationDate']))
            : null,
        bannerImage: json['bannerImage'] ?? "",
        detailText: json['detailText'] ?? "",
        link: json['link'] ?? "",
        donorCount: json['donorCount'] ?? 0,
        type: json['type'] ?? "",
        categories: List<String>.from(json['categories'] ?? [""]),
        favoriteCount: json['favoriteCount'] ?? 0,
        bmCategories: List<String>.from(
          json['bmCategories'] ?? [],
        ),
        isActive: json["isActive"] ?? true);
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'logo': logo,
      'name': name,
      'country': country,
      // "sicilNo": sicilNo,
      'city': city,
      'fieldOfBenefit': fieldOfBenefit,
      "federasyonlar": federasyonlar,
      'inEarthquakeZone': inEarthquakeZone,
      'specialStatus': specialStatus,
      'creationDate': creationDate?.toIso8601String(), // Ensure creationDate is a string
      'bannerImage': bannerImage,
      'detailText': detailText,
      'link': link,
      'donorCount': donorCount,
      'type': type,
      'categories': categories,
      'favoriteCount': favoriteCount,
      'bmCategories': bmCategories,
      'isActive': isActive
    };
  }
}
