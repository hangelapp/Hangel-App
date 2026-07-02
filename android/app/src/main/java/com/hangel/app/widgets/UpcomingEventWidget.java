package com.hangel.app.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import com.hangel.app.HangelWidgetPlugin;
import com.hangel.app.R;

/**
 * Yaklaşan Etkinlik widget'ı — iOS UpcomingEventWidget paritesi (DİNAMİK).
 *
 * SharedPreferences("hangel_widget")'tan bir sonraki etkinliğin adını, başlangıç
 * zamanını (epoch ms) ve şehrini okur; başlığa kalan süreyi (gün/saat/dk) gösterir.
 * Veri yoksa "Yaklaşan etkinlik yok" placeholder'ı gösterir. Web tarafı
 * HangelWidget.setData(...) çağırınca gerçek değerle yeniden çizilir.
 *
 * NOT: RemoteViews canlı saniye-saniye sayaç tutmaz (iOS timerInterval gibi); o
 * yüzden çizim anındaki kalan süre metni yazılır. setData her oturum çağrıldığı
 * için değer tazelenir; ayrıca onUpdate updatePeriodMillis ile periyodik yenilenir.
 *
 * Tüm kart tıklanınca https://hangel.org/events App Link'ini açar.
 */
public class UpcomingEventWidget extends AppWidgetProvider {

    private static final String ROUTE_URL = "https://hangel.org/events";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_upcoming_event);

        SharedPreferences prefs = context.getSharedPreferences(HangelWidgetPlugin.PREFS, Context.MODE_PRIVATE);
        String title = prefs.getString(HangelWidgetPlugin.KEY_EVENT_TITLE, "");
        long startMs = prefs.getLong(HangelWidgetPlugin.KEY_EVENT_START, 0L);
        String city = prefs.getString(HangelWidgetPlugin.KEY_EVENT_CITY, "");

        boolean hasEvent = !title.isEmpty() && startMs > 0;

        if (hasEvent) {
            views.setTextViewText(R.id.event_title, title);
            views.setTextViewText(R.id.event_countdown, countdownText(startMs));
        } else {
            views.setTextViewText(R.id.event_title, "Yaklaşan etkinlik yok");
            views.setTextViewText(R.id.event_countdown, "Planlanan etkinlik yok");
        }

        if (hasEvent && !city.isEmpty()) {
            views.setTextViewText(R.id.event_city, city);
            views.setViewVisibility(R.id.event_city, View.VISIBLE);
        } else {
            views.setViewVisibility(R.id.event_city, View.GONE);
        }

        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(ROUTE_URL));
        intent.setPackage(context.getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
                context,
                202,
                intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        views.setOnClickPendingIntent(R.id.event_root, pi);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /** Kalan süreyi insan-okur biçimde döner (örn. "3 gün", "5 sa", "12 dk", "Başladı"). */
    private static String countdownText(long startMs) {
        long diff = startMs - System.currentTimeMillis();
        if (diff <= 0) return "Başladı";
        long minutes = diff / 60000L;
        long hours = minutes / 60L;
        long days = hours / 24L;
        if (days >= 1) return days + " gün";
        if (hours >= 1) return hours + " sa";
        return Math.max(minutes, 1) + " dk";
    }
}
