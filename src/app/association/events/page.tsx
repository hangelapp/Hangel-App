
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/components/providers/language-provider';

const AssociationHeader = ({ currentPage }: { currentPage: string }) => {
    const router = useRouter();
    const { t } = useTranslation();
    return (
        <header className="fixed top-0 inset-x-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top)]">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
                <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('association.back')}
                </Button>
                <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
                    <Link href="/association/about" className={cn("hover:text-primary transition-colors", currentPage === 'about' && "text-primary")}>{t('association.navAbout')}</Link>
                    <Link href="/association/events" className={cn("hover:text-primary transition-colors", currentPage === 'events' && "text-primary")}>{t('association.navEvents')}</Link>
                    <Link href="/association/workshop" className={cn("hover:text-primary transition-colors", currentPage === 'workshop' && "text-primary")}>{t('association.navWorkshop')}</Link>
                    <Link href="/association/legislation" className={cn("hover:text-primary transition-colors", currentPage === 'legislation' && "text-primary")}>{t('association.navLegislation')}</Link>
                </nav>
                <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90">
                    <Link href="/login/selection?action=register">{t('association.volunteerCta')}</Link>
                </Button>
            </div>
        </header>
    );
};

interface EventLineupProps {
    title: string;
    date: string;
    location: string;
    image: string;
    hint: string;
    description: string;
    category: string;
    inspectLabel: string;
}

const EventLineup = ({ title, date, location, image, hint, description, category, inspectLabel }: EventLineupProps) => (
    <div className="group relative w-full border-b border-border py-16 flex flex-col md:flex-row items-center gap-12 px-6 hover:bg-muted/50 transition-colors">
        <div className="relative w-full md:w-80 aspect-video rounded-[2rem] overflow-hidden shadow-2xl shrink-0">
            <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" data-ai-hint={hint} />
        </div>
        <div className="flex-1 text-left space-y-4">
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-bold uppercase text-[9px] tracking-widest px-3 py-1 rounded-full">{category}</Badge>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {date}</span>
            </div>
            <h3 className="text-3xl font-bold text-foreground tracking-tight">{title}</h3>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl font-medium">{description}</p>
            <div className="flex items-center gap-4 pt-2">
                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {location}</span>
            </div>
        </div>
        <Button asChild variant="outline" className="rounded-full px-8 h-12 font-bold border-border hover:bg-muted self-start md:self-center">
            <Link href="/events">{inspectLabel}</Link>
        </Button>
    </div>
);

export default function AssociationEventsPage() {
    const { t } = useTranslation();
    const inspectLabel = t('associationEvents.inspectBtn');

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
            <AssociationHeader currentPage="events" />

            <section className="pt-[calc(8rem+env(safe-area-inset-top))] pb-20 px-6 text-center space-y-4 bg-muted">
                <h1 className="text-3xl sm:text-5xl md:text-8xl font-bold tracking-tight text-foreground">{t('associationEvents.heroTitle')}</h1>
                <p className="text-lg sm:text-xl md:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                    {t('associationEvents.heroDesc')}
                </p>
            </section>

            <div className="container mx-auto max-w-6xl">
                <EventLineup
                    inspectLabel={inspectLabel}
                    category={t('associationEvents.event1Cat')}
                    title={t('associationEvents.event1Title')}
                    date={t('associationEvents.event1Date')}
                    location={t('associationEvents.event1Loc')}
                    description={t('associationEvents.event1Desc')}
                    image="https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=2070&auto=format&fit=crop"
                    hint="charity village concept"
                />
                <EventLineup
                    inspectLabel={inspectLabel}
                    category={t('associationEvents.event2Cat')}
                    title={t('associationEvents.event2Title')}
                    date={t('associationEvents.event2Date')}
                    location={t('associationEvents.event2Loc')}
                    description={t('associationEvents.event2Desc')}
                    image="https://images.unsplash.com/photo-1540575861501-7ad0582371f3?q=80&w=2070&auto=format&fit=crop"
                    hint="international conference auditorium"
                />
                <EventLineup
                    inspectLabel={inspectLabel}
                    category={t('associationEvents.event3Cat')}
                    title={t('associationEvents.event3Title')}
                    date={t('associationEvents.event3Date')}
                    location={t('associationEvents.event3Loc')}
                    description={t('associationEvents.event3Desc')}
                    image="https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop"
                    hint="university students seminar"
                />
                <EventLineup
                    inspectLabel={inspectLabel}
                    category={t('associationEvents.event4Cat')}
                    title={t('associationEvents.event4Title')}
                    date={t('associationEvents.event4Date')}
                    location={t('associationEvents.event4Loc')}
                    description={t('associationEvents.event4Desc')}
                    image="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop"
                    hint="truck delivery logistics"
                />
            </div>

            <section className="bg-black text-white py-32 text-center">
                <div className="container mx-auto px-6 max-w-4xl space-y-8">
                    <Heart className="h-16 w-16 text-primary mx-auto" />
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">{t('associationEvents.outroTitle')}</h2>
                    <p className="text-xl md:text-2xl text-white/70 leading-relaxed font-medium">
                        {t('associationEvents.outroDesc')}
                    </p>
                </div>
            </section>

            <PublicFooter currentPageLabel={t('association.navEvents')} />
        </div>
    );
}
