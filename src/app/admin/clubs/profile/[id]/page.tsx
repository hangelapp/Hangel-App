'use client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BrainCircuit, Calendar, ChevronRight, Contact, Edit, Globe, Handshake, Mail, MapPin, Mic, Milestone, Phone, QrCode, School, Share2, Users, Vision, Users2, Twitter, Instagram, Facebook, Linkedin } from 'lucide-react';
import { studentClubs, schoolRepresentatives } from '@/lib/data';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ShareButtons } from '@/components/shared/share-buttons';

const RepresentativeCard = ({ name, role, avatarUrl }: { name: string, role: string, avatarUrl: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
        <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
    </div>
);


export default function ClubProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const club = studentClubs.find(c => c.id === id);

  if (!club) {
    notFound();
  }
  
  const president = schoolRepresentatives[0];
  const boardMembers = schoolRepresentatives.slice(1, 5).map(rep => ({
      ...rep,
      role: ['Başkan Yardımcısı', 'Genel Sekreter', 'Sayman', 'Proje Koordinatörü'][schoolRepresentatives.indexOf(rep) - 1]
  }));

  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="animate-in fade-in-0">
      <div className="relative h-40 w-full bg-muted">
        <Image src={club.coverPhotoUrl} alt={`${club.name} Cover`} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-4 left-4 text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full">
            <ArrowLeft className="h-5 w-5" />
        </Button>
         <div className="absolute top-4 right-4 flex gap-2">
           <ShareButtons url={profileUrl} title={`Hangel'deki ${club.name} kulüp profilini incele!`} />
        </div>
      </div>
      <div className="p-4 bg-background">
        <div className="flex gap-4 items-end -mt-16">
            <Avatar className="h-24 w-24 border-4 border-background shrink-0">
                <AvatarImage src={club.avatarUrl} alt={club.name} />
                <AvatarFallback>{club.name.slice(0,2)}</AvatarFallback>
            </Avatar>
             <div className="flex-1 pb-2 flex justify-between items-end">
                <div>
                     <h1 className="text-2xl font-bold font-headline">{club.name}</h1>
                     <p className="text-muted-foreground text-sm">{club.university}</p>
                </div>
            </div>
        </div>
         <div className="flex gap-2 mt-4">
            <Button className="flex-1">Kulübe Katıl</Button>
            <Button variant="outline" className="flex-1">Mesaj Gönder</Button>
        </div>
      </div>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-4 px-2">
            <TabsTrigger value="about">Hakkında</TabsTrigger>
            <TabsTrigger value="stats">İstatistikler</TabsTrigger>
            <TabsTrigger value="posts">Gönderiler</TabsTrigger>
            <TabsTrigger value="management">Yönetim</TabsTrigger>
        </TabsList>
        <TabsContent value="about" className="p-4 space-y-4">
            <Card>
                <CardHeader><CardTitle className="text-lg">Hakkında</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-4">
                    <p>
                        {club.description} Kulübümüz, üniversite öğrencileri arasında girişimcilik ruhunu teşvik etmek, yenilikçi fikirleri desteklemek ve geleceğin liderlerini yetiştirmek amacıyla kurulmuştur. Düzenlediğimiz atölyeler, zirveler ve yarışmalarla üyelerimize ilham veriyor ve onları iş dünyasına hazırlıyoruz.
                    </p>
                    <p>
                        Topluluğumuz, farklı disiplinlerden gelen öğrencileri bir araya getirerek multidisipliner bir çalışma ortamı sunar. Sosyal sorumluluk bilinciyle hareket ederek, girişimcilik projelerinin topluma fayda sağlamasını önemsiyoruz. Hangel platformu aracılığıyla sosyal etkimizi daha da artırmayı hedefliyoruz.
                    </p>
                    <p className="text-xs pt-2 border-t">hangel'a Katılım Tarihi: {club.joinDate}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-lg">Vizyonumuz</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <p>{club.vision}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-lg">İletişim</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{club.contact.email}</span></div>
                    <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{club.contact.phone}</span></div>
                    <div className="flex items-center gap-3 text-sm"><Globe className="h-4 w-4 text-muted-foreground" /><span>{club.contact.website}</span></div>
                    <Separator className="my-4" />
                    <div className="flex gap-4">
                        <a href="#" target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>
                        <a href="#" target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>
                        <a href="#" target="_blank" rel="noopener noreferrer"><Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>
                        <a href="#" target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="stats" className="p-4 space-y-4">
             <Card>
                <CardHeader><CardTitle className="text-lg">Kulüp İstatistikleri</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-accent/50 rounded-lg"><p className="font-bold text-lg">{club.members}</p><p className="text-sm text-muted-foreground">Toplam Üye</p></div>
                    <div className="p-4 bg-accent/50 rounded-lg"><p className="font-bold text-lg">{club.projects || 12}</p><p className="text-sm text-muted-foreground">Tamamlanan Projeler</p></div>
                    <div className="p-4 bg-accent/50 rounded-lg"><p className="font-bold text-lg">{club.volunteerHours || 150} Saat</p><p className="text-sm text-muted-foreground">Gönüllülük Saati</p></div>
                    <div className="p-4 bg-accent/50 rounded-lg"><p className="font-bold text-lg">%{club.activeMemberRate || 75}</p><p className="text-sm text-muted-foreground">Aktif Üye Oranı</p></div>
                </CardContent>
             </Card>
        </TabsContent>
        <TabsContent value="posts" className="p-4">
            <div className="text-center text-muted-foreground py-16">
                <p>Bu kulüp henüz bir gönderi paylaşmadı.</p>
            </div>
        </TabsContent>
        <TabsContent value="management" className="p-4 space-y-4">
             <Card>
                <CardHeader><CardTitle className="text-lg">Kulüp Başkanı</CardTitle></CardHeader>
                <CardContent>
                    <RepresentativeCard name={president.name} role="Kulüp Başkanı" avatarUrl={president.avatarUrl} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-lg">Yönetim Kurulu</CardTitle></CardHeader>
                <CardContent className="divide-y">
                    {boardMembers.map(member => (
                        <RepresentativeCard key={member.id} name={member.name} role={member.role} avatarUrl={member.avatarUrl} />
                    ))}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
