
'use client';

import { useRouter, usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

export function UserNav() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  if (!user) return null;

  const avatarUrl = (userData as any)?.avatarUrl || user.photoURL || undefined;

  const getInitials = () => {
    if (user.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const handleClick = () => {
    if (pathname !== '/profile') {
      router.push('/profile');
    }
  };

  return (
    <Button
      variant="ghost"
      className="relative h-9 w-9 rounded-full border shadow-sm"
      onClick={handleClick}
    >
      <Avatar className="h-full w-full">
        <AvatarImage src={avatarUrl} alt="Profile" className="object-cover" />
        <AvatarFallback className="bg-primary/10 text-primary font-bold">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
    </Button>
  );
}
