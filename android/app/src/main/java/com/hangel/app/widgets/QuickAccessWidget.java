package com.hangel.app.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

import com.hangel.app.R;

/**
 * hangel Hızlı Erişim widget'ı — iOS QuickAccessWidget paritesi (statik, veri gerektirmez).
 *
 * 4 kutu, her biri kendi PendingIntent'i ile hangel.org App Link'ini açar. Android'de
 * özel "hangel://" şeması YOK; HTTPS App Links (autoVerify) Capacitor uygulamasını açar.
 *
 *   Bağış      → https://hangel.org/social-impact
 *   Gönüllülük → https://hangel.org/volunteering
 *   Etkinlikler→ https://hangel.org/events
 *   Acil Kan   → https://hangel.org/blood
 *
 * İçerik statik → updatePeriodMillis 0; sadece onUpdate/onEnabled'da bir kez kurulur.
 */
public class QuickAccessWidget extends AppWidgetProvider {

    private static final String BASE_URL = "https://hangel.org";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_access);

        // Her kutuya kendi App Link PendingIntent'ini bağla.
        views.setOnClickPendingIntent(R.id.tile_donation,
                deepLink(context, "/social-impact", 1));
        views.setOnClickPendingIntent(R.id.tile_volunteering,
                deepLink(context, "/volunteering", 2));
        views.setOnClickPendingIntent(R.id.tile_events,
                deepLink(context, "/events", 3));
        views.setOnClickPendingIntent(R.id.tile_blood,
                deepLink(context, "/blood", 4));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /**
     * ACTION_VIEW ile https://hangel.org/{route} açan PendingIntent üretir.
     * FLAG_IMMUTABLE (API 23+; bu projede minSdk 24) ve her kutu için ayrı requestCode.
     */
    private static PendingIntent deepLink(Context context, String route, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(BASE_URL + route));
        // App Links zaten doğrulandığından paket hedeflemeye gerek yok; yine de
        // uygulamanın kendisine yönlendirip tarayıcı seçicisini atlamak için paketi sabitle.
        intent.setPackage(context.getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    /** İsteğe bağlı yardımcı: tüm yerleştirilmiş örnekleri yeniden çiz. */
    static void refreshAll(Context context) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(context, QuickAccessWidget.class));
        for (int id : ids) {
            updateAppWidget(context, mgr, id);
        }
    }
}
