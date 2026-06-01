// ContentView — Watch ana ekranı.
//
// Acil kan ihtiyacı listesi (SwiftUI List). Her satıra dokununca
// `EmergencyBloodDetailView`'a navigate eder. Liste boşken ek bilgi metni
// gösterilir; iPhone bağlantı durumu üstte minik bir göstergede yer alır.

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var manager: WatchConnectivityManager

    var body: some View {
        NavigationStack {
            Group {
                if manager.emergencies.isEmpty {
                    emptyState
                } else {
                    list
                }
            }
            .navigationTitle("hangel")
        }
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "drop.fill")
                .font(.system(size: 28))
                .foregroundStyle(.red)
            Text("Acil kan ihtiyacı yok")
                .font(.headline)
                .multilineTextAlignment(.center)
            Text(manager.isReachable ? "iPhone bağlı" : "iPhone uyuyor olabilir")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding()
    }

    private var list: some View {
        List {
            ForEach(manager.emergencies) { item in
                NavigationLink(value: item) {
                    EmergencyRow(item: item)
                }
            }
        }
        .navigationDestination(for: EmergencyBlood.self) { item in
            EmergencyBloodDetailView(item: item)
        }
    }
}

private struct EmergencyRow: View {
    let item: EmergencyBlood

    var body: some View {
        HStack(spacing: 8) {
            ZStack {
                Circle().fill(.red).frame(width: 32, height: 32)
                Text(item.bloodType)
                    .font(.caption).bold()
                    .foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(item.hospital)
                    .font(.caption).bold()
                    .lineLimit(1)
                HStack(spacing: 4) {
                    Text(item.city)
                    if let d = item.distanceKm {
                        Text("· \(String(format: "%.1f", d)) km")
                    }
                }
                .font(.caption2)
                .foregroundStyle(.secondary)
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
