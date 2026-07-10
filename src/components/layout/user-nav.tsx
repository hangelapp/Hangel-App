
'use client';

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useUser } from "@/firebase"
import { UserAvatar } from "@/components/shared/user-avatar"

// İnce sarmalayıcı: avatar görseli/fallback'i ve Firestore aboneliği tek
// kaynaktan (UserAvatar) gelir; burada yalnız buton + profil yönlendirmesi var.
export function UserNav() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  const handleClick = () => {
    if (pathname !== '/profile') {
      router.push('/profile');
    }
  };

  return (
    <Button
      variant="ghost"
      className="relative h-9 w-9 rounded-full border shadow-sm p-0 overflow-hidden"
      onClick={handleClick}
    >
      <UserAvatar className="h-full w-full" />
    </Button>
  );
}
