import 'package:flutter/material.dart';
import '/constants/app_theme.dart';
import '/constants/size.dart';

class DialogWidgets {
  Widget rowCircularButtonDialogWidget(
    BuildContext context, {
    Function? onAcceptButtonPressed,
    Function? onCancelButtonPressed,
    required String? title,
    bool isLoading = false,
    required String? content,
    required Color? color,
    String buttonText = "Tamam",
    String cancelButtonText = "Kapat",
    Color cancelButtonColor = const Color(0xFF7D7D7D),
    Widget? extraWidget,
  }) {
    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      child: Container(
        width: deviceWidthSize(context, 300),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
        ),
        child: IntrinsicHeight(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: deviceWidthSize(context, 300),
                padding: EdgeInsets.symmetric(
                    horizontal: deviceWidthSize(context, 20),
                    vertical: deviceHeightSize(context, 20)),
                alignment: Alignment.center,
                child: Text(
                  title!,
                  textAlign: TextAlign.center,
                  style: AppTheme.normalTextStyle(context, 17)
                      .copyWith(color: color, fontWeight: FontWeight.bold),
                ),
              ),
              const Spacer(),
              Padding(
                padding: EdgeInsets.all(deviceWidthSize(context, 20)),
                child: Text(
                  content!,
                  style: AppTheme.normalTextStyle(context, 15).copyWith(),
                  textAlign: TextAlign.center,
                ),
              ),
              if (extraWidget != null) extraWidget,
              SizedBox(
                height: deviceHeightSize(context, 20),
              ),
              const Spacer(),
              Padding(
                padding: EdgeInsets.symmetric(
                    horizontal: deviceWidthSize(context, 20)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => onCancelButtonPressed == null
                            ? Navigator.pop(context)
                            : onCancelButtonPressed(),
                        child: Container(
                          decoration: BoxDecoration(
                            color: cancelButtonColor.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          height: deviceHeightSize(context, 57),
                          alignment: Alignment.center,
                          child: Text(
                            cancelButtonText,
                            textAlign: TextAlign.center,
                            style: AppTheme.normalTextStyle(context, 17)
                                .copyWith(
                                    color: cancelButtonColor,
                                    fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ),
                    if (onAcceptButtonPressed != null)
                      SizedBox(
                        width: deviceWidthSize(context, 10),
                      ),
                    if (onAcceptButtonPressed != null)
                      Expanded(
                        child: GestureDetector(
                          onTap: () => onAcceptButtonPressed(),
                          child: Container(
                            decoration: BoxDecoration(
                              color: color,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            height: deviceHeightSize(context, 57),
                            alignment: Alignment.center,
                            child: isLoading
                                ? const Center(
                                    child: CircularProgressIndicator(
                                      color: AppTheme.white,
                                    ),
                                  )
                                : Text(
                                    buttonText,
                                    textAlign: TextAlign.center,
                                    style: AppTheme.normalTextStyle(context, 17)
                                        .copyWith(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold),
                                  ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              SizedBox(
                height: deviceHeightSize(context, 25),
              )
            ],
          ),
        ),
      ),
    );
  }
}
