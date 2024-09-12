import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:hangel/controllers/brand_controller.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/helpers/locator.dart';

import 'package:hangel/models/brand_form_model.dart';
import 'package:hangel/models/brand_model.dart';
import 'package:hangel/models/general_response_model.dart';
import 'package:hangel/models/image_model.dart';
import 'package:hangel/models/user_model.dart';
import 'package:hangel/providers/login_register_page_provider.dart';

import '../constants/constants.dart';

class BrandProvider with ChangeNotifier {
  final _brandController = locator<BrandController>();

  int page = 1;
  int limit = 10;

  Set<BrandModel> _favoriteBrandList = {};
  Set<BrandModel> get favoriteBrandList => _favoriteBrandList;
  set favoriteBrandList(Set<BrandModel> value) {
    _favoriteBrandList = value;
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
                sector: sector));
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

  Future<GeneralResponseModel> getFilteredOffers(List<String> brandIds) async {
    Dio dio = Dio();

    try {
      // Listeyi her veri çağrımından önce sıfırlayın
      _favoriteBrandList.clear();
      List<BrandModel> fetchedBrands = [];

      // İlk olarak teklif verilerini çekin
      for (String id in brandIds) {
        var response = await dio.getUri(Uri.parse(
            "${AppConstants.REKLAM_ACTION_BASE_URL}?api_key=${AppConstants.REKLAM_ACTION_API_KEY}&Target=Affiliate_Offer&Method=findById&id=$id"));

        if (response.statusCode == 200) {
          var offerData = response.data["response"]["data"]["Offer"];

          if (offerData != null) {
            String? name = offerData["name"];
            String? sector = ""; // JSON'da sektör bilgisi yoksa, default boş string
            bool? inEarthquakeZone = false;
            bool? isSocialEnterprise = false;
            double? donationRate = double.tryParse(offerData["percent_payout"]);
            DateTime? creationDate = DateTime.now();
            String? bannerImage = ""; // JSON'da banner resmi yoksa, default boş string
            String? detailText = offerData["description"] ?? "";
            String? link = offerData["preview_url"];
            List<CategoryModel> categories = []; // JSON'da kategori bilgisi yoksa, boş liste

            // Model oluşturun ve listeye ekleyin
            fetchedBrands.add(BrandModel(
              id: id,
              bannerImage: bannerImage,
              categories: categories,
              creationDate: creationDate,
              detailText: detailText,
              donationRate: donationRate,
              favoriteCount: 0,
              inEarthquakeZone: inEarthquakeZone,
              isSocialEnterprise: isSocialEnterprise,
              link: link,
              logo: "", // Logo URL'yi daha sonra güncelleyeceğiz
              name: name?.removeBrackets() ?? "",
              sector: sector,
            ));
          }
        }
      }

      // İkinci olarak küçük resimleri çekin
      var thumbnailResponse = await dio.getUri(Uri.parse(
          "${AppConstants.REKLAM_ACTION_BASE_URL}?api_key=${AppConstants.REKLAM_ACTION_API_KEY}&Target=Affiliate_Offer&Method=getThumbnail&ids[]=${brandIds.join('&ids[]=')}"));

      if (thumbnailResponse.statusCode == 200) {
        var thumbnailData = thumbnailResponse.data["response"]["data"];

        for (var item in thumbnailData) {
          String offerId = item["offer_id"];
          var thumbnail = item["Thumbnail"]?.values.first;

          if (thumbnail != null) {
            String? thumbnailUrl = thumbnail["url"];
            // İlgili teklif modelini bulup logo URL'sini güncelleyin
            var brand = fetchedBrands.firstWhere((b) => b.id == offerId,
                orElse: () => BrandModel(
                    id: offerId,
                    name: '',
                    logo: '',
                    bannerImage: '',
                    categories: [],
                    creationDate: DateTime.now(),
                    detailText: '',
                    donationRate: 0.0,
                    favoriteCount: 0,
                    inEarthquakeZone: false,
                    isSocialEnterprise: false,
                    link: '',
                    sector: ''));
            brand.logo = thumbnailUrl ?? "";
          }
        }
      }

      _favoriteBrandList.addAll(fetchedBrands);
      notifyListeners();
      return GeneralResponseModel(success: true, data: _favoriteBrandList, message: "Successfully");
    } catch (e) {
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
            String? detailText = AppConstants.DETAIL_TEXT(val["Offer"]["name"]);
            String? link = val["TrackingLink"]["click_url"];
            List<CategoryModel>? categories = (val["OfferCategory"] as Map<String, dynamic>)
                .values
                .map<CategoryModel>((categoryJson) => CategoryModel.fromJson(categoryJson))
                .toList();
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
                sector: sector));
          }
        }
        notifyListeners();
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
          String? sector = offerData['OfferVertical'] != null && offerData['OfferVertical'].isNotEmpty
              ? offerData['OfferVertical'].first['name']
              : null;
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
          );
        }
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

  Future<GeneralResponseModel> sendForm(BrandFormModel brandFormModel,
      {required List<ImageModel?> logoImage,
      required List<ImageModel?> bannerImage,
      required List<ImageModel?> vergiImage}) async {
    _sendFormState = LoadingState.loading;
    notifyListeners();
    final response = await _brandController.sendForm(
      brandFormModel: brandFormModel,
      logoImage: logoImage,
      bannerImage: bannerImage,
      vergiImage: vergiImage,
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
}
