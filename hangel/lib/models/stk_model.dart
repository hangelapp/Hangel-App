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
  String? qrUrl;
  String? type;
  List<String> categories;
  List<String>? favoriteCount;
  List<String> bmCategories;
  String? federasyonlar;
  // String? sicilNo;
  bool? isActive;
  double? totalDonation; // Tüm donation değerleri toplanacak
  int? processCount; // Her seferinde 1 artacak
  int? totalDonor; // Bunu donation'larda bu id'yle eşleşen kayıt yoksa arttır

  StkModel(
      {this.id,
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
      this.qrUrl,
      this.type,
      this.categories = const [],
      this.favoriteCount = const [],
      this.bmCategories = const <String>[],
      this.isActive,
      this.totalDonation,
      this.processCount,
      this.totalDonor});

  factory StkModel.fromJson(Map<String, dynamic> json) {
    List<String> safeStringList(dynamic data) {
      if (data == null) return [];
      // data'nın Liste olup olmadığını kontrol edelim
      if (data is List) {
        // Liste içindeki null değerleri filtreleyip string'e çeviriyoruz
        return data
            .where((element) => element != null) // null değerleri at
            .map((element) => element.toString()) // hepsini stringe çevir
            .toList();
      }
      return [];
    }

    return StkModel(
      id: json['id'],
      logo: json['logo'] ?? "",
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
              : DateTime.tryParse(json['creationDate']))
          : null,
      bannerImage: json['bannerImage'] ?? "",
      detailText: json['detailText'] ?? "",
      link: json['link'] ?? "",
      qrUrl: json['qrUrl'] ?? "",
      type: json['type'] ?? "",
      categories: safeStringList(json['categories']),
      favoriteCount: json['favoriteCount'] is int ? json['favoriteCount'] ?? 0 : 0,
      bmCategories: safeStringList(json['bmCategories']),
      isActive: json["isActive"] ?? true,
      totalDonation: double.tryParse(((json["totalDonation"]) ?? 0.0).toString()),
      processCount: json["processCount"] ?? 0,
      totalDonor: json["totalDonor"] ?? 0,
    );
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
      'qrUrl': qrUrl,
      'type': type,
      'categories': categories,
      'favoriteCount': favoriteCount,
      'bmCategories': bmCategories,
      'isActive': isActive,
      "totalDonation": totalDonation,
      "processCount": processCount,
      "totalDonor": totalDonor
    };
  }
}
