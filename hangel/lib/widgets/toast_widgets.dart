import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../constants/app_theme.dart';
import '../constants/size.dart';
import '../models/general_response_model.dart';

class ToastWidgets {
  static smallToast(
      BuildContext context, svgPicturePath, String text, Color color,
      {ToastGravity gravity = ToastGravity.TOP,
      int millisecondsDuration = 2000}) {
    print("toast : $text");
    FToast _fToast = FToast();
    _fToast.init(context);
    _fToast.showToast(
        gravity: gravity,
        toastDuration: Duration(milliseconds: millisecondsDuration),
        child: Container(
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(12),
          ),
          padding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 14),
            vertical: deviceHeightSize(context, 10),
          ),
          width: deviceWidthSize(context, 300),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // SizedBox(
              //   width: deviceWidthSize(context, 30),
              //   height: deviceWidthSize(context, 30),
              //   child: SvgPicture.asset(svgPicturePath, color: AppTheme.white),
              // ),
              SizedBox(
                width: deviceWidthSize(context, 200),
                child: Text(
                  text,
                  style: AppTheme.semiBoldTextStyle(context, 14,
                      color: AppTheme.white),
                ),
              ),
            ],
          ),
        ));
  }

  static responseToast(BuildContext context, GeneralResponseModel response,
      {int millisecondsDuration = 2000}) {
    if (response.success! == false) {
      smallToast(context, "assets/icons/error.svg", response.message ?? "",
          AppTheme.errorRed,
          millisecondsDuration: millisecondsDuration);
    } else {
      smallToast(context, "assets/icons/check-all.svg", response.message ?? "",
          AppTheme.green,
          millisecondsDuration: millisecondsDuration);
    }
  }

  static void errorToast(BuildContext context, String text) {
    smallToast(context, "assets/icons/error.svg", text, AppTheme.red);
  }

  static void successToast(BuildContext context, String text) {
    smallToast(context, "assets/icons/check-all.svg", text, AppTheme.green);
  }
}
