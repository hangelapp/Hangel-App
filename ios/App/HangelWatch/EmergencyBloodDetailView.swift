// EmergencyBloodDetailView — Acil kan ihtiyacı detay + 2 büyük buton.
//
// "Yardım Edebilirim" (yeşil) ve "Edemiyorum" (gri/kırmızı) butonlarını
// WCSession.sendMessage / transferUserInfo ile iPhone'a iletir; iPhone
// tarafı HangelWatchConnectivityPlugin bunu web'e `watchResponse` event'i
// olarak iletir.

import SwiftUI

struct EmergencyBloodDetailView: View {
    @EnvironmentObject var manager: WatchConnectivityManager
    @Environment(\.dismiss) private var dismiss

    let item: EmergencyBlood
    @State private var responded: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                bloodBadge

                VStack(spacing: 2) {
                    Text(item.hospital)
                        .font(.headline)
                        .multilineTextAlignment(.center)
                    Text(item.city)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if let d = item.distanceKm {
                        Text(String(format: "%.1f km uzakta", d))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }

                if responded {
                    Label("Yanıt gönderildi", systemImage: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                        .font(.caption)
                } else {
                    buttons
                }
            }
            .padding(.vertical, 8)
        }
        .navigationTitle(item.bloodType)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var bloodBadge: some View {
        ZStack {
            Circle().fill(.red).frame(width: 72, height: 72)
            Text(item.bloodType)
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(.white)
        }
    }

    private var buttons: some View {
        VStack(spacing: 8) {
            Button {
                manager.replyToEmergency(id: item.id, canHelp: true)
                responded = true
            } label: {
                Label("Yardım Edebilirim", systemImage: "checkmark")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .tint(.green)
            .buttonStyle(.borderedProminent)

            Button {
                manager.replyToEmergency(id: item.id, canHelp: false)
                responded = true
            } label: {
                Label("Edemiyorum", systemImage: "xmark")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .tint(.gray)
            .buttonStyle(.bordered)
        }
    }
}

#Preview {
    NavigationStack {
        EmergencyBloodDetailView(item: EmergencyBlood(
            id: "preview",
            bloodType: "0-",
            city: "İstanbul",
            hospital: "Acıbadem Maslak Hastanesi",
            distanceKm: 1.4,
            createdAt: Date().timeIntervalSince1970
        ))
        .environmentObject(WatchConnectivityManager.shared)
    }
}
