'use client';

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
import { ArrowDownUp, ChevronRight, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { librarySections } from '@/lib/library';

export default function LibraryPage() {
  const { toast } = useToast();

  const handleAction = (actionName: string) => {
    toast({
        title: 'Özellik Yakında!',
        description: `${actionName} özelliği yakında aktif olacaktır.`
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0 bg-secondary min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Kütüphane</h1>
        <p className="mt-2 text-muted-foreground">Sosyal etki, gönüllülük ve sivil toplum hakkında kaynakları keşfedin.</p>
      </div>

       <div className="p-0 flex gap-2 items-center max-w-lg mx-auto">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Kaynaklarda ara..."
                    className="pl-10 h-11"
                />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => handleAction('Filtreleme')}>
                <Filter className="h-5 w-5" />
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11">
                        <ArrowDownUp className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAction('Tarihe göre sıralama')}>Tarihe Göre (En Yeni)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('Popülerliğe göre sıralama')}>Popülerliğe Göre</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('Alfabetik sıralama')}>Alfabetik (A-Z)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {librarySections.map((section) => {
            const Icon = section.icon;
            return (
                <Card key={section.title} className="overflow-hidden">
                    <AccordionItem value={section.title} className="border-b-0">
                        <AccordionTrigger className="p-4 hover:no-underline hover:bg-accent/50">
                            <div className="flex items-center gap-4">
                                <Icon className="h-6 w-6 text-primary" />
                                <div className="text-left">
                                    <p className="font-semibold text-base">{section.title}</p>
                                    <p className="text-sm text-muted-foreground">{section.description}</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="border-t">
                             {section.items.map(item => (
                                <Link href={`/library/${item.slug}`} key={item.slug} className="block">
                                    <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-accent/50 transition-colors">
                                        <span className="font-medium text-sm flex-1 pr-4">{item.title}</span>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    </div>
                                </Link>
                            ))}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
            )
        })}
      </Accordion>
    </div>
  );
}
