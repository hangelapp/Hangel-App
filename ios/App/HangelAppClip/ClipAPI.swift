// ClipAPI — Hangel REST endpoints'i için minimal HTTP client.
//
// App Clip 15 MB sınırı nedeniyle Firebase SDK kullanılmaz. Bunun yerine
// hangel.org.tr backend'inin REST endpoint'leri kullanılır:
//
//   GET  /api/clip/event/{id}     → ClipEventInfo (public, anonim)
//   POST /api/clip/checkin        → 200 OK / 429 rate-limited
//
// Bu endpoint'ler backend tarafında auth gerektirmez ama IP başına
// rate-limit'lidir. Backend implementasyonu hangi commit'te olduğunu
// docs/audit/tasks.md'de takip ediyoruz (TODO: backend endpoint task).

import Foundation

enum ClipAPIError: LocalizedError {
    case invalidURL
    case httpError(Int)
    case decoding
    case network(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "URL geçersiz"
        case .httpError(let code): return "Sunucu hatası (\(code))"
        case .decoding: return "Yanıt çözümlenemedi"
        case .network(let err): return err.localizedDescription
        }
    }
}

enum ClipAPI {
    /// Production base URL. App Clip universal link domain ile aynı.
    static let baseURL = URL(string: "https://hangel.org.tr")!

    static func fetchEvent(id: String) async throws -> ClipEventInfo {
        let url = baseURL.appendingPathComponent("api/clip/event").appendingPathComponent(id)
        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.timeoutInterval = 10

        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse else {
                throw ClipAPIError.httpError(0)
            }
            guard (200...299).contains(http.statusCode) else {
                throw ClipAPIError.httpError(http.statusCode)
            }
            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                throw ClipAPIError.decoding
            }
            let title = json["title"] as? String ?? "Etkinlik"
            let ngo = json["ngoName"] as? String ?? ""
            let location = json["location"] as? String ?? ""
            let date = json["dateString"] as? String
            return ClipEventInfo(title: title, ngoName: ngo, location: location, dateString: date)
        } catch let err as ClipAPIError {
            throw err
        } catch {
            throw ClipAPIError.network(error)
        }
    }

    static func checkIn(eventId: String) async throws {
        let url = baseURL.appendingPathComponent("api/clip/checkin")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.timeoutInterval = 10

        let payload: [String: Any] = [
            "eventId": eventId,
            // App Clip cihaz başına anonim identifier — privacy-safe (UDID değil).
            "deviceId": deviceAnonymousID(),
            "source": "app-clip",
        ]
        req.httpBody = try JSONSerialization.data(withJSONObject: payload)

        do {
            let (_, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse else {
                throw ClipAPIError.httpError(0)
            }
            guard (200...299).contains(http.statusCode) else {
                throw ClipAPIError.httpError(http.statusCode)
            }
        } catch let err as ClipAPIError {
            throw err
        } catch {
            throw ClipAPIError.network(error)
        }
    }

    /// UserDefaults'ta saklanan anonim cihaz ID'si. App Clip ilk açılışta
    /// üretilir; sonraki açılışlarda aynı ID kullanılır. App Group ile
    /// parent app'le paylaşılır (rate-limit ortak).
    private static func deviceAnonymousID() -> String {
        let key = "com.hangel.clip.deviceId"
        let defaults = UserDefaults(suiteName: "group.com.hangel.app.shared") ?? .standard
        if let existing = defaults.string(forKey: key) {
            return existing
        }
        let new = UUID().uuidString
        defaults.set(new, forKey: key)
        return new
    }
}
