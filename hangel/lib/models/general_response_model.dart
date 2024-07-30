class GeneralResponseModel {
  final bool? success;
  final String? message;
  final dynamic data;

  GeneralResponseModel({this.success, this.message, this.data});

  factory GeneralResponseModel.fromJson(Map<String, dynamic> json) {
    return GeneralResponseModel(
      success: json['success'],
      message: json['message'],
      data: json['data'],
    );
  }
}
