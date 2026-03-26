
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Search, Filter, ArrowDownUp, Heart, Users, ShieldCheck, X, Info, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ngos, user, timelinePosts, volunteeringOpportunities } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { NGO } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { ShareButtons } from '@/components/shared/share-buttons';


type NgoType = NGO['type'] | 'Tümü';
type LocationFilter = 'global' | 'country' | 'city';

// This is the component for the popup profile view
const NgoDetailView = ({ ngo }: { ngo: NGO; }) => {
    const [profileUrl, setProfileUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
          setProfileUrl(window.location.href);
        }
    }, []);
    
    if (!ngo) {
        return null;
    }

    return (
        <div className="animate-in fade-in-0">
            <div className="relative h-48 w-full bg-muted">
                {ngo.coverPhotoUrl && <Image src={ngo.coverPhotoUrl} alt={`${ngo.name} Cover`} fill className="object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
                 <div className="absolute top-4 right-4 z-10">
                    <ShareButtons url={profileUrl} title={`hangel'deki ${ngo.name} profilini incele!`} />
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
                    <TabsTrigger value="transparency">Şeffaflık</TabsTrigger>
                    <TabsTrigger value="stats">Veriler</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Kuruluş Hakkında</CardTitle></CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-4">
                           <p>{ngo.about}</p>
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


export default function NgoSelectionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedNgos, setSelectedNgos] = useState(['1', '2']); 
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<NgoType>('Tümü');
    const [locationFilter, setLocationFilter] = useState<LocationFilter>('country');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [viewingNgo, setViewingNgo] = useState<NGO | null>(null);
    const [isOnboarding, setIsOnboarding] = useState(false);

    useEffect(() => {
        const onboardingStep = localStorage.getItem('onboardingStep');
        if (onboardingStep === 'ngo-selection') {
            setIsOnboarding(true);
        }
    }, []);

    const allCategories = useMemo(() => Array.from(new Set(ngos.map(n => n.category))), []);

    const filteredNgos = useMemo(() => {
        let filtered = [...ngos];

        if (locationFilter === 'city') {
            filtered = filtered.filter(ngo => ngo.contact.address?.city === user.personalInfo.address.city);
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
                default:
                    return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            if(typeof valA === 'number' && typeof valB === 'number') {
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            }
            return 0;
        });

        return filtered;
    }, [typeFilter, locationFilter, searchTerm, sortConfig, categoryFilter]);

    const handleNgoSelect = (ngoId: string) => {
        const isCurrentlySelected = selectedNgos.includes(ngoId);
        setSelectedNgos(prev =>
            isCurrentlySelected
                ? prev.filter(id => id !== ngoId)
                : [...prev, ngoId]
        );
    };

    const handleSave = () => {
        toast({
            title: "Tercihler Kaydedildi",
            description: "Varsayılan STK seçimleriniz başarıyla güncellendi.",
        });
        if (isOnboarding) {
            localStorage.setItem('onboardingStep', 'volunteer-ngo-selection');
            router.push('/settings/volunteer-ngo-selection');
        } else {
            router.push('/settings/profile');
        }
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Bağışçı Olduğun STK'ları Değiştir</h1>
                <p className="text-muted-foreground text-sm">Alışverişlerinizden doğan bağışların aktarılacağı varsayılan STK'ları seçin.</p>
            </div>

             <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Önemli Bilgi</AlertTitle>
                <AlertDescription>
                   Varsayılan STK seçiminizi 30 gün boyunca yalnızca bir kez değiştirebilirsiniz.
                </AlertDescription>
            </Alert>
            
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


            <Card>
                <CardHeader className="p-4">
                    <p className="text-sm font-medium">{selectedNgos.length} / 2 STK Seçildi</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {filteredNgos.length > 0 ? filteredNgos.map((ngo) => (
                            <div
                                key={ngo.id}
                                className="flex items-center justify-between p-3 hover:bg-accent"
                            >
                                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setViewingNgo(ngo)}>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                                        <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{ngo.name}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">{ngo.category} <span className="text-muted-foreground/50">|</span> <ShieldCheck className="h-3 w-3 text-primary/80"/> {ngo.transparencyScore}</p>
                                    </div>
                                </div>
                                <div className="p-2" onClick={() => handleNgoSelect(ngo.id)}>
                                     <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer", selectedNgos.includes(ngo.id) ? 'bg-primary border-primary' : 'bg-transparent border-muted-foreground')}>
                                       {selectedNgos.includes(ngo.id) && <CheckCircle className="h-4 w-4 text-white" />}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground p-8">Bu filtrelerle eşleşen STK bulunamadı.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>{isOnboarding ? "Devam Et" : "Değişiklikleri Kaydet"}</Button>
            </div>

            <Dialog open={!!viewingNgo} onOpenChange={(isOpen) => !isOpen && setViewingNgo(null)}>
                <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto p-0 border-0 rounded-2xl">
                    {viewingNgo && (
                        <DialogHeader className="sr-only">
                            <DialogTitle>{viewingNgo.name}</DialogTitle>
                        </DialogHeader>
                    )}
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
