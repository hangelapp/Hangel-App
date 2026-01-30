
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Sparkles, Target, Users, ShieldAlert } from 'lucide-react';

export default function NewMessagePage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        setTimeout(() => {
            toast({
                title: "Mesaj Gönderildi",
                description: "Mesajınız alıcılara başarıyla ulaştırıldı.",
            });
            setIsLoading(false);
            router.push('/ngo-admin/notifications');
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold font-headline">Yeni İletişim Oluştur</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Mesaj İçeriği</CardTitle>
                            <CardDescription>Topluluğunuza veya yöneticilere iletmek istediğiniz mesajı buraya yazın.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form id="message-form" onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="recipient">Hedef Kitle / Alıcı</Label>
                                    <Select required>
                                        <SelectTrigger id="recipient">
                                            <SelectValue placeholder="Alıcı grubunu seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Hangel Sistem Yöneticisi</SelectItem>
                                            <SelectItem value="volunteers">Aktif Gönüllülerim</SelectItem>
                                            <SelectItem value="donors">Düzenli Bağışçılarım</SelectItem>
                                            <SelectItem value="followers">Tüm Takipçilerim</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Konu Başlığı</Label>
                                    <Input id="subject" placeholder="Örn: Hafta Sonu Etkinliği Hakkında Önemli Bilgilendirme" required />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="message">Mesajınız</Label>
                                        <Button type="button" variant="ghost" size="sm" className="h-7 text-primary text-xs flex items-center gap-1" onClick={() => toast({title: "Yapay zeka asistanı yakında burada olacak!"})}>
                                            <Sparkles className="h-3 w-3" /> AI ile Taslağı Hazırla
                                        </Button>
                                    </div>
                                    <Textarea 
                                        id="message" 
                                        placeholder="Gönüllüleriniz veya bağışçılarınız için mesajınızı buraya detaylıca yazın..." 
                                        rows={10} 
                                        required 
                                    />
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 border-t pt-6 bg-muted/10">
                            <Button type="button" variant="outline" onClick={() => router.back()}>İptal</Button>
                            <Button type="submit" form="message-form" disabled={isLoading} className="px-8">
                                {isLoading ? (
                                    "Gönderiliyor..."
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Hemen Gönder
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" /> İletişim İpuçları
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-4 text-muted-foreground leading-relaxed">
                            <p><strong>Net ve Öz Olun:</strong> Bağışçılarınızın ve gönüllülerinizin vaktinin değerli olduğunu unutmayın.</p>
                            <p><strong>Eylem Çağrısı:</strong> Mesajınızın sonunda mutlaka okuyucunun ne yapması gerektiğini (Örn: "Formu doldurun", "Bağış yapın") belirtin.</p>
                            <p><strong>Etkinizi Gösterin:</strong> Bağışların veya gönüllü desteğinin nereye gittiğini örneklerle paylaşın.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" /> Mevcut Erişim
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Aktif Gönüllüler:</span>
                                <span className="font-bold">150 Kişi</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Düzenli Bağışçılar:</span>
                                <span className="font-bold">420 Kişi</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Takipçiler:</span>
                                <span className="font-bold">12.4k Kişi</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-800 leading-tight">
                            Gönderilen mesajlar Hangel etik kuralları çerçevesinde denetlenmektedir. Yanıltıcı veya ticari amaçlı toplu bildirimler hesabınızın askıya alınmasına neden olabilir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
