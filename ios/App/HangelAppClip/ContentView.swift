// ContentView — App Clip ana ekranı.
//
// Akış:
//   1. URL'den parse edilen eventId yoksa: "Geçersiz QR" ekranı.
//   2. Event yükleniyorsa: ProgressView.
//   3. Event yüklendi: başlık + STK + konum + "Check-in" butonu.
//   4. Check-in tamamlandı: yeşil onay + "Hangel'i indir" CTA.
//
// Check-in REST endpoint: POST https://hangel.org.tr/api/clip/checkin
// Body: { "eventId": "...", "deviceId": "<UUID>" }
// Backend rate-limited; cihaz başına 24 saatte 1 check-in.

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var state: ClipState

    var body: some View {
        VStack(spacing: 16) {
            header

            if state.targetId == nil {
                invalidQRView
            } else if state.loading {
                ProgressView("Etkinlik yükleniyor...")
                    .padding(.vertical, 40)
            } else if state.checkInCompleted {
                successView
            } else if let event = state.event {
                eventDetailView(event: event)
            } else if let err = state.errorMessage {
                errorView(message: err)
            } else {
                ProgressView()
                    .padding(.vertical, 40)
                    .task {
                        await loadEvent()
                    }
            }

            Spacer()
            footer
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
    }

    // MARK: - Subviews

    private var header: some View {
        VStack(spacing: 6) {
            Image(systemName: "heart.text.square.fill")
                .font(.system(size: 44))
                .foregroundStyle(.red)
            Text("Hangel")
                .font(.title2.bold())
            Text("Gönüllü Etkinlik Check-in")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.top, 8)
    }

    private var invalidQRView: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 36))
                .foregroundStyle(.orange)
            Text("Geçersiz QR Kod")
                .font(.headline)
            Text("Bu QR kodda etkinlik bilgisi yok. Lütfen etkinlik\nyöneticisinden yeni bir QR isteyin.")
                .font(.caption)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 24)
    }

    private func eventDetailView(event: ClipEventInfo) -> some View {
        VStack(spacing: 10) {
            Text(event.title)
                .font(.title3.bold())
                .multilineTextAlignment(.center)

            VStack(spacing: 4) {
                Label(event.ngoName, systemImage: "building.2")
                    .font(.callout)
                Label(event.location, systemImage: "mappin.and.ellipse")
                    .font(.callout)
                if let date = event.dateString {
                    Label(date, systemImage: "calendar")
                        .font(.callout)
                }
            }
            .foregroundStyle(.secondary)

            Button {
                Task { await performCheckIn() }
            } label: {
                Label("Check-in Yap", systemImage: "checkmark.circle.fill")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.borderedProminent)
            .tint(.red)
            .padding(.top, 12)
        }
        .padding(.vertical, 16)
    }

    private var successView: some View {
        VStack(spacing: 14) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 64))
                .foregroundStyle(.green)
            Text("Check-in Başarılı")
                .font(.title3.bold())
            Text("Etkinliğe katılımın kaydedildi. Tam deneyim için\nHangel uygulamasını indirebilirsin.")
                .font(.caption)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)

            Button {
                openAppStore()
            } label: {
                Label("Hangel'i İndir", systemImage: "arrow.down.app.fill")
                    .font(.callout)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .buttonStyle(.bordered)
            .tint(.red)
            .padding(.top, 10)
        }
        .padding(.vertical, 16)
    }

    private func errorView(message: String) -> some View {
        VStack(spacing: 10) {
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 36))
                .foregroundStyle(.orange)
            Text("Hata oluştu")
                .font(.headline)
            Text(message)
                .font(.caption)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
            Button("Tekrar Dene") {
                state.errorMessage = nil
                Task { await loadEvent() }
            }
            .buttonStyle(.bordered)
        }
        .padding(.vertical, 16)
    }

    private var footer: some View {
        VStack(spacing: 4) {
            Divider()
            Text("hangel.org.tr · Sivil toplum + gönüllülük platformu")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding(.bottom, 8)
    }

    // MARK: - Actions

    private func loadEvent() async {
        guard let id = state.targetId else { return }
        state.loading = true
        defer { state.loading = false }

        do {
            let info = try await ClipAPI.fetchEvent(id: id)
            state.event = info
            state.errorMessage = nil
        } catch {
            state.errorMessage = "Etkinlik bilgileri yüklenemedi: \(error.localizedDescription)"
        }
    }

    private func performCheckIn() async {
        guard let id = state.targetId else { return }
        state.loading = true
        defer { state.loading = false }

        do {
            try await ClipAPI.checkIn(eventId: id)
            state.checkInCompleted = true
        } catch {
            state.errorMessage = "Check-in başarısız: \(error.localizedDescription)"
        }
    }

    private func openAppStore() {
        // Hangel App Store ID: 6664058822
        let appStoreURL = URL(string: "itms-apps://apps.apple.com/app/id6664058822")!
        UIApplication.shared.open(appStoreURL)
    }
}

#Preview {
    ContentView()
        .environmentObject({
            let s = ClipState.shared
            s.targetId = "preview-event"
            s.event = ClipEventInfo(
                title: "İstanbul Sahil Temizliği",
                ngoName: "Mavi Deniz Derneği",
                location: "Caddebostan, Kadıköy",
                dateString: "15 Haziran 2026, 10:00"
            )
            return s
        }())
}
