import Link from 'next/link';
import { Menu, Bell, Siren, UserCircle } from 'lucide-react';
import { Button } from './ui/button';
import { HangelLogo } from './icons';

export default function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 mx-auto max-w-md border-b bg-card/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/timeline" className="flex items-center gap-2">
            <HangelLogo className="h-8 w-8 text-primary" />
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notifications">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/emergency">
              <Siren className="h-5 w-5 text-destructive" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profile">
              <UserCircle className="h-6 w-6" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
