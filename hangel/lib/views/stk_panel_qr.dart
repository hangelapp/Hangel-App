import 'dart:typed_data';
import 'dart:ui' as ui;
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/stk_submission_model.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
// XFile için gerekli

import '../models/stk_model.dart';
import 'app_view.dart';

class STKPanelQr extends StatefulWidget {
  const STKPanelQr({super.key});
  static const routeName = '/stk-panel-qr';

  @override
  State<STKPanelQr> createState() => _STKPanelQrState();
}

class _STKPanelQrState extends State<STKPanelQr> {
  bool isLoading = true;
  bool isVerify = false;
  StkModel? stkModel;
  List<STKSubmissionsModel> qrSubmisionsData = [];
  final GlobalKey globalKey = GlobalKey(); // GlobalKey eklendi

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration.zero, () async {
      await FirebaseFirestore.instance.collection("users").doc(HiveHelpers.getUid()).get().then((value) {
        var userData = value.data();
        setState(() {
          (userData as Map<String, dynamic>)["isSTKUser"] != null &&
                  (value.data() as Map<String, dynamic>)["isSTKUser"].split(",").first == "true"
              ? isVerify = true
              : isVerify = false;
        });
        return (userData?["isSTKUser"] as String).split(",").last;
      }).then(
        (stkId) async {
          if (!isVerify) {
            Navigator.pushNamedAndRemoveUntil(context, AppView.routeName, (route) => false);
          } else {
            print("doğrulandı!");
            await FirebaseFirestore.instance.collection("stklar").where("id", isEqualTo: stkId).get().then(
              (value) {
                if (value.docs.isEmpty) return;
                setState(() {
                  stkModel = StkModel.fromJson(value.docs.first.data());
                  isLoading = false;
                });
              },
            );
          }
        },
      );
    }).then(
      (value) async {
        await FirebaseFirestore.instance
            .collection("stkSubmissions")
            .where("stkId", isEqualTo: stkModel?.id)
            .get()
            .then(
          (value) {
            if (value.docs.isEmpty) return;
            setState(() {
              for (var data in value.docs) {
                try {
                  qrSubmisionsData.add(STKSubmissionsModel.fromJson(value.docs.first.data()));
                } catch (e) {}
              }
              isLoading = false;
            });
          },
        );
      },
    );
  }

  // QR kodunu paylaşma fonksiyonu
  Future<void> _shareQrCode() async {
    try {
      // QR kodunu resim olarak yakala
      RenderRepaintBoundary boundary = globalKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
      ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      Uint8List pngBytes = byteData!.buffer.asUint8List();

      // Geçici bir dosya oluştur
      final tempDir = await getTemporaryDirectory();
      final filePath = '${tempDir.path}/qr_code.png';
      final file = await File(filePath).create();
      await file.writeAsBytes(pngBytes);

      // XFile oluştur
      final xFile = XFile(filePath);

      // Paylaş
      await Share.shareXFiles([xFile],
          text: stkModel?.name != null
              ? "${stkModel?.name}'i desteklemek için QR Kodu okutun."
              : "Bu QR Kodu okutarak destekte bulunabilirsin.");
    } catch (e) {
      print(e);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bir hata oluştu: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    Size size = MediaQuery.of(context).size;
    return isLoading
        ? const Scaffold(body: Center(child: CircularProgressIndicator()))
        : Scaffold(
            backgroundColor: const Color(0xfff2f2f2),
            appBar: AppBar(
              title: const Text("QR Kod"),
              backgroundColor: const Color(0xfff2f2f2),
            ),
            body: Center(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.info_outline, color: Colors.grey, size: 20),
                        SizedBox(width: 6),
                        Text(
                          "25.08.2025 tarihine kadar geçerlidir.",
                          style: TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                      ],
                    ),
                    Container(
                      alignment: Alignment.center,
                      padding: const EdgeInsets.only(left: 16, right: 16, top: 16),
                      child: stkModel?.qrUrl != ""
                          ? RepaintBoundary(
                              key: globalKey,
                              child: QrImageView(
                                data: stkModel!.qrUrl ?? "https://hangel.org/",
                                size: size.width * 0.8,
                                backgroundColor: Colors.white,
                                dataModuleStyle: const QrDataModuleStyle(
                                    color: Colors.black, dataModuleShape: QrDataModuleShape.square),
                              ),
                            )
                          : const SizedBox(),
                    ),
                    const SizedBox(height: 20),
                    stkModel?.qrUrl != ""
                        ? Center(
                            child: ElevatedButton.icon(
                              onPressed: _shareQrCode,
                              icon: const Icon(Icons.share),
                              label: const Text("QR Kodu Paylaş"),
                            ),
                          )
                        : const Center(
                            child: Text("Henüz QR Kod'unuz yok. Destek bölümünden bizimle iletişime geçebilirsiniz.")),
                  ],
                ),
              ),
            ),
          );
  }
}
