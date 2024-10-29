import 'package:flutter/material.dart';
import 'package:hangel/extension/string_extension.dart';
import 'package:hangel/widgets/app_bar_widget.dart';

import '../constants/app_theme.dart';
import '../constants/size.dart';

class FrequentlyAskedQuestionsPage extends StatefulWidget {
  const FrequentlyAskedQuestionsPage({Key? key}) : super(key: key);
  static const routeName = '/frequently-asked-questions';

  @override
  State<FrequentlyAskedQuestionsPage> createState() => _FrequentlyAskedQuestionsPageState();
}

class _FrequentlyAskedQuestionsPageState extends State<FrequentlyAskedQuestionsPage> {
  int selectedIndex = -1;
  List<SSSModel> sssList = [
    SSSModel(baslik: "faq_question_1_title".locale, tanim: "faq_question_1_description".locale),
    SSSModel(baslik: "faq_question_2_title".locale, tanim: "faq_question_2_description".locale),
    SSSModel(baslik: "faq_question_3_title".locale, tanim: "faq_question_3_description".locale),
    SSSModel(baslik: "faq_question_4_title".locale, tanim: "faq_question_4_description".locale),
    SSSModel(baslik: "faq_question_5_title".locale, tanim: "faq_question_5_description".locale),
    SSSModel(baslik: "faq_question_6_title".locale, tanim: "faq_question_6_description".locale),
    SSSModel(baslik: "faq_question_7_title".locale, tanim: "faq_question_7_description".locale),
    SSSModel(baslik: "faq_question_8_title".locale, tanim: "faq_question_8_description".locale),
    SSSModel(baslik: "faq_question_9_title".locale, tanim: "faq_question_9_description".locale),
    SSSModel(baslik: "faq_question_10_title".locale, tanim: "faq_question_10_description".locale),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.white,
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(80),
        child: AppBarWidget(
          title: "faq_page_title".locale,
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            ...List.generate(
              sssList.length,
              (index) => sssListItemWidget(context, index),
            ),
          ],
        ),
      ),
    );
  }

  Widget sssListItemWidget(BuildContext context, int index) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 900),
      width: deviceWidth(context),
      margin: EdgeInsets.symmetric(
        horizontal: deviceWidthSize(context, 20),
        vertical: deviceHeightSize(context, 5),
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: AppTheme.black.withOpacity(0.05),
            blurRadius: 44,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: () {
              setState(() {
                if (selectedIndex == index) {
                  selectedIndex = -1;
                } else {
                  selectedIndex = index;
                }
              });
            },
            child: Container(
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(15), boxShadow: [
                BoxShadow(
                  color: AppTheme.black.withOpacity(index == selectedIndex ? 0.1 : 0),
                  blurRadius: 44,
                  offset: const Offset(0, 4),
                ),
              ]),
              padding: EdgeInsets.symmetric(horizontal: deviceHeightSize(context, 20)).copyWith(
                  top: deviceHeightSize(context, 20),
                  bottom: deviceHeightSize(context, index == selectedIndex ? 10 : 0)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  SizedBox(
                    width: deviceWidthSize(context, 270),
                    child: Text(
                      sssList[index].baslik!,
                      style: AppTheme.boldTextStyle(context, 15),
                    ),
                  ),
                  Icon(
                    index == selectedIndex ? Icons.remove_circle : Icons.add_circle,
                    color: AppTheme.primaryColor,
                    size: deviceWidthSize(context, 20),
                  ),
                ],
              ),
            ),
          ),
          AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
            padding: EdgeInsets.symmetric(
              horizontal: deviceWidthSize(context, 20),
              vertical: deviceHeightSize(context, index == selectedIndex ? 10 : 5),
            ),
            child: Text(
              sssList[index].tanim ?? "",
              maxLines: index == selectedIndex ? 100 : 2,
              overflow: TextOverflow.ellipsis,
              style: AppTheme.normalTextStyle(context, 13).copyWith(
                color: AppTheme.black.withOpacity(0.6),
                fontWeight: FontWeight.w300,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SSSModel {
  String? baslik;
  String? tanim;
  SSSModel({this.baslik, this.tanim});
}
