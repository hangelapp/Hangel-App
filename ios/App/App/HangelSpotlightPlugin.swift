// HangelSpotlightPlugin — CoreSpotlight indeksleme köprüsü (Faz 2).
//
// Web tarafından STK, etkinlik, kampanya ve gönüllü fırsatları periyodik
// olarak indekslenir. iOS sistem Spotlight aramasında (ana ekran sağa kaydır)
// kullanıcı "Kızılay" arayınca Hangel STK'ları çıkar; tıklayınca Universal
// Link ile app açılır.
//
// AppDelegate `continueUserActivity` handler'ı CSSearchableItemActionType'ı
// yakalayıp uniqueIdentifier'ı (`<domain>:<id>`) path'e çevirip Capacitor
// WebView'a yönlendirir. Mevcut deep-link bridge (NativeBridgeProvider)
// üzerinden çalışır.

import Foundation
import Capacitor
import CoreSpotlight
#if canImport(UniformTypeIdentifiers)
import UniformTypeIdentifiers
#endif

@objc(HangelSpotlightPlugin)
public class HangelSpotlightPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HangelSpotlightPlugin"
    public let jsName = "HangelSpotlight"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "indexItems", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deindexItems", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deindexDomain", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deindexAll", returnType: CAPPluginReturnPromise),
    ]

    @objc func indexItems(_ call: CAPPluginCall) {
        guard let items = call.getArray("items") else {
            call.reject("items zorunlu (array)"); return
        }
        var spotlightItems: [CSSearchableItem] = []
        for raw in items {
            guard let dict = raw as? [String: Any],
                  let id = dict["id"] as? String,
                  let title = dict["title"] as? String,
                  let domain = dict["domain"] as? String else { continue }
            let attrs: CSSearchableItemAttributeSet
            if #available(iOS 14.0, *) {
                attrs = CSSearchableItemAttributeSet(contentType: UTType.text)
            } else {
                attrs = CSSearchableItemAttributeSet(itemContentType: "public.text")
            }
            attrs.title = title
            if let desc = dict["description"] as? String { attrs.contentDescription = desc }
            if let kw = dict["keywords"] as? [String] { attrs.keywords = kw }
            if let thumb = dict["thumbnailUrl"] as? String, let url = URL(string: thumb) {
                attrs.thumbnailURL = url
            }
            let unique = "\(domain):\(id)"
            let sItem = CSSearchableItem(uniqueIdentifier: unique, domainIdentifier: domain, attributeSet: attrs)
            sItem.expirationDate = Date.distantFuture
            spotlightItems.append(sItem)
        }
        if spotlightItems.isEmpty {
            call.resolve(["indexed": 0]); return
        }
        CSSearchableIndex.default().indexSearchableItems(spotlightItems) { err in
            if let e = err {
                call.reject("indexSearchableItems: \(e.localizedDescription)")
            } else {
                call.resolve(["indexed": spotlightItems.count])
            }
        }
    }

    @objc func deindexItems(_ call: CAPPluginCall) {
        guard let ids = call.getArray("ids") as? [String] else { call.reject("ids zorunlu"); return }
        CSSearchableIndex.default().deleteSearchableItems(withIdentifiers: ids) { err in
            if let e = err { call.reject("delete: \(e.localizedDescription)") }
            else { call.resolve(["deindexed": ids.count]) }
        }
    }

    @objc func deindexDomain(_ call: CAPPluginCall) {
        guard let domain = call.getString("domain") else { call.reject("domain zorunlu"); return }
        CSSearchableIndex.default().deleteSearchableItems(withDomainIdentifiers: [domain]) { err in
            if let e = err { call.reject("deleteDomain: \(e.localizedDescription)") }
            else { call.resolve(["domain": domain]) }
        }
    }

    @objc func deindexAll(_ call: CAPPluginCall) {
        CSSearchableIndex.default().deleteAllSearchableItems { err in
            if let e = err { call.reject("deleteAll: \(e.localizedDescription)") }
            else { call.resolve(["ok": true]) }
        }
    }
}
