'use client';
import { ngos, timelinePosts, volunteeringOpportunities } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, Globe, ShieldCheck, HeartHandshake, Newspaper, BarChart3 } from 'lucide-react';
import Image from 'next/image';

export default function WebsitePreviewPage() {
    const ngo = ngos.find(n => n.id === '2'); // Ahbap Derneği

    if (!ngo) {
        return <div>Kuruluş bulunamadı.</div>;
    }

    const ngoPosts = timelinePosts.filter(p => p.author.name === ngo.name);
    const ngoOpportunities = volunteeringOpportunities.filter(o => o.ngoId === ngo.id);

    return (
        <div className="bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-md">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={ngo.avatarUrl} />
                            <AvatarFallback>{ngo.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <h1 className="text-2xl font-bold text-foreground">{ngo.name}</h1>
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
                        <a href="#hakkimizda" className="hover:text-primary">Hakkımızda</a>
                        <a href="#gonulluluk" className="hover:text-primary">Gönüllülük</a>
                        <a href="#gonderiler" className="hover:text-primary">Gönderiler</a>
                        <a href="#seffaflik" className="hover:text-primary">Şeffaflık</a>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-12">
                <section id="hakkimizda" className="scroll-mt-20">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Globe className="h-6 w-6 text-primary"/> Hakkımızda</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">{ngo.about}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span>{ngo.contact.email}</span></div>
                                <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><span>{ngo.contact.phone}</span></div>
                                <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-muted-foreground" /><span>{ngo.contact.website}</span></div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section id="gonulluluk" className="scroll-mt-20">
                    <h2 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2"><HeartHandshake className="h-8 w-8 text-primary"/> Gönüllülük Fırsatları</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ngoOpportunities.map(opp => (
                            <Card key={opp.id}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{opp.title}</CardTitle>
                                    <CardDescription>{opp.location.city} - {opp.commitment}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3">{opp.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="secondary" className="w-full">Detayları Gör</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>

                 <section id="gonderiler" className="scroll-mt-20">
                    <h2 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2"><Newspaper className="h-8 w-8 text-primary"/> Son Gönderiler</h2>
                    <div className="space-y-6 max-w-2xl mx-auto">
                        {ngoPosts.slice(0, 2).map(post => (
                            <Card key={post.id}>
                                <CardHeader className="flex flex-row items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={post.author.avatarUrl} />
                                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{post.author.name}</p>
                                        <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p>{post.content}</p>
                                    {post.imageUrl && <div className="mt-4 relative aspect-video rounded-lg overflow-hidden"><Image src={post.imageUrl} alt="Post image" fill className="object-cover"/></div>}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <section id="seffaflik" className="scroll-mt-20">
                    <h2 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2"><ShieldCheck className="h-8 w-8 text-primary"/> Şeffaflık</h2>
                     <Card className="max-w-md mx-auto">
                        <CardHeader>
                            <CardTitle>Şeffaflık Puanı</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-6xl font-bold text-primary">{ngo.transparencyScore}</p>
                            <p className="text-muted-foreground">/ 100</p>
                        </CardContent>
                    </Card>
                </section>
            </main>

             <footer className="bg-gray-800 text-white mt-12 py-6">
                <div className="container mx-auto text-center">
                    <p>&copy; {new Date().getFullYear()} {ngo.name}. Tüm hakları saklıdır.</p>
                    <p className="text-xs text-gray-400 mt-2">Hangel tarafından güçlendirilmiştir.</p>
                </div>
            </footer>
        </div>
    );
}