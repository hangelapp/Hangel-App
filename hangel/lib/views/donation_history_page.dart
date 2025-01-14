import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/donation_model.dart';
import 'package:firebase_pagination/firebase_pagination.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

// Yeni sayfa import edildi

import '../models/brand_model.dart';
import '../models/stk_model.dart';
import '../models/user_model.dart';
import '../providers/brand_provider.dart';
import '../providers/stk_provider.dart';
import '../widgets/app_bar_widget.dart';
import '../widgets/bottom_sheet_widget.dart';
import '../widgets/circle_logo_widget.dart';
import '../widgets/missing_donation_form_widget.dart';
import 'utilities.dart';

class DonationHistoryPage extends StatefulWidget {
  const DonationHistoryPage({super.key});
  static const routeName = '/donation-history-page';

  @override
  State<DonationHistoryPage> createState() => _DonationHistoryPageState();
}

class _DonationHistoryPageState extends State<DonationHistoryPage> {
  String totalDonationAmount = "0";
  late UserModel user;
  String selectedFilter = "hepsi"; // Filtre için varsayılan değer
  String selectedDateRange = "son-1-sene"; // Tarih aralığı için varsayılan değer

  @override
  void initState() {
    super.initState();
    user = HiveHelpers.getUserFromHive();
    getTotalDonationAmount(); // Toplam bağışı Firestore'dan alıyoruz
  }

  /// Toplam bağış miktarını Firestore'dan çek
  Future<void> getTotalDonationAmount() async {
    try {
      Query query = FirebaseFirestore.instance.collection('donations');

      // Kullanıcıya özgü filtre ekle
      if (user.uid != null && user.uid!.isNotEmpty) {
        query = query.where('userId', isEqualTo: user.uid);
      } else {
        throw Exception("Kullanıcı UID'si geçersiz veya boş.");
      }

      // Filtreye göre sorguyu oluştur
      DateTime now = DateTime.now();
      DateTime startDate;
      if (selectedDateRange == "son-1-ay") {
        startDate = now.subtract(const Duration(days: 30));
      } else if (selectedDateRange == "son-1-hafta") {
        startDate = now.subtract(const Duration(days: 7));
      } else if (selectedDateRange == "son-1-sene") {
        startDate = now.subtract(const Duration(days: 365));
      } else {
        startDate = DateTime(2000); // Fallback date
      }
      query = query.where('shoppingDate', isGreaterThanOrEqualTo: startDate);

      // Firestore'dan verileri çek
      var snapshot = await query.get();

      // Toplam saleAmount değerini topla
      double total = snapshot.docs.fold(0.0, (sum, doc) {
        double saleAmount = (doc['saleAmount'] as num?)?.toDouble() ?? 0.0;
        return sum + saleAmount;
      });

      setState(() {
        totalDonationAmount = total.toStringAsFixed(2); // Toplam tutarı güncelle
      });
    } catch (e) {
      print("Error fetching total donation amount: $e");
      // Hata durumunda kullanıcıya bildirim gönder
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('donation_history_page_total_donation_error'.locale)),
      );
    }
  }

  /// Filtre durumunu günceller ve toplam bağışı yeniden hesaplar
  void updateFilter(String newFilter) {
    setState(() {
      selectedFilter = newFilter;
      getTotalDonationAmount(); // Filtre değiştiğinde toplam bağış güncellenir
    });
  }

  /// Tarih aralığını günceller ve toplam bağışı yeniden hesaplar
  void updateDateRange(String newRange) {
    setState(() {
      selectedDateRange = newRange;
      getTotalDonationAmount(); // Tarih aralığı değiştiğinde toplam bağış güncellenir
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          AppBarWidget(title: "donation_history_page_bagislarim".locale),
          buildDonationCount,
          buildDonationFilter(),
          const SizedBox(height: 20),
          Expanded(
            child: buildPaginatedDonations(),
          ),
          // Yeni eklenen buton
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            child: Center(
              child: ElevatedButton(
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(20),
                        topRight: Radius.circular(20),
                      ),
                    ),
                    builder: (context) => BottomSheetWidget(
                        isMinPadding: true,
                        title: 'missing_donation_form_page_title'.locale,
                        child: const MissingDonationFormPage()), // "Bağışım Gözükmüyor"
                  );
                },
                child: Text("donation_history_page_my_donation_not_showing".locale),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Toplam bağış miktarını ve kullanıcı bilgilerini gösteren widget
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Text(
                    user.name ?? user.phone ?? "-",
                    style: AppTheme.semiBoldTextStyle(context, 15, color: Colors.white),
                  ),
                ),
                Text(
                  "$totalDonationAmount TL",
                  style: AppTheme.semiBoldTextStyle(context, 15, color: Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "donation_history_page_realized_donation".locale,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                  ),
                ),
                Text(
                  "$totalDonationAmount TL",
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ],
        ),
      );

  /// Bağış filtrelerini seçmek için kullanılan widget
  Widget buildDonationFilter() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Filtre Durumu Dropdown
            Expanded(
              child: DropdownButtonFormField<String>(
                value: selectedFilter,
                decoration: InputDecoration(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(5)),
                ),
                style: AppTheme.normalTextStyle(context, 13),
                isExpanded: true,
                icon: const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: AppTheme.primaryColor,
                ),
                items: const [
                  DropdownMenuItem(
                    value: "hepsi",
                    child: Text("Hepsi"),
                  ),
                  DropdownMenuItem(
                    value: "inceleniyor",
                    child: Text("İnceleniyor"),
                  ),
                  DropdownMenuItem(
                    value: "onaylandı",
                    child: Text("Onaylandı"),
                  ),
                ],
                onChanged: (value) {
                  if (value != null) updateFilter(value);
                },
              ),
            ),
            const SizedBox(width: 16),
            // Tarih Aralığı Dropdown
            Expanded(
              child: DropdownButtonFormField<String>(
                value: selectedDateRange,
                decoration: InputDecoration(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(5)),
                ),
                style: AppTheme.normalTextStyle(context, 13),
                isExpanded: true,
                icon: const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: AppTheme.primaryColor,
                ),
                items: const [
                  DropdownMenuItem(
                    value: "son-1-ay",
                    child: Text("Son 1 Ay"),
                  ),
                  DropdownMenuItem(
                    value: "son-1-hafta",
                    child: Text("Son 1 Hafta"),
                  ),
                  DropdownMenuItem(
                    value: "son-1-sene",
                    child: Text("Son 1 Sene"),
                  ),
                ],
                onChanged: (value) {
                  if (value != null) updateDateRange(value);
                },
              ),
            ),
          ],
        ),
      );

  /// Bağışları sayfalı olarak listeleyen widget
  Widget buildPaginatedDonations() {
    return FirestorePagination(
      query: _buildQuery(), // Firestore'dan bağışları filtreleyerek çeker
      isLive: true,
      limit: 10,
      itemBuilder: (context, snapshot, index) {
        DonationModel donation = DonationModel.fromMap(snapshot[index].data() as Map<String, dynamic>);

        return DonationListItem(
          donation: donation,
          onTap: (BrandModel? brand) {
            showDonationDetailDialog(context, brand, donation);
          },
        );
      },
      onEmpty: Center(child: Text("donation_history_page_no_donations".locale)),
    );
  }

  /// Firestore sorgusunu oluşturur ve filtreleri uygular
  Query _buildQuery() {
    Query query = FirebaseFirestore.instance.collection('donations');

    // Kullanıcıya özgü filtre ekle
    if (user.uid != null && user.uid!.isNotEmpty) {
      query = query.where('userId', isEqualTo: user.uid);
    } else {
      throw Exception("Kullanıcı UID'si geçersiz veya boş.");
    }

    // Tarih aralığına göre sorguyu oluştur
    DateTime now = DateTime.now();
    DateTime startDate;
    if (selectedDateRange == "son-1-ay") {
      startDate = now.subtract(const Duration(days: 30));
    } else if (selectedDateRange == "son-1-hafta") {
      startDate = now.subtract(const Duration(days: 7));
    } else if (selectedDateRange == "son-1-sene") {
      startDate = now.subtract(const Duration(days: 365));
    } else {
      startDate = DateTime(2000); // Fallback date
    }
    query = query.where('shoppingDate', isGreaterThanOrEqualTo: startDate);

    // Tarihe göre sırala
    query = query.orderBy('shoppingDate', descending: true);
    return query;
  }

  /// Bağış detaylarını gösteren dialog
  void showDonationDetailDialog(BuildContext context, BrandModel? brand, DonationModel donation) {
    // STK'ları almak için future'lar
    Future<StkModel?> stk1Future = Provider.of<STKProvider>(context, listen: false).getSTKById(donation.stkId1 ?? "");
    Future<StkModel?> stk2Future = Provider.of<STKProvider>(context, listen: false).getSTKById(donation.stkId2 ?? "");

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("donation_history_page_donation_details".locale),
          contentPadding: EdgeInsets.zero,
          content: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Markanın logosu ve ismi
                  brand != null
                      ? Row(
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
                        )
                      : Row(
                          children: [
                            const CircleAvatar(
                              radius: 30,
                              child: Text("-"),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              "donation_history_page_brand".locale,
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                  const SizedBox(height: 16),

                  // Sipariş Numarası
                  Text(
                    "${"donation_history_page_order_number".locale}: ${donation.orderNumber ?? '-'}",
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 8),

                  // Bağış Tutarı
                  Text(
                    "${"donation_history_page_donation_amount".locale}: ${donation.saleAmount?.toStringAsFixed(2) ?? '0.00'} TL",
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 16),

                  // Sipariş Tarihi
                  Text(
                    "${"donation_history_page_order_date".locale}: ${donation.shoppingDate != null ? DateFormat('dd.MM.yyyy HH:mm').format(donation.shoppingDate!) : '-'}",
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 16),

                  // STK'lar
                  Text(
                    "donation_history_page_donated_stks".locale,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  // STK1 FutureBuilder
                  FutureBuilder<StkModel?>(
                    future: stk1Future,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8.0),
                          child: CircularProgressIndicator(),
                        );
                      }
                      if (snapshot.hasError || !snapshot.hasData) {
                        return Text("donation_history_page_stk1_error".locale);
                      }
                      StkModel stk1 = snapshot.data!;
                      return buildStkInfo(stk1, ((donation.saleAmount ?? 0) / 2));
                    },
                  ),
                  const SizedBox(height: 16),

                  // STK2 FutureBuilder
                  FutureBuilder<StkModel?>(
                    future: stk2Future,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8.0),
                          child: CircularProgressIndicator(),
                        );
                      }
                      if (snapshot.hasError || !snapshot.hasData) {
                        return Text("donation_history_page_stk2_error".locale);
                      }
                      StkModel stk2 = snapshot.data!;
                      return buildStkInfo(stk2, ((donation.saleAmount ?? 0) / 2));
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
              child: Text("donation_history_page_close".locale),
            ),
          ],
        );
      },
    );
  }

  /// STK bilgilerini gösteren widget
  Widget buildStkInfo(StkModel stk, double donationAmount) {
    return Row(
      children: [
        CircleAvatar(
          radius: 20,
          backgroundImage: NetworkImage(stk.logo ?? ""), // STK logosunu gösteriyoruz
          child: stk.logo == null || stk.logo!.isEmpty ? const Icon(Icons.error, color: Colors.red) : null,
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              stk.name ?? "-",
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text("${"donation_history_page_donation_amount".locale}: ${donationAmount.toStringAsFixed(2)} TL"),
          ],
        ),
      ],
    );
  }
}

/// Her bir bağış listesi elemanını yöneten ayrı bir StatefulWidget
class DonationListItem extends StatefulWidget {
  final DonationModel donation;
  final Function(BrandModel?) onTap; // Callback to handle tap events

  const DonationListItem({super.key, required this.donation, required this.onTap});

  @override
  State<DonationListItem> createState() => _DonationListItemState();
}

class _DonationListItemState extends State<DonationListItem> {
  BrandModel? _brand;
  bool _isFetching = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _loadBrand();
  }

  /// Marka verisini önbellekten alır veya Firestore'dan çeker
  void _loadBrand() async {
    String brandId = widget.donation.brandId ?? "";
    if (brandId.isEmpty) return;

    setState(() {
      _isFetching = true;
      _hasError = false;
    });

    try {
      BrandModel? brand = await Provider.of<BrandProvider>(context, listen: false).getBrandById(brandId);
      if (mounted) {
        setState(() {
          _brand = brand;
          _isFetching = false;
        });
      }
    } catch (e) {
      print("Error fetching brand by ID: $e");
      if (mounted) {
        setState(() {
          _isFetching = false;
          _hasError = true;
        });
      }
    }
  }

  /// Markayı yeniden yüklemeye çalışır
  void _retryFetchBrand() {
    _loadBrand();
  }

  @override
  Widget build(BuildContext context) {
    if (_isFetching) {
      // Sadece ilk yüklemede gösterilecek yükleme göstergesi
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        child: ListTile(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          tileColor: AppTheme.white,
          contentPadding: const EdgeInsets.all(16),
          leading: const Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Placeholder ikon
              CircleAvatar(
                radius: 20,
                child: Icon(Icons.image_not_supported, color: Colors.grey),
              ),
            ],
          ),
          title: Row(
            children: [
              Flexible(
                child: Text(
                  "donation_history_page_brand_loading".locale,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          trailing: IconButton(
            icon: const Icon(Icons.refresh, color: Colors.blue),
            onPressed: _retryFetchBrand,
            tooltip: 'donation_history_page_retry_brand'.locale,
          ),
          onTap: () {
            // Marka yüklenmemişse dialog gösterme
          },
        ),
      );
    }

    if (_hasError || _brand == null) {
      // Marka verisi yüklenemediğinde gösterilecek placeholder
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        child: ListTile(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          tileColor: AppTheme.white,
          contentPadding: const EdgeInsets.all(16),
          leading: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                widget.donation.shoppingDate != null ? widget.donation.shoppingDate!.day.toString() : "-",
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                widget.donation.shoppingDate != null
                    ? "${getTurkishMonth(widget.donation.shoppingDate!.month)} ${widget.donation.shoppingDate!.year}"
                    : "-",
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                widget.donation.shoppingDate != null
                    ? "${widget.donation.shoppingDate!.hour.toString().padLeft(2, '0')}:${widget.donation.shoppingDate!.minute.toString().padLeft(2, '0')}"
                    : "-",
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w300,
                ),
              ),
            ],
          ),
          title: Row(
            children: [
              const CircleLogoWidget(
                logoUrl: '',
                logoName: "-",
              ),
              Flexible(
                child: Text(
                  "donation_history_page_brand_info_error".locale,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text("donation_history_page_amount".locale, style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text("${widget.donation.saleAmount?.toStringAsFixed(2)} TL"),
                ],
              ),
              const SizedBox(width: 10),
              const Icon(Icons.keyboard_arrow_right),
            ],
          ),
          onTap: () {
            widget.onTap(_brand);
          },
        ),
      );
    }

    // Marka verisi yüklendiyse
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        tileColor: AppTheme.white,
        contentPadding: const EdgeInsets.all(16),
        leading: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              widget.donation.shoppingDate != null ? widget.donation.shoppingDate!.day.toString() : "-",
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              widget.donation.shoppingDate != null
                  ? "${getTurkishMonth(widget.donation.shoppingDate!.month)} ${widget.donation.shoppingDate!.year}"
                  : "-",
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w400,
              ),
            ),
            Text(
              widget.donation.shoppingDate != null
                  ? "${widget.donation.shoppingDate!.hour.toString().padLeft(2, '0')}:${widget.donation.shoppingDate!.minute.toString().padLeft(2, '0')}"
                  : "-",
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w300,
              ),
            ),
          ],
        ),
        title: Row(
          children: [
            CircleLogoWidget(
              logoUrl: _brand!.logo ?? "",
              logoName: (_brand!.name ?? "").isNotEmpty ? _brand!.name![0] : "0",
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                _brand!.name ?? "donation_history_page_brand_loading".locale,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text("donation_history_page_amount".locale, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text("${widget.donation.saleAmount?.toStringAsFixed(2)} TL"),
              ],
            ),
            const SizedBox(width: 10),
            const Icon(Icons.keyboard_arrow_right),
          ],
        ),
        onTap: () {
          widget.onTap(_brand);
        },
      ),
    );
  }
}
