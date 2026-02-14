
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Sparkles, Heart, Users, School } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';

interface StoryCardProps {
  category: string;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  href: string;
  bgColor: string;
  textColor: string;
  icon: any;
}

const StoryCard: React.FC<StoryCardProps> = ({ category, title, description, imageUrl, imageHint, href, bgColor, textColor, icon: Icon }) => {
  return (
    <Link href={href} className="block group h-full">
      <Card className={cn("relative w-full h-full overflow-hidden rounded-[2.5rem] border border-black/5 shadow-xl transition-all duration-700 group-hover:scale-[1.02] group-hover:shadow-2xl", bgColor)}>
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700"
          data-ai-hint={imageHint}
        />
        <div className={cn("relative h-full flex flex-col justify-between p-8 text-left", textColor)}>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="font-black text-xs uppercase tracking-[0.2em] opacity-70 mb-1">{category}</p>
                <h3 className="text-3xl font-bold tracking-tight leading-tight">{title}</h3>
                <p className="mt-2 text-base font-medium opacity-80 leading-relaxed">{description}</p>
            </div>
          </div>
          <div className="flex justify-between items-end">
             <span className="text-xs font-bold uppercase tracking-widest opacity-60">Şimdi İzle</span>
             <PlusCircle className="h-10 w-10 transition-transform duration-700 group-hover:rotate-90" />
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default function StoriesPage() {
  const storyCategories = [
    {
      category: "Hangel Etkisi",
      title: "Rakamlarla İyilik",
      description: "Platformun toplumsal etkisini ve başarılarını keşfedin.",
      imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop",
      imageHint: "happy group people",
      href: "/ngo-admin/impact-story?category=hangel",
      bgColor: "bg-black",
      textColor: "text-white",
      icon: Sparkles
    },
    {
      category: "Senin Hikayen",
      title: "Kişisel Başarın",
      description: "Yarattığın pozitif değişimi ve kazandığın rozetleri gör.",
      imageUrl: "https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=1080",
      imageHint: "person portrait",
      href: "/ngo-admin/impact-story?category=user",
      bgColor: "bg-[#0071e3]",
      textColor: "text-white",
      icon: Heart
    },
    {
      category: "İlanlar",
      title: "Yeni Fırsatlar",
      description: "Kampüs elçiliği, marka kampanyaları ve gönüllülük ilanları.",
      imageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop",
      imageHint: "volunteers hands",
      href: "/ngo-admin/impact-story?category=opportunities",
      bgColor: "bg-white",
      textColor: "text-black",
      icon: School
    },
    {
      category: "Topluluk",
      title: "İlham Verenler",
      description: "Gönüllülerin ve STK'ların sahadan hikayeleri.",
      imageUrl: "https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop",
      imageHint: "volunteers working together",
      href: "/ngo-admin/impact-story?category=community",
      bgColor: "bg-[#f34723]",
      textColor: "text-white",
      icon: Users
    },
  ];

  return (
    <div className="p-4 md:p-12 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Etki Hikayeleri</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[0.95]">İyiliğin Yeni <br className="hidden md:block" /> Anlatım Biçimi.</h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl leading-tight">Platformumuzdaki ilham verici anlara ve etki raporlarına tam ekran göz atın.</p>
        </div>

        <Carousel
            opts={{
            align: "start",
            }}
            className="w-full"
        >
            <CarouselContent className="-ml-6">
            {storyCategories.map((story, index) => (
                <CarouselItem key={index} className="pl-6 basis-[85%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <div className="h-[550px] md:h-[600px]">
                    <StoryCard {...story} />
                </div>
                </CarouselItem>
            ))}
            </CarouselContent>
            <div className="hidden md:flex justify-end gap-2 mt-8">
                <CarouselPrevious className="static translate-y-0 h-12 w-12 border-black/5 hover:bg-black/5" />
                <CarouselNext className="static translate-y-0 h-12 w-12 border-black/5 hover:bg-black/5" />
            </div>
        </Carousel>
      </div>
    </div>
  );
}
