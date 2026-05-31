'use client';

/**
 * /settings/intents — Welcome'da seçilen intent'leri sonradan değiştir.
 *
 * GET /api/users/me/intents → mevcut
 * PATCH /api/users/me/intents → güncelle
 */

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';

type IntentKey =
  | 'donate' | 'volunteer' | 'blood' | 'follow_csr' | 'discover_ngos'
  | 'emergency' | 'student_clubs' | 'library' | 'browse_only';

const INTENT_KEYS: IntentKey[] = [
  'donate', 'volunteer', 'blood', 'follow_csr', 'discover_ngos',
  'emergency', 'student_clubs', 'library', 'browse_only',
];

export default function IntentsSettingsPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<IntentKey>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/users/me/intents', {
          headers: { authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (data?.ok && Array.isArray(data.intents)) {
          setSelected(new Set(data.intents as IntentKey[]));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const toggle = (key: IntentKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (key === 'browse_only') {
        if (next.has('browse_only')) next.delete('browse_only');
        else { next.clear(); next.add('browse_only'); }
        return next;
      }
      if (next.has('browse_only')) next.delete('browse_only');
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/users/me/intents', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ intents: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Kaydedilemedi');
      toast({ title: t('welcome.intentTitle'), description: 'Tercihlerin güncellendi.' });
    } catch (e) {
      toast({ variant: 'destructive', title: t('welcome.saveError'), description: e instanceof Error ? e.message : 'Bilinmeyen hata.' });
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
      <div className="px-4 sm:px-1">
        <h1 className="text-2xl font-black tracking-tight">{t('welcome.intentTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('welcome.intentSubtitle')}</p>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4 space-y-2">
          {INTENT_KEYS.map((key) => {
            const checked = selected.has(key);
            const isBrowse = key === 'browse_only';
            return (
              <label
                key={key}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  checked ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(key)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug">{t(`welcome.intents.${key}`)}</p>
                  {isBrowse && (
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{t('welcome.intents.browseOnlyNote')}</p>
                  )}
                </div>
              </label>
            );
          })}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving || selected.size === 0} className="w-full h-12 rounded-xl font-bold">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kaydet'}
      </Button>
    </div>
  );
}
