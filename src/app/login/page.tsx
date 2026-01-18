'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HangelLogo } from '@/components/icons';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen p-4 bg-secondary">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
          <HangelLogo className="h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            hangel'a Hoş Geldiniz
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-sm">
            İyiliğin ve sosyal etkinin buluşma noktasına bir adım daha yaklaşın.
          </p>
      </div>

        <div className="space-y-4 pb-8">
            <Link href="/login/individual" className='block p-4 bg-card rounded-xl text-left hover:bg-accent transition-colors'>
                <div className='flex items-center justify-between'>
                    <div>
                        <p className='font-semibold text-lg'>Bireysel Giriş</p>
                        <p className='text-muted-foreground'>Kendi hesabınızla devam edin.</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
            </Link>
             <Link href="/login/corporate" className='block p-4 bg-card rounded-xl text-left hover:bg-accent transition-colors'>
                <div className='flex items-center justify-between'>
                    <div>
                        <p className='font-semibold text-lg'>Kurumsal Giriş</p>
                        <p className='text-muted-foreground'>STK, marka veya kulüp hesabıyla devam edin.</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
            </Link>
        </div>
    </div>
  );
}
