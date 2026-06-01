// WatchAppDelegate — WKApplicationDelegate.
//
// WCSession.default.activate() çağırarak iPhone <-> Watch köprüsünü açar.
// Aktif olduğunda iPhone tarafı `sendMessage` / `transferUserInfo` ile
// acil kan ihtiyacı payload'larını Watch'a iletir.

import WatchKit
import WatchConnectivity

final class WatchAppDelegate: NSObject, WKApplicationDelegate {
    func applicationDidFinishLaunching() {
        // Singleton'u erken başlat — WCSession delegate kayıt zamanlaması kritik.
        _ = WatchConnectivityManager.shared
    }
}
