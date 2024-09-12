import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/donation_model.dart';

class DonationProvider with ChangeNotifier {
  FirebaseFirestore firestore = FirebaseFirestore.instance;
  List<DonationModel> _donations = [
    DonationModel(
        brandId: "12345",
        userId: "userId",
        stkId1: "stkId1",
        stkId2: "stkId2",
        saleAmount: 100,
        orderNumber: "orderNumber",
        shoppingDate: DateTime.now())
  ];
  String totalDonationAmount = "";
  List<DonationModel> get donations {
    double total = _donations.fold(
      0.0,
      (sum, donation) {
        double donationAmount = donation.saleAmount ?? 0; // saleAmount null olabilir
        return sum + donationAmount;
      },
    );
    totalDonationAmount = total.toStringAsFixed(2); // Toplam tutar formatlı
    notifyListeners();
    return _donations;
  }

  set donations(List<DonationModel> value) {
    _donations = value;
    notifyListeners();
  }

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

      // Firestore'dan bağış verilerini çekme
      var snapshot = await firestore.collection("donations").where("userId", isEqualTo: userId).get();

      if (snapshot.docs.isNotEmpty) {
        List<DonationModel> tempDonations = [];
        for (var doc in snapshot.docs) {
          // Her belgeyi DonationModel'e çevir
          var data = doc.data();
          DonationModel donation = DonationModel.fromMap(data);
          tempDonations.add(donation);
        }

        // Yeni verilerle bağış listemizi güncelle
        donations = tempDonations;
        notifyListeners();
      } else {
        print("Bağış verisi bulunamadı.");
      }
    } catch (e) {
      print("DONATİON ERROR\n$e");
    }
  }
}
