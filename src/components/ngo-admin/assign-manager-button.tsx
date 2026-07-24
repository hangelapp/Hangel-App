'use client';

/**
 * "Yönetici Ata" butonu + Dialog — bir ETKİNLİK/GÖNÜLLÜLÜK ilanına o ilana ÖZEL
 * yönetici atar. Atanan kişi (telefonundan çözülür) yalnız O ilanın yöneticisi
 * olur; ilan dokümanına yazma yetkisi kazanır ve bildirim alır.
 *
 * Kart-buton kalıbı BroadcastMessageButton ile aynı (variant="outline"
 * size="sm", rounded-xl w-full sm:w-auto). POST /api/ngo-admin/listings/assign-manager.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCog, UserPlus, Loader2, X } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';

interface AssignManagerButtonProps {
  kind: 'event' | 'volunteering';
  listingId: string;
  title: string;
  /** Halihazırda atanmış yöneticiler (uid + ad). */
  currentManagers?: { uid: string; name: string }[];
  className?: string;
}

export function AssignManagerButton({
  kind,
  listingId,
  title,
  currentManagers = [],
  className,
}: AssignManagerButtonProps) {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const { withEntityHeaders } = useActiveEntity();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState('');
  // İlk render'da prop'tan başla; ata/kaldır sonrası yerel olarak güncelle.
  const [managers, setManagers] = useState<{ uid: string; name: string }[]>(currentManagers);

  const openDialog = () => {
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Oturum gerekli' });
      return;
    }
    setPhone('');
    setManagers(currentManagers);
    setOpen(true);
  };

  const post = async (payload: Record<string, unknown>) => {
    if (!authUser) throw new Error('Oturum gerekli');
    const token = await authUser.getIdToken();
    const res = await fetch('/api/ngo-admin/listings/assign-manager', withEntityHeaders({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ kind, listingId, ...payload }),
    }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'İşlem başarısız.');
    return data as { ok: boolean; userId: string; name: string };
  };

  const handleAssign = async () => {
    if (phone.trim().length < 7) {
      toast({ variant: 'destructive', title: 'Geçerli bir telefon girin' });
      return;
    }
    setBusy(true);
    try {
      const data = await post({ phone: phone.trim() });
      setManagers((prev) =>
        prev.some((m) => m.uid === data.userId) ? prev : [...prev, { uid: data.userId, name: data.name }],
      );
      setPhone('');
      toast({ title: 'Yönetici atandı', description: data.name });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Atanamadı', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (uid: string) => {
    setBusy(true);
    try {
      await post({ action: 'remove', userId: uid });
      setManagers((prev) => prev.filter((m) => m.uid !== uid));
      toast({ title: 'Yönetici kaldırıldı' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Kaldırılamadı', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn('rounded-xl w-full sm:w-auto', className)}
        onClick={openDialog}
        disabled={!authUser}
      >
        <UserCog className="h-4 w-4 mr-1.5" /> Yönetici Ata
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!busy) setOpen(o); }}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="break-words">Yönetici Ata{title ? ` — ${title}` : ''}</DialogTitle>
            <DialogDescription className="text-xs">
              Telefon numarasıyla bir hangel üyesini bu ilana yönetici olarak atayın. Atanan kişi
              yalnız bu ilanı yönetebilir ve bilgilendirilir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {managers.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm">Atanmış yöneticiler</Label>
                <div className="flex flex-wrap gap-2">
                  {managers.map((m) => (
                    <span
                      key={m.uid}
                      className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
                    >
                      {m.name || 'Yönetici'}
                      <button
                        type="button"
                        aria-label="Yöneticiyi kaldır"
                        className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                        onClick={() => handleRemove(m.uid)}
                        disabled={busy}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="assign-manager-phone" className="text-sm">Telefon</Label>
              <div className="flex gap-2">
                <Input
                  id="assign-manager-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  inputMode="tel"
                  disabled={busy}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAssign(); }}
                />
                <Button
                  onClick={handleAssign}
                  disabled={busy || phone.trim().length < 7}
                  className="rounded-xl shrink-0"
                >
                  {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1.5" />}
                  Ata
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
