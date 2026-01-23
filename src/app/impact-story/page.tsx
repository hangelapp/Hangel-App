'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import type { UseEmblaCarouselType } from "embla-carousel-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { user } from "@/lib/data";
import { HangelLogo } from "@/components/icons";
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';

const generalStories = [
    { title: "Eğitimle Değişen Hayatlar", content: "Bağışlarınız sayesinde 200'den fazla öğrencinin eğitim masrafları karşılandı ve hayallerine bir adım daha yaklaştılar." },
    { title: "Patili Dostlara Uzanan Yardım Eli", content: "Gönüllülerimizin ve bağışçılarımızın desteğiyle 5 ton mama toplanarak Türkiye'nin dört bir yanındaki barınaklara ulaştırıldı." },
    { title: "Bir Fidan, Bin Nefes", content: "TEMA Vakfı ile yürüttüğümüz ortak kampanya ile 10.000 fidanı toprakla buluşturarak geleceğe nefes olduk." },
    { title: "Afet Bölgesinde Sıcak Bir Yuva", content: "Ahbap Derneği ile birlikte yürütülen projede, depremzede 15 aile için konteyner yaşam alanları kuruldu." },
    { title: "Temiz Deniz, Sağlıklı Gelecek", content: "Yaz boyunca süren sahil temizliği etkinliklerimizde tonlarca atık toplanarak denizlerimizin temiz kalmasına katkı sağlandı." },
    { title: "Kadın Emeği Değerleniyor", content: "Desteklenen kadın kooperatifleri, ürettikleri el emeği ürünlerle ekonomik özgürlüklerine kavuştu." },
    { title: "Engelleri Birlikte Aştık", content: "TOFD ile yapılan işbirliği sayesinde 50 adet tekerlekli sandalye ihtiyaç sahiplerine ulaştırıldı." },
    { title: "Minik Kalplere Dokunan Projeler", content: "LÖSEV işbirliğiyle hastanede tedavi gören çocuklar için moral etkinlikleri ve atölyeler düzenlendi." },
    { title: "Teknolojiyle Eşit Fırsatlar", content: "Köy okullarındaki öğrencilere yönelik kodlama ve robotik eğitimleri ile yüzlerce çocuğun teknolojiyle tanışması sağlandı." },
    { title: "Sokak Canları Yalnız Değil", content: "Gönüllülerimizin kurduğu beslenme noktaları sayesinde kış aylarında binlerce sokak hayvanının hayata tutunması sağlandı." },
];

const userStories = [
    { title: "İlk Gönüllülük Maceran", content: `HAYTAP ile katıldığın barınak hayvanları besleme gününde, 4 saat boyunca emek vererek patili dostlarımızın karnını doyurdun. Bu değerli katkınla 40 Sosyal Etki Puanı kazandın.` },
    { title: "Eğitime Verdiğin Destek", content: `Kitap Kurdu markasından yaptığın alışverişle TEGV'e 8.50₺ bağışta bulundun ve bir öğrencinin eğitimine küçük de olsa bir katkı sağladın.` },
    { title: "Çevreye Olan Duyarlılığın", content: `Doğa Dostu Giyim'den yaptığın alışverişle TEMA Vakfı'na tam 25.00₺ bağış yapılmasını sağladın. Bu katkınla 'Bronz Çevre Koruyucusu' rozetine çok yaklaştın.` },
    { title: "Afet Anında Hızlı Davranışın", content: `Ahbap Derneği'nin afet bölgesindeki yardım dağıtımına başvurarak zor zamanda ihtiyaç sahiplerinin yanında olma isteğini gösterdin. Başvurun onaylandı!` },
    { title: "İyilik Zincirini Büyütmen", content: `Platforma davet ettiğin arkadaşların sayesinde iyilik hareketimiz daha da güçlendi. Davetlerinle 200 Sosyal Etki Puanı kazandın.` },
];


const StoryCard = ({ title, content, authorName, authorImage, backgroundImageUrl }: { title: string, content: string, authorName: string, authorImage: string, backgroundImageUrl: string }) => (
    <div className="relative h-full w-full bg-black">
        <Image src={backgroundImageUrl} alt={title} fill className="object-cover opacity-70" data-ai-hint="story background" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        <div className="relative h-full flex flex-col justify-end p-6 text-white text-center z-10">
            <div className="space-y-2">
                <h3 className="text-2xl font-bold drop-shadow-lg">{title}</h3>
                <p className="text-base drop-shadow-md max-w-xs mx-auto">{content}</p>
            </div>
             <div className="text-center opacity-80 pt-12">
                <HangelLogo className="w-8 h-8 mx-auto" />
            </div>
        </div>
    </div>
);

type CarouselApi = UseEmblaCarouselType[1]

const StoryCarousel = ({ stories, author, avatar }: { stories: {title: string, content: string}[], author: string, avatar: string}) => {
    const [api, setApi] = React.useState<CarouselApi>()
    const [current, setCurrent] = React.useState(0)

    React.useEffect(() => {
        if (!api) return
        setCurrent(api.selectedScrollSnap() + 1)
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1)
        })
    }, [api])

    return (
        <div className="relative h-full w-full">
            <div className="absolute inset-x-0 top-0 p-2 z-20">
                 <div className="flex items-center gap-1">
                    {stories.map((_, index) => (
                        <div key={index} className="relative h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                           {index < current -1 && <div className="absolute top-0 left-0 h-full w-full bg-white"></div>}
                        </div>
                    ))}
                </div>
                 <div className="flex items-center gap-2 pt-2">
                    <Avatar className="w-8 h-8 border-2 border-white/80">
                        <AvatarImage src={avatar} />
                        <AvatarFallback>{author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm text-white drop-shadow-md">{author}</p>
                </div>
            </div>
            <Carousel setApi={setApi} className="w-full h-full">
                <CarouselContent>
                {stories.map((story, index) => (
                    <CarouselItem key={index} className="basis-full">
                        <StoryCard 
                            title={story.title} 
                            content={story.content}
                            authorName={author}
                            authorImage={avatar}
                            backgroundImageUrl={`https://picsum.photos/seed/${author.replace(/\s/g, '-')}-${index}/400/800`}
                        />
                    </CarouselItem>
                ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4"/>
            </Carousel>
        </div>
    );
};

export default function ImpactStoryPage() {
  return (
    <div className="fixed inset-0 top-12 lg:top-0 lg:left-64 bottom-16 lg:bottom-0 bg-background z-20">
      <Tabs defaultValue="community" className="w-full h-full flex flex-col-reverse lg:flex-col">
        <TabsList className="grid w-full grid-cols-2 rounded-none h-14 shrink-0">
          <TabsTrigger value="community" className="h-full text-base rounded-none data-[state=active]:border-b-2 lg:data-[state=active]:border-b-0 lg:data-[state=active]:border-t-2 border-primary">Topluluğun Hikayeleri</TabsTrigger>
          <TabsTrigger value="personal" className="h-full text-base rounded-none data-[state=active]:border-b-2 lg:data-[state=active]:border-b-0 lg:data-[state=active]:border-t-2 border-primary">Senin Hikayelerin</TabsTrigger>
        </TabsList>
        <TabsContent value="community" className="flex-1 mt-0">
            <StoryCarousel stories={generalStories} author="Hangel Topluluk" avatar="" />
        </TabsContent>
        <TabsContent value="personal" className="flex-1 mt-0">
            <StoryCarousel stories={userStories} author={user.name} avatar={user.avatarUrl} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
