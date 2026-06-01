// ClipState — App Clip session state.
//
// QR kodundan gelen URL parse edildiğinde `targetId` set olur. ContentView
// bu state'i izleyerek event bilgilerini Firestore REST API'sinden çeker
// (Firebase SDK eklemiyoruz; App Clip 15 MB sınırına saygı).

import Foundation
import SwiftUI

@MainActor
final class ClipState: ObservableObject {
    static let shared = ClipState()

    /// "event" veya "ngo" — App Clip experience tipi.
    @Published var kind: String = "event"

    /// URL'den parse edilen ID (eventId veya ngoId).
    @Published var targetId: String?

    /// Yüklenen event bilgileri.
    @Published var event: ClipEventInfo?

    /// Loading flag — UI spinner.
    @Published var loading: Bool = false

    /// Son hata mesajı (Türkçe, kullanıcıya gösterilebilir).
    @Published var errorMessage: String?

    /// Check-in sonucu (success state).
    @Published var checkInCompleted: Bool = false
}

/// Minimal event info struct — Firestore'dan çekilen sadece görüntü için
/// gereken alanlar. Tam event modeli App Clip'te gerekli değil.
struct ClipEventInfo: Equatable {
    let title: String
    let ngoName: String
    let location: String
    let dateString: String?
}
