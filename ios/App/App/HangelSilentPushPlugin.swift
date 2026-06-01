// HangelSilentPushPlugin — APNs silent (background) push köprüsü.
//
// "Silent push" = aps.content-available=1, alert/sound/badge yok. iOS background
// fetch budget'i içinde uygulamayı uyandırır; biz bu fırsatı kullanarak:
//   - Geofence verisini sync'leriz
//   - Feed cache'ini yenileriz
//   - Live Activity push'larını trigger ederiz
//
// AppDelegate.application(_:didReceiveRemoteNotification:fetchCompletionHandler)
// silent push'u Notification olarak NotificationCenter'a yayınlar; bu plugin
// listener kurar ve web tarafına `silentPush` event'i emit eder.
//
// Web entry: src/lib/native-silent-push.ts
//
// NOT: Bu plugin "remote-notification" UIBackgroundMode'a ihtiyaç duyar
// (Info.plist'te zaten var). APNs payload örneği:
//   {
//     "aps": { "content-available": 1 },
//     "type": "blood-feed-refresh",
//     "requestId": "abc123"
//   }

import Foundation
import Capacitor
import UIKit

@objc(HangelSilentPushPlugin)
public class HangelSilentPushPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HangelSilentPushPlugin"
    public let jsName = "HangelSilentPush"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isEnabled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncNow", returnType: CAPPluginReturnPromise),
    ]

    /// AppDelegate `didReceiveRemoteNotification:fetchCompletionHandler` içinden
    /// post edilen Notification.Name. Plugin instance bunu dinler ve web'e iletir.
    public static let silentPushNotification = Notification.Name("HangelSilentPushReceived")

    public override func load() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleSilentPush(_:)),
            name: Self.silentPushNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc func isEnabled(_ call: CAPPluginCall) {
        let bgRefresh = UIApplication.shared.backgroundRefreshStatus == .available
        call.resolve([
            "enabled": bgRefresh,
            "status": Self.statusString(UIApplication.shared.backgroundRefreshStatus),
        ])
    }

    /// Web tarafından zorla bir senkron tetikleyebilmek için. APNs olmadan da
    /// background fetch davranışını simüle eder (debug build için faydalı).
    @objc func syncNow(_ call: CAPPluginCall) {
        let type = call.getString("type") ?? "manual"
        let info: [String: Any] = ["type": type, "manual": true]
        notifyListeners("silentPush", data: info)
        call.resolve(["dispatched": true])
    }

    @objc private func handleSilentPush(_ note: Notification) {
        guard let payload = note.userInfo as? [String: Any] else { return }
        // APNs payload'ından type + arbitrary data extract edip web'e gönder.
        var data: [String: Any] = [:]
        for (k, v) in payload where k != "aps" {
            // JSON-serializable hale getirebileceğimiz değerleri al
            if JSONSerialization.isValidJSONObject([k: v]) || v is String || v is Int || v is Double || v is Bool {
                data[k] = v
            }
        }
        notifyListeners("silentPush", data: data)
    }

    private static func statusString(_ status: UIBackgroundRefreshStatus) -> String {
        switch status {
        case .available: return "available"
        case .denied: return "denied"
        case .restricted: return "restricted"
        @unknown default: return "unknown"
        }
    }
}
