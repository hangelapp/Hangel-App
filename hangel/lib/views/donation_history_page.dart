import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/donation_model.dart';
import 'package:hangel/providers/donation_provider.dart';
import 'package:hangel/widgets/app_bar_widget.dart';
import 'package:hangel/widgets/circle_logo_widget.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:firebase_pagination/firebase_pagination.dart'; // Pagination paketi

import '../models/brand_model.dart';
import '../models/stk_model.dart';
import '../models/user_model.dart';
import '../providers/brand_provider.dart';
import '../providers/stk_provider.dart';
import 'utilities.dart';

class DonationHistoryPage extends StatefulWidget {
  const DonationHistoryPage({Key? key}) : super(key: key);
  static const routeName = '/donation-history-page';

  @override
  State<DonationHistoryPage> createState() => _DonationHistoryPageState();
}

class _DonationHistoryPageState extends State<DonationHistoryPage> {
  String totalDonationAmount = "0";
  UserModel user = HiveHelpers.getUserFromHive();
  String selectedFilter = "hepsi"; // Filtre için varsayılan değer
  String selectedDateRange = "son-1-ay"; // Tarih aralığı için varsayılan değer

  @override
  void initState() {
    super.initState();
    fetchDonations();
    getTotalDonationAmount(); // Toplam bağışı Firestore'dan alıyoruz
  }

  /// Toplam bağış miktarını Firestore'dan çek
  Future<void> getTotalDonationAmount() async {
    try {
      Query query = FirebaseFirestore.instance.collection('donations');

      // Filtre ve tarih aralığına göre sorguyu oluştur
      DateTime now = DateTime.now();
      if (selectedDateRange == "son-1-ay") {
        query = query.where('shoppingDate', isGreaterThanOrEqualTo: now.subtract(const Duration(days: 30)));
      } else if (selectedDateRange == "son-1-hafta") {
        query = query.where('shoppingDate', isGreaterThanOrEqualTo: now.subtract(const Duration(days: 7)));
      } else if (selectedDateRange == "son-1-sene") {
        query = query.where('shoppingDate', isGreaterThanOrEqualTo: now.subtract(const Duration(days: 365)));
      }

      // Toplam saleAmount değerini topla
      var snapshot = await query.get();
      double total = snapshot.docs.fold(0.0, (sum, doc) {
        double saleAmount = (doc['saleAmount'] as num?)?.toDouble() ?? 0.0;
        return sum + saleAmount;
      });

      setState(() {
        totalDonationAmount = total.toStringAsFixed(2); // Toplam tutarı güncelle
      });
    } catch (e) {
      print("Error fetching total donation amount: $e");
    }
  }

  void fetchDonations() {
    context.read<DonationProvider>().getDonations();
  }

  void updateFilter(String newFilter) {
    setState(() {
      selectedFilter = newFilter;
      getTotalDonationAmount(); // Filtre değiştiğinde toplam bağış güncellenir
    });
  }

  void updateDateRange(String newRange) {
    setState(() {
      selectedDateRange = newRange;
      getTotalDonationAmount(); // Tarih aralığı değiştiğinde toplam bağış güncellenir
    });
  }

  @override
  Widget build(BuildContext context) {
    Size size = MediaQuery.sizeOf(context);

    return Scaffold(
      body: Column(
        children: [
          const AppBarWidget(title: "Bağışlarım"),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  buildDonationCount,
                  buildDonationFilter(size),
                  const SizedBox(height: 20),
                  buildPaginatedDonations(size),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget get buildDonationCount => Container(
        decoration: const BoxDecoration(
          color: AppTheme.primaryColor,
        ),
        margin: EdgeInsets.symmetric(
          vertical: deviceHeightSize(context, 10),
        ),
        padding: EdgeInsets.symmetric(
          horizontal: deviceWidthSize(context, 20),
          vertical: deviceHeightSize(context, 10),
        ),
        width: double.infinity,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: deviceHeightSize(context, 150),
                  child: Text(
                    user.name ?? user.phone ?? "-",
                    style: AppTheme.semiBoldTextStyle(context, 15, color: Colors.white),
                  ),
                ),
                Container(
                  alignment: Alignment.centerRight,
                  width: deviceHeightSize(context, 150),
                  child: Text(
                    "$totalDonationAmount TL",
                    style: AppTheme.semiBoldTextStyle(context, 15, color: Colors.white),
                  ),
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: deviceHeightSize(context, 150),
                  child: Text(
                    "Gerçekleşen Bağış",
                    style: AppTheme.lightTextStyle(context, 14, color: Colors.white),
                  ),
                ),
                Container(
                  width: deviceHeightSize(context, 150),
                  alignment: Alignment.centerRight,
                  child: Text(
                    "$totalDonationAmount TL",
                    style: AppTheme.lightTextStyle(context, 14, color: Colors.white),
                  ),
                ),
              ],
            ),
          ],
        ),
      );

  Widget buildDonationFilter(Size size) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Container(
            padding: EdgeInsets.zero,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(5)),
            width: deviceHeightSize(context, 150),
            height: size.height * 0.05,
            child: DropdownButton(
              value: selectedFilter,
              padding: EdgeInsets.zero,
              style: AppTheme.normalTextStyle(context, 13),
              isExpanded: true,
              underline: const SizedBox.shrink(),
              icon: Card(
                color: AppTheme.primaryColor,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                child: const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: AppTheme.white,
                ),
              ),
              items: [
                DropdownMenuItem(
                  value: "hepsi",
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text("Hepsi", style: AppTheme.normalTextStyle(context, 13)),
                  ),
                ),
                DropdownMenuItem(
                  value: "inceleniyor",
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text("İnceleniyor", style: AppTheme.normalTextStyle(context, 13)),
                  ),
                ),
                DropdownMenuItem(
                  value: "onaylandı",
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text("Onaylandı", style: AppTheme.normalTextStyle(context, 13)),
                  ),
                ),
              ],
              onChanged: (value) {
                if (value != null) updateFilter(value);
              },
            ),
          ),
          Container(
            padding: EdgeInsets.zero,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(5)),
            width: deviceHeightSize(context, 150),
            height: size.height * 0.05,
            child: DropdownButton(
              value: selectedDateRange,
              padding: EdgeInsets.zero,
              style: AppTheme.normalTextStyle(context, 13),
              isExpanded: true,
              underline: const SizedBox.shrink(),
              icon: Card(
                color: AppTheme.primaryColor,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                child: const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: AppTheme.white,
                ),
              ),
              items: [
                DropdownMenuItem(
                  value: "son-1-ay",
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text("Son 1 ay", style: AppTheme.normalTextStyle(context, 13)),
                  ),
                ),
                DropdownMenuItem(
                  value: "son-1-hafta",
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text("Son 1 hafta", style: AppTheme.normalTextStyle(context, 13)),
                  ),
                ),
                DropdownMenuItem(
                  value: "son-1-sene",
                  child: Padding(
                    padding: const EdgeInsets.only(left: 8.0),
                    child: Text("Son 1 sene", style: AppTheme.normalTextStyle(context, 13)),
                  ),
                ),
              ],
              onChanged: (value) {
                if (value != null) updateDateRange(value);
              },
            ),
          ),
        ],
      );

  Widget buildPaginatedDonations(Size size) {
    return SizedBox(
      height: 300,
      child: FirestorePagination(
        query: _buildQuery(), // Firestore'dan bağışları filtreleyerek çeker
        isLive: true,
        limit: 5,
        padding: EdgeInsets.zero,
        itemBuilder: (context, snapshot, index) {
          DonationModel donation = DonationModel.fromMap(snapshot[index].data() as Map<String, dynamic>);

          return FutureBuilder<BrandModel?>(
            future: Provider.of<BrandProvider>(context, listen: false)
                .getBrandById(donation.brandId ?? ""), // Brand'leri getiriyoruz
            builder: (context, brandSnapshot) {
              if (brandSnapshot.connectionState == ConnectionState.waiting) {
                return Center(child: const LinearProgressIndicator()); // Yükleniyor
              }

              if (!brandSnapshot.hasData || brandSnapshot.data == null) {
                return const ListTile(
                  title: Text("Marka bulunamadı"),
                );
              }

              BrandModel brand = brandSnapshot.data!; // BrandModel'den bilgileri alıyoruz
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: ListTile(
                  shape: StadiumBorder(),
                  tileColor: AppTheme.white,
                  contentPadding: EdgeInsets.all(8),
                  leading: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        (donation.shoppingDate?.day).toString(),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      Text(
                        "${getTurkishMonth(donation.shoppingDate?.month)} ${donation.shoppingDate?.year}",
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                      Text(
                        "${(donation.shoppingDate?.hour).toString().padLeft(2, '0')}:${(donation.shoppingDate?.minute).toString().padLeft(2, '0')}",
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w300,
                        ),
                      ),
                    ],
                  ),
                  title: Row(
                    children: [
                      CircleLogoWidget(
                        logoUrl: brand.logo ?? "", // Marka logosunu gösteriyoruz
                        logoName: brand.name?[0] ?? "0", // Marka isminin ilk harfini gösteriyoruz
                      ),
                      const SizedBox(width: 3),
                      Flexible(child: Text(brand.name ?? "-")), // Marka ismini gösteriyoruz
                    ],
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Column(
                        children: [
                          Text("Tutar", style: AppTheme.boldTextStyle(context, 14)),
                          Text("${(donation.saleAmount)?.toStringAsFixed(2)} TL"),
                        ],
                      ),
                      const Icon(Icons.keyboard_arrow_right),
                    ],
                  ),
                  onTap: () {
                    showDonationDetailDialog(context, brand, donation);
                  },
                ),
              );
            },
          );
        },
        onEmpty: const Center(child: Text('Hiç bağış bulunamadı.')),
      ),
    );
  }

  void showDonationDetailDialog(BuildContext context, BrandModel brand, DonationModel donation) {
    // STK'ları almak için future'lar. STK bilgilerini sağlayacak STKProvider kullanıyoruz.
    Future<StkModel?> stk1Future = Provider.of<STKProvider>(context, listen: false).getSTKById(donation.stkId1 ?? "");
    Future<StkModel?> stk2Future = Provider.of<STKProvider>(context, listen: false).getSTKById(donation.stkId2 ?? "");

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          contentPadding: EdgeInsets.zero,
          content: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Markanın logosu ve ismi
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundImage: NetworkImage(brand.logo ?? ""),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        brand.name ?? "-",
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Sipariş Numarası
                  Text(
                    "Sipariş Numarası: ${donation.orderNumber}",
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 8),

                  // Bağış Tutarı
                  Text(
                    "Bağış Tutarı: ${donation.saleAmount?.toStringAsFixed(2)} TL",
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 16),

                  // Sipariş Tarihi
                  Text(
                    "Sipariş Tarihi: ${DateFormat('dd.MM.yyyy').format(donation.shoppingDate ?? DateTime.now())}",
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 16),

                  // STK'lar
                  const Text(
                    "Bağış Yapılan STK'lar",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  // STK1 FutureBuilder
                  FutureBuilder<StkModel?>(
                    future: stk1Future,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const CircularProgressIndicator();
                      }
                      if (snapshot.hasError || !snapshot.hasData) {
                        return const Text("STK1 bilgisi alınamadı");
                      }
                      StkModel stk1 = snapshot.data!;
                      return buildStkInfo(stk1, donation.saleAmount ?? 0 / 2);
                    },
                  ),
                  const SizedBox(height: 16),

                  // STK2 FutureBuilder
                  FutureBuilder<StkModel?>(
                    future: stk2Future,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const CircularProgressIndicator();
                      }
                      if (snapshot.hasError || !snapshot.hasData) {
                        return const Text("STK2 bilgisi alınamadı");
                      }
                      StkModel stk2 = snapshot.data!;
                      return buildStkInfo(stk2, donation.saleAmount ?? 0 / 2);
                    },
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text("Kapat"),
            ),
          ],
        );
      },
    );
  }

// STK bilgi kartı
  Widget buildStkInfo(StkModel stk, double donationAmount) {
    return Row(
      children: [
        CircleAvatar(
          radius: 20,
          backgroundImage: NetworkImage(stk.logo ?? ""), // STK logosunu gösteriyoruz
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(stk.name ?? "-", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text("Bağış Tutarı: ${donationAmount.toStringAsFixed(2)} TL"),
          ],
        ),
      ],
    );
  }

  Query _buildQuery() {
    Query query = FirebaseFirestore.instance.collection('donations');

    // Filtreye göre sorguyu oluştur
    if (selectedFilter != "hepsi") {
      query = query.where("status", isEqualTo: selectedFilter);
    }

    // Tarih aralığına göre sorguyu güncelle
    DateTime now = DateTime.now();
    if (selectedDateRange == "son-1-ay") {
      query = query.where('shoppingDate', isGreaterThanOrEqualTo: now.subtract(const Duration(days: 30)));
    } else if (selectedDateRange == "son-1-hafta") {
      query = query.where('shoppingDate', isGreaterThanOrEqualTo: now.subtract(const Duration(days: 7)));
    } else if (selectedDateRange == "son-1-sene") {
      query = query.where('shoppingDate', isGreaterThanOrEqualTo: now.subtract(const Duration(days: 365)));
    }

    query = query.orderBy('shoppingDate', descending: true); // Tarihe göre sırala
    return query;
  }
}
