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
import { ArrowDownUp, ChevronRight, Filter, Search, Bot, Send, X, Loader2, Sparkles, BookOpen, Target, Users, ClipboardCheck, Wallet, LineChart } from 'lucide-react';
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

  const projectSteps = [
    { label: 'Proje Özeti', icon: BookOpen, prompt: 'Projemin kısa bir özetini hazırlamama yardım et.' },
    { label: 'Amaç ve Hedefler', icon: Target, prompt: 'Projemin amaç ve hedeflerini (SMART) nasıl belirlemeliyim?' },
    { label: 'Hedef Kitle', icon: Users, prompt: 'Projemin hedef kitlesini ve paydaş analizini yapalım.' },
    { label: 'Faaliyet Planı', icon: ClipboardCheck, prompt: 'Adım adım bir faaliyet takvimi oluşturmama yardım et.' },
    { label: 'Bütçe Planlama', icon: Wallet, prompt: 'Projem için temel bütçe kalemlerini belirleyelim.' },
    { label: 'Etki Ölçümleme', icon: LineChart, prompt: 'Projemin sosyal etkisini nasıl ölçeceğim?' },
  ];

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

  const handleAskProjectAssistant = useCallback(async (customPrompt?: string) => {
    const userMsg = customPrompt || projectQuestion;
    if (!userMsg.trim()) return;

    setProjectChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setProjectQuestion('');
    setIsProjectLoading(true);

    try {
        // Simulate Project Assistant logic with methodology focus
        setTimeout(() => {
            setProjectChatHistory(prev => [...prev, { 
                role: 'assistant', 
                content: `Sosyal sorumluluk projesi yazım esaslarına göre "${userMsg}" talebiniz üzerine çalışalım. \n\nİyi bir proje dosyası için net bir mantıksal çerçeve (logical framework) kurmalıyız. Projenizin sürdürülebilirliğini sağlamak adına kaynak yönetimi ve etki raporlaması adımlarını kütüphanemizdeki güncel verilerle destekleyebilirim. Hangi aşamadan devam edelim?` 
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
            <DialogContent className="sm:max-w-[480px] h-[650px] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b bg-indigo-600 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <DialogTitle className="text-lg">Proje Yazım Asistanı</DialogTitle>
                            <DialogDescription className="text-xs text-white/80">
                                Sosyal etki metodolojisine uygun proje tasarımı.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <ScrollArea className="flex-1 p-4 bg-muted/30">
                    <div className="space-y-6">
                        {projectChatHistory.length === 0 && (
                            <div className="space-y-6 py-2">
                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                    <p className="text-sm font-semibold text-indigo-900 mb-1">Merhaba! Proje yolculuğuna hoş geldin.</p>
                                    <p className="text-xs text-indigo-700 leading-relaxed">
                                        Etkili bir sosyal sorumluluk projesi yazmak için aşağıdaki adımları takip edebiliriz. Hangi bölümden başlamak istersin?
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    {projectSteps.map(step => (
                                        <Button 
                                            key={step.label} 
                                            variant="outline" 
                                            className="h-auto py-3 px-3 flex flex-col items-center justify-center gap-2 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-all text-xs font-bold"
                                            onClick={() => handleAskProjectAssistant(step.prompt)}
                                        >
                                            <step.icon className="h-5 w-5 text-indigo-600" />
                                            <span className="text-center">{step.label}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {projectChatHistory.map((msg, i) => (
                            <div key={i} className={cn(
                                "flex items-start gap-3 animate-in fade-in-0 slide-in-from-bottom-2",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}>
                                <Avatar className="h-8 w-8 shrink-0">
                                    {msg.role === 'assistant' ? (
                                        <div className="bg-indigo-100 h-full w-full flex items-center justify-center">
                                            <Sparkles className="h-4 w-4 text-indigo-600" />
                                        </div>
                                    ) : (
                                        <AvatarFallback className="bg-muted text-[10px]">SEN</AvatarFallback>
                                    )}
                                </Avatar>
                                <div className={cn(
                                    "p-3.5 rounded-2xl text-sm max-w-[85%] leading-relaxed",
                                    msg.role === 'user' 
                                        ? "bg-indigo-600 text-white rounded-tr-none shadow-md" 
                                        : "bg-background border rounded-tl-none shadow-sm"
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
                            placeholder="Projenin amacından bahset..." 
                            value={projectQuestion}
                            onChange={(e) => setProjectQuestion(e.target.value)}
                            disabled={isProjectLoading}
                            className="flex-1 h-11 rounded-xl focus-visible:ring-indigo-600"
                        />
                        <Button type="submit" size="icon" disabled={isProjectLoading || !projectQuestion.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 w-11 rounded-xl">
                            <Send className="h-5 w-5" />
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
