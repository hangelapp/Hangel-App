import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:hangel/constants/constants.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/models/general_response_model.dart';

import '../models/brand_model.dart';
import '../models/offer_model.dart';

class OfferProvider with ChangeNotifier {
  List<OfferModel> offers = [];
  Map<String, String> offerImages = {};
  int page = 1;
  int limit = 10;

  Future<GeneralResponseModel> getOffers() async {
    try {
      Dio dio = Dio();
      var response = await dio.getUri(Uri.parse(
          "${AppConstants.REKLAM_ACTION_BASE_URL}?api_key=${AppConstants.REKLAM_ACTION_API_KEY}&Target=Affiliate_Offer&Method=findAll&fields[]=percent_payout&fields[]=name&fields[]=id&filters[payout_type]=cpa_percentage&limit=$limit&page=$page&contain[]=OfferVertical&contain[]=TrackingLink&contain[]=OfferCategory&contain[]=Thumbnail"));
      if (response.statusCode == 200) {
        var json = response.data;
        print(response.data);
        // Offer <-> Brand argument match
        for (Map<String, dynamic> val in (json["response"]["data"]["data"] as Map<String, dynamic>).values) {
          if (!offers.any((e) => e.id == val["Offer"]["id"])) {
            String? id = val["Offer"]["id"];
            String? name = val["Offer"]["name"];
            String? logo = val["Thumbnail"]["url"];
            String? sector = (val["OfferVertical"] as Map<String, dynamic>).values.first["name"];
            bool? inEarthquakeZone = false;
            bool? isSocialEnterprise = false;
            double? donationRate = val["Offer"]["percent_payout"];
            DateTime? creationDate = DateTime.now();
            String? bannerImage = val["Thumbnail"]["thumbnail"];
            String? detailText = AppConstants.DETAIL_TEXT(val["Offer"]["name"]);
            String? link = val["TrackingLink"]["click_url"];
            List<CategoryModel>? categories = (val["OfferCategory"] as Map<String, dynamic>)
                .values
                .map<CategoryModel>((categoryJson) => CategoryModel.fromJson(categoryJson))
                .toList();
            int favoriteCount = 0;
            
            offers.add(OfferModel.fromJson(val["Offer"]));
          } else {
            print("Element with ID ${val["Offer"]["id"]} already exists.");
          }
        }
        notifyListeners();
        await getOfferImages();
        return GeneralResponseModel(success: true, data: offers, message: "Successfully");
      }
      return GeneralResponseModel(success: false, data: response.data, message: "Error handled");
    } catch (e) {
      return GeneralResponseModel(success: false, message: e.toString(), data: null);
    }
  }

  Future<GeneralResponseModel> getOfferImages() async {
    try {
      Dio dio = Dio();
      String ids = "";
      for (var of in offers) {
        ids += "&ids[]=" + (of.id ?? "");
      }
      var response = await dio.getUri(Uri.parse(
          "${AppConstants.REKLAM_ACTION_BASE_URL}?api_key=${AppConstants.REKLAM_ACTION_API_KEY}&Target=Affiliate_Offer&Method=getThumbnail$ids"));
      if (response.statusCode == 200) {
        var json = response.data;
        for (var data in json["response"]["data"]) {
          // print((data["Thumbnail"] as Map<String,dynamic>).values.first["url"]);
          var indexWhere = offers.indexWhere((element) => element.id == data["offer_id"]);
          if (indexWhere != -1) {
            offerImages.update(
              offers[indexWhere].id ?? "",
              (value) => (data["Thumbnail"] as Map<String, dynamic>).values.first["url"],
              ifAbsent: () => (data["Thumbnail"] as Map<String, dynamic>).values.first["url"],
            );
          }
        }
        print(offerImages);
        notifyListeners();
        return GeneralResponseModel(success: true, data: offerImages, message: "Successfully");
      }
      return GeneralResponseModel(success: false, data: offerImages, message: "Error handled");
    } catch (e) {
      return GeneralResponseModel(success: false, message: e.toString(), data: null);
    }
  }

  Future<List<OfferModel>> getOfferByName(String name) async {
    try {
      Dio dio = Dio();
      var response = await dio.get(AppConstants.REKLAM_ACTION_BASE_URL, queryParameters: {
        "api_key": AppConstants.REKLAM_ACTION_API_KEY,
        "Target": "Affiliate_Offer",
        "Method": "findAll",
        "fields[]": "name",
        "limit": 250,
      });

      List<OfferModel> resultOffers = [];

      if (response.statusCode == 200) {
        var data = response.data;
        if (data["response"]["data"]["data"] is Map<String, dynamic>) {
          for (var val in (data["response"]["data"]["data"] as Map<String, dynamic>).values) {
            String offerName = val["Offer"]["name"].toString().toLowerCase().removeBrackets().replaceAll(" ", "");
            // print((element.name ?? "*").toLowerCase().removeBrackets().contains("col"));
            print("OFFER " + offerName);
            print("NAME  " + name);
            if (offerName.contains(name)) {
              print("GEÇTİ *******************" + offerName);
              // print("ADDED NAME: "+element.)
              resultOffers.add(OfferModel.fromJson(val["Offer"]));
            }
          }
        } else {
          print("Unexpected data format");
        }

        return resultOffers;
      } else {
        throw Exception("Bağlantı problemi!");
      }
    } catch (e) {
      print("Error: $e");
      return [];
    }
  }

  void nextPage() {
    page++;
    notifyListeners();
  }
}
