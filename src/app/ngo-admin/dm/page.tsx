'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, Send, Phone, Video, Info, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const contacts = [
    { id: '1', name: 'Ayşe Yılmaz', lastMsg: 'Gönüllülük başvurum hakkında...', time: '14:20', unread: true, avatar: 'https://i.pravatar.cc/150?u=ayse' },
    { id: '2', name: 'Mehmet Kaya', lastMsg: 'Sertifikamı nereden indirebilirim?', time: 'Dün', unread: false, avatar: 'https://i.pravatar.cc/150?u=mehmet' },
    { id: '3', name: 'Zeynep Arslan', lastMsg: 'Teşekkürler!', time: '2 gün önce', unread: false, avatar: 'https://i.pravatar.cc/150?u=zeynep' },
];

export default function DmManagementPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [selectedId, setSelectedId] = useState('1');
    const [msg, setMsg] = useState('');

    const selectedContact = contacts.find(c => c.id === selectedId);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!msg.trim()) return;
        toast({ title: "Mesaj Gönderildi", description: "Yanıtınız iletildi." });
        setMsg('');
    };

    return (
        <div className="h-[calc(100vh-140px)] flex gap-4 animate-in fade-in-0">
            {/* Sidebar */}
            <div className="w-80 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold">DM Kutusu</h1>
                </div>
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="p-3 border-b">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Kişilerde ara..." className="pl-8 h-9" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-y-auto">
                        {contacts.map(contact => (
                            <div 
                                key={contact.id} 
                                onClick={() => setSelectedId(contact.id)}
                                className={cn(
                                    "p-4 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors border-b last:border-0",
                                    selectedId === contact.id ? "bg-accent" : ""
                                )}
                            >
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={contact.avatar} />
                                    <AvatarFallback>{contact.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <p className="font-bold text-sm truncate">{contact.name}</p>
                                        <span className="text-[10px] text-muted-foreground">{contact.time}</span>
                                    </div>
                                    <p className={cn("text-xs truncate", contact.unread ? "text-foreground font-semibold" : "text-muted-foreground")}>
                                        {contact.lastMsg}
                                    </p>
                                </div>
                                {contact.unread && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                {selectedContact ? (
                    <>
                        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={selectedContact.avatar} />
                                    <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base">{selectedContact.name}</CardTitle>
                                    <CardDescription className="text-xs flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500" /> Çevrimiçi
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9"><Phone className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9"><Video className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9"><Info className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9"><MoreVertical className="h-4 w-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-6 space-y-4 overflow-y-auto bg-muted/10">
                            <div className="flex justify-start">
                                <div className="max-w-[70%] p-3 rounded-2xl bg-muted text-sm rounded-tl-none">
                                    Merhaba, Hatay'daki yardım dağıtımı etkinliğiniz için başvuru yapmıştım. Durumu hakkında bilgi alabilir miyim?
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <div className="max-w-[70%] p-3 rounded-2xl bg-primary text-primary-foreground text-sm rounded-tr-none shadow-sm">
                                    Merhaba Ayşe Hanım, başvurunuz inceleme aşamasında. En geç yarın akşam tarafınıza dönüş yapılacaktır. İlginiz için teşekkürler!
                                </div>
                            </div>
                            <div className="flex justify-start">
                                <div className="max-w-[70%] p-3 rounded-2xl bg-muted text-sm rounded-tl-none">
                                    Çok teşekkürler, bekliyorum.
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 border-t bg-background">
                            <form onSubmit={handleSend} className="flex w-full gap-2">
                                <Input 
                                    placeholder="Mesajınızı yazın..." 
                                    className="flex-1 rounded-full px-4"
                                    value={msg}
                                    onChange={(e) => setMsg(e.target.value)}
                                />
                                <Button type="submit" size="icon" className="rounded-full h-10 w-10">
                                    <Send className="h-5 w-5" />
                                </Button>
                            </form>
                        </CardFooter>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                        <div className="p-6 bg-muted rounded-full mb-4">
                            <ArrowLeft className="h-12 w-12 opacity-20" />
                        </div>
                        <p className="font-bold text-lg">Bir konuşma seçin</p>
                        <p className="text-sm">Gönüllülerinizden veya bağışçılarınızdan gelen mesajları yanıtlamak için soldaki listeden birini seçin.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
