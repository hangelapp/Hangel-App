import 'dart:typed_data';
import 'dart:ui' as ui;
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/stk_submission_model.dart';
import 'package:hangel/views/utilities.dart';
import 'package:hangel/widgets/form_field_widget.dart';
import 'package:hangel/widgets/general_button_widget.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
// XFile için gerekli

import '../models/stk_model.dart';
import '../widgets/bottom_sheet_widget.dart';
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

  void _basvuruYap() {
    TextEditingController controller = TextEditingController();
    bool isLoading = false;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (BuildContext context, void Function(void Function()) setState) => BottomSheetWidget(
          title: "QR Kod Başvurusu Yap",
          child: Column(
            children: [
              FormFieldWidget(
                context,
                controller: controller,
                title: "Mesaj",
                minLines: 3,
                maxLines: 3,
              ),
              GeneralButtonWidget(
                onPressed: () async {
                  if (controller.text.isEmpty) return;
                  String docId = "";
                  setState(() {
                    isLoading = true;
                  });
                  await FirebaseFirestore.instance
                      .collection("stklar")
                      .where("id", isEqualTo: stkModel?.id)
                      .get()
                      .then((value) async {
                    if (value.docs.isEmpty) return;
                    docId = value.docs.first.id;
                    var stkModel = StkModel.fromJson(value.docs.first.data());
                    STKSubmissionsModel submission = STKSubmissionsModel(
                      id: generateDigit(),
                      type: "qr",
                      content: controller.text,
                      status: "bekliyor",
                      response: "",
                      stkId: stkModel.id,
                      userId: HiveHelpers.getUid(),
                      updatedAt: DateTime.now(),
                      createdAt: DateTime.now(),
                    );

                    await FirebaseFirestore.instance.collection("stkSubmissions").add(submission.toJson()).then(
                      (value) {
                        Fluttertoast.showToast(msg: "Başvuru gönderildi!");
                        qrSubmisionsData.add(submission);
                        setState(() {});
                        Navigator.pop(context);
                      },
                    );
                  });
                  setState(() {
                    isLoading = false;
                  });
                },
                text: "Başvuruyu Gönder",
                isLoading: isLoading,
              ),
              const SizedBox(height: 20)
            ],
          ),
        ),
      ),
    );
  }

  Future<void> showSubmissionDetail(context, STKSubmissionsModel submission) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (BuildContext context, void Function(void Function()) setState) => BottomSheetWidget(
          title: "Başvuru Detayları",
          child: Column(
            children: [
              SingleChildScrollView(
                child: Column(
                  children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text("Başvuru Tipi: "),
                      Text(submission.type ?? "-"),
                    ]),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Başvuru Mesajı: "),
                        Expanded(
                          child: Text(
                            submission.content == "" ? "---" : submission.content ?? "-",
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            textAlign: TextAlign.end,
                          ),
                        ),
                      ],
                    ),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Başvuru Durumu: "),
                        Text(submission.status ?? "-"),
                      ],
                    ),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Cevap: "),
                        Expanded(
                          child: Text(
                            submission.response == "" ? "---" : submission.response ?? "-",
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            textAlign: TextAlign.end,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    GeneralButtonWidget(onPressed: () => Navigator.pop(context), text: "Tamam"),
                    const SizedBox(height: 20)
                  ],
                ),
              )
            ],
          ),
        ),
      ),
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
      await Share.shareXFiles([xFile], text: stkModel?.name ?? "QR Kodum");
    } catch (e) {
      print(e);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bir hata oluştu: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return isLoading
        ? const Scaffold(body: Center(child: CircularProgressIndicator()))
        : Scaffold(
            backgroundColor: const Color(0xfff2f2f2),
            appBar: AppBar(
              title: const Text("QR Kod"),
              backgroundColor: const Color(0xfff2f2f2),
            ),
            body: SingleChildScrollView(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    alignment: Alignment.center,
                    padding: const EdgeInsets.only(left: 16, right: 16, top: 16),
                    child: stkModel?.qrUrl != ""
                        ? RepaintBoundary(
                            key: globalKey,
                            child: QrImageView(
                              data: stkModel!.qrUrl ?? "https://hangel.org/",
                              size: 300,
                              backgroundColor: Colors.white,
                              dataModuleStyle:
                                  const QrDataModuleStyle(color: Colors.black, dataModuleShape: QrDataModuleShape.square),
                            ),
                          )
                        : const SizedBox(),
                  ),
                  stkModel?.qrUrl != ""
                      ? Center(
                          child: ElevatedButton.icon(
                            onPressed: _shareQrCode,
                            icon: const Icon(Icons.share),
                            label: const Text("QR Kodu Paylaş"),
                          ),
                        )
                      : const Center(child: Text("Henüz QR Kod'unuz yok. Başvuru yapabilirsiniz.")),
                  const Divider(),
                  Padding(
                    padding: const EdgeInsets.only(left: 16, top: 16, right: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Qr Kod Başvurularım',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        ElevatedButton(
                            onPressed: () {
                              _basvuruYap();
                            },
                            child: const Text("Başvuru Yap"))
                      ],
                    ),
                  ),
                  SizedBox(
                    height: deviceHeight(context) * 0.3,
                    child: ListView.builder(
                      itemCount: qrSubmisionsData.isEmpty ? 1 : qrSubmisionsData.length,
                      itemBuilder: (context, index) {
                        if (qrSubmisionsData.isEmpty) return const Center(child: Text("Henüz bir başvuru yok..."));
                        return Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: ListTile(
                            tileColor: qrSubmisionsData[index].status == "sonuclandı"
                                ? Colors.green.shade100
                                : qrSubmisionsData[index].status == "bekliyor"
                                    ? Colors.red.shade100
                                    : Colors.blue.shade100,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                                side: BorderSide(
                                    color: qrSubmisionsData[index].status == "sonuclandı"
                                        ? Colors.green
                                        : qrSubmisionsData[index].status == "bekliyor"
                                            ? Colors.red
                                            : Colors.blue,
                                    width: 2)),
                            onTap: () async {
                              await showSubmissionDetail(context, qrSubmisionsData[index]);
                            },
                            title: Text(
                              qrSubmisionsData[index].content ?? "",
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            subtitle: Text("Başvuru no: " + (qrSubmisionsData[index].id ?? "-")),
                            trailing: Text.rich(
                              TextSpan(
                                children: [
                                  TextSpan(
                                    text: "\n" + (qrSubmisionsData[index].status?.toUpperCase() ?? ""),
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      decoration: TextDecoration.none,
                                      fontSize: 15,
                                      color: qrSubmisionsData[index].status == "sonuclandı"
                                          ? Colors.green
                                          : qrSubmisionsData[index].status == "bekliyor"
                                              ? Colors.red
                                              : Colors.blue,
                                    ),
                                  )
                                ],
                                text: "Durum",
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
  }
}
