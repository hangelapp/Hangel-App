package com.hangel.app.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import com.hangel.app.HangelWidgetPlugin;
import com.hangel.app.R;

/**
 * Etki Puanım widget'ı — iOS ImpactScoreWidget paritesi (DİNAMİK).
 *
 * SharedPreferences("hangel_widget")'tan etki puanını + rütbe etiketini okur ve
 * gösterir. Veri henüz yazılmadıysa placeholder (0 / "Gönüllü") gösterir; web
 * tarafı HangelWidget.setData(...) çağırınca gerçek değerle yeniden çizilir.
 *
 * Tüm kart tıklanınca https://hangel.org.tr/profile App Link'ini açar (Android'de
 * hangel:// şeması YOK; autoVerify HTTPS App Links uygulamayı açar).
 */
public class ImpactScoreWidget extends AppWidgetProvider {

    private static final String ROUTE_URL = "https://hangel.org.tr/profile";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_impact_score);

        SharedPreferences prefs = context.getSharedPreferences(HangelWidgetPlugin.PREFS, Context.MODE_PRIVATE);
        int score = prefs.getInt(HangelWidgetPlugin.KEY_IMPACT_SCORE, 0);
        String rank = prefs.getString(HangelWidgetPlugin.KEY_IMPACT_RANK, "Gönüllü");

        views.setTextViewText(R.id.impact_score_value, String.valueOf(score));
        views.setTextViewText(R.id.impact_rank, rank);

        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(ROUTE_URL));
        intent.setPackage(context.getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
                context,
                201,
                intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        views.setOnClickPendingIntent(R.id.impact_root, pi);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
