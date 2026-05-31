'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Loader2, Droplet, Siren, HeartPulse, Activity } from 'lucide-react';

import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';

const BLOOD_TYPES = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-', 'Bilinmiyor'];

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
      } finally {
        setLoading(false);
      }
    })();
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
      toast({ variant: 'destructive', title: t('emergencyPage.saveError'), description: e instanceof Error ? e.message : 'Bilinmeyen hata.' });
    } finally {
      setSaving(false);
    }
  };

  if (isUserLoading || loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="px-1">
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
              <SelectContent>{BLOOD_TYPES.map((bt) => (<SelectItem key={bt} value={bt}>{bt}</SelectItem>))}</SelectContent>
            </Select>
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
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-2 flex-1">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
