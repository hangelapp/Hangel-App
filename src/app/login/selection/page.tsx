'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { User, Building, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function SelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action') || 'login';

  const title = action === 'register' ? 'Kayıt Ol' : 'Giriş Yap';
  const description = action === 'register' 
    ? 'Hangel\'e katılmak için hesap türünü seçin.' 
    : 'Hangel\'e devam etmek için hesap türünü seçin.';
    
  const individualHref = action === 'register' ? '/login/individual?tab=register' : '/login/individual';
  const corporateHref = action === 'register' ? '/login/corporate?tab=register' : '/login/corporate';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background relative">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-4 left-4">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-headline">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Link href={individualHref}>
            <Card className="hover:bg-accent hover:border-primary transition-all">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Bireysel Hesap</h3>
                  <p className="text-sm text-muted-foreground">Gönüllü ol, bağış yap, etki yarat.</p>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href={corporateHref}>
            <Card className="hover:bg-accent hover:border-primary transition-all">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
                <Building className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Kurumsal Hesap</h3>
                  <p className="text-sm text-muted-foreground">STK, marka veya öğrenci kulübü olarak katılın.</p>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SelectionPage() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <SelectionContent />
        </Suspense>
    )
}
