class DonationModel {
  final String userId;
  final String brandId;
  final String stkId1;
  final String stkId2;
  final double saleAmount;
  final String orderNumber;
  final DateTime? shoppingDate;

  DonationModel(
      {required this.brandId,
      required this.userId,
      required this.stkId1,
      required this.stkId2,
      required this.saleAmount,
      required this.orderNumber,
      required this.shoppingDate});

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'brandId': brandId,
      'stkId1': stkId1,
      'stkId2': stkId2,
      'saleAmount': saleAmount,
      'orderNumber': orderNumber,
      'shoppingDate': shoppingDate,
    };
  }

  factory DonationModel.fromMap(Map<String, dynamic> map) {
    return DonationModel(
      userId: map['userId'],
      brandId: map['brandId'],
      stkId1: map['stkId1'],
      stkId2: map['stkId2'],
      saleAmount: map['saleAmount'],
      orderNumber: map['orderNumber'],
      shoppingDate: map['shoppingDate'] == null ? null : DateTime.parse(map['shoppingDate'].toString()),
    );
  }
}
