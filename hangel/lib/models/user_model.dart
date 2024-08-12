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
  List<String> volunteers = [];
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
}
