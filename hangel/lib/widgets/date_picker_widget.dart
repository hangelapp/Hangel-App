import 'package:flutter/material.dart';
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
  DateTime selectedDate = DateTime.now();
  @override
  Widget build(BuildContext context) {
    selectedDate = context
        .watch<LoginRegisterPageProvider>()
        .selectedDate[widget.id.toString()]!;
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
                style: AppTheme.semiBoldTextStyle(context, 16,
                    color: AppTheme.red),
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
                        "${selectedDate.toLocal()}".split(' ')[0],
                        style: AppTheme.normalTextStyle(context, 16),
                      ),
                      const Icon(Icons.calendar_today,
                          color: AppTheme.darkBlue),
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

  void _selectDate(BuildContext context) {
    showDatePicker(
      context: context,
      initialDate: selectedDate,
      firstDate: DateTime(1900),
      lastDate: DateTime(2050),
      builder: (BuildContext context, Widget? child) {
        return Theme(
          data: ThemeData.light().copyWith(
            dialogBackgroundColor: AppTheme.white,
          ),
          child: child!,
        );
      },
    ).then((value) {
      if (value != null) {
        setState(() {
          selectedDate = DateTime(value.year, value.month, value.day,
              selectedDate.hour, selectedDate.minute);
        });
        context
            .read<LoginRegisterPageProvider>()
            .addSelectedDate(selectedDate, widget.id);
      }
    });
  }
}
