'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, Phone, MapPin, Cake, Globe } from 'lucide-react';
import type { UserRow } from './types';
import { roleLabel } from './types';

// View (read-only) dialog
export const ProfileViewDialog = ({ user, open, onOpenChange }: { user: UserRow | null; open: boolean; onOpenChange: (o: boolean) => void; }) => {
  if (!user) return null;
  const pi = (user.personalInfo || {}) as Partial<{
    email: string;
    phone: string;
    birthDate: string;
    gender: string;
    nationality: string;
    bloodType: string;
    website: string;
    address: Record<string, string | undefined>;
  }>;
  const addr = (pi.address || {}) as Record<string, string | undefined>;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] max-w-lg">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-xl font-black">{(user.name || '?').charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <DialogTitle>{user.name || 'İsimsiz'}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === 'super-admin' ? 'default' : user.role === 'ngo-admin' ? 'secondary' : 'outline'} className="text-[9px] uppercase tracking-widest">
                  {roleLabel[user.role || 'user']}
                </Badge>
                {user.username && <span className="text-xs text-muted-foreground">{user.username}</span>}
              </div>
            </div>
          </div>
          <DialogDescription className="text-xs">UID: <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{user.id}</code></DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">İletişim</p>
            {pi.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {pi.email}</div>}
            {pi.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {pi.phone}</div>}
            {pi.website && <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-muted-foreground" /> <a href={pi.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{pi.website}</a></div>}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Demografi</p>
            {pi.birthDate && <div className="flex items-center gap-2 text-sm"><Cake className="h-4 w-4 text-muted-foreground" /> {pi.birthDate}</div>}
            {pi.gender && <div className="flex items-center gap-2 text-sm"><span className="text-xs text-muted-foreground">Cinsiyet:</span> {pi.gender}</div>}
            {pi.bloodType && <div className="flex items-center gap-2 text-sm"><span className="text-xs text-muted-foreground">Kan Grubu:</span> {pi.bloodType}</div>}
            {pi.nationality && <div className="flex items-center gap-2 text-sm"><span className="text-xs text-muted-foreground">Uyruk:</span> {pi.nationality}</div>}
          </div>
          {(addr.country || addr.city || addr.district) && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Adres</p>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {[addr.neighborhood, addr.district, addr.city, addr.country].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">İstatistikler</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-muted/40 rounded-lg text-center">
                <p className="text-lg font-black">{user.impactScore?.toLocaleString('tr-TR') || 0}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">Etki Puanı</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg text-center">
                <p className="text-lg font-black">{((user as UserRow & { inviteCount?: number }).inviteCount) || 0}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">Davet</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg text-center">
                <p className="text-lg font-black">{Array.isArray(user.supportedNgos) ? user.supportedNgos.length : 0}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">Destek</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
