import 'package:flutter/material.dart';
import 'package:hangel/constants/app_theme.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/views/home_page.dart';
import 'package:hangel/widgets/app_name_widget.dart';

import '../views/utilities.dart';

ListItemWidget(
  BuildContext context, {
  required String? logo,
  required String? title,
  String? sector,
  required String? desc,
  required Function()? onTap,
  double? donationRate,
}) {
  return GestureDetector(
    onTap: onTap,
    child: Container(
      margin: EdgeInsets.symmetric(
        vertical: deviceHeightSize(context, 4),
        horizontal: deviceWidthSize(context, 20),
      ),
      padding: EdgeInsets.symmetric(
        horizontal: deviceWidthSize(context, 16),
        vertical: deviceHeightSize(context, 16),
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
            width: deviceWidthSize(context, 80),
            height: deviceHeightSize(context, 80),
            // decoration: BoxDecoration(
            //   borderRadius: BorderRadius.circular(13),
            //   image: logo == null
            //       ? null
            //       : DecorationImage(
            //           image: NetworkImage(logo),
            // alignment: Alignment.center,
            // fit: BoxFit.fitWidth,
            //         ),
            // ),
            child: logo == null
                ? listItemImage2(context, logo: logo, onTap: onTap)
                : Image.network(
                    logo,
                    alignment: Alignment.center,
                    fit: BoxFit.fitWidth,
                    errorBuilder: (context, error, stackTrace) => listItemImage2(context, logo: logo, onTap: onTap),
                  ),
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
                            style: AppTheme.lightTextStyle(context, 12),
                          ),
                        ],
                      ),
                    ),
                    if (donationRate != null)
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
        ],
      ),
    ),
  );
}

GestureDetector listItemImage2(
  BuildContext context, {
  required String? logo,
  required Function()? onTap,
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
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AppNameWidget(
            fontSize: 16,
            color: AppTheme.white,
          ),
          // SizedBox(
          //   height: deviceHeightSize(context, 8),
          // ),
          // Padding(
          //   padding: EdgeInsets.symmetric(
          //     horizontal: deviceWidthSize(context, 10),
          //   ),
          //   child: Text(
          //     logo ?? "",
          //     textAlign: TextAlign.center,
          //     style: AppTheme.boldTextStyle(context, 14, color: AppTheme.white),
          //   ),
          // ),
        ],
      ),
    ),
  );
}
