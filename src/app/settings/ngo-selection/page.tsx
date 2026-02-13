'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Search, ShieldAlert, Filter, ArrowDownUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ngos } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function NgoSelectionPage() {
    const router = useRouter();
    const [selectedNgos, setSelectedNgos] = useState(['1', '2']); 
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const filteredNgos = ngos.filter(ngo => 
        ngo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleNgoSelect = (ngoId: string) => {
        setSelectedNgos(prev => {
            const isSelected = prev.includes(ngoId);
            if (isSelected) {
                return prev.filter(id => id !== ngoId);
            } else {
                if (prev.length < 2) {
                    return [...prev, ngoId];
                } else {
                    toast({
                        variant: 'destructive',
                        title: "Limit Aşıldı",
                        description: "En fazla 2 varsayılan STK seçebilirsiniz.",
                    });
                    return prev;
                }
            }
        });
    };

    const handleSave = () => {
        toast({
            title: "Tercihler Kaydedildi",
            description: "Varsayılan STK seçimleriniz başarıyla güncellendi.",
        });
        router.push('/settings/profile');
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Bağışçısı Olduğun STK'ları Değiştir</h1>
                <p className="text-muted-foreground text-sm">Alışverişlerinizden doğan bağışların aktarılacağı varsayılan STK'ları seçin. En fazla 2 STK seçebilirsiniz.</p>
            </div>

             <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Önemli Bilgi</AlertTitle>
                <AlertDescription>
                   Varsayılan STK seçiminizi 30 gün boyunca yalnızca bir kez değiştirebilirsiniz.
                </AlertDescription>
            </Alert>

            <div className="flex gap-2 items-center">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="STK ara..."
                        className="pl-10 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => toast({ title: 'Filtreleme özelliği yakında gelecek!'})}>
                    <Filter className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => toast({ title: 'Sıralama özelliği yakında gelecek!'})}>
                    <ArrowDownUp className="h-5 w-5" />
                </Button>
            </div>

            <Card>
                <CardHeader className="p-4">
                    <p className="text-sm font-medium">{selectedNgos.length} / 2 STK Seçildi</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {filteredNgos.slice(0, 21).map((ngo) => (
                            <div
                                key={ngo.id}
                                className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer"
                                onClick={() => handleNgoSelect(ngo.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                                        <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{ngo.name}</p>
                                        <p className="text-sm text-muted-foreground">{ngo.category}</p>
                                    </div>
                                </div>
                                {selectedNgos.includes(ngo.id) && <CheckCircle className="h-6 w-6 text-primary" />}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>Değişiklikleri Kaydet</Button>
            </div>
        </div>
    );
}
