// HangelAppIntents — Siri Shortcuts (Faz 2).
//
// AppIntents framework iOS 16+. 4 shortcut:
//   1. Yakındaki etkinlikleri göster
//   2. Yakındaki gönüllülük fırsatlarını göster
//   3. Görevlerimi göster
//   4. Acil kan ihtiyaçlarını göster
//
// Her shortcut app'i açar ve `hangel://` custom scheme ile ilgili path'e
// yönlendirir. Mevcut deep-link bridge (NativeBridgeProvider, Faz 0) bu
// scheme'i pathname'e çevirip Next.js router'a yönlendirir.
//
// iOS 16+ otomatik olarak AppShortcutsProvider listesini Settings → Siri &
// Search → Hangel ve Spotlight'ta görünür yapar.

import Foundation
#if canImport(AppIntents)
import AppIntents
import UIKit

@available(iOS 16, *)
public struct ShowNearbyEventsIntent: AppIntent {
    public static var title: LocalizedStringResource = "Yakındaki etkinlikleri göster"
    public static var description = IntentDescription("Konumunuza göre yakındaki gönüllülük etkinliklerini açar.")
    public static var openAppWhenRun: Bool = true
    public init() {}
    @MainActor public func perform() async throws -> some IntentResult {
        if let url = URL(string: "hangel://events/nearby") { await UIApplication.shared.open(url) }
        return .result()
    }
}

@available(iOS 16, *)
public struct ShowVolunteerOpportunitiesIntent: AppIntent {
    public static var title: LocalizedStringResource = "Yakındaki gönüllülük fırsatlarını göster"
    public static var description = IntentDescription("Konumunuza göre açık gönüllülük fırsatlarını gösterir.")
    public static var openAppWhenRun: Bool = true
    public init() {}
    @MainActor public func perform() async throws -> some IntentResult {
        if let url = URL(string: "hangel://volunteering") { await UIApplication.shared.open(url) }
        return .result()
    }
}

@available(iOS 16, *)
public struct ShowMyTasksIntent: AppIntent {
    public static var title: LocalizedStringResource = "Görevlerimi göster"
    public static var description = IntentDescription("Aktif gönüllülük görevlerinizi listeler.")
    public static var openAppWhenRun: Bool = true
    public init() {}
    @MainActor public func perform() async throws -> some IntentResult {
        if let url = URL(string: "hangel://settings/my-tasks") { await UIApplication.shared.open(url) }
        return .result()
    }
}

@available(iOS 16, *)
public struct ShowBloodRequestsIntent: AppIntent {
    public static var title: LocalizedStringResource = "Acil kan ihtiyaçlarını göster"
    public static var description = IntentDescription("Yakın çevredeki acil kan çağrılarını gösterir.")
    public static var openAppWhenRun: Bool = true
    public init() {}
    @MainActor public func perform() async throws -> some IntentResult {
        if let url = URL(string: "hangel://emergency/blood") { await UIApplication.shared.open(url) }
        return .result()
    }
}

@available(iOS 16, *)
public struct HangelShortcuts: AppShortcutsProvider {
    public static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: ShowNearbyEventsIntent(),
            phrases: [
                "Hangel'da yakındaki etkinlikleri göster",
                "\(.applicationName) etkinlik bul",
            ],
            shortTitle: "Yakındaki Etkinlikler",
            systemImageName: "calendar"
        )
        AppShortcut(
            intent: ShowVolunteerOpportunitiesIntent(),
            phrases: [
                "Hangel'da gönüllülük fırsatlarını göster",
                "\(.applicationName) gönüllülük bul",
            ],
            shortTitle: "Gönüllülük Fırsatları",
            systemImageName: "hand.raised.fill"
        )
        AppShortcut(
            intent: ShowMyTasksIntent(),
            phrases: [
                "Hangel görevlerimi göster",
                "\(.applicationName) görevlerim",
            ],
            shortTitle: "Görevlerim",
            systemImageName: "checklist"
        )
        AppShortcut(
            intent: ShowBloodRequestsIntent(),
            phrases: [
                "Hangel'da acil kan ihtiyaçlarını göster",
                "\(.applicationName) acil kan",
            ],
            shortTitle: "Acil Kan",
            systemImageName: "drop.fill"
        )
    }
}
#endif
