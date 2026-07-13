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
import AppIntents

// Kilit ekranı Live Activity butonu (iOS 17+ etkileşimli):
// dokununca uygulamayı açar ve etkinlikler sayfasına götürür (check-in için).
@available(iOS 18.0, *)
struct LiveActivityCheckinIntent: AppIntent {
    static var title: LocalizedStringResource = "Etkinlik check-in"
    static var openAppWhenRun: Bool = true
    @MainActor func perform() async throws -> some IntentResult & OpensIntent {
        .result(opensIntent: OpenURLIntent(URL(string: "hangel://events")!))
    }
}

@available(iOS 16.1, *)
struct EventCountdownLiveActivity: Widget {
    private enum Phase { case before, during, after }

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: EventCountdownAttributes.self) { context in
            lockScreenContent(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HangelLogoOrIcon(logoName: context.attributes.orgLogoName, systemName: "calendar", size: 38)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    trailingMetric(context, big: true)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 2) {
                        Text(context.attributes.eventTitle)
                            .font(.subheadline.bold()).foregroundStyle(.primary)
                            .lineLimit(2).minimumScaleFactor(0.85)
                        Text(context.state.statusLabel)
                            .font(.caption2).foregroundStyle(Color.hangelOrange)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 8) {
                        flowLine(context)
                        checkinButton
                    }
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
            HangelHeaderRow(kicker: "Etkinlik", tint: .hangelOrange,
                            weatherEmoji: context.attributes.weatherEmoji, weatherTemp: context.attributes.weatherTemp)

            HStack(alignment: .top, spacing: 12) {
                HangelLogoOrIcon(logoName: context.attributes.orgLogoName, systemName: "calendar")

                VStack(alignment: .leading, spacing: 4) {
                    Text(context.attributes.eventTitle)
                        .font(.system(.headline, design: .rounded).weight(.bold))
                        .foregroundStyle(.primary)
                        .lineLimit(2)
                        .minimumScaleFactor(0.85)
                        .fixedSize(horizontal: false, vertical: true)
                    HStack(spacing: 6) {
                        roleChip(context.state.statusLabel)
                        Label(context.attributes.location, systemImage: "mappin.and.ellipse")
                            .font(.caption).foregroundStyle(.secondary)
                            .lineLimit(1).minimumScaleFactor(0.8)
                    }
                }
                Spacer(minLength: 6)
                trailingMetric(context, big: true)
            }

            flowLine(context)

            checkinButton
        }
        .padding(14)
        .activityBackgroundTint(Color.hangelOrange.opacity(0.10))
        .activitySystemActionForegroundColor(.hangelOrange)
        // Kilit ekranındaki canlı etkinliğe dokununca da uygulamayı ilgili
        // etkinliğe götür (dynamicIsland'da vardı, lock screen'de eksikti → "tıklayınca gitmiyor").
        .widgetURL(URL(string: "hangel://event/\(context.attributes.eventId)"))
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
                // Uzak tarihte "N gün", <24 saatte canlı sayaç → "1633:32:4" taşması yok.
                HangelCountdownMetric(start: s, tint: .hangelOrange, big: big)
            } else {
                Text(c.state.statusLabel).font(font).foregroundStyle(Color.hangelOrange)
                    .lineLimit(1).minimumScaleFactor(0.7).frame(maxWidth: big ? 84 : 56, alignment: .trailing)
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
            // Başlamadan önce: son 2 saatte kendiliğinden ilerleyen akış çizgisi
            // (başlangıca yaklaştıkça dolar) + başlangıç saati.
            if let s = startDate(c) {
                let windowStart = s.addingTimeInterval(-2 * 3600)
                ProgressView(timerInterval: windowStart...s, countsDown: false) {
                    HStack {
                        Text("Etkinliğe kaldı").font(.caption2).foregroundStyle(.secondary)
                        Spacer()
                        Text(s, format: .dateTime.hour().minute())
                            .font(.caption2.bold()).foregroundStyle(Color.hangelOrange)
                    }
                }
                .tint(.hangelOrange)
            } else {
                ProgressView(value: 0) {
                    Text("Etkinliğe kaldı").font(.caption2).foregroundStyle(.secondary)
                }
                .tint(.hangelOrange)
            }
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

    // MARK: - Check-in butonu (yalnızca iOS 17+ etkileşimli; iOS 16'da görünmez)
    @ViewBuilder
    private var checkinButton: some View {
        if #available(iOS 18.0, *) {
            Button(intent: LiveActivityCheckinIntent()) {
                Label("Check-in", systemImage: "qrcode.viewfinder")
                    .font(.caption.bold())
            }
            .tint(.hangelOrange)
            .buttonStyle(.borderedProminent)
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
