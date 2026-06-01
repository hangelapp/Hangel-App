// HangelAppleSignInPlugin — Sign in with Apple native bridge.
//
// Capacitor 8.x'te @capacitor-community/apple-sign-in plugin'i kırık (peer
// dependency capacitor-swift-pm 7.x). Bunun yerine native ASAuthorization
// API'sini doğrudan kullanan kendi plugin'imizi yazıyoruz.
//
// Web tarafından `HangelAppleSignIn.signIn()` çağrısıyla tetiklenir; iOS
// system Sign in with Apple sheet'i açılır. Başarıyla tamamlanırsa kullanıcıya
// identity token + user info döner. Identity token backend'te Firebase Auth
// `signInWithCredential` için kullanılır.
//
// Plugin Capacitor 8 çağrı sözleşmesine göre yazılmıştır.

import Foundation
import Capacitor
import AuthenticationServices

@objc(HangelAppleSignInPlugin)
public class HangelAppleSignInPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HangelAppleSignInPlugin"
    public let jsName = "HangelAppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCredentialState", returnType: CAPPluginReturnPromise),
    ]

    private var pendingCall: CAPPluginCall?
    private var authController: ASAuthorizationController?

    @objc func signIn(_ call: CAPPluginCall) {
        // Save call reference for async delegate callback
        self.pendingCall = call

        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        request.requestedScopes = [.fullName, .email]

        // Optional nonce param (for replay protection)
        if let nonce = call.getString("nonce") {
            request.nonce = sha256(nonce)
        }

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        controller.performRequests()
        self.authController = controller
    }

    @objc func getCredentialState(_ call: CAPPluginCall) {
        guard let userId = call.getString("userId") else {
            call.reject("userId required")
            return
        }
        let provider = ASAuthorizationAppleIDProvider()
        provider.getCredentialState(forUserID: userId) { state, error in
            if let error = error {
                call.reject("getCredentialState failed: \(error.localizedDescription)")
                return
            }
            let stateStr: String
            switch state {
            case .authorized: stateStr = "authorized"
            case .revoked: stateStr = "revoked"
            case .notFound: stateStr = "notFound"
            case .transferred: stateStr = "transferred"
            @unknown default: stateStr = "unknown"
            }
            call.resolve(["state": stateStr])
        }
    }

    private func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        var hash = [UInt8](repeating: 0, count: 32)
        data.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
        }
        return hash.map { String(format: "%02x", $0) }.joined()
    }
}

extension HangelAppleSignInPlugin: ASAuthorizationControllerDelegate {
    public func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let call = self.pendingCall else { return }
        self.pendingCall = nil

        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            call.reject("Unexpected credential type")
            return
        }

        var result: [String: Any] = [
            "user": credential.user,
        ]
        if let idToken = credential.identityToken,
           let tokenStr = String(data: idToken, encoding: .utf8) {
            result["identityToken"] = tokenStr
        }
        if let authCode = credential.authorizationCode,
           let codeStr = String(data: authCode, encoding: .utf8) {
            result["authorizationCode"] = codeStr
        }
        if let email = credential.email {
            result["email"] = email
        }
        if let fullName = credential.fullName {
            var nameMap: [String: String] = [:]
            if let given = fullName.givenName { nameMap["givenName"] = given }
            if let family = fullName.familyName { nameMap["familyName"] = family }
            if !nameMap.isEmpty {
                result["fullName"] = nameMap
            }
        }
        call.resolve(result)
    }

    public func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithError error: Error) {
        guard let call = self.pendingCall else { return }
        self.pendingCall = nil

        let nsErr = error as NSError
        // ASAuthorizationError.canceled = 1001
        if nsErr.code == ASAuthorizationError.canceled.rawValue {
            call.reject("Apple Sign In cancelled by user", "APPLE_CANCELLED")
            return
        }
        call.reject("Apple Sign In failed: \(error.localizedDescription)")
    }
}

extension HangelAppleSignInPlugin: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first(where: { $0.isKeyWindow }) ?? scene.windows.first else {
            return ASPresentationAnchor()
        }
        return window
    }
}

// CommonCrypto for SHA256 (no need to import — bridged via Capacitor's umbrella)
import CommonCrypto
