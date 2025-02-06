import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/widgets/dropdown_widget.dart';

import '../constants/app_theme.dart';
import '../constants/size.dart';
import '../models/stk_model.dart';
import '../models/stk_submission_model.dart';
import '../widgets/bottom_sheet_widget.dart';
import '../widgets/form_field_widget.dart';
import '../widgets/general_button_widget.dart';
import 'app_view.dart';
import 'utilities.dart';

class StkPanelSupport extends StatefulWidget {
  const StkPanelSupport({super.key});
  static get routeName => '/stkPanelSupport';
  @override
  State<StkPanelSupport> createState() => _StkPanelSupportState();
}

class _StkPanelSupportState extends State<StkPanelSupport> {
  bool isLoading = true;
  bool isVerify = false;
  StkModel? stkModel;
  List<STKSubmissionsModel> submissionList = [];
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
            .then((value) {
          setState(() {
            submissionList = value.docs.map((e) => STKSubmissionsModel.fromJson(e.data())).toList();
          });
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Destek')),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 10),
            Center(
                child: ElevatedButton(
                    onPressed: () {
                      _basvuruYap();
                    },
                    child: const Text("Talep Oluştur"))),
            const SizedBox(height: 25),
            const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: Text("Destek Taleplerim", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15))),
            const Divider(),
            Material(
              child: SizedBox(
                height: deviceHeight(context) * 0.6,
                child: ListView.builder(
                  itemCount: submissionList.isEmpty ? 1 : submissionList.length,
                  itemBuilder: (context, index) {
                    if (submissionList.isEmpty) return const Center(child: Text("Henüz bir talep yok..."));
                    return Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: ListTile(
                        tileColor: submissionList[index].status == "sonuclandı"
                            ? Colors.green.shade100
                            : submissionList[index].status == "bekliyor"
                                ? Colors.red.shade100
                                : Colors.blue.shade100,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                            side: BorderSide(
                                color: submissionList[index].status == "sonuclandı"
                                    ? Colors.green
                                    : submissionList[index].status == "bekliyor"
                                        ? Colors.red
                                        : Colors.blue,
                                width: 2)),
                        onTap: () async {
                          await showSubmissionDetail(context, submissionList[index]);
                        },
                        title: Text(
                          submissionList[index].content ?? "",
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Text("Başvuru no: " + (submissionList[index].id ?? "-")),
                        trailing: Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: "\n" + (submissionList[index].status?.toUpperCase() ?? ""),
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  decoration: TextDecoration.none,
                                  fontSize: 15,
                                  color: submissionList[index].status == "sonuclandı"
                                      ? Colors.green
                                      : submissionList[index].status == "bekliyor"
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
            ),
          ],
        ),
      ),
    );
  }

  void _basvuruYap() {
    TextEditingController messageController = TextEditingController();
    TextEditingController subjectController = TextEditingController();
    List<Map<String, dynamic>> list = [
      {"title": "QR Kod", "value": "qr"},
    ];
    int selectedIndex = 0;
    bool isLoading = false;
    final formKey = GlobalKey<FormState>();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (BuildContext context, void Function(void Function()) setState) => BottomSheetWidget(
          title: "Destek Talebi Oluştur",
          child: Form(
            key: formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Başvuru Tipi",
                  style: AppTheme.semiBoldTextStyle(context, 16),
                ),
                DropdownWidget(
                  context,
                  titles: list.map((e) => e["title"] as String).toList(),
                  selectedIndex: selectedIndex,
                  onChanged: (p0) {
                    setState(() {
                      selectedIndex = list.indexWhere((e) => e["title"] == p0);
                    });
                  },
                  validator: (p0) {
                    if (p0 == null) return "Başvuru tipi seçmelisiniz";
                    return null;
                  },
                ),
                FormFieldWidget(context, controller: subjectController, title: "Konu", validator: (p0) {
                  if (p0 == null || messageController.text == "") return "Konu seçmelisiniz";
                  return null;
                }),
                FormFieldWidget(
                  context,
                  controller: messageController,
                  title: "Mesaj",
                  minLines: 3,
                  maxLines: 3,
                  validator: (p0) {
                    if (p0 == null || subjectController.text == "") return "Mesaj seçmelisiniz";
                    return null;
                  },
                ),
                GeneralButtonWidget(
                  onPressed: () async {
                    if (formKey.currentState!.validate()) {
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
                          content: subjectController.text,
                          status: "bekliyor",
                          messages: [messageController.text],
                          stkId: stkModel.id,
                          userId: HiveHelpers.getUid(),
                          updatedAt: DateTime.now(),
                          createdAt: DateTime.now(),
                        );

                        await FirebaseFirestore.instance.collection("stkSubmissions").add(submission.toJson()).then(
                          (value) {
                            Fluttertoast.showToast(msg: "Başvuru gönderildi!");
                            submissionList.add(submission);
                            setState(() {});
                            Navigator.pop(context);
                          },
                        );
                      });
                      setState(() {
                        isLoading = false;
                      });
                    }
                  },
                  text: "Başvuruyu Gönder",
                  isLoading: isLoading,
                ),
                const SizedBox(height: 20)
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> showSubmissionDetail(context, STKSubmissionsModel submission) async {
    Size size = MediaQuery.of(context).size;
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
                        const Text("Başvuru Konusu: "),
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
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("Mesajlar"),
                        Container(
                          decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(10)),
                          height: size.height * 0.3,
                          child: ListView.builder(
                            itemCount: submission.messages?.length ?? 0,
                            itemBuilder: (BuildContext context, int index) {
                              return ListTile(
                                leading: Icon(Icons.send, color: Colors.grey.shade400),
                                title: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    submission.messages == null ? "Mesaj yok..." : submission.messages?[index] ?? "-",
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    textAlign: TextAlign.start,
                                  ),
                                ),
                              );
                            },
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
}
