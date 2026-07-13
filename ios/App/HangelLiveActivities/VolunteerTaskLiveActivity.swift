// VolunteerTaskLiveActivity — Gönüllülük (hangel orange, Apple tasarım dili).
//
// Etkinlik gibi 3 faz (cihazda otomatik ilerler):
//  • Başlamadan önce → Text(timerInterval:) canlı geri sayım.
//  • Sırasında → ProgressView(timerInterval: başlangıç...bitiş) AKIŞ-LINE'ı dolar.
//  • Bitince → "Tamamlandı".
// Aktivite tarihi yoksa (activityStart/EndEpoch=0) eski progressPercent davranışı.
//
// Attributes: taskTitle, ngoName, location, taskId, weather*, orgLogoName, activityStart/EndEpoch
// ContentState: minutesLeft, progressPercent, checkInOpen

import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.1, *)
struct VolunteerTaskLiveActivity: Widget {
    private enum Phase { case before, during, after, none }

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: VolunteerTaskAttributes.self) { context in
            lockScreenContent(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HangelLogoOrIcon(logoName: context.attributes.orgLogoName, systemName: "hand.raised.fill", size: 38)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    trailingMetric(context, big: true)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.taskTitle)
                            .font(.subheadline.bold()).foregroundStyle(.primary)
                            .lineLimit(2).minimumScaleFactor(0.85)
                        Text(context.attributes.ngoName)
                            .font(.caption2).foregroundStyle(.secondary)
                            .lineLimit(1).minimumScaleFactor(0.8)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    flowLine(context)
                }
            } compactLeading: {
                Image(systemName: "hand.raised.fill").foregroundStyle(Color.hangelOrange)
            } compactTrailing: {
                compactTrailing(context)
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

            // Başlık = en önemli öğe: logo | (2 satır kalın başlık + STK) | metrik.
            // .top hizalama + metriğin SABİT genişliği → metrik başlığı ezmez,
            // başlık 2 satıra yayılabilir, sağdaki sayaç asla taşmaz.
            HStack(alignment: .top, spacing: 12) {
                HangelLogoOrIcon(logoName: context.attributes.orgLogoName, systemName: "hand.raised.fill")

                VStack(alignment: .leading, spacing: 3) {
                    Text(context.attributes.taskTitle)
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(.primary)
                        .lineLimit(2)
                        .minimumScaleFactor(0.85)
                        .fixedSize(horizontal: false, vertical: true)
                    Label(volunteerSubtitle(context), systemImage: "building.2.crop.circle")
                        .font(.caption).foregroundStyle(.secondary)
                        .lineLimit(1).minimumScaleFactor(0.8)
                }
                Spacer(minLength: 6)
                trailingMetric(context, big: true)
            }

            flowLine(context)
        }
        .padding(14)
        .activityBackgroundTint(Color.hangelOrange.opacity(0.10))
        .activitySystemActionForegroundColor(.hangelOrange)
        // KİLİT EKRANI tıklama hedefi — dynamicIsland'da vardı, burada eksikti →
        // "canlı gönüllülüğe tıklayınca gitmiyor". Dokun → hangel://volunteer-task/{id}
        // → deep-link handler /volunteering/{id}'ye çevirir (native-bridge SCHEME_HOST_ROUTE).
        .widgetURL(URL(string: "hangel://volunteer-task/\(context.attributes.taskId)"))
    }

    // MARK: - Faz mantığı
    private func startDate(_ c: ActivityViewContext<VolunteerTaskAttributes>) -> Date? {
        c.attributes.activityStartEpoch > 0 ? Date(timeIntervalSince1970: c.attributes.activityStartEpoch / 1000.0) : nil
    }
    private func endDate(_ c: ActivityViewContext<VolunteerTaskAttributes>) -> Date? {
        c.attributes.activityEndEpoch > 0 ? Date(timeIntervalSince1970: c.attributes.activityEndEpoch / 1000.0) : nil
    }
    private func phase(_ c: ActivityViewContext<VolunteerTaskAttributes>) -> Phase {
        let now = Date()
        let s = startDate(c); let e = endDate(c)
        if s == nil && e == nil { return .none }
        if let s = s, now < s { return .before }
        if let e = e, now >= e { return .after }
        if let s = s, now >= s { return .during }
        return .none
    }

    // MARK: - Sağ metrik
    @ViewBuilder
    private func trailingMetric(_ c: ActivityViewContext<VolunteerTaskAttributes>, big: Bool) -> some View {
        let font: Font = big ? .system(.title3, design: .rounded).bold() : .caption2.bold()
        switch phase(c) {
        case .before:
            if let s = startDate(c) {
                // Uzak tarihte "N gün", <24 saatte canlı sayaç → asla taşmaz.
                HangelCountdownMetric(start: s, tint: .hangelOrange, big: big)
            } else { minutesFallback(c, font: font) }
        case .during:
            HStack(spacing: 4) {
                Circle().fill(Color.hangelEmergency).frame(width: 7, height: 7)
                Text("CANLI").font(big ? .caption.bold() : .caption2.bold()).foregroundStyle(Color.hangelEmergency)
            }
        case .after:
            Label("Bitti", systemImage: "checkmark.seal.fill")
                .font(big ? .caption.bold() : .caption2.bold()).foregroundStyle(.green).labelStyle(.titleAndIcon)
        case .none:
            minutesFallback(c, font: font)
        }
    }

    @ViewBuilder
    private func minutesFallback(_ c: ActivityViewContext<VolunteerTaskAttributes>, font: Font) -> some View {
        VStack(alignment: .trailing, spacing: 1) {
            Text("\(c.state.minutesLeft)dk").font(font).foregroundStyle(Color.hangelOrange)
            Text("kaldı").font(.caption2).foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private func compactTrailing(_ c: ActivityViewContext<VolunteerTaskAttributes>) -> some View {
        switch phase(c) {
        case .before:
            if let s = startDate(c) {
                // Dynamic Island'da da uzak tarihte "N gün", <24 saatte canlı sayaç.
                HangelCompactCountdown(start: s, tint: .hangelOrange)
            } else {
                Text("\(c.state.minutesLeft)dk").font(.caption2.bold()).foregroundStyle(Color.hangelOrange)
            }
        case .during:
            Image(systemName: "dot.radiowaves.left.and.right").foregroundStyle(Color.hangelEmergency)
        case .after:
            Image(systemName: "checkmark.seal.fill").foregroundStyle(.green)
        case .none:
            Text("\(c.state.minutesLeft)dk").font(.caption2.bold()).foregroundStyle(Color.hangelOrange)
        }
    }

    // MARK: - Akış-line
    @ViewBuilder
    private func flowLine(_ c: ActivityViewContext<VolunteerTaskAttributes>) -> some View {
        switch phase(c) {
        case .before:
            ProgressView(value: 0) {
                HStack {
                    Text("Başlangıca").font(.caption2).foregroundStyle(.secondary)
                    Spacer()
                    if let s = startDate(c) {
                        Text(s, format: .dateTime.day().month().hour().minute())
                            .font(.caption2.bold()).foregroundStyle(Color.hangelOrange)
                    }
                }
            }
            .tint(.hangelOrange)
        case .during:
            if let s = startDate(c), let e = endDate(c), s < e {
                ProgressView(timerInterval: s...e, countsDown: false) {
                    HStack {
                        Text("Görev akışı").font(.caption2.bold()).foregroundStyle(Color.hangelOrange)
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
                Text("Görev tamamlandı").font(.caption2.bold()).foregroundStyle(.green)
            }
            .tint(.green)
        case .none:
            // Aktivite tarihi yok → push ile ilerleyen progressPercent (eski davranış).
            ProgressView(value: clamped(c.state.progressPercent)) {
                HStack {
                    Text(c.state.checkInOpen ? "Check-in açık" : "Devam ediyor")
                        .font(.caption2.bold()).foregroundStyle(c.state.checkInOpen ? .green : .secondary)
                    Spacer()
                    Text("%\(Int(clamped(c.state.progressPercent) * 100))")
                        .font(.caption2.bold()).foregroundStyle(Color.hangelOrange)
                }
            }
            .tint(.hangelOrange)
        }
    }

    private func volunteerSubtitle(_ context: ActivityViewContext<VolunteerTaskAttributes>) -> String {
        let loc = context.attributes.location
        let ngo = context.attributes.ngoName
        if !ngo.isEmpty && !loc.isEmpty { return "\(ngo) · \(loc)" }
        return ngo.isEmpty ? loc : ngo
    }

    private func clamped(_ v: Double) -> Double { min(1.0, max(0.0, v)) }
}
