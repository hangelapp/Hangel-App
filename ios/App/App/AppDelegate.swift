import UIKit
import Capacitor
import FirebaseCore
import FirebaseCrashlytics

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Firebase + Crashlytics — explicit init.
        // capacitor-firebase/crashlytics plugin lazy olarak FirebaseApp.configure()
        // yapıyor ama Crashlytics'in en erken anda hazır olması (BGTask handler,
        // crash before web-view loaded, vb. için) için burada kuruyoruz.
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        Crashlytics.crashlytics().setCrashlyticsCollectionEnabled(true)

        // BGTaskScheduler identifier register'ları (geofence-sync + feed-refresh).
        // ÇOK ERKEN çağrılmalı (didFinishLaunching döner dönmez), aksi halde iOS
        // identifier eşleştirmeyi başaramaz.
        HangelBackgroundTasksPlugin.registerTasks()
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // Silent push (aps.content-available=1) handler — HangelSilentPushPlugin'a iletir.
    //
    // APNs silent push'larda iOS uygulamayı uyandırır; biz NotificationCenter
    // üzerinden plugin'e payload'ı bildiririz. Plugin web tarafına `silentPush`
    // event'i emit eder. Tamamlandığında completionHandler ile iOS'a "newData"
    // sinyali döneriz (background fetch budget'ini kullanmaya devam etmek için).
    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        let isSilent: Bool = {
            guard let aps = userInfo["aps"] as? [String: Any] else { return false }
            return (aps["content-available"] as? Int) == 1
        }()

        if isSilent {
            // Normalize keys to [String: Any] for Notification.userInfo
            var payload: [String: Any] = [:]
            for (k, v) in userInfo {
                if let key = k as? String { payload[key] = v }
            }
            NotificationCenter.default.post(
                name: HangelSilentPushPlugin.silentPushNotification,
                object: nil,
                userInfo: payload
            )
            // Capacitor / FCM plugin'leri push'u görmeli; "noData" değil "newData"
            completionHandler(.newData)
            return
        }

        // Visible push (alert/sound/badge) → Capacitor / FCM zinciri ele alır.
        completionHandler(.noData)
    }

}
