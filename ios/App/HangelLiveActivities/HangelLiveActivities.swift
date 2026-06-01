// HangelLiveActivities — Widget Extension WidgetBundle.
//
// WidgetKit + ActivityKit. iOS 16.1+ Lock Screen + Dynamic Island layout'ları
// burada `@main` WidgetBundle altında toplanır. 4 Live Activity tipi:
//   1. EmergencyBloodLiveActivity
//   2. VolunteerTaskLiveActivity
//   3. EventCountdownLiveActivity
//   4. DonationCampaignLiveActivity
//
// Bu target'ın Attribute tipleri ana app target'ından (HangelLiveActivityAttributes.swift)
// Target Membership: Yes ile paylaşılır.
//
// Bu target Xcode'da "Widget Extension" template'iyle oluşturulmuş gibi davranır
// (Ruby script bunu kurar). Bundle ID: com.hangel.ios.app.LiveActivities

import WidgetKit
import SwiftUI

// Widget Extension target iOS 16.1 deployment target ile build edilir
// (add-live-activities-target.rb içinde LA_DEPLOYMENT_TARGET = '16.1').
// Bu yüzden bundle body içinde ek #available guard'a gerek yok.
@main
struct HangelLiveActivitiesBundle: WidgetBundle {
    var body: some Widget {
        EmergencyBloodLiveActivity()
        VolunteerTaskLiveActivity()
        EventCountdownLiveActivity()
        DonationCampaignLiveActivity()
    }
}
