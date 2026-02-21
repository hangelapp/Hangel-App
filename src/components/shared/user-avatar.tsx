
'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/firebase";

export function UserAvatar({ className }: { className?: string }) {
  const { user, isUserLoading } = useUser();
  
  if (isUserLoading) {
     return <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />;
  }

  const fallback = user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
    <Avatar className={className}>
      <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'Kullanıcı'} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}
