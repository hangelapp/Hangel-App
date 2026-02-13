'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle } from 'lucide-react';
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
}

const StoryCard: React.FC<StoryCardProps> = ({ category, title, description, imageUrl, imageHint, href, bgColor, textColor }) => {
  return (
    <Link href={href} className="block group h-full">
      <Card className={cn("relative w-full h-full overflow-hidden rounded-3xl border-none shadow-xl transition-all duration-500 group-hover:scale-[1.02]", bgColor)}>
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500"
          data-ai-hint={imageHint}
        />
        <div className={cn("relative h-full flex flex-col justify-between p-6 text-left", textColor)}>
          <div>
            <p className="font-bold text-sm uppercase tracking-wider opacity-70">{category}</p>
            <h3 className="text-3xl font-bold mt-1">{title}</h3>
            <p className="mt-1 text-lg opacity-90">{description}</p>
          </div>
          <div className="self-end">
            <PlusCircle className="h-10 w-10 transition-transform duration-500 group-hover:rotate-90" />
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
      imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format=fit=crop",
      imageHint: "happy group people",
      href: "/ngo-admin/impact-story?category=hangel",
      bgColor: "bg-black",
      textColor: "text-white"
    },
    {
      category: "Senin Hikayen",
      title: "Kişisel Başarın",
      description: "Yarattığın pozitif değişimi ve kazandığın rozetleri gör.",
      imageUrl: "https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=1080",
      imageHint: "person portrait",
      href: "/ngo-admin/impact-story?category=user",
      bgColor: "bg-indigo-600",
      textColor: "text-white"
    },
    {
      category: "Kampanyalar",
      title: "Markaların Etkisi",
      description: "Alışverişle yaratılan farkı ve güncel kampanyaları keşfet.",
      imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format=fit=crop",
      imageHint: "clothing store interior",
      href: "/ngo-admin/impact-story?category=ads",
      bgColor: "bg-gray-100",
      textColor: "text-black"
    },
    {
      category: "Topluluk",
      title: "İlham Veren Anlar",
      description: "Gönüllülerin ve STK'ların sahadan hikayelerini dinle.",
      imageUrl: "https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format=fit=crop",
      imageHint: "volunteers working together",
      href: "/ngo-admin/impact-story?category=community",
      bgColor: "bg-orange-500",
      textColor: "text-white"
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-white min-h-screen">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Hikayeleri Keşfet</h1>
        <p className="text-lg text-muted-foreground">Platformumuzdaki ilham verici anlara ve etki raporlarına göz atın.</p>
      </div>

      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {storyCategories.map((story, index) => (
            <CarouselItem key={index} className="pl-4 basis-3/4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
              <div className="h-[450px] md:h-[500px]">
                <StoryCard {...story} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
            <CarouselPrevious className="ml-16" />
            <CarouselNext className="mr-16" />
        </div>
      </Carousel>
    </div>
  );
}
