'use client';

/**
 * MailFeatureToggle — süper-admin'in bir STK'ya "workspace toplu mail" özelliğini
 * açıp/kapatmasını sağlayan switch.
 *
 * Yalnız ngos/{id}.featureFlags.bulkMailEnabled okur/yazar (başka alan elleme).
 * Toggle, idToken alıp POST /api/super-admin/ngos/[id]/mail-feature { enabled }
 * çağırır; sonuç toast ile bildirilir.
 *
 * ENTEGRASYON (bu lane edit/page.tsx'i DEĞİŞTİRMEZ):
 *   edit/page.tsx içinde "Platform Durumu" alanı civarına şunu ekleyin:
 *     import { MailFeatureToggle } from './_components/MailFeatureToggle';
 *     <MailFeatureToggle
 *       ngoId={id}
 *       initialEnabled={Boolean(ngo?.featureFlags?.bulkMailEnabled)}
 *     />
 */

import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface MailFeatureToggleProps {
  ngoId: string;
  initialEnabled: boolean;
}

export function MailFeatureToggle({ ngoId, initialEnabled }: MailFeatureToggleProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState<boolean>(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleToggle(next: boolean) {
    if (saving) return;
    if (!user) {
      toast({ title: 'Oturum gerekli', description: 'Lütfen tekrar giriş yapın.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const previous = enabled;
    setEnabled(next); // optimistik
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/super-admin/ngos/${ngoId}/mail-feature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || 'İşlem başarısız oldu.');
      }
      toast({
        title: next ? 'workspace toplu mail açıldı' : 'workspace toplu mail kapatıldı',
        description: next
          ? 'Bu STK kendi Workspace adresinden toplu mail gönderebilir.'
          : 'Bu STK için toplu mail gönderimi devre dışı.',
      });
    } catch (err) {
      setEnabled(previous); // geri al
      toast({
        title: 'Kaydedilemedi',
        description: err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        </span>
        <div>
          <p className="text-sm font-medium">workspace toplu mail</p>
          <p className="text-xs text-muted-foreground">
            STK kendi Workspace adresinden toplu mail gönderebilir 🧡
          </p>
          <p className="mt-1 text-xs font-medium">
            Durum: {enabled ? 'açık' : 'kapalı'}
          </p>
        </div>
      </div>
      <Switch
        checked={enabled}
        disabled={saving}
        onCheckedChange={handleToggle}
        aria-label="workspace toplu mail özelliğini aç/kapat"
      />
    </div>
  );
}
