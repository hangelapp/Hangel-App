

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownUp, Filter, Heart, Users, ChevronRight, ShieldCheck, X, Info, MessageCircle, Share2, CreditCard, Building, MapPin, Award, Calendar, Handshake, Mail, Phone, Globe, Instagram, Linkedin, Facebook, CheckCircle, AlertCircle, Eye, Rss, Store } from 'lucide-react';
import Link from 'next/link';
import { ngos, timelinePosts, user, volunteeringOpportunities } from '@/lib/data';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { NGO, Post, Volunteering } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { ShareButtons } from '@/components/shared/share-buttons';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { differenceInDays, format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';


type NgoType = NGO['type'] | 'Tümü';
type LocationFilter = 'global' | 'country' | 'city';

const PostCard = ({ post }: { post: (typeof timelinePosts)[0] }) => (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-sm">{post.author.name}</p>
                    <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm">{post.content}</p>
            {post.imageUrl && (
                <div className="relative aspect-video mt-4 rounded-lg overflow-hidden">
                    <Image src={post.imageUrl} alt="Post image" fill className="object-cover" />
                </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-start gap-0 border-t p-0">
            <Button variant="ghost" className="flex-1 flex items-center gap-2 text-muted-foreground h-12 text-base">
                <Heart className="h-5 w-5" /> 
                <span>Beğen</span>
            </Button>
            <div className="w-[1px] h-6 bg-border self-center" />
            <Button variant="ghost" className="flex-1 flex items-center gap-2 text-muted-foreground h-12 text-base">
                <Share2 className="h-5 w-5" /> 
                <span>Paylaş</span>
            </Button>
        </CardFooter>
    </Card>
);

const OpportunityCard = ({ opp }: { opp: (typeof volunteeringOpportunities)[0] }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-base">{opp.title}</CardTitle>
            <CardDescription>{opp.organization}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{opp.location.city} ({opp.location.type})</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />{opp.commitment}</div>
            <div className="flex items-center gap-2 text-primary font-semibold"><Award className="h-4 w-4" />{opp.points} Puan</div>
        </CardContent>
        <CardFooter>
            <Button asChild variant="secondary" className="w-full">
                <Link href={`/volunteering/${opp.id}`}>Detayları Gör</Link>
            </Button>
        </CardFooter>
    </Card>
);

const NgoDetailView = ({ ngo }: { ngo: NGO; }) => {
    const { toast } = useToast();
    const router = useRouter();

    const ngoPosts = timelinePosts.filter(p => p.author.name === ngo.name);
    const ngoOpps = volunteeringOpportunities.filter(o => o.ngoId === ngo.id);
    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/ngos/${ngo.id}` : '';

    const transparencyCriteria = [
        { name: 'Faaliyet Belgesi', completed: true },
        { name: 'Tüzük / Vakıf Senedi', completed: true },
        { name: 'Yönetim Kurulu Listesi', completed: ngo.transparencyScore > 80 },
        { name: 'Yıllık Faaliyet Raporu', completed: true },
        { name: 'Finansal Tablolar', completed: ngo.transparencyScore > 85 },
        { name: 'Bağımsız Denetim Raporu', completed: ngo.transparencyScore > 90 },
        { name: 'Etki Raporu', completed: ngo.transparencyScore > 75 },
    ];
    
    const handleStoreClick = () => {
        if (ngo.economicEnterpriseUrl) {
            router.push(ngo.economicEnterpriseUrl);
        } else {
            toast({
                title: "Bilgi",
                description: "Bu sivil toplum kuruluşunun iktisadi işletmesi bulunmamaktadır.",
            });
        }
    };
    
    return (
        <div className="animate-in fade-in-0">
            <div className="relative h-48 w-full bg-muted">
                {ngo.coverPhotoUrl && <Image src={ngo.coverPhotoUrl} alt={`${ngo.name} Cover`} fill className="object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
                 <div className="absolute top-4 right-4 z-10">
                    <ShareButtons url={profileUrl} title={`Hangel'deki ${ngo.name} profilini incele!`} />
                </div>
            </div>
            <div className="p-4 bg-background">
                <div className="flex gap-4 items-end -mt-16">
                    <Avatar className="h-24 w-24 border-4 border-background shrink-0 bg-white shadow-lg">
                        <AvatarImage src={ngo.avatarUrl} alt={ngo.name} className="object-contain p-2"/>
                        <AvatarFallback>{ngo.name.slice(0,2)}</AvatarFallback>
                    </Avatar>
                </div>
                 <div className="mt-4 space-y-2">
                    <h1 className="text-2xl font-bold font-headline">{ngo.name}</h1>
                    <p className="text-muted-foreground text-sm capitalize">{ngo.category}</p>
                </div>
                 <div className="flex gap-2 mt-4">
                    <Button className="flex-1">
                        <Heart className="mr-2 h-4 w-4" /> Takip Et
                    </Button>
                    <Button variant="outline" className="flex-1">
                        Bağışçı Ol
                    </Button>
                </div>
            </div>
            <Tabs defaultValue="about" className="w-full p-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="about">Hakkında</TabsTrigger>
                    <TabsTrigger value="opportunities">Fırsatlar</TabsTrigger>
                    <TabsTrigger value="transparency">Şeffaflık</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Kuruluş Hakkında</CardTitle></CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-4">
                           <p>{ngo.about}</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="opportunities" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Gönüllülük Fırsatları</CardTitle></CardHeader>
                        <CardContent>
                             {ngoOpps.length > 0 ? (
                                ngoOpps.map(opp => <p key={opp.id}>{opp.title}</p>)
                            ) : (
                                <p className="text-center text-muted-foreground p-4">Aktif gönüllülük ilanı bulunmuyor.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="transparency" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Şeffaflık Puanı</CardTitle></CardHeader>
                        <CardContent className="text-center">
                            <p className="text-4xl font-bold text-primary">{ngo.transparencyScore}</p>
                            <Progress value={ngo.transparencyScore} className="mt-2" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};


export default function NgosPage() {
    const [typeFilter, setTypeFilter] = useState<NgoType>('Tümü');
    const [locationFilter, setLocationFilter] = useState<LocationFilter>('country');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [viewingNgo, setViewingNgo] = useState<NGO | null>(null);
    
    const allCategories = useMemo(() => Array.from(new Set(ngos.map(n => n.category))), []);

    const filteredNgos = useMemo(() => {
        let filtered = [...ngos];

        if (locationFilter === 'city') {
            filtered = filtered.filter(ngo => ngo.contact.address?.city === user.personalInfo.address.city);
        } else if (locationFilter === 'country') {
             // Assuming all are in TR for now
        }
        
        if (typeFilter !== 'Tümü') {
            filtered = filtered.filter(ngo => ngo.type === typeFilter);
        }

        if (searchTerm) {
            const lowercased = searchTerm.toLowerCase();
            filtered = filtered.filter(ngo => 
                ngo.name.toLowerCase().includes(lowercased) || 
                ngo.category.toLowerCase().includes(lowercased)
            );
        }

        if (categoryFilter.length > 0) {
            filtered = filtered.filter(ngo => categoryFilter.includes(ngo.category));
        }

        filtered.sort((a, b) => {
            let valA: string | number, valB: string | number;
            switch(sortConfig.key) {
                case 'followers': valA = a.stats.followers; valB = b.stats.followers; break;
                case 'volunteers': valA = a.stats.volunteers; valB = b.stats.volunteers; break;
                case 'transparencyScore': valA = a.transparencyScore; valB = b.transparencyScore; break;
                default: // name
                    return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            if(typeof valA === 'number' && typeof valB === 'number') {
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            }
            return 0;
        });

        return filtered;
    }, [typeFilter, locationFilter, searchTerm, sortConfig, categoryFilter]);

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
        <div className="space-y-1">
            <h1 className="text-2xl font-bold font-headline">Sivil Toplum Kuruluşları</h1>
            <p className="text-muted-foreground text-sm">Destekleyebileceğin STK'ları keşfet.</p>
        </div>
        <div className="p-0 flex gap-2 items-center">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="STK ara..."
                    className="pl-10 h-11"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11">
                        <Filter className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                     <DropdownMenuLabel>Kategoriye Göre Filtrele</DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     {allCategories.map(category => (
                        <DropdownMenuCheckboxItem
                            key={category}
                            checked={categoryFilter.includes(category)}
                            onCheckedChange={(checked) => {
                                const newFilter = checked ? [...categoryFilter, category] : categoryFilter.filter(c => c !== category);
                                setCategoryFilter(newFilter);
                            }}
                        >
                            {category}
                        </DropdownMenuCheckboxItem>
                     ))}
                </DropdownMenuContent>
            </DropdownMenu>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11">
                        <ArrowDownUp className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>İsme Göre (A-Z)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>İsme Göre (Z-A)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'followers', direction: 'desc' })}>Takipçi Sayısı</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'volunteers', direction: 'desc' })}>Gönüllü Sayısı</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortConfig({ key: 'transparencyScore', direction: 'desc' })}>Şeffaflık Puanı</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
      </div>

       <Tabs defaultValue="country" className="w-full" onValueChange={(value) => setLocationFilter(value as LocationFilter)}>
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="country">Ülkemde</TabsTrigger>
            <TabsTrigger value="city">Şehrimde</TabsTrigger>
        </TabsList>
       </Tabs>

       <Tabs defaultValue="Tümü" className="w-full" onValueChange={(value) => setTypeFilter(value as NgoType)}>
        <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="Tümü">Tümü</TabsTrigger>
            <TabsTrigger value="Dernek">Dernek</TabsTrigger>
            <TabsTrigger value="Vakıf">Vakıf</TabsTrigger>
            <TabsTrigger value="Spor Kulübü">Spor Kulübü</TabsTrigger>
            <TabsTrigger value="Özel İzinli">Özel İzinli</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filteredNgos.length > 0 ? filteredNgos.map((ngo) => (
            <Card key={ngo.id} className="transition-colors hover:bg-accent/50 relative group">
                 <div className="absolute top-2 right-2 z-10">
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 bg-background/50 hover:bg-background rounded-full" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setViewingNgo(ngo); }}>
                        <Info className="h-4 w-4"/>
                    </Button>
                </div>
                <Link href={`/ngos/${ngo.id}`} className="block p-3">
                    <div className="flex gap-3 items-center">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                            <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-sm truncate">{ngo.name}</p>
                            <p className="text-xs text-muted-foreground">{ngo.category}</p>
                        </div>
                    </div>
                    <div className="mt-2 pl-1 sm:pl-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1 flex-shrink-0"><ShieldCheck className="h-3 w-3" /> {ngo.transparencyScore}</span>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="flex items-center gap-1 flex-shrink-0"><Heart className="h-3 w-3" /> {ngo.stats.followers / 1000}k</span>
                            <span className="flex items-center gap-1 flex-shrink-0"><Users className="h-3 w-3" /> {ngo.stats.volunteers / 1000}k</span>
                            {ngo.memberOf && ngo.memberOf.map(membership => (
                                <React.Fragment key={membership}>
                                    <Separator orientation="vertical" className="h-3" />
                                    <Badge variant="secondary" className="text-[9px] font-normal">{membership}</Badge>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </Link>
            </Card>
        )) : (
             <div className="text-center text-muted-foreground py-16">
                <p>Bu filtrelerle eşleşen STK bulunamadı.</p>
            </div>
        )}
      </div>

       <Dialog open={!!viewingNgo} onOpenChange={(isOpen) => !isOpen && setViewingNgo(null)}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto p-0 border-0 rounded-2xl">
          <div className="absolute top-4 right-4 z-20">
            <Button variant="ghost" size="icon" className="rounded-full bg-black/30 hover:bg-black/50 text-white" onClick={() => setViewingNgo(null)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {viewingNgo && <NgoDetailView ngo={viewingNgo} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
