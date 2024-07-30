import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class DateFormatHelper {
  static String getDate(String date, BuildContext context) {
    try {
      return DateFormat('dd MMM yyyy', "tr").format(DateTime.parse(date));
    } catch (e) {
      if (kDebugMode) {
        print(e.toString() + "date format error" + date);
      }
      return "";
    }
  }

  static String getFullDate(String date, BuildContext context) {
    try {
      return DateFormat('dd MMMM yyyy', "tr").format(DateTime.parse(date));
    } catch (e) {
      if (kDebugMode) {
        print(e.toString() + "date format error" + date);
      }
      return "";
    }
  }

  static String getTime(String date, BuildContext context) {
    try {
      return DateFormat('HH:mm', "tr").format(DateTime.parse(date));
    } catch (e) {
      if (kDebugMode) {
        print(e.toString() + "date format error" + date);
      }
      return "";
    }
  }

  static String getFullTime(String date, BuildContext context) {
    try {
      return DateFormat('HH:mm:ss', "tr").format(DateTime.parse(date));
    } catch (e) {
      if (kDebugMode) {
        print(e.toString() + "date format error" + date);
      }
      return "";
    }
  }

  static String getDateAndTime(String date, BuildContext context) {
    try {
      return DateFormat('dd MMM HH:mm', "tr").format(DateTime.parse(date));
    } catch (e) {
      if (kDebugMode) {
        print(e.toString() + "date format error" + date);
      }
      return "";
    }
  }

  static String getDayandMonth(String date, BuildContext context) {
    try {
      return DateFormat('dd MMM', "tr").format(DateTime.parse(date));
    } catch (e) {
      if (kDebugMode) {
        print(e.toString() + "date format error" + date);
      }
      return "";
    }
  }

  static String getDayandFullMonth(String date, BuildContext context) {
    try {
      return DateFormat('dd MMMM', "tr").format(DateTime.parse(date));
    } catch (e) {
      if (kDebugMode) {
        print(e.toString() + "date format error" + date);
      }
      return "";
    }
  }
}
