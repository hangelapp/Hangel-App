'use client';

/**
 * SantralIntro — santral başvuru sekmesindeki KARŞILAMA/TANITIM ekranı.
 *
 * Kurulum yapılmamış (ccDoc yok) STK yöneticisine, kuru form yerine "santral
 * nedir, neler yapabilirsin" anlatan sıcak bir vitrin gösterir; "Hemen başla"
 * ile kurulum sihirbazına geçilir. İlk kez, teknik bilmeyen kullanıcı için.
 *
 * Apple/hangel kimliği: Liquid Glass kartlar, mercan vurgu, bol boşluk,
 * ≥44px dokunma hedefleri, açık Türkçe.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Phone, Headphones, Voicemail, ListChecks, FileBadge, BarChart3,
  ArrowRight, HelpCircle, Sparkles, ShieldCheck, Clock, Wallet,
} from 'lucide-react';

const FEATURES: { icon: React.ElementType; title: string; desc: string }[] = [
  { icon: Phone, title: 'Tarayıcıdan ara', desc: 'Ek cihaz almadan, panelden konuş. Bilgisayar ya da telefon yeter.' },
  { icon: Headphones, title: 'Karşılama & yönlendirme', desc: '"1’e basın" menüsü, sıra, çalışma saatleri — hepsi ayarlardan.' },
  { icon: Voicemail, title: 'Kayıt & sesli mesaj', desc: 'Kaçırdığın çağrı kaybolmaz; sesli mesaj bırakılır, sonra dinlersin.' },
  { icon: ListChecks, title: 'Katılımcıları ara', desc: 'Etkinlik ve gönüllü listelerinden kişileri tek tuşla ara.' },
  { icon: FileBadge, title: 'Sertifikalar', desc: 'Gönüllülerine katılım/teşekkür sertifikalarını otomatik ver.' },
  { icon: BarChart3, title: 'Raporlar', desc: 'Kim aradı, ne kadar sürdü, kim cevapladı — hepsi tek yerde.' },
];

const STEPS = [
  'Kuruluşunu tanıt (dernek/vakıf + kütük no)',
  'Numaranı seç ya da kendi hattını getir',
  'KVKK sözleşmesini onayla',
  'Hazırsın — başvuru onaylanınca panel açılır',
];

export function SantralIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="glass-prominent rounded-3xl p-8 sm:p-10 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-4">
          <Sparkles className="h-3.5 w-3.5" /> hangel sanal santral
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-balance">
          Kendi çağrı merkeziniz, dakikalar içinde
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Numaranız çalsın, gönüllüleriniz cevaplasın. Cihaz almadan, teknik bilgi gerektirmeden —
          her adımda size yol gösteriyoruz.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onStart} size="lg" className="rounded-full h-12 px-7 text-base font-bold">
            Hemen başla <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-6 text-base">
            <a href="#nasil-calisir">
              <HelpCircle className="mr-2 h-4 w-4" /> Nasıl çalışır?
            </a>
          </Button>
        </div>
      </div>

      {/* Yetenekler */}
      <div>
        <h2 className="text-lg font-bold mb-4">Neler yapabilirsin?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl p-5 flex items-start gap-3.5">
              <span className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-sm leading-tight">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nasıl çalışır */}
      <div id="nasil-calisir" className="glass rounded-3xl p-6 sm:p-8 scroll-mt-24">
        <h2 className="text-lg font-bold mb-1">Kurulum 4 adım</h2>
        <p className="text-sm text-muted-foreground mb-5">Elinizden tutuyoruz — her adımda ne yapacağınız net.</p>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-sm font-medium pt-1.5">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Güven şeridi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          <div><p className="text-sm font-bold leading-tight">KVKK uyumlu</p><p className="text-xs text-muted-foreground">Veriler güvende, sözleşmeli.</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
          <Clock className="h-5 w-5 text-primary shrink-0" />
          <div><p className="text-sm font-bold leading-tight">Hızlı kurulum</p><p className="text-xs text-muted-foreground">Dakikalar içinde hazır.</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
          <Wallet className="h-5 w-5 text-primary shrink-0" />
          <div><p className="text-sm font-bold leading-tight">Kendi hattın</p><p className="text-xs text-muted-foreground">Var olan numaranı getirebilirsin.</p></div>
        </div>
      </div>

      {/* Alt CTA */}
      <div className="text-center pt-2">
        <Button onClick={onStart} size="lg" className="rounded-full h-12 px-7 text-base font-bold">
          Kuruluma başla <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
