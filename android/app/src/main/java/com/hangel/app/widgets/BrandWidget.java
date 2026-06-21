package com.hangel.app.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

import com.hangel.app.R;

/**
 * hangel markalı widget (2x2, statik) — wordmark + "umudu büyütüyoruz" tagline.
 * Tüm kart tıklanınca https://hangel.org.tr/ App Link'i ile uygulamayı açar.
 */
public class BrandWidget extends AppWidgetProvider {

    private static final String HOME_URL = "https://hangel.org.tr/";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_brand);

        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(HOME_URL));
        intent.setPackage(context.getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
                context,
                100,
                intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        views.setOnClickPendingIntent(R.id.brand_root, pi);
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
