
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import * as Icons from 'lucide-react';
import { ArrowDownUp, ChevronRight, Filter, Search, Bot, Loader2, Sparkles, BookOpen, Target, Users, ClipboardCheck, Wallet, LineChart, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import { askLibraryAssistant } from '@/ai/flows/library-ai-assistant';
import { writeProjectProposal } from '@/ai/flows/project-writer-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { LibrarySection, LibraryItem } from '@/lib/library';

const DictionaryItem = ({ item }: { item: LibraryItem }) => {
    const { toast } = useToast();
    const [voted, setVoted] = useState<'up' | 'down' | null>(null);

    const handleVote = (type: 'up' | 'down') => {
        setVoted(type);
        toast({ title: "Geri Bildirim Alındı", description: "Teşekkürler!" });
    };

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={item.slug} className="border-b last:border-b-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-medium">{item.title}</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 bg-muted/20">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground mb-4" dangerouslySetInnerHTML={{ __html: item.content }} />
                    <div className="flex gap-1">
                        <Button variant={voted === 'up' ? 'default' : 'outline'} size="sm" className="h-7 px-2 text-[10px]" onClick={() => handleVote('up')}><ThumbsUp className="h-3 w-3" /></Button>
                        <Button variant={voted === 'down' ? 'destructive' : 'outline'} size="sm" className="h-7 px-2 text-[10px]" onClick={() => handleVote('down')}><ThumbsDown className="h-3 w-3" /></Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

export default function LibraryPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const libQuery = useMemoFirebase(() => collection(db, 'library'), [db]);
  const { data: libData, isLoading } = useCollection<LibrarySection>(libQuery);

  const filteredSections = useMemo(() => {
    if (!libData) return [];
    if (!searchTerm.trim()) return libData;
    const lower = searchTerm.toLowerCase();
    return libData.filter(s => s.title.toLowerCase().includes(lower) || s.items.some(i => i.title.toLowerCase().includes(lower)));
  }, [libData, searchTerm]);

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
        ) : filteredSections.map(section => {
            const Icon = Icons[section.icon as keyof typeof Icons] || Icons.BookOpen;
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
                                {section.items.map(item => (
                                    <Link href={`/library/${item.slug}`} key={item.slug} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50">
                                        <span className="text-sm font-medium">{item.title}</span>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                ))}
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
