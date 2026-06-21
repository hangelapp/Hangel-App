// ContentView — Watch ana ekranı (3 sayfa: Etki · Acil Kan · Hızlı Aksiyon).
//
// Dikey sayfalama (TabView). Veri iPhone'dan WatchConnectivity ile gelir
// (userStats + emergencyBlood payload'ları). Aksiyonlar iPhone'da ilgili
// hangel sayfasını açar (openOnPhone). Apple kimliği: marka mercanı, net tipografi.

import SwiftUI

extension Color {
    static let hangelCoral = Color(red: 243.0 / 255.0, green: 71.0 / 255.0, blue: 35.0 / 255.0)
}

struct ContentView: View {
    @EnvironmentObject var manager: WatchConnectivityManager

    var body: some View {
        TabView {
            EtkiView()
            BloodView()
            AksiyonView()
        }
    }
}

// MARK: - Etki (puan + günlük seri + yaklaşan etkinlik)

private struct EtkiView: View {
    @EnvironmentObject var manager: WatchConnectivityManager
    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                Text("hangel")
                    .font(.system(size: 15, weight: .heavy, design: .rounded))
                    .foregroundStyle(Color.hangelCoral)
                VStack(spacing: 2) {
                    Text("\(manager.impactScore)")
                        .font(.system(size: 46, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .minimumScaleFactor(0.5).lineLimit(1)
                    Text("Etki Puanı").font(.caption2).foregroundStyle(.secondary)
                }
                if manager.streak > 0 {
                    Label("\(manager.streak) gün seri", systemImage: "flame.fill")
                        .font(.caption.bold())
                        .foregroundStyle(.orange)
                        .padding(.horizontal, 10).padding(.vertical, 5)
                        .background(Capsule().fill(Color.orange.opacity(0.15)))
                }
                if !manager.nextEventTitle.isEmpty {
                    VStack(spacing: 2) {
                        Text("Yaklaşan").font(.system(size: 10, weight: .semibold)).foregroundStyle(.secondary)
                        Text(manager.nextEventTitle).font(.caption).bold()
                            .multilineTextAlignment(.center).lineLimit(2)
                        if !manager.nextEventWhen.isEmpty {
                            Text(manager.nextEventWhen).font(.caption2).foregroundStyle(.secondary)
                        }
                    }.padding(.top, 2)
                }
            }
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity)
        }
    }
}

// MARK: - Acil Kan (mevcut liste)

private struct BloodView: View {
    @EnvironmentObject var manager: WatchConnectivityManager
    var body: some View {
        NavigationStack {
            Group {
                if manager.emergencies.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "drop.fill").font(.system(size: 26)).foregroundStyle(.red)
                        Text("Acil kan ihtiyacı yok").font(.headline).multilineTextAlignment(.center)
                        Text(manager.isReachable ? "iPhone bağlı" : "iPhone uyuyor olabilir")
                            .font(.caption2).foregroundStyle(.secondary)
                    }.padding()
                } else {
                    List {
                        ForEach(manager.emergencies) { item in
                            NavigationLink(value: item) { EmergencyRow(item: item) }
                        }
                    }
                    .navigationDestination(for: EmergencyBlood.self) { item in
                        EmergencyBloodDetailView(item: item)
                    }
                }
            }
            .navigationTitle("Acil Kan")
        }
    }
}

// MARK: - Hızlı Aksiyon (iPhone'da ilgili sayfayı açar)

private struct AksiyonView: View {
    @EnvironmentObject var manager: WatchConnectivityManager
    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                if manager.bloodUrgent {
                    Label("Yakınında acil kan ihtiyacı", systemImage: "exclamationmark.triangle.fill")
                        .font(.caption2.bold()).foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                ActionButton(title: "Check-in", icon: "qrcode.viewfinder", tint: .hangelCoral) {
                    manager.openOnPhone("hangel://events")
                }
                ActionButton(title: "Acil Kan", icon: "drop.fill", tint: .red) {
                    manager.openOnPhone("hangel://blood")
                }
                ActionButton(title: "Gönüllülük", icon: "hand.raised.fill", tint: .hangelCoral) {
                    manager.openOnPhone("hangel://volunteering")
                }
                ActionButton(title: "Etki Hikayem", icon: "chart.line.uptrend.xyaxis", tint: .hangelCoral) {
                    manager.openOnPhone("hangel://impact-story")
                }
            }
            .padding(.horizontal, 4).padding(.vertical, 6)
            .navigationTitle("Hızlı")
        }
    }
}

private struct ActionButton: View {
    let title: String
    let icon: String
    let tint: Color
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                Text(title).font(.system(size: 15, weight: .semibold))
                Spacer(minLength: 0)
            }
        }
        .tint(tint)
        .buttonStyle(.borderedProminent)
    }
}

// MARK: - Acil kan satırı

private struct EmergencyRow: View {
    let item: EmergencyBlood
    var body: some View {
        HStack(spacing: 8) {
            ZStack {
                Circle().fill(.red).frame(width: 32, height: 32)
                Text(item.bloodType).font(.caption).bold().foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(item.hospital).font(.caption).bold().lineLimit(1)
                HStack(spacing: 4) {
                    Text(item.city)
                    if let d = item.distanceKm { Text("· \(String(format: "%.1f", d)) km") }
                }
                .font(.caption2).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}

#Preview {
    let m = WatchConnectivityManager.shared
    m.injectMockEmergency()
    return ContentView().environmentObject(m)
}
