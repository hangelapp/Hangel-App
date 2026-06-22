'use client';

import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Loader2, Droplet, Siren, HeartPulse, Activity, HeartHandshake } from 'lucide-react';

import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';
import { readHealthData } from '@/lib/native-health';

const BLOOD_TYPES = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-', 'Bilinmiyor'] as const;
type BloodType = typeof BLOOD_TYPES[number];

interface EmergencyPrefs {
  bloodType?: string;
  bloodNotifications?: boolean;
  canDonateBlood?: boolean;
  stemCellRegistered?: boolean;
  thrombocyteAvailable?: boolean;
  emergencyAvailable?: boolean;
  disasterAlerts?: boolean;
}

export default function EmergencySettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<EmergencyPrefs>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!user || !firestore) return;
    (async () => {
      try {
        const snap = await getDoc(doc(firestore, COLLECTIONS.users, user.uid));
        const data = snap.data() as { personalInfo?: EmergencyPrefs; preferences?: { disasterAlerts?: boolean } } | undefined;
        setPrefs({
          bloodType: data?.personalInfo?.bloodType ?? '',
          bloodNotifications: !!data?.personalInfo?.bloodNotifications,
          canDonateBlood: !!data?.personalInfo?.canDonateBlood,
          stemCellRegistered: !!data?.personalInfo?.stemCellRegistered,
          thrombocyteAvailable: !!data?.personalInfo?.thrombocyteAvailable,
          emergencyAvailable: !!data?.personalInfo?.emergencyAvailable,
          disasterAlerts: !!data?.preferences?.disasterAlerts,
        });
      } catch (e) {
        // Sessiz boş form yerine: yükleme hatasını kullanıcıya bildir.
        toast({ variant: 'destructive', title: t('emergencyPage.loadError'), description: e instanceof Error ? e.message : t('common.unknownError') });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast/t stable; rerun only on user/firestore
  }, [user, firestore]);

  const save = async () => {
    if (!user || !firestore) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, COLLECTIONS.users, user.uid), {
        'personalInfo.bloodType': prefs.bloodType || null,
        'personalInfo.bloodNotifications': !!prefs.bloodNotifications,
        'personalInfo.canDonateBlood': !!prefs.canDonateBlood,
        'personalInfo.stemCellRegistered': !!prefs.stemCellRegistered,
        'personalInfo.thrombocyteAvailable': !!prefs.thrombocyteAvailable,
        'personalInfo.emergencyAvailable': !!prefs.emergencyAvailable,
        'preferences.disasterAlerts': !!prefs.disasterAlerts,
        'preferences.emergencyUpdatedAt': serverTimestamp(),
      });
      toast({ title: t('emergencyPage.saved'), description: t('emergencyPage.savedDesc') });
    } catch (e) {
      toast({ variant: 'destructive', title: t('emergencyPage.saveError'), description: e instanceof Error ? e.message : t('common.unknownError') });
    } finally {
      setSaving(false);
    }
  };

  // Apple Health'ten kan grubu + cinsiyet + doğum tarihini oku, formu doldur ve
  // doğrudan kaydet. Native değilse buton görünmez; veri/izin yoksa bilgi ver.
  const fillFromAppleHealth = async () => {
    if (!user || !firestore) return;
    setHealthLoading(true);
    try {
      const health = await readHealthData();
      if (!health || !health.available) {
        toast({ variant: 'destructive', title: t('emergencyPage.healthUnavailable'), description: t('emergencyPage.healthUnavailableDesc') });
        return;
      }
      const updates: Record<string, string> = {};
      if (health.bloodType) {
        updates['personalInfo.bloodType'] = health.bloodType;
        setPrefs((p) => ({ ...p, bloodType: health.bloodType }));
      }
      if (health.gender) updates['personalInfo.gender'] = health.gender;
      if (health.birthDate) updates['personalInfo.birthDate'] = health.birthDate;
      if (health.height) updates['personalInfo.height'] = health.height;
      if (health.weight) updates['personalInfo.weight'] = health.weight;

      if (Object.keys(updates).length === 0) {
        toast({ variant: 'destructive', title: t('emergencyPage.healthUnavailable'), description: t('emergencyPage.healthUnavailableDesc') });
        return;
      }
      await updateDoc(doc(firestore, COLLECTIONS.users, user.uid), updates);
      toast({ title: t('emergencyPage.healthFilled'), description: t('emergencyPage.healthFilledDesc') });
    } catch (e) {
      toast({ variant: 'destructive', title: t('emergencyPage.saveError'), description: e instanceof Error ? e.message : t('common.unknownError') });
    } finally {
      setHealthLoading(false);
    }
  };

  if (isUserLoading || loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="px-4 sm:px-1">
        <h1 className="text-2xl font-black tracking-tight">{t('emergencyPage.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('emergencyPage.subtitle')}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Droplet className="h-5 w-5 text-red-600" /> {t('emergencyPage.bloodSection')}</CardTitle>
          <CardDescription>{t('emergencyPage.bloodSectionDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">{t('emergencyPage.bloodType')}</label>
            <Select value={prefs.bloodType || ''} onValueChange={(v) => setPrefs((p) => ({ ...p, bloodType: v }))}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder={t('emergencyPage.bloodTypePlaceholder')} /></SelectTrigger>
              <SelectContent>{BLOOD_TYPES.map((bt: BloodType) => (<SelectItem key={bt} value={bt}>{bt === 'Bilinmiyor' ? t('emergencyPage.bloodTypeUnknown') : bt}</SelectItem>))}</SelectContent>
            </Select>
            {isNative && (
              <Button
                type="button"
                variant="outline"
                onClick={fillFromAppleHealth}
                disabled={healthLoading}
                className="w-full h-11 rounded-xl gap-2 mt-1"
              >
                {healthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <HeartHandshake className="h-4 w-4 text-red-600" />}
                {t('emergencyPage.fillFromAppleHealth')}
              </Button>
            )}
          </div>
          <ToggleRow label={t('emergencyPage.bloodNotifications')} checked={!!prefs.bloodNotifications} onChange={(v) => setPrefs((p) => ({ ...p, bloodNotifications: v }))} />
          <ToggleRow label={t('emergencyPage.canDonateBlood')} checked={!!prefs.canDonateBlood} onChange={(v) => setPrefs((p) => ({ ...p, canDonateBlood: v }))} />
          <ToggleRow label={t('emergencyPage.thrombocyte')} checked={!!prefs.thrombocyteAvailable} onChange={(v) => setPrefs((p) => ({ ...p, thrombocyteAvailable: v }))} />
          <ToggleRow label={t('emergencyPage.stemCell')} checked={!!prefs.stemCellRegistered} onChange={(v) => setPrefs((p) => ({ ...p, stemCellRegistered: v }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Siren className="h-5 w-5 text-orange-600" /> {t('emergencyPage.disasterSection')}</CardTitle>
          <CardDescription>{t('emergencyPage.disasterSectionDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow label={t('emergencyPage.disasterAlerts')} checked={!!prefs.disasterAlerts} onChange={(v) => setPrefs((p) => ({ ...p, disasterAlerts: v }))} icon={<HeartPulse className="h-4 w-4 text-orange-600" />} />
          <ToggleRow label={t('emergencyPage.emergencyAvailable')} checked={!!prefs.emergencyAvailable} onChange={(v) => setPrefs((p) => ({ ...p, emergencyAvailable: v }))} icon={<Activity className="h-4 w-4 text-orange-600" />} />
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full h-12 rounded-xl font-bold">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('emergencyPage.save')}
      </Button>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {icon}
        <span className="text-sm font-medium leading-snug">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}
