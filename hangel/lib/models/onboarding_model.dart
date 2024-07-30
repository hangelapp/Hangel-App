import 'package:flutter/material.dart';

class OnboardingModel {
  final String title;
  final List<String> options;
  final AssetImage image;

  OnboardingModel({
    required this.title,
    required this.options,
    required this.image,
  });
}
