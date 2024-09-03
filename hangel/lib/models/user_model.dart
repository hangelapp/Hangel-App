import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class UserModel {
  String? name;
  String? phone;
  String? uid;
  String? image;
  String? email;
  DateTime? birthDate;
  String? city;
  String? neighberhood;
  String? district;
  String? gender;
  String? doorAndHomeNumber;
  List<String> favoriteBrands = [];
  List<String> favoriteStks = [];
  DateTime? favoriteAddedDate;
  List<String> volunteers = []; // Bu field'a çok da gerek yok gibi
  DateTime? createdAt;

  UserModel({
    this.name,
    this.phone,
    this.uid,
    this.image,
    this.email,
    this.doorAndHomeNumber,
    this.birthDate,
    this.city,
    this.neighberhood,
    this.district,
    this.gender,
    this.favoriteBrands = const [],
    this.favoriteStks = const [],
    this.favoriteAddedDate,
    this.createdAt,
  });

  UserModel.fromJson(Map<String?, dynamic> json) {
    name = json['name'] ?? "";
    phone = json['phone'];
    uid = json['uid'];
    image = json['image'] ?? "";
    email = json['email'] ?? "";
    doorAndHomeNumber = json["doorAndHomeNumber"] ?? "";
    birthDate = json['birthDate'] != null
        ? (json['birthDate'] is Timestamp ? (json['birthDate'] as Timestamp).toDate() : json['birthDate'] as DateTime)
        : null;
    city = json['city'] ?? "";
    neighberhood = json['neighberhood'] ?? "";
    district = json['district'] ?? "";
    gender = json['gender'] ?? "";
    favoriteBrands = json['favoriteBrands'] != null ? json['favoriteBrands'].cast<String>() : [];
    favoriteStks = json['favoriteStks'] != null ? List.from(json['favoriteStks']) : [];
    favoriteAddedDate = json['favoriteAddedDate'] != null
        ? (json['favoriteAddedDate'] is Timestamp
            ? (json['favoriteAddedDate'] as Timestamp).toDate()
            : json['favoriteAddedDate'] as DateTime)
        : null;
    createdAt = json['createdAt'] != null
        ? (json['createdAt'] is Timestamp ? (json['createdAt'] as Timestamp).toDate() : json['createdAt'] as DateTime)
        : null;
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phone': phone,
      'uid': uid,
      'image': image,
      'email': email,
      "doorAndHomeNumber": doorAndHomeNumber,
      'birthDate': birthDate,
      'city': city,
      'neighberhood': neighberhood,
      'district': district,
      'gender': gender,
      'favoriteBrands': favoriteBrands,
      'favoriteStks': favoriteStks,
      "favoriteAddedDate": favoriteAddedDate,
      'createdAt': createdAt,
    };
  }

  static UserModel fromFirebaseUser(User user) {
    return UserModel(
      name: user.displayName,
      phone: user.phoneNumber,
      uid: user.uid,
      image: user.photoURL,
      email: user.email,
      createdAt: user.metadata.creationTime,
    );
  }

  String toHtmlTable() {
    return '''
      <table border="1">
        <tr>
          <th>Name</th>
          <td>${name ?? ''}</td>
        </tr>
        <tr>
          <th>Phone</th>
          <td>${phone ?? ''}</td>
        </tr>
        <tr>
          <th>Image</th>
          <td>${image ?? ''}</td>
        </tr>
        <tr>
          <th>Email</th>
          <td>${email ?? ''}</td>
        </tr>
        <tr>
          <th>Birth Date</th>
          <td>${birthDate != null ? birthDate!.toLocal().toString().split(' ')[0] : ''}</td>
        </tr>
        <tr>
          <th>City</th>
          <td>${city ?? ''}</td>
        </tr>
        <tr>
          <th>Neighborhood</th>
          <td>${neighberhood ?? ''}</td>
        </tr>
        <tr>
          <th>District</th>
          <td>${district ?? ''}</td>
        </tr>
        <tr>
          <th>Gender</th>
          <td>${gender ?? ''}</td>
        </tr>
        <tr>
          <th>Door and Home Number</th>
          <td>${doorAndHomeNumber ?? ''}</td>
        </tr>
      </table>
    ''';
  }

  static String mailSendSuccessMessage = """
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Gönüllülük Başvurusu</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          width: 80%;
          margin: 0 auto;
          padding: 20px;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333333;
        }
        p {
          font-size: 16px;
          color: #555555;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #777777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Başvurunuz Başarıyla Gönderildi!</h1>
        <p>Merhaba,</p>
        <p>Gönüllülük başvurunuz başarıyla gönderilmiştir. Yakında sizinle iletişime geçeceğiz.</p>
        <p>İlginiz için teşekkür ederiz!</p>
        <div class="footer">
          <p>Bu e-posta, sistemimiz tarafından otomatik olarak gönderilmiştir.</p>
        </div>
      </div>
    </body>
    </html>
  """;
}
