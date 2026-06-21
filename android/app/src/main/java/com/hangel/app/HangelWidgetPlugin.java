package com.hangel.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.hangel.app.widgets.ImpactScoreWidget;
import com.hangel.app.widgets.UpcomingEventWidget;

/**
 * HangelWidget — Web ↔ ana ekran widget'ları köprüsü (yazma).
 *
 * Web tarafı `HangelWidget.setData(...)` çağırır; bu plugin gelen alanları
 * SharedPreferences("hangel_widget")'a yazar ve dinamik widget sağlayıcılarını
 * (ImpactScoreWidget, UpcomingEventWidget) yeniden çizmeye zorlar. iOS App Group
 * mantığının Android karşılığıdır (bkz. ios/.../HangelWidgetPlugin.swift).
 *
 * SharedPreferences anahtarları (widget'ların okuduğu anahtarlarla BİREBİR aynı):
 *   impactScore        : int
 *   impactRank         : String
 *   upcomingEventTitle : String
 *   upcomingEventStart : long  (epoch ms)
 *   upcomingEventCity  : String
 *   bloodOpen          : int
 *   bloodCity          : String
 *   donationsCount     : int
 *   donationsLabel     : String
 *
 * Sadece çağrıda GELEN alanlar yazılır; gelmeyen alan dokunulmaz. Best-effort:
 * asla reject etmez, daima { ok: true } resolve eder.
 *
 * Capacitor 6+ (proje Capacitor 8) @CapacitorPlugin sınıflarını otomatik keşfeder;
 * MainActivity'de manuel registerPlugin gerekmez (HealthKit plugin'i iOS'ta olduğu gibi).
 */
@CapacitorPlugin(name = "HangelWidget")
public class HangelWidgetPlugin extends Plugin {

    public static final String PREFS = "hangel_widget";

    public static final String KEY_IMPACT_SCORE = "impactScore";
    public static final String KEY_IMPACT_RANK = "impactRank";
    public static final String KEY_EVENT_TITLE = "upcomingEventTitle";
    public static final String KEY_EVENT_START = "upcomingEventStart";
    public static final String KEY_EVENT_CITY = "upcomingEventCity";
    public static final String KEY_BLOOD_OPEN = "bloodOpen";
    public static final String KEY_BLOOD_CITY = "bloodCity";
    public static final String KEY_DONATIONS_COUNT = "donationsCount";
    public static final String KEY_DONATIONS_LABEL = "donationsLabel";

    @PluginMethod
    public void setData(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        // Etki puanı + rütbe.
        if (call.getInt("impactScore") != null) {
            editor.putInt(KEY_IMPACT_SCORE, call.getInt("impactScore"));
        }
        if (call.getString("impactRank") != null) {
            editor.putString(KEY_IMPACT_RANK, call.getString("impactRank"));
        }

        // Yaklaşan etkinlik.
        if (call.getString("upcomingEventTitle") != null) {
            editor.putString(KEY_EVENT_TITLE, call.getString("upcomingEventTitle"));
        }
        if (call.getDouble("upcomingEventStartEpochMs") != null) {
            editor.putLong(KEY_EVENT_START, call.getDouble("upcomingEventStartEpochMs").longValue());
        }
        if (call.getString("upcomingEventLocation") != null) {
            editor.putString(KEY_EVENT_CITY, call.getString("upcomingEventLocation"));
        }

        // Acil kan durumu.
        if (call.getInt("bloodOpenRequests") != null) {
            editor.putInt(KEY_BLOOD_OPEN, call.getInt("bloodOpenRequests"));
        }
        if (call.getString("bloodNearestCity") != null) {
            editor.putString(KEY_BLOOD_CITY, call.getString("bloodNearestCity"));
        }

        // Bağışlar / destek.
        if (call.getInt("donationsCount") != null) {
            editor.putInt(KEY_DONATIONS_COUNT, call.getInt("donationsCount"));
        }
        if (call.getString("donationsLabel") != null) {
            editor.putString(KEY_DONATIONS_LABEL, call.getString("donationsLabel"));
        }

        editor.apply();

        reloadProvider(context, ImpactScoreWidget.class);
        reloadProvider(context, UpcomingEventWidget.class);

        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }

    /** Bir AppWidgetProvider'ın tüm yerleştirilmiş örneklerine ACTION_APPWIDGET_UPDATE gönderir. */
    private void reloadProvider(Context context, Class<?> provider) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, provider);
        int[] ids = mgr.getAppWidgetIds(component);
        if (ids == null || ids.length == 0) return;
        Intent intent = new Intent(context, provider);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        context.sendBroadcast(intent);
    }
}
