// VolunteerTaskLiveActivity — Gönüllülük görevi Live Activity layout'u.
//
// ContentState:
//   minutesLeft       kalan dakika (görev bitiş geri sayımı)
//   progressPercent   0.0..1.0
//   checkInOpen       check-in butonu aktif mi
//
// Attributes:
//   taskTitle
//   ngoName
//   location
//   taskId
//
// Lock Screen'de progress bar + check-in CTA, Dynamic Island'da kompakt
// dakika sayacı.

import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.1, *)
struct VolunteerTaskLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: VolunteerTaskAttributes.self) { context in
            lockScreenContent(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "hands.sparkles.fill")
                        .foregroundStyle(.purple)
                        .font(.title3)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(context.state.minutesLeft)dk")
                            .font(.title3).bold()
                            .foregroundStyle(.white)
                        Text("kaldı")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.taskTitle)
                            .font(.subheadline).bold()
                            .lineLimit(1)
                        Text(context.attributes.ngoName)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ProgressView(value: context.state.progressPercent)
                        .tint(.purple)
                }
            } compactLeading: {
                Image(systemName: "hands.sparkles.fill")
                    .foregroundStyle(.purple)
            } compactTrailing: {
                Text("\(context.state.minutesLeft)dk")
                    .font(.caption2.bold())
                    .foregroundStyle(.purple)
            } minimal: {
                Image(systemName: "hands.sparkles.fill")
                    .foregroundStyle(.purple)
            }
            .widgetURL(URL(string: "hangel://volunteer-task/\(context.attributes.taskId)"))
            .keylineTint(.purple)
        }
    }

    @ViewBuilder
    private func lockScreenContent(context: ActivityViewContext<VolunteerTaskAttributes>) -> some View {
        VStack(spacing: 10) {
            HStack(alignment: .center, spacing: 12) {
                ZStack {
                    Circle().fill(.purple)
                    Image(systemName: "hands.sparkles.fill")
                        .foregroundStyle(.white)
                        .font(.title3)
                }
                .frame(width: 44, height: 44)

                VStack(alignment: .leading, spacing: 2) {
                    Text(context.attributes.ngoName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(context.attributes.taskTitle)
                        .font(.headline)
                        .lineLimit(1)
                    Text(context.attributes.location)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
            }

            ProgressView(value: context.state.progressPercent) {
                HStack {
                    Text(context.state.checkInOpen ? "Check-in açık" : "Devam ediyor")
                        .font(.caption2.bold())
                        .foregroundStyle(context.state.checkInOpen ? .green : .secondary)
                    Spacer()
                    Text("\(context.state.minutesLeft) dk kaldı")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .tint(.purple)
        }
        .padding(14)
        .activityBackgroundTint(Color.purple.opacity(0.08))
        .activitySystemActionForegroundColor(.purple)
    }
}
