import 'package:flutter/material.dart';
import '../views/stk_volunteers_page.dart';
import '../views/favorites_page.dart';
import '../views/home_page.dart';
import '../views/profile_page.dart';
import '../views/stk_page.dart';

class AppViewProvider with ChangeNotifier {
  Widget? _selectedWidget;
  Widget get selectedWidget => _selectedWidget ?? ErrorWidget(Exception("Sayfayı yenileyin..."));
  set selectedWidget(Widget value) {
    if (value == selectedWidget) return;
    _selectedWidget = value;
    notifyListeners();
  }

  List<Widget> widgetOptions = <Widget>[
    const HomePage(),
    const STKVolunteersPage(),
    const FavoritesPage(),
    const STKPage(),
    const ProfilePage(),
  ];
}
