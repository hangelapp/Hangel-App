'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Eye, KeyRound, MailCheck, Pencil, ShieldQuestion, Trash2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRow } from './types';
import { roleLabel } from './types';

interface UserRowItemProps {
  user: UserRow;
  onView: (user: UserRow) => void;
  onEdit: (user: UserRow) => void;
  onAssign: (user: UserRow) => void;
  onSendVerification: (user: UserRow) => void;
  onSendPasswordReset: (user: UserRow) => void;
  onAdminPasswordChange: (user: UserRow) => void;
  onToggleStatus: (userId: string, name: string, currentStatus: string) => void;
  onDelete: (user: UserRow) => void;
}

export const UserRowItem = ({
  user,
  onView,
  onEdit,
  onAssign,
  onSendVerification,
  onSendPasswordReset,
  onAdminPasswordChange,
  onToggleStatus,
  onDelete,
}: UserRowItemProps) => {
  const status = (user as UserRow & { status?: string }).status || 'Aktif';
  const isSuspended = status === 'Askıda';
  return (
    <div className={cn(
      'p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors',
      isSuspended && 'opacity-60',
    )}>
      <button
        type="button"
        className="flex items-center gap-4 text-left flex-1 min-w-0 hover:opacity-80 transition-opacity"
        onClick={() => onView(user)}
        title="Profili görüntüle"
      >
        <Avatar className="h-12 w-12 border shadow-sm">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback className="font-bold">{(user.name || '?').charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-[#1d1d1f] truncate">{user.name || 'İsimsiz'}</p>
            <Badge variant={user.role === 'super-admin' ? 'default' : user.role === 'ngo-admin' ? 'secondary' : 'outline'} className="text-[9px] font-black uppercase tracking-widest">
              {roleLabel[user.role || 'user']}
            </Badge>
            {isSuspended && <Badge variant="secondary" className="text-[9px] font-black uppercase">ASKIDA</Badge>}
          </div>
          <p className="text-xs text-muted-foreground font-medium truncate">
            {user.personalInfo?.email || '—'}
            {user.username && ` • ${user.username}`}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <Button variant="outline" size="sm" className="rounded-xl font-bold h-9" onClick={() => onView(user)}>
          <Eye className="mr-2 h-4 w-4" /> Görüntüle
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl font-bold h-9" onClick={() => onEdit(user)}>
          <Pencil className="mr-2 h-4 w-4" /> Düzenle
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold h-9 text-purple-700 border-purple-300 hover:bg-purple-50"
          onClick={() => onAssign(user)}
          title="STK / Marka / Kulüp yöneticisi olarak yetkilendir"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Yetkilendir
        </Button>
        {!(user as UserRow & { verified?: boolean }).verified && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold h-9 text-amber-700 border-amber-300 hover:bg-amber-50"
            onClick={() => onSendVerification(user)}
            title="Doğrulama maili ve SMS gönder"
          >
            <MailCheck className="mr-2 h-4 w-4" /> Doğrula
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold h-9 text-blue-700 border-blue-300 hover:bg-blue-50"
          onClick={() => onSendPasswordReset(user)}
          title="Firebase Auth üzerinden şifre sıfırlama maili gönder"
        >
          <KeyRound className="mr-2 h-4 w-4" /> Şifre Sıfırla
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold h-9 text-muted-foreground"
          onClick={() => onAdminPasswordChange(user)}
          title="Şifreyi doğrudan değiştir (backend endpoint gerektirir)"
        >
          <ShieldQuestion className="mr-2 h-4 w-4" /> Şifre Değiştir
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold h-9"
          onClick={() => onToggleStatus(user.id, user.name || 'Kullanıcı', status)}
        >
          {isSuspended ? 'Aktif Et' : 'Askıya Al'}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl" aria-label="Sil">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[2rem]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">{user.name || 'Kullanıcı'} siliniyor</AlertDialogTitle>
              <AlertDialogDescription className="text-base font-medium">
                Bu işlem geri alınamaz. Firestore'daki kullanıcı dokümanı silinir.
                Bu işlem kullanıcının erişimini engeller (<code className="text-[11px] bg-muted px-1 py-0.5 rounded">disabled: true</code> flag) ancak Firebase Auth hesabı manuel silinmelidir (Console &gt; Auth).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
              <AlertDialogAction
                className={cn(buttonVariants({ variant: 'destructive' }), 'rounded-xl font-bold')}
                onClick={() => onDelete(user)}>
                Evet, Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
