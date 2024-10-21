class BrandInfoModel {
  String? brandId;
  String? brandName;
  double? totalDonation;
  double? processCount;
  List<String>? favoriteIds;

  BrandInfoModel({
    this.brandId,
    this.brandName,
    this.totalDonation,
    this.processCount,
    this.favoriteIds,
  });

  // JSON'dan nesneye dönüştürme
  factory BrandInfoModel.fromJson(Map<String, dynamic> json) {
    return BrandInfoModel(
      brandId: json['brandId'] as String?,
      brandName: json['brandName'] as String?,
      totalDonation: (json['totalDonation'] as double?) ?? 0.0,
      processCount: (double.tryParse(json['processCount']?.toString() ?? "0")),
      favoriteIds: List<String>.from(json['favoriteIds'] ?? []),
    );
  }

  // Nesneden JSON'a dönüştürme
  Map<String, dynamic> toJson() {
    return {
      'brandId': brandId,
      'brandName': brandName,
      'totalDonation': totalDonation,
      'processCount': processCount,
      'favoriteIds': favoriteIds,
    };
  }

  // Boş bir nesne oluşturma
  static BrandInfoModel blank() => BrandInfoModel(
        brandId: null,
        brandName: "",
        totalDonation: 0.0,
        processCount: 0,
        favoriteIds: [],
      );
}
