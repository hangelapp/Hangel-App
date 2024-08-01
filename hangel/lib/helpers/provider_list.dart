import 'package:flutter/material.dart';
import 'package:hangel/providers/app_view_provider.dart';
import 'package:hangel/providers/brand_provider.dart';
import 'package:hangel/providers/profile_page_provider.dart';
import 'package:hangel/providers/stk_provider.dart';
import 'package:provider/provider.dart';
import 'package:provider/single_child_widget.dart';
import '../providers/login_register_page_provider.dart';

List<SingleChildWidget> providers = [
  ChangeNotifierProvider<LoginRegisterPageProvider>(create: (BuildContext context) => LoginRegisterPageProvider()),
  ChangeNotifierProvider<STKProvider>(create: (BuildContext context) => STKProvider()),
  ChangeNotifierProvider<BrandProvider>(create: (BuildContext context) => BrandProvider()),
  ChangeNotifierProvider<ProfilePageProvider>(create: (BuildContext context) => ProfilePageProvider()),
  ChangeNotifierProvider<AppViewProvider>(create: (BuildContext context) => AppViewProvider())
];
