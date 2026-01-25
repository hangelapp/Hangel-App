'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const pushHistory = [
    { id: 2, type: 'Bildirim', title: 'Yeni Gönüllülük Fırsatı!', date: '2024-07-18', status: 'Gönderildi', seen: '8,120', clicks: '1,250' },
];

const newsletterHistory = [
    { id: 1, type: 'Bülten', title: 'Haftanın Gelişmeleri', date: '2024-07-20', status: 'Gönderildi', seen: '12,543', clicks: '2,130' },
];

const MAX_PUSH_TITLE = 65;
const MAX_PUSH_CONTENT = 178;
const MAX_NEWSLETTER_SUBJECT = 150;
const MAX_NEWSLETTER_CONTENT = 5000;

export default function CommunicationsPage() {
    const [pushTitle, setPushTitle] = useState('');
    const [pushContent, setPushContent] = useState('');
    const [newsletterSubject, setNewsletterSubject] = useState('');
    const [newsletterContent, setNewsletterContent] = useState('');
    const [pushDate, setPushDate] = useState<Date | undefined>();
    const [newsletterDate, setNewsletterDate] = useState<Date | undefined>();

    return (
        <div className="space-y-6">
            <h1 className="text-lg font-semibold md:text-2xl">Bildirim ve Bülten Yönetimi</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Anlık Bildirim</CardTitle>
                        <CardDescription>
                            Mobil ve web kullanıcılarına anlık bildirim (push notification) gönderin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="send">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="send">Gönder</TabsTrigger>
                                <TabsTrigger value="history">Geçmiş</TabsTrigger>
                            </TabsList>
                            <TabsContent value="send" className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="push-audience">Hedef Kitle</Label>
                                    <Select>
                                        <SelectTrigger id="push-audience">
                                            <SelectValue placeholder="Bir kitle seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                                            <SelectItem value="volunteers">Sadece Gönüllüler</SelectItem>
                                            <SelectItem value="donors">Sadece Bağışçılar</SelectItem>
                                            <SelectItem value="ngos">STK Yöneticileri</SelectItem>
                                            <SelectItem value="brands">Marka Yöneticileri</SelectItem>
                                            <SelectItem value="clubs">Kulüp Yöneticileri</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="push-title">Bildirim Başlığı</Label>
                                    <Input 
                                        id="push-title" 
                                        placeholder="Yeni bir gönüllülük fırsatı!" 
                                        maxLength={MAX_PUSH_TITLE}
                                        value={pushTitle}
                                        onChange={(e) => setPushTitle(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground text-right">{pushTitle.length} / {MAX_PUSH_TITLE}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="push-content">Bildirim İçeriği</Label>
                                    <Textarea 
                                        id="push-content" 
                                        placeholder="Çevre konusunda fark yaratmak ister misin?" 
                                        rows={3}
                                        maxLength={MAX_PUSH_CONTENT}
                                        value={pushContent}
                                        onChange={(e) => setPushContent(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground text-right">{pushContent.length} / {MAX_PUSH_CONTENT}</p>
                                </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Gönderim Tarihi</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !pushDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {pushDate ? format(pushDate, "PPP") : <span>Tarih seçin</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={pushDate}
                                                    onSelect={setPushDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="push-time">Gönderim Saati</Label>
                                        <Input id="push-time" type="time" defaultValue="09:00" />
                                    </div>
                                </div>
                                <Button className="w-full">Bildirimi Zamanla</Button>
                            </TabsContent>
                            <TabsContent value="history" className="mt-4 space-y-3">
                                {pushHistory.map(item => (
                                   <div key={item.id} className="p-3 border rounded-lg">
                                       <p className="font-semibold">{item.title}</p>
                                       <p className="text-sm text-muted-foreground">Gönderim Tarihi: {item.date}</p>
                                       <div className="grid grid-cols-2 gap-2 mt-2 text-center">
                                            <div>
                                                <p className="font-bold">{item.seen}</p>
                                                <p className="text-xs text-muted-foreground">Görüntülenme</p>
                                            </div>
                                             <div>
                                                <p className="font-bold">{item.clicks}</p>
                                                <p className="text-xs text-muted-foreground">Tıklanma</p>
                                            </div>
                                       </div>
                                   </div>
                               ))}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>E-posta Bülteni</CardTitle>
                        <CardDescription>
                            Haftalık veya aylık bültenleri oluşturup tüm üyelere gönderin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="send">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="send">Gönder</TabsTrigger>
                                <TabsTrigger value="history">Geçmiş</TabsTrigger>
                            </TabsList>
                            <TabsContent value="send" className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newsletter-audience">Hedef Kitle</Label>
                                    <Select>
                                        <SelectTrigger id="newsletter-audience">
                                            <SelectValue placeholder="Bir kitle seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                                            <SelectItem value="active">Aktif Kullanıcılar (Son 30 Gün)</SelectItem>
                                            <SelectItem value="inactive">Pasif Kullanıcılar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Konu</Label>
                                    <Input 
                                        id="subject" 
                                        placeholder="Haftanın Gelişmeleri" 
                                        maxLength={MAX_NEWSLETTER_SUBJECT}
                                        value={newsletterSubject}
                                        onChange={(e) => setNewsletterSubject(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground text-right">{newsletterSubject.length} / {MAX_NEWSLETTER_SUBJECT}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="content">İçerik</Label>
                                    <Textarea 
                                        id="content" 
                                        placeholder="Bülten içeriğini buraya HTML olarak yazın..." 
                                        rows={10}
                                        maxLength={MAX_NEWSLETTER_CONTENT}
                                        value={newsletterContent}
                                        onChange={(e) => setNewsletterContent(e.target.value)}
                                    />
                                     <p className="text-xs text-muted-foreground text-right">{newsletterContent.length} / {MAX_NEWSLETTER_CONTENT}</p>
                                </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Gönderim Tarihi</Label>
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !newsletterDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {newsletterDate ? format(newsletterDate, "PPP") : <span>Tarih seçin</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={newsletterDate}
                                                    onSelect={setNewsletterDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newsletter-time">Gönderim Saati</Label>
                                        <Input id="newsletter-time" type="time" defaultValue="10:00" />
                                    </div>
                                </div>
                                <Button className="w-full">Bülteni Zamanla</Button>
                            </TabsContent>
                             <TabsContent value="history" className="mt-4 space-y-3">
                                {newsletterHistory.map(item => (
                                   <div key={item.id} className="p-3 border rounded-lg">
                                       <p className="font-semibold">{item.title}</p>
                                       <p className="text-sm text-muted-foreground">Gönderim Tarihi: {item.date}</p>
                                        <div className="grid grid-cols-2 gap-2 mt-2 text-center">
                                            <div>
                                                <p className="font-bold">{item.seen}</p>
                                                <p className="text-xs text-muted-foreground">Görüntülenme</p>
                                            </div>
                                             <div>
                                                <p className="font-bold">{item.clicks}</p>
                                                <p className="text-xs text-muted-foreground">Tıklanma</p>
                                            </div>
                                       </div>
                                   </div>
                               ))}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
