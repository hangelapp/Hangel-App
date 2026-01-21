'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ngos } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

export default function NgoSelectionPage() {
    const router = useRouter();
    const [selectedNgo, setSelectedNgo] = useState('2'); // Default to Ahbap
    const [searchTerm, setSearchTerm] = useState('');

    const filteredNgos = ngos.filter(ngo => 
        ngo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Varsayılan STK Ayarları</h1>
                <p className="text-muted-foreground text-sm">Alışverişlerinizden doğan bağışların aktarılacağı varsayılan sivil toplum kuruluşunu seçin.</p>
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
                        {filteredNgos.map((ngo) => (
                            <div
                                key={ngo.id}
                                className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer"
                                onClick={() => setSelectedNgo(ngo.id)}
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
                                {selectedNgo === ngo.id && <CheckCircle className="h-6 w-6 text-primary" />}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button>Değişiklikleri Kaydet</Button>
            </div>
        </div>
    );
}
