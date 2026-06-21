// HangelAppIntents — Siri + Spotlight + Kısayollar (App Intents).
//
// AppIntents framework iOS 16+. Her intent uygulamayı `hangel://` custom
// scheme ile ilgili tek-segment sayfaya açar. Mevcut deep-link köprüsü
// (native-bridge.ts) tek-segment scheme'i `hangel://host` → `/host` olarak
// Next.js router'a çevirir. Yani `hangel://events` → `/events` olur.
//
// `OpensIntent` + `OpenURLIntent` ile uygulamayı açıp ilgili URL'e gitmek
// iOS 16.4+ ister. En geniş uyum için intent'ler iOS 16+ işaretli; perform
// gövdesindeki `OpenURLIntent` kullanımı iOS 16.4+ ile sınırlandırıldı.
// 16.0–16.3 cihazlarda `openAppWhenRun` uygulamayı yine de açar.
//
// iOS otomatik olarak AppShortcutsProvider listesini Ayarlar → Siri & Arama
// ve Spotlight'ta görünür yapar.

import Foundation
#if canImport(AppIntents)
import AppIntents

// MARK: - Intents

@available(iOS 16.0, *)
struct HangelCheckinIntent: AppIntent {
    static var title: LocalizedStringResource = "hangel - Etkinlik check-in"
    static var description = IntentDescription("Etkinliklere check-in yapmak için hangel'ı açar.")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult & OpensIntent {
        if #available(iOS 16.4, *) {
            return .result(opensIntent: OpenURLIntent(URL(string: "hangel://events")!))
        }
        return .result(opensIntent: OpenURLIntent())
    }
}

@available(iOS 16.0, *)
struct HangelBloodIntent: AppIntent {
    static var title: LocalizedStringResource = "hangel - Acil kan"
    static var description = IntentDescription("Acil kan ihtiyaçlarını görmek için hangel'ı açar.")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult & OpensIntent {
        if #available(iOS 16.4, *) {
            return .result(opensIntent: OpenURLIntent(URL(string: "hangel://blood")!))
        }
        return .result(opensIntent: OpenURLIntent())
    }
}

@available(iOS 16.0, *)
struct HangelDonateIntent: AppIntent {
    static var title: LocalizedStringResource = "hangel - Sosyal etki"
    static var description = IntentDescription("Sosyal etki sayfasını açar.")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult & OpensIntent {
        if #available(iOS 16.4, *) {
            return .result(opensIntent: OpenURLIntent(URL(string: "hangel://social-impact")!))
        }
        return .result(opensIntent: OpenURLIntent())
    }
}

@available(iOS 16.0, *)
struct HangelVolunteeringIntent: AppIntent {
    static var title: LocalizedStringResource = "hangel - Gönüllülük"
    static var description = IntentDescription("Gönüllülük fırsatlarını görmek için hangel'ı açar.")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult & OpensIntent {
        if #available(iOS 16.4, *) {
            return .result(opensIntent: OpenURLIntent(URL(string: "hangel://volunteering")!))
        }
        return .result(opensIntent: OpenURLIntent())
    }
}

@available(iOS 16.0, *)
struct HangelMarketIntent: AppIntent {
    static var title: LocalizedStringResource = "hangel - Pazar"
    static var description = IntentDescription("hangel pazarını açar.")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult & OpensIntent {
        if #available(iOS 16.4, *) {
            return .result(opensIntent: OpenURLIntent(URL(string: "hangel://market")!))
        }
        return .result(opensIntent: OpenURLIntent())
    }
}

@available(iOS 16.0, *)
struct HangelMyDonationsIntent: AppIntent {
    static var title: LocalizedStringResource = "hangel - Bağışlarım"
    static var description = IntentDescription("Bağışlarınızı görmek için hangel'ı açar.")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult & OpensIntent {
        if #available(iOS 16.4, *) {
            return .result(opensIntent: OpenURLIntent(URL(string: "hangel://my-donations")!))
        }
        return .result(opensIntent: OpenURLIntent())
    }
}

@available(iOS 16.0, *)
struct HangelImpactReportIntent: AppIntent {
    static var title: LocalizedStringResource = "hangel - Etki raporu"
    static var description = IntentDescription("Etki hikayenizi görmek için hangel'ı açar.")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult & OpensIntent {
        if #available(iOS 16.4, *) {
            return .result(opensIntent: OpenURLIntent(URL(string: "hangel://impact-story")!))
        }
        return .result(opensIntent: OpenURLIntent())
    }
}

// MARK: - App Shortcuts (Siri / Spotlight / Kısayollar)

@available(iOS 16.0, *)
struct HangelShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: HangelCheckinIntent(),
            phrases: [
                "\(.applicationName) check-in",
                "\(.applicationName) etkinlik check-in",
                "\(.applicationName) etkinliğe katıl",
            ],
            shortTitle: "Etkinlik check-in",
            systemImageName: "qrcode.viewfinder"
        )
        AppShortcut(
            intent: HangelBloodIntent(),
            phrases: [
                "\(.applicationName) acil kan",
                "\(.applicationName) kan ihtiyacı",
                "\(.applicationName) acil kan göster",
            ],
            shortTitle: "Acil kan",
            systemImageName: "drop.fill"
        )
        AppShortcut(
            intent: HangelDonateIntent(),
            phrases: [
                "\(.applicationName) sosyal etki",
                "\(.applicationName) etki yarat",
                "\(.applicationName) bağışta bulun",
            ],
            shortTitle: "Sosyal etki",
            systemImageName: "heart.fill"
        )
        AppShortcut(
            intent: HangelVolunteeringIntent(),
            phrases: [
                "\(.applicationName) gönüllülük",
                "\(.applicationName) gönüllü ol",
                "\(.applicationName) gönüllülük fırsatları",
            ],
            shortTitle: "Gönüllülük",
            systemImageName: "hand.raised.fill"
        )
        AppShortcut(
            intent: HangelMarketIntent(),
            phrases: [
                "\(.applicationName) pazar",
                "\(.applicationName) pazarı aç",
                "\(.applicationName) market",
            ],
            shortTitle: "Pazar",
            systemImageName: "bag.fill"
        )
        AppShortcut(
            intent: HangelMyDonationsIntent(),
            phrases: [
                "\(.applicationName) bağışlarım",
                "\(.applicationName) bağışlarımı göster",
                "\(.applicationName) bağış geçmişim",
            ],
            shortTitle: "Bağışlarım",
            systemImageName: "gift.fill"
        )
        AppShortcut(
            intent: HangelImpactReportIntent(),
            phrases: [
                "\(.applicationName) etki raporu",
                "\(.applicationName) etki hikayem",
                "\(.applicationName) raporumu göster",
            ],
            shortTitle: "Etki raporu",
            systemImageName: "chart.line.uptrend.xyaxis"
        )
    }
}
#endif
