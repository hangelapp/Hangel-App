import 'package:flutter/material.dart';
import '../constants/app_theme.dart';
import '../constants/size.dart';

class BackButtonWidget extends StatelessWidget {
  const BackButtonWidget({super.key, this.color = AppTheme.secondaryColor});
  final Color color;
  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () {
        Navigator.pop(context);
      },
      icon: Padding(
        padding: EdgeInsets.only(left: deviceWidthSize(context, 5)),
        child: Icon(
          Icons.arrow_back_ios,
          color: color,
        ),
      ),
    );
  }
}
