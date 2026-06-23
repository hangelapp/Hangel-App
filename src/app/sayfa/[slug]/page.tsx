'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useWebCustomPage } from '@/hooks/use-site-content';
import { sanitizeHtml } from '@/lib/sanitize-html';

export default function CustomWebPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const page = useWebCustomPage(slug);

    if (page.isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Bilinmeyen / boş slug → graceful "bulunamadı".
    const hasContent = !!(page.title || page.description || page.body);
    if (!hasContent) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4">
                    <h1 className="text-2xl font-bold text-[#1d1d1f]">Sayfa bulunamadı.</h1>
                    <p className="text-muted-foreground">Aradığınız sayfa mevcut değil veya kaldırılmış olabilir.</p>
                    <Button onClick={() => router.push('/')} className="rounded-full px-8 h-12 font-bold mt-2">
                        Ana Sayfaya Dön
                    </Button>
                </div>
                <PublicFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans">
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5 pt-[env(safe-area-inset-top)]">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                    </Button>
                    <div className="w-16" />
                </div>
            </header>

            <main className="pt-24 pb-24">
                <section className="container mx-auto px-6 max-w-3xl space-y-8">
                    <div className="space-y-4 text-center">
                        {page.subtitle && (
                            <p className="text-sm md:text-base font-bold uppercase tracking-widest text-primary">{page.subtitle}</p>
                        )}
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#1d1d1f] leading-[0.95]">
                            {page.title}
                        </h1>
                        {page.description && (
                            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
                                {page.description}
                            </p>
                        )}
                    </div>

                    {page.heroImageUrl && (
                        <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-xl">
                            <Image src={page.heroImageUrl} alt={page.title || 'Sayfa görseli'} fill className="object-cover" unoptimized />
                        </div>
                    )}

                    {page.body && (
                        <div
                            className="prose prose-lg max-w-none mt-8"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.body) }}
                        />
                    )}
                </section>
            </main>

            <PublicFooter currentPageLabel={page.title} />
        </div>
    );
}
