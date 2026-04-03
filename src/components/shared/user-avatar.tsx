
'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export function UserAvatar({ className }: { className?: string }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  if (isUserLoading) {
    return <div className={cn("w-9 h-9 rounded-full bg-muted animate-pulse", className)} />;
  }

  const avatarUrl = (userData as any)?.avatarUrl || user?.photoURL || undefined;

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl} alt={user?.displayName || 'Kullanıcı'} className="object-cover" />
      <AvatarFallback className="bg-primary/10 text-primary font-bold">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}
