import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/widgets/app_name_widget.dart';
import 'package:hangel/widgets/locale_text.dart';
import 'package:hangel/widgets/toast_widgets.dart';

import '../helpers/send_mail_helper.dart';
import '../models/user_model.dart';
import '../views/utilities.dart';
import 'dialog_widgets.dart';

Widget ListItemWidget(
  BuildContext context, {
  required String? logo,
  required String? title,
  String? sector,
  String? desc,
  required Function()? onTap,
  List<String>? totalAplicant,
  String? stkEmail,
  String? stkId,
  double? donationRate,
  bool? isSTKVolunteer,
  double? paddingVertical,
  double? paddingHorizontal,
  double? logoWidth,
  double? logoHeight,
  double? nullFontSize,
  bool? isActive,
}) {
  bool? applicantExist;
  if (totalAplicant != null) {
    applicantExist = checkTotalAplicant(totalAplicant);
  }
  return Stack(
    children: [
      GestureDetector(
        onTap: onTap,
        child: Container(
          margin: EdgeInsets.symmetric(
            vertical: deviceHeightSize(context, 4),
            horizontal: deviceWidthSize(context, 10),
          ),
          padding: EdgeInsets.symmetric(
            horizontal: paddingHorizontal ?? deviceWidthSize(context, 16),
            vertical: paddingVertical ?? deviceHeightSize(context, 16),
          ),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(13),
            boxShadow: AppTheme.shadowListBig(radius: 22),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: logoWidth ?? deviceWidthSize(context, 80),
                height: logoHeight ?? deviceHeightSize(context, 80),
                child: logo != null
                    ? Image.network(
                        logo,
                        alignment: Alignment.center,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) =>
                            listItemImage2(context, logo: logo, onTap: onTap, nullFontSize: nullFontSize),
                      )
                    : listItemImage2(context, logo: logo, onTap: onTap, nullFontSize: nullFontSize),
              ),
              SizedBox(
                width: deviceWidthSize(context, 10),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title ?? "",
                                style: AppTheme.boldTextStyle(context, 15),
                              ),
                              Text(
                                sector ?? "",
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTheme.lightTextStyle(context, 12),
                              ),
                            ],
                          ),
                        ),
                        if (donationRate != null)
                          Column(
                            children: [
                              LocaleText(
                                "home_page_donation_rate",
                                style: AppTheme.normalTextStyle(context, 14),
                              ),
                              Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: deviceWidthSize(context, 10),
                                  vertical: deviceHeightSize(context, 5),
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.volunteer_activism_rounded,
                                      color: AppTheme.primaryColor,
                                      size: deviceFontSize(context, 18),
                                    ),
                                    SizedBox(
                                      width: deviceWidthSize(context, 6),
                                    ),
                                    Text(
                                      "%${(donationRate)}",
                                      style: AppTheme.semiBoldTextStyle(
                                        context,
                                        14,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          )
                      ],
                    ),
                    // SizedBox(
                    //   height: deviceHeightSize(context, 5),
                    // ),
                    // Text(
                    //   desc ?? "",
                    //   overflow: TextOverflow.ellipsis,
                    //   maxLines: 5,
                    //   style: AppTheme.normalTextStyle(context, 14),
                    // ),
                  ],
                ),
              ),
              isSTKVolunteer == true && totalAplicant != null ? SizedBox(width: 4) : SizedBox.shrink(),
              // 6kGnMPHZdVTAUr9RC9Y885dvTZS2
              isSTKVolunteer == true && totalAplicant != null
                  ? Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: ElevatedButton(
                        onPressed: () {
                          if (stkEmail == null && stkId == null) {
                            return;
                          }
                          applicantExist == true ? null : showApplyInfo(context, stkEmail!, stkId!);
                        },
                        child: applicantExist == true ? LocaleText("basvuruldu") : LocaleText("basvur"),
                        style: ButtonStyle(
                            padding: WidgetStatePropertyAll(EdgeInsets.symmetric(horizontal: 8)),
                            backgroundColor:
                                WidgetStatePropertyAll(applicantExist == true ? Colors.grey : AppTheme.primaryColor),
                            foregroundColor: WidgetStatePropertyAll(Colors.white),
                            shape:
                                WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)))),
                      ),
                    )
                  : SizedBox.shrink()
            ],
          ),
        ),
      ),
      totalAplicant != null
          ? Positioned(
              right: deviceWidthSize(context, 20),
              top: deviceHeightSize(context, 4),
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.only(bottomLeft: Radius.circular(10), topRight: Radius.circular(10)),
                  color: AppTheme.primaryColor,
                ),
                child: Text(
                  "${totalAplicant.length} " + "kisi_basvurdu".locale,
                  style: TextStyle(color: AppTheme.white),
                ),
              ))
          : SizedBox.shrink(),
      isActive == false
          ? Positioned.fill(
              child: Container(
              color: Colors.white.withOpacity(0.9),
              child: Center(
                  child: Text(
                "Bu STK artık aktif değil",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              )),
            ))
          : SizedBox(),
    ],
  );
}

bool checkTotalAplicant(List<String> totalAplicant) {
  bool result = false;
  for (var id in totalAplicant) {
    if (id == HiveHelpers.getUserFromHive().uid) {
      result = true;
    }
  }
  return result;
}

Future<void> showApplyInfo(context, String stkEmail, String stkId) async {
  bool isLoading = false;
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => StatefulBuilder(
      builder: (BuildContext context, void Function(void Function()) setState) =>
          DialogWidgets().rowCircularButtonDialogWidget(
        context,
        title: 'Uyarı',
        content:
            'Onayladığınızda kullanıcı bilgilerinizi STK ile paylaşıcağız.\nNot: Bilgileriniz sadece STK\'yla paylaşılacaktır.\nBu işlem 20 saniye kadar sürebilir.',
        color: AppTheme.primaryColor,
        buttonText: "Başvur",
        isLoading: isLoading,
        onCancelButtonPressed: () {
          if (!isLoading) {
            Navigator.pop(context);
          }
        },
        cancelButtonText: "Vazgeç",
        onAcceptButtonPressed: () async {
          setState(() {
            isLoading = true;
          });
          if (HiveHelpers.getUserFromHive().email?.isEmpty ?? true) {
            ToastWidgets.errorToast(context, "Mail adresinizi kaydetmeden gönülülük başvurusunda bulunamazsınız.");
            setState(() {
              isLoading = false;
            });
            return;
          }
          if (HiveHelpers.getUserFromHive().uid?.isEmpty ?? true) {
            ToastWidgets.errorToast(
                context, "Kullanıcı bilgileriniz getirilirken bir sorun oluştur lütfen uygulamayı yenileyin.");
            setState(() {
              isLoading = false;
            });
            return;
          }
          // STK'ya mail gönder
          await SendMailHelper.sendMail(
            to: [stkEmail],
            subject: "Gönüllülük Başvurusu",
            body: "Gönüllülük Başvurusu",
            html: HiveHelpers.getUserFromHive().toHtmlTable(),
          );

          // Kullanıcıya mail gönder
          await SendMailHelper.sendMail(
            to: [HiveHelpers.getUserFromHive().email!],
            subject: "Gönüllülük Başvurusu",
            body: "Gönüllülük Başvurusu",
            html: UserModel.mailSendSuccessMessage,
          );

          try {
            // Belgeyi bulma
            var querySnapshot = await FirebaseFirestore.instance
                .collection("stkVolunteers")
                .where("stkId", isEqualTo: stkId)
                .limit(1)
                .get();

            if (querySnapshot.docs.isNotEmpty) {
              // İlk belgeyi al
              var document = querySnapshot.docs.first;
              var data = document.data();

              // ApplicantIds'ı al
              List<String> applicantIds = List<String>.from(data['applicantIds'] ?? []);

              // Kullanıcıyı applicantIds listesine ekle
              if (!applicantIds.contains(HiveHelpers.getUserFromHive().uid)) {
                applicantIds.add(HiveHelpers.getUserFromHive().uid!);

                // Belgeyi güncelle
                await document.reference.update({
                  'applicantIds': applicantIds,
                });
                print('Kullanıcı başarıyla applicantIds listesine eklendi.');
              } else {
                print('Kullanıcı zaten listede mevcut.');
              }
            } else {
              print('Belge bulunamadı.');
            }
            setState(() {
              isLoading = false;
            });
          } catch (e) {
            print('Bir hata oluştu: $e');
            setState(() {
              isLoading = false;
            });
          }
          Navigator.pop(context);
        },
      ),
    ),
  );
}

GestureDetector listItemImage2(
  BuildContext context, {
  required String? logo,
  required Function()? onTap,
  double? nullFontSize,
}) {
  int randomIndex = (logo ?? "").length % randomColors.length;
  return GestureDetector(
    onTap: onTap,
    child: Container(
      decoration: BoxDecoration(
        color: randomColors[randomIndex],
        boxShadow: AppTheme.shadowList,
        borderRadius: BorderRadius.circular(13),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AppNameWidget(
            fontSize: nullFontSize ?? 16,
            color: AppTheme.white,
          ),
        ],
      ),
    ),
  );
}
