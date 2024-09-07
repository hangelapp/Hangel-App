import 'package:flutter/material.dart';
import '../constants/app_theme.dart';
import '../constants/size.dart';

class BottomSheetWidget extends StatefulWidget {
  const BottomSheetWidget({Key? key, required this.title, required this.child, this.isMinPadding = false})
      : super(key: key);
  final String title;
  final Widget child;
  final bool isMinPadding;
  @override
  State<BottomSheetWidget> createState() => _BottomSheetWidgetState();
}

class _BottomSheetWidgetState extends State<BottomSheetWidget> {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 500),
          decoration: const BoxDecoration(
            color: AppTheme.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(20),
              topRight: Radius.circular(20),
            ),
          ),
          constraints: BoxConstraints(
            maxHeight: deviceHeightSize(context, 700),
          ),
          padding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, widget.isMinPadding ? 0 : 24),
          ),
          child: IntrinsicHeight(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(height: deviceHeightSize(context, 20)),
                Text(
                  widget.title,
                  style: AppTheme.boldTextStyle(context, 20),
                ),
                SizedBox(height: deviceHeightSize(context, 14)),
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: AppTheme.darkBlue.withOpacity(0.1),
                  ),
                  height: deviceHeightSize(context, 3),
                  width: deviceWidthSize(context, 50),
                ),
                SizedBox(height: deviceHeightSize(context, 20)),
                Expanded(
                  child: SizedBox(width: deviceWidth(context), child: widget.child),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
