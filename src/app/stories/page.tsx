
'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";


interface FeatureCardProps {
  category: string;
  title: string;
  description?: string;
  imageUrl: string;
  imageHint: string;
  theme: 'light' | 'dark';
  className?: string;
  children?: React.ReactNode;
  href: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ category, title, description, imageUrl, imageHint, theme, className, children, href }) => {
  return (
    <Link href={href} className="block h-full">
        <div className={cn(
            "relative aspect-[3/4] w-full rounded-[2rem] p-6 flex flex-col justify-between overflow-hidden group transition-transform hover:scale-[1.02]",
            theme === 'dark' ? 'bg-black text-white' : 'bg-gray-100 text-black',
            className
        )}>
            <div className="absolute inset-0 z-0">
                <Image src={imageUrl} alt={title} fill className="object-cover opacity-80" data-ai-hint={imageHint} />
                <div className={cn("absolute inset-0", theme === 'dark' ? 'bg-gradient-to-t from-black/80 via-black/40 to-transparent' : 'bg-gradient-to-t from-white/70 via-white/30 to-transparent')} />
            </div>

            <div className="relative z-10 space-y-1">
                <p className={cn("font-semibold text-xs uppercase tracking-wider", theme === 'dark' ? 'text-primary' : 'text-primary')}>{category}</p>
                <h3 className="text-2xl font-bold leading-tight">{title}</h3>
                {description && <p className="text-sm opacity-80">{description}</p>}
            </div>

            <div className="relative z-10">
                {children}
            </div>

             <div className="absolute bottom-6 right-6 z-20 h-10 w-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-black group-hover:bg-white transition-colors">
                <Plus />
            </div>
        </div>
    </Link>
  );
};


const storiesData = [
  {
    category: "Genel Bakış",
    title: "Hangel'in Etki Hikayesi",
    description: "Topluluğumuzun bugüne kadar yarattığı kolektif etkiyi keşfedin.",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
    imageHint: "network connections people",
    theme: 'dark' as 'dark',
    href: '/impact-story'
  },
  {
    category: "Kişisel Etkin",
    title: "Senin Hikayen, Senin Başarın",
    description: "Profilinize giderek sosyal etki puanınızı ve kazandığınız rozetleri görün.",
    imageUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop",
    imageHint: "colorful abstract gradient",
    theme: 'light' as 'light',
    href: '/profile',
    children: (
        <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground/70">Etki Puanın</p>
            <p className="text-5xl font-bold tracking-tighter">15,750</p>
        </div>
    )
  },
  {
    category: "Gönüllülük",
    title: "Yeni Fırsatları Keşfet",
    description: "Yetkinliklerinize ve ilgi alanlarınıza uygun en yeni gönüllülük ilanlarına göz atın.",
    imageUrl: "https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop",
    imageHint: "volunteers working together",
    theme: 'dark' as 'dark',
    href: '/volunteering'
  },
  {
    category: "Bağış",
    title: "Alışverişi İyiliğe Dönüştür",
    description: "Yüzlerce markadan yaptığınız alışverişlerle STK'lara destek olun.",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
    imageHint: "modern retail store",
    theme: 'light' as 'light',
    href: '/market'
  }
];


export default function StoriesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <div className="space-y-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Hangel'i Keşfedin.</h1>
            <p className="text-muted-foreground">Platformun öne çıkan özelliklerini ve yaratabileceğiniz etkiyi yakından tanıyın.</p>
        </div>
        
        <Carousel
            opts={{
                align: "start",
            }}
            className="w-full"
        >
            <CarouselContent className="-ml-4">
                {storiesData.map((story, index) => (
                    <CarouselItem key={index} className="pl-4 basis-3/4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                        <FeatureCard {...story} />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="ml-16 hidden lg:flex" />
            <CarouselNext className="mr-16 hidden lg:flex" />
        </Carousel>
    </div>
  );
}
