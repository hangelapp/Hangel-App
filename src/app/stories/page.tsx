'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, User, Users, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const StoryCategoryCard = ({ icon: Icon, title, description, href, color }: { icon: any, title: string, description: string, href: string, color: string }) => (
    <Link href={href} className="block group">
        <Card className={cn("rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border-none text-white", color)}>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-80 space-y-4">
                <div className="p-4 bg-white/20 rounded-full">
                    <Icon className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold">{title}</h3>
                <p className="text-sm opacity-80">{description}</p>
            </CardContent>
        </Card>
    </Link>
);


export default function StoriesPage() {
    const router = useRouter();

    return (
        <div className="p-4 space-y-6">
             <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="text-left">
                <h1 className="text-3xl font-bold font-headline">Hikayeler</h1>
                <p className="text-muted-foreground">Etkinin farklı yönlerini keşfet.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StoryCategoryCard 
                    title="Hangel'in Etki Hikayesi"
                    description="Platformun genel başarıları ve toplumsal etki raporu."
                    icon={TrendingUp}
                    href="/ngo-admin/impact-story?category=hangel"
                    color="bg-gradient-to-br from-indigo-500 to-purple-600"
                />
                 <StoryCategoryCard 
                    title="Senin Hikayen"
                    description="Kişisel sosyal etki yolculuğun ve başarıların."
                    icon={User}
                    href="/ngo-admin/impact-story?category=user"
                    color="bg-gradient-to-br from-primary to-orange-500"
                />
                 <StoryCategoryCard 
                    title="Topluluktan Hikayeler"
                    description="Gönüllülerin, STK'ların ve markaların ilham veren anları."
                    icon={Users}
                    href="/ngo-admin/impact-story?category=community"
                    color="bg-gradient-to-br from-teal-500 to-green-600"
                />
                <StoryCategoryCard
                    title="Sosyal Medya İlanları"
                    description="Markaların ve STK'ların öne çıkan kampanyalarını ve ilanlarını keşfedin."
                    icon={Megaphone}
                    href="/ngo-admin/impact-story?category=ads"
                    color="bg-gradient-to-br from-blue-500 to-cyan-600"
                />
            </div>
        </div>
    );
}
