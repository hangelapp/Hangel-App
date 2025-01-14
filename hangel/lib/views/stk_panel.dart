import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/views/stk_panel_qr.dart';

import 'app_view.dart';

class STKPanel extends StatefulWidget {
  const STKPanel({super.key});
  static const routeName = '/stkpanel';

  @override
  State<STKPanel> createState() => _STKPanelState();
}

class _STKPanelState extends State<STKPanel> {
  bool isLoading = true;
  bool isVerify = false;
  StkModel? stkModel;

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
        (stkId) {
          if (!isVerify) {
            Navigator.pushNamedAndRemoveUntil(context, AppView.routeName, (route) => false);
          } else {
            print("doğrulandı!");
            FirebaseFirestore.instance.collection("stklar").where("id", isEqualTo: stkId).get().then(
              (value) {
                if (!value.docs.first.exists) return;
                setState(() {
                  stkModel = StkModel.fromJson(value.docs.first.data());
                  isLoading = false;
                });
              },
            );
          }
        },
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return isLoading
        ? const Scaffold(body: Center(child: CircularProgressIndicator()))
        : Scaffold(
            appBar: AppBar(title: const Text('STK Yönetim Paneli')),
            body: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const SizedBox(height: 20),
                const Text(
                  'Yönettiğiniz STK',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(10.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 30,
                          backgroundImage: NetworkImage(stkModel?.logo ?? ""),
                          child: stkModel?.logo == null || (stkModel?.logo!.isEmpty ?? false)
                              ? const Icon(Icons.error, color: Colors.red)
                              : const SizedBox(),
                        ),
                        Flexible(
                          child: Padding(
                            padding: const EdgeInsets.only(left: 10),
                            child: Text(
                              (stkModel?.name ?? "-"),
                              style: const TextStyle(fontSize: 17),
                            ),
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.only(left: 5),
                          child: Icon(Icons.verified, color: Colors.blue),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 15),
                const Text(
                  'İşlemler',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 5),
                Expanded(
                  child: SingleChildScrollView(
                    child: GridView.count(
                        childAspectRatio: 2.5,
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        mainAxisSpacing: 6,
                        crossAxisSpacing: 6,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          buildQrCreate(),
                          buildNullItem(),
                          buildNullItem(),
                          buildNullItem(),
                          buildNullItem(),
                          buildNullItem(),
                          buildNullItem(),
                        ]),
                  ),
                ),
                const Text(
                  'Bilgiler',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 10),
                Table(
                  columnWidths: const {0: const IntrinsicColumnWidth()},
                  border: TableBorder(
                    horizontalInside: BorderSide(width: 0.5, color: Colors.grey.shade300),
                  ),
                  defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                  children: [
                    TableRow(
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(8.0),
                          child: Text(
                            "STK ID",
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text(stkModel?.id ?? "-"),
                        ),
                      ],
                    ),
                    TableRow(
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(8.0),
                          child: Text(
                            "STK Aktif",
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text(
                            stkModel?.isActive == true ? "Evet" : "Hayır",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: stkModel?.isActive == true ? Colors.green : Colors.red,
                            ),
                          ),
                        ),
                      ],
                    ),
                    TableRow(
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(8.0),
                          child: Text(
                            "Katılma Tarihi",
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text(
                            "${stkModel?.creationDate?.day}/${stkModel?.creationDate?.month}/${stkModel?.creationDate?.year}",
                          ),
                        ),
                      ],
                    ),
                    TableRow(
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(8.0),
                          child: Text(
                            "STK Türü",
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text(stkModel?.type ?? "-"),
                        ),
                      ],
                    ),
                    TableRow(
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(8.0),
                          child: Text(
                            "STK Adres",
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text(stkModel?.city ?? "-"),
                        ),
                      ],
                    ),
                    TableRow(
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(8.0),
                          child: Text(
                            "Kategori",
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text("${stkModel?.categories.join(", ")}"),
                        ),
                      ],
                    ),
                    TableRow(
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(8.0),
                          child: Text(
                            "Deprem Bölgesi",
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text(stkModel?.inEarthquakeZone == true ? "Evet" : "Hayır"),
                        ),
                      ],
                    ),
                    TableRow(
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(8.0),
                          child: Text(
                            "Fayda Alanı",
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text("${stkModel?.fieldOfBenefit}"),
                        ),
                      ],
                    ),
                    TableRow(
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(8.0),
                          child: Text(
                            "Özel Durum",
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text("${stkModel?.specialStatus}"),
                        ),
                      ],
                    ),
                  ],
                ),
              ]),
            ),
          );
  }

  Widget buildQrCreate() {
    return Material(
      color: Colors.grey.shade300,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        splashColor: Colors.grey.shade200,
        onTap: () {
          Navigator.pushNamed(context, STKPanelQr.routeName);
        },
        child: Container(
          height: 100,
          width: 100,
          padding: const EdgeInsets.all(8.0),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            // color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Center(
            child: Text(
              "QR Kod Görüntüle",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ),
    );
  }

  Widget buildNullItem() {
    return Material(
      color: Colors.grey.shade300,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        splashColor: Colors.grey.shade200,
        onTap: () {},
        child: Container(
          height: 100,
          width: 100,
          padding: const EdgeInsets.all(8.0),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            // color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Center(
            child: Text(
              "Yakında...",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ),
    );
  }
}
