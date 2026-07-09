
'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { COLLECTIONS } from '@/firebase/collections';
import { UserRound } from "lucide-react";

export function UserAvatar({ className }: { className?: string }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, COLLECTIONS.users, user.uid);
  }, [db, user]);

  const { data: userData } = useDoc<{ avatarUrl?: string }>(userDocRef);

  if (isUserLoading) {
    return <div className={cn("w-9 h-9 rounded-full bg-muted animate-pulse", className)} />;
  }

  const avatarUrl = userData?.avatarUrl || user?.photoURL || undefined;

  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl} alt={user?.displayName || 'Kullanıcı'} className="object-cover" />
      {/* Foto yoksa iOS Kişiler tarzı kişi silüeti (baş harf değil). */}
      <AvatarFallback className="bg-muted">
        <UserRound className="h-[55%] w-[55%] text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  );
}
