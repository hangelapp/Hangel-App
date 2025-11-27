class SectorModel {
  String? brandId;
  String? sectorName;
  bool? isFeatured;

  SectorModel({this.brandId, this.sectorName, this.isFeatured});

  SectorModel.fromJson(Map<String, dynamic> json) {
    brandId = json['brandId'];
    sectorName = json['sectorName'];
    isFeatured = json['isFeatured'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['brandId'] = brandId;
    data['sectorName'] = sectorName;
    data['isFeatured'] = isFeatured;
    return data;
  }
}