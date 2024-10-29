import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../constants/app_theme.dart';
import '../constants/size.dart';

class FormFieldWidget extends StatelessWidget {
  const FormFieldWidget(
    BuildContext context, {
    super.key,
    required this.controller,
    required this.title,
    this.inputFormatters,
    this.validator,
    this.hintText = "",
    this.isRequired = false,
    this.maxLines = 1,
    this.minLines = 1,
    this.ontap,
    this.leading = const SizedBox(),
    this.keyboardType,
    this.isEditable = true,
    this.readOnly = false,
  });
  final TextEditingController controller;
  final String title;
  final Widget leading;
  final String hintText;
  final bool isRequired;
  final List<TextInputFormatter>? inputFormatters;
  final int maxLines;
  final int minLines;
  final Function()? ontap;
  final String? Function(String?)? validator;
  final bool isEditable;
  final bool readOnly;

  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: AppTheme.semiBoldTextStyle(context, 16),
              ),
            ),
            if (isRequired)
              Text(
                " *",
                style: AppTheme.semiBoldTextStyle(context, 16, color: AppTheme.red),
              ),
          ],
        ),
        SizedBox(height: deviceHeightSize(context, 10)),
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 10),
          ),
          decoration: BoxDecoration(
            color: AppTheme.white,
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: AppTheme.darkBlue.withOpacity(0.2),
                blurRadius: 22,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Row(
            children: [
              Padding(
                padding: EdgeInsets.only(bottom: deviceHeightSize(context, 2)),
                child: leading,
              ),
              Expanded(
                child: TextFormField(
                  controller: controller,
                  onTap: ontap,
                  readOnly: readOnly,
                  maxLines: maxLines,
                  minLines: minLines,
                  cursorColor: AppTheme.darkBlue,
                  scrollPadding: EdgeInsets.only(bottom: 100),
                  textInputAction: maxLines > 2 ? TextInputAction.newline : TextInputAction.done,
                  style: AppTheme.normalTextStyle(context, 16),
                  validator: validator,
                  enabled: isEditable,
                  inputFormatters: inputFormatters,
                  decoration: AppTheme.noneBorderInputDecoration(
                    hintText: hintText,
                  ),
                  keyboardType: keyboardType,
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: deviceHeightSize(context, 16)),
      ],
    );
  }
}
