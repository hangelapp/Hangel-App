import Link from 'next/link';

export const metadata = {
  title: 'hangel App Clip',
  description: 'hangel — sosyal etki platformu. Etkinlik kodunu okutarak anında katıl.',
};

/**
 * /clip — App Clip "Default Experience" hedef URL'i + tarayıcı fallback'i.
 *
 * Bir hangel App Clip kodu/QR'ı iOS'ta okutulunca NATIVE App Clip açılır; bu sayfa
 * yalnızca link normal bir tarayıcıda açıldığında görünür (uygulamaya/indirmeye yönlendirir).
 */
export default function ClipLandingPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-background px-6 text-center">
      <div className="w-full max-w-sm rounded-3xl border bg-card p-8 shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-white">h</div>
        <h1 className="text-2xl font-black tracking-tight">hangel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sosyal etki platformu. Etkinlik veya marka kodunu okutarak anında katıl,
          gönüllü ol, destek ol.
        </p>
        <div className="mt-6 space-y-2">
          <Link href="/app" className="block w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-white">
            Uygulamayı Aç / İndir
          </Link>
          <Link href="/gelir-modeli-konferanslari" className="block w-full rounded-full border px-6 py-3 text-sm font-semibold">
            Etkinlikleri Gör
          </Link>
        </div>
        <p className="mt-5 text-[11px] text-muted-foreground">hangel.org</p>
      </div>
    </main>
  );
}
