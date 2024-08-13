// ignore_for_file: public_member_api_docs, sort_constructors_first
class VolunteerModel {
  // Gönüllü olarak görev almak istediğiniz alanlar
  String? volunteerAreas;

  // Statü (Fiziki, Online, Her ikisi)
  String? status;

  // Yetkin olduğunuz alanlar (çoktan seçmeli)
  String? expertiseAreas;

  // Müsait olduğunuz gün saat aralığı
  String? availableTimeSlots;

  // Mezuniyet durumu (İlkokul, Lise, Üniversite, Yüksek lisans, Doktora)
  String? educationLevel;

  // Toplam çalışma hayatı (1-50 arası rakam)
  int? totalYearsOfWork;

  // Fotoğrafı
  String? image;

  // Özgeçmişi
  String? cv;

  // Adres bilgileri
  String? city;
  String? district;
  String? neighborhood;
  String? address;

  VolunteerModel({
    this.volunteerAreas,
    this.status,
    this.expertiseAreas,
    this.availableTimeSlots,
    this.educationLevel,
    this.totalYearsOfWork,
    this.image,
    this.cv,
    this.city,
    this.district,
    this.neighborhood,
    this.address,
  });

  Map<String, dynamic> toJson() {
    return {
      'volunteerAreas': volunteerAreas,
      'status': status,
      'expertiseAreas': expertiseAreas,
      'availableTimeSlots': availableTimeSlots,
      'educationLevel': educationLevel,
      'totalYearsOfWork': totalYearsOfWork,
      'image': image,
      'cv': cv,
      'city': city,
      'district': district,
      'neighborhood': neighborhood,
      'address': address,
    };
  }

  factory VolunteerModel.fromJson(Map<String, dynamic> json) {
    return VolunteerModel(
      volunteerAreas: json['volunteerAreas'] as String?,
      status: json['status'] as String?,
      expertiseAreas: json['expertiseAreas'] as String?,
      availableTimeSlots: json['availableTimeSlots'] as String?,
      educationLevel: json['educationLevel'] as String?,
      totalYearsOfWork: json['totalYearsOfWork'] as int?,
      image: json['image'] as String?,
      cv: json['cv'] as String?,
      city: json['city'] as String?,
      district: json['district'] as String?,
      neighborhood: json['neighborhood'] as String?,
      address: json['address'] as String?,
    );
  }

  // Convert the model to an HTML table
  String toHtmlTable() {
    return '''
      <table border="1" cellpadding="5" cellspacing="0">
        <tr><th>Field</th><th>Value</th></tr>
        <tr><td>Volunteer Areas</td><td>${volunteerAreas ?? 'N/A'}</td></tr>
        <tr><td>Status</td><td>${status ?? 'N/A'}</td></tr>
        <tr><td>Expertise Areas</td><td>${expertiseAreas ?? 'N/A'}</td></tr>
        <tr><td>Available Time Slots</td><td>${availableTimeSlots ?? 'N/A'}</td></tr>
        <tr><td>Education Level</td><td>${educationLevel ?? 'N/A'}</td></tr>
        <tr><td>Total Years of Work</td><td>${totalYearsOfWork?.toString() ?? 'N/A'}</td></tr>
        <tr><td>Image</td><td>${image ?? 'N/A'}</td></tr>
        <tr><td>CV</td><td>${cv ?? 'N/A'}</td></tr>
        <tr><td>City</td><td>${city ?? 'N/A'}</td></tr>
        <tr><td>District</td><td>${district ?? 'N/A'}</td></tr>
        <tr><td>Neighborhood</td><td>${neighborhood ?? 'N/A'}</td></tr>
        <tr><td>Address</td><td>${address ?? 'N/A'}</td></tr>
      </table>
    ''';
  }
}
