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
import { Mail, Phone, MapPin, Cake, Globe, Clock, CalendarPlus, Smartphone, Monitor } from 'lucide-react';
import { COLLECTIONS } from '@/firebase/collections';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, type Timestamp } from 'firebase/firestore';
import { EntityMultiSelect } from './entity-multi-select';
import type { UserRow } from './types';
import { roleLabel } from './types';

type SessionDoc = {
  id: string;
  deviceName?: string;
  browserName?: string;
  osName?: string;
  deviceType?: string;
  createdAt?: Timestamp;
  lastActiveAt?: Timestamp;
};

// Firestore Timestamp | ISO string | millis → "10.06.2026 14:32"
const fmtDateTime = (v: unknown): string | null => {
  let d: Date | null = null;
  const ts = v as { toDate?: () => Date } | null;
  if (ts?.toDate) { try { d = ts.toDate(); } catch { d = null; } }
  else if (typeof v === 'string') { const t = Date.parse(v); if (!Number.isNaN(t)) d = new Date(t); }
  else if (typeof v === 'number') d = new Date(v);
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// View (read-only) dialog
export const ProfileViewDialog = ({ user, open, onOpenChange }: { user: UserRow | null; open: boolean; onOpenChange: (o: boolean) => void; }) => {
  const db = useFirestore();
  const sessionsQuery = useMemoFirebase(
    () => (user?.id ? query(collection(db, COLLECTIONS.users, user.id, 'sessions'), orderBy('lastActiveAt', 'desc'), limit(50)) : null),
    [db, user?.id],
  );
  const { data: sessions } = useCollection<SessionDoc>(sessionsQuery);
  if (!user) return null;

  // Hesap oluşturma: user.createdAt → joinDate → en eski oturum createdAt
  const earliestSession = (sessions || []).reduce<number | null>((min, s) => {
    const t = s.createdAt?.toDate?.()?.getTime();
    return t == null ? min : (min == null ? t : Math.min(min, t));
  }, null);
  const createdAtStr =
    fmtDateTime((user as UserRow & { createdAt?: unknown }).createdAt) ||
    fmtDateTime((user as UserRow & { joinDate?: unknown }).joinDate) ||
    (earliestSession != null ? fmtDateTime(earliestSession) : null);

  // Son giriş / aktivite + platform (en güncel oturum)
  const latest = (sessions || [])[0];
  const lastLoginStr = fmtDateTime(latest?.lastActiveAt);
  const isApp = latest?.browserName === 'Hangel App';
  const platformLabel = !latest
    ? null
    : isApp
      ? `Uygulama — ${latest.deviceName || latest.osName || 'cihaz bilinmiyor'}`
      : `Web — ${[latest.browserName, latest.osName].filter(Boolean).join(' · ') || 'tarayıcı bilinmiyor'}`;
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
  const social = ((pi as { social?: Record<string, string | undefined> }).social || {}) as Record<string, string | undefined>;
  const vi = (user.volunteerInfo || {}) as Partial<{
    profession: string | null; sector: string | null; position: string | null;
    skills: string[]; interests: string[]; languages: string[];
  }>;
  const rel = user as unknown as { supportedNgos?: string[]; volunteerNgos?: string[]; followedBrands?: string[]; joinedClubs?: string[] };
  const socialEntries = Object.entries(social).filter(([, v]) => v);
  const hasVolunteer = !!(vi.profession || vi.sector || vi.position || (vi.skills && vi.skills.length) || (vi.interests && vi.interests.length) || (vi.languages && vi.languages.length));
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
          <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Hesap & Oturum</p>
            <div className="flex items-center gap-2 text-sm">
              <CalendarPlus className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Oluşturma:</span>
              <span className="font-medium">{createdAtStr || 'Bilinmiyor'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Son giriş:</span>
              <span className="font-medium">{lastLoginStr || 'Kayıt yok'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {isApp ? <Smartphone className="h-4 w-4 text-emerald-600 shrink-0" /> : <Monitor className="h-4 w-4 text-blue-600 shrink-0" />}
              <span className="text-xs text-muted-foreground">Platform:</span>
              <span className="font-medium">{platformLabel || 'Kayıt yok'}</span>
            </div>
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

          {socialEntries.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sosyal Medya</p>
              <div className="flex flex-wrap gap-2">
                {socialEntries.map(([k, v]) => (
                  <a key={k} href={(v as string).startsWith('http') ? v : `https://${v}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    <span className="text-muted-foreground capitalize">{k}:</span> {v}
                  </a>
                ))}
              </div>
            </div>
          )}

          {hasVolunteer && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gönüllülük</p>
              {vi.profession && <p className="text-sm"><span className="text-xs text-muted-foreground">Meslek:</span> {vi.profession}</p>}
              {vi.sector && <p className="text-sm"><span className="text-xs text-muted-foreground">Sektör:</span> {vi.sector}</p>}
              {vi.position && <p className="text-sm"><span className="text-xs text-muted-foreground">Pozisyon:</span> {vi.position}</p>}
              {vi.skills && vi.skills.length > 0 && <p className="text-sm"><span className="text-xs text-muted-foreground">Yetenekler:</span> {vi.skills.join(', ')}</p>}
              {vi.interests && vi.interests.length > 0 && <p className="text-sm"><span className="text-xs text-muted-foreground">İlgi Alanları:</span> {vi.interests.join(', ')}</p>}
              {vi.languages && vi.languages.length > 0 && <p className="text-sm"><span className="text-xs text-muted-foreground">Diller:</span> {vi.languages.join(', ')}</p>}
            </div>
          )}

          {/* Üyelikler & İlişkiler — kurum adlarıyla */}
          <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Üyelikler & İlişkiler</p>
            <EntityMultiSelect readOnly collectionName={COLLECTIONS.ngos} label="Gönüllüsü Olduğu STK'lar" value={rel.volunteerNgos || []} emptyText="Yok" />
            <EntityMultiSelect readOnly collectionName={COLLECTIONS.ngos} label="Bağışçısı / Desteklediği STK'lar" value={rel.supportedNgos || []} emptyText="Yok" />
            <EntityMultiSelect readOnly collectionName={COLLECTIONS.brands} label="Takip Ettiği Markalar" value={rel.followedBrands || []} emptyText="Yok" />
            <EntityMultiSelect readOnly collectionName={COLLECTIONS.clubs} label="Katıldığı Kulüpler" value={rel.joinedClubs || []} emptyText="Yok" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
