// HangelWatchConnectivityPlugin — Web ↔ Apple Watch köprüsü.
//
// Web tarafı `HangelWatchConnectivity.sendEmergencyToWatch({...})` ile bir
// acil kan ihtiyacı payload'unu iPhone'a verir; bu plugin WCSession üstünden
// Watch'a iletir (öncelik: sendMessage; uyandıramazsa transferUserInfo +
// updateApplicationContext fallback).
//
// Watch'tan gelen kullanıcı yanıtları (`watchResponse`) `watchResponse`
// event'i olarak web tarafına `notifyListeners` üzerinden iletilir.
//
// Payload schema (web -> Watch):
//   sendEmergencyToWatch({
//     id, bloodType, city, hospital, distanceKm?, createdAt?
//   })
//
// Event (Watch -> web):
//   addListener('watchResponse', ({ id, canHelp, respondedAt }) => {...})

import Foundation
import Capacitor
import WatchConnectivity
import UIKit

@objc(HangelWatchConnectivityPlugin)
public class HangelWatchConnectivityPlugin: CAPPlugin, CAPBridgedPlugin, WCSessionDelegate {
    public let identifier = "HangelWatchConnectivityPlugin"
    public let jsName = "HangelWatchConnectivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isPaired", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendEmergencyToWatch", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendEmergencyList", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearEmergency", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendUserStats", returnType: CAPPluginReturnPromise),
    ]

    private var session: WCSession?

    override public func load() {
        super.load()
        guard WCSession.isSupported() else { return }
        let s = WCSession.default
        s.delegate = self
        s.activate()
        self.session = s
    }

    // MARK: - Capacitor methods

    @objc func isSupported(_ call: CAPPluginCall) {
        call.resolve(["supported": WCSession.isSupported()])
    }

    @objc func isPaired(_ call: CAPPluginCall) {
        guard let session else {
            call.resolve(["paired": false, "watchAppInstalled": false]); return
        }
        call.resolve([
            "paired": session.isPaired,
            "watchAppInstalled": session.isWatchAppInstalled,
            "reachable": session.isReachable,
            "activationState": Self.activationStateString(session.activationState),
        ])
    }

    @objc func sendEmergencyToWatch(_ call: CAPPluginCall) {
        guard let id = call.getString("id"),
              let bloodType = call.getString("bloodType"),
              let city = call.getString("city"),
              let hospital = call.getString("hospital") else {
            call.reject("id, bloodType, city, hospital zorunlu"); return
        }
        var payload: [String: Any] = [
            "type": "emergencyBlood",
            "id": id,
            "bloodType": bloodType,
            "city": city,
            "hospital": hospital,
            "createdAt": call.getDouble("createdAt") ?? Date().timeIntervalSince1970,
        ]
        if let d = call.getDouble("distanceKm") { payload["distanceKm"] = d }

        deliver(payload: payload, call: call)
    }

    @objc func sendEmergencyList(_ call: CAPPluginCall) {
        guard let items = call.getArray("items") as? [[String: Any]] else {
            call.reject("items array zorunlu"); return
        }
        let payload: [String: Any] = [
            "type": "emergencyBloodList",
            "items": items,
        ]
        deliver(payload: payload, call: call)
    }

    @objc func clearEmergency(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("id zorunlu"); return }
        let payload: [String: Any] = ["type": "clearEmergency", "id": id]
        deliver(payload: payload, call: call)
    }

    /// Web -> Watch: kullanıcı istatistikleri (etki puanı, günlük seri, yaklaşan etkinlik).
    /// Watch'taki Etki sekmesi bunları gösterir.
    @objc func sendUserStats(_ call: CAPPluginCall) {
        var payload: [String: Any] = ["type": "userStats"]
        if let v = call.getInt("impactScore") { payload["impactScore"] = v }
        if let v = call.getInt("streak") { payload["streak"] = v }
        if let v = call.getString("nextEventTitle") { payload["nextEventTitle"] = v }
        if let v = call.getString("nextEventWhen") { payload["nextEventWhen"] = v }
        deliver(payload: payload, call: call)
    }

    // MARK: - Delivery helper

    private func deliver(payload: [String: Any], call: CAPPluginCall) {
        guard let session, session.activationState == .activated else {
            call.reject("WCSession aktif değil"); return
        }
        guard session.isPaired, session.isWatchAppInstalled else {
            call.resolve(["delivered": false, "reason": "watchNotPaired"]); return
        }

        if session.isReachable {
            session.sendMessage(payload, replyHandler: { reply in
                call.resolve(["delivered": true, "transport": "message", "reply": reply])
            }, errorHandler: { [weak self] err in
                // Fallback queue (uyandı uyanmadı: userInfo)
                self?.fallbackTransfer(payload: payload, session: session, call: call, primaryError: err)
            })
        } else {
            fallbackTransfer(payload: payload, session: session, call: call, primaryError: nil)
        }
    }

    private func fallbackTransfer(payload: [String: Any], session: WCSession, call: CAPPluginCall, primaryError: Error?) {
        session.transferUserInfo(payload)
        // Ek sigorta: last-known-state applicationContext olarak da güncelle (best-effort).
        try? session.updateApplicationContext(payload)
        call.resolve([
            "delivered": true,
            "transport": "userInfo",
            "primaryError": primaryError?.localizedDescription as Any,
        ])
    }

    // MARK: - WCSessionDelegate

    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        // No-op; activation state queried in isPaired/sendEmergencyToWatch.
    }

    public func sessionDidBecomeInactive(_ session: WCSession) {
        // iOS multi-watch pairing switch — Apple, .activate() yeniden çağrılmasını öneriyor.
    }

    public func sessionDidDeactivate(_ session: WCSession) {
        WCSession.default.activate()
    }

    public func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        forwardToWeb(message)
    }

    public func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        forwardToWeb(userInfo)
    }

    private func forwardToWeb(_ data: [String: Any]) {
        let type = data["type"] as? String ?? ""
        switch type {
        case "watchResponse":
            // Sadece serialize edilebilir alanları geçir.
            var safe: [String: Any] = [:]
            if let id = data["id"] as? String { safe["id"] = id }
            if let canHelp = data["canHelp"] as? Bool { safe["canHelp"] = canHelp }
            if let ts = data["respondedAt"] as? Double { safe["respondedAt"] = ts }
            notifyListeners("watchResponse", data: safe)
        case "watchOpen":
            // Watch'tan gelen aksiyon: iPhone'da hangel deep-link'ini aç (örn. hangel://events).
            if let urlStr = data["url"] as? String, let url = URL(string: urlStr) {
                DispatchQueue.main.async { UIApplication.shared.open(url, options: [:], completionHandler: nil) }
            }
            notifyListeners("watchOpen", data: ["url": data["url"] as? String ?? ""])
        default:
            // Diğer mesajları generic event olarak yolla.
            notifyListeners("watchMessage", data: data)
        }
    }

    private static func activationStateString(_ state: WCSessionActivationState) -> String {
        switch state {
        case .notActivated: return "notActivated"
        case .inactive: return "inactive"
        case .activated: return "activated"
        @unknown default: return "unknown"
        }
    }
}
