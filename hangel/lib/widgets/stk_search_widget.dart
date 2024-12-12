import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_typeahead/flutter_typeahead.dart';
import 'package:hangel/extension/string_extension.dart';

import '../constants/app_theme.dart';
import '../constants/size.dart';
import '../models/stk_model.dart';
import '../views/stk_detail_page.dart';
import 'list_item_widget.dart';
import 'locale_text.dart';

class STKSearchWidget extends StatelessWidget {
  final TextEditingController controller;

  STKSearchWidget({Key? key, required this.controller}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TypeAheadField<StkModel>(
      controller: controller,
      itemSeparatorBuilder: (context, index) => Divider(
        color: Colors.grey.shade300,
      ),
      emptyBuilder: (context) => const Text(""),
      errorBuilder: (context, error) => LocaleText("home_page_connection_problem"),
      builder: (context, search, focusNode) {
        return Container(
          alignment: Alignment.center,
          margin: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 10),
          ),
          padding: EdgeInsets.symmetric(
            horizontal: deviceWidthSize(context, 5),
            vertical: deviceHeightSize(context, 4),
          ),
          decoration: BoxDecoration(
            color: AppTheme.white,
            borderRadius: BorderRadius.circular(10),
          ),
          child: TextField(
            focusNode: focusNode,
            controller: search,
            decoration: InputDecoration(
              hintText: "stk_page_search".locale,
              hintStyle: AppTheme.lightTextStyle(context, 14),
              // border: InputBorder.none,
              prefixIcon: Icon(
                Icons.search_rounded,
                color: AppTheme.secondaryColor.withOpacity(0.5),
              ),
              suffixIcon:
                  (search.text.isNotEmpty) ? IconButton(onPressed: search.clear, icon: const Icon(Icons.close)) : null,
            ),
          ),
        );
      },
      
      hideOnEmpty: true,
      suggestionsCallback: (pattern) async {
        if (pattern.isEmpty) {
          return [];
        }
        pattern = pattern.toTitleCaseTR();
        var querySnapshot = await FirebaseFirestore.instance
            .collection('stklar')
            .where('isActive', isEqualTo: true)
            .orderBy('name')
            .startAt([pattern])
            .endAt([pattern + '\uf8ff'])
            .limit(10)
            .get();

        return querySnapshot.docs.map((doc) => StkModel.fromJson(doc.data())).toList();
      },
      itemBuilder: (context, StkModel suggestion) {
        return stkItem(context, suggestion);
      },
      onSelected: (StkModel value) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => STKDetailPage(
              stkModel: value,
            ),
          ),
        );
      },
    );
  }

  Widget stkItem(BuildContext context, StkModel stk) {
    return ListItemWidget(
      context,
      title: stk.name ?? "",
      logo: stk.logo ?? "",
      desc: stk.detailText ?? "",
      logoHeight: deviceHeightSize(context, 60),
      logoWidth: deviceWidthSize(context, 60),
      paddingHorizontal: deviceWidthSize(context, 8),
      paddingVertical: deviceHeightSize(context, 8),
      nullFontSize: 12,
      isActive: stk.isActive,
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) {
              return STKDetailPage(
                stkModel: stk,
              );
            },
          ),
        );
      },
    );
  }
}
