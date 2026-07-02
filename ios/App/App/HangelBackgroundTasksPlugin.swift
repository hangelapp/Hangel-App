// HangelBackgroundTasksPlugin — BGTaskScheduler köprüsü.
//
// Info.plist'te declare edilen iki task identifier'ı için BGTaskScheduler
// register eder:
//
//   org.hangel.tasks.geofence-sync   — periyodik yakındaki etkinlik/kan
//                                       çağrısı tarama (~15 dk aralık)
//   org.hangel.tasks.feed-refresh    — feed verilerini önbelleğe yenile
//
// AppDelegate.application(_:didFinishLaunching) içinde register() çağrılır.
// Background fetch izniyle birlikte iOS arka planda çalışmasını planlar.
//
// Plugin Capacitor 8 sözleşmesine uyar; web tarafı schedule()'i tetikler.

import Foundation
import Capacitor
import BackgroundTasks

@objc(HangelBackgroundTasksPlugin)
public class HangelBackgroundTasksPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HangelBackgroundTasksPlugin"
    public let jsName = "HangelBackgroundTasks"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "schedule", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancel", returnType: CAPPluginReturnPromise),
    ]

    static let geofenceSyncId = "org.hangel.tasks.geofence-sync"
    static let feedRefreshId = "org.hangel.tasks.feed-refresh"

    /// AppDelegate.didFinishLaunching içinde çağrılır.
    public static func registerTasks() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: geofenceSyncId, using: nil) { task in
            handleGeofenceSync(task: task as! BGAppRefreshTask)
        }
        BGTaskScheduler.shared.register(forTaskWithIdentifier: feedRefreshId, using: nil) { task in
            handleFeedRefresh(task: task as! BGAppRefreshTask)
        }
    }

    @objc func schedule(_ call: CAPPluginCall) {
        do {
            try Self.scheduleNextGeofenceSync()
            try Self.scheduleNextFeedRefresh()
            call.resolve(["scheduled": true])
        } catch {
            call.reject("Schedule failed: \(error.localizedDescription)")
        }
    }

    @objc func cancel(_ call: CAPPluginCall) {
        BGTaskScheduler.shared.cancelAllTaskRequests()
        call.resolve(["cancelled": true])
    }

    static func scheduleNextGeofenceSync() throws {
        let request = BGAppRefreshTaskRequest(identifier: geofenceSyncId)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 dk
        try BGTaskScheduler.shared.submit(request)
    }

    static func scheduleNextFeedRefresh() throws {
        let request = BGAppRefreshTaskRequest(identifier: feedRefreshId)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 30 * 60) // 30 dk
        try BGTaskScheduler.shared.submit(request)
    }

    // MARK: - Task handlers

    private static func handleGeofenceSync(task: BGAppRefreshTask) {
        try? scheduleNextGeofenceSync() // re-schedule next iteration

        task.expirationHandler = {
            // iOS sürenin dolmasını bildiriyor; in-flight URLSession'ı iptal et
            URLSession.shared.invalidateAndCancel()
        }

        // Trigger WebView'da background hook (Capacitor "appStateChange" event yok,
        // bunun yerine custom event dispatcher kullanılabilir). MVP: sadece HTTP GET
        // ile feed endpoint'ini sıcak tut, sunucu tarafı geofence match yapar.
        let url = URL(string: "https://hangel.org/api/users/me/disaster-alerts?bg=1")!
        let dataTask = URLSession.shared.dataTask(with: url) { _, _, error in
            task.setTaskCompleted(success: error == nil)
        }
        dataTask.resume()
    }

    private static func handleFeedRefresh(task: BGAppRefreshTask) {
        try? scheduleNextFeedRefresh()
        task.expirationHandler = { URLSession.shared.invalidateAndCancel() }

        let url = URL(string: "https://hangel.org/api/users/me/blood-feed?bg=1")!
        let dataTask = URLSession.shared.dataTask(with: url) { _, _, error in
            task.setTaskCompleted(success: error == nil)
        }
        dataTask.resume()
    }
}
