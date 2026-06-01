
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { useAssociationContent } from '@/hooks/use-site-content';
import { sanitizeHtml } from '@/lib/sanitize-html';

const AssociationHeader = ({ currentPage }: { currentPage: string }) => {
    const router = useRouter();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                <Button onClick={() => router.push('/hangelassociation')} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Geri
                </Button>
                <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-tight text-[#1d1d1f]/60">
                    <Link href="/hangelassociation/about" className={cn("hover:text-primary transition-colors", currentPage === 'about' && "text-primary")}>Dernek Hakkında</Link>
                    <Link href="/hangelassociation/press" className={cn("hover:text-primary transition-colors", currentPage === 'press' && "text-primary")}>Basında Biz</Link>
                    <Link href="/hangelassociation/conferences" className={cn("hover:text-primary transition-colors", currentPage === 'conferences' && "text-primary")}>Konferanslar</Link>
                    <Link href="/hangelassociation/events" className={cn("hover:text-primary transition-colors", currentPage === 'events' && "text-primary")}>Dernek Etkinlikleri</Link>
                </nav>
                <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                    <Link href="/login/selection?action=register">Gönüllü Ol</Link>
                </Button>
            </div>
        </header>
    );
};

export default function AssociationPressPage() {
    const { get } = useAssociationContent();
    const title = get('press.title', 'Basında Biz');
    const subtitle = get('press.subtitle', 'hangel Derneği medyada nasıl yer aldı');
    const bodyHtml = get('press.body', '<p>Henüz yayınlanmış basın bültenimiz bulunmuyor. Yakında burada olacağız.</p>');
    const heroImage = get('press.heroImage', '');

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="press" />

            <main className="container mx-auto px-4 pt-32 pb-24 max-w-4xl">
                <header className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#1d1d1f]">{title}</h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">{subtitle}</p>
                </header>
                {heroImage && (
                    <div className="relative w-full aspect-[21/9] mb-12 rounded-[2rem] overflow-hidden shadow-xl">
                        <Image src={heroImage} alt={title} fill className="object-cover" />
                    </div>
                )}
                <article
                    className="prose prose-neutral dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
                />
            </main>

            <PublicFooter currentPageLabel="Basında Biz" />
        </div>
    );
}
