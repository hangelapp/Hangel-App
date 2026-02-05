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
import { ArrowDownUp, ChevronRight, Filter, Search, Bot, Send, X, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { librarySections, type LibrarySection } from '@/lib/library';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { askLibraryAssistant } from '@/ai/flows/library-ai-assistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function LibraryPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState('default');

  // Library Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  // Project Assistant State
  const [isProjectAssistantOpen, setIsProjectAssistantOpen] = useState(false);
  const [projectQuestion, setProjectQuestion] = useState('');
  const [projectChatHistory, setProjectChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isProjectLoading, setIsProjectLoading] = useState(false);

  const filteredAndSortedLibrarySections = useMemo(() => {
    let sections: LibrarySection[] = JSON.parse(JSON.stringify(librarySections));

    if (searchTerm.trim()) {
        const lowercased = searchTerm.toLowerCase();
        
        sections = sections.map(section => {
            const filteredItems = section.items.filter(item => 
                item.title.toLowerCase().includes(lowercased) ||
                item.content.toLowerCase().includes(lowercased)
            );
            
            if (section.title.toLowerCase().includes(lowercased) || filteredItems.length > 0) {
                return {
                    ...section,
                    items: section.title.toLowerCase().includes(lowercased) ? section.items : filteredItems
                };
            }
            return null;
        }).filter((section): section is LibrarySection => section !== null);
    }

    if (sortCriteria === 'alphabetical') {
        sections.forEach(section => {
            section.items.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
        });
    }

    return sections;

  }, [searchTerm, sortCriteria]);

  const handleAction = (actionName: string) => {
    toast({
        title: 'Özellik Yakında!',
        description: `${actionName} özelliği yakında aktif olacaktır.`
    });
  };

  const handleAskAssistant = useCallback(async () => {
    if (!assistantQuestion.trim()) return;

    const userMsg = assistantQuestion;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setAssistantQuestion('');
    setIsAssistantLoading(true);

    try {
        const libraryContext = librarySections.map(section => 
            `Kategori: ${section.title}, Açıklama: ${section.description}, İçerikler: ${section.items.map(i => `${i.title} (Özet: ${i.content.replace(/<[^>]*>?/gm, '').slice(0, 100)}...)`).join('; ')}`
        ).join('\n---\n');

      const result = await askLibraryAssistant({
        userQuestion: userMsg,
        libraryContext: libraryContext,
      });

      if (result.answer) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: result.answer }]);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Bir hata oluştu",
        description: "Yapay zeka asistanı yanıt verirken bir sorun oluştu.",
      });
    } finally {
      setIsAssistantLoading(false);
    }
  }, [assistantQuestion, toast]);

  const handleAskProjectAssistant = useCallback(async () => {
    if (!projectQuestion.trim()) return;

    const userMsg = projectQuestion;
    setProjectChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setProjectQuestion('');
    setIsProjectLoading(true);

    // Simulate Project Assistant logic (using library context for now)
    try {
        setTimeout(() => {
            setProjectChatHistory(prev => [...prev, { 
                role: 'assistant', 
                content: `Projeniz için harika bir fikir! "${userMsg}" konusu üzerine çalışırken kütüphanemizdeki 'Sosyal Etki Raporları' ve 'Gönüllülük Rehberleri' bölümlerinden faydalanmanızı öneririm. Projenizi nasıl daha etkili hale getirebiliriz?` 
            }]);
            setIsProjectLoading(false);
        }, 1500);
    } catch (error) {
      console.error(error);
      setIsProjectLoading(false);
    }
  }, [projectQuestion]);

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0 bg-secondary min-h-screen pb-24">
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                    <DropdownMenuItem onClick={() => setSortCriteria('default')}>Varsayılan</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortCriteria('alphabetical')}>Alfabetik (A-Z)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
      </div>

      {filteredAndSortedLibrarySections.length > 0 ? (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {filteredAndSortedLibrarySections.map((section) => {
              const Icon = Icons[section.icon as keyof typeof Icons] || Icons.HelpCircle;
              return (
                  <Card key={section.title} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
      ) : (
        <div className="text-center text-muted-foreground py-16">
          <p>Aramanızla eşleşen sonuç bulunamadı.</p>
        </div>
      )}

      {/* AI Assistants FAB and Dialogs */}
      <div className="fixed bottom-20 right-6 lg:bottom-10 lg:right-10 z-50 flex flex-col gap-4">
        
        {/* Project Assistant (Top) */}
        <Dialog open={isProjectAssistantOpen} onOpenChange={setIsProjectAssistantOpen}>
            <DialogTrigger asChild>
                <Button size="icon" className="h-14 w-14 rounded-2xl shadow-2xl bg-indigo-600 hover:bg-indigo-700 animate-in slide-in-from-bottom-4 duration-500">
                    <Sparkles className="h-7 w-7 text-white" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] h-[600px] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b bg-indigo-600 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <DialogTitle className="text-lg">Proje Asistanı</DialogTitle>
                            <DialogDescription className="text-xs text-white/80">
                                Sosyal etki projelerinizi birlikte tasarlayalım.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <ScrollArea className="flex-1 p-4 bg-muted/30">
                    <div className="space-y-4">
                        {projectChatHistory.length === 0 && (
                            <div className="text-center py-8 space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Bir sosyal sorumluluk projesi mi başlatmak istiyorsunuz? Size rehberlik edebilirim.</p>
                                <div className="flex flex-wrap justify-center gap-2 pt-2">
                                    {['Okul projesi fikri', 'Gönüllü toplama stratejisi', 'Etki ölçümleme nasıl yapılır?'].map(q => (
                                        <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => setProjectQuestion(q)}>
                                            {q}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {projectChatHistory.map((msg, i) => (
                            <div key={i} className={cn(
                                "flex items-start gap-3",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}>
                                <Avatar className="h-8 w-8 shrink-0">
                                    {msg.role === 'assistant' ? (
                                        <div className="bg-indigo-100 h-full w-full flex items-center justify-center">
                                            <Sparkles className="h-4 w-4 text-indigo-600" />
                                        </div>
                                    ) : (
                                        <AvatarFallback className="bg-muted text-[10px]">BEN</AvatarFallback>
                                    )}
                                </Avatar>
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm max-w-[85%]",
                                    msg.role === 'user' 
                                        ? "bg-indigo-600 text-white rounded-tr-none" 
                                        : "bg-background border rounded-tl-none"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isProjectLoading && (
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 bg-indigo-100">
                                    <Sparkles className="h-4 w-4 text-indigo-600 m-auto animate-pulse" />
                                </Avatar>
                                <div className="p-3 bg-background border rounded-2xl rounded-tl-none">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background">
                    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleAskProjectAssistant(); }}>
                        <Input 
                            placeholder="Projenden bahset..." 
                            value={projectQuestion}
                            onChange={(e) => setProjectQuestion(e.target.value)}
                            disabled={isProjectLoading}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={isProjectLoading || !projectQuestion.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>

        {/* Library Assistant (Bottom) */}
        <Dialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
            <DialogTrigger asChild>
                <Button size="icon" className="h-14 w-14 rounded-2xl shadow-2xl animate-bounce hover:animate-none">
                    <Bot className="h-7 w-7" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] h-[600px] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Bot className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <DialogTitle className="text-lg">Kütüphane Asistanı</DialogTitle>
                            <DialogDescription className="text-xs text-primary-foreground/80">
                                Sadece kütüphane kaynaklarını temel alarak yanıt veririm.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <ScrollArea className="flex-1 p-4 bg-muted/30">
                    <div className="space-y-4">
                        {chatHistory.length === 0 && (
                            <div className="text-center py-8 space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Kütüphanedeki veriler ve dökümanlar hakkında merak ettiklerinizi sorabilirsiniz.</p>
                                <div className="flex flex-wrap justify-center gap-2 pt-2">
                                    {['STK verilerini özetle', 'Eğitim raporları', 'Gönüllülük rehberi'].map(q => (
                                        <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => setAssistantQuestion(q)}>
                                            {q}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={cn(
                                "flex items-start gap-3",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}>
                                <Avatar className="h-8 w-8 shrink-0">
                                    {msg.role === 'assistant' ? (
                                        <div className="bg-primary/10 h-full w-full flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-primary" />
                                        </div>
                                    ) : (
                                        <AvatarFallback className="bg-muted text-[10px]">BEN</AvatarFallback>
                                    )}
                                </Avatar>
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm max-w-[85%]",
                                    msg.role === 'user' 
                                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                                        : "bg-background border rounded-tl-none"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isAssistantLoading && (
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 bg-primary/10">
                                    <Bot className="h-4 w-4 text-primary m-auto animate-pulse" />
                                </Avatar>
                                <div className="p-3 bg-background border rounded-2xl rounded-tl-none">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background">
                    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleAskAssistant(); }}>
                        <Input 
                            placeholder="Soru sor..." 
                            value={assistantQuestion}
                            onChange={(e) => setAssistantQuestion(e.target.value)}
                            disabled={isAssistantLoading}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={isAssistantLoading || !assistantQuestion.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
