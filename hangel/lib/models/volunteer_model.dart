// lib/models/volunteer_model.dart

class VolunteerModel {

  // Yeni eklenen alanlar
  String title;
  String description;
  DateTime startDate;
  DateTime endDate;
  String shape; // Online, Offline, Hibrit
  String period; // Günlük, Haftalık, Aylık, Parttime, Cumartesi, Pazar, Hafta Sonu, Esnek
  int totalWorkHours; // 1-225
  int totalDays; // 1-365
  int requiredPersons;
  String ageLimit; // 16 ve üzeri, 18 ve üzeri, 21 ve üzeri
  bool transportationCost;
  bool accommodation;
  bool meal;

  VolunteerModel({
    // Yeni alanlar
    required this.title,
    required this.description,
    required this.startDate,
    required this.endDate,
    required this.shape,
    required this.period,
    required this.totalWorkHours,
    required this.totalDays,
    required this.requiredPersons,
    required this.ageLimit,
    required this.transportationCost,
    required this.accommodation,
    required this.meal,
  });

  Map<String, dynamic> toJson() => {
        // Yeni alanlar
        "title": title,
        "description": description,
        "startDate": startDate.toIso8601String(),
        "endDate": endDate.toIso8601String(),
        "shape": shape,
        "period": period,
        "totalWorkHours": totalWorkHours,
        "totalDays": totalDays,
        "requiredPersons": requiredPersons,
        "ageLimit": ageLimit,
        "transportationCost": transportationCost,
        "accommodation": accommodation,
        "meal": meal,
      };

  String toHtmlTable() {
    return '''
      <h2>$title</h2>
      <p>$description</p>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>Başlama Süresi</th>
          <td>${startDate.day}/${startDate.month}/${startDate.year}</td>
        </tr>
        <tr>
          <th>Bitiş Süresi</th>
          <td>${endDate.day}/${endDate.month}/${endDate.year}</td>
        </tr>
        <tr>
          <th>Şekli</th>
          <td>$shape</td>
        </tr>
        <tr>
          <th>Periyodu</th>
          <td>$period</td>
        </tr>
        <tr>
          <th>Toplam Çalışma Saati</th>
          <td>$totalWorkHours</td>
        </tr>
        <tr>
          <th>Toplam Gün</th>
          <td>$totalDays</td>
        </tr>
        <tr>
          <th>Kaç Kişi İhtiyaç</th>
          <td>$requiredPersons</td>
        </tr>
        <tr>
          <th>Yaş Sınırı</th>
          <td>$ageLimit</td>
        </tr>
        <tr>
          <th>Yol Masrafı</th>
          <td>${transportationCost ? "Var" : "Yok"}</td>
        </tr>
        <tr>
          <th>Konaklama</th>
          <td>${accommodation ? "Var" : "Yok"}</td>
        </tr>
        <tr>
          <th>Yemek</th>
          <td>${meal ? "Var" : "Yok"}</td>
        </tr>
      </table>
    ''';
  }

  factory VolunteerModel.fromJson(Map<String, dynamic> json) {
    return VolunteerModel(
      // Yeni alanlar
      title: json['title'],
      description: json['description'],
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      shape: json['shape'],
      period: json['period'],
      totalWorkHours: json['totalWorkHours'],
      totalDays: json['totalDays'],
      requiredPersons: json['requiredPersons'],
      ageLimit: json['ageLimit'],
      transportationCost: json['transportationCost'],
      accommodation: json['accommodation'],
      meal: json['meal'],
    );
  }
}
