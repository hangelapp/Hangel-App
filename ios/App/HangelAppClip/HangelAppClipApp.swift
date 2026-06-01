// HangelAppClipApp — App Clip entry point.
//
// Apple App Clip Experience: https://hangel.org.tr/clip/event/{eventId}
// Kullanıcı QR kodu okuttuğunda iOS App Clip Card açar; Clip indirilir ve
// `NSUserActivityTypeBrowsingWeb` üzerinden URL'i alır. URL'den `eventId`
// parse edilip Firestore'dan etkinlik bilgileri çekilir, "Check-in" butonu
// gösterilir.
//
// App Clip 15 MB sınırı — bu yüzden Capacitor + web WebView KULLANILMAZ.
// Sadece native SwiftUI + Foundation + minimal HTTP fetch.
//
// Parent App: com.hangel.ios.app
// Clip Bundle ID: com.hangel.ios.app.Clip
// iOS minimum: 16.0 (Advanced App Clip Experiences için)

import SwiftUI

@main
struct HangelAppClipApp: App {
    @StateObject private var state = ClipState.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(state)
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb,
                                        perform: handleUserActivity)
        }
    }

    /// App Clip invocation URL'i parse et.
    /// URL şeması: https://hangel.org.tr/clip/event/{eventId}
    private func handleUserActivity(_ activity: NSUserActivity) {
        guard let url = activity.webpageURL else { return }
        // pathComponents: ["/", "clip", "event", "{eventId}"]
        let parts = url.pathComponents
        guard parts.count >= 4 else { return }
        let kind = parts[2]  // "event" veya "ngo"
        let id = parts[3]
        DispatchQueue.main.async {
            state.kind = kind
            state.targetId = id
        }
    }
}
