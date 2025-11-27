import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/models/stk_model.dart';
import 'package:hangel/views/stk_panel_info.dart';
import 'package:hangel/views/stk_panel_qr.dart';
import 'package:hangel/widgets/app_name_widget.dart';

import 'app_view.dart';
import 'stk_panel_support.dart';

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
                          buildProcessButton(
                              "QR Kod Görüntüle", () => Navigator.pushNamed(context, STKPanelQr.routeName)),
                          buildProcessButton("Destek", () => Navigator.pushNamed(context, StkPanelSupport.routeName)),
                          buildProcessButton(
                              "Bilgileri Güncelle", () => Navigator.pushNamed(context, STKPanelInfo.routeName)),
                          buildNullItem(),
                          buildNullItem(),
                          buildNullItem(),
                        ]),
                  ),
                ),
              ]),
            ),
          );
  }

  Widget buildProcessButton(String title, void Function()? onTap) {
    return Material(
      color: Colors.white70,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        splashColor: Colors.grey.shade200,
        onTap: onTap ?? () {},
        child: Stack(
          fit: StackFit.expand,
          children: [
            Positioned(
              left: 0,
              top: 0,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: AppTheme.primaryColor,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(10),
                    bottomRight: Radius.circular(10),
                  ),
                ),
                child: const Icon(
                  Icons.info_outline,
                  color: Colors.white,
                  size: 15,
                ),
              ),
            ),
            Center(
                child: AppNameWidget(
              fontSize: 40,
              color: AppTheme.primaryColor.withOpacity(0.05),
            )),
            Container(
              height: 100,
              width: 100,
              padding: const EdgeInsets.all(8.0),
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.primaryColor.withOpacity(0.2)),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                ),
              ),
            ),
          ],
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
