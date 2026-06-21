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

/// Hava durumu çipi (emoji + sıcaklık). İkisi de boşsa hiçbir şey çizmez.
@available(iOS 16.1, *)
struct HangelWeatherChip: View {
    let emoji: String
    let temp: String
    var body: some View {
        if !emoji.isEmpty || !temp.isEmpty {
            HStack(spacing: 3) {
                if !emoji.isEmpty { Text(emoji).font(.system(size: 11)) }
                if !temp.isEmpty {
                    Text(temp).font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal, 6).padding(.vertical, 2)
            .background(Capsule().fill(Color.secondary.opacity(0.12)))
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
        // Kontrol Merkezi denetimleri — iOS 18+ (koşullu)
        if #available(iOS 18.0, *) {
            EmergencyBloodControl()
            EventCheckinControl()
            QuickDonateControl()
            VolunteeringControl()
            MarketplaceControl()
        }
    }
}
