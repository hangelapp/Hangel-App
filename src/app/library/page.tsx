
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
import { ArrowDownUp, ChevronRight, Filter, Search, Bot, Send, X, Loader2, Sparkles, BookOpen, Target, Users, ClipboardCheck, Wallet, LineChart, ThumbsUp, ThumbsDown, Landmark, Building2, Globe } from 'lucide-react';
import Link from 'next/link';
import { librarySections, type LibrarySection, type LibraryItem } from '@/lib/library';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { askLibraryAssistant } from '@/ai/flows/library-ai-assistant';
import { writeProjectProposal } from '@/ai/flows/project-writer-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const DictionaryItem = ({ item }: { item: LibraryItem }) => {
    const { toast } = useToast();
    const [voted, setVoted] = useState<'up' | 'down' | null>(null);

    const handleVote = (type: 'up' | 'down') => {
        setVoted(type);
        toast({
            title: "Geri Bildiriminiz Alındı",
            description: "Bu tanımın geliştirilmesine yardımcı olduğunuz için teşekkürler!",
        });
    };

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={item.slug} className="border-b last:border-b-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/30 text-sm font-medium">
                    {item.title}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 bg-muted/20">
                    <div 
                        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground mb-4"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                    <div className="flex items-center gap-3 pt-3 border-t border-dashed">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bu tanım yararlı oldu mu?</span>
                        <div className="flex gap-1">
                            <Button 
                                variant={voted === 'up' ? 'default' : 'outline'} 
                                size="sm" 
                                className="h-7 px-2 gap-1 text-[10px]"
                                onClick={() => handleVote('up')}
                            >
                                <ThumbsUp className="h-3 w-3" /> Yararlı
                            </Button>
                            <Button 
                                variant={voted === 'down' ? 'destructive' : 'outline'} 
                                size="sm" 
                                className="h-7 px-2 gap-1 text-[10px]"
                                onClick={() => handleVote('down')}
                            >
                                <ThumbsDown className="h-3 w-3" /> Yararsız
                            </Button>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

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
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [projectResult, setProjectResult] = useState<string | null>(null);
  
  const [projectForm, setProjectForm] = useState({
    institution: '',
    summary: '',
    goals: '',
    audience: '',
    activities: '',
    budget: '',
    impact: ''
  });

  const projectSteps = [
    { id: 'summary', label: 'Proje Özeti', icon: BookOpen, placeholder: 'Projenizin temel fikrini birkaç cümleyle açıklayın...' },
    { id: 'goals', label: 'Amaç ve Hedefler', icon: Target, placeholder: 'Neyi başarmak istiyorsunuz? SMART hedeflerinizi belirtin...' },
    { id: 'audience', label: 'Hedef Kitle', icon: Users, placeholder: 'Proje kimlere fayda sağlayacak? Paydaşlarınız kimler?' },
    { id: 'activities', label: 'Faaliyet Planı', icon: ClipboardCheck, placeholder: 'Hangi adımları atacaksınız? Uygulama takviminiz nasıl?' },
    { id: 'budget', label: 'Bütçe Planlama', icon: Wallet, placeholder: 'Tahmini maliyetler ve kaynak ihtiyaçları nelerdir?' },
    { id: 'impact', label: 'Etki Ölçümleme', icon: LineChart, placeholder: 'Başarıyı nasıl ölçeceksiniz? Hangi göstergeleri kullanacaksınız?' },
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
  
  const libraryContextString = useMemo(() => {
    return librarySections.map(section => 
        `Section: ${section.title}\nDescription: ${section.description}\nItems:\n${section.items.map(item => `- ${item.title}: ${item.content.replace(/<[^>]*>?/gm, '')}`).join('\n')}`
    ).join('\n\n');
  }, []);

  const handleAskAssistant = useCallback(async () => {
    if (!assistantQuestion.trim()) return;

    const userMsg = assistantQuestion;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setAssistantQuestion('');
    setIsAssistantLoading(true);

    try {
        const result = await askLibraryAssistant({
            userQuestion: userMsg,
            libraryContext: libraryContextString,
        });

        if (result && result.answer) {
             setChatHistory(prev => [...prev, { role: 'assistant', content: result.answer }]);
        } else {
            throw new Error("AI assistant did not return an answer.");
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
  }, [assistantQuestion, toast, libraryContextString]);

  const handleGenerateProject = async () => {
    if (!projectForm.institution) {
        toast({ variant: 'destructive', title: 'Kurum Seçimi Gerekli', description: 'Lütfen başvurulacak kurumu seçin.' });
        return;
    }

    setIsProjectLoading(true);
    setProjectResult(null);

    try {
        const result = await writeProjectProposal({
            institution: projectForm.institution,
            sections: {
                summary: projectForm.summary,
                goals: projectForm.goals,
                audience: projectForm.audience,
                activities: projectForm.activities,
                budget: projectForm.budget,
                impact: projectForm.impact,
            },
            libraryContext: libraryContextString,
        });
        
        if (result && result.fullProposal) {
             setProjectResult(result.fullProposal);
        } else {
            throw new Error("AI assistant did not return a proposal.");
        }
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Hata', description: 'Proje oluşturulurken bir sorun oluştu.' });
    } finally {
        setIsProjectLoading(false);
    }
  };

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
              const isDictionary = section.slug === 'sivil-toplum-sozlugu' || section.slug === 'hangel-sozluk';

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
                          <AccordionContent className="p-0">
                             <div className="border-t">
                               {isDictionary ? (
                                   <div className="divide-y bg-background">
                                       {section.items.map(item => <DictionaryItem key={item.slug} item={item} />)}
                                   </div>
                               ) : (
                                   <div className="bg-background">
                                       {section.items.map(item => (
                                          <Link href={`/library/${item.slug}`} key={item.slug} className="block">
                                              <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-accent/50 transition-colors">
                                                  <span className="font-medium text-sm flex-1 pr-4">{item.title}</span>
                                                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                              </div>
                                          </Link>
                                      ))}
                                   </div>
                               )}
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
            <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b bg-indigo-600 text-white rounded-t-lg shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <DialogTitle className="text-lg">Proje Yazım Asistanı</DialogTitle>
                            <DialogDescription className="text-xs text-white/80">
                                Kurumsal standartlarda sosyal sorumluluk projesi tasarımı.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <ScrollArea className="flex-1 p-6 bg-muted/30">
                    {!projectResult ? (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <Label className="text-indigo-900 font-bold uppercase tracking-widest text-[10px]">1. Başvurulacak Kurum</Label>
                                <Select value={projectForm.institution} onValueChange={(val) => setProjectForm(prev => ({...prev, institution: val}))}>
                                    <SelectTrigger className="h-12 rounded-xl bg-white border-indigo-100 shadow-sm focus:ring-indigo-600">
                                        <SelectValue placeholder="Kurum seçiniz..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Avrupa Birliği (AB) / Erasmus+">Avrupa Birliği (AB) / Erasmus+</SelectItem>
                                        <SelectItem value="UNDP / Birleşmiş Milletler">UNDP / Birleşmiş Milletler</SelectItem>
                                        <SelectItem value="Kalkınma Ajansı">Kalkınma Ajansı</SelectItem>
                                        <SelectItem value="T.C. İçişleri Bakanlığı">T.C. İçişleri Bakanlığı</SelectItem>
                                        <SelectItem value="Özel Sektör / Kurumsal Fonlar">Özel Sektör / Kurumsal Fonlar</SelectItem>
                                        <SelectItem value="Büyükelçilik Fonları">Büyükelçilik Fonları</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-indigo-900 font-bold uppercase tracking-widest text-[10px]">2. Proje Taslak Bilgileri</Label>
                                <Accordion type="single" collapsible className="w-full space-y-2">
                                    {projectSteps.map(step => (
                                        <AccordionItem key={step.id} value={step.id} className="border rounded-xl bg-white overflow-hidden shadow-sm">
                                            <AccordionTrigger className="px-4 py-3 hover:no-underline font-semibold text-sm">
                                                <div className="flex items-center gap-3">
                                                    <step.icon className="h-4 w-4 text-indigo-600" />
                                                    {step.label}
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 pt-0">
                                                <Textarea 
                                                    placeholder={step.placeholder}
                                                    className="min-h-[100px] border-none bg-muted/30 focus-visible:ring-0 text-sm"
                                                    value={projectForm[step.id as keyof typeof projectForm]}
                                                    onChange={(e) => setProjectForm(prev => ({...prev, [step.id]: e.target.value}))}
                                                />
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-lg text-indigo-900">Hazırlanan Proje Dosyası</h3>
                                <Button variant="outline" size="sm" onClick={() => setProjectResult(null)}>Düzenlemeye Dön</Button>
                            </div>
                            <div className="p-6 bg-white border rounded-3xl shadow-sm prose prose-sm max-w-none prose-indigo">
                                <div className="flex justify-end mb-4">
                                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(projectResult); toast({title: 'Kopyalandı'}); }}>
                                        <Icons.Copy className="h-4 w-4 mr-2" /> Kopyala
                                    </Button>
                                </div>
                                <div dangerouslySetInnerHTML={{ __html: projectResult.replace(/\n/g, '<br/>') }} />
                            </div>
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t bg-background shrink-0">
                    {!projectResult ? (
                        <Button 
                            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-200"
                            onClick={handleGenerateProject}
                            disabled={isProjectLoading || !projectForm.institution}
                        >
                            {isProjectLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Yapay Zeka Projeyi Yazıyor...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Projeyi Kurum Esaslarına Göre Oluştur
                                </>
                            )}
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 h-12 rounded-xl border-indigo-200 text-indigo-700 font-bold" onClick={() => toast({title: 'PDF Hazırlanıyor'})}>
                                <Icons.Download className="mr-2 h-5 w-5" /> PDF İndir
                            </Button>
                            <Button className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => toast({title: 'Paylaşım Menüsü'})}>
                                <Icons.Share2 className="mr-2 h-5 w-5" /> Projeyi Paylaş
                            </Button>
                        </div>
                    )}
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

