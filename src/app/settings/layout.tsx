export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <footer className="pt-8 pb-4 text-center text-xs text-muted-foreground">
        <p>® hangel.org v.12</p>
      </footer>
    </>
  );
}
