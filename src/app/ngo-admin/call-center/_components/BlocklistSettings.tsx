'use client';

/**
 * BlocklistSettings — santral Ayarlar'da kara liste (rahatsız etme) bölümü.
 * Eklenen numaralardan gelen çağrılar panele hiç düşmez (resolve → hangup).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Ban, Plus, Trash2, Loader2 } from 'lucide-react';

export function BlocklistSettings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [numbers, setNumbers] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/blocklist', { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && Array.isArray(data.numbers)) setNumbers(data.numbers);
    } catch { /* boş kalır */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!user || !draft.trim()) return;
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/blocklist', {
        method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ number: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Eklenemedi.');
      setNumbers(data.numbers || []); setDraft('');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Eklenemedi', description: e instanceof Error ? e.message : 'Hata.' });
    } finally { setBusy(false); }
  };

  const remove = async (num: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/ngo-admin/call-center/blocklist?number=${encodeURIComponent(num)}`, {
        method: 'DELETE', headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setNumbers(data.numbers || []);
    } catch { /* sessiz */ }
  };

  return (
    <Card variant="glass" className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><Ban className="h-4 w-4 text-primary" /> Kara Liste (Rahatsız Etme)</CardTitle>
        <CardDescription className="text-xs">Bu numaralardan gelen çağrılar panelinize hiç düşmez.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void add(); }}
            placeholder="05XX XXX XX XX" className="rounded-xl" />
          <Button onClick={add} disabled={busy || !draft.trim()} className="rounded-xl shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : numbers.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">Kara listede numara yok.</p>
        ) : (
          <div className="space-y-1.5">
            {numbers.map((n) => (
              <div key={n} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <span className="text-sm tabular-nums">{n}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(n)} aria-label="Kaldır">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
