'use client';

/**
 * /alerts — Yakın afet ve acil durum çağrıları.
 *
 * Backend: /api/users/me/disaster-alerts (preferences.disasterAlerts true ise)
 * Konum gerekli.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Siren, MapPin, AlertCircle, ExternalLink, Loader2, Settings as SettingsIcon } from 'lucide-react';

import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCurrentPositionUnified } from '@/lib/native-geolocation';
import { useTranslation } from '@/components/providers/language-provider';

interface DisasterAlert {
  id: string;
  title?: string;
  type?: 'earthquake' | 'flood' | 'fire' | 'storm' | 'other';
  severity?: 'critical' | 'high' | 'normal';
  description?: string;
  location?: string;
  helpUrl?: string;
  distanceKm?: number;
}

const TYPE_EMOJI: Record<string, string> = {
  earthquake: '🌍',
  flood: '🌊',
  fire: '🔥',
  storm: '⛈️',
  other: '⚠️',
};

export default function DisasterAlertsPage() {
  const { user, isUserLoading } = useUser();
  const { t } = useTranslation();
  const TYPE_LABELS: Record<string, string> = {
    earthquake: t('alertsPage.typeEarthquake'),
    flood: t('alertsPage.typeFlood'),
    fire: t('alertsPage.typeFire'),
    storm: t('alertsPage.typeStorm'),
    other: t('alertsPage.typeOther'),
  };
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [optedOut, setOptedOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const pos = await getCurrentPositionUnified();
        if (!pos) {
          setNeedsLocation(true);
          setLoading(false);
          return;
        }
        const idToken = await user.getIdToken();
        const params = new URLSearchParams({
          lat: String(pos.latitude),
          lng: String(pos.longitude),
          radiusKm: '200',
        });
        const res = await fetch(`/api/users/me/disaster-alerts?${params.toString()}`, {
          headers: { authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (data?.message === 'Afet bildirimleri kapalı.') {
          setOptedOut(true);
        } else if (data?.ok) {
          setAlerts(data.alerts ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (isUserLoading || loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (optedOut) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-black tracking-tight">{t('alertsPage.title')}</h1>
        <Card><CardContent className="pt-6 text-center text-sm space-y-3">
          <Siren className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{t('alertsPage.optedOut')}</p>
          <Button asChild><Link href="/settings/emergency"><SettingsIcon className="h-4 w-4 mr-2" />{t('alertsPage.settingsCta')}</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  if (needsLocation) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-black tracking-tight">{t('alertsPage.title')}</h1>
        <Card><CardContent className="pt-6 text-center text-sm">
          <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">{t('alertsPage.locationNeeded')}</p>
          <Button onClick={() => location.reload()}>{t('alertsPage.grantLocation')}</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight">{t('alertsPage.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {alerts.length > 0 ? `${alerts.length} ${t('alertsPage.activeCountSuffix')}` : t('alertsPage.noneActive')}
        </p>
      </div>

      {alerts.length === 0 && (
        <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">
          <Siren className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p>{t('alertsPage.noneNearby')}</p>
        </CardContent></Card>
      )}

      {alerts.map((alert) => (
        <Card key={alert.id} className={alert.severity === 'critical' ? 'border-2 border-red-500' : alert.severity === 'high' ? 'border-2 border-orange-400' : ''}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold text-base leading-snug flex items-center gap-2">
                <span>{TYPE_EMOJI[alert.type ?? 'other']}</span>
                {alert.title || TYPE_LABELS[alert.type ?? 'other']}
              </h2>
              {alert.severity === 'critical' && (
                <Badge variant="destructive" className="shrink-0 gap-1"><AlertCircle className="h-3 w-3" /> {t('alertsPage.criticalBadge')}</Badge>
              )}
            </div>
            {alert.description && <p className="text-sm leading-snug">{alert.description}</p>}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {alert.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{alert.location}</span>}
              {alert.distanceKm != null && <span>{alert.distanceKm.toFixed(0)} {t('alertsPage.distanceSuffix')}</span>}
            </div>
            {alert.helpUrl && (
              <Button asChild size="sm" variant="outline" className="w-full mt-2">
                <a href={alert.helpUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> {t('alertsPage.helpInfo')}
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
