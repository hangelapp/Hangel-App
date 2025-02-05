import '/constants/app_theme.dart';
import '/constants/size.dart';
import 'package:flutter/material.dart';

class DropdownSelectWidget extends StatelessWidget {
  const DropdownSelectWidget(BuildContext context,
      {required this.titles,
      this.title,
      required this.selectedIndex,
      this.onSelect,
      this.isRequired = false,
      this.hintText = "Seçiniz",
      this.color = const Color(0xFFFFFFFF),
      this.isBold = false,
      super.key,
      required this.selectedItems,
      this.onRemove,
      this.isNumbered});
  final List<String>? titles;
  final String? title;
  final int selectedIndex;
  final Function(String?)? onSelect;
  final Function(String?)? onRemove;
  final bool isRequired;
  final String hintText;
  final Color? color;
  final bool isBold;
  final List<String> selectedItems;
  final bool? isNumbered;

  @override
  Widget build(BuildContext context) {
    List<DropdownMenuItem<String>> items = [];
    for (var item in titles ?? []) {
      items.add(
        DropdownMenuItem(
          value: item,
          child: Text(
            isNumbered == true ? "${titles!.indexOf(item) + 1}. $item" : item,
            style: AppTheme.normalTextStyle(
              context,
              16,
            ),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        title != null
            ? SizedBox(
                width: double.infinity,
                child: RichText(
                  text: TextSpan(
                    text: title,
                    style: AppTheme.semiBoldTextStyle(context, 16),
                    children: [
                      TextSpan(
                        text: isRequired ? " *" : "",
                        style: AppTheme.semiBoldTextStyle(context, 16,
                            color: AppTheme.red),
                      ),
                    ],
                  ),
                ),
              )
            : Container(),
        SizedBox(height: deviceHeightSize(context, 10)),
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: AppTheme.darkBlue.withOpacity(0.2),
                blurRadius: 22,
                offset: const Offset(0, 5),
              ),
            ],
            color: color,
          ),
          padding: EdgeInsets.symmetric(
              horizontal: deviceWidthSize(context, 10),
              vertical: deviceHeightSize(context, 5)),
          width: double.infinity,
          child: DropdownButtonHideUnderline(
            child: DropdownButton(
              alignment: Alignment.centerLeft,
              isExpanded: true,
              dropdownColor: color,
              borderRadius: BorderRadius.circular(10),
              focusColor: color,
              menuMaxHeight: deviceHeightSize(context, 400),
              style: isBold
                  ? AppTheme.semiBoldTextStyle(
                      context,
                      16,
                    )
                  : AppTheme.normalTextStyle(
                      context,
                      16,
                    ),
              icon: const Icon(
                Icons.arrow_drop_down,
                color: AppTheme.darkBlue,
              ),
              items: items,
              onChanged: onSelect,
              value: selectedIndex == -1 ? null : items[selectedIndex].value,
              hint: Text(
                hintText,
                style: AppTheme.normalTextStyle(context, 14,
                    color: AppTheme.darkBlue.withOpacity(0.5)),
              ),
            ),
          ),
        ),
        SizedBox(height: deviceHeightSize(context, 12)),
        Wrap(
          alignment: WrapAlignment.start,
          direction: Axis.horizontal,
          children: [
            for (var item in selectedItems)
              Container(
                margin: EdgeInsets.only(
                  right: deviceWidthSize(context, 10),
                  bottom: deviceHeightSize(context, 10),
                ),
                padding: EdgeInsets.symmetric(
                  horizontal: deviceWidthSize(context, 10),
                  vertical: deviceHeightSize(context, 5),
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: AppTheme.darkBlue.withOpacity(0.2),
                ),
                child: IntrinsicWidth(
                  child: Row(
                    children: [
                      Text(
                        item,
                        style: AppTheme.normalTextStyle(
                          context,
                          14,
                        ),
                      ),
                      SizedBox(width: deviceWidthSize(context, 5)),
                      InkWell(
                        onTap: () {
                          selectedItems.remove(item);
                          onRemove!(item);
                        },
                        child: Icon(
                          Icons.close,
                          size: deviceWidthSize(context, 16),
                          color: AppTheme.darkBlue,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        )
      ],
    );
  }
}
