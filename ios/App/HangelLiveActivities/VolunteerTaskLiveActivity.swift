// VolunteerTaskLiveActivity — Gönüllülük görevi (hangel orange, Apple tasarım dili).
//
// ContentState: minutesLeft, progressPercent (0..1, backend push ile ilerler), checkInOpen
// Attributes:   taskTitle, ngoName, location, taskId

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
                    HangelLogoOrIcon(logoName: context.attributes.orgLogoName, systemName: "hand.raised.fill", size: 38)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 1) {
                        Text("\(context.state.minutesLeft)dk")
                            .font(.system(.title3, design: .rounded).bold())
                            .foregroundStyle(Color.hangelOrange)
                        Text("kaldı").font(.caption2).foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.taskTitle)
                            .font(.subheadline.bold()).lineLimit(1)
                        Text(context.attributes.ngoName)
                            .font(.caption2).foregroundStyle(.secondary).lineLimit(1)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ProgressView(value: clamped(context.state.progressPercent)).tint(.hangelOrange)
                }
            } compactLeading: {
                Image(systemName: "hand.raised.fill").foregroundStyle(Color.hangelOrange)
            } compactTrailing: {
                Text("\(context.state.minutesLeft)dk")
                    .font(.caption2.bold()).foregroundStyle(Color.hangelOrange)
            } minimal: {
                Image(systemName: "hand.raised.fill").foregroundStyle(Color.hangelOrange)
            }
            .widgetURL(URL(string: "hangel://volunteer-task/\(context.attributes.taskId)"))
            .keylineTint(.hangelOrange)
        }
    }

    @ViewBuilder
    private func lockScreenContent(context: ActivityViewContext<VolunteerTaskAttributes>) -> some View {
        VStack(spacing: 10) {
            HangelHeaderRow(kicker: "Gönüllülük", tint: .hangelOrange,
                            weatherEmoji: context.attributes.weatherEmoji, weatherTemp: context.attributes.weatherTemp)

            HStack(alignment: .center, spacing: 12) {
                HangelLogoOrIcon(logoName: context.attributes.orgLogoName, systemName: "hand.raised.fill")

                VStack(alignment: .leading, spacing: 3) {
                    Text(context.attributes.taskTitle)
                        .font(.headline).lineLimit(1)
                    Label(volunteerSubtitle(context), systemImage: "building.2.crop.circle")
                        .font(.caption2).foregroundStyle(.secondary).lineLimit(1)
                }
                Spacer(minLength: 0)

                VStack(alignment: .trailing, spacing: 1) {
                    Text("\(context.state.minutesLeft)dk")
                        .font(.system(.title3, design: .rounded).bold())
                        .foregroundStyle(Color.hangelOrange)
                    Text("kaldı").font(.caption2).foregroundStyle(.secondary)
                }
            }

            ProgressView(value: clamped(context.state.progressPercent)) {
                HStack {
                    Text(context.state.checkInOpen ? "Check-in açık" : "Devam ediyor")
                        .font(.caption2.bold())
                        .foregroundStyle(context.state.checkInOpen ? .green : .secondary)
                    Spacer()
                    Text("%\(Int(clamped(context.state.progressPercent) * 100))")
                        .font(.caption2.bold()).foregroundStyle(Color.hangelOrange)
                }
            }
            .tint(.hangelOrange)
        }
        .padding(14)
        .activityBackgroundTint(Color.hangelOrange.opacity(0.10))
        .activitySystemActionForegroundColor(.hangelOrange)
    }

    private func volunteerSubtitle(_ context: ActivityViewContext<VolunteerTaskAttributes>) -> String {
        let loc = context.attributes.location
        let ngo = context.attributes.ngoName
        if !ngo.isEmpty && !loc.isEmpty { return "\(ngo) · \(loc)" }
        return ngo.isEmpty ? loc : ngo
    }

    private func clamped(_ v: Double) -> Double { min(1.0, max(0.0, v)) }
}
