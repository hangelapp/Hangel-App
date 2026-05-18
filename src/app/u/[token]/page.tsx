'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, AlertTriangle, Mail, MessageSquare } from 'lucide-react';

interface Info {
  userId: string;
  email: { enabled: boolean };
  sms: { enabled: boolean };
}

export default function UnsubscribePage() {
  const params = useParams<{ token: string }>();
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.token) return;
    (async () => {
      try {
        const res = await fetch(`/api/messaging/unsubscribe?token=${encodeURIComponent(params.token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Hata');
        setInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [params.token]);

  const doUnsubscribe = async (target: 'email' | 'sms' | 'all') => {
    setSubmitting(target);
    try {
      const res = await fetch('/api/messaging/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: params.token,
          channel: target === 'all' ? undefined : target,
          all: target === 'all',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Hata');
      setDone(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Pazarlama Aboneliği</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-900">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {done && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-900">
              <Check className="h-4 w-4 mt-0.5" />
              <span>
                {done === 'all'
                  ? 'Tüm pazarlama iletişiminden çıktın.'
                  : done === 'email'
                  ? 'E-posta pazarlama bildirimleri durduruldu.'
                  : 'SMS pazarlama bildirimleri durduruldu.'}
              </span>
            </div>
          )}

          {info && !done && (
            <>
              <p className="text-sm text-muted-foreground">
                Aşağıdaki kanallardan pazarlama iletişimini durdurabilirsin.
              </p>

              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={!info.email.enabled || submitting !== null}
                onClick={() => doUnsubscribe('email')}
              >
                {submitting === 'email' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                E-postaları durdur {info.email.enabled ? '' : '(zaten kapalı)'}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={!info.sms.enabled || submitting !== null}
                onClick={() => doUnsubscribe('sms')}
              >
                {submitting === 'sms' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                SMS'leri durdur {info.sms.enabled ? '' : '(zaten kapalı)'}
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                disabled={(!info.email.enabled && !info.sms.enabled) || submitting !== null}
                onClick={() => doUnsubscribe('all')}
              >
                {submitting === 'all' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Tümünden çık
              </Button>
            </>
          )}

          <p className="text-xs text-muted-foreground text-center pt-2">
            Bu işlem KVKK uyarınca İleti Yönetim Sistemi (İYS) ile senkronlanır.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
