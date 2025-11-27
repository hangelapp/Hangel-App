import 'dart:io';
import 'package:excel/excel.dart';
import 'package:path_provider/path_provider.dart';

import '../models/brand_model.dart';
Future<String> getExternalPath() async {
  final directory = await getExternalStorageDirectory();
  return directory?.path ?? "";
}

Future<void> copyFileToExternal() async {
  // Uygulamanızın internal dosya yolu
  final internalFile = File('/data/user/0/com.hangel.app/app_flutter/gelirortaklari.xlsx');
  final internalFile2 = File('/data/user/0/com.hangel.app/app_flutter/reklamaction.xlsx');
  
  // Harici dizin yolunu alıyoruz
  final externalPath = await getExternalPath();
  
  if (externalPath.isNotEmpty) {
    final externalFile = File('$externalPath/gelirortaklari.xlsx');
    final externalFile2 = File('$externalPath/reklamaction.xlsx');
    await internalFile.copy(externalFile.path);
    await internalFile2.copy(externalFile2.path);
    print("Dosya harici alana kopyalandı: ${externalFile.path}");
    print("Dosya harici alana kopyalandı: ${externalFile2.path}");
  } else {
    print("Harici dizin bulunamadı!");
  }
}
// adb shell "cat /storage/emulated/0/Android/data/com.hangel.app/files/gelirortaklari.xlsx > /sdcard/gelirortaklari.xlsx"
// adb shell "cat /storage/emulated/0/Android/data/com.hangel.app/files/reklamaction.xlsx > /sdcard/reklamaction.xlsx"
// adb pull /sdcard/gelirortaklari.xlsx C:\Users\cakir\Desktop\gelirortaklari.xlsx
// adb pull /sdcard/reklamaction.xlsx C:\Users\cakir\Desktop\reklamaction.xlsx


Future<void> createExcelFile(List<BrandModel> brandList) async {
  // Yeni bir Excel dosyası oluşturuyoruz (varsayılan olarak "Sheet1" adında bir sayfa oluşur)
  var excel = Excel.createExcel();
  Sheet sheet = excel['Sheet1'];

  // Başlık satırı ekleyelim
  sheet.appendRow([
  "ID",
  "Name",
  "Logo",
  "Sector",
  "In Earthquake Zone",
  "Is Social Enterprise",
  "Donation Rate",
  "Creation Date",
  "Banner Image",
  "Detail Text",
  "Link",
  "Categories",
  "Favorite Count",
  "Total Donation",
  "Process Count",
  "Type"
]);


  // Her bir BrandModel örneğini satır olarak ekliyoruz
  for (var brand in brandList) {
    // Kategorileri tek bir string haline getirelim (örn. "Kategori1 (0.1), Kategori2 (0.2)")
    String categoriesStr = "";
    if (brand.categories != null && brand.categories!.isNotEmpty) {
      categoriesStr = brand.categories!
          .map((cat) => "${cat.name} (${cat.donationRate})")
          .join(", ");
    }

    // Tarih bilgisini ISO formatında stringe çeviriyoruz (veya istenilen başka bir formata)
    String creationDateStr =
        brand.creationDate != null ? brand.creationDate!.toIso8601String() : "";

    // Satır verilerini oluşturuyoruz (null olan değerler için boş string kullanıyoruz)
    sheet.appendRow([
      brand.id ?? "",
      brand.name ?? "",
      brand.logo ?? "",
      brand.sector ?? "",
      brand.inEarthquakeZone?.toString() ?? "",
      brand.isSocialEnterprise?.toString() ?? "",
      brand.donationRate?.toString() ?? "",
      creationDateStr,
      brand.bannerImage ?? "",
      brand.detailText ?? "",
      brand.link ?? "",
      categoriesStr,
      brand.favoriteCount.toString(),
      brand.totalDonation?.toString() ?? "",
      brand.processCount?.toString() ?? "",
      brand.type ?? ""
    ]);
  }

  // Excel dosyasını byte dizisine çeviriyoruz
  List<int>? fileBytes = excel.encode();
  if (fileBytes == null) {
    print("Excel dosyası oluşturulamadı!");
    return;
  }

  // Uygulamanın belgeler dizinini alıyoruz
  Directory directory = await getApplicationDocumentsDirectory();
  String filePath = '${directory.path}/gelirortaklari.xlsx';

  // Dosyayı belirtilen yola kaydediyoruz
  File file = File(filePath);
  await file.writeAsBytes(fileBytes);
  print("Excel dosyası kaydedildi: $filePath");
}

Future<void> createExcelFile2(List<BrandModel> brandList) async {
  // Yeni bir Excel dosyası oluşturuyoruz (varsayılan olarak "Sheet1" adında bir sayfa oluşur)
  var excel = Excel.createExcel();
  Sheet sheet = excel['Sheet1'];

  // Başlık satırı ekleyelim
  sheet.appendRow([
  "ID",
  "Name",
  "Logo",
  "Sector",
  "In Earthquake Zone",
  "Is Social Enterprise",
  "Donation Rate",
  "Creation Date",
  "Banner Image",
  "Detail Text",
  "Link",
  "Categories",
  "Favorite Count",
  "Total Donation",
  "Process Count",
  "Type"
]);


  // Her bir BrandModel örneğini satır olarak ekliyoruz
  for (var brand in brandList) {
    // Kategorileri tek bir string haline getirelim (örn. "Kategori1 (0.1), Kategori2 (0.2)")
    String categoriesStr = "";
    if (brand.categories != null && brand.categories!.isNotEmpty) {
      categoriesStr = brand.categories!
          .map((cat) => "${cat.name} (${cat.donationRate})")
          .join(", ");
    }

    // Tarih bilgisini ISO formatında stringe çeviriyoruz (veya istenilen başka bir formata)
    String creationDateStr =
        brand.creationDate != null ? brand.creationDate!.toIso8601String() : "";

    // Satır verilerini oluşturuyoruz (null olan değerler için boş string kullanıyoruz)
    sheet.appendRow([
      brand.id ?? "",
      brand.name ?? "",
      brand.logo ?? "",
      brand.sector ?? "",
      brand.inEarthquakeZone?.toString() ?? "",
      brand.isSocialEnterprise?.toString() ?? "",
      brand.donationRate?.toString() ?? "",
      creationDateStr,
      brand.bannerImage ?? "",
      brand.detailText ?? "",
      brand.link ?? "",
      categoriesStr,
      brand.favoriteCount.toString(),
      brand.totalDonation?.toString() ?? "",
      brand.processCount?.toString() ?? "",
      brand.type ?? ""
    ]);
  }

  // Excel dosyasını byte dizisine çeviriyoruz
  List<int>? fileBytes = excel.encode();
  if (fileBytes == null) {
    print("Excel dosyası oluşturulamadı!");
    return;
  }

  // Uygulamanın belgeler dizinini alıyoruz
  Directory directory = await getApplicationDocumentsDirectory();
  String filePath = '${directory.path}/reklamaction.xlsx';

  // Dosyayı belirtilen yola kaydediyoruz
  File file = File(filePath);
  await file.writeAsBytes(fileBytes);
  print("Excel dosyası kaydedildi: $filePath");
}
