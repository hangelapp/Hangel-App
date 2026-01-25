'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, User, Building } from 'lucide-react';
import { HangelLogo } from '@/components/icons';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-secondary">
        <div className="w-full max-w-md mx-auto space-y-8">
            <div className="text-center space-y-4">
                <HangelLogo className="text-5xl" />
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    hangel'a Hoş Geldiniz
                </h1>
                <p className="text-muted-foreground">
                    İyiliğin ve sosyal etkinin buluşma noktasına bir adım daha yaklaşın.
                </p>
            </div>
            <div className="space-y-4">
                <Link href="/login/individual" className='block p-6 bg-card rounded-xl text-left hover:bg-accent transition-colors border'>
                    <div className='flex items-center justify-between'>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <User className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className='font-semibold text-lg'>Bireysel Giriş</p>
                                <p className='text-muted-foreground text-sm'>Kendi hesabınızla devam edin.</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </Link>
                <Link href="/login/corporate" className='block p-6 bg-card rounded-xl text-left hover:bg-accent transition-colors border'>
                    <div className='flex items-center justify-between'>
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 rounded-lg">
                                <Building className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <p className='font-semibold text-lg'>Kurumsal Giriş</p>
                                <p className='text-muted-foreground text-sm'>STK, marka veya kulüp hesabıyla devam edin.</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </Link>
            </div>
        </div>
    </div>
  );
}
