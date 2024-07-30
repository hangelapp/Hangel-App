class DonationModel {
  final String? brandLogo;
  final String? brandName;
  final String? stkLogo;
  final String? stkName;
  final double? donationAmount;
  final DateTime? shoppingDate;
  final double? cardAmount;

  DonationModel({
    this.brandLogo,
    this.brandName,
    this.stkLogo,
    this.stkName,
    this.donationAmount,
    this.shoppingDate,
    this.cardAmount,
  });

  Map<String, dynamic> toMap() {
    return {
      'brandLogo': brandLogo,
      'brandName': brandName,
      'stkLogo': stkLogo,
      'stkName': stkName,
      'donationAmount': donationAmount,
      'shoppingDate': shoppingDate,
      'cardAmount': cardAmount,
    };
  }

  factory DonationModel.fromMap(Map<String, dynamic> map) {
    return DonationModel(
      brandLogo: map['brandLogo'],
      brandName: map['brandName'],
      stkLogo: map['stkLogo'],
      stkName: map['stkName'],
      donationAmount: map['donationAmount'],
      shoppingDate: map['shoppingDate'] == null
          ? null
          : DateTime.parse(map['shoppingDate'].toString()),
      cardAmount: map['cardAmount'],
    );
  }
}
