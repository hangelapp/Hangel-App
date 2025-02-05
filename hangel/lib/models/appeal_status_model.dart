import 'package:cloud_firestore/cloud_firestore.dart';

class AppealStatusModel {
  String? appealName;
  String? appealType;
  String? appealStatus;
  DateTime? appealTime;

  AppealStatusModel({this.appealName, this.appealType, this.appealStatus, this.appealTime});

  factory AppealStatusModel.fromJson(Map<String, dynamic> json) {
    return AppealStatusModel(
      appealName: json['appealName'] as String?,
      appealType: json['appealType'] as String?,
      appealStatus: json['appealStatus'] as String?,
      appealTime: (json['applicantTime'] as Timestamp?)?.toDate(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'appealName': appealName,
      'appealType': appealType,
      'appealStatus': appealStatus,
      'appealTime': appealTime != null ? Timestamp.fromDate(appealTime!) : null,
    };
  }
}
