// HangelLiveActivityAttributes — Live Activity veri sözleşmesi.
//
// Bu dosya hem ana app target'ında (Plugin.start*) hem Live Activity Extension
// target'ında (Widget UI) okunur. Xcode'da Live Activity Extension target
// oluşturulduktan sonra "Target Membership" panelinden iki target'a da ekleyin.
//
// Faz 1'in 4 Live Activity tipi:
//   1. emergency-blood   — acil kan ilanı (Dynamic Island'da kan grubu + mesafe)
//   2. volunteer-task    — gönüllülük görevi (geri sayım + check-in butonu)
//   3. event-countdown   — etkinliğe kalan süre
//   4. donation-campaign — kampanya progress bar

import Foundation
#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.1, *)
public struct EmergencyBloodAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var distance: String       // "1.2 km uzakta"
        public var matchedDonors: Int     // 0..4
        public var minutesLeft: Int
        public var status: String         // "Bekleniyor" | "Yola Çıktı" | "Tamamlandı"
        public init(distance: String, matchedDonors: Int, minutesLeft: Int, status: String) {
            self.distance = distance
            self.matchedDonors = matchedDonors
            self.minutesLeft = minutesLeft
            self.status = status
        }
    }
    public var bloodType: String          // "A Rh+"
    public var city: String
    public var requestId: String
    public var hospitalName: String
    public init(bloodType: String, city: String, requestId: String, hospitalName: String) {
        self.bloodType = bloodType
        self.city = city
        self.requestId = requestId
        self.hospitalName = hospitalName
    }
}

@available(iOS 16.1, *)
public struct VolunteerTaskAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var minutesLeft: Int
        public var progressPercent: Double  // 0.0..1.0
        public var checkInOpen: Bool
        public init(minutesLeft: Int, progressPercent: Double, checkInOpen: Bool) {
            self.minutesLeft = minutesLeft
            self.progressPercent = progressPercent
            self.checkInOpen = checkInOpen
        }
    }
    public var taskTitle: String
    public var ngoName: String
    public var location: String
    public var taskId: String
    public var weatherEmoji: String   // "🌧️" — saha gönüllülüğünde hava durumu (boş = gösterme)
    public var weatherTemp: String    // "18°"
    public var orgLogoName: String    // App Group container'daki STK logo dosya adı (boş = ikon fallback)
    public init(taskTitle: String, ngoName: String, location: String, taskId: String, weatherEmoji: String = "", weatherTemp: String = "", orgLogoName: String = "") {
        self.taskTitle = taskTitle
        self.ngoName = ngoName
        self.location = location
        self.taskId = taskId
        self.weatherEmoji = weatherEmoji
        self.weatherTemp = weatherTemp
        self.orgLogoName = orgLogoName
    }
}

@available(iOS 16.1, *)
public struct EventCountdownAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var minutesLeft: Int
        public var statusLabel: String    // "Yarın", "Bugün", "Devam ediyor"
        public init(minutesLeft: Int, statusLabel: String) {
            self.minutesLeft = minutesLeft
            self.statusLabel = statusLabel
        }
    }
    public var eventTitle: String
    public var location: String
    public var eventId: String
    public var eventStartEpoch: Double   // ms since 1970 — başlangıç. Text(timerInterval:) ile otomatik geri sayım. 0 = bilinmiyor.
    public var eventEndEpoch: Double      // ms since 1970 — bitiş. Etkinlik akış-line'ı (ProgressView(timerInterval:)) için. 0 = bilinmiyor.
    public var weatherEmoji: String      // "🌧️" — fiziksel etkinlikte hava durumu (boş = gösterme)
    public var weatherTemp: String       // "18°" — sıcaklık (boş = gösterme)
    public var orgLogoName: String       // App Group container'daki logo dosya adı (boş = ikon fallback)
    public init(eventTitle: String, location: String, eventId: String, eventStartEpoch: Double = 0, eventEndEpoch: Double = 0, weatherEmoji: String = "", weatherTemp: String = "", orgLogoName: String = "") {
        self.eventTitle = eventTitle
        self.location = location
        self.eventId = eventId
        self.eventStartEpoch = eventStartEpoch
        self.eventEndEpoch = eventEndEpoch
        self.weatherEmoji = weatherEmoji
        self.weatherTemp = weatherTemp
        self.orgLogoName = orgLogoName
    }
}

@available(iOS 16.1, *)
public struct DonationCampaignAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var currentAmount: Double
        public var goalAmount: Double
        public var donorCount: Int
        public init(currentAmount: Double, goalAmount: Double, donorCount: Int) {
            self.currentAmount = currentAmount
            self.goalAmount = goalAmount
            self.donorCount = donorCount
        }
    }
    public var campaignTitle: String
    public var ngoName: String
    public var campaignId: String
    public init(campaignTitle: String, ngoName: String, campaignId: String) {
        self.campaignTitle = campaignTitle
        self.ngoName = ngoName
        self.campaignId = campaignId
    }
}
#endif
