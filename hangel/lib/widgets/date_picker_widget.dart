import 'package:flutter/material.dart';
import 'package:flutter_holo_date_picker/date_picker.dart';
import 'package:flutter_holo_date_picker/flutter_holo_date_picker.dart';
import 'package:hangel/helpers/hive_helpers.dart';
import 'package:hangel/providers/login_register_page_provider.dart';
import '/constants/app_theme.dart';
import '/constants/size.dart';

import 'package:provider/provider.dart';

class DatePickerWidget extends StatefulWidget {
  const DatePickerWidget({
    Key? key,
    required this.title,
    this.isRequired = false,
    this.isTime = false,
    this.id = 0,
  }) : super(key: key);
  final String title;
  final bool isRequired;
  final bool isTime;

  final int id;
  @override
  State<DatePickerWidget> createState() => _DatePickerWidgetState();
}

class _DatePickerWidgetState extends State<DatePickerWidget> {
  // DateTime? selectedDate;
  final user = HiveHelpers.getUserFromHive();
  DateTime? correctDateTime = HiveHelpers.getUserFromHive().birthDate;

  @override
  Widget build(BuildContext context) {
    // selectedDate = context.watch<LoginRegisterPageProvider>().selectedDate[widget.id.toString()]!;
    correctDateTime = context.watch<LoginRegisterPageProvider>().correctDateTime;
    return Column(
      children: [
        Row(
          children: [
            Text(
              widget.title,
              style: AppTheme.semiBoldTextStyle(context, 16),
            ),
            if (widget.isRequired)
              Text(
                " *",
                style: AppTheme.semiBoldTextStyle(context, 16, color: AppTheme.red),
              ),
          ],
        ),
        SizedBox(height: deviceHeightSize(context, 10)),
        Row(
          children: [
            Expanded(
              flex: 2,
              child: InkWell(
                onTap: () {
                  _selectDate(context);
                },
                child: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: deviceWidthSize(context, 16),
                    vertical: deviceHeightSize(context, 16),
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: AppTheme.darkBlue.withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        // selectedDate != null ? "${selectedDate?.toLocal()}".split(' ')[0] : "",
                        correctDateTime != null
                            ? "${correctDateTime?.toLocal()}".split(' ')[0]
                            : user.birthDate != null
                                ? "${user.birthDate?.toLocal()}".split(' ')[0]
                                : "Doğum Tarihi",
                        style: AppTheme.normalTextStyle(context, 16),
                      ),
                      const Icon(Icons.calendar_today, color: AppTheme.darkBlue),
                    ],
                  ),
                ),
              ),
            ),
            if (widget.isTime) SizedBox(width: deviceWidthSize(context, 10)),
          ],
        ),
        SizedBox(height: deviceHeightSize(context, 16)),
      ],
    );
  }

  void _selectDate(BuildContext context) async {
    await DatePicker.showSimpleDatePicker(
      context,
      initialDate: correctDateTime ?? user.birthDate ?? DateTime.now().subtract(const Duration(days: 365 * 15)),
      firstDate: DateTime(1900),
      titleText: "Doğum Tarihi Gir",
      confirmText: "Seç",
      cancelText: "İptal",
      lastDate: DateTime(2050),
      dateFormat: "dd-MMMM-yyyy",
      locale: DateTimePickerLocale.tr,
      looping: true,
    ).then(
      (value) {
        context.read<LoginRegisterPageProvider>().correctDateTime = value;
        setState(() {});
        // if (value != null) {
        // setState(() {
        //   selectedDate =
        //       DateTime(value.year, value.month, value.day, selectedDate?.hour ?? 0, selectedDate?.minute ?? 0);
        // });
        // context.read<LoginRegisterPageProvider>().addSelectedDate(value, widget.id);
        // }
      },
    );
  }
}
