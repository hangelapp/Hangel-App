'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShieldAlert, Loader2 } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useAuth, initiatePasswordResetEmail } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { ProfileViewDialog } from './_components/profile-view-dialog';
import { EditUserDialog } from './_components/edit-user-dialog';
import { AssignEntityDialog } from './_components/assign-entity-dialog';
import { BulkDeleteCard } from './_components/bulk-delete-card';
import { UserRowItem } from './_components/user-row';
import type { UserRow } from './_components/types';

export default function UsersPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [viewingUser, setViewingUser] = useState<UserRow | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserRow | null>(null);
  const [permError, setPermError] = useState<string | null>(null);

  const usersQuery = useMemoFirebase(() => collection(db, COLLECTIONS.users), [db]);
  const { data: users, isLoading, error: usersError } = useCollection<UserRow>(usersQuery);

  React.useEffect(() => {
    if (!usersError) { setPermError(null); return; }
    const code = (usersError as { code?: string } | null)?.code;
    const msg = usersError instanceof Error ? usersError.message : 'Bilinmeyen hata.';
    const friendly = code === 'permission-denied'
      ? 'Bu sayfayı görüntülemek için super-admin yetkisi gerekli. (Firestore: users koleksiyonu erişimi reddedildi.)'
      : msg;
    setPermError(friendly);
    toast({
      variant: 'destructive',
      title: 'Kullanıcılar yüklenemedi',
      description: friendly,
    });
  }, [usersError, toast]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const lower = searchTerm.toLowerCase();
    const matched = !searchTerm
      ? [...users]
      : users.filter(u =>
        (u.name || '').toLowerCase().includes(lower) ||
        (u.personalInfo?.email || '').toLowerCase().includes(lower) ||
        (u.username || '').toLowerCase().includes(lower) ||
        (u.personalInfo?.phone || '').includes(lower),
      );

    // En yeni kullanıcı en üstte: createdAt → joinDate → fallback (eklenme sırası)
    const ts = (u: UserRow): number => {
      const c = (u as UserRow & { createdAt?: unknown }).createdAt;
      const maybeDate = c as { toDate?: () => Date } | null;
      if (maybeDate?.toDate) {
        try { return maybeDate.toDate().getTime(); } catch { /* ignore */ }
      }
      if (typeof c === 'string') {
        const t = Date.parse(c);
        if (!Number.isNaN(t)) return t;
      }
      const joinDate = (u as UserRow & { joinDate?: unknown }).joinDate;
      if (typeof joinDate === 'string') {
        const t = Date.parse(joinDate);
        if (!Number.isNaN(t)) return t;
      }
      return 0;
    };
    return matched.sort((a, b) => ts(b) - ts(a));
  }, [searchTerm, users]);

  const handleToggleStatus = async (userId: string, name: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Aktif' ? 'Askıda' : 'Aktif';
    try {
      await updateDoc(doc(db, COLLECTIONS.users, userId), { status: newStatus });
      toast({
        title: 'Kullanıcı Durumu Güncellendi',
        description: `${name} → ${newStatus.toLowerCase()}.`,
      });
    } catch (e) {
      console.error('Toggle status failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Güncelleme başarısız',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    }
  };

  const handleDelete = async (user: UserRow) => {
    try {
      // Önce `disabled: true` flag'i yaz ki tekrar giriş engellensin,
      // ardından Firestore dokümanını sil. (Auth hesabı manuel silinmelidir.)
      try {
        await updateDoc(doc(db, COLLECTIONS.users, user.id), {
          disabled: true,
          disabledAt: serverTimestamp(),
        });
      } catch (flagErr) {
        console.warn('disabled flag yazılamadı:', flagErr);
      }
      await deleteDoc(doc(db, COLLECTIONS.users, user.id));
      toast({
        variant: 'destructive',
        title: 'Kullanıcı Silindi',
        description: `${user.name || 'Kullanıcı'} kaydı silindi ve disabled flag işlendi. Firebase Auth hesabı Console üzerinden ayrıca silinmelidir.`,
      });
    } catch (e) {
      console.error('Delete failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Silme başarısız',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    }
  };

  const [bulkEmail, setBulkEmail] = useState('');
  const [bulkProgress, setBulkProgress] = useState<{ deleted: number; failed: number } | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const matchingByEmail = useMemo(() => {
    if (!users || !bulkEmail.trim()) return [];
    const target = bulkEmail.trim().toLowerCase();
    return users.filter(u => (u.personalInfo?.email || '').toLowerCase() === target);
  }, [users, bulkEmail]);

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    let deleted = 0;
    let failed = 0;
    for (const u of matchingByEmail) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.users, u.id));
        deleted++;
      } catch (e) {
        console.error(`Bulk delete failed for ${u.id}:`, e);
        failed++;
      }
    }
    setBulkProgress({ deleted, failed });
    setBulkDeleting(false);
    toast({
      variant: failed > 0 ? 'destructive' : 'default',
      title: 'Toplu silme tamamlandı',
      description: `${deleted} kayıt silindi${failed > 0 ? `, ${failed} hata` : ''}. Firebase Auth hesapları ayrıca silinmelidir.`,
    });
  };

  const handleSendVerification = async (user: UserRow) => {
    try {
      // Doğrulama isteği kaydı (gerçek SMS/e-mail gönderimi yetkili bir backend job ile yapılır)
      const channels: string[] = [];
      const email = user.personalInfo?.email;
      if (email) channels.push('email');
      if (user.personalInfo?.phone) channels.push('sms');

      await updateDoc(doc(db, COLLECTIONS.users, user.id), {
        verificationRequestedAt: new Date().toISOString(),
        verificationRequestedChannels: channels,
      });

      // Firebase Auth client SDK başka bir kullanıcıya doğrudan sendEmailVerification atamaz
      // (hedef User nesnesi gerekir). E-posta varsa kullanıcıya en azından bir "şifre sıfırlama"
      // bağlantısı göndererek hesabını aktif olarak doğrulama imkanı sun.
      let authEmailSent = false;
      if (email) {
        try {
          await initiatePasswordResetEmail(auth, email);
          authEmailSent = true;
        } catch (authErr) {
          console.warn('Auth verification email could not be triggered client-side:', authErr);
        }
      }

      toast({
        title: 'Doğrulama Talebi Gönderildi',
        description: channels.length === 0
          ? 'Kullanıcının e-posta ve telefon bilgisi yok; talep oluşturuldu fakat gönderim kanalı yok.'
          : authEmailSent
            ? `${email} adresine Firebase Auth üzerinden doğrulama/sıfırlama maili gönderildi. SMS yetkili backend job tarafından iletilecek.`
            : 'Doğrulama e-postası ve SMS yetkili backend job tarafından gönderilecek.',
      });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen hata.';
      toast({
        variant: 'destructive',
        title: 'Doğrulama gönderilemedi',
        description: code === 'permission-denied' ? 'Süper admin yetkisi gerekli.' : message,
      });
    }
  };

  const handleSendPasswordReset = async (user: UserRow) => {
    const email = user.personalInfo?.email?.trim();
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'E-posta yok',
        description: 'Bu kullanıcının kayıtlı bir e-posta adresi olmadığı için şifre sıfırlama maili gönderilemez.',
      });
      return;
    }
    try {
      await initiatePasswordResetEmail(auth, email);
      try {
        await updateDoc(doc(db, COLLECTIONS.users, user.id), {
          passwordResetRequestedAt: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn('Failed to log passwordResetRequestedAt:', logErr);
      }
      toast({
        title: 'Şifre Sıfırlama Maili Gönderildi',
        description: `${email} adresine Firebase Auth üzerinden şifre sıfırlama bağlantısı gönderildi.`,
      });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen hata.';
      toast({
        variant: 'destructive',
        title: 'Sıfırlama maili gönderilemedi',
        description: code === 'auth/user-not-found'
          ? 'Bu e-posta ile eşleşen Firebase Auth hesabı bulunamadı.'
          : code === 'auth/invalid-email'
            ? 'Geçersiz e-posta adresi.'
            : message,
      });
    }
  };

  const handleAdminPasswordChange = (user: UserRow) => {
    // Firebase client SDK başka kullanıcının şifresini değiştiremez; admin SDK gerekir.
    toast({
      title: 'Backend gerektiriyor',
      description: `Doğrudan şifre değiştirme için /api/admin/users/${user.id}/reset-password endpoint'i kurulmalı. Bu kurulana kadar lütfen "Şifre Sıfırlama Maili" gönderin.`,
    });
  };

  const handleSaveUser = async (userId: string, patch: Record<string, unknown>) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.users, userId), patch);
      toast({ title: 'Bilgiler Güncellendi', description: 'Kullanıcı bilgileri kaydedildi.' });
    } catch (e) {
      console.error('Save user failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Kaydedilemedi',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
      throw e;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Kullanıcılar Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Kullanıcı Yönetimi</h1>
        <p className="text-muted-foreground text-sm font-medium">Platformdaki tüm kullanıcıları görüntüleyin, düzenleyin, yetki ve durumunu yönetin.</p>
      </div>

      {permError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-red-800">Erişim hatası</p>
            <p className="text-xs text-red-700 leading-relaxed">{permError}</p>
          </div>
        </div>
      )}

      <BulkDeleteCard
        bulkEmail={bulkEmail}
        onBulkEmailChange={(v) => { setBulkEmail(v); setBulkProgress(null); }}
        matchingByEmail={matchingByEmail}
        bulkDeleting={bulkDeleting}
        bulkProgress={bulkProgress}
        onBulkDelete={handleBulkDelete}
      />

      <Card className="rounded-[2rem] border-black/5 shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Platform Üyeleri ({users?.length || 0})</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İsim, @kullanıcı, e-posta, telefon..."
                className="pl-9 h-10 rounded-xl"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y border-t border-black/5">
            {filteredUsers.map(user => (
              <UserRowItem
                key={user.id}
                user={user}
                onView={setViewingUser}
                onEdit={setEditingUser}
                onAssign={setAssigningUser}
                onSendVerification={handleSendVerification}
                onSendPasswordReset={handleSendPasswordReset}
                onAdminPasswordChange={handleAdminPasswordChange}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
              />
            ))}
            {filteredUsers.length === 0 && (
              <div className="p-16 text-center text-muted-foreground italic">Eşleşen kullanıcı bulunamadı.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(o) => !o && setEditingUser(null)}
        onSave={handleSaveUser}
      />
      <ProfileViewDialog
        user={viewingUser}
        open={!!viewingUser}
        onOpenChange={(o) => !o && setViewingUser(null)}
      />
      <AssignEntityDialog
        user={assigningUser}
        open={!!assigningUser}
        onOpenChange={(o) => !o && setAssigningUser(null)}
      />
    </div>
  );
}
