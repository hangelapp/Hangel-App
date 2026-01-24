import '@/app/globals.css';

export const metadata = {
  title: 'Web Sitesi Önizlemesi',
  description: 'Hangel tarafından oluşturulan web sitesi önizlemesi',
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
