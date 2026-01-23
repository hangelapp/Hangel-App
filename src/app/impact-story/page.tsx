import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { user } from "@/lib/data";

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


export default function ImpactStoryPage() {
  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-headline">Hangel Etki Hikayeleri</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Birlikte başardıklarımızı ve yarattığımız pozitif değişimi keşfedin.</p>
      </div>

      <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-semibold mb-4">Topluluğun Hikayeleri</h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
            {generalStories.map((story, index) => (
                <AccordionItem value={`item-g-${index}`} key={index} className="border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline text-left font-semibold">{story.title}</AccordionTrigger>
                    <AccordionContent className="pt-2">
                       <p className="text-muted-foreground">{story.content}</p>
                    </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
        </div>

        <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                Senin Hikayelerin
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
            {userStories.map((story, index) => (
                <AccordionItem value={`item-u-${index}`} key={index} className="border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline text-left font-semibold">{story.title}</AccordionTrigger>
                    <AccordionContent className="pt-2">
                       <p className="text-muted-foreground">{story.content}</p>
                    </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
        </div>
      </div>
    </div>
  );
}
