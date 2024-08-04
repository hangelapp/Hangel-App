import 'package:flutter/material.dart';
import 'package:hangel/models/donation_model.dart';

class DonationProvider with ChangeNotifier{
  List<DonationModel> donations = [];

  void addDonation(DonationModel donation){
    donations.add(donation);
    notifyListeners();
  }
}