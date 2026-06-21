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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, UserPlus, Building2, Briefcase, GraduationCap, ShieldX } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import type { UserRow, EntityKind, EntityRow } from './types';
import {
  entityKindLabels,
  entityCollectionByKind,
  entityIdFieldByKind,
  invitationIdFieldByKind,
  roleTitleFieldByKind,
  rolesByKind,
} from './types';

// Bir kullanıcının revoke edilmemiş davet kayıtlarını çözmek için minimal tip.
interface InvitationRow {
  id: string;
  ngoId?: string;
  brandId?: string;
  clubId?: string;
  status?: string;
  role?: string;
}

// PDF-30 — Bildirim helper'ı: yetkilendir/yetki kaldır işlemlerinde kullanıcıya
// `notifications` koleksiyonu üzerinden bildirim üretir. Hata olursa sessizce
// loglanır — bildirim eksikliği yetkilendirmenin geri alınması için yeterli sebep değil.
async function emitAuthorizationNotification(
  db: ReturnType<typeof useFirestore>,
  args: { userId: string; title: string; body: string; entityKind: EntityKind; entityId: string; action: 'granted' | 'revoked' },
) {
  try {
    await addDoc(collection(db, COLLECTIONS.notifications), {
      userId: args.userId,
      type: 'authorization',
      action: args.action,
      entityKind: args.entityKind,
      entityId: args.entityId,
      title: args.title,
      body: args.body,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[assign-entity] notification create failed', err);
  }
}

// Yetkilendirme dialog'u — kullanıcıyı bir STK / Marka / Kulüp'e yönetici olarak atar
export const AssignEntityDialog = ({ user, open, onOpenChange }: {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const db = useFirestore();
  const { toast } = useToast();

  const [entityKind, setEntityKind] = useState<EntityKind>('ngo');
  const [entitySearch, setEntitySearch] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [roleTitle, setRoleTitle] = useState<string>(rolesByKind.ngo[0].value);
  const [submitting, setSubmitting] = useState(false);

  // Dialog her açıldığında state'i sıfırla
  React.useEffect(() => {
    if (open) {
      setEntityKind('ngo');
      setEntitySearch('');
      setSelectedEntityId('');
      setRoleTitle(rolesByKind.ngo[0].value);
    }
  }, [open]);

  // Entity türü değişince ilk role'ü seç, seçili kuruluşu sıfırla
  React.useEffect(() => {
    setSelectedEntityId('');
    setEntitySearch('');
    setRoleTitle(rolesByKind[entityKind][0].value);
  }, [entityKind]);

  const ngosQuery = useMemoFirebase(() => collection(db, COLLECTIONS.ngos), [db]);
  const brandsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
  const clubsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.clubs), [db]);

  const { data: ngos, isLoading: ngosLoading } = useCollection<EntityRow>(ngosQuery);
  const { data: brands, isLoading: brandsLoading } = useCollection<EntityRow>(brandsQuery);
  const { data: clubs, isLoading: clubsLoading } = useCollection<EntityRow>(clubsQuery);

  // PDF-29 — revoke esnasında ilgili userInvitations kaydını da `revoked` işaretle
  // ki ngo-admin yetkili listesi (status != 'revoked' filtreli) tutarlı kalsın.
  const userInvitationsQuery = useMemoFirebase(
    () => (user?.id ? query(collection(db, COLLECTIONS.userInvitations), where('inviteeUserId', '==', user.id)) : null),
    [db, user?.id],
  );
  const { data: userInvitations } = useCollection<InvitationRow>(userInvitationsQuery);

  const allEntities: EntityRow[] = useMemo(() => {
    if (entityKind === 'ngo') return ngos || [];
    if (entityKind === 'brand') return brands || [];
    return clubs || [];
  }, [entityKind, ngos, brands, clubs]);

  const entitiesLoading = entityKind === 'ngo' ? ngosLoading : entityKind === 'brand' ? brandsLoading : clubsLoading;

  const filteredEntities = useMemo(() => {
    const list = allEntities || [];
    const q = entitySearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(e => (e.name || '').toLowerCase().includes(q));
  }, [allEntities, entitySearch]);

  const selectedEntity = useMemo(
    () => allEntities.find(e => e.id === selectedEntityId) || null,
    [allEntities, selectedEntityId],
  );

  // Mevcut yetkiler özeti — userInvitations'tan TÜM aktif yetkilendirmeleri
  // derler (multi-entity desteği). Önceki davranış sadece user.managed*Id
  // alanlarını okuyordu (her tipten max 1) → multi-brand/multi-ngo yetkileri
  // listede görünmüyordu. Şimdi:
  //   1. userInvitations status != 'revoked' && != 'pending' filtreli
  //   2. ngoId/brandId/clubId'lere göre kind eşle, ad'ı ngos/brands/clubs map'inden çek
  //   3. Dedupe (aynı entity'ye çoklu davet → tek satır)
  //   4. Fallback: invitation'ı olmayan eski managed*Id kayıtları da gösterilir
  // revoke = managed*Id null + ilgili invitations'ları status='revoked' işaretle.
  type ActiveAuth = {
    kind: EntityKind;
    entityId: string;
    entityName: string;
    roleTitle: string;
  };

  const activeAuthorizations: ActiveAuth[] = useMemo(() => {
    if (!user) return [];
    const out: ActiveAuth[] = [];
    const seen = new Set<string>();

    const ngoNameById = new Map((ngos || []).map(n => [n.id, n.name || n.id] as const));
    const brandNameById = new Map((brands || []).map(b => [b.id, b.name || b.id] as const));
    const clubNameById = new Map((clubs || []).map(c => [c.id, c.name || c.id] as const));

    const accepted = (userInvitations || []).filter(
      inv => inv.status !== 'revoked' && inv.status !== 'pending',
    );
    // BUG-17c: Sadece Firestore'da gerçekten var olan entity'lere ait davetleri
    // göster. Stale (entity'si silinmiş/import edilmemiş) davetler /admin
    // sayfasında zaten görünmüyor — popup ve /admin'in eşleşmesi için burada da
    // filtreleniyor. Cleanup için /super-admin/maintenance'a stale-invitation
    // revoke butonu eklendi.
    for (const inv of accepted) {
      if (inv.ngoId) {
        const key = `ngo:${inv.ngoId}`;
        if (seen.has(key)) continue;
        const name = ngoNameById.get(inv.ngoId);
        if (!name) continue; // entity Firestore'da yok → atla
        seen.add(key);
        out.push({
          kind: 'ngo', entityId: inv.ngoId,
          entityName: name,
          roleTitle: inv.role || '—',
        });
      } else if (inv.brandId) {
        const key = `brand:${inv.brandId}`;
        if (seen.has(key)) continue;
        const name = brandNameById.get(inv.brandId);
        if (!name) continue;
        seen.add(key);
        out.push({
          kind: 'brand', entityId: inv.brandId,
          entityName: name,
          roleTitle: inv.role || '—',
        });
      } else if (inv.clubId) {
        const key = `club:${inv.clubId}`;
        if (seen.has(key)) continue;
        const name = clubNameById.get(inv.clubId);
        if (!name) continue;
        seen.add(key);
        out.push({
          kind: 'club', entityId: inv.clubId,
          entityName: name,
          roleTitle: inv.role || '—',
        });
      }
    }

    // Fallback: invitation kaydı olmayan eski managed*Id atamaları da görünür.
    // Bracket access — managed* alanları UserRow'da var ama Next prod build
    // bazı durumlarda User base tipinden inheritance'ı resolve edemediği için
    // record-style access kullanıyoruz. Burada da entity Firestore'da yoksa atla.
    const u = user as unknown as Record<string, string | null | undefined>;
    const fbFields: Array<[EntityKind, string | null | undefined, Map<string, string>]> = [
      ['ngo', u.managedNgoId, ngoNameById],
      ['brand', u.managedBrandId, brandNameById],
      ['club', u.managedClubId, clubNameById],
    ];
    for (const [kind, id, map] of fbFields) {
      if (!id || seen.has(`${kind}:${id}`)) continue;
      const name = map.get(id);
      if (!name) continue;
      seen.add(`${kind}:${id}`);
      out.push({
        kind, entityId: id,
        entityName: name,
        roleTitle: (u.roleTitle as string | undefined) || '—',
      });
    }

    return out;
  }, [user, userInvitations, ngos, brands, clubs]);

  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRevoke = async (auth: ActiveAuth) => {
    if (!user) return;
    setRevoking(`${auth.kind}:${auth.entityId}`);
    try {
      const idField = entityIdFieldByKind[auth.kind];
      const roleTitleField = roleTitleFieldByKind[auth.kind];
      // Diğer kuruluşlarda hâlâ yetkisi var mı kontrolü için kullanıcıya kalan
      // yetki var mı bak; yoksa role'ü 'user'a indir. Kanonik kaldırma: managed{kind}Id
      // + kind'a özel rol başlığı temizlenir (3 panelde de listeden düşsün).
      const remaining = activeAuthorizations.filter(a => !(a.kind === auth.kind && a.entityId === auth.entityId));
      const userPatch: Record<string, unknown> = { [idField]: null, [roleTitleField]: null };
      if (remaining.length === 0 && user.role !== 'super-admin') {
        userPatch.role = 'user';
        userPatch.roleTitle = null;
      }
      await updateDoc(doc(db, COLLECTIONS.users, user.id), userPatch);

      // adminUserId'yi YALNIZCA bu kullanıcı sahipse temizle — başka birine aitse
      // dokunma (aksi halde sahip yanlışlıkla sıfırlanır, panel 3'teki "Sahip" kaybolur).
      try {
        const entityCollection = entityCollectionByKind[auth.kind];
        const entityRef = doc(db, entityCollection, auth.entityId);
        const entitySnap = await getDoc(entityRef);
        const currentOwner = entitySnap.exists() ? (entitySnap.data() as { adminUserId?: string | null }).adminUserId : null;
        if (currentOwner === user.id) {
          await updateDoc(entityRef, { adminUserId: null });
        }
      } catch (entErr) {
        console.warn('[assign-entity] adminUserId clear skipped', entErr);
      }

      // Bu kuruluşa ait revoke edilmemiş davet kayıtlarını da `revoked` işaretle.
      try {
        const invIdField = invitationIdFieldByKind[auth.kind];
        const matches = (userInvitations || []).filter(
          inv => inv[invIdField] === auth.entityId && inv.status !== 'revoked',
        );
        await Promise.all(
          matches.map(inv => updateDoc(doc(db, COLLECTIONS.userInvitations, inv.id), { status: 'revoked' })),
        );
      } catch (invErr) {
        console.warn('[assign-entity] invitation revoke skipped', invErr);
      }

      await emitAuthorizationNotification(db, {
        userId: user.id,
        title: 'Yetkiniz kaldırıldı',
        body: `${auth.entityName} (${entityKindLabels[auth.kind]}) kuruluşundaki ${auth.roleTitle} yetkiniz kaldırıldı.`,
        entityKind: auth.kind,
        entityId: auth.entityId,
        action: 'revoked',
      });

      toast({
        title: 'Yetki kaldırıldı',
        description: `${auth.entityName} için yetki kaldırıldı ve kullanıcıya bildirim gönderildi.`,
      });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Yetki kaldırılamadı',
        description: code === 'permission-denied' ? 'Bu işlem için super-admin yetkisi gerekli.' : message,
      });
    } finally {
      setRevoking(null);
    }
  };

  const handleAssign = async () => {
    if (!user || !selectedEntityId || !roleTitle) return;
    setSubmitting(true);
    try {
      const entityCollection = entityCollectionByKind[entityKind];
      const idField = entityIdFieldByKind[entityKind];
      const roleTitleField = roleTitleFieldByKind[entityKind];
      const invitationIdField = invitationIdFieldByKind[entityKind];
      const role = rolesByKind[entityKind].find(r => r.value === roleTitle);
      const isPrimary = role?.isPrimary ?? false;

      // 1) Kullanıcı dokümanını güncelle — kanonik alanlar: managed{kind}Id + hem
      //    kind'a özel rol başlığı (ngoRoleTitle vb., managers route'unun birincil
      //    okuduğu alan) hem generic roleTitle. Böylece 3 panel aynı rolü gösterir.
      const userPatch: Record<string, unknown> = {
        [idField]: selectedEntityId,
        [roleTitleField]: roleTitle,
        roleTitle,
      };
      if (user.role !== 'super-admin') {
        userPatch.role = 'ngo-admin';
      }
      await updateDoc(doc(db, COLLECTIONS.users, user.id), userPatch);

      // 2) Kuruluşun adminUserId'sini (sahip) kanonik kurala göre bağla:
      //    Genel Yönetici (birincil) atanıyorsa VEYA kuruluşun henüz sahibi yoksa
      //    bu kullanıcı sahip olur. Mevcut bir sahip varken birincil-olmayan rol
      //    atanırsa sahip DEĞİŞMEZ (Ömer sahipken İsmail'e alt rol verince ikisi de
      //    listede kalır, sahip rozeti Ömer'de).
      try {
        const entityRef = doc(db, entityCollection, selectedEntityId);
        const entitySnap = await getDoc(entityRef);
        const currentOwner = entitySnap.exists() ? (entitySnap.data() as { adminUserId?: string | null }).adminUserId : null;
        if (isPrimary || !currentOwner) {
          await updateDoc(entityRef, { adminUserId: user.id });
        }
      } catch (entityErr) {
        console.warn('Entity adminUserId güncellenemedi:', entityErr);
      }

      // 3) userInvitations koleksiyonuna kabul edilmiş davet kaydı ekle
      try {
        await addDoc(collection(db, COLLECTIONS.userInvitations), {
          [invitationIdField]: selectedEntityId,
          inviteeUserId: user.id,
          role: roleTitle,
          status: 'accepted',
          invitedBy: 'super-admin',
          invitedAt: serverTimestamp(),
          autoAcceptedBy: 'super-admin',
        });
      } catch (invErr) {
        console.warn('userInvitations kaydı oluşturulamadı:', invErr);
      }

      // 4) PDF-30 — Kullanıcıya bildirim gönder.
      await emitAuthorizationNotification(db, {
        userId: user.id,
        title: 'Yeni yetki verildi',
        body: `${selectedEntity?.name || 'Kuruluş'} (${entityKindLabels[entityKind]}) için ${roleTitle} yetkisi tanımlandı.`,
        entityKind,
        entityId: selectedEntityId,
        action: 'granted',
      });

      toast({
        title: 'Yetkilendirme Tamamlandı',
        description: `${user.name || 'Kullanıcı'} → ${selectedEntity?.name || 'kuruluş'} (${roleTitle}). Bildirim iletildi.`,
      });
      onOpenChange(false);
    } catch (e) {
      console.error('Yetkilendirme başarısız:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Yetkilendirme başarısız',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const roleOptions = rolesByKind[entityKind];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] max-w-lg flex flex-col max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-purple-600" />
            Yetkilendir
          </DialogTitle>
          <DialogDescription>
            <span className="font-bold">{user.name || 'Kullanıcı'}</span> için entity türü, kuruluş ve rol seçin. Atama anında uygulanır ve kabul edilmiş davet kaydı oluşturulur.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 px-6 py-2">
          {/* PDF-29 — Mevcut yetkiler listesi + revoke */}
          {activeAuthorizations.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800">Mevcut Yetkiler</p>
              <ul className="space-y-2">
                {activeAuthorizations.map(a => {
                  const Icon = a.kind === 'ngo' ? Building2 : a.kind === 'brand' ? Briefcase : GraduationCap;
                  const key = `${a.kind}:${a.entityId}`;
                  const isRevoking = revoking === key;
                  return (
                    <li key={key} className="flex items-center gap-2 bg-card rounded-xl p-2 border border-amber-100">
                      <Icon className="h-4 w-4 text-amber-700 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{a.entityName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {entityKindLabels[a.kind]} · {a.roleTitle}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevoke(a)}
                        disabled={isRevoking}
                        className="rounded-lg text-red-700 hover:bg-red-50 hover:text-red-800 h-7 px-2 text-[10px] font-bold"
                      >
                        {isRevoking ? <Loader2 className="h-3 w-3 animate-spin" /> : (<><ShieldX className="h-3 w-3 mr-1" />Kaldır</>)}
                      </Button>
                    </li>
                  );
                })}
              </ul>
              <p className="text-[10px] text-amber-700 leading-relaxed">
                Yetkiyi kaldırırsanız kullanıcı kuruluşa erişimini kaybeder ve otomatik bildirim alır.
                Mevcut schema tek-değerli alanlar kullanır; çoklu yetki desteği ileride eklenir.
              </p>
            </div>
          )}

          {/* Entity Türü */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Entity Türü</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(entityKindLabels) as EntityKind[]).map(kind => {
                const Icon = kind === 'ngo' ? Building2 : kind === 'brand' ? Briefcase : GraduationCap;
                const active = entityKind === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setEntityKind(kind)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all font-bold text-xs',
                      active
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-border bg-background hover:border-purple-300',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {entityKindLabels[kind]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kuruluş seç */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Kuruluş</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`${entityKindLabels[entityKind]} ara...`}
                className="pl-9 h-9 rounded-xl"
                value={entitySearch}
                onChange={e => setEntitySearch(e.target.value)}
              />
            </div>
            <div className="max-h-56 overflow-y-auto border rounded-xl divide-y bg-background">
              {entitiesLoading && (
                <div className="p-6 flex items-center justify-center text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yükleniyor...
                </div>
              )}
              {!entitiesLoading && filteredEntities.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground italic">
                  Eşleşen {entityKindLabels[entityKind].toLowerCase()} bulunamadı.
                </div>
              )}
              {!entitiesLoading && filteredEntities.map(entity => {
                const active = selectedEntityId === entity.id;
                return (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => setSelectedEntityId(entity.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 text-left transition-colors',
                      active ? 'bg-purple-50' : 'hover:bg-muted/40',
                    )}
                  >
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage src={entity.logoUrl} alt={entity.name} />
                      <AvatarFallback className="text-xs font-black">
                        {(entity.name || '?').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{entity.name || 'İsimsiz'}</p>
                      {entity.category && (
                        <p className="text-[11px] text-muted-foreground truncate">{entity.category}</p>
                      )}
                    </div>
                    {active && (
                      <Badge variant="default" className="text-[9px] font-black uppercase tracking-widest bg-purple-600">
                        Seçildi
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rol</Label>
            <Select value={roleTitle} onValueChange={(v) => setRoleTitle(v)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Rol seçin" /></SelectTrigger>
              <SelectContent>
                {roleOptions.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}{r.isPrimary ? ' (birincil)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Birincil rol (Genel Yönetici) seçilirse, kuruluşun <code className="text-[10px] bg-muted px-1 py-0.5 rounded">adminUserId</code> alanı bu kullanıcıya bağlanır.
            </p>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-background p-6 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
            İptal
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedEntityId || !roleTitle || submitting}
            className="rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ata
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
