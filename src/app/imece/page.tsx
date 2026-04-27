'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, HeartHandshake, Award, Clock, Users, Sparkles, Map, ShieldCheck, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import { cn } from '@/lib/utils';

const ImpactSection = ({ title, subtitle, description, theme = 'light', className, children, id }: any) => (
  <section id={id} className={cn(
    'relative min-h-[80vh] flex flex-col items-center justify-center pt-24 pb-16 text-center overflow-hidden border-b border-black/5',
    theme === 'dark' ? 'bg-[#042654] text-white' : 'bg-white text-[#1d1d1f]',
    className,
  )}>
    <div className="relative z-10 space-y-4 px-6 max-w-4xl">
      {subtitle && <p className={cn('text-xl md:text-2xl font-semibold opacity-90 tracking-tight', theme === 'dark' ? 'text-[#00A8E8]' : 'text-primary')}>{subtitle}</p>}
      <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">{title}</h2>
      {description && <p className="text-lg md:text-xl opacity-80 max-w-3xl mx-auto leading-relaxed font-medium">{description}</p>}
    </div>
    {children && <div className="w-full mt-10">{children}</div>}
  </section>
);

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <div className="bg-white rounded-3xl p-8 flex flex-col gap-3 text-left shadow-sm border border-black/5 h-full">
    <div className="p-3 bg-primary/10 rounded-2xl w-fit">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const StepCard = ({ step, title, description }: any) => (
  <div className="relative bg-[#0c3168] rounded-3xl p-8 text-left">
    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg shadow-lg">
      {step}
    </div>
    <h3 className="font-bold text-xl text-white mt-2">{title}</h3>
    <p className="text-sm text-white/70 mt-3 leading-relaxed">{description}</p>
  </div>
);

export default function ImecePage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <p className="font-black text-primary">hangel</p>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/volunteering">İlanları Gör <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </header>

      <main>
        <ImpactSection
          theme="dark"
          subtitle="Zamanınız en değerli bağış."
          title="hangel İmece"
          description="İmece geleneğinden ilham alan, gönüllülüğü organize eden ve etki ölçen modern bir platform. Yetkinliklerinizi, zamanınızı ve sosyal hassasiyetinizi gerçekten ihtiyaç duyulan projelere yöneltir."
        />

        <section className="bg-[#f5f5f7] py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">İmece Nasıl Çalışır?</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">4 adımda gönüllüden somut sosyal etkiye.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StepCard step="1" title="Profil Oluştur" description="Yetkinliklerini, ilgi alanlarını ve müsaitliğini paylaş. hangel sana en uygun fırsatları getirsin." />
              <StepCard step="2" title="Eşleş" description="Profiline uygun gönüllülük ilanlarını uygunluk yüzdesiyle gör; hassasiyet, yetkinlik ve konum filtreleriyle daralt." />
              <StepCard step="3" title="Katıl" description="Tek tıkla başvur. STK seni inceler, kabul eder ve süreç başlar — eğitim, ulaşım, koordinasyon hangel üstünden." />
              <StepCard step="4" title="Etki Ölç" description="Gönüllülük saatin, kazandığın rozetler ve sosyal etki puanın profiline işlenir. CV'ne dahil edebilir, paylaşabilirsin." />
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">İmece'nin Farkı</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Geleneksel gönüllülükten farklı olarak hangel İmece, eşleşme ve etki ölçümünde fark yaratır.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={Sparkles}
                title="Akıllı Eşleşme"
                description="Yetkinlik, sosyal alan ve müsaitlik bilgilerinden otomatik uygunluk yüzdesi hesaplanır. Sana uymayan ilanları görmek zorunda değilsin."
              />
              <FeatureCard
                icon={Award}
                title="Sosyal Etki Puanı"
                description="Her gönüllülük saatin, her başvurun, her tamamladığın proje sosyal etki puanına dönüşür. Liderlik tablolarında yerini al."
              />
              <FeatureCard
                icon={Clock}
                title="Esnek Müsaitlik"
                description="Hafta içi/sonu, gündüz/akşam, sahada/online/hibrit tercihlerine göre filtrelenir. Yoğun temposunla uyumlu fırsatlar."
              />
              <FeatureCard
                icon={Users}
                title="Topluluk"
                description="Aynı amaca koşan binlerce gönüllüyle bağlantı kur. Aidiyet duygusu, network ve yeni dostluklar."
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Şeffaflık"
                description="Her STK'nın şeffaflık endeksi, mali tabloları ve etki raporları açık erişilebilir. Bilinçli seçim yap."
              />
              <FeatureCard
                icon={Briefcase}
                title="CV Katkısı"
                description="Gönüllülük geçmişin, kazandığın sertifikalar ve rozetler profesyonel olarak kullanılabilir. İnsan kaynakları entegrasyonları yakında."
              />
            </div>
          </div>
        </section>

        <section className="bg-[#042654] text-white py-20 md:py-32">
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-8">
            <HeartHandshake className="h-12 w-12 mx-auto text-[#00A8E8]" />
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">İmecenin Bir Parçası Ol</h2>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
              Yalnız değilsin. Senin gibi düşünen ve harekete geçen binlerce insanla birlikte, gerçek değişim yarat.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild size="lg" className="rounded-full px-8 h-14 font-bold text-lg shadow-2xl shadow-primary/30">
                <Link href="/login/selection?action=register">Hemen Gönüllü Ol</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-14 font-bold text-lg bg-transparent border-white/30 text-white hover:bg-white hover:text-[#042654]">
                <Link href="/volunteering">İlanları Keşfet</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter currentPageLabel="hangel İmece" />
    </div>
  );
}
