// EventCountdownLiveActivity — Etkinlik geri sayımı (hangel orange, Apple tasarım dili).
//
// "Süreç ilerlemesi": geri sayım cihazda Text(timerInterval:) ile OTOMATİK tıklar
// (push gerekmez). eventStartEpoch (ms) attribute'ünden hedef tarih hesaplanır.
//
// ContentState: minutesLeft (yedek), statusLabel ("Kayıtlı"/"Yarın"/"Başladı")
// Attributes:   eventTitle, location, eventId, eventStartEpoch

import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.1, *)
struct EventCountdownLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: EventCountdownAttributes.self) { context in
            lockScreenContent(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HangelIconBadge(systemName: "calendar", size: 38)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 1) {
                        countdown(context, font: .system(.title3, design: .rounded).bold(), width: 96)
                        Text("kaldı").font(.caption2).foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.eventTitle)
                            .font(.subheadline.bold()).lineLimit(1)
                        Text(context.attributes.location)
                            .font(.caption2).foregroundStyle(.secondary).lineLimit(1)
                    }
                }
            } compactLeading: {
                Image(systemName: "calendar").foregroundStyle(Color.hangelOrange)
            } compactTrailing: {
                countdown(context, font: .caption2.bold(), width: 56)
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

                VStack(alignment: .leading, spacing: 3) {
                    Text(context.attributes.eventTitle)
                        .font(.headline).lineLimit(1)
                    Label(context.attributes.location, systemImage: "mappin.and.ellipse")
                        .font(.caption2).foregroundStyle(.secondary).lineLimit(1)
                }
                Spacer(minLength: 0)

                VStack(alignment: .trailing, spacing: 1) {
                    countdown(context, font: .system(.title3, design: .rounded).bold(), width: 110)
                    Text(targetDate(context) != nil ? "kaldı" : context.state.statusLabel)
                        .font(.caption2).foregroundStyle(.secondary)
                }
            }
        }
        .padding(14)
        .activityBackgroundTint(Color.hangelOrange.opacity(0.10))
        .activitySystemActionForegroundColor(.hangelOrange)
    }

    // MARK: - Otomatik geri sayım
    private func targetDate(_ context: ActivityViewContext<EventCountdownAttributes>) -> Date? {
        let epoch = context.attributes.eventStartEpoch
        guard epoch > 0 else { return nil }
        let d = Date(timeIntervalSince1970: epoch / 1000.0)
        return d > Date() ? d : nil
    }

    @ViewBuilder
    private func countdown(_ context: ActivityViewContext<EventCountdownAttributes>, font: Font, width: CGFloat) -> some View {
        if let target = targetDate(context) {
            // Cihazda kendiliğinden tıklayan canlı geri sayım.
            Text(timerInterval: Date()...target, countsDown: true)
                .font(font).monospacedDigit()
                .foregroundStyle(Color.hangelOrange)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: width, alignment: .trailing)
        } else {
            Text(context.state.statusLabel)
                .font(font).foregroundStyle(Color.hangelOrange)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
    }
}
