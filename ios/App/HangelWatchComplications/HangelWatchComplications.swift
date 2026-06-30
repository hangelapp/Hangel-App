// HangelWatchComplications — Apple Watch kadran complication'ları (WidgetKit).
//
// watchOS Widget Extension target'ı. Etki puanı + günlük seriyi kadranda gösterir.
// Veri: watch app, iPhone'dan userStats alınca App Group UserDefaults'a yazar
// ("group.com.hangel.app.shared" → watchImpactScore / watchStreak) + complication'ı
// yeniler (WidgetCenter.reloadAllTimelines()). Bu extension oradan okur.
//
// Apple kimliği: marka mercanı, net glanceable tipografi.

import WidgetKit
import SwiftUI

private let APP_GROUP = "group.com.hangel.app.shared"

struct HangelComplicationEntry: TimelineEntry {
    let date: Date
    let impactScore: Int
    let streak: Int
}

struct HangelComplicationProvider: TimelineProvider {
    func placeholder(in context: Context) -> HangelComplicationEntry {
        HangelComplicationEntry(date: Date(), impactScore: 1280, streak: 7)
    }
    func getSnapshot(in context: Context, completion: @escaping (HangelComplicationEntry) -> Void) {
        completion(load())
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<HangelComplicationEntry>) -> Void) {
        completion(Timeline(entries: [load()], policy: .never))
    }
    private func load() -> HangelComplicationEntry {
        let d = UserDefaults(suiteName: APP_GROUP)
        return HangelComplicationEntry(
            date: Date(),
            impactScore: d?.integer(forKey: "watchImpactScore") ?? 0,
            streak: d?.integer(forKey: "watchStreak") ?? 0
        )
    }
}

struct HangelComplicationView: View {
    @Environment(\.widgetFamily) private var family
    let entry: HangelComplicationEntry
    private let coral = Color(red: 243.0 / 255.0, green: 71.0 / 255.0, blue: 35.0 / 255.0)

    var body: some View {
        switch family {
        case .accessoryCircular:
            Gauge(value: Double(min(entry.impactScore, 2500)), in: 0...2500) {
                Image(systemName: "heart.fill")
            } currentValueLabel: {
                Text("\(entry.impactScore)")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .minimumScaleFactor(0.5)
            }
            .gaugeStyle(.accessoryCircular)
            .tint(coral)
        case .accessoryInline:
            Label("\(entry.impactScore) etki puanı", systemImage: "heart.fill")
        case .accessoryRectangular:
            HStack(spacing: 8) {
                Image(systemName: "heart.fill").foregroundStyle(coral)
                VStack(alignment: .leading, spacing: 1) {
                    Text("hangel").font(.caption2.weight(.heavy))
                    Text("\(entry.impactScore) etki puanı").font(.caption2)
                    if entry.streak > 0 {
                        Text("🔥 \(entry.streak) gün seri").font(.system(size: 11))
                    }
                }
            }
        case .accessoryCorner:
            Text("\(entry.impactScore)")
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .widgetCurvesContent()
        default:
            Text("\(entry.impactScore)")
        }
    }
}

@main
struct HangelWatchComplications: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "HangelImpactComplication", provider: HangelComplicationProvider()) { entry in
            HangelComplicationView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("hangel Etki")
        .description("Etki puanın ve günlük serin bilekte.")
        .supportedFamilies([.accessoryCircular, .accessoryInline, .accessoryRectangular, .accessoryCorner])
    }
}
