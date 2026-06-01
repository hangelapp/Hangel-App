'use client';

/**
 * /blood — Kullanıcının kan grubuna + konumuna göre yakın aktif kan ilanları.
 *
 * Backend: /api/users/me/blood-feed (canDonateBlood true ise)
 * Konum: getCurrentPositionUnified (native iOS + web)
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Droplet, MapPin, Phone, AlertCircle, Loader2 } from 'lucide-react';

import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { getCurrentPositionUnified } from '@/lib/native-geolocation';
import { useTranslation } from '@/components/providers/language-provider';

interface BloodCall {
  id: string;
  title?: string;
  bloodTypes?: string[];
  donationType?: 'blood' | 'platelet' | 'stem-cell';
  urgency?: 'critical' | 'high' | 'normal';
  location?: string;
  hospitalName?: string;
  contactPhone?: string;
  distanceKm?: number;
}

export default function BloodFeedPage() {
  const { user, isUserLoading } = useUser();
  const { t } = useTranslation();
  const [calls, setCalls] = useState<BloodCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsLocation, setNeedsLocation] = useState(false);

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
          radiusKm: '50',
        });
        const res = await fetch(`/api/users/me/blood-feed?${params.toString()}`, {
          headers: { authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.message || t('bloodPage.loadError'));
        setCalls(data.calls ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('bloodPage.unknownError'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (isUserLoading || loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (needsLocation) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-black tracking-tight">{t('bloodPage.title')}</h1>
        <Card><CardContent className="pt-6 text-center text-sm">
          <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">{t('bloodPage.locationNeeded')}</p>
          <Button onClick={() => location.reload()}>{t('bloodPage.grantLocation')}</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight">{t('bloodPage.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {calls.length > 0 ? `${calls.length} ${t('bloodPage.activeCountSuffix')}` : t('bloodPage.noneActive')}
        </p>
      </div>

      {error && (
        <Card><CardContent className="pt-4 text-sm text-red-600">{error}</CardContent></Card>
      )}

      {calls.length === 0 && !error && (
        <EmptyState
          icon={Droplet}
          title={t('emptyStates.bloodTitle')}
          description={t('emptyStates.bloodDesc')}
          action={{ label: t('emptyStates.bloodAction'), href: '/settings/emergency' }}
        />
      )}

      {calls.map((call) => (
        <Card key={call.id} className={call.urgency === 'critical' ? 'border-2 border-red-500' : ''}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold text-base leading-snug">{call.title || t('bloodPage.defaultTitle')}</h2>
              {call.urgency === 'critical' && (
                <Badge variant="destructive" className="shrink-0 gap-1"><AlertCircle className="h-3 w-3" /> {t('bloodPage.criticalBadge')}</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {(call.bloodTypes ?? []).map((bt) => (
                <Badge key={bt} variant="outline" className="font-mono font-bold">{bt}</Badge>
              ))}
            </div>
            {call.hospitalName && (
              <p className="text-sm">
                <span className="font-medium">{call.hospitalName}</span>
                {call.location && <span className="text-muted-foreground"> · {call.location}</span>}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {call.distanceKm != null && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {call.distanceKm.toFixed(1)} km</span>
              )}
              {call.donationType && (
                <Badge variant="secondary" className="text-[10px]">
                  {call.donationType === 'platelet' ? t('bloodPage.donationPlatelet') : call.donationType === 'stem-cell' ? t('bloodPage.donationStemCell') : t('bloodPage.donationBlood')}
                </Badge>
              )}
            </div>
            {call.contactPhone && (
              <Button asChild size="sm" className="w-full mt-2">
                <Link href={`tel:${call.contactPhone}`}>
                  <Phone className="h-4 w-4 mr-2" /> {t('bloodPage.contactHospital')}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
