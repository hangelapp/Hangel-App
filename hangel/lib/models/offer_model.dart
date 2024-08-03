class OfferModel {
  String? id;
  String? name;
  String? description;
  String? requireApproval;
  int? requireTermsAndConditions;
  String? termsAndConditions;
  String? previewUrl;
  String? currency;
  String? defaultPayout;
  String? protocol;
  String? status;
  String? expirationDate;
  String? payoutType;
  String? percentPayout;
  String? featured;
  String? allowMultipleConversions;
  String? allowWebsiteLinks;
  String? allowDirectLinks;
  String? showCustomVariables;
  String? sessionHours;
  String? showMailList;
  String? dneListId;
  String? emailInstructions;
  String? emailInstructionsFrom;
  String? emailInstructionsSubject;
  String? enforceSecureTrackingLink;
  String? hasGoalsEnabled;
  String? defaultGoalName;
  int? modified;
  String? useTargetRules;
  String? usePayoutGroups;
  String? linkPlatform;
  String? isExpired;
  String? dneDownloadUrl;
  String? dneUnsubscribeUrl;
  bool? dneThirdPartyList;
  String? approvalStatus;

  OfferModel({
    this.id,
    this.name,
    this.description,
    this.requireApproval,
    this.requireTermsAndConditions,
    this.termsAndConditions,
    this.previewUrl,
    this.currency,
    this.defaultPayout,
    this.protocol,
    this.status,
    this.expirationDate,
    this.payoutType,
    this.percentPayout,
    this.featured,
    this.allowMultipleConversions,
    this.allowWebsiteLinks,
    this.allowDirectLinks,
    this.showCustomVariables,
    this.sessionHours,
    this.showMailList,
    this.dneListId,
    this.emailInstructions,
    this.emailInstructionsFrom,
    this.emailInstructionsSubject,
    this.enforceSecureTrackingLink,
    this.hasGoalsEnabled,
    this.defaultGoalName,
    this.modified,
    this.useTargetRules,
    this.usePayoutGroups,
    this.linkPlatform,
    this.isExpired,
    this.dneDownloadUrl,
    this.dneUnsubscribeUrl,
    this.dneThirdPartyList,
    this.approvalStatus,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'require_approval': requireApproval,
      'require_terms_and_conditions': requireTermsAndConditions,
      'terms_and_conditions': termsAndConditions,
      'preview_url': previewUrl,
      'currency': currency,
      'default_payout': defaultPayout,
      'protocol': protocol,
      'status': status,
      'expiration_date': expirationDate,
      'payout_type': payoutType,
      'percent_payout': percentPayout,
      'featured': featured,
      'allow_multiple_conversions': allowMultipleConversions,
      'allow_website_links': allowWebsiteLinks,
      'allow_direct_links': allowDirectLinks,
      'show_custom_variables': showCustomVariables,
      'session_hours': sessionHours,
      'show_mail_list': showMailList,
      'dne_list_id': dneListId,
      'email_instructions': emailInstructions,
      'email_instructions_from': emailInstructionsFrom,
      'email_instructions_subject': emailInstructionsSubject,
      'enforce_secure_tracking_link': enforceSecureTrackingLink,
      'has_goals_enabled': hasGoalsEnabled,
      'default_goal_name': defaultGoalName,
      'modified': modified,
      'use_target_rules': useTargetRules,
      'use_payout_groups': usePayoutGroups,
      'link_platform': linkPlatform,
      'is_expired': isExpired,
      'dne_download_url': dneDownloadUrl,
      'dne_unsubscribe_url': dneUnsubscribeUrl,
      'dne_third_party_list': dneThirdPartyList,
      'approval_status': approvalStatus,
    };
  }

  factory OfferModel.fromJson(Map<String, dynamic> json) {
    return OfferModel(
      id: json['id'] as String?,
      name: json['name'] as String?,
      description: json['description'] as String?,
      requireApproval: json['require_approval'] as String?,
      requireTermsAndConditions: json['require_terms_and_conditions'] as int?,
      termsAndConditions: json['terms_and_conditions'] as String?,
      previewUrl: json['preview_url'] as String?,
      currency: json['currency'] as String?,
      defaultPayout: json['default_payout'] as String?,
      protocol: json['protocol'] as String?,
      status: json['status'] as String?,
      expirationDate: json['expiration_date'] as String?,
      payoutType: json['payout_type'] as String?,
      percentPayout: json['percent_payout'] as String?,
      featured: json['featured'] as String?,
      allowMultipleConversions: json['allow_multiple_conversions'] as String?,
      allowWebsiteLinks: json['allow_website_links'] as String?,
      allowDirectLinks: json['allow_direct_links'] as String?,
      showCustomVariables: json['show_custom_variables'] as String?,
      sessionHours: json['session_hours'] as String?,
      showMailList: json['show_mail_list'] as String?,
      dneListId: json['dne_list_id'] as String?,
      emailInstructions: json['email_instructions'] as String?,
      emailInstructionsFrom: json['email_instructions_from'] as String?,
      emailInstructionsSubject: json['email_instructions_subject'] as String?,
      enforceSecureTrackingLink: json['enforce_secure_tracking_link'] as String?,
      hasGoalsEnabled: json['has_goals_enabled'] as String?,
      defaultGoalName: json['default_goal_name'] as String?,
      modified: json['modified'] as int?,
      useTargetRules: json['use_target_rules'] as String?,
      usePayoutGroups: json['use_payout_groups'] as String?,
      linkPlatform: json['link_platform'] as String?,
      isExpired: json['is_expired'] as String?,
      dneDownloadUrl: json['dne_download_url'] as String?,
      dneUnsubscribeUrl: json['dne_unsubscribe_url'] as String?,
      dneThirdPartyList: json['dne_third_party_list'] as bool?,
      approvalStatus: json['approval_status'] as String?,
    );
  }
}
