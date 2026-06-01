// DonationCampaignLiveActivity — Bağış kampanyası progress Live Activity.
//
// ContentState:
//   currentAmount    güncel toplam (TRY)
//   goalAmount       hedef
//   donorCount       bağışçı sayısı
//
// Attributes:
//   campaignTitle
//   ngoName
//   campaignId
//
// Lock Screen'de progress bar + miktar görselleştirmesi, Dynamic Island'da
// yüzde tamamlanma.

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
                    Image(systemName: "heart.circle.fill")
                        .foregroundStyle(.pink)
                        .font(.title3)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("%\(percentInt(current: context.state.currentAmount, goal: context.state.goalAmount))")
                            .font(.title3).bold()
                            .foregroundStyle(.white)
                        Text("\(context.state.donorCount) bağış")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.campaignTitle)
                            .font(.subheadline).bold()
                            .lineLimit(1)
                        Text(context.attributes.ngoName)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ProgressView(value: progressRatio(current: context.state.currentAmount, goal: context.state.goalAmount))
                        .tint(.pink)
                }
            } compactLeading: {
                Image(systemName: "heart.circle.fill")
                    .foregroundStyle(.pink)
            } compactTrailing: {
                Text("%\(percentInt(current: context.state.currentAmount, goal: context.state.goalAmount))")
                    .font(.caption2.bold())
                    .foregroundStyle(.pink)
            } minimal: {
                Image(systemName: "heart.circle.fill")
                    .foregroundStyle(.pink)
            }
            .widgetURL(URL(string: "hangel://campaign/\(context.attributes.campaignId)"))
            .keylineTint(.pink)
        }
    }

    @ViewBuilder
    private func lockScreenContent(context: ActivityViewContext<DonationCampaignAttributes>) -> some View {
        VStack(spacing: 10) {
            HStack(alignment: .center, spacing: 12) {
                ZStack {
                    Circle().fill(.pink)
                    Image(systemName: "heart.fill")
                        .foregroundStyle(.white)
                        .font(.title3)
                }
                .frame(width: 44, height: 44)

                VStack(alignment: .leading, spacing: 2) {
                    Text(context.attributes.ngoName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(context.attributes.campaignTitle)
                        .font(.headline)
                        .lineLimit(1)
                    Text("\(context.state.donorCount) bağışçı")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                VStack(alignment: .trailing, spacing: 0) {
                    Text(formatTRY(context.state.currentAmount))
                        .font(.callout.bold())
                        .foregroundStyle(.pink)
                    Text("/ \(formatTRY(context.state.goalAmount))")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            ProgressView(value: progressRatio(current: context.state.currentAmount, goal: context.state.goalAmount)) {
                HStack {
                    Text("Hedefe %\(percentInt(current: context.state.currentAmount, goal: context.state.goalAmount))")
                        .font(.caption2.bold())
                        .foregroundStyle(.pink)
                    Spacer()
                }
            }
            .tint(.pink)
        }
        .padding(14)
        .activityBackgroundTint(Color.pink.opacity(0.08))
        .activitySystemActionForegroundColor(.pink)
    }

    private func progressRatio(current: Double, goal: Double) -> Double {
        guard goal > 0 else { return 0 }
        return min(1.0, max(0.0, current / goal))
    }

    private func percentInt(current: Double, goal: Double) -> Int {
        Int(round(progressRatio(current: current, goal: goal) * 100))
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
