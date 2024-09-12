import 'package:cloud_firestore/cloud_firestore.dart';

class DonationModel {
  final String? brandId;
  final String? orderNumber;
  final double? saleAmount;
  final DateTime? shoppingDate;
  final String? stkId1;
  final String? stkId2;
  final String? userId;

  DonationModel({
    required this.brandId,
    required this.orderNumber,
    required this.saleAmount,
    required this.shoppingDate,
    required this.stkId1,
    required this.stkId2,
    required this.userId,
  });

  // Firestore'dan veri almak için gerekli map fonksiyonu
  factory DonationModel.fromMap(Map<String, dynamic> map) {
    return DonationModel(
      brandId: map['brandId'] ?? '',
      orderNumber: map['orderNumber'] ?? '',
      saleAmount: (map['saleAmount'] as num?)?.toDouble() ?? 0.0,
      shoppingDate: (map['shoppingDate'] as Timestamp).toDate(),
      stkId1: map['stkId1'] ?? '',
      stkId2: map['stkId2'] ?? '',
      userId: map['userId'] ?? '',
    );
  }

  // Firestore'a veri göndermek için gerekli map fonksiyonu
  Map<String, dynamic> toMap() {
    return {
      'brandId': brandId,
      'orderNumber': orderNumber,
      'saleAmount': saleAmount,
      'shoppingDate': shoppingDate,
      'stkId1': stkId1,
      'stkId2': stkId2,
      'userId': userId,
    };
  }
}
