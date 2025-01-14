import 'package:flutter/material.dart';
import '../constants/app_theme.dart';
import '../constants/size.dart';

class GeneralButtonWidget extends StatelessWidget {
  const GeneralButtonWidget({
    super.key,
    required this.onPressed,
    required this.text,
    this.buttonColor = const Color(0xFF2B2D42),
    this.textColor = const Color(0xFFFFFFFF),
    this.isLoading = false,
  });
  final Function()? onPressed;
  final Color? buttonColor;
  final String text;
  final Color? textColor;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return ButtonTheme(
      minWidth: deviceWidth(context),
      height: deviceHeightSize(context, 52),
      child: MaterialButton(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(
            Radius.circular(20),
          ),
        ),
        color: onPressed!=null? buttonColor:Colors.grey,
        elevation: 0,
        onPressed: onPressed ?? () {},
        child: isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  color: Colors.white,
                ),
              )
            : Text(
                text,
                textAlign: TextAlign.center,
                style: AppTheme.semiBoldTextStyle(context, 16, color: textColor ?? Colors.white),
              ),
      ),
    );
  }
}
