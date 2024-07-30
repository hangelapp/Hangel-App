import 'package:flutter/material.dart';
import 'package:hangel/constants/size.dart';
import 'package:hangel/helpers/url_launcher_helper.dart';

Widget SocialMediaWidget(BuildContext context) {
  List<Map<String, dynamic>> socialMediaList = [
    {
      "icon": "assets/icons/linkedin.png",
      "url": "https://www.linkedin.com/company/hangelapp/",
    },
    {
      "icon": "assets/icons/instagram.png",
      "url": "https://www.instagram.com/hangelapp/",
    },
    {
      "icon": "assets/icons/twitter.png",
      "url": "https://twitter.com/hangelapp",
    },
    {
      "icon": "assets/icons/youtube.png",
      "url": "https://www.youtube.com/channel/UCZ1Z3Z6Z5X6Z5X6Z5X6Z5X6",
    }
  ];

  return Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: List.generate(
      socialMediaList.length,
      (index) => GestureDetector(
        onTap: () {
          UrlLauncherHelper().launch(socialMediaList[index]["url"]);
        },
        child: Padding(
          padding: EdgeInsets.only(
            right: deviceWidthSize(context, 10),
          ),
          child: Image.asset(
            socialMediaList[index]["icon"],
            width: deviceWidthSize(context, 30),
          ),
        ),
      ),
    ),
  );
}
