import '../constants/app_theme.dart';
import '../constants/size.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class ErrorMessageWidget extends StatelessWidget {
  const ErrorMessageWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SvgPicture.asset(
          "assets/images/error.svg",
          height: deviceHeightSize(context, 270),
        ),
        SizedBox(
          height: deviceHeightSize(context, 20),
        ),
        Text(
          "Bir hata oluştu :(",
          style: AppTheme.boldTextStyle(context, 20),
        ),
        SizedBox(
          height: deviceHeightSize(context, 20),
        ),
      ],
    );
  }
}
