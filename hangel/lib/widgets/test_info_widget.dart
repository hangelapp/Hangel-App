import '../constants/app_theme.dart';
import '../constants/size.dart';
import 'package:flutter/material.dart';

class TestInfoWidget extends StatelessWidget {
  const TestInfoWidget({
    super.key,
    required this.text,
    required this.value,
    required this.icon,
    this.color = AppTheme.green,
    this.width = 106,
  });
  final String text;
  final String value;
  final IconData icon;
  final Color color;
  final double width;
  @override
  Widget build(BuildContext context) {
    return Container(
      width: deviceWidthSize(context, width),
      constraints: BoxConstraints(
        minHeight: deviceHeightSize(context, 90),
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      padding: EdgeInsets.symmetric(
        horizontal: deviceWidthSize(context, 10),
        vertical: deviceHeightSize(context, 10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(
            icon,
            color: color,
            size: deviceFontSize(context, 30),
          ),
          SizedBox(
            width: deviceFontSize(context, 10),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (value.isNotEmpty)
                  Text(
                    value,
                    style: AppTheme.boldTextStyle(
                      context,
                      20,
                    ),
                    textAlign: TextAlign.left,
                  ),
                if (text.isNotEmpty)
                  Text(
                    text,
                    style: AppTheme.lightTextStyle(
                      context,
                      14,
                    ),
                    textAlign: TextAlign.left,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
