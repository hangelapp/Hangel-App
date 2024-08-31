import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/donation_model.dart';

class DonationProvider with ChangeNotifier {
  FirebaseFirestore firestore = FirebaseFirestore.instance;
  List<DonationModel> donations = [
    // DonationModel(
    //   brandLogo: "assets/images/brand_logo.png",
    //   brandName: "Güzel Otomotiv",
    //   donationAmount: 12.36,
    //   stkLogo: "assets/images/brand_logo.png",
    //   stkName: "Türk Kızılayı",
    //   shoppingDate: DateTime.now(),
    //   cardAmount: 10000,
    // ),
    // DonationModel(
    //   brandLogo: "assets/images/brand_logo.png",
    //   brandName: "Sağlam İnşaat",
    //   donationAmount: 14.86,
    //   stkLogo: "assets/images/brand_logo.png",
    //   stkName: "Güvercin Severler Derneği",
    //   shoppingDate: DateTime.now().subtract(const Duration(days: 15)),
    //   cardAmount: 8700,
    // ),
  ];

  void addDonation(DonationModel donation) {
    donations.add(donation);
    notifyListeners();
  }

  Future<void> getDonations() async {
    try {
      String? userId = HiveHelpers.getUserFromHive().phone;
      if (userId == null) {
        throw Exception("Kullanıcı bulunamadı");
      }
      var snapshot = await firestore.collection("donationHistory").where("userId", isEqualTo: userId).get();
      if (snapshot.docs.isNotEmpty) {
        List<DonationModel> tempDonations = [];
        snapshot.docs.forEach((e) => tempDonations.add(DonationModel.fromMap(e.data())));
        donations = tempDonations;
        notifyListeners();
      }
    } catch (e) {
      print("DONATİON ERROR\n$e");
    }
  }
}
