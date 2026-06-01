// EventCountdownLiveActivity — Etkinlik geri sayımı Live Activity layout'u.
//
// ContentState:
//   minutesLeft   etkinlik başlangıcına kalan dakika
//   statusLabel   "Yarın", "Bugün", "Devam ediyor", vb.
//
// Attributes:
//   eventTitle
//   location
//   eventId

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
                    Image(systemName: "calendar.badge.clock")
                        .foregroundStyle(.blue)
                        .font(.title3)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(formattedTime(context.state.minutesLeft))
                            .font(.title3).bold()
                            .foregroundStyle(.white)
                        Text(context.state.statusLabel)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.eventTitle)
                            .font(.subheadline).bold()
                            .lineLimit(1)
                        Text(context.attributes.location)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            } compactLeading: {
                Image(systemName: "calendar.badge.clock")
                    .foregroundStyle(.blue)
            } compactTrailing: {
                Text(formattedTime(context.state.minutesLeft))
                    .font(.caption2.bold())
                    .foregroundStyle(.blue)
            } minimal: {
                Image(systemName: "calendar.badge.clock")
                    .foregroundStyle(.blue)
            }
            .widgetURL(URL(string: "hangel://event/\(context.attributes.eventId)"))
            .keylineTint(.blue)
        }
    }

    @ViewBuilder
    private func lockScreenContent(context: ActivityViewContext<EventCountdownAttributes>) -> some View {
        HStack(alignment: .center, spacing: 12) {
            ZStack {
                Circle().fill(.blue)
                Image(systemName: "calendar.badge.clock")
                    .foregroundStyle(.white)
                    .font(.title3)
            }
            .frame(width: 44, height: 44)

            VStack(alignment: .leading, spacing: 2) {
                Text("Etkinlik · \(context.state.statusLabel)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(context.attributes.eventTitle)
                    .font(.headline)
                    .lineLimit(1)
                Text(context.attributes.location)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 0)

            VStack(alignment: .trailing, spacing: 2) {
                Text(formattedTime(context.state.minutesLeft))
                    .font(.title3.bold())
                    .foregroundStyle(.blue)
                Text("kaldı")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(14)
        .activityBackgroundTint(Color.blue.opacity(0.08))
        .activitySystemActionForegroundColor(.blue)
    }

    private func formattedTime(_ minutes: Int) -> String {
        if minutes < 60 { return "\(minutes)dk" }
        let hours = minutes / 60
        let mins = minutes % 60
        if hours < 24 {
            return mins == 0 ? "\(hours)sa" : "\(hours)sa \(mins)dk"
        }
        let days = hours / 24
        return "\(days)g"
    }
}
