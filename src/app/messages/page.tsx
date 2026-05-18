'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Inbox, SendHorizontal, MessageSquare, Building, School, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

const senderTypeIcons: Record<string, React.ReactNode> = {
    ngo: <Building className="h-3 w-3" />,
    club: <School className="h-3 w-3" />,
    admin: <Shield className="h-3 w-3" />,
    user: <Inbox className="h-3 w-3" />
};

export default function MessagesPage() {
    const [_activeTab, setActiveTab] = useState('inbox');
    const { toast } = useToast();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const { user: authUser } = useUser();
    const db = useFirestore();

    const messagesQuery = useMemoFirebase(
        () => authUser ? query(collection(db, 'messages'), where('recipientId', '==', authUser.uid)) : null,
        [db, authUser?.uid]
    );
    const { data: messages, isLoading } = useCollection(messagesQuery);

    interface MessageItem {
        id?: string;
        sender?: string;
        subject?: string;
        excerpt?: string;
        time?: string;
        senderType?: string;
        unread?: boolean;
    }
    const filteredMessages = ((messages || []) as MessageItem[]).filter((m) =>
        m.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in-0 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold font-headline">Mesajlarım</h1>
                </div>
                <Button size="sm" onClick={() => toast({ title: "Yeni Mesaj", description: "Bu özellik kurum profillerinden başlatılmaktadır." })}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Yeni Mesaj
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Mesajlarda ara..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Tabs defaultValue="inbox" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="inbox">
                        <Inbox className="mr-2 h-4 w-4" /> Gelen Kutusu
                    </TabsTrigger>
                    <TabsTrigger value="sent">
                        <SendHorizontal className="mr-2 h-4 w-4" /> Gönderilenler
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inbox" className="mt-4 space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : !authUser ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Inbox className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Mesajlarınızı görmek için giriş yapın.</p>
                        </div>
                    ) : filteredMessages.length > 0 ? filteredMessages.map((msg) => (
                        <Card key={msg.id} className={cn(
                            "cursor-pointer hover:bg-accent/50 transition-colors",
                            msg.unread && "border-l-4 border-l-primary"
                        )}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarFallback>{(msg.sender || '?')[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm truncate">{msg.sender}</span>
                                            {msg.senderType && (
                                                <div className="p-1 bg-muted rounded-full text-muted-foreground">
                                                    {senderTypeIcons[msg.senderType] || null}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground truncate">{msg.subject}</p>
                                    <p className="text-xs text-muted-foreground truncate">{msg.excerpt}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="text-center py-20 text-muted-foreground">
                            <Inbox className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Mesaj bulunamadı.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="sent" className="mt-4 text-center py-20 text-muted-foreground">
                    <SendHorizontal className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Gönderdiğiniz bir mesaj bulunmuyor.</p>
                </TabsContent>
            </Tabs>
        </div>
    );
}
