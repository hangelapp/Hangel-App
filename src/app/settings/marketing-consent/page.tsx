'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, MessageSquare, Mail, Shield } from 'lucide-react';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

interface ConsentDoc {
  email?: { enabled: boolean; updatedAt?: unknown; source?: string };
  sms?: { enabled: boolean; updatedAt?: unknown; source?: string };
}

export default function MarketingConsentPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [existingDoc, setExistingDoc] = useState<boolean>(false);

  useEffect(() => {
    if (isUserLoading || !user) return;
    (async () => {
      const snap = await getDoc(doc(db, COLLECTIONS.userMarketingConsent, user.uid));
      if (snap.exists()) {
        const d = snap.data() as ConsentDoc;
        setEmailEnabled(d.email?.enabled ?? false);
        setSmsEnabled(d.sms?.enabled ?? false);
        setExistingDoc(true);
      }
      setLoading(false);
    })();
  }, [db, user, isUserLoading]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const ref = doc(db, COLLECTIONS.userMarketingConsent, user.uid);
      const payload: Record<string, unknown> = {
        email: { enabled: emailEnabled, source: 'user', updatedAt: serverTimestamp() },
        sms: { enabled: smsEnabled, source: 'user', updatedAt: serverTimestamp() },
        channelAddresses: {
          email: user.email ?? null,
        },
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, payload, { merge: true });
      toast({ title: t('dashboard.settingsMarketing.toastSavedTitle') });
      setExistingDoc(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: t('dashboard.settingsMarketing.toastErrorTitle'), description: message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || isUserLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-sm text-muted-foreground">Oturum açmanız gerekiyor.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> {t('dashboard.settingsMarketing.backToSettings')}
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsMarketing.heading')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('dashboard.settingsMarketing.subheading')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.settingsMarketing.prefsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-3 border rounded">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded bg-blue-100 flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <Label className="text-sm font-medium">{t('dashboard.settingsMarketing.emailLabel')}</Label>
                <p className="text-xs text-muted-foreground">{t('dashboard.settingsMarketing.emailDesc')}</p>
              </div>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 border rounded">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded bg-emerald-100 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <Label className="text-sm font-medium">{t('dashboard.settingsMarketing.smsLabel')}</Label>
                <p className="text-xs text-muted-foreground">{t('dashboard.settingsMarketing.smsDesc')}</p>
              </div>
            </div>
            <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('dashboard.settingsMarketing.saveBtn')}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p>
                <strong>KVKK ve İYS:</strong> İzinlerini istediğin zaman buradan veya gelen mesajdaki "Aboneliği iptal et"
                bağlantısıyla geri çekebilirsin. İzinler İleti Yönetim Sistemi (İYS) ile senkron tutulur.
              </p>
              {!existingDoc && (
                <p className="mt-1">
                  Henüz açık bir tercihin yok — varsayılan olarak <strong>kapalı</strong> kabul edilir, yani sana pazarlama mesajı gönderilmez.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
