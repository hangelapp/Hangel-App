import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_typeahead/flutter_typeahead.dart';
import 'package:hangel/extension/string_extension.dart';

import '../constants/app_theme.dart';
import '../constants/size.dart';
import '../models/stk_model.dart';
import '../widgets/locale_text.dart';

class STKFavoriteSearchWidget extends StatelessWidget {
  final TextEditingController controller;
  final List<String> selectedStkIdList;
  final Function(String stkId, bool isSelected) onSelectionChanged;

  const STKFavoriteSearchWidget({
    super.key,
    required this.controller,
    required this.selectedStkIdList,
    required this.onSelectionChanged,
  });

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
        return ListTile(
          leading: suggestion.logo != null
              ? Image.network(
                  suggestion.logo ?? '',
                  width: deviceWidthSize(context, 50),
                  height: deviceWidthSize(context, 50),
                )
              : Container(
                  width: deviceWidthSize(context, 50),
                  height: deviceWidthSize(context, 50),
                  color: Colors.grey,
                ),
          title: Text(suggestion.name ?? ''),
          trailing: Checkbox(
            value: selectedStkIdList.contains(suggestion.id.toString()),
            activeColor: AppTheme.primaryColor,
            onChanged: (value) {
              onSelectionChanged(suggestion.id.toString(), value!);
            },
          ),
          onTap: () {
            // Optional: handle tap if needed
          },
        );
      },
      onSelected: (StkModel suggestion) {
        // No action needed here as we're handling selection via checkbox
      },
    );
  }
}
