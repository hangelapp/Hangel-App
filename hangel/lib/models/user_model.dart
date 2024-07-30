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
  List<String> favoriteBrands = [];
  List<String> favoriteStks = [];
  DateTime? createdAt;

  UserModel({
    this.name,
    this.phone,
    this.uid,
    this.image,
    this.email,
    this.birthDate,
    this.city,
    this.neighberhood,
    this.district,
    this.gender,
    this.favoriteBrands = const [],
    this.favoriteStks = const [],
    this.createdAt,
  });

  UserModel.fromJson(Map<String, dynamic> json) {
    name = json['name'];
    phone = json['phone'];
    uid = json['uid'];
    image = json['image'];
    email = json['email'];

    birthDate = DateTime.tryParse(json['birthDate'].toString());
    city = json['city'];
    neighberhood = json['neighberhood'];
    district = json['district'];
    gender = json['gender'];
    favoriteBrands = json['favoriteBrands'] != null
        ? json['favoriteBrands'].cast<String>()
        : [];
    favoriteStks =
        json['favoriteStks'] != null ? json['favoriteStks'].cast<String>() : [];
    createdAt = DateTime.tryParse(json['createdAt'].toString());
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phone': phone,
      'uid': uid,
      'image': image,
      'email': email,
      'birthDate': birthDate,
      'city': city,
      'neighberhood': neighberhood,
      'district': district,
      'gender': gender,
      'favoriteBrands': favoriteBrands,
      'favoriteStks': favoriteStks,
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
