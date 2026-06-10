'use client';
/**
 * Giriş/Çıkış diyaloğu — bir kullanıcının oturum geçmişini (users/{uid}/activity
 * open/close olayları) oturum oturum listeler: giriş saati, çıkış saati ve
 * online kalınan süre (dakika). "Şifre Sıfırla" butonunun yerine eklendi.
 *
 * Eşleştirme: olaylar zaman sırasına dizilir; her 'open' kendisinden sonraki
 * ilk 'close' ile eşleşir. Karşılığı olmayan 'open' → "Devam ediyor".
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, Loader2, Smartphone, Monitor, Activity } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, type Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useMemo } from 'react';
import type { UserRow } from './types';

interface ActivityEvent {
  id: string;
  type?: 'open' | 'close';
  at?: Timestamp;
  deviceName?: string;
  browserName?: string;
  deviceType?: string;
  sessionId?: string;
}

interface SessionSpan {
  key: string;
  login: number;
  logout: number | null;
  device: string;
  isApp: boolean;
}

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtTime = (ms: number) => new Date(ms).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const fmtDur = (ms: number) => {
  const min = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} sa ${m} dk` : `${m} dk`;
};

export const SessionLogDialog = ({ user, open, onOpenChange }: { user: UserRow | null; open: boolean; onOpenChange: (o: boolean) => void; }) => {
  const db = useFirestore();
  const activityQuery = useMemoFirebase(
    () => (user?.id ? query(collection(db, COLLECTIONS.users, user.id, 'activity'), orderBy('at', 'desc'), limit(500)) : null),
    [db, user?.id],
  );
  const { data: events, isLoading } = useCollection<ActivityEvent>(activityQuery);

  const spans = useMemo<SessionSpan[]>(() => {
    const asc = [...(events || [])]
      .filter(e => e.at?.toDate)
      .sort((a, b) => a.at!.toDate().getTime() - b.at!.toDate().getTime());
    const out: SessionSpan[] = [];
    let pending: ActivityEvent | null = null;
    const pushOpenEnded = (e: ActivityEvent) => out.push({
      key: e.id, login: e.at!.toDate().getTime(), logout: null,
      device: e.deviceName || '—', isApp: e.browserName === 'Hangel App',
    });
    for (const e of asc) {
      if (e.type === 'open') {
        if (pending) pushOpenEnded(pending); // önceki açık oturum kapanmadan yenisi açıldı
        pending = e;
      } else if (e.type === 'close' && pending) {
        out.push({
          key: pending.id,
          login: pending.at!.toDate().getTime(),
          logout: e.at!.toDate().getTime(),
          device: pending.deviceName || e.deviceName || '—',
          isApp: (pending.browserName || e.browserName) === 'Hangel App',
        });
        pending = null;
      }
    }
    if (pending) pushOpenEnded(pending);
    return out.reverse(); // en yeni üstte
  }, [events]);

  const totalMin = useMemo(
    () => spans.reduce((s, x) => s + (x.logout != null ? Math.max(0, Math.round((x.logout - x.login) / 60000)) : 0), 0),
    [spans],
  );

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] max-w-lg">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Giriş / Çıkış Kayıtları
          </DialogTitle>
          <DialogDescription className="text-xs">
            {user.name || 'Kullanıcı'} · {spans.length} oturum
            {totalMin > 0 && <> · toplam <span className="font-bold text-foreground">{fmtDur(totalMin * 60000)}</span> online</>}
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : spans.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <Activity className="h-7 w-7 mx-auto mb-2 opacity-30" />
              Henüz giriş/çıkış kaydı yok.
              <p className="text-xs mt-1">Bu özellik yeni — kullanıcı giriş yaptıkça oturumlar burada listelenecek.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {spans.map(s => (
                <div key={s.key} className="rounded-xl border bg-muted/20 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-muted-foreground">{fmtDate(s.login)}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      {s.isApp ? <Smartphone className="h-3 w-3 text-emerald-600" /> : <Monitor className="h-3 w-3 text-blue-600" />}
                      {s.device}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-sm font-mono">
                      <span className="inline-flex items-center gap-1"><LogIn className="h-3.5 w-3.5 text-emerald-600" /> {fmtTime(s.login)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="inline-flex items-center gap-1">
                        <LogOut className="h-3.5 w-3.5 text-rose-600" /> {s.logout != null ? fmtTime(s.logout) : '—'}
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${s.logout != null ? 'text-foreground' : 'text-emerald-600'}`}>
                      {s.logout != null ? fmtDur(s.logout - s.login) : 'Devam ediyor'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
