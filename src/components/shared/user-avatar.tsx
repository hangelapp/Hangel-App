
'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/firebase";
import { cn } from "@/lib/utils";

export function UserAvatar({ className }: { className?: string }) {
  const { user, isUserLoading } = useUser();
  
  if (isUserLoading) {
     return <div className={cn("w-9 h-9 rounded-full bg-muted animate-pulse", className)} />;
  }

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
      <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'Kullanıcı'} className="object-cover" />
      <AvatarFallback className="bg-primary/10 text-primary font-bold">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}

    