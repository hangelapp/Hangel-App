'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';

export default function NewMessagePage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Simulating message send
        setTimeout(() => {
            toast({
                title: "Mesaj Gönderildi",
                description: "Mesajınız alıcıya başarıyla ulaştırıldı.",
            });
            setIsLoading(false);
            router.push('/ngo-admin/notifications');
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold font-headline">Yeni Mesaj Yaz</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Mesaj Detayları</CardTitle>
                    <CardDescription>Hangel topluluğuna veya yöneticilere mesaj gönderin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="recipient">Alıcı</Label>
                            <Select required>
                                <SelectTrigger id="recipient">
                                    <SelectValue placeholder="Alıcı seçin..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Hangel Sistem Yöneticisi</SelectItem>
                                    <SelectItem value="support">Teknik Destek Ekibi</SelectItem>
                                    <SelectItem value="volunteers">Aktif Gönüllülerim</SelectItem>
                                    <SelectItem value="donors">Bağışçılarım</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">Konu</Label>
                            <Input id="subject" placeholder="Mesajınızın konusu" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Mesajınız</Label>
                            <Textarea 
                                id="message" 
                                placeholder="Mesajınızı buraya yazın..." 
                                rows={8} 
                                required 
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>İptal</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    "Gönderiliyor..."
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Mesajı Gönder
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
