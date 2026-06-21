// HangelHealthPlugin — Web ↔ HealthKit köprüsü (salt-okuma).
//
// Web tarafı `HangelHealth.read()` çağırır; native HealthKit'ten kan grubu,
// cinsiyet, doğum tarihi, boy ve kilo okur ve resolve eder. Web tarafı bu
// değerleri users/{uid}.personalInfo'ya senkronlar — kullanıcı manuel girmez.
// Kan eşleşmesi zaten personalInfo.bloodType'tan okuduğu için otomatik dolar.
//
// Yetki: ilk read() çağrısında READ izni ister (characteristic: bloodType,
// biologicalSex, dateOfBirth; quantity: height, bodyMass). Kullanıcı reddederse
// veya veri yoksa { available: false } döner — hard reject YOK (best-effort).
//
// NOTE: Bu .swift dosyası Xcode'da App TARGET'ına eklenmiş olmalıdır. Capacitor
// App target içindeki @objc CAPBridgedPlugin sınıflarını otomatik kaydeder;
// ayrı bir bridge/registration adımı gerekmez.

import Foundation
import Capacitor
#if canImport(HealthKit)
import HealthKit
#endif

@objc(HangelHealthPlugin)
public class HangelHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HangelHealthPlugin"
    public let jsName = "HangelHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
    ]

    @objc func read(_ call: CAPPluginCall) {
        #if canImport(HealthKit)
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["available": false]); return
        }
        let store = HKHealthStore()

        var readTypes: Set<HKObjectType> = []
        if let bloodType = HKObjectType.characteristicType(forIdentifier: .bloodType) { readTypes.insert(bloodType) }
        if let sex = HKObjectType.characteristicType(forIdentifier: .biologicalSex) { readTypes.insert(sex) }
        if let dob = HKObjectType.characteristicType(forIdentifier: .dateOfBirth) { readTypes.insert(dob) }
        if let height = HKObjectType.quantityType(forIdentifier: .height) { readTypes.insert(height) }
        if let bodyMass = HKObjectType.quantityType(forIdentifier: .bodyMass) { readTypes.insert(bodyMass) }

        store.requestAuthorization(toShare: nil, read: readTypes) { success, _ in
            guard success else {
                call.resolve(["available": false]); return
            }
            Self.collect(store: store, call: call)
        }
        #else
        call.resolve(["available": false])
        #endif
    }

    #if canImport(HealthKit)
    private static func collect(store: HKHealthStore, call: CAPPluginCall) {
        var result: [String: Any] = ["available": true]

        // Characteristics — senkron okunur (auth verilmişse).
        if let blood = mapBloodType(try? store.bloodType().bloodType) {
            result["bloodType"] = blood
        }
        if let gender = mapBiologicalSex(try? store.biologicalSex().biologicalSex) {
            result["gender"] = gender
        }
        if let comps = try? store.dateOfBirthComponents(),
           let y = comps.year, let m = comps.month, let d = comps.day {
            result["birthDate"] = String(format: "%04d-%02d-%02d", y, m, d)
        }

        // Quantity samples — en son boy + kilo. Async; ikisi tamamlanınca resolve.
        let group = DispatchGroup()

        if let heightType = HKObjectType.quantityType(forIdentifier: .height) {
            group.enter()
            latestQuantity(store: store, type: heightType, unit: HKUnit.meterUnit(with: .centi)) { value in
                if let cm = value { result["height"] = String(Int(cm.rounded())) }
                group.leave()
            }
        }
        if let massType = HKObjectType.quantityType(forIdentifier: .bodyMass) {
            group.enter()
            latestQuantity(store: store, type: massType, unit: HKUnit.gramUnit(with: .kilo)) { value in
                if let kg = value { result["weight"] = String(Int(kg.rounded())) }
                group.leave()
            }
        }

        group.notify(queue: .main) {
            call.resolve(result)
        }
    }

    private static func latestQuantity(
        store: HKHealthStore,
        type: HKQuantityType,
        unit: HKUnit,
        completion: @escaping (Double?) -> Void
    ) {
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: type, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
            guard let sample = samples?.first as? HKQuantitySample else {
                completion(nil); return
            }
            completion(sample.quantity.doubleValue(for: unit))
        }
        store.execute(query)
    }

    // HealthKit HKBloodType → app gösterim değeri. notSet → omit (nil).
    private static func mapBloodType(_ type: HKBloodType?) -> String? {
        guard let type = type else { return nil }
        switch type {
        case .aPositive:  return "A Rh+"
        case .aNegative:  return "A Rh-"
        case .bPositive:  return "B Rh+"
        case .bNegative:  return "B Rh-"
        case .abPositive: return "AB Rh+"
        case .abNegative: return "AB Rh-"
        case .oPositive:  return "0 Rh+"
        case .oNegative:  return "0 Rh-"
        case .notSet:     return nil
        @unknown default: return nil
        }
    }

    // HealthKit HKBiologicalSex → app cinsiyet değeri. female→Kadın, male→Erkek,
    // other/notSet → omit (nil).
    private static func mapBiologicalSex(_ sex: HKBiologicalSex?) -> String? {
        guard let sex = sex else { return nil }
        switch sex {
        case .female: return "Kadın"
        case .male:   return "Erkek"
        case .other:  return nil
        case .notSet: return nil
        @unknown default: return nil
        }
    }
    #endif
}
