import '../constants/app_theme.dart';
import '../constants/size.dart';
import 'package:flutter/material.dart';

class MenuItemWidget extends StatelessWidget {
  const MenuItemWidget(
      {Key? key,
      required this.title,
      required this.icon,
      required this.iconColor,
      this.titleColor = Colors.black,
      required this.onTap})
      : super(key: key);
  final String title;
  final Widget icon;
  final Color iconColor;
  final Color titleColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.symmetric(
        horizontal: deviceWidthSize(context, 30),
      ),
      onTap: onTap,
      leading: icon,
      title: Text(
        title,
        style: AppTheme.semiBoldTextStyle(context, 16, color: titleColor),
      ),
    );
  }
}
