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
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRow } from './types';

interface BulkDeleteCardProps {
  bulkEmail: string;
  onBulkEmailChange: (v: string) => void;
  matchingByEmail: UserRow[];
  bulkDeleting: boolean;
  bulkProgress: { deleted: number; failed: number } | null;
  onBulkDelete: () => void;
}

// E-postaya göre toplu silme — mükerrer profil temizliği için
export const BulkDeleteCard = ({
  bulkEmail,
  onBulkEmailChange,
  matchingByEmail,
  bulkDeleting,
  bulkProgress,
  onBulkDelete,
}: BulkDeleteCardProps) => {
  return (
    <Card className="rounded-[2rem] border-amber-200 bg-amber-50/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-amber-600" /> E-postaya Göre Toplu Sil
        </CardTitle>
        <CardDescription className="text-xs">
          Aynı e-posta ile oluşturulmuş tüm mükerrer Firestore user kayıtlarını siler. Auth hesapları Console'dan ayrıca silinmelidir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="email"
            placeholder="ornek@hangel.org"
            value={bulkEmail}
            onChange={e => onBulkEmailChange(e.target.value)}
            className="max-w-sm h-9 rounded-xl bg-background"
          />
          <Badge variant="outline" className="text-[11px]">
            {matchingByEmail.length} eşleşen kayıt
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                disabled={matchingByEmail.length === 0 || bulkDeleting}
                className="rounded-xl"
              >
                {bulkDeleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Hepsini Sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2rem]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold">
                  {matchingByEmail.length} kayıt silinecek
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  "{bulkEmail}" e-postasıyla eşleşen {matchingByEmail.length} Firestore user kaydı silinecek. Bu işlem geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {matchingByEmail.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-1 text-xs bg-muted/30">
                  {matchingByEmail.map(u => (
                    <div key={u.id} className="flex justify-between gap-2">
                      <span className="truncate">{u.name || 'İsimsiz'}</span>
                      <code className="text-[10px] text-muted-foreground">{u.id.slice(0, 12)}…</code>
                    </div>
                  ))}
                </div>
              )}
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  className={cn(buttonVariants({ variant: 'destructive' }), 'rounded-xl font-bold')}
                  onClick={onBulkDelete}
                >
                  Evet, {matchingByEmail.length} kaydı sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {bulkProgress && (
          <p className="text-xs text-muted-foreground">
            Son işlem: {bulkProgress.deleted} silindi, {bulkProgress.failed} hata.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
