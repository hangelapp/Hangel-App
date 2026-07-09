
'use client';

import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { COLLECTIONS } from '@/firebase/collections';
import { UserRound } from "lucide-react";

export function UserNav() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const db = useFirestore();
  const [imageBroken, setImageBroken] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, COLLECTIONS.users, user.uid);
  }, [db, user]);

  const { data: userData } = useDoc<{ avatarUrl?: string; name?: string }>(userDocRef);

  // userData / photoURL değiştiğinde "broken" durumunu sıfırla
  const docAvatar = userData?.avatarUrl;
  const avatarUrl = docAvatar || user?.photoURL || undefined;

  useEffect(() => { setImageBroken(false); }, [avatarUrl]);

  if (!user) return null;

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
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        )}
        {/* Foto yoksa iOS Kişiler tarzı kişi silüeti (baş harf değil). */}
        <AvatarFallback className="bg-muted">
          <UserRound className="h-[55%] w-[55%] text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
    </Button>
  );
}
