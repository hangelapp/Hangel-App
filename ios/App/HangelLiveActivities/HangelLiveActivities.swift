// HangelLiveActivities — Widget Extension WidgetBundle + paylaşılan hangel tasarım sistemi.
//
// WidgetKit + ActivityKit. iOS 16.1+ Lock Screen + Dynamic Island layout'ları
// burada `@main` WidgetBundle altında toplanır. 4 Live Activity tipi:
//   1. EmergencyBloodLiveActivity   (acil — kırmızı aksan)
//   2. VolunteerTaskLiveActivity    (hangel orange)
//   3. EventCountdownLiveActivity   (hangel orange, otomatik geri sayım)
//   4. DonationCampaignLiveActivity (hangel orange)
//
// Tasarım dili Apple HIG'e uygun: yuvarlak gradyan rozet ikon, net tipografi
// hiyerarşisi, "hangel" wordmark, marka rengi #f34723.
//
// Attribute tipleri ana app target'ından (HangelLiveActivityAttributes.swift)
// Target Membership: Yes ile paylaşılır.

import WidgetKit
import SwiftUI
import UIKit

// MARK: - hangel marka tasarım sistemi

extension Color {
    /// hangel marka turuncusu — splash backgroundColor (#f34723) ile aynı.
    static let hangelOrange = Color(red: 243.0/255.0, green: 71.0/255.0, blue: 35.0/255.0)
    static let hangelOrangeDeep = Color(red: 205.0/255.0, green: 48.0/255.0, blue: 16.0/255.0)
    /// Acil (kan) aksanı — semantik kırmızı.
    static let hangelEmergency = Color(red: 226.0/255.0, green: 27.0/255.0, blue: 38.0/255.0)
    static let hangelEmergencyDeep = Color(red: 176.0/255.0, green: 14.0/255.0, blue: 24.0/255.0)
}

/// İki renkli marka gradyanı (rozet/aksan dolgusu için).
@available(iOS 16.1, *)
func hangelGradient(_ top: Color, _ bottom: Color) -> LinearGradient {
    LinearGradient(colors: [top, bottom], startPoint: .topLeading, endPoint: .bottomTrailing)
}

// MARK: - Geri sayım metrik yardımcıları (paylaşılan)
//
// SORUN: Uzak bir başlangıç tarihinde `Text(timerInterval:)` HH:MM:SS gösterip
// "1633:32:4" gibi absürt (1633 saat!) taşan bir sayaç üretiyordu — başlığı ezip
// okunaksızlık yaratıyordu. ÇÖZÜM: >24 saat kaldıysa insan-okunur gün etiketi
// ("68 gün", "yarın"), yalnızca <24 saatte canlı tıkır tıkır sayaç.

/// Başlangıca kalan gün etiketi (Türkçe). now < start varsayılır.
/// >1 gün → "N gün", ==1 → "yarın", aynı gün → nil (canlı sayaç kullanılmalı).
@available(iOS 16.1, *)
func hangelDayLabel(until start: Date, now: Date = Date()) -> String? {
    let remaining = start.timeIntervalSince(now)
    guard remaining > 0 else { return nil }
    // 24 saatten az kaldıysa canlı sayaç anlamlı → gün etiketi kullanma.
    if remaining < 24 * 3600 { return nil }
    let days = Int(ceil(remaining / 86400.0))
    return days <= 1 ? "yarın" : "\(days) gün"
}

/// Faz-öncesi (before) sağ metrik: uzaksa "N gün / kaldı", yakınsa canlı HH:MM:SS sayaç.
/// Genişlik sabitlenir → asla taşmaz, başlığı ezmez.
@available(iOS 16.1, *)
struct HangelCountdownMetric: View {
    let start: Date
    var tint: Color = .hangelOrange
    var big: Bool = true

    var body: some View {
        let numberFont: Font = big
            ? .system(.title3, design: .rounded).bold()
            : .system(.caption, design: .rounded).bold()
        if let day = hangelDayLabel(until: start) {
            // Uzak tarih → sabit genişlikli, taşmayan gün etiketi.
            VStack(alignment: .trailing, spacing: 0) {
                Text(day)
                    .font(numberFont)
                    .foregroundStyle(tint)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                Text("kaldı")
                    .font(.system(size: big ? 10 : 9, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: big ? 68 : 46, alignment: .trailing)
        } else {
            // <24 saat → canlı tıkır tıkır sayaç (HH:MM:SS artık anlamlı).
            VStack(alignment: .trailing, spacing: 0) {
                Text(timerInterval: Date()...start, countsDown: true)
                    .font(numberFont)
                    .monospacedDigit()
                    .foregroundStyle(tint)
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: big ? 84 : 56, alignment: .trailing)
                if big {
                    Text("başlangıca")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
        }
    }
}

/// Dynamic Island compactTrailing için tek satırlık, dar geri sayım.
/// Uzaksa "N gün", yakınsa canlı sayaç.
@available(iOS 16.1, *)
struct HangelCompactCountdown: View {
    let start: Date
    var tint: Color = .hangelOrange

    var body: some View {
        if let day = hangelDayLabel(until: start) {
            Text(day)
                .font(.system(.caption, design: .rounded).bold())
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: 56)
        } else {
            Text(timerInterval: Date()...start, countsDown: true)
                .font(.system(.caption, design: .rounded).bold())
                .monospacedDigit()
                .foregroundStyle(tint)
                .frame(maxWidth: 54)
        }
    }
}

/// "hangel" wordmark — küçük marka etiketi (her zaman lowercase, marka kuralı).
@available(iOS 16.1, *)
struct HangelWordmark: View {
    var size: CGFloat = 12
    var body: some View {
        Text("hangel")
            .font(.system(size: size, weight: .heavy, design: .rounded))
            .foregroundStyle(Color.hangelOrange)
            .kerning(-0.4)
            .lineLimit(1)
            .fixedSize()        // dar alanda bile tam "hangel" yazsın, kesilmesin
    }
}

/// Tip ikonu — gradyan dolgulu yuvarlak rozet + SF Symbol (Apple-tarzı).
@available(iOS 16.1, *)
struct HangelIconBadge: View {
    let systemName: String
    var top: Color = .hangelOrange
    var bottom: Color = .hangelOrangeDeep
    var size: CGFloat = 46
    var body: some View {
        ZStack {
            Circle().fill(hangelGradient(top, bottom))
                .shadow(color: top.opacity(0.35), radius: 4, x: 0, y: 2)
            Image(systemName: systemName)
                .font(.system(size: size * 0.44, weight: .semibold))
                .foregroundStyle(.white)
        }
        .frame(width: size, height: size)
    }
}

/// App Group container'dan STK/kulüp logosunu yükle (plugin oraya indirir). Yoksa nil.
@available(iOS 16.1, *)
func hangelOrgLogo(_ name: String) -> UIImage? {
    guard !name.isEmpty,
          let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.hangel.app.shared")
    else { return nil }
    return UIImage(contentsOfFile: container.appendingPathComponent(name).path)
}

/// Org logosu varsa dairesel logo; yoksa SF Symbol gradyan rozet (fallback).
@available(iOS 16.1, *)
struct HangelLogoOrIcon: View {
    let logoName: String
    let systemName: String
    var top: Color = .hangelOrange
    var bottom: Color = .hangelOrangeDeep
    var size: CGFloat = 46
    var body: some View {
        if let img = hangelOrgLogo(logoName) {
            Image(uiImage: img).resizable().scaledToFill()
                .frame(width: size, height: size)
                .clipShape(Circle())
                .overlay(Circle().stroke(Color.hangelOrange.opacity(0.6), lineWidth: 1.5))
        } else {
            HangelIconBadge(systemName: systemName, top: top, bottom: bottom, size: size)
        }
    }
}

/// Hava durumu çipi (emoji + sıcaklık). İkisi de boşsa hiçbir şey çizmez —
/// böylece hava verisi yokken (çoğu online görev) başlık satırı boşluk bırakmaz,
/// düzen kasıtlı görünür.
@available(iOS 16.1, *)
struct HangelWeatherChip: View {
    let emoji: String
    let temp: String
    var body: some View {
        if !emoji.isEmpty || !temp.isEmpty {
            HStack(spacing: 3) {
                if !emoji.isEmpty { Text(emoji).font(.system(size: 12)) }
                if !temp.isEmpty {
                    Text(temp).font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(.primary)
                }
            }
            .padding(.horizontal, 7).padding(.vertical, 2)
            .background(Capsule().fill(Color.secondary.opacity(0.16)))
        }
    }
}

/// Üst satır: tip etiketi (sol) + opsiyonel hava durumu + hangel wordmark (sağ).
@available(iOS 16.1, *)
struct HangelHeaderRow: View {
    let kicker: String
    var tint: Color = .hangelOrange
    var weatherEmoji: String = ""
    var weatherTemp: String = ""
    var body: some View {
        HStack(spacing: 6) {
            Text(kicker.uppercased())
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(tint)
                .kerning(0.4)
            HangelWeatherChip(emoji: weatherEmoji, temp: weatherTemp)
            Spacer(minLength: 8)
            HangelWordmark(size: 12)
        }
    }
}

// Widget Extension iOS 16.1 deployment target ile build edilir.
@main
struct HangelLiveActivitiesBundle: WidgetBundle {
    var body: some Widget {
        EmergencyBloodLiveActivity()
        VolunteerTaskLiveActivity()
        EventCountdownLiveActivity()
        DonationCampaignLiveActivity()
        // Ana ekran widget'ları (araç takımı) — iOS 16.1+
        UpcomingEventWidget()
        ImpactScoreWidget()
        BloodStatusWidget()
        MarketplaceWidget()
        DonationsWidget()
        QuickAccessWidget()
        // Kilit ekranı (accessory) widget'ları — iOS 16+
        ImpactScoreLockWidget()
        UpcomingEventLockWidget()
        // Kontrol Merkezi denetimleri — iOS 18+ (koşullu)
        if #available(iOS 18.0, *) {
            EmergencyBloodControl()
            EventCheckinControl()
            QuickDonateControl()
            VolunteeringControl()
            MarketplaceControl()
            DonationsControl()
            ImpactReportControl()
        }
    }
}
