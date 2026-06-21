// HangelControlWidgets — iPhone Kontrol Merkezi (Control Center) denetimleri.
//
// iOS 18+ WidgetKit ControlWidget API. Kullanıcı Kontrol Merkezi'ni düzenleyip
// "Denetim Ekle" dediğinde hangel denetimleri listede çıkar. Her denetime
// dokunulduğunda uygulama, ilgili `hangel://` derin bağlantısıyla doğru sayfaya
// açılır (mevcut deep-link köprüsü AppDelegate → Capacitor → NativeBridgeProvider).
//
// 4 denetim:
//   1. Acil Kan          → hangel://emergency/blood
//   2. Etkinlik Check-in → hangel://checkin
//   3. Hızlı Bağış       → hangel://donate
//   4. Gönüllülük        → hangel://volunteering
//
// NOT (deployment target): Bu widget extension iOS 16.1 ile build edilir; ControlWidget
// yalnızca iOS 18+'da derlenir/çalışır. Bu yüzden TÜM tipler `@available(iOS 18.0, *)`
// ile işaretli ve WidgetBundle'a koşullu eklenir (HangelLiveActivities.swift'te
// `if #available(iOS 18.0, *)`). Daha eski iOS'larda hiçbir denetim görünmez, mevcut
// Live Activity'ler etkilenmez.
//
// AÇMA MEKANİZMASI: ControlWidgetButton + OpenURLIntent. OpenURLIntent (AppIntents)
// extension'dan UIApplication çağırmadan, sistem üzerinden uygulamayı verilen URL ile
// açar. Bu, Control Center denetimleri için Apple'ın önerdiği yoldur.

import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Ortak yardımcılar

@available(iOS 18.0, *)
private func hangelOpenURLIntent(_ urlString: String) -> OpenURLIntent {
    // URL parse edilemezse uygulamayı kök derin bağlantıya aç (güvenli fallback).
    OpenURLIntent(URL(string: urlString) ?? URL(string: "hangel://home")!)
}

// MARK: - 1) Acil Kan denetimi

@available(iOS 18.0, *)
struct EmergencyBloodControl: ControlWidget {
    static let kind = "com.hangel.ios.app.control.emergency-blood"

    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: hangelOpenURLIntent("hangel://emergency/blood")) {
                Label("Acil Kan", systemImage: "drop.fill")
            }
            .tint(.hangelEmergency)
        }
        .displayName("hangel · Acil Kan")
        .description("Yakın çevredeki acil kan çağrılarını açar.")
    }
}

// MARK: - 2) Etkinlik Check-in denetimi

@available(iOS 18.0, *)
struct EventCheckinControl: ControlWidget {
    static let kind = "com.hangel.ios.app.control.event-checkin"

    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: hangelOpenURLIntent("hangel://checkin")) {
                Label("Check-in", systemImage: "qrcode.viewfinder")
            }
            .tint(.hangelOrange)
        }
        .displayName("hangel · Etkinlik Check-in")
        .description("Etkinlik / gönüllülük check-in ekranını açar.")
    }
}

// MARK: - 3) Hızlı Bağış denetimi

@available(iOS 18.0, *)
struct QuickDonateControl: ControlWidget {
    static let kind = "com.hangel.ios.app.control.quick-donate"

    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: hangelOpenURLIntent("hangel://donate")) {
                Label("Hızlı Bağış", systemImage: "heart.fill")
            }
            .tint(.hangelOrange)
        }
        .displayName("hangel · Hızlı Bağış")
        .description("Bağış / destek sayfasını tek dokunuşla açar.")
    }
}

// MARK: - 4) Gönüllülük denetimi

@available(iOS 18.0, *)
struct VolunteeringControl: ControlWidget {
    static let kind = "com.hangel.ios.app.control.volunteering"

    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: hangelOpenURLIntent("hangel://volunteering")) {
                Label("Gönüllülük", systemImage: "hand.raised.fill")
            }
            .tint(.hangelOrange)
        }
        .displayName("hangel · Gönüllülük")
        .description("Yakındaki gönüllülük fırsatlarını açar.")
    }
}

// MARK: - 5) Pazar Yeri (alışveriş) denetimi

@available(iOS 18.0, *)
struct MarketplaceControl: ControlWidget {
    static let kind = "com.hangel.ios.app.control.marketplace"

    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: hangelOpenURLIntent("hangel://market")) {
                Label("Pazar Yeri", systemImage: "bag.fill")
            }
            .tint(.hangelOrange)
        }
        .displayName("hangel · Pazar Yeri")
        .description("Alışverişle destek olabileceğin markaları açar.")
    }
}
