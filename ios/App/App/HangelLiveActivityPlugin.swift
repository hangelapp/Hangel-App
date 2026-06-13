// HangelLiveActivityPlugin — Web ↔ ActivityKit köprüsü.
//
// Web tarafı `HangelLiveActivity.startEmergencyBlood({...})` gibi çağrılarla
// native ActivityKit Activity.request() tetikler. Activity başlatıldığında
// `pushTokenUpdates` ile gelen APNs token'ı resolve değeri olarak döner;
// web tarafı bunu `/api/live-activity/register-token`'a POST eder.
//
// Activity sonlandırma: endActivity(activityId) → Activity.activities listesinden
// matching id'yi bulup .end(dismissalPolicy: .immediate) çağırır.

import Foundation
import Capacitor
#if canImport(ActivityKit)
import ActivityKit
#endif

@objc(HangelLiveActivityPlugin)
public class HangelLiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HangelLiveActivityPlugin"
    public let jsName = "HangelLiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startEmergencyBlood", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startVolunteerTask", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startEventCountdown", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startDonationCampaign", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endActivity", returnType: CAPPluginReturnPromise),
    ]

    @objc func isSupported(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            call.resolve(["supported": ActivityAuthorizationInfo().areActivitiesEnabled])
            return
        }
        #endif
        call.resolve(["supported": false])
    }

    @objc func startEmergencyBlood(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.2, *) else { call.reject("Requires iOS 16.2+"); return }
        guard let bloodType = call.getString("bloodType"),
              let city = call.getString("city"),
              let requestId = call.getString("requestId"),
              let hospitalName = call.getString("hospitalName") else {
            call.reject("bloodType, city, requestId, hospitalName zorunlu"); return
        }
        let attrs = EmergencyBloodAttributes(bloodType: bloodType, city: city, requestId: requestId, hospitalName: hospitalName)
        let state = EmergencyBloodAttributes.ContentState(
            distance: call.getString("distance") ?? "—",
            matchedDonors: call.getInt("matchedDonors") ?? 0,
            minutesLeft: call.getInt("minutesLeft") ?? 60,
            status: call.getString("status") ?? "Bekleniyor"
        )
        Self.startActivity(attrs: attrs, state: state, staleHours: 4, call: call)
        #else
        call.reject("ActivityKit unavailable")
        #endif
    }

    @objc func startVolunteerTask(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.2, *) else { call.reject("Requires iOS 16.2+"); return }
        guard let taskTitle = call.getString("taskTitle"),
              let ngoName = call.getString("ngoName"),
              let location = call.getString("location"),
              let taskId = call.getString("taskId") else {
            call.reject("taskTitle, ngoName, location, taskId zorunlu"); return
        }
        let logoName = Self.cacheOrgLogo(urlString: call.getString("organizerLogoUrl"), id: taskId)
        let attrs = VolunteerTaskAttributes(taskTitle: taskTitle, ngoName: ngoName, location: location, taskId: taskId,
            weatherEmoji: call.getString("weatherEmoji") ?? "", weatherTemp: call.getString("weatherTemp") ?? "", orgLogoName: logoName,
            activityStartEpoch: call.getDouble("activityStartEpoch") ?? 0, activityEndEpoch: call.getDouble("activityEndEpoch") ?? 0)
        let state = VolunteerTaskAttributes.ContentState(
            minutesLeft: call.getInt("minutesLeft") ?? 120,
            progressPercent: call.getDouble("progressPercent") ?? 0.0,
            checkInOpen: call.getBool("checkInOpen") ?? true
        )
        Self.startActivity(attrs: attrs, state: state, staleHours: 8, call: call)
        #else
        call.reject("ActivityKit unavailable")
        #endif
    }

    @objc func startEventCountdown(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.2, *) else { call.reject("Requires iOS 16.2+"); return }
        guard let eventTitle = call.getString("eventTitle"),
              let location = call.getString("location"),
              let eventId = call.getString("eventId") else {
            call.reject("eventTitle, location, eventId zorunlu"); return
        }
        let logoName = Self.cacheOrgLogo(urlString: call.getString("organizerLogoUrl"), id: eventId)
        let attrs = EventCountdownAttributes(eventTitle: eventTitle, location: location, eventId: eventId, eventStartEpoch: call.getDouble("eventStartEpoch") ?? 0, eventEndEpoch: call.getDouble("eventEndEpoch") ?? 0,
            weatherEmoji: call.getString("weatherEmoji") ?? "", weatherTemp: call.getString("weatherTemp") ?? "", orgLogoName: logoName)
        let state = EventCountdownAttributes.ContentState(
            minutesLeft: call.getInt("minutesLeft") ?? 60,
            statusLabel: call.getString("statusLabel") ?? "Yakında"
        )
        Self.startActivity(attrs: attrs, state: state, staleHours: 24, call: call)
        #else
        call.reject("ActivityKit unavailable")
        #endif
    }

    @objc func startDonationCampaign(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.2, *) else { call.reject("Requires iOS 16.2+"); return }
        guard let campaignTitle = call.getString("campaignTitle"),
              let ngoName = call.getString("ngoName"),
              let campaignId = call.getString("campaignId") else {
            call.reject("campaignTitle, ngoName, campaignId zorunlu"); return
        }
        let attrs = DonationCampaignAttributes(campaignTitle: campaignTitle, ngoName: ngoName, campaignId: campaignId)
        let state = DonationCampaignAttributes.ContentState(
            currentAmount: call.getDouble("currentAmount") ?? 0.0,
            goalAmount: call.getDouble("goalAmount") ?? 1000.0,
            donorCount: call.getInt("donorCount") ?? 0
        )
        Self.startActivity(attrs: attrs, state: state, staleHours: 48, call: call)
        #else
        call.reject("ActivityKit unavailable")
        #endif
    }

    @objc func endActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.2, *) else { call.reject("Requires iOS 16.2+"); return }
        guard let activityId = call.getString("activityId") else {
            call.reject("activityId zorunlu"); return
        }
        Task {
            for activity in Activity<EmergencyBloodAttributes>.activities where activity.id == activityId {
                await activity.end(dismissalPolicy: .immediate)
                call.resolve(["ended": true]); return
            }
            for activity in Activity<VolunteerTaskAttributes>.activities where activity.id == activityId {
                await activity.end(dismissalPolicy: .immediate)
                call.resolve(["ended": true]); return
            }
            for activity in Activity<EventCountdownAttributes>.activities where activity.id == activityId {
                await activity.end(dismissalPolicy: .immediate)
                call.resolve(["ended": true]); return
            }
            for activity in Activity<DonationCampaignAttributes>.activities where activity.id == activityId {
                await activity.end(dismissalPolicy: .immediate)
                call.resolve(["ended": true]); return
            }
            call.resolve(["ended": false])
        }
        #else
        call.reject("ActivityKit unavailable")
        #endif
    }

    // STK/kulüp logosunu App Group container'a indir (fire-and-forget) ve dosya adını dön.
    // Widget extension aynı container'dan UIImage(contentsOfFile:) ile okur. İndirme
    // asenkron; logo bir sonraki widget yenilemesinde görünür, yoksa ikon fallback.
    private static func cacheOrgLogo(urlString: String?, id: String) -> String {
        guard let urlString = urlString, !urlString.isEmpty,
              let url = URL(string: urlString),
              let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.hangel.app.shared")
        else { return "" }
        let name = "orglogo-\(id).img"
        let dest = container.appendingPathComponent(name)
        URLSession.shared.dataTask(with: url) { data, _, _ in
            if let data = data, !data.isEmpty { try? data.write(to: dest) }
        }.resume()
        return name
    }

    #if canImport(ActivityKit)
    @available(iOS 16.2, *)
    private static func startActivity<A: ActivityAttributes>(
        attrs: A,
        state: A.ContentState,
        staleHours: Double,
        call: CAPPluginCall
    ) {
        do {
            let activity = try Activity.request(
                attributes: attrs,
                content: .init(state: state, staleDate: Date().addingTimeInterval(staleHours * 3600)),
                pushType: .token
            )
            Task {
                for await tokenData in activity.pushTokenUpdates {
                    let hex = tokenData.map { String(format: "%02x", $0) }.joined()
                    call.resolve(["activityId": activity.id, "pushToken": hex])
                    return
                }
                call.resolve(["activityId": activity.id, "pushToken": NSNull()])
            }
        } catch {
            call.reject("Activity.request failed: \(error.localizedDescription)")
        }
    }
    #endif
}
