class Volunteer {
  // Gönüllü olmak istiyorum
  bool wantsToVolunteer;

  // Gönüllü olarak görev almak istediğiniz alanlar
  List<String> volunteerAreas;

  // Statü (Fiziki, Online, Her ikisi)
  String status;

  // Yetkin olduğunuz alanlar (çoktan seçmeli)
  List<String> expertiseAreas;

  // Müsait olduğunuz gün saat aralığı
  List<String> availableTimeSlots;

  // Mezuniyet durumu (İlkokul, Lise, Üniversite, Yüksek lisans, Doktora)
  String educationLevel;

  // Toplam çalışma hayatı (1-50 arası rakam)
  int totalYearsOfWork;

  Volunteer({
    required this.wantsToVolunteer,
    required this.volunteerAreas,
    required this.status,
    required this.expertiseAreas,
    required this.availableTimeSlots,
    required this.educationLevel,
    required this.totalYearsOfWork,
  });

  // JSON'dan nesne oluşturma
  factory Volunteer.fromJson(Map<String, dynamic> json) {
    return Volunteer(
      wantsToVolunteer: json['wantsToVolunteer'] as bool,
      volunteerAreas: List<String>.from(json['volunteerAreas']),
      status: json['status'] as String,
      expertiseAreas: List<String>.from(json['expertiseAreas']),
      availableTimeSlots: List<String>.from(json['availableTimeSlots']),
      educationLevel: json['educationLevel'] as String,
      totalYearsOfWork: json['totalYearsOfWork'] as int,
    );
  }

  // Nesneyi JSON formatına dönüştürme
  Map<String, dynamic> toJson() {
    return {
      'wantsToVolunteer': wantsToVolunteer,
      'volunteerAreas': volunteerAreas,
      'status': status,
      'expertiseAreas': expertiseAreas,
      'availableTimeSlots': availableTimeSlots,
      'educationLevel': educationLevel,
      'totalYearsOfWork': totalYearsOfWork,
    };
  }
}