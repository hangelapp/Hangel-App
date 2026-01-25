'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ngos } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function VolunteerNgoSelectionPage() {
    const router = useRouter();
    const [selectedNgos, setSelectedNgos] = useState(['1', '2']);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const filteredNgos = ngos.filter(ngo => 
        ngo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectNgo = (ngoId: string) => {
        setSelectedNgos(prev => 
            prev.includes(ngoId) 
                ? prev.filter(id => id !== ngoId) 
                : [...prev, ngoId]
        );
    };
    
    const handleSave = () => {
        toast({
            title: "Tercihler Kaydedildi",
            description: "Gönüllüsü olduğunuz STK seçimleriniz başarıyla güncellendi.",
        });
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Gönüllüsü Olduğun STK'lar</h1>
                <p className="text-muted-foreground text-sm">Gönüllülük fırsatlarını takip etmek istediğiniz kuruluşları seçin.</p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="STK ara..."
                    className="pl-10 h-11"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {filteredNgos.slice(0, 21).map((ngo) => (
                            <div
                                key={ngo.id}
                                className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer"
                                onClick={() => handleSelectNgo(ngo.id)}
                            >
                                <Label htmlFor={`ngo-${ngo.id}`} className="flex items-center gap-4 cursor-pointer">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                                        <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{ngo.name}</p>
                                        <p className="text-sm text-muted-foreground">{ngo.category}</p>
                                    </div>
                                </Label>
                                <Checkbox
                                    id={`ngo-${ngo.id}`}
                                    checked={selectedNgos.includes(ngo.id)}
                                    onCheckedChange={() => handleSelectNgo(ngo.id)}
                                />
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
