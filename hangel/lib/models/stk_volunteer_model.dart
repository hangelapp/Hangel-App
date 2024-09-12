class StkVolunteerModel {
  String? stkId;
  String? stkName;
  String? stkCategory;
  String? stkEmail;
  String? stkLogo;
  bool? isActive;
  List<String>? applicantIds;

  // Constructor
  StkVolunteerModel({
    required this.stkId,
    required this.stkName,
    required this.stkCategory,
    required this.stkEmail,
    required this.stkLogo,
    required this.isActive,
    required this.applicantIds,
  });

  // JSON'dan StkVolunteerModel'e dönüştürme
  factory StkVolunteerModel.fromJson(Map<String, dynamic> json) {
    return StkVolunteerModel(
      stkId: json['stkId'] as String,
      stkName: json['stkName'] as String,
      stkCategory: json['stkCategory'] as String,
      stkEmail: json['stkEmail'] as String,
      stkLogo: json['stkLogo'] as String,
      isActive: json['isActive'] as bool,
      applicantIds: List<String>.from(json['applicantIds'] as List),
    );
  }

  // StkVolunteerModel'den JSON'a dönüştürme
  Map<String, dynamic> toJson() {
    return {
      'stkId': stkId,
      'stkName': stkName,
      'stkCategory': stkCategory,
      'stkEmail': stkEmail,
      'stkLogo': stkLogo,
      'isActive': isActive,
      'applicantIds': applicantIds,
    };
  }

  // Boş bir model oluşturma (opsiyonel)
  factory StkVolunteerModel.empty() {
    return StkVolunteerModel(
      stkId: '',
      stkName: '',
      stkCategory: '',
      stkEmail: '',
      stkLogo: '',
      isActive: false,
      applicantIds: [],
    );
  }
}
