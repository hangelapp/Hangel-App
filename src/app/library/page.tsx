'use client';

import React, { useState, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as Icons from 'lucide-react';
import { Search, ChevronRight, BookOpen, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { LibrarySection, LibraryItem } from '@/lib/library';
import { librarySections as staticSections } from '@/lib/library';

export default function LibraryPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const libQuery = useMemoFirebase(() => collection(db, 'library'), [db]);
  const { data: libData, isLoading } = useCollection<LibrarySection>(libQuery);

  // Firestore sections ile statik sections merge edilir; statik sections her zaman dahil edilir
  const sections = useMemo(() => {
    if (!libData || libData.length === 0) return staticSections;
    const firestoreSlugs = new Set(libData.map(s => s.slug));
    const extraStatic = staticSections.filter(s => !firestoreSlugs.has(s.slug));
    return [...libData, ...extraStatic];
  }, [libData]);

  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const lower = searchTerm.toLowerCase();
    return sections.filter(s =>
        s.title.toLowerCase().includes(lower) ||
        s.items?.some(i => i.title.toLowerCase().includes(lower))
    );
  }, [sections, searchTerm]);

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0 bg-secondary min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Kütüphane</h1>
        <p className="mt-2 text-muted-foreground">Sosyal etki kaynaklarını veritabanından anlık keşfedin.</p>
      </div>

       <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Kaynaklarda ara..." className="pl-10 h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="space-y-4">
        {isLoading ? (
            [...Array(3)].map((_, i) => <Card key={i} className="h-20 animate-pulse bg-muted" />)
        ) : filteredSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Aramanızla eşleşen sonuç bulunamadı.</p>
            </div>
        ) : filteredSections.map(section => {
            const Icon = (Icons as any)[section.icon] || BookOpen;
            return (
                <Card key={section.slug} className="overflow-hidden">
                    <Accordion type="single" collapsible>
                        <AccordionItem value={section.slug} className="border-b-0">
                            <AccordionTrigger className="p-4 hover:no-underline">
                                <div className="flex items-center gap-4">
                                    <Icon className="h-6 w-6 text-primary" />
                                    <div className="text-left">
                                        <p className="font-semibold">{section.title}</p>
                                        <p className="text-sm text-muted-foreground">{section.description}</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0 border-t bg-background">
                                {section.items && section.items.length > 0 ? (
                                    section.items.map(item => (
                                        <Link href={`/library/${item.slug}`} key={item.slug} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50">
                                            <span className="text-sm font-medium">{item.title}</span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </Link>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <BookOpen className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                        <p className="text-sm text-muted-foreground">Bu bölümde henüz içerik bulunmuyor.</p>
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </Card>
            )
        })}
      </div>
    </div>
  );
}
