class STKFormModel {
  // Ortak alanlar
  String? type;
  String? iban;
  String? website;
  String? description;
  String? email;
  String? phone;
  String? city;
  String? district;
  String? neighborhood;
  String? address;
  List<String>? beneficiaries;
  List<String>? unSdgs;
  String? applicantName;
  String? applicantPhone;
  String? applicantEmail;
  String? applicantPosition; // Özel izin ile yardım toplayan dışındaki türler için
  String? applicantRelation; // Özel izin ile yardım toplayan türü için

  // Diğer türler için alanlar (Dernek, Vakıf, Spor Kulübü)
  String? idNo;
  String? taxNumber;
  String? taxOffice;
  String? shortName;
  String? fullName;
  String? establishmentYear;
  String? logoImage; // Firebase URL'si
  String? statuteFileUrl; // Firebase URL'si
  String? activityCertificateFileUrl; // Firebase URL'si
  String? activityArea;

  // Özel izin ile yardım toplayan türü için alanlar
  String? permissionStartDate;
  String? permissionEndDate;
  String? permissionGrantingGovernorate;
  String? activityNumber;
  String? campaignName;
  String? birthDate;
  String? photoImageUrl; // Firebase URL'si
  String? permissionPurpose;
  String? governoratePermissionDocumentUrl; // Firebase URL'si
  String? stkIlMudurluguYetkiBelgesiUrl; // Firebase URL'si

  STKFormModel({
    this.type,
    this.iban,
    this.website,
    this.description,
    this.email,
    this.phone,
    this.city,
    this.district,
    this.neighborhood,
    this.address,
    this.beneficiaries,
    this.unSdgs,
    this.applicantName,
    this.applicantPhone,
    this.applicantEmail,
    this.applicantPosition,
    this.applicantRelation,
    this.idNo,
    this.taxNumber,
    this.taxOffice,
    this.shortName,
    this.fullName,
    this.establishmentYear,
    this.logoImage,
    this.statuteFileUrl,
    this.activityCertificateFileUrl,
    this.activityArea,
    this.permissionStartDate,
    this.permissionEndDate,
    this.permissionGrantingGovernorate,
    this.activityNumber,
    this.campaignName,
    this.birthDate,
    this.photoImageUrl,
    this.permissionPurpose,
    this.governoratePermissionDocumentUrl,
    this.stkIlMudurluguYetkiBelgesiUrl,
  });

  factory STKFormModel.fromJson(Map<String, dynamic> json) {
    return STKFormModel(
      type: json['type'] as String?,
      iban: json['iban'] as String?,
      website: json['website'] as String?,
      description: json['description'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      city: json['city'] as String?,
      district: json['district'] as String?,
      neighborhood: json['neighborhood'] as String?,
      address: json['address'] as String?,
      beneficiaries: (json['beneficiaries'] as List<dynamic>?)?.map((e) => e as String).toList(),
      unSdgs: (json['unSdgs'] as List<dynamic>?)?.map((e) => e as String).toList(),
      applicantName: json['applicantName'] as String?,
      applicantPhone: json['applicantPhone'] as String?,
      applicantEmail: json['applicantEmail'] as String?,
      applicantPosition: json['applicantPosition'] as String?,
      applicantRelation: json['applicantRelation'] as String?,
      idNo: json['idNo'] as String?,
      taxNumber: json['taxNumber'] as String?,
      taxOffice: json['taxOffice'] as String?,
      shortName: json['shortName'] as String?,
      fullName: json['fullName'] as String?,
      establishmentYear: json['establishmentYear'] as String?,
      logoImage: json['logoImage'] as String?,
      statuteFileUrl: json['statuteFileUrl'] as String?,
      activityCertificateFileUrl: json['activityCertificateFileUrl'] as String?,
      activityArea: json['activityArea'] as String?,
      permissionStartDate: json['permissionStartDate'] as String?,
      permissionEndDate: json['permissionEndDate'] as String?,
      permissionGrantingGovernorate: json['permissionGrantingGovernorate'] as String?,
      activityNumber: json['activityNumber'] as String?,
      campaignName: json['campaignName'] as String?,
      birthDate: json['birthDate'] as String?,
      photoImageUrl: json['photoImageUrl'] as String?,
      permissionPurpose: json['permissionPurpose'] as String?,
      governoratePermissionDocumentUrl: json['governoratePermissionDocumentUrl'] as String?,
      stkIlMudurluguYetkiBelgesiUrl: json['stkIlMudurluguYetkiBelgesiUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'iban': iban,
      'website': website,
      'description': description,
      'email': email,
      'phone': phone,
      'city': city,
      'district': district,
      'neighborhood': neighborhood,
      'address': address,
      'beneficiaries': beneficiaries,
      'unSdgs': unSdgs,
      'applicantName': applicantName,
      'applicantPhone': applicantPhone,
      'applicantEmail': applicantEmail,
      'applicantPosition': applicantPosition,
      'applicantRelation': applicantRelation,
      'idNo': idNo,
      'taxNumber': taxNumber,
      'taxOffice': taxOffice,
      'shortName': shortName,
      'fullName': fullName,
      'establishmentYear': establishmentYear,
      'logoImage': logoImage,
      'statuteFileUrl': statuteFileUrl,
      'activityCertificateFileUrl': activityCertificateFileUrl,
      'activityArea': activityArea,
      'permissionStartDate': permissionStartDate,
      'permissionEndDate': permissionEndDate,
      'permissionGrantingGovernorate': permissionGrantingGovernorate,
      'activityNumber': activityNumber,
      'campaignName': campaignName,
      'birthDate': birthDate,
      'photoImageUrl': photoImageUrl,
      'permissionPurpose': permissionPurpose,
      'governoratePermissionDocumentUrl': governoratePermissionDocumentUrl,
      'stkIlMudurluguYetkiBelgesiUrl': stkIlMudurluguYetkiBelgesiUrl,
    };
  }

  // Mail için HTML tablo formatı
  String toHTMLTable() {
    String beneficiariesStr = beneficiaries != null ? beneficiaries!.join(', ') : '-';
    String unSdgsStr = unSdgs != null ? unSdgs!.join(', ') : '-';

    StringBuffer html = StringBuffer();
    html.writeln("<table>");

    html.writeln("<tr><td><strong>Tür</strong></td><td>${type ?? '-'}</td></tr>");
    html.writeln("<tr><td><strong>IBAN</strong></td><td>${iban ?? '-'}</td></tr>");
    html.writeln("<tr><td><strong>Web Sitesi</strong></td><td>${website ?? '-'}</td></tr>");
    html.writeln("<tr><td><strong>Acıklama</strong></td><td>${description ?? '-'}</td></tr>");
    html.writeln("<tr><td><strong>Email</strong></td><td>${email ?? '-'}</td></tr>");
    html.writeln("<tr><td><strong>Telefon</strong></td><td>${phone ?? '-'}</td></tr>");
    html.writeln("<tr><td><strong>Şehir</strong></td><td>${city ?? '-'}</td></tr>");
    html.writeln("<tr><td><strong>İlçe</strong></td><td>${district ?? '-'}</td></tr>");
    html.writeln("<tr><td><strong>Mahalle</strong></td><td>${neighborhood ?? '-'}</td></tr>");
    html.writeln("<tr><td><strong>Adres</strong></td><td>${address ?? '-'}</td></tr>");
    html.writeln("<tr><td><strong>Faydalanıcılar</strong></td><td>$beneficiariesStr</td></tr>");
    html.writeln("<tr><td><strong>BM Sürdürülebilir Kalkınma Amaçları</strong></td><td>$unSdgsStr</td></tr>");
    html.writeln("<tr><td><strong>Başvuruyu Yapan Kişinin Adı</strong></td><td>${applicantName ?? '-'}</td></tr>");
    html.writeln(
        "<tr><td><strong>Başvuruyu Yapan Kişinin Telefonu</strong></td><td>${applicantPhone ?? '-'}</td></tr>");
    html.writeln("<tr><td><strong>Başvuruyu Yapan Kişinin Emaili</strong></td><td>${applicantEmail ?? '-'}</td></tr>");

    if (applicantPosition != null) {
      html.writeln("<tr><td><strong>Başvuruyu Yapan Kişinin Görevi</strong></td><td>$applicantPosition</td></tr>");
    }

    if (applicantRelation != null) {
      html.writeln(
          "<tr><td><strong>Başvuruyu Yapan Kişinin Yakınlık Derecesi</strong></td><td>$applicantRelation</td></tr>");
    }

    if (type != 'stk_form_type_special_permission') {
      // Diğer türler için alanlar
      html.writeln("<tr><td><strong>ID No</strong></td><td>${idNo ?? '-'}</td></tr>");
      html.writeln("<tr><td><strong>Vergi No</strong></td><td>${taxNumber ?? '-'}</td></tr>");
      html.writeln("<tr><td><strong>Vergi Dairesi</strong></td><td>${taxOffice ?? '-'}</td></tr>");
      html.writeln("<tr><td><strong>Kısa Adı</strong></td><td>${shortName ?? '-'}</td></tr>");
      html.writeln("<tr><td><strong>Tam Adı</strong></td><td>${fullName ?? '-'}</td></tr>");
      html.writeln("<tr><td><strong>Kuruluş Yılı</strong></td><td>${establishmentYear ?? '-'}</td></tr>");
      html.writeln("<tr><td><strong>Faaliyet Alanı</strong></td><td>${activityArea ?? '-'}</td></tr>");
    } else {
      // Özel izin ile yardım toplayan türü için alanlar
      html.writeln("<tr><td><strong>İzin Başlama Tarihi</strong></td><td>${permissionStartDate ?? '-'}</td></tr>");
      html.writeln("<tr><td><strong>İzin Bitiş Tarihi</strong></td><td>${permissionEndDate ?? '-'}</td></tr>");
      html.writeln(
          "<tr><td><strong>İzni Veren Valilik</strong></td><td>${permissionGrantingGovernorate ?? '-'}</td></tr>");
      html.writeln("<tr><td><strong>Faaliyet No</strong></td><td>${activityNumber ?? '-'}</td></tr>");
      html.writeln("<tr><td><strong>Kampanyanın Adı</strong></td><td>${campaignName ?? '-'}</td></tr>");
      html.writeln("<tr><td><strong>Doğum Tarihi</strong></td><td>${birthDate ?? '-'}</td></tr>");
      html.writeln("<tr><td><strong>İznin Amacı</strong></td><td>${permissionPurpose ?? '-'}</td></tr>");
    }

    // Dosya ve resim URL'lerini ekleyebilirsiniz
    html.writeln("<tr><td><strong>Logo Resmi URL</strong></td><td>${logoImage ?? '-'}</td></tr>");
    html.writeln("<tr><td><strong>Fotoğraf URL'si</strong></td><td>${photoImageUrl ?? '-'}</td></tr>");
    // Diğer dosya ve resim URL'lerini de ekleyebilirsiniz

    html.writeln("</table>");
    return html.toString();
  }
}
