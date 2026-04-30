
'use client';

import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

export function UserNav() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const db = useFirestore();
  const [imageBroken, setImageBroken] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  // userData / photoURL değiştiğinde "broken" durumunu sıfırla
  const docAvatar = (userData as any)?.avatarUrl;
  const avatarUrl = docAvatar || user?.photoURL || undefined;

  useEffect(() => { setImageBroken(false); }, [avatarUrl]);

  if (!user) return null;

  const getInitials = () => {
    const source = (userData as any)?.name || user.displayName;
    if (source) {
      return source.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
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

  const showImage = !!avatarUrl && !imageBroken;

  return (
    <Button
      variant="ghost"
      className="relative h-9 w-9 rounded-full border shadow-sm p-0 overflow-hidden"
      onClick={handleClick}
    >
      <Avatar className="h-full w-full">
        {showImage && (
          <AvatarImage
            src={avatarUrl}
            alt="Profile"
            className="object-cover"
            onError={() => setImageBroken(true)}
          />
        )}
        <AvatarFallback className="bg-primary/10 text-primary font-bold">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
    </Button>
  );
}
