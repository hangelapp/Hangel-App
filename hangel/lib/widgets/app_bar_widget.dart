import '../constants/app_theme.dart';
import 'package:flutter/material.dart';
import '../constants/size.dart';
import '../widgets/app_name_widget.dart';
import '../widgets/back_button_widget.dart';

class AppBarWidget extends StatefulWidget {
  const AppBarWidget({Key? key, this.leading, this.title}) : super(key: key);
  final String? title;
  final Widget? leading;
  @override
  State<AppBarWidget> createState() => _AppBarWidgetState();
}

class _AppBarWidgetState extends State<AppBarWidget> {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(top: deviceTopPadding(context)),
      padding: EdgeInsets.symmetric(
        horizontal: deviceWidthSize(context, 20),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          widget.leading == null ? const BackButtonWidget() : widget.leading!,
          widget.title == null
              ? const AppNameWidget(fontSize: 32)
              : SizedBox(
                  width: deviceWidthSize(context, 230),
                  child: Text(
                    widget.title!,
                    textAlign: TextAlign.center,
                    style: AppTheme.boldTextStyle(context, 20,
                        color: AppTheme.secondaryColor),
                  ),
                ),
          if (widget.title != null)
            SizedBox(width: deviceWidthSize(context, 45)),
        ],
      ),
    );
  }
}
