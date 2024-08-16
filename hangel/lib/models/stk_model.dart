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
      creationDate: json['creationDate'] != null
          ? (json['creationDate'] is Timestamp
              ? (json['creationDate'] as Timestamp).toDate()
              : DateTime.parse(json['creationDate']))
          : null,
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
      'creationDate': creationDate?.toIso8601String(), // Ensure creationDate is a string
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
