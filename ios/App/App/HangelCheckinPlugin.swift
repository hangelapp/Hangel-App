// HangelCheckinPlugin — Geofence izleyici (akıllı check-in / auto-checkout).
//
// startMonitoring(eventId, latitude, longitude, radius?): bir etkinlik konumu
// için CLCircularRegion oluşturup CLLocationManager.startMonitoring(for:)
// çağırır. Kullanıcı bölgeden çıktığında didExitRegion event'i tetiklenir;
// web tarafı `regionExit` listener ile yakalayıp `/api/events/[id]/checkin`'e
// DELETE atar (auto-checkout).
//
// Background location entitlement gerektirir — Xcode → Capabilities →
// Background Modes → Location updates. NSLocationAlwaysAndWhenInUseUsageDescription
// Info.plist'te zaten ekli (Faz 0).

import Foundation
import Capacitor
import CoreLocation

@objc(HangelCheckinPlugin)
public class HangelCheckinPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "HangelCheckinPlugin"
    public let jsName = "HangelCheckin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestAlwaysPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startMonitoring", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopMonitoring", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopAll", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listMonitored", returnType: CAPPluginReturnPromise),
    ]

    private static let regionPrefix = "hangel-event-"
    private lazy var locationManager: CLLocationManager = {
        let mgr = CLLocationManager()
        mgr.delegate = self
        mgr.desiredAccuracy = kCLLocationAccuracyHundredMeters
        return mgr
    }()

    override public func load() {
        super.load()
        _ = locationManager // initialize delegate
    }

    @objc func requestAlwaysPermission(_ call: CAPPluginCall) {
        let current = locationManager.authorizationStatus
        if current == .authorizedAlways {
            call.resolve(["status": "always"]); return
        }
        // İlk önce WhenInUse iste, sonra Always upgrade. Apple Always doğrudan
        // istenirse kullanıcıya "WhenInUse" da gösteriyor; iki adımlı UX daha kabul.
        if current == .notDetermined {
            locationManager.requestWhenInUseAuthorization()
        } else if current == .authorizedWhenInUse {
            locationManager.requestAlwaysAuthorization()
        }
        call.resolve(["status": Self.statusString(current)])
    }

    @objc func startMonitoring(_ call: CAPPluginCall) {
        guard let eventId = call.getString("eventId"),
              let lat = call.getDouble("latitude"),
              let lng = call.getDouble("longitude") else {
            call.reject("eventId, latitude, longitude zorunlu"); return
        }
        let radius = call.getDouble("radius") ?? 150  // default 150m (check-in 100m + 50m buffer)

        if !CLLocationManager.isMonitoringAvailable(for: CLCircularRegion.self) {
            call.reject("Bölge izleme cihazda desteklenmiyor"); return
        }

        let region = CLCircularRegion(
            center: CLLocationCoordinate2D(latitude: lat, longitude: lng),
            radius: min(radius, locationManager.maximumRegionMonitoringDistance),
            identifier: Self.regionPrefix + eventId
        )
        region.notifyOnEntry = false
        region.notifyOnExit = true
        locationManager.startMonitoring(for: region)
        call.resolve(["ok": true, "eventId": eventId])
    }

    @objc func stopMonitoring(_ call: CAPPluginCall) {
        guard let eventId = call.getString("eventId") else { call.reject("eventId zorunlu"); return }
        let id = Self.regionPrefix + eventId
        for region in locationManager.monitoredRegions where region.identifier == id {
            locationManager.stopMonitoring(for: region)
        }
        call.resolve(["ok": true])
    }

    @objc func stopAll(_ call: CAPPluginCall) {
        for region in locationManager.monitoredRegions where region.identifier.hasPrefix(Self.regionPrefix) {
            locationManager.stopMonitoring(for: region)
        }
        call.resolve(["ok": true])
    }

    @objc func listMonitored(_ call: CAPPluginCall) {
        let ids = locationManager.monitoredRegions
            .map { $0.identifier }
            .filter { $0.hasPrefix(Self.regionPrefix) }
            .map { String($0.dropFirst(Self.regionPrefix.count)) }
        call.resolve(["eventIds": ids])
    }

    // MARK: - CLLocationManagerDelegate

    public func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
        guard region.identifier.hasPrefix(Self.regionPrefix) else { return }
        let eventId = String(region.identifier.dropFirst(Self.regionPrefix.count))
        notifyListeners("regionExit", data: ["eventId": eventId, "exitedAt": Date().timeIntervalSince1970])
    }

    public func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: Error) {
        notifyListeners("monitoringError", data: [
            "eventId": region.flatMap { $0.identifier.hasPrefix(Self.regionPrefix) ? String($0.identifier.dropFirst(Self.regionPrefix.count)) : nil } ?? "",
            "error": error.localizedDescription,
        ])
    }

    private static func statusString(_ status: CLAuthorizationStatus) -> String {
        switch status {
        case .notDetermined: return "notDetermined"
        case .restricted: return "restricted"
        case .denied: return "denied"
        case .authorizedAlways: return "always"
        case .authorizedWhenInUse: return "whenInUse"
        @unknown default: return "unknown"
        }
    }
}
