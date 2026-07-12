'use client';

/**
 * NotificationBell — panel bildirim çanı.
 * Santral açık olmasa bile yöneticiye iki durumu gösterir:
 *   - Cevapsız gelen çağrılar
 *   - Geri arama zamanı gelmiş kayıtlar
 * Veri /api/ngo-admin/call-center/notifications'tan gelir (türetilmiş, ekstra
 * yazma yok). 60 sn'de bir yenilenir. Öğeye tıklayınca ilgili kişiyi arama
 * sayfasına götürür; "tamam"la işaretleyince listeden düşer.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Bell, PhoneMissed, Clock3, Check, Loader2 } from 'lucide-react';

interface NotificationItem {
  id: string;
  kind: 'missed' | 'callback';
  contactId: string | null;
  contactName: string | null;
  number: string | null;
  at: string | null;
  disposition: string | null;
}

function fmtWhen(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch { return ''; }
}

export function NotificationBell() {
  const { user } = useUser();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/notifications', { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) setItems(data.items);
    } catch { /* sessiz */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    void load();
    const t = setInterval(() => { void load(); }, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const dismiss = async (item: NotificationItem) => {
    if (!user) return;
    setItems((prev) => prev.filter((i) => !(i.id === item.id && i.kind === item.kind)));
    try {
      const token = await user.getIdToken();
      await fetch('/api/ngo-admin/call-center/notifications', {
        method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ id: item.id, kind: item.kind }),
      });
    } catch { void load(); }
  };

  const count = items.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full h-10 w-10 shrink-0" aria-label="Bildirimler">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <p className="text-sm font-semibold">Bildirimler</p>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {count === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">Yeni bildirim yok. 🎉</p>
          ) : (
            items.map((item) => {
              const isCallback = item.kind === 'callback';
              const title = item.contactName || item.number || 'Bilinmeyen numara';
              return (
                <div key={`${item.kind}-${item.id}`} className="flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/30">
                  <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${isCallback ? 'bg-amber-500/15 text-amber-600' : 'bg-primary/15 text-primary'}`}>
                    {isCallback ? <Clock3 className="h-4 w-4" /> : <PhoneMissed className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">
                      {isCallback ? 'Geri arama zamanı' : 'Cevapsız çağrı'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{title}</p>
                    {item.at && <p className="text-[11px] text-muted-foreground/80 mt-0.5">{fmtWhen(item.at)}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {item.contactId && (
                        <Button asChild size="sm" variant="secondary" className="h-7 rounded-lg text-xs px-2" onClick={() => setOpen(false)}>
                          <Link href={`/ngo-admin/call-center/call/${item.contactId}`}>Ara</Link>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs px-2" onClick={() => dismiss(item)}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Tamam
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
