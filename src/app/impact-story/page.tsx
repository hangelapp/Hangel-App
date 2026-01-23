'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { user } from "@/lib/data";
import { HangelLogo } from "@/components/icons";
import Image from 'next/image';

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
    <div className="relative h-[70vh] max-h-[550px] w-full rounded-xl overflow-hidden shadow-lg">
        <Image src={backgroundImageUrl} alt={title} fill className="object-cover" data-ai-hint="story background" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
        <div className="relative h-full flex flex-col justify-between p-4 text-white">
            <div className="flex items-center gap-2">
                <Avatar className="w-10 h-10 border-2 border-white/80">
                    <AvatarImage src={authorImage} />
                    <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-sm drop-shadow-md">{authorName}</p>
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold drop-shadow-lg">{title}</h3>
                <p className="text-base drop-shadow-md max-w-xs mx-auto">{content}</p>
            </div>
            <div className="text-center opacity-80 pt-4">
                <HangelLogo className="w-8 h-8 mx-auto" />
            </div>
        </div>
    </div>
);


export default function ImpactStoryPage() {
  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-headline">Hangel Etki Hikayeleri</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Birlikte başardıklarımızı ve yarattığımız pozitif değişimi keşfedin.</p>
      </div>

      <div className="space-y-8">
        <div>
            <div className="flex items-center gap-3 mb-4">
                 <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border">
                    <HangelLogo className="w-7 h-7 text-primary"/>
                 </div>
                 <h2 className="text-xl font-semibold">Topluluğun Hikayeleri</h2>
            </div>
            <Carousel
                opts={{
                    align: "start",
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2">
                {generalStories.map((story, index) => (
                    <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                        <StoryCard 
                            title={story.title} 
                            content={story.content}
                            authorName="Hangel Topluluk"
                            authorImage=""
                            backgroundImageUrl={`https://picsum.photos/seed/gen-story-${index}/400/600`}
                        />
                    </CarouselItem>
                ))}
                </CarouselContent>
                <CarouselPrevious className="ml-12 hidden sm:flex" />
                <CarouselNext className="mr-12 hidden sm:flex"/>
            </Carousel>
        </div>

        <div>
            <div className="flex items-center gap-3 mb-4">
                 <Avatar className="w-12 h-12 border-2 border-primary">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">Senin Hikayelerin</h2>
            </div>
            <Carousel
                opts={{
                    align: "start",
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2">
                {userStories.map((story, index) => (
                    <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                       <StoryCard 
                            title={story.title} 
                            content={story.content}
                            authorName={user.name}
                            authorImage={user.avatarUrl}
                            backgroundImageUrl={`https://picsum.photos/seed/user-story-${index}/400/600`}
                        />
                    </CarouselItem>
                ))}
                </CarouselContent>
                <CarouselPrevious className="ml-12 hidden sm:flex"/>
                <CarouselNext className="mr-12 hidden sm:flex"/>
            </Carousel>
        </div>
      </div>
    </div>
  );
}