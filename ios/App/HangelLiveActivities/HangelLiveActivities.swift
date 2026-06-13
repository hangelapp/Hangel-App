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

/// Üst satır: tip etiketi (sol) + hangel wordmark (sağ). Tüm Live Activity'lerde ortak.
@available(iOS 16.1, *)
struct HangelHeaderRow: View {
    let kicker: String
    var tint: Color = .hangelOrange
    var body: some View {
        HStack(spacing: 6) {
            Text(kicker.uppercased())
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(tint)
                .kerning(0.4)
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
    }
}
