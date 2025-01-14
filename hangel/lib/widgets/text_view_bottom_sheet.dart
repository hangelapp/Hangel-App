import 'package:flutter/material.dart';
import '/constants/app_theme.dart';
import '/constants/size.dart';

class TextViewBottomSheet extends StatefulWidget {
  const TextViewBottomSheet({super.key, required this.text});
  final String text;
  @override
  State<TextViewBottomSheet> createState() => _TextViewBottomSheetState();
}

class _TextViewBottomSheetState extends State<TextViewBottomSheet> {
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          Text(
            widget.text,
            style: AppTheme.normalTextStyle(context, 16),
          ),
          SizedBox(
            height: deviceHeightSize(context, 20),
          ),
        ],
      ),
    );
  }
}
