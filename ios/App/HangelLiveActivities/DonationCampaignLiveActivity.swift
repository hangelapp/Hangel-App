// DonationCampaignLiveActivity — Bağış kampanyası (hangel orange, Apple tasarım dili).
//
// ContentState: currentAmount, goalAmount, donorCount (backend push ile ilerler)
// Attributes:   campaignTitle, ngoName, campaignId

import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.1, *)
struct DonationCampaignLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DonationCampaignAttributes.self) { context in
            lockScreenContent(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HangelIconBadge(systemName: "heart.fill", size: 38)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 1) {
                        Text("%\(percentInt(context.state.currentAmount, context.state.goalAmount))")
                            .font(.system(.title3, design: .rounded).bold())
                            .foregroundStyle(Color.hangelOrange)
                        Text("\(context.state.donorCount) bağış")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.campaignTitle)
                            .font(.subheadline.bold()).foregroundStyle(.primary)
                            .lineLimit(2).minimumScaleFactor(0.85)
                        Text(context.attributes.ngoName)
                            .font(.caption2).foregroundStyle(.secondary)
                            .lineLimit(1).minimumScaleFactor(0.8)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ProgressView(value: ratio(context.state.currentAmount, context.state.goalAmount)).tint(.hangelOrange)
                }
            } compactLeading: {
                Image(systemName: "heart.fill").foregroundStyle(Color.hangelOrange)
            } compactTrailing: {
                Text("%\(percentInt(context.state.currentAmount, context.state.goalAmount))")
                    .font(.caption2.bold()).foregroundStyle(Color.hangelOrange)
            } minimal: {
                Image(systemName: "heart.fill").foregroundStyle(Color.hangelOrange)
            }
            .widgetURL(URL(string: "hangel://campaign/\(context.attributes.campaignId)"))
            .keylineTint(.hangelOrange)
        }
    }

    @ViewBuilder
    private func lockScreenContent(context: ActivityViewContext<DonationCampaignAttributes>) -> some View {
        VStack(spacing: 10) {
            HangelHeaderRow(kicker: "Bağış Kampanyası", tint: .hangelOrange)

            HStack(alignment: .top, spacing: 12) {
                HangelIconBadge(systemName: "heart.fill")

                VStack(alignment: .leading, spacing: 3) {
                    Text(context.attributes.campaignTitle)
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(.primary)
                        .lineLimit(2).minimumScaleFactor(0.85)
                        .fixedSize(horizontal: false, vertical: true)
                    Label(context.attributes.ngoName, systemImage: "building.2.crop.circle")
                        .font(.caption).foregroundStyle(.secondary)
                        .lineLimit(1).minimumScaleFactor(0.8)
                }
                Spacer(minLength: 6)

                VStack(alignment: .trailing, spacing: 0) {
                    Text(formatTRY(context.state.currentAmount))
                        .font(.system(.callout, design: .rounded).bold()).foregroundStyle(Color.hangelOrange)
                        .lineLimit(1).minimumScaleFactor(0.7)
                    Text("/ \(formatTRY(context.state.goalAmount))")
                        .font(.caption2).foregroundStyle(.secondary)
                        .lineLimit(1).minimumScaleFactor(0.7)
                }
                .frame(maxWidth: 110, alignment: .trailing)
            }

            ProgressView(value: ratio(context.state.currentAmount, context.state.goalAmount)) {
                HStack {
                    Text("Hedefe %\(percentInt(context.state.currentAmount, context.state.goalAmount))")
                        .font(.caption2.bold()).foregroundStyle(Color.hangelOrange)
                    Spacer()
                    Text("\(context.state.donorCount) bağışçı")
                        .font(.caption2).foregroundStyle(.secondary)
                }
            }
            .tint(.hangelOrange)
        }
        .padding(14)
        .activityBackgroundTint(Color.hangelOrange.opacity(0.10))
        .activitySystemActionForegroundColor(.hangelOrange)
    }

    private func ratio(_ current: Double, _ goal: Double) -> Double {
        guard goal > 0 else { return 0 }
        return min(1.0, max(0.0, current / goal))
    }

    private func percentInt(_ current: Double, _ goal: Double) -> Int {
        Int(round(ratio(current, goal) * 100))
    }

    private func formatTRY(_ value: Double) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.maximumFractionDigits = 0
        f.groupingSeparator = "."
        let str = f.string(from: NSNumber(value: value)) ?? "\(Int(value))"
        return "\(str)₺"
    }
}
