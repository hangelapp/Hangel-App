import 'package:flutter/material.dart';
import '../views/brands_page.dart';
import '../views/favorites_page.dart';
import '../views/home_page.dart';
import '../views/profile_page.dart';
import '../views/stk_page.dart';

class AppViewProvider with ChangeNotifier {
  Widget _selectedWidget = const HomePage();
  Widget get selectedWidget => _selectedWidget;
  set selectedWidget(Widget value) {
    _selectedWidget = value;
    notifyListeners();
  }

  List<Widget> widgetOptions = <Widget>[
    const HomePage(),
    const BrandsPage(),
    const FavoritesPage(),
    const STKPage(),
    const ProfilePage(),
  ];
}
