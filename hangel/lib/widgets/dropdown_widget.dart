import 'package:dropdown_flutter/custom_dropdown.dart';
import 'package:flutter/material.dart';
import '../constants/app_theme.dart';
import '../constants/size.dart';

class DropdownWidget extends StatelessWidget {
  const DropdownWidget(
    BuildContext context, {
    required this.titles,
    this.title,
    required this.selectedIndex,
    this.onChanged,
    this.isRequired = false,
    this.hintText = "Seçiniz",
    this.color = const Color(0xFFFFFFFF),
    this.isBold = false,
    this.validator, // Validator parametresi eklendi
    super.key,
  });

  final List<String>? titles;
  final String? title;
  final int selectedIndex;
  final Function(String?)? onChanged;
  final bool isRequired;
  final String hintText;
  final Color? color;
  final bool isBold;
  final String? Function(String?)? validator; // Validator tanımı

  @override
  Widget build(BuildContext context) {
    List<DropdownMenuItem<String>> items = [];
    for (var item in titles ?? []) {
      items.add(
        DropdownMenuItem(
          value: item,
          child: Text(
            item,
            style: AppTheme.normalTextStyle(context, 16),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null)
          SizedBox(
            width: double.infinity,
            child: RichText(
              text: TextSpan(
                text: title,
                style: AppTheme.semiBoldTextStyle(context, 15),
                children: [
                  if (isRequired)
                    TextSpan(
                      text: " *",
                      style: AppTheme.semiBoldTextStyle(context, 16, color: AppTheme.red),
                    ),
                ],
              ),
            ),
          ),
        SizedBox(height: deviceHeightSize(context, 10)),
        FormField<String>(
          validator: validator, // Validator fonksiyonu burada kullanılıyor
          builder: (FormFieldState<String> state) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: AppTheme.shadowList,
                    color: color,
                  ),
                  padding: EdgeInsets.symmetric(
                    horizontal: deviceWidthSize(context, 10),
                    vertical: deviceHeightSize(context, 5),
                  ),
                  width: double.infinity,
                  height: deviceHeightSize(context, 50),
                  child: DropdownButtonHideUnderline(
                    child: DropdownFlutter<String>.search(
                      hintText: "",
                      // isExpanded: true,
                      // alignment: Alignment.centerLeft,
                      // dropdownColor: color,
                      // borderRadius: BorderRadius.circular(10),
                      // focusColor: color,
                      // menuMaxHeight: deviceHeightSize(context, 400),
                      // style: isBold ? AppTheme.semiBoldTextStyle(context, 16) : AppTheme.normalTextStyle(context, 16),
                      // icon: const Icon(
                      //   Icons.arrow_drop_down,
                      //   color: AppTheme.darkBlue,
                      // ),
                      items: titles,
                      onChanged: (String? newValue) {
                        onChanged?.call(newValue);
                        state.didChange(newValue); // FormField durumunu güncelle
                      },
                      // value: selectedIndex == -1 ? null : items[selectedIndex].value,
                      // hint: Text(
                      //   hintText,
                      //   style: AppTheme.normalTextStyle(context, 16, color: AppTheme.darkBlue.withOpacity(0.5)),
                      // ),
                    ),
                  ),
                ),
                if (state.hasError)
                  Padding(
                    padding: const EdgeInsets.only(top: 5.0, left: 10.0),
                    child: Text(
                      state.errorText ?? '',
                      style: AppTheme.normalTextStyle(context, 12, color: AppTheme.red),
                    ),
                  ),
              ],
            );
          },
        ),
        SizedBox(height: deviceHeightSize(context, 16)),
      ],
    );
  }
}
