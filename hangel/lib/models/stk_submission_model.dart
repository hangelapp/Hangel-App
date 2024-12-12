class STKSubmissionsModel {
  String? id;
  String? stkId;
  String? userId;
  String? type;
  String? content;
  String? status;
  String? response;
  DateTime? createdAt;
  DateTime? updatedAt;

  STKSubmissionsModel({
    this.id,
    this.stkId,
    this.userId,
    this.type,
    this.content,
    this.status,
    this.response,
    this.createdAt,
    this.updatedAt,
  });

  factory STKSubmissionsModel.fromJson(Map<String, dynamic> data) {
    return STKSubmissionsModel(
      id: data['id'],
      stkId: data['stkId'],
      userId: data['userId'],
      type: data['type'],
      content: data['content'],
      status: data['status'],
      response: data['response'],
      createdAt: data['createdAt'] != null ? DateTime.tryParse(data['createdAt']) : null,
      updatedAt: data['updatedAt'] != null ? DateTime.tryParse(data['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'stkId': stkId,
      'userId': userId,
      'type': type,
      'content': content,
      'status': status,
      'response': response,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
