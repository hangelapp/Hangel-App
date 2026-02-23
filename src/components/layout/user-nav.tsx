
'use client';

import {
    CreditCard,
    LogOut,
    Settings,
    User as UserIcon,
  } from "lucide-react"
  import Link from "next/link"
  import { useRouter } from "next/navigation"
  import { useState } from "react"
  
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
  import { Button } from "@/components/ui/button"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
  import { useUser, useAuth } from "@/firebase"
  import { signOut } from "firebase/auth"
  
  export function UserNav() {
    const { user } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    
    if (!user) return null;

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    const getInitials = () => {
        if (user.displayName) {
            return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
        }
        if (user.email) {
            return user.email[0].toUpperCase();
        }
        return 'U';
    };

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full border shadow-sm">
              <Avatar className="h-full w-full">
                <AvatarImage src={user.photoURL || undefined} alt="Profile" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{getInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none">{user.displayName || 'Kullanıcı'}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/profile" passHref>
                  <DropdownMenuItem className="cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                  </DropdownMenuItem>
              </Link>
              <Link href="/qr-payment" passHref>
                  <DropdownMenuItem className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Cüzdanım</span>
                  </DropdownMenuItem>
              </Link>
              <Link href="/settings" passHref>
                  <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Ayarlar</span>
                  </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsLogoutDialogOpen(true); }} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
            <AlertDialogContent className="rounded-[2.5rem]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold">Emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                        Oturumu kapattığınızda bağış ve gönüllülük fırsatlarını takip edemezsiniz.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-2xl font-bold">Vazgeç</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleSignOut} 
                        className="rounded-2xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Çıkış Yap
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

    