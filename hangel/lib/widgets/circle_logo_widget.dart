// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:flutter/material.dart';

import '../constants/app_theme.dart';

class CircleLogoWidget extends StatelessWidget {
  final String logoUrl;
  final String? logoName;
  const CircleLogoWidget({
    super.key,
    required this.logoUrl,
    this.logoName,
  });
  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: 20,
      backgroundColor: AppTheme.white,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(60),
        child: Image.network(
          logoUrl,
          fit: BoxFit.contain,
          alignment: Alignment.center,
          errorBuilder: (context, error, stackTrace) => Center(
            child: Text(
              logoName?[0] ?? "",
              style: AppTheme.boldTextStyle(context, 28, color: AppTheme.black),
            ),
          ),
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return const Center(child: CircularProgressIndicator());
          },
        ),
      ),
    );
  }
}
