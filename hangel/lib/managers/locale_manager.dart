import 'package:shared_preferences/shared_preferences.dart';
import '../constants/preferences_keys.dart';

class LocaleManager {
  static Future prefrencesInit() async {
    instance._preferences ??= await SharedPreferences.getInstance();
  }

  static final LocaleManager _instance = LocaleManager._init();

  static LocaleManager get instance => _instance;

  SharedPreferences? _preferences;

  LocaleManager._init() {
    SharedPreferences.getInstance().then((value) {
      _preferences = value;
    });
  }

  Future<void> setStringValue(PreferencesKeys key, String value) async {
    _preferences ??= await SharedPreferences.getInstance();
    await _preferences?.setString(key.toString(), value);
  }

  Future<void> setBoolValue(PreferencesKeys key, bool value) async {
    _preferences ??= await SharedPreferences.getInstance();
    await _preferences?.setBool(key.toString(), value);
  }

  String getStringValue(PreferencesKeys key) => _preferences?.getString(key.toString()) ?? '';

  bool? getBoolValue(PreferencesKeys key) => _preferences!.getBool(key.toString());

  Future<void> resetAllPrefs() async {
    _preferences!.clear();
  }
}
