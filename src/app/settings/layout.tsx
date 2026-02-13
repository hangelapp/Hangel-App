'use client';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't apply this layout to public contracts pages
  if (pathname.startsWith('/settings/contracts')) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <footer className="pt-8 pb-4 text-center text-xs text-muted-foreground">
        <p>® hangel.org v.12</p>
      </footer>
    </>
  );
}
