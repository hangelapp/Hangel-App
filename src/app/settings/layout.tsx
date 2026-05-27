
'use client';
import { usePathname } from 'next/navigation';
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith('/settings/contracts')) {
    return <>{children}</>;
  }

  // Why: Settings pages farklı genişlikler kullanıyordu (max-w-3xl, max-w-none).
  // Tek container ile tutarlı + geniş ekran (laptop, tablet) deneyimi iyileştirildi.
  // Footer pb bottom-nav + safe-area-inset hesabıyla dinamik (mobil bottom-nav
  // üzerine binmesin diye).
  return (
    <div className="mx-auto w-full max-w-3xl">
      {children}
      <footer className="pt-8 pb-[calc(5rem+env(safe-area-inset-bottom))] text-center text-[10px] text-muted-foreground space-y-1">
        <p>© 2024 hangel teknoloji ve sosyal etki anonim şirketi. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
