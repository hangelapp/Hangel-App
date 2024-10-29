import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/extension/string_extension.dart';

Widget SearchWidget(BuildContext context,
    {required Function(String)? onChanged, required TextEditingController controller, String? hintText}) {
  return Container(
    margin: EdgeInsets.symmetric(
      horizontal: deviceWidthSize(context, 20),
    ),
    padding: EdgeInsets.symmetric(
      horizontal: deviceWidthSize(context, 10),
      vertical: deviceHeightSize(context, 4),
    ),
    decoration: BoxDecoration(
      color: AppTheme.white,
      borderRadius: BorderRadius.circular(10),
      // border: Border.all(
      //   color: AppTheme.secondaryColor.withOpacity(0.2),
      // ),
    ),
    child: TextField(
      onChanged: (value) {
        onChanged!(value);
      },
      controller: controller,
      decoration: InputDecoration(
        hintText: "ara".locale,
        hintStyle: AppTheme.lightTextStyle(context, 14),
        // border: InputBorder.none,
        prefixIcon: Padding(
          padding: EdgeInsets.only(
            top: deviceHeightSize(context, 4),
          ),
          child: Icon(
            Icons.search_rounded,
            color: AppTheme.secondaryColor.withOpacity(0.5),
          ),
        ),
        suffixIcon: controller.text.isNotEmpty
            ? GestureDetector(
                onTap: () {
                  controller.clear();
                  onChanged!("");
                },
                child: Padding(
                  padding: EdgeInsets.only(
                    top: deviceHeightSize(context, 4),
                  ),
                  child: Icon(
                    Icons.close_rounded,
                    color: AppTheme.secondaryColor.withOpacity(0.5),
                  ),
                ),
              )
            : null,
      ),
    ),
  );
}
