// WatchConnectivityManager — WCSessionDelegate köprüsü.
//
// iPhone -> Watch: `sendMessage` / `transferUserInfo` ile gelen acil kan
// ihtiyacı payload'larını `emergencies` listesine ekler.
// Watch -> iPhone: kullanıcı "Yardım Edebilirim" / "Edemiyorum" yanıtladığında
// `replyToEmergency(id:canHelp:)` ile sendMessage atar; iPhone tarafı
// HangelWatchConnectivityPlugin bunu yakalayıp web'e `watchResponse` event'i
// olarak iletir.
//
// Payload schema:
//   {
//     "type": "emergencyBlood",
//     "id": "req_xxx",
//     "bloodType": "0-",
//     "city": "Istanbul",
//     "hospital": "Acıbadem Maslak",
//     "distanceKm": 1.4,
//     "createdAt": 1234567890
//   }

import Foundation
import WatchConnectivity
import Combine

struct EmergencyBlood: Identifiable, Codable, Equatable, Hashable {
    let id: String
    let bloodType: String
    let city: String
    let hospital: String
    let distanceKm: Double?
    let createdAt: TimeInterval

    /// Dictionary'den safe init — bilinmeyen alanlar atlanır.
    static func from(dict: [String: Any]) -> EmergencyBlood? {
        guard let id = dict["id"] as? String,
              let bloodType = dict["bloodType"] as? String,
              let city = dict["city"] as? String,
              let hospital = dict["hospital"] as? String else { return nil }
        let distance = dict["distanceKm"] as? Double
        let createdAt = (dict["createdAt"] as? TimeInterval)
            ?? (dict["createdAt"] as? Double)
            ?? Date().timeIntervalSince1970
        return EmergencyBlood(
            id: id,
            bloodType: bloodType,
            city: city,
            hospital: hospital,
            distanceKm: distance,
            createdAt: createdAt
        )
    }
}

final class WatchConnectivityManager: NSObject, ObservableObject, WCSessionDelegate {
    static let shared = WatchConnectivityManager()

    @Published var emergencies: [EmergencyBlood] = []
    @Published var lastError: String?
    @Published var isReachable: Bool = false

    private let session: WCSession?

    override init() {
        self.session = WCSession.isSupported() ? WCSession.default : nil
        super.init()
        session?.delegate = self
        session?.activate()
    }

    // MARK: - Public API (called from Watch UI)

    /// Watch tarafı "Yardım Edebilirim" / "Edemiyorum" cevabını iPhone'a iletir.
    func replyToEmergency(id: String, canHelp: Bool) {
        guard let session, session.activationState == .activated else {
            lastError = "WCSession aktif değil"; return
        }
        let payload: [String: Any] = [
            "type": "watchResponse",
            "id": id,
            "canHelp": canHelp,
            "respondedAt": Date().timeIntervalSince1970,
        ]
        if session.isReachable {
            session.sendMessage(payload, replyHandler: nil) { [weak self] err in
                DispatchQueue.main.async { self?.lastError = err.localizedDescription }
            }
        } else {
            // iPhone uyuyorsa userInfo queue'ya ekle — iPhone uyandığında teslim edilir.
            session.transferUserInfo(payload)
        }
    }

    /// UI test / preview için.
    func injectMockEmergency() {
        let mock = EmergencyBlood(
            id: "mock_\(UUID().uuidString.prefix(6))",
            bloodType: "0-",
            city: "İstanbul",
            hospital: "Acıbadem Maslak",
            distanceKm: 1.4,
            createdAt: Date().timeIntervalSince1970
        )
        DispatchQueue.main.async { self.emergencies.insert(mock, at: 0) }
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error {
            DispatchQueue.main.async { self.lastError = error.localizedDescription }
        }
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
    }

    // sendMessage path (iPhone foreground/reachable)
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        handleIncoming(message)
    }

    // transferUserInfo path (queued delivery)
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        handleIncoming(userInfo)
    }

    // applicationContext path (last-known-state)
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        handleIncoming(applicationContext)
    }

    private func handleIncoming(_ payload: [String: Any]) {
        let type = payload["type"] as? String ?? ""
        switch type {
        case "emergencyBlood":
            guard let item = EmergencyBlood.from(dict: payload) else { return }
            DispatchQueue.main.async {
                // Aynı id zaten varsa güncelle, yoksa başa ekle.
                if let idx = self.emergencies.firstIndex(where: { $0.id == item.id }) {
                    self.emergencies[idx] = item
                } else {
                    self.emergencies.insert(item, at: 0)
                }
            }
        case "emergencyBloodList":
            guard let items = payload["items"] as? [[String: Any]] else { return }
            let parsed = items.compactMap { EmergencyBlood.from(dict: $0) }
            DispatchQueue.main.async { self.emergencies = parsed }
        case "clearEmergency":
            guard let id = payload["id"] as? String else { return }
            DispatchQueue.main.async {
                self.emergencies.removeAll { $0.id == id }
            }
        default:
            break
        }
    }
}
