
'use client';

import {
    CreditCard,
    LogOut,
    Settings,
    User,
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

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || ''} />
                <AvatarFallback>{user.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName || 'Kullanıcı'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/profile" passHref>
                  <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                  </DropdownMenuItem>
              </Link>
              <Link href="/qr-payment" passHref>
                  <DropdownMenuItem>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Cüzdanım</span>
                  </DropdownMenuItem>
              </Link>
              <Link href="/settings" passHref>
                  <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Ayarlar</span>
                  </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsLogoutDialogOpen(true); }}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
            <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold">Emin misin?</AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                        Çıkış yaptığında yaptığın alışverişlerden bağış yapamazsın.
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
