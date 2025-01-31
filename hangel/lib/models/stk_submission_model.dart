class STKSubmissionsModel {
  String? id;
  String? stkId;
  String? userId;
  String? type;
  String? content;
  String? status;
  List<String>? messages;
  DateTime? createdAt;
  DateTime? updatedAt;

  STKSubmissionsModel({
    this.id,
    this.stkId,
    this.userId,
    this.type,
    this.content,
    this.status,
    this.messages,
    this.createdAt,
    this.updatedAt,
  });

  factory STKSubmissionsModel.fromJson(Map<String, dynamic> data) {
    List<String> safeStringList(dynamic data) {
      if (data == null) return [];
      // data'nın Liste olup olmadığını kontrol edelim
      if (data is List) {
        // Liste içindeki null değerleri filtreleyip string'e çeviriyoruz
        return data
            .where((element) => element != null) // null değerleri at
            .map((element) => element.toString()) // hepsini stringe çevir
            .toList();
      }
      return [];
    }

    return STKSubmissionsModel(
      id: data['id'],
      stkId: data['stkId'],
      userId: data['userId'],
      type: data['type'],
      content: data['content'],
      status: data['status'],
      messages: safeStringList(data['messages']),
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
      'messages': messages,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
