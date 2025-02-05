import 'package:flutter/material.dart';
import 'package:hangel/constants/size.dart';

class GradientWidget extends StatelessWidget {
  const GradientWidget(
      {super.key,
      required this.height,
      this.color = const Color(0xFFFFFFFF),
      this.opacity = 1});
  final double height;
  final Color color;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Opacity(
        opacity: opacity,
        child: Container(
          height: deviceHeightSize(context, height),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                color.withOpacity(0),
                color.withOpacity(0.5),
                color.withOpacity(0.8),
                color.withOpacity(1),
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        ),
      ),
    );
  }
}
