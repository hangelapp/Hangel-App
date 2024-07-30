import 'package:hangel/controllers/brand_controller.dart';
import 'package:hangel/controllers/profile_page_controller.dart';
import 'package:hangel/controllers/stk_controller.dart';
import 'package:hangel/services/firestore_services.dart';

import '../services/firebase_auth_services.dart';
import '../services/storage_service.dart';
import 'package:get_it/get_it.dart';

import '../controllers/login_register_page_controller.dart';

GetIt locator = GetIt.instance;

void setupLocator() {
  locator.registerLazySingleton(() => LoginRegisterPageController());
  locator.registerLazySingleton(() => FirebaseAuthServices());
  locator.registerLazySingleton(() => StorageServices());
  locator.registerLazySingleton(() => FirestoreServices());
  locator.registerLazySingleton(() => STKController());
  locator.registerLazySingleton(() => BrandController());
  locator.registerLazySingleton(() => ProfilePageController());
}
