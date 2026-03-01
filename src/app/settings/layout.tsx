
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
      <footer className="pt-8 pb-4 text-center text-[10px] text-muted-foreground space-y-1">
        <p>© 2024 hangel teknoloji ve sosyal etki anonim şirketi. Tüm hakları saklıdır.</p>
        <p>hangel v.2</p>
      </footer>
    </>
  );
}
