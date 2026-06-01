// HangelWatchApp — watchOS app entry point.
//
// SwiftUI @main App. WatchAppDelegate WCSession'ı activate eder; içerideki
// `WatchConnectivityManager` iPhone'dan gelen acil kan ihtiyacı payload'larını
// dinler ve UI'a `@Published var emergencies` ile bildirir.
//
// watchOS 10+ targeting.

import SwiftUI

@main
struct HangelWatchApp: App {
    @WKApplicationDelegateAdaptor(WatchAppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(WatchConnectivityManager.shared)
        }
    }
}
