import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dio/dio.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:hangel/controllers/brand_controller.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/helpers/locator.dart';

import 'package:hangel/models/brand_form_model.dart';
import 'package:hangel/models/brand_info_model.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/models/general_response_model.dart';
import 'package:hangel/models/image_model.dart';
import 'package:hangel/models/sector_model.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/providers/login_register_page_provider.dart';

import '../constants/constants.dart';

class BrandProvider with ChangeNotifier {
  final _brandController = locator<BrandController>();

  int page = 1;
  int limit = 10;

  bool _favoriteButtonLoading = false;
  bool get favoriteButtonLoading => _favoriteButtonLoading;
  set favoriteButtonLoading(bool value) {
    _favoriteButtonLoading = value;
    notifyListeners();
  }

  Set<BrandModel> _favoriteBrandList = {};
  Set<BrandModel> get favoriteBrandList => _favoriteBrandList;
  set favoriteBrandList(Set<BrandModel> value) {
    _favoriteBrandList = value;
    notifyListeners();
  }

  bool _sectorsLoaded = false;
  bool get sectorsLoaded => _sectorsLoaded;
  set sectorsLoaded(bool value) {
    _sectorsLoaded = value;
    notifyListeners();
  }

  List<SectorModel> _sectorsList = [];
  List<SectorModel> get sectorsList => _sectorsList;
  set sectorsList(List<SectorModel> value) {
    _sectorsList = value;
    notifyListeners();
  }

  List<BrandModel> _brandList = [];
  List<BrandModel> get brandList => _brandList;
  set brandList(List<BrandModel> value) {
    _brandList = value;
    notifyListeners();
  }

  LoadingState _loadingState = LoadingState.loaded;
  LoadingState get loadingState => _loadingState;
  set loadingState(LoadingState value) {
    _loadingState = value;
    notifyListeners();
  }

  LoadingState _addBrandState = LoadingState.loaded;
  LoadingState get addBrandState => _addBrandState;
  set addBrandState(LoadingState value) {
    _addBrandState = value;
    notifyListeners();
  }

  LoadingState _deleteBrandState = LoadingState.loaded;
  LoadingState get deleteBrandState => _deleteBrandState;
  set deleteBrandState(LoadingState value) {
    _deleteBrandState = value;
    notifyListeners();
  }

  String _searchText = '';
  String get searchText => _searchText;
  set searchText(String value) {
    _searchText = value;
    notifyListeners();
  }

  List<String> get brandSectors => _brandList.map((e) => e.sector ?? "Diğer").toList().toSet().toList();

  String _filterText = "";
  String get filterText => _filterText;
  set filterText(String value) {
    _filterText = value;
    notifyListeners();
  }

  String _sortText = "";
  String get sortText => _sortText;
  set sortText(String value) {
    _sortText = value;
    notifyListeners();
  }

  LoadingState _sendFormState = LoadingState.loaded;
  LoadingState get sendFormState => _sendFormState;
  set sendFormState(LoadingState value) {
    _sendFormState = value;
    notifyListeners();
  }

  String _selectedSTKID = "";
  String get selectedSTKID => _selectedSTKID;
  set selectedSTKID(String value) {
    _selectedSTKID = value;
    notifyListeners();
  }

  List<String> redIds = ["1209", "59291", "60179"];

  Future<void> getSectorsList() async {
    try {
      sectorsLoaded = false;
      notifyListeners();
      var firebase = FirebaseFirestore.instance;
      final listResult = await firebase.collection("sectors").get();
      sectorsList = listResult.docs.map((e) => SectorModel.fromJson(e.data())).toList();
      sectorsLoaded = true;
      notifyListeners();
    } catch (e) {
      print(e);
      sectorsLoaded = false;
      notifyListeners();
    }
  }

  Future<BrandInfoModel?> getBrandInfo({required String id}) async {
    try {
      var firebase = FirebaseFirestore.instance;
      favoriteButtonLoading = true;
      var value = await firebase.collection("brandInfo").doc(id).get().then((value) {
        favoriteButtonLoading = false;
        return BrandInfoModel.fromJson(value.data() ?? {"brandId": id} as Map<String, dynamic>);
      }).then((value) => value);
      return value;
    } catch (e) {
      print(e);
      favoriteButtonLoading = false;
      return BrandInfoModel.blank();
    }
  }

  Future<BrandInfoModel?> setFavoriteBrand({required String id, required String name}) async {
    try {
      final uid = HiveHelpers.getUid();
      favoriteButtonLoading = true;
      BrandInfoModel? info = await getBrandInfo(id: id);
      if (info?.brandId == null) {
        favoriteButtonLoading = false;
        return null;
      }
      if (!(info?.favoriteIds!.contains(uid) == true)) {
        info?.favoriteIds!.add(uid);
      } else {
        info?.favoriteIds!.removeWhere((element) => element == uid);
      }
      info?.brandName = name;
      await FirebaseFirestore.instance
          .collection("brandInfo")
          .doc(id)
          .set(info?.toJson() ?? BrandInfoModel.blank().toJson());
      favoriteButtonLoading = false;
      return info;
    } catch (e) {
      print(e);
      favoriteButtonLoading = false;
    }
    favoriteButtonLoading = false;
    return null;
  }

  Future<GeneralResponseModel> getOffers() async {
    try {
      Dio dio = Dio();
      var response = await dio.getUri(Uri.parse(
          "${AppConstants.REKLAM_ACTION_BASE_URL}?api_key=${AppConstants.REKLAM_ACTION_API_KEY}&Target=Affiliate_Offer&Method=findAll&fields[]=percent_payout&fields[]=name&fields[]=id&filters[payout_type]=cpa_percentage&limit=$limit&page=$page&contain[]=OfferVertical&contain[]=TrackingLink&contain[]=OfferCategory&contain[]=Thumbnail&filters[percent_payout][GREATER_THAN]=0"));
      if (response.statusCode == 200) {
        var json = response.data;
        // Offer <-> Brand argument match
        for (Map<String, dynamic> val in (json["response"]["data"]["data"] as Map<String, dynamic>).values) {
          if (!brandList.any((e) => e.id == val["Offer"]["id"])) {
            String? id = val["Offer"]["id"];
            if (redIds.contains(id)) {
              continue;
            }
            String? name = val["Offer"]["name"];
            String? logo = val["Thumbnail"]["url"];
            // if (await dio.getUri(Uri.parse(logo ?? "")).then((value) => value.statusCode != 200)) {
            //   continue;
            // }
            String? sector = (val["OfferVertical"] is Map<String, dynamic>)
                ? (val["OfferVertical"] as Map<String, dynamic>).values.first["name"]
                : null;
            bool? inEarthquakeZone = false;
            bool? isSocialEnterprise = false;
            double? donationRate = double.tryParse(val["Offer"]["percent_payout"]);
            DateTime? creationDate = DateTime.now();
            String? bannerImage = val["Thumbnail"]["thumbnail"];
            String? detailText = "";
            // String? detailText = AppConstants.DETAIL_TEXT(val["Offer"]["name"]);
            String? link = val["TrackingLink"]["click_url"];
            // if (await dio.getUri(Uri.parse(link ?? "")).then((value) => value.statusCode != 200)) {
            //   continue;
            // }
            List<CategoryModel>? categories = (val["OfferCategory"] as Map<String, dynamic>)
                .values
                .map<CategoryModel>((categoryJson) => CategoryModel.fromJson(categoryJson))
                .toList();
            int favoriteCount = 0;

            _brandList.add(BrandModel(
              id: id,
              bannerImage: bannerImage,
              categories: categories,
              creationDate: creationDate,
              detailText: detailText,
              donationRate: donationRate,
              favoriteCount: favoriteCount,
              inEarthquakeZone: inEarthquakeZone,
              isSocialEnterprise: isSocialEnterprise,
              link: link,
              logo: logo,
              name: (name ?? "").removeBrackets(),
              sector: sector,
              type: "reklamaction",
            ));
          } else {
            // print("Element with ID ${val["Offer"]["id"]} already exists.");
          }
        }
        notifyListeners();
        return GeneralResponseModel(success: true, data: brandList, message: "Successfully");
      }
      return GeneralResponseModel(success: false, data: response.data, message: "Error handled");
    } catch (e) {
      return GeneralResponseModel(success: false, message: e.toString(), data: null);
    }
  }

  Future<GeneralResponseModel> getOffers2() async {
    try {
      Dio dio = Dio();
      // dio.interceptors.add(PrettyDioLogger(
      //   requestHeader: true,
      //   requestBody: true,
      //   responseBody: true,
      //   responseHeader: false,
      //   error: true,
      //   compact: true,
      // ));
      var response = await dio.getUri(Uri.parse(
          "${AppConstants.GELIR_ORTAKLARI_BASE_URL}?api_key=${AppConstants.GELIR_ORTAKLARI_API_KEY}&Target=Affiliate_Offer&Method=findMyApprovedOffers&fields[]=name&fields[]=id&limit=$limit&page=$page&contain[]=OfferVertical&contain[]=TrackingLink&contain[]=OfferCategory&contain[]=Thumbnail&contain[]=Goal"));
      if (response.statusCode == 200) {
        var json = response.data;
        // Offer <-> Brand argument match
        for (Map<String, dynamic> val in (json["response"]["data"]["data"] as Map<String, dynamic>).values) {
          if (!brandList.any((e) => e.id == val["Offer"]["id"])) {
            // print("Eklendi!");
            String? id = val["Offer"]["id"];
            if (redIds.contains(id)) {
              continue;
            }
            String? name = val["Offer"]["name"];
            String? logo = val["Thumbnail"]["url"];
            // if (await dio.getUri(Uri.parse(logo ?? "")).then((value) => value.statusCode != 200)) {
            //   continue;
            // }
            List<CategoryModel>? categories = val["OfferCategory"] is Map<String, dynamic>
                ? (val["OfferCategory"] as Map<String, dynamic>)
                    .values
                    .map<CategoryModel>((categoryJson) => CategoryModel.fromJson(categoryJson))
                    .toList()
                : [];
            String? sector = (val["OfferVertical"] is Map<String, dynamic>)
                ? (val["OfferVertical"] as Map<String, dynamic>).values.first["name"]
                : categories.isEmpty
                    ? null
                    : categories.first.name;
            bool? inEarthquakeZone = false;
            bool? isSocialEnterprise = false;
            double? donationRate;
            if (val["Goal"] is Map<String, dynamic>) {
              Map<String, dynamic> goal = val["Goal"] as Map<String, dynamic>;
              for (var e in goal.entries) {
                if (e.value["payout_type"] == "cpa_percentage") {
                  donationRate = double.tryParse(e.value["percent_payout"] ?? "");
                  // print(e.value);
                  continue;
                }
              }
            }
            if ((donationRate ?? 0) <= 0) {
              continue;
            }
            // print(id);
            DateTime? creationDate = DateTime.now();
            String? bannerImage = val["Thumbnail"]["thumbnail"];
            String? detailText = "";
            // String? detailText = AppConstants.DETAIL_TEXT(val["Offer"]["name"]);
            String? link = val["TrackingLink"]["click_url"];
            // if (await dio.getUri(Uri.parse(link ?? "")).then((value) => value.statusCode != 200)) {
            //   continue;
            // }

            int favoriteCount = 0;

            _brandList.add(BrandModel(
              id: id,
              bannerImage: bannerImage,
              categories: categories,
              creationDate: creationDate,
              detailText: detailText,
              donationRate: donationRate,
              favoriteCount: favoriteCount,
              inEarthquakeZone: inEarthquakeZone,
              isSocialEnterprise: isSocialEnterprise,
              link: link,
              logo: logo,
              name: (name ?? "").removeTypes(),
              sector: sector,
              type: "gelirortaklari",
            ));
          } else {
            print("Bu id'de bir kayıt zaten var!");
            // print("Element with ID ${val["Offer"]["id"]} already exists.");
          }
        }
        notifyListeners();
        return GeneralResponseModel(success: true, data: brandList, message: "Successfully");
      }
      return GeneralResponseModel(success: false, data: response.data, message: "Error handled");
    } catch (e) {
      print(e);
      return GeneralResponseModel(success: false, message: e.toString(), data: null);
    }
  }

  Future<GeneralResponseModel> getFilteredOffers(List<String> brandIds) async {
    try {
      // Listeyi her veri çağrımından önce sıfırlayın
      _favoriteBrandList.clear();
      List<BrandModel> fetchedBrands = [];

      for (String brandId in brandIds) {
        var brand = await getBrandById(brandId);
        if (brand != null) {
          _favoriteBrandList.add(brand);
        } else {
          var brand = await getBrandById2(brandId);
          if (brand != null) {
            _favoriteBrandList.add(brand);
          }
        }
      }

      _favoriteBrandList.addAll(fetchedBrands);
      notifyListeners();
      return GeneralResponseModel(success: true, data: _favoriteBrandList, message: "Successfully");
    } catch (e) {
      print(e);
      return GeneralResponseModel(success: false, message: e.toString(), data: null);
    }
  }

  Future<List<BrandModel>> getOffersForSearch(String pattern) async {
    try {
    Dio dio = Dio();
    List<BrandModel> resultBrands = [];
    var response = await dio.getUri(Uri.parse(
        "${AppConstants.REKLAM_ACTION_BASE_URL}?api_key=${AppConstants.REKLAM_ACTION_API_KEY}&Target=Affiliate_Offer&Method=findAll&fields[]=percent_payout&fields[]=name&fields[]=id&filters[payout_type]=cpa_percentage&limit=250&contain[]=OfferVertical&contain[]=TrackingLink&contain[]=OfferCategory&contain[]=Thumbnail&filters[percent_payout][GREATER_THAN]=0"));
    if (response.statusCode == 200) {
      var json = response.data;
      // Offer <-> Brand argument match
      for (Map<String, dynamic> val in (json["response"]["data"]["data"] as Map<String, dynamic>).values) {
        String offerName = val["Offer"]["name"].toString().toLowerCase().removeBrackets().replaceAll(" ", "");
        if (offerName.contains(pattern)) {
        String? id = val["Offer"]["id"];
        if (redIds.contains(id)) {
          continue;
        }
        String? name = val["Offer"]["name"];
        String? logo;
        try {
          logo = val["Thumbnail"]["url"];
        } catch (e) {}
        // if (await dio.getUri(Uri.parse(logo ?? "")).then((value) => value.statusCode != 200)) {
        //   continue;
        // }
        String? sector = (val["OfferVertical"] is Map<String, dynamic>)
            ? (val["OfferVertical"] as Map<String, dynamic>).values.first["name"]
            : null;
        bool? inEarthquakeZone = false;
        bool? isSocialEnterprise = false;
        double? donationRate = double.tryParse(val["Offer"]["percent_payout"]);
        DateTime? creationDate = DateTime.now();
        String? bannerImage;
        try {
          bannerImage = val["Thumbnail"]["thumbnail"];
        } catch (e) {}
        String? detailText = AppConstants.DETAIL_TEXT(val["Offer"]["name"]);
        String? link = val["TrackingLink"]["click_url"];
        List<CategoryModel>? categories;
        try {
          categories = (val["OfferCategory"] as Map<String, dynamic>)
              .values
              .map<CategoryModel>((categoryJson) => CategoryModel.fromJson(categoryJson))
              .toList();
        } catch (e) {}

        int favoriteCount = 0;

        resultBrands.add(BrandModel(
          id: id,
          bannerImage: bannerImage,
          categories: categories,
          creationDate: creationDate,
          detailText: detailText,
          donationRate: donationRate,
          favoriteCount: favoriteCount,
          inEarthquakeZone: inEarthquakeZone,
          isSocialEnterprise: isSocialEnterprise,
          link: link,
          logo: logo,
          name: (name ?? "").removeBrackets(),
          sector: sector,
          type: "reklamaction",
        ));

        }
      }
      // await createExcelFile2(resultBrands);
      notifyListeners();
      return resultBrands;
    }
    throw Exception("Bağlantı problemi!");
    } catch (e) {
      print(e);
      return [];
    }
  }

  Future<List<BrandModel>> getOffersForSearch2(String pattern) async {
    try {
      Dio dio = Dio();
      // dio.interceptors.add(PrettyDioLogger(requestBody: true));
      List<BrandModel> resultBrands = [];

      // getOffers2 ile aynı mantığı kullanabilmek için URL’ye "contain[]=Goal" ekleniyor.
      var response = await dio.getUri(Uri.parse(
          "${AppConstants.GELIR_ORTAKLARI_BASE_URL}?api_key=${AppConstants.GELIR_ORTAKLARI_API_KEY}&Target=Affiliate_Offer&Method=findMyApprovedOffers&fields[]=name&fields[]=id&limit=9999&contain[]=OfferVertical&contain[]=TrackingLink&contain[]=OfferCategory&contain[]=Thumbnail&contain[]=Goal"));

      if (response.statusCode == 200) {
        var json = response.data;
        // API'den dönen "data" kısmı Map şeklinde olduğundan values üzerinden dönüyoruz.
        for (Map<String, dynamic> val in (json["response"]["data"]["data"] as Map<String, dynamic>).values) {
          // Arama için offer adını normalize edip pattern ile karşılaştırıyoruz.

          String offerName = val["Offer"]["name"].toString().toLowerCase().removeTypes().replaceAll(" ", "");
          if (!offerName.contains(pattern.toLowerCase().removeTypes().replaceAll(" ", ""))) {
            continue;
          }
          if (offerName.contains(pattern)) {
            String? id = val["Offer"]["id"];
            if (redIds.contains(id)) {
              continue;
            }
            String? name = val["Offer"]["name"];
            String? logo = val["Thumbnail"]["url"];
            // if (await dio.getUri(Uri.parse(logo ?? "")).then((value) => value.statusCode != 200)) {
            //   continue;
            // }
            List<CategoryModel>? categories = val["OfferCategory"] is Map<String, dynamic>
                ? (val["OfferCategory"] as Map<String, dynamic>)
                    .values
                    .map<CategoryModel>((categoryJson) => CategoryModel.fromJson(categoryJson))
                    .toList()
                : [];
            String? sector = (val["OfferVertical"] is Map<String, dynamic>)
                ? (val["OfferVertical"] as Map<String, dynamic>).values.first["name"]
                : categories.isEmpty
                    ? null
                    : categories.first.name;
            bool? inEarthquakeZone = false;
            bool? isSocialEnterprise = false;
            double? donationRate;
            if (val["Goal"] is Map<String, dynamic>) {
              Map<String, dynamic> goal = val["Goal"] as Map<String, dynamic>;
              for (var e in goal.entries) {
                if (e.value["payout_type"] == "cpa_percentage") {
                  donationRate = double.tryParse(e.value["percent_payout"] ?? "");
                  // print(e.value);
                  continue;
                }
              }
            }
            if ((donationRate ?? 0) <= 0) {
              continue;
            }
            // print(id);
            DateTime? creationDate = DateTime.now();
            String? bannerImage = val["Thumbnail"]["thumbnail"];
            String? detailText = "";
            // String? detailText = AppConstants.DETAIL_TEXT(val["Offer"]["name"]);
            String? link = val["TrackingLink"]["click_url"];
            // if (await dio.getUri(Uri.parse(link ?? "")).then((value) => value.statusCode != 200)) {
            //   continue;
            // }

            int favoriteCount = 0;

          String? id = val["Offer"]["id"];
          // redIds listesinde varsa veya aynı id zaten eklenmişse devam et.
          if (redIds.contains(id) || resultBrands.any((e) => e.id == id)) {
            // print("Bu id'de bir kayıt zaten var!");
            continue;
          }

          String? name = val["Offer"]["name"];
          String? logo = val["Thumbnail"]["url"];

          // Kategoriler; varsa Map içerisinden çekiyoruz, yoksa boş liste.
          List<CategoryModel> categories = val["OfferCategory"] is Map<String, dynamic>
              ? (val["OfferCategory"] as Map<String, dynamic>)
                  .values
                  .map<CategoryModel>((categoryJson) => CategoryModel.fromJson(categoryJson))
                  .toList()
              : [];

          // Sektör bilgisini OfferVertical üzerinden al, yoksa kategoriden türet.
          String? sector = (val["OfferVertical"] is Map<String, dynamic>)
              ? (val["OfferVertical"] as Map<String, dynamic>).values.first["name"]
              : categories.isNotEmpty
                  ? categories.first.name
                  : null;

          bool inEarthquakeZone = false;
          bool isSocialEnterprise = false;
          double? donationRate;

          // donationRate bilgisini Goal içerisinden "cpa_percentage" kontrolü ile alıyoruz.
          if (val["Goal"] is Map<String, dynamic>) {
            Map<String, dynamic> goal = val["Goal"] as Map<String, dynamic>;
            for (var entry in goal.entries) {
              if (entry.value["payout_type"] == "cpa_percentage") {
                donationRate = double.tryParse(entry.value["percent_payout"] ?? "");
                break;
              }
            }
          }
          // donationRate 0 veya geçersizse, bu teklifi eklemiyoruz.
          if ((donationRate ?? 0) <= 0) {
            continue;
          }

          DateTime creationDate = DateTime.now();
          String? bannerImage = val["Thumbnail"]["thumbnail"];
          // getOffers2’de detailText boş string olarak ayarlanmış.
          String detailText = "";
          String? link = val["TrackingLink"]["click_url"];
          int favoriteCount = 0;

          resultBrands.add(BrandModel(
            id: id,
            bannerImage: bannerImage,
            categories: categories,
            creationDate: creationDate,
            detailText: detailText,
            donationRate: donationRate,
            favoriteCount: favoriteCount,
            inEarthquakeZone: inEarthquakeZone,
            isSocialEnterprise: isSocialEnterprise,
            link: link,
            logo: logo,
            name: (name ?? "-").removeTypes(),
            sector: sector,
            type: "gelirortaklari",
          ));
        }
        notifyListeners();
        // await createExcelFile(resultBrands);

        return resultBrands;
      }
      throw Exception("Bağlantı problemi!");
    } catch (e) {
      return [];
    }
  }

  Future<BrandModel?> getBrandById(String brandId) async {
    try {
      Dio dio = Dio();
      var response = await dio.getUri(Uri.parse(
          "${AppConstants.REKLAM_ACTION_BASE_URL}?api_key=${AppConstants.REKLAM_ACTION_API_KEY}&Target=Affiliate_Offer&Method=findAll&fields[]=percent_payout&fields[]=name&fields[]=id&filters[payout_type]=cpa_percentage&limit=1&filters[id]=$brandId&contain[]=OfferVertical&contain[]=TrackingLink&contain[]=OfferCategory&contain[]=Thumbnail"));
      if (response.statusCode == 200 && response.data['response']['status'] == 1) {
        // API'den gelen veriyi doğru anahtarlardan alıyoruz
        var offerData = response.data['response']['data']['data'][brandId];

        if (offerData != null) {
          // API'den gelen Offer bilgileri
          var offer = offerData['Offer'];
          var trackingLink = offerData['TrackingLink'];
          var categories = offerData['OfferCategory']
                  ?.values
                  ?.map<CategoryModel>((categoryJson) => CategoryModel.fromJson(categoryJson))
                  .toList() ??
              [];
          var thumbnail = offerData['Thumbnail'];

          // Gerekli alanları ayrıştırma
          String? id = offer['id'].toString();
          String? name = offer['name'];
          String? sector;
          try {
            sector = offerData['OfferVertical'] != null && offerData['OfferVertical'].isNotEmpty
                ? offerData['OfferVertical'].first['name']
                : null;
          } catch (e) {
            sector = offerData['OfferVertical'] != null && offerData['OfferVertical'].isNotEmpty
                ? offerData['OfferVertical']['name']
                : null;
          }
          double? donationRate = double.tryParse(offer['percent_payout'].toString());
          DateTime? creationDate = DateTime.now(); // API'den creationDate gelmediği için manuel atanıyor
          String? bannerImage = thumbnail != null ? thumbnail['url'] : null;
          String? detailText = offer['description'] ?? ""; // Varsayılan boş metin
          String? link = trackingLink != null ? trackingLink['click_url'] : null;

          // BrandModel nesnesini döndürüyoruz
          return BrandModel(
            id: id,
            bannerImage: bannerImage,
            categories: categories,
            creationDate: creationDate,
            detailText: detailText,
            donationRate: donationRate,
            favoriteCount: 0,
            inEarthquakeZone: false, // Veride bu bilgi olmadığı için manuel atanıyor
            isSocialEnterprise: false, // Veride bu bilgi olmadığı için manuel atanıyor
            link: link,
            logo: bannerImage, // Thumbnail verisini logo olarak kullanıyoruz
            name: name?.removeBrackets() ?? "", // removeBrackets extension kullanımı
            sector: sector,
            type: "gelirortaklari",
          );
        }
      }
    } catch (e) {
      debugPrint("Error fetching brand by ID: $e");
    }
    return null;
  }

  Future<BrandModel?> getBrandById2(String brandId) async {
    try {
      Dio dio = Dio();
      // URL oluşturulurken getOffers2 ile aynı endpoint ve parametreler kullanılıyor,
      // sadece filters[id] ile belirli bir ID’ye göre filtreleme yapılıyor.
      final url = "${AppConstants.GELIR_ORTAKLARI_BASE_URL}?api_key=${AppConstants.GELIR_ORTAKLARI_API_KEY}"
          "&Target=Affiliate_Offer&Method=findMyApprovedOffers"
          "&fields[]=name&fields[]=id"
          "&limit=1&filters[id]=$brandId"
          "&contain[]=OfferVertical&contain[]=TrackingLink&contain[]=OfferCategory"
          "&contain[]=Thumbnail&contain[]=Goal";

      final response = await dio.getUri(Uri.parse(url));

      if (response.statusCode == 200) {
        final json = response.data;
        // API cevabında offer’lar "response" -> "data" -> "data" anahtarları altında bir Map olarak geliyor.
        final Map<String, dynamic> dataMap = json["response"]["data"]["data"] as Map<String, dynamic>;

        if (dataMap.isEmpty) return null;

        // Filtreleme yapıldığından, key'in brandId olması bekleniyor;
        // yoksa ilk değeri alıyoruz.
        final Map<String, dynamic> offerData = dataMap.containsKey(brandId)
            ? dataMap[brandId] as Map<String, dynamic>
            : dataMap.values.first as Map<String, dynamic>;

        // Offer içerisinden temel alanların ayrıştırılması
        final String? id = offerData["Offer"]["id"];
        final String? name = offerData["Offer"]["name"];
        final String? logo = offerData["Thumbnail"]["url"];

        // Kategori ayrıştırması
        final List<CategoryModel> categories = offerData["OfferCategory"] is Map<String, dynamic>
            ? (offerData["OfferCategory"] as Map<String, dynamic>)
                .values
                .map<CategoryModel>((categoryJson) => CategoryModel.fromJson(categoryJson))
                .toList()
            : [];

        // Sektör bilgisi: OfferVertical içerisinden ya da kategorilerden alınıyor.
        final String? sector = offerData["OfferVertical"] is Map<String, dynamic>
            ? (offerData["OfferVertical"] as Map<String, dynamic>).values.first["name"]
            : categories.isNotEmpty
                ? categories.first.name
                : null;

        // Goal içerisinden donationRate (yüzde) çekiliyor
        double? donationRate;
        if (offerData["Goal"] is Map<String, dynamic>) {
          final Map<String, dynamic> goal = offerData["Goal"] as Map<String, dynamic>;
          for (var entry in goal.entries) {
            if (entry.value["payout_type"] == "cpa_percentage") {
              donationRate = double.tryParse(entry.value["percent_payout"] ?? "");
              break;
            }
          }
        }
        // Eğer donationRate 0 veya altındaysa, veri geçerli sayılmıyor
        if ((donationRate ?? 0) <= 0) {
          return null;
        }

        final DateTime creationDate = DateTime.now(); // API’den creationDate gelmediği için
        final String? bannerImage = offerData["Thumbnail"]["thumbnail"];
        const String detailText = ""; // İhtiyaca göre detay metni eklenebilir
        final String? link = offerData["TrackingLink"]["click_url"];
        const int favoriteCount = 0;

        return BrandModel(
          id: id,
          bannerImage: bannerImage,
          categories: categories,
          creationDate: creationDate,
          detailText: detailText,
          donationRate: donationRate,
          favoriteCount: favoriteCount,
          inEarthquakeZone: false, // Bu bilgi API’den gelmediği için false atanıyor
          isSocialEnterprise: false, // Aynı şekilde
          link: link,
          logo: logo,
          name: (name ?? "").removeTypes(), // removeTypes() extension’ı kullanılıyor
          sector: sector,
          type: "gelirortaklari",
        );
      }
    } catch (e) {
      debugPrint("Error fetching brand by ID: $e");
    }
    return null;
  }

  //getBrand
  Future getBrands() async {
    if (_brandList.isNotEmpty) {
      return;
    }
    _loadingState = LoadingState.loading;
    notifyListeners();
    // Şuan markalar sadece API'den gelecek
    // _brandList = await _brandController.getBrands();
    await getOffers2();
    await getOffers();
    _loadingState = LoadingState.loaded;
    notifyListeners();
  }

  Future<GeneralResponseModel> getFavoriteBrands() async {
    if (HiveHelpers.getUserFromHive().favoriteBrands.isEmpty) {
      return GeneralResponseModel();
    }
    _loadingState = LoadingState.loading;
    notifyListeners();
    var result = await getFilteredOffers(HiveHelpers.getUserFromHive().favoriteBrands);
    _loadingState = LoadingState.loaded;
    notifyListeners();
    return result;
  }

  void nextPage() {
    page++;
    notifyListeners();
  }

  //addBrand
  Future<GeneralResponseModel> addBrand(BrandModel brandModel) async {
    _addBrandState = LoadingState.loading;
    notifyListeners();
    final response = await _brandController.addBrand(brandModel);

    _addBrandState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  //updateBrand
  Future<GeneralResponseModel> updateBrand(BrandModel brandModel) async {
    _addBrandState = LoadingState.loading;
    notifyListeners();
    final response = await _brandController.updateBrand(brandModel);
    _addBrandState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  //deleteBrand
  Future<GeneralResponseModel> deleteBrand(String id) async {
    _deleteBrandState = LoadingState.loading;
    notifyListeners();
    final response = await _brandController.deleteBrand(id);
    _deleteBrandState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  void sortBrands(String value) {
    _sortText = value;
    switch (value) {
      case "A-Z":
        _brandList.sort((a, b) => a.name!.compareTo(b.name!));
        break;
      case "Z-A":
        _brandList.sort((a, b) => b.name!.compareTo(a.name!));
        break;
      case "enYenidenEnEskiye":
        _brandList.sort((a, b) => a.creationDate!.compareTo(b.creationDate!));
        break;
      case "enEskidenEnYeniye":
        _brandList.sort((a, b) => b.creationDate!.compareTo(a.creationDate!));
        break;
      case "bagisOraniYuksektenDusuge":
        _brandList.sort((a, b) => b.donationRate!.compareTo(a.donationRate!));
        break;
      case "bagisOraniDusuktenYuksege":
        _brandList.sort((a, b) => a.donationRate!.compareTo(b.donationRate!));
        break;

      default:
    }
    notifyListeners();
  }

  Future<GeneralResponseModel> sendForm(BrandFormModel brandFormModel, {required List<ImageModel?> logoImage}) async {
    _sendFormState = LoadingState.loading;
    notifyListeners();
    final response = await _brandController.sendForm(
      brandFormModel: brandFormModel,
      logoImage: logoImage,
    );

    _sendFormState = LoadingState.loaded;
    notifyListeners();
    return response;
  }

  Future<GeneralResponseModel> addRemoveFavoriteBrand(String id) async {
    UserModel userModel = HiveHelpers.getUserFromHive();
    if (userModel.favoriteBrands.contains(id) == false) {
      userModel.favoriteBrands.add(id);
    } else {
      userModel.favoriteBrands.remove(id);
    }

    HiveHelpers.addUserToHive(userModel);
    final response = await _brandController.addRemoveFavoriteBrand(id);
    return response;
  }

  List<String> _bannerImages = [];
  List<String> get bannerImages => _bannerImages;
  set bannerImages(List<String> value) {
    _bannerImages = value;
    notifyListeners();
  }

  bool _bannerLoaded = false;
  bool get bannerLoaded => _bannerLoaded;
  set bannerLoaded(bool value) {
    _bannerLoaded = value;
    notifyListeners();
  }

  Future<void> getBanners() async {
    try {
      bannerLoaded = false;
      notifyListeners();
      var firebase = FirebaseStorage.instance;
      final listResult = await firebase.ref('banners').listAll();
      List<String> urls = [];
      for (var item in listResult.items) {
        final url = await item.getDownloadURL();
        urls.add(url);
      }
      bannerImages = urls;
      bannerLoaded = true;
      notifyListeners();
    } catch (e) {
      print(e);
    }
  }
}
