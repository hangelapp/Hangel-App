// EmergencyBloodLiveActivity — Acil kan ilanı Live Activity (hangel tasarım dili).
//
// Acil durum olduğu için aksan rengi semantik KIRMIZI (hangelEmergency); marka
// kimliği "hangel" wordmark + Apple-tarzı rozet/tipografi ile korunur.
//
// ContentState: distance, matchedDonors, minutesLeft, status
// Attributes:   bloodType, city, requestId, hospitalName
// Backend push (onEmergencyBloodUpdate) ContentState'i günceller → UI refresh.

import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.1, *)
struct EmergencyBloodLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: EmergencyBloodAttributes.self) { context in
            lockScreenContent(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HangelIconBadge(systemName: "drop.fill", top: .hangelEmergency, bottom: .hangelEmergencyDeep, size: 38)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    bloodTypePill(context.attributes.bloodType)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.hospitalName)
                            .font(.subheadline.bold()).lineLimit(1)
                        Text(context.state.distance)
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Label(context.state.status, systemImage: statusIcon(context.state.status))
                            .font(.caption2.bold()).foregroundStyle(statusColor(context.state.status))
                        Spacer()
                        Label("\(context.state.matchedDonors) bağışçı", systemImage: "person.2.fill")
                            .font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                        Label("\(context.state.minutesLeft) dk", systemImage: "clock")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
            } compactLeading: {
                Image(systemName: "drop.fill").foregroundStyle(Color.hangelEmergency)
            } compactTrailing: {
                Text(context.attributes.bloodType)
                    .font(.caption2.bold()).foregroundStyle(Color.hangelEmergency)
            } minimal: {
                Image(systemName: "drop.fill").foregroundStyle(Color.hangelEmergency)
            }
            .widgetURL(URL(string: "hangel://emergency-blood/\(context.attributes.requestId)"))
            .keylineTint(.hangelEmergency)
        }
    }

    // MARK: - Lock Screen
    @ViewBuilder
    private func lockScreenContent(context: ActivityViewContext<EmergencyBloodAttributes>) -> some View {
        VStack(spacing: 10) {
            HangelHeaderRow(kicker: "Acil Kan İhtiyacı", tint: .hangelEmergency)

            HStack(alignment: .center, spacing: 12) {
                HangelIconBadge(systemName: "drop.fill", top: .hangelEmergency, bottom: .hangelEmergencyDeep)

                VStack(alignment: .leading, spacing: 2) {
                    Text(context.attributes.hospitalName)
                        .font(.headline).lineLimit(1)
                    Text("\(context.attributes.city) · \(context.state.distance)")
                        .font(.caption2).foregroundStyle(.secondary).lineLimit(1)
                }
                Spacer(minLength: 0)
                bloodTypePill(context.attributes.bloodType)
            }

            Divider().opacity(0.4)

            HStack {
                Label("\(context.state.matchedDonors) bağışçı", systemImage: "person.2.fill")
                    .font(.caption2)
                Spacer()
                Label(context.state.status, systemImage: statusIcon(context.state.status))
                    .font(.caption2.bold()).foregroundStyle(statusColor(context.state.status))
                Spacer()
                Label("\(context.state.minutesLeft) dk", systemImage: "clock")
                    .font(.caption2).foregroundStyle(.secondary)
            }
        }
        .padding(14)
        .activityBackgroundTint(Color.hangelEmergency.opacity(0.10))
        .activitySystemActionForegroundColor(.hangelEmergency)
    }

    // MARK: - Helpers
    @ViewBuilder
    private func bloodTypePill(_ bloodType: String) -> some View {
        Text(bloodType)
            .font(.system(size: 15, weight: .heavy, design: .rounded))
            .foregroundStyle(.white)
            .minimumScaleFactor(0.6).lineLimit(1)
            .padding(.horizontal, 11).padding(.vertical, 5)
            .background(Capsule().fill(hangelGradient(.hangelEmergency, .hangelEmergencyDeep)))
    }

    private func statusIcon(_ status: String) -> String {
        switch status {
        case "Yola Çıktı": return "figure.walk"
        case "Tamamlandı": return "checkmark.seal.fill"
        default: return "exclamationmark.triangle.fill"
        }
    }

    private func statusColor(_ status: String) -> Color {
        switch status {
        case "Yola Çıktı": return .hangelOrange
        case "Tamamlandı": return .green
        default: return .hangelEmergency
        }
    }
}
