// EventCountdownLiveActivity — Etkinlik (hangel orange, Apple tasarım dili).
//
// Üç faz, hepsi cihazda OTOMATİK ilerler (push gerekmez):
//  • Başlamadan önce → Text(timerInterval:) ile canlı geri sayım.
//  • Etkinlik sırasında → ProgressView(timerInterval: başlangıç...bitiş) AKIŞ-LINE'ı
//    kendiliğinden dolar ("Devam ediyor").
//  • Bittiğinde → "Tamamlandı".
// Rol etiketi (Katılımcı/Konuşmacı/Sanatçı = statusLabel) HER FAZDA görünür.
//
// Attributes: eventTitle, location, eventId, eventStartEpoch, eventEndEpoch
// ContentState: minutesLeft (yedek), statusLabel (kullanıcının rolü)

import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.1, *)
struct EventCountdownLiveActivity: Widget {
    private enum Phase { case before, during, after }

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: EventCountdownAttributes.self) { context in
            lockScreenContent(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HangelIconBadge(systemName: "calendar", size: 38)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    trailingMetric(context, big: true)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.eventTitle)
                            .font(.subheadline.bold()).lineLimit(1)
                        Text(context.state.statusLabel)
                            .font(.caption2).foregroundStyle(Color.hangelOrange)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    flowLine(context)
                }
            } compactLeading: {
                Image(systemName: "calendar").foregroundStyle(Color.hangelOrange)
            } compactTrailing: {
                trailingMetric(context, big: false)
            } minimal: {
                Image(systemName: "calendar").foregroundStyle(Color.hangelOrange)
            }
            .widgetURL(URL(string: "hangel://event/\(context.attributes.eventId)"))
            .keylineTint(.hangelOrange)
        }
    }

    @ViewBuilder
    private func lockScreenContent(context: ActivityViewContext<EventCountdownAttributes>) -> some View {
        VStack(spacing: 10) {
            HangelHeaderRow(kicker: "Etkinlik", tint: .hangelOrange)

            HStack(alignment: .center, spacing: 12) {
                HangelIconBadge(systemName: "calendar")

                VStack(alignment: .leading, spacing: 4) {
                    Text(context.attributes.eventTitle)
                        .font(.headline).lineLimit(1)
                    HStack(spacing: 6) {
                        roleChip(context.state.statusLabel)
                        Label(context.attributes.location, systemImage: "mappin.and.ellipse")
                            .font(.caption2).foregroundStyle(.secondary).lineLimit(1)
                    }
                }
                Spacer(minLength: 0)
                trailingMetric(context, big: true)
            }

            flowLine(context)
        }
        .padding(14)
        .activityBackgroundTint(Color.hangelOrange.opacity(0.10))
        .activitySystemActionForegroundColor(.hangelOrange)
    }

    // MARK: - Faz mantığı
    private func startDate(_ c: ActivityViewContext<EventCountdownAttributes>) -> Date? {
        c.attributes.eventStartEpoch > 0 ? Date(timeIntervalSince1970: c.attributes.eventStartEpoch / 1000.0) : nil
    }
    private func endDate(_ c: ActivityViewContext<EventCountdownAttributes>) -> Date? {
        c.attributes.eventEndEpoch > 0 ? Date(timeIntervalSince1970: c.attributes.eventEndEpoch / 1000.0) : nil
    }
    private func phase(_ c: ActivityViewContext<EventCountdownAttributes>) -> Phase {
        let now = Date()
        if let s = startDate(c), now < s { return .before }
        if let e = endDate(c), now >= e { return .after }
        if let s = startDate(c), now >= s { return .during }
        return .before
    }

    // MARK: - Sağ metrik (faz duyarlı)
    @ViewBuilder
    private func trailingMetric(_ c: ActivityViewContext<EventCountdownAttributes>, big: Bool) -> some View {
        let font: Font = big ? .system(.title3, design: .rounded).bold() : .caption2.bold()
        switch phase(c) {
        case .before:
            if let s = startDate(c) {
                Text(timerInterval: Date()...s, countsDown: true)
                    .font(font).monospacedDigit().foregroundStyle(Color.hangelOrange)
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: big ? 108 : 56, alignment: .trailing)
            } else {
                Text(c.state.statusLabel).font(font).foregroundStyle(Color.hangelOrange).lineLimit(1)
            }
        case .during:
            HStack(spacing: 4) {
                Circle().fill(Color.hangelEmergency).frame(width: 7, height: 7)
                Text("CANLI").font(big ? .caption.bold() : .caption2.bold()).foregroundStyle(Color.hangelEmergency)
            }
        case .after:
            Label("Bitti", systemImage: "checkmark.seal.fill")
                .font(big ? .caption.bold() : .caption2.bold()).foregroundStyle(.green)
                .labelStyle(.titleAndIcon)
        }
    }

    // MARK: - Akış-line (faz duyarlı, otomatik ilerler)
    @ViewBuilder
    private func flowLine(_ c: ActivityViewContext<EventCountdownAttributes>) -> some View {
        switch phase(c) {
        case .before:
            // Başlamadan önce: ince, boş akış çizgisi + başlangıç bilgisi.
            ProgressView(value: 0) {
                HStack {
                    Text("Etkinliğe kaldı").font(.caption2).foregroundStyle(.secondary)
                    Spacer()
                    if let s = startDate(c) {
                        Text(s, format: .dateTime.hour().minute())
                            .font(.caption2.bold()).foregroundStyle(Color.hangelOrange)
                    }
                }
            }
            .tint(.hangelOrange)
        case .during:
            // Etkinlik sırasında: başlangıç→bitiş otomatik dolan akış çizgisi.
            if let s = startDate(c), let e = endDate(c), s < e {
                ProgressView(timerInterval: s...e, countsDown: false) {
                    HStack {
                        Text("Etkinlik akışı").font(.caption2.bold()).foregroundStyle(Color.hangelOrange)
                        Spacer()
                        Text("Devam ediyor").font(.caption2).foregroundStyle(.green)
                    }
                }
                .tint(.hangelOrange)
            } else {
                ProgressView(value: 0.5) { Text("Devam ediyor").font(.caption2.bold()).foregroundStyle(.green) }
                    .tint(.hangelOrange)
            }
        case .after:
            ProgressView(value: 1.0) {
                HStack {
                    Text("Etkinlik tamamlandı").font(.caption2.bold()).foregroundStyle(.green)
                    Spacer()
                }
            }
            .tint(.green)
        }
    }

    // MARK: - Rol rozeti (Katılımcı / Konuşmacı / Sanatçı)
    @ViewBuilder
    private func roleChip(_ label: String) -> some View {
        Text(label)
            .font(.system(size: 10, weight: .bold, design: .rounded))
            .foregroundStyle(Color.hangelOrange)
            .padding(.horizontal, 7).padding(.vertical, 2)
            .background(Capsule().fill(Color.hangelOrange.opacity(0.15)))
    }
}
