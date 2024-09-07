import 'package:firebase_auth/firebase_auth.dart';

class FirebaseAuthServices {
  final _firebaseAuth = FirebaseAuth.instance;

  // FirebaseAuthServices() {
  //   if (kIsWeb) {
  //     FirebaseAuth.instance.setSettings(appVerificationDisabledForTesting: true);
  //   }
  // }

  Future<User> verifyPhoneNumber(String verificationId, String smsCode) async {
    final AuthCredential credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );
    final UserCredential userCredential = await _firebaseAuth.signInWithCredential(credential);
    return userCredential.user!;
  }
}
