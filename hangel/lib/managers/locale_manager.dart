import 'package:hive_flutter/hive_flutter.dart';
import '../constants/preferences_keys.dart';

class LocaleManager {
  static Future prefrencesInit() async {
    await Hive.initFlutter();
    await Hive.openBox("user");
    instance._preferences ??= await Hive.openBox("app");
  }

  static final LocaleManager _instance = LocaleManager._init();

  static LocaleManager get instance => _instance;

  Box? _preferences;

  LocaleManager._init() {
    Hive.openBox("app").then((value) {
      _preferences = value;
    });
  }

  Future<void> setStringValue(PreferencesKeys key, String value) async {
    _preferences ??= await Hive.openBox("app");
    await _preferences?.put(key.toString(), value);
  }

  Future<void> setBoolValue(PreferencesKeys key, bool value) async {
    _preferences ??= await Hive.openBox("app");
    await _preferences?.put(key.toString(), value);
  }

  String getStringValue(PreferencesKeys key) => _preferences?.get(key.toString()) ?? '';

  bool? getBoolValue(PreferencesKeys key) => _preferences!.get(key.toString());

  Future<void> resetAllPrefs() async {
    _preferences!.clear();
    _preferences!.deleteFromDisk();
  }
}
