// HangelAttPlugin — App Tracking Transparency (ATT) prompt köprüsü.
//
// Web tarafından `HangelAtt.requestPermission()` çağrısıyla tetiklenir; iOS 14+
// sistem ATT diyaloğunu açar. Firebase Analytics IDFA kullandığı için Apple
// yeni IPA'larda bu prompt'u zorunlu denetler. Reddedilirse Firebase Analytics
// IDFA'sız çalışmaya devam eder, app fonksiyonel kalır.
//
// Plugin Capacitor 8 çağrı sözleşmesine göre yazılmıştır. `Plugins.swift` veya
// `AppDelegate.swift` üzerinden manual register etmeye gerek yok — Capacitor
// 7+ `@objc(...)` declaration ile otomatik bulur.

import Foundation
import Capacitor
#if canImport(AppTrackingTransparency)
import AppTrackingTransparency
#endif

@objc(HangelAttPlugin)
public class HangelAttPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HangelAttPlugin"
    public let jsName = "HangelAtt"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
    ]

    @objc func getStatus(_ call: CAPPluginCall) {
        #if canImport(AppTrackingTransparency)
        if #available(iOS 14, *) {
            call.resolve(["status": Self.statusString(ATTrackingManager.trackingAuthorizationStatus)])
            return
        }
        #endif
        call.resolve(["status": "notAvailable"])
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        #if canImport(AppTrackingTransparency)
        if #available(iOS 14, *) {
            ATTrackingManager.requestTrackingAuthorization { status in
                call.resolve(["status": Self.statusString(status)])
            }
            return
        }
        #endif
        call.resolve(["status": "notAvailable"])
    }

    #if canImport(AppTrackingTransparency)
    @available(iOS 14, *)
    private static func statusString(_ status: ATTrackingManager.AuthorizationStatus) -> String {
        switch status {
        case .authorized: return "authorized"
        case .denied: return "denied"
        case .restricted: return "restricted"
        case .notDetermined: return "notDetermined"
        @unknown default: return "unknown"
        }
    }
    #endif
}
