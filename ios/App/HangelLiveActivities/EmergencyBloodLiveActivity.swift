// EmergencyBloodLiveActivity — Acil kan ilanı Live Activity layout'u.
//
// İki yüzü vardır:
//  1. Lock Screen / Notification Center yüzü (lockScreenContent)
//  2. Dynamic Island (iPhone 14 Pro+) compact / minimal / expanded
//
// ContentState (HangelLiveActivityAttributes.swift):
//   distance        "1.2 km uzakta"
//   matchedDonors   0..4
//   minutesLeft     dakika cinsinden kalan süre
//   status          "Bekleniyor" | "Yola Çıktı" | "Tamamlandı"
//
// Attributes:
//   bloodType "A Rh+"
//   city
//   requestId
//   hospitalName
//
// Backend push güncellemeleri: ContentState alanlarını güncelleyince UI
// otomatik refresh (WidgetKit timeline).

import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.1, *)
struct EmergencyBloodLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: EmergencyBloodAttributes.self) { context in
            // Lock Screen / Notification Center layout
            lockScreenContent(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded (long-press / pinch-out)
                DynamicIslandExpandedRegion(.leading) {
                    bloodBadge(bloodType: context.attributes.bloodType)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(context.state.matchedDonors)")
                            .font(.title2).bold()
                            .foregroundStyle(.white)
                        Text("eşleşen")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.hospitalName)
                            .font(.subheadline).bold()
                            .lineLimit(1)
                        Text(context.state.distance)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Label(context.state.status, systemImage: statusIcon(context.state.status))
                            .font(.caption)
                            .foregroundStyle(.white)
                        Spacer()
                        Label("\(context.state.minutesLeft) dk", systemImage: "clock")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            } compactLeading: {
                bloodBadge(bloodType: context.attributes.bloodType)
                    .frame(width: 24, height: 24)
            } compactTrailing: {
                Text("\(context.state.minutesLeft)dk")
                    .font(.caption2.bold())
                    .foregroundStyle(.red)
            } minimal: {
                bloodBadge(bloodType: context.attributes.bloodType)
                    .frame(width: 22, height: 22)
            }
            .widgetURL(URL(string: "hangel://emergency-blood/\(context.attributes.requestId)"))
            .keylineTint(.red)
        }
    }

    // MARK: - Lock Screen
    @ViewBuilder
    private func lockScreenContent(context: ActivityViewContext<EmergencyBloodAttributes>) -> some View {
        VStack(spacing: 10) {
            HStack(alignment: .center, spacing: 12) {
                bloodBadge(bloodType: context.attributes.bloodType)
                    .frame(width: 56, height: 56)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Acil Kan İhtiyacı")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(context.attributes.hospitalName)
                        .font(.headline)
                        .lineLimit(1)
                    Text("\(context.attributes.city) · \(context.state.distance)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
            }

            Divider()

            HStack {
                Label("\(context.state.matchedDonors) bağışçı", systemImage: "person.2.fill")
                    .font(.caption)
                Spacer()
                Label(context.state.status, systemImage: statusIcon(context.state.status))
                    .font(.caption.bold())
                    .foregroundStyle(statusColor(context.state.status))
                Spacer()
                Label("\(context.state.minutesLeft) dk", systemImage: "clock")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(14)
        .activityBackgroundTint(Color.red.opacity(0.08))
        .activitySystemActionForegroundColor(Color.red)
    }

    // MARK: - Helpers
    @ViewBuilder
    private func bloodBadge(bloodType: String) -> some View {
        ZStack {
            Circle().fill(.red)
            Text(bloodType)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white)
                .minimumScaleFactor(0.5)
                .lineLimit(1)
                .padding(.horizontal, 2)
        }
    }

    private func statusIcon(_ status: String) -> String {
        switch status {
        case "Yola Çıktı": return "car.fill"
        case "Tamamlandı": return "checkmark.seal.fill"
        default: return "exclamationmark.triangle.fill"
        }
    }

    private func statusColor(_ status: String) -> Color {
        switch status {
        case "Yola Çıktı": return .orange
        case "Tamamlandı": return .green
        default: return .red
        }
    }
}
