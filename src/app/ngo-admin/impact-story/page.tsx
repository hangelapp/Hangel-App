
'use client';

import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import type { UseEmblaCarouselType } from "embla-carousel-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ngos } from "@/lib/data";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const impactStories = [
    { title: "200 Aileye Gıda Desteği", content: "Bağışlarınız sayesinde Ramazan ayında 200 ihtiyaç sahibi aileye gıda kolisi ulaştırdık.", imageUrl: "https://picsum.photos/seed/story1/1080/1920", imageHint: "food donation boxes" },
    { title: "150 Fidan Toprakla Buluştu", content: "Gönüllülerimizin katılımıyla gerçekleştirdiğimiz etkinlikte 150 fidanı toprakla buluşturarak geleceğe nefes olduk.", imageUrl: "https://picsum.photos/seed/story2/1080/1920", imageHint: "planting trees people" },
    { title: "Patili Dostlarımıza Yuva Olduk", content: "Bu ay 25 sokak hayvanının tedavi ve bakım masraflarını karşılayarak onlara sıcak bir yuva bulmalarına yardımcı olduk.", imageUrl: "https://picsum.photos/seed/story3/1080/1920", imageHint: "puppy cute shelter" },
    { title: "10 Öğrenciye Burs İmkanı", content: "Eğitime destek projemiz kapsamında, başarılı ve ihtiyaç sahibi 10 üniversite öğrencisine burs imkanı sağladık.", imageUrl: "https://picsum.photos/seed/story4/1080/1920", imageHint: "students graduation happy" },
    { title: "Afet Bölgesine 5 Tır Yardım", content: "Acil yardım çağrımızla topladığımız malzemeleri 5 tır ile afet bölgesindeki depremzedelere ulaştırdık.", imageUrl: "https://picsum.photos/seed/story5/1080/1920", imageHint: "emergency aid truck" },
    { title: "Temiz Sahiller, Mutlu Canlılar", content: "3 farklı sahilde düzenlediğimiz temizlik etkinliğinde, gönüllülerimizle birlikte 500 kg'dan fazla atık topladık.", imageUrl: "https://picsum.photos/seed/story6/1080/1920", imageHint: "beach cleanup trash" },
    { title: "Kadın Kooperatiflerine Destek", content: "El emeği ürünler üreten 5 kadın kooperatifine pazarlama ve satış desteği sağlayarak ekonomik olarak güçlenmelerine yardımcı olduk.", imageUrl: "https://picsum.photos/seed/story7/1080/1920", imageHint: "women weaving craft" },
    { title: "LÖSEV'e Moral Ziyareti", content: "Gönüllülerimizle birlikte LÖSEV'de tedavi gören çocuklara moral ziyareti düzenleyerek onlarla oyunlar oynadık, hediyeler dağıttık.", imageUrl: "https://picsum.photos/seed/story8/1080/1920", imageHint: "child hospital playing" },
    { title: "Barınak Güzelleştirme Projesi", content: "Hayvan barınağının duvarlarını boyadık, oyun alanları oluşturduk ve patili dostlarımız için daha yaşanabilir bir ortam oluşturduk.", imageUrl: "https://picsum.photos/seed/story9/1080/1920", imageHint: "painting mural colorful" },
    { title: "Yaşlılara Vefa Ziyaretleri", content: "Huzurevinde kalan değerli büyüklerimizi ziyaret ederek onlarla sohbet ettik, anılarını dinledik ve yalnız olmadıklarını hissettirdik.", imageUrl: "https://picsum.photos/seed/story10/1080/1920", imageHint: "elderly person smiling" },
];

const StoryCard = ({ title, content, authorName, authorImage, backgroundImageUrl, imageHint }: { title: string, content: string, authorName: string, authorImage: string, backgroundImageUrl: string, imageHint: string }) => (
    <div className="relative h-full w-full bg-black">
        <Image src={backgroundImageUrl} alt={title} fill className="object-cover opacity-80" data-ai-hint={imageHint}/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-6 text-white text-center z-10">
            <div className="space-y-2">
                <h3 className="text-2xl font-bold drop-shadow-lg">{title}</h3>
                <p className="text-lg drop-shadow-md max-w-xs mx-auto">{content}</p>
            </div>
        </div>
    </div>
);

type CarouselApi = UseEmblaCarouselType[1]

export default function ImpactStoryPage() {
    const router = useRouter();
    const [api, setApi] = React.useState<CarouselApi>()
    const [current, setCurrent] = React.useState(0)
    const [progress, setProgress] = React.useState(0);
    const ngo = ngos.find(n => n.id === '2');
    const authorName = ngo?.name || "Kuruluş";
    const authorImage = ngo?.avatarUrl || "";

    React.useEffect(() => {
        if (!api) return;
        
        const updateProgress = () => {
            const scrollProgress = api.scrollProgress();
            const totalSlides = api.scrollSnapList().length;
            const progressPerSlide = 1 / (totalSlides - 1);
            const currentSlideProgress = (scrollProgress - (api.selectedScrollSnap() * progressPerSlide)) / progressPerSlide;
            setProgress(currentSlideProgress * 100);
        }

        const handleSelect = () => {
            setCurrent(api.selectedScrollSnap());
            setProgress(0);
        }

        api.on("select", handleSelect);
        api.on("scroll", updateProgress);

        return () => {
            api.off("select", handleSelect);
            api.off("scroll", updateProgress);
        }
    }, [api])

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            <div className="relative w-full max-w-[450px] h-full max-h-[800px] aspect-[9/16] bg-card rounded-2xl overflow-hidden">
                <div className="absolute inset-x-0 top-0 p-3 z-20 space-y-2">
                    <div className="flex items-center gap-1">
                        {impactStories.map((_, index) => (
                            <div key={index} className="relative h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                               <div 
                                    className={`absolute top-0 left-0 h-full bg-white transition-all duration-100 ${index < current ? 'w-full' : 'w-0'} ${index === current ? 'w-[' + progress + '%]' : ''}`} 
                                    style={{width: index === current ? `${progress}%` : (index < current ? '100%' : '0%')}}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 border-2 border-white/80">
                                <AvatarImage src={authorImage} />
                                <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-sm text-white drop-shadow-md">{authorName}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9" onClick={() => router.back()}>
                            <X className="h-6 w-6"/>
                        </Button>
                    </div>
                </div>
                <Carousel setApi={setApi} className="w-full h-full">
                    <CarouselContent>
                    {impactStories.map((story, index) => (
                        <CarouselItem key={index} className="basis-full">
                            <StoryCard 
                                title={story.title} 
                                content={story.content}
                                authorName={authorName}
                                authorImage={authorImage}
                                backgroundImageUrl={story.imageUrl}
                                imageHint={story.imageHint}
                            />
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-black/20 text-white border-none hover:bg-black/40" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-black/20 text-white border-none hover:bg-black/40" />
                </Carousel>
            </div>
        </div>
    );
};
