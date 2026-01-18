'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8.5rem)] p-4 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-destructive tracking-tight">
            hangel
          </h1>
          <p className="text-3xl font-bold text-foreground tracking-tight font-headline mt-4">
            Hoş Geldiniz
          </p>
          <p className="mt-2 text-muted-foreground">
            Lütfen giriş türünü seçin.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/login/individual">Bireysel Giriş</Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/login/corporate">Kurumsal Giriş</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
