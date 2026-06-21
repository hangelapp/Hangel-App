// HangelWidgetPlugin — Web ↔ ana ekran widget'ları köprüsü (yazma).
//
// Web tarafı `HangelWidget.setData(...)` çağırır; bu plugin gelen alanları App
// Group UserDefaults("group.com.hangel.app.shared")'a yazar ve WidgetKit
// timeline'larını yeniler. HangelHomeWidgets.swift bu App Group'tan okur; veri
// gelene kadar placeholder gösterir, geldikten sonra gerçek değerle güncellenir.
//
// Yazılan anahtarlar (HangelWidgetStore'un okuduğu anahtarlarla BİREBİR aynı):
//   widget.upcomingEvent.title        : String
//   widget.upcomingEvent.startEpochMs : Double  (1970'ten beri ms)
//   widget.upcomingEvent.location     : String
//   widget.impact.score               : Int
//   widget.impact.rank                : String
//   widget.blood.openRequests         : Int
//   widget.blood.nearestCity          : String
//   widget.donations.count            : Int
//   widget.donations.label            : String
//   widget.lastUpdatedEpochMs         : Double
//
// Sadece çağrıda GELEN alanlar yazılır; gelmeyen alan dokunulmaz (önceki/placeholder
// değer korunur). Best-effort: asla hard-reject etmez, daima { ok: true } resolve eder.
//
// NOTE: Bu .swift dosyası Xcode'da App TARGET'ına eklenmiş olmalıdır. Capacitor 6+
// (proje Capacitor 8) App target içindeki @objc CAPBridgedPlugin sınıflarını otomatik
// kaydeder; ayrı bir bridge/registration adımı gerekmez. (HangelHealthPlugin ile aynı.)

import Foundation
import Capacitor
#if canImport(WidgetKit)
import WidgetKit
#endif

@objc(HangelWidgetPlugin)
public class HangelWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HangelWidgetPlugin"
    public let jsName = "HangelWidget"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setData", returnType: CAPPluginReturnPromise),
    ]

    private static let suite = "group.com.hangel.app.shared"

    @objc func setData(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: Self.suite) else {
            // App Group erişilemiyor → sessizce başarı (best-effort, widget placeholder kalır).
            call.resolve(["ok": true]); return
        }

        // Yaklaşan etkinlik.
        if let title = call.getString("upcomingEventTitle") {
            defaults.set(title, forKey: "widget.upcomingEvent.title")
        }
        if let startMs = call.getDouble("upcomingEventStartEpochMs") {
            defaults.set(startMs, forKey: "widget.upcomingEvent.startEpochMs")
        }
        if let location = call.getString("upcomingEventLocation") {
            defaults.set(location, forKey: "widget.upcomingEvent.location")
        }

        // Etki puanı + rütbe.
        if let score = call.getInt("impactScore") {
            defaults.set(score, forKey: "widget.impact.score")
        }
        if let rank = call.getString("impactRank") {
            defaults.set(rank, forKey: "widget.impact.rank")
        }

        // Acil kan durumu.
        if let open = call.getInt("bloodOpenRequests") {
            defaults.set(open, forKey: "widget.blood.openRequests")
        }
        if let city = call.getString("bloodNearestCity") {
            defaults.set(city, forKey: "widget.blood.nearestCity")
        }

        // Bağışlar / destek.
        if let count = call.getInt("donationsCount") {
            defaults.set(count, forKey: "widget.donations.count")
        }
        if let label = call.getString("donationsLabel") {
            defaults.set(label, forKey: "widget.donations.label")
        }

        defaults.set(Date().timeIntervalSince1970 * 1000, forKey: "widget.lastUpdatedEpochMs")

        #if canImport(WidgetKit)
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        #endif

        call.resolve(["ok": true])
    }
}
