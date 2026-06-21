// HangelHomeWidgets — Ana ekran / bugün widget'ları (WidgetKit TimelineProvider).
//
// 3 widget (iOS 16.1+, mevcut extension deployment target):
//   1. UpcomingEventWidget  "Yaklaşan Etkinlik" — geri sayım (.systemSmall/.systemMedium)
//   2. ImpactScoreWidget    "Etki Puanım"        — toplam puan + rozet (.systemSmall)
//   3. BloodStatusWidget    "Acil Kan Durumu"    — yakındaki açık çağrı sayısı (.systemSmall/.systemMedium)
//
// VERİ KAYNAĞI (kanca): App Group UserDefaults("group.com.hangel.app.shared").
// Şu an PLACEHOLDER veriyle başlatılır. Web/native tarafı App Group'a şu anahtarları
// yazdığında widget'lar otomatik gerçek veriyle güncellenir (WidgetCenter.reloadTimelines
// ile tetiklenir):
//
//   widget.upcomingEvent.title        : String
//   widget.upcomingEvent.startEpochMs : Double  (1970'ten beri ms)
//   widget.upcomingEvent.location     : String
//   widget.impact.score               : Int
//   widget.impact.rank                : String  (örn. "Gönüllü", "Lider Gönüllü")
//   widget.blood.openRequests         : Int
//   widget.blood.nearestCity          : String
//   widget.lastUpdatedEpochMs         : Double
//
// NATIVE YAZMA KANCASI (sonraki adım, bu görevin kapsamı dışında — sadece okuma var):
//   let d = UserDefaults(suiteName: "group.com.hangel.app.shared")
//   d?.set("Sahil Temizliği", forKey: "widget.upcomingEvent.title")
//   d?.set(Date().addingTimeInterval(3600).timeIntervalSince1970 * 1000,
//          forKey: "widget.upcomingEvent.startEpochMs")
//   WidgetCenter.shared.reloadAllTimelines()   // import WidgetKit gerekli
//
// Tüm widget'lar tıklanınca .widgetURL ile ilgili hangel:// derin bağlantısına açılır.

import WidgetKit
import SwiftUI

// MARK: - App Group veri okuyucu (paylaşılan kanca)

/// App Group UserDefaults'tan widget verisini okur. Anahtar yoksa placeholder döner.
enum HangelWidgetStore {
    private static let suite = "group.com.hangel.app.shared"
    private static var defaults: UserDefaults? { UserDefaults(suiteName: suite) }

    // Yaklaşan etkinlik
    static func upcomingEvent() -> (title: String, start: Date?, location: String) {
        let d = defaults
        let title = d?.string(forKey: "widget.upcomingEvent.title") ?? "Yaklaşan etkinlik yok"
        let ms = d?.double(forKey: "widget.upcomingEvent.startEpochMs") ?? 0
        let start = ms > 0 ? Date(timeIntervalSince1970: ms / 1000.0) : nil
        let loc = d?.string(forKey: "widget.upcomingEvent.location") ?? ""
        return (title, start, loc)
    }

    // Etki puanı
    static func impact() -> (score: Int, rank: String) {
        let d = defaults
        let score = d?.integer(forKey: "widget.impact.score") ?? 0
        let rank = d?.string(forKey: "widget.impact.rank") ?? "Gönüllü"
        return (score, rank)
    }

    // Acil kan durumu
    static func bloodStatus() -> (openRequests: Int, nearestCity: String) {
        let d = defaults
        let open = d?.integer(forKey: "widget.blood.openRequests") ?? 0
        let city = d?.string(forKey: "widget.blood.nearestCity") ?? ""
        return (open, city)
    }

    // Bağışlarım (katkı sayısı + etiket)
    static func donations() -> (count: Int, label: String) {
        let d = defaults
        let count = d?.integer(forKey: "widget.donations.count") ?? 0
        let label = d?.string(forKey: "widget.donations.label") ?? "destek"
        return (count, label)
    }
}

// MARK: - Paylaşılan widget kabuğu (hangel marka çerçevesi)

/// Üst satır: ikon rozeti + başlık etiketi (sol), hangel wordmark (sağ).
@available(iOS 16.1, *)
private struct WidgetHeader: View {
    let kicker: String
    let systemImage: String
    var tint: Color = .hangelOrange
    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: systemImage)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(tint)
                .layoutPriority(1)
            // Kicker: tek satır + gerekirse küçülür (truncate/kesilme YOK).
            Text(kicker.uppercased())
                .font(.system(size: 9.5, weight: .bold, design: .rounded))
                .foregroundStyle(tint)
                .kerning(0.2)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            Spacer(minLength: 4)
            // Wordmark: ASLA kesilmesin → fixedSize (tam metin garanti).
            HangelWordmark(size: 11)
                .fixedSize()
                .layoutPriority(1)
        }
    }
}

// MARK: - 1) Yaklaşan Etkinlik widget'ı

struct UpcomingEventEntry: TimelineEntry {
    let date: Date
    let title: String
    let start: Date?
    let location: String
}

@available(iOS 16.1, *)
struct UpcomingEventProvider: TimelineProvider {
    func placeholder(in context: Context) -> UpcomingEventEntry {
        UpcomingEventEntry(date: Date(), title: "Sahil Temizliği",
                           start: Date().addingTimeInterval(2 * 3600), location: "Karşıyaka")
    }
    func getSnapshot(in context: Context, completion: @escaping (UpcomingEventEntry) -> Void) {
        let e = HangelWidgetStore.upcomingEvent()
        completion(UpcomingEventEntry(date: Date(), title: e.title, start: e.start, location: e.location))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<UpcomingEventEntry>) -> Void) {
        let e = HangelWidgetStore.upcomingEvent()
        let entry = UpcomingEventEntry(date: Date(), title: e.title, start: e.start, location: e.location)
        // Geri sayım canlı kalsın diye 15 dk sonra yenile (veri App Group'tan gelir).
        let next = Date().addingTimeInterval(15 * 60)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

@available(iOS 16.1, *)
struct UpcomingEventWidgetView: View {
    var entry: UpcomingEventEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            WidgetHeader(kicker: "Yaklaşan Etkinlik", systemImage: "calendar")
            Text(entry.title)
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .lineLimit(2)
                .minimumScaleFactor(0.8)
            Spacer(minLength: 0)
            if let start = entry.start {
                if start > Date() {
                    Text(timerInterval: Date()...start, countsDown: true)
                        .font(.system(size: 22, weight: .heavy, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(Color.hangelOrange)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                } else {
                    Label("Başladı", systemImage: "dot.radiowaves.left.and.right")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.green)
                }
            } else {
                Text("Planlanan etkinlik yok")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            if !entry.location.isEmpty {
                Label(entry.location, systemImage: "mappin.and.ellipse")
                    .font(.caption2).foregroundStyle(.secondary).lineLimit(1)
            }
        }
        .padding(14)
        .containerBackgroundCompat()
        .widgetURL(URL(string: "hangel://events"))
    }
}

@available(iOS 16.1, *)
struct UpcomingEventWidget: Widget {
    let kind = "com.hangel.ios.app.widget.upcoming-event"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: UpcomingEventProvider()) { entry in
            UpcomingEventWidgetView(entry: entry)
        }
        .configurationDisplayName("Yaklaşan Etkinlik")
        .description("Bir sonraki etkinliğine kalan süreyi gösterir.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - 2) Etki Puanım widget'ı

struct ImpactScoreEntry: TimelineEntry {
    let date: Date
    let score: Int
    let rank: String
}

@available(iOS 16.1, *)
struct ImpactScoreProvider: TimelineProvider {
    func placeholder(in context: Context) -> ImpactScoreEntry {
        ImpactScoreEntry(date: Date(), score: 1240, rank: "Lider Gönüllü")
    }
    func getSnapshot(in context: Context, completion: @escaping (ImpactScoreEntry) -> Void) {
        let i = HangelWidgetStore.impact()
        completion(ImpactScoreEntry(date: Date(), score: i.score, rank: i.rank))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<ImpactScoreEntry>) -> Void) {
        let i = HangelWidgetStore.impact()
        let entry = ImpactScoreEntry(date: Date(), score: i.score, rank: i.rank)
        completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(60 * 60))))
    }
}

@available(iOS 16.1, *)
struct ImpactScoreWidgetView: View {
    var entry: ImpactScoreEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            WidgetHeader(kicker: "Etki Puanım", systemImage: "sparkles")
            Spacer(minLength: 0)
            Text("\(entry.score)")
                .font(.system(size: 34, weight: .heavy, design: .rounded))
                .foregroundStyle(Color.hangelOrange)
                .minimumScaleFactor(0.5)
                .lineLimit(1)
            Text("puan")
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
            Spacer(minLength: 0)
            Text(entry.rank)
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(Color.hangelOrange)
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(Capsule().fill(Color.hangelOrange.opacity(0.15)))
                .lineLimit(1)
        }
        .padding(14)
        .containerBackgroundCompat()
        .widgetURL(URL(string: "hangel://profile"))
    }
}

@available(iOS 16.1, *)
struct ImpactScoreWidget: Widget {
    let kind = "com.hangel.ios.app.widget.impact-score"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ImpactScoreProvider()) { entry in
            ImpactScoreWidgetView(entry: entry)
        }
        .configurationDisplayName("Etki Puanım")
        .description("Toplam etki puanını ve seviyeni gösterir.")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - 3) Acil Kan Durumu widget'ı

struct BloodStatusEntry: TimelineEntry {
    let date: Date
    let openRequests: Int
    let nearestCity: String
}

@available(iOS 16.1, *)
struct BloodStatusProvider: TimelineProvider {
    func placeholder(in context: Context) -> BloodStatusEntry {
        BloodStatusEntry(date: Date(), openRequests: 3, nearestCity: "İzmir")
    }
    func getSnapshot(in context: Context, completion: @escaping (BloodStatusEntry) -> Void) {
        let b = HangelWidgetStore.bloodStatus()
        completion(BloodStatusEntry(date: Date(), openRequests: b.openRequests, nearestCity: b.nearestCity))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<BloodStatusEntry>) -> Void) {
        let b = HangelWidgetStore.bloodStatus()
        let entry = BloodStatusEntry(date: Date(), openRequests: b.openRequests, nearestCity: b.nearestCity)
        // Acil durum → daha sık yenile (10 dk).
        completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(10 * 60))))
    }
}

@available(iOS 16.1, *)
struct BloodStatusWidgetView: View {
    var entry: BloodStatusEntry
    private var hasOpen: Bool { entry.openRequests > 0 }
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            WidgetHeader(kicker: "Acil Kan Durumu", systemImage: "drop.fill", tint: .hangelEmergency)
            Spacer(minLength: 0)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("\(entry.openRequests)")
                    .font(.system(size: 34, weight: .heavy, design: .rounded))
                    .foregroundStyle(hasOpen ? Color.hangelEmergency : Color.secondary)
                    .minimumScaleFactor(0.5).lineLimit(1)
                Text(hasOpen ? "açık çağrı" : "çağrı yok")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            if hasOpen && !entry.nearestCity.isEmpty {
                Label("En yakın: \(entry.nearestCity)", systemImage: "mappin.and.ellipse")
                    .font(.caption2).foregroundStyle(.secondary).lineLimit(1)
            } else if !hasOpen {
                Label("Şu an acil ihtiyaç yok", systemImage: "checkmark.seal.fill")
                    .font(.caption2).foregroundStyle(.green).lineLimit(1)
            }
        }
        .padding(14)
        .containerBackgroundCompat()
        .widgetURL(URL(string: "hangel://blood"))
    }
}

@available(iOS 16.1, *)
struct BloodStatusWidget: Widget {
    let kind = "com.hangel.ios.app.widget.blood-status"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BloodStatusProvider()) { entry in
            BloodStatusWidgetView(entry: entry)
        }
        .configurationDisplayName("Acil Kan Durumu")
        .description("Yakın çevredeki açık acil kan çağrılarını gösterir.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - 4) Pazar Yeri (alışveriş) widget'ı

struct MarketplaceEntry: TimelineEntry { let date: Date }

@available(iOS 16.1, *)
struct MarketplaceProvider: TimelineProvider {
    func placeholder(in context: Context) -> MarketplaceEntry { MarketplaceEntry(date: Date()) }
    func getSnapshot(in context: Context, completion: @escaping (MarketplaceEntry) -> Void) {
        completion(MarketplaceEntry(date: Date()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<MarketplaceEntry>) -> Void) {
        completion(Timeline(entries: [MarketplaceEntry(date: Date())], policy: .never))
    }
}

@available(iOS 16.1, *)
struct MarketplaceWidgetView: View {
    // Temu vitrin havası: renkli ürün kutucukları.
    private let tints: [Color] = [.hangelOrange, .pink, .purple, .teal]
    private let icons: [String] = ["tshirt.fill", "cup.and.saucer.fill", "gift.fill", "sparkles"]
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            WidgetHeader(kicker: "Fırsatlar", systemImage: "bag.fill")
            Spacer(minLength: 0)
            // Renkli ürün şeridi (4 kutucuk).
            HStack(spacing: 6) {
                ForEach(0..<4, id: \.self) { i in
                    RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .fill(tints[i].opacity(0.16))
                        .frame(height: 36)
                        .overlay(
                            Image(systemName: icons[i])
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(tints[i])
                        )
                }
            }
            Spacer(minLength: 0)
            HStack(spacing: 4) {
                Text("Alışverişle destek ol")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.hangelOrange)
                    .lineLimit(1).minimumScaleFactor(0.7)
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").font(.system(size: 9, weight: .bold)).foregroundStyle(Color.hangelOrange)
            }
        }
        .padding(12)
        .containerBackgroundCompat()
        .widgetURL(URL(string: "hangel://market"))
    }
}

@available(iOS 16.1, *)
struct MarketplaceWidget: Widget {
    let kind = "com.hangel.ios.app.widget.marketplace"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MarketplaceProvider()) { _ in
            MarketplaceWidgetView()
        }
        .configurationDisplayName("Pazar Yeri")
        .description("Alışverişle destek olabileceğin markalara hızlı erişim.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - 5) Bağışlarım widget'ı

struct DonationsEntry: TimelineEntry {
    let date: Date
    let count: Int
    let label: String
}

@available(iOS 16.1, *)
struct DonationsProvider: TimelineProvider {
    func placeholder(in context: Context) -> DonationsEntry { DonationsEntry(date: Date(), count: 12, label: "destek") }
    func getSnapshot(in context: Context, completion: @escaping (DonationsEntry) -> Void) {
        let d = HangelWidgetStore.donations()
        completion(DonationsEntry(date: Date(), count: d.count, label: d.label))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<DonationsEntry>) -> Void) {
        let d = HangelWidgetStore.donations()
        let entry = DonationsEntry(date: Date(), count: d.count, label: d.label)
        completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(60 * 60))))
    }
}

@available(iOS 16.1, *)
struct DonationsWidgetView: View {
    var entry: DonationsEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            WidgetHeader(kicker: "Bağışlarım", systemImage: "gift.fill")
            Spacer(minLength: 0)
            Text("\(entry.count)")
                .font(.system(size: 34, weight: .heavy, design: .rounded))
                .foregroundStyle(Color.hangelOrange)
                .minimumScaleFactor(0.5).lineLimit(1)
            Text(entry.label)
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
            Spacer(minLength: 0)
            HStack(spacing: 4) {
                Text("Katkılarımı gör")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.hangelOrange).lineLimit(1).minimumScaleFactor(0.7)
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").font(.system(size: 9, weight: .bold)).foregroundStyle(Color.hangelOrange)
            }
        }
        .padding(14)
        .containerBackgroundCompat()
        .widgetURL(URL(string: "hangel://my-donations"))
    }
}

@available(iOS 16.1, *)
struct DonationsWidget: Widget {
    let kind = "com.hangel.ios.app.widget.donations"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DonationsProvider()) { entry in
            DonationsWidgetView(entry: entry)
        }
        .configurationDisplayName("Bağışlarım")
        .description("Toplam katkı/destek sayını gösterir.")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - containerBackground uyumluluk yardımcısı
// iOS 17+ widget'lar için containerBackground ZORUNLU (yoksa StandBy/ana ekranda
// boş/yanlış arkaplan). iOS 16'da bu API yok → koşullu uygula.

@available(iOS 16.1, *)
private extension View {
    @ViewBuilder
    func containerBackgroundCompat() -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(.fill.tertiary, for: .widget)
        } else {
            self
        }
    }
}
