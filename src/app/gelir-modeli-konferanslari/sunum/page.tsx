'use client';

/**
 * /gelir-modeli-konferanslari/sunum — Apple Keynote tarzı tam-ekran sunum.
 *
 * "Sivil Toplum Kuruluşlarında Gelir Modeli Oluşturma ve Sürdürülebilirlik"
 * (Social Business Global). 6 bölüm + kapanış, ~30 slayt. Tek-fikir slaytlar,
 * dev tipografi, coral (#f34723) kimlik. Bölüm geçişleri coral zemin; içerik
 * slaytları siyah zemin. Navigasyon: klavye (← → Space Esc), swipe, alt ilerleme
 * çubuğu, sağ/sol tıklama. Konferans sayfasındaki rozetten açılır.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X, ArrowDown, Sparkles } from 'lucide-react';

const CORAL = '#f34723';

type Slide =
  | { kind: 'title'; eyebrow: string; title: string; sub: string }
  | { kind: 'section'; num: string; name: string }
  | { kind: 'body'; eyebrow?: string; title: string; lines: string[] }
  | { kind: 'stats'; title: string; intro?: string; stats: { big: string; label: string }[]; foot?: string }
  | { kind: 'list'; title: string; intro?: string; items: string[]; foot?: string }
  | { kind: 'flow'; title: string; intro?: string; steps: string[] }
  | { kind: 'research'; n: number; paper: string; year: string; authors: string[]; unis: string[]; finding: string[] }
  | { kind: 'closing'; title: string; lines: string[] };

const SLIDES: Slide[] = [
  { kind: 'title', eyebrow: 'Sivil Toplum Kuruluşlarında', title: 'Gelir Modeli\nOluşturma ve\nSürdürülebilirlik', sub: 'Sosyal Etki İçin Yeni Nesil Modeller' },

  { kind: 'section', num: '01', name: 'Social Business Global' },
  { kind: 'body', eyebrow: 'Social Business Global', title: 'Sosyal etki odaklı\nbir yapı', lines: ['Sosyal sorunlara girişimcilik bakışıyla, sosyal inovasyonla; yenilikçi ve kalıcı çözümler üretmek amacıyla çalışmalar yürütüyoruz.'] },
  { kind: 'stats', title: 'Uluslararası Sosyal Girişimcilik Çalıştayları', intro: 'Her yıl farklı şehirlerde, 20 farklı ülkeden katılımcı bir araya geliyor.', stats: [{ big: '54', label: 'farklı ülkeden katılımcı ağı' }, { big: '639', label: 'sürdürülebilir etki girişimcisi incelendi' }, { big: '20', label: 'ülkeden her yıl katılım' }], foot: 'Amaç: Dünyadaki başarılı sosyal girişim modellerini inceleyip Türkiye’ye uyarlanabilir modeller geliştirmek.' },
  { kind: 'stats', title: 'Sosyal Girişimcilik Eğitimleri ve Konferanslar', stats: [{ big: '29', label: 'farklı üniversite' }, { big: '161', label: 'konferans' }, { big: '300+', label: 'eğitim ve konferans' }], foot: 'Belediye ve ticaret odaları iş birlikleriyle.' },
  { kind: 'list', title: 'Sosyal Girişimcilik Kanun Teklifi', intro: 'Türkiye’de sosyal girişimcilik ekosisteminin gelişmesi için hazırlanan çalışmalar:', items: ['Sosyal girişimlerin hukuki tanımı', 'Sosyal fayda ölçümü', 'Kamu destek mekanizmaları', 'Denetim ve sürdürülebilirlik modelleri'] },
  { kind: 'flow', title: 'Gönüllülük Temelli İstihdam Protokolü', intro: 'Gönüllülük deneyimlerinin iş dünyasında görünür hale gelmesi.', steps: ['STK deneyimi', 'Yetkinlik kazanımı', 'İş başvurularında değerlendirme', 'Sosyal katkı odaklı istihdam'] },
  { kind: 'list', title: 'STK Gelir Modeli Oluşturma Konferansları', intro: 'Amaç:', items: ['Tek kaynağa bağımlılığı azaltmak', 'Gelir çeşitliliği oluşturmak', 'Profesyonel ve sürdürülebilir yapılar kurmak'] },

  { kind: 'section', num: '02', name: 'STK Problemi' },
  { kind: 'list', title: 'STK’ların Temel Problemi', intro: 'STK’lar sosyal fayda üretemediği için değil; sürdürülebilir gelir modeli ve profesyonel iş gücü oluşturamadığı için zorlanır. İki temel ihtiyaç:', items: ['Düzenli gelir', 'Profesyonel ekip'] },

  { kind: 'section', num: '03', name: 'Akademik Araştırmalar' },
  { kind: 'research', n: 1, paper: 'Structural Embeddedness and the Liability of Newness among Nonprofit Organizations', year: '2004', authors: ['Mark A. Hager', 'Joseph Galaskiewicz', 'Jeff A. Larson'], unis: ['University of Arizona · ABD', 'Arizona State University · ABD'], finding: ['Yeni kurulan STK’ların kapanma riski daha yüksektir.', 'Gelir çeşitliliği ve kurumsal yapı, uzun ömürlülüğü artırır.'] },
  { kind: 'research', n: 2, paper: 'Financial Resilience, Income Dependence and Organisational Survival in UK Charities', year: '2021', authors: ['Elizabeth Green', 'Felix Ritchie', 'Peter Bradley', 'Glenn Parry'], unis: ['University of the West of England · İngiltere', 'University of Surrey · İngiltere'], finding: ['Risk, gelir azlığı değil — tek gelir kaynağına bağımlılıktır.'] },
  { kind: 'research', n: 3, paper: 'Simmer Down Now! A Study of Revenue Volatility and Dissolution in Nonprofit Organizations', year: '2023', authors: ['Duncan J. Mayer'], unis: ['Case Western Reserve University · ABD'], finding: ['Gelir dalgalanması arttıkça STK kapanma riski yükselir.'] },

  { kind: 'section', num: '04', name: 'Sosyal Girişimcilik' },
  { kind: 'body', title: 'Sosyal Girişimcilik\nNedir?', lines: ['Sosyal sorunlara girişimcilik bakışıyla, sosyal inovasyonla; yenilikçi ve kalıcı çözümler üretmektir.'] },
  { kind: 'flow', title: 'Sosyal Girişim Modeli', steps: ['Sorun', 'Yenilikçi çözüm', 'Ürün / Hizmet', 'Gelir modeli', 'Sürdürülebilir sosyal etki'] },
  { kind: 'list', title: 'Dünya ve Türkiye’den Örnekler', items: ['Muhammad Yunus — Grameen Bank', 'Askıda Ne Var', 'TOMS', 'WeWork', 'Ortimo'] },

  { kind: 'section', num: '05', name: 'Gelir Modelleri' },
  { kind: 'list', title: 'STK Gelir Modelleri', items: ['Bireysel bağış', 'Düzenli bağışçı sistemi', 'Kurumsal destek', 'Sponsorluk', 'Üyelik modeli', 'Hibe programları', 'Kamu destekleri', 'Danışmanlık', 'Eğitim programları', 'Sosyal girişim modeli'] },
  { kind: 'list', title: 'Sosyal Girişim: Ürün ve Hizmet Geliştirme', intro: 'STK’lar uzmanlık alanlarından gelir oluşturabilir:', items: ['Hizmet', 'Çözüm', 'Platform', 'Ürün'] },

  { kind: 'section', num: '06', name: 'Destek Ekosistemi' },
  { kind: 'list', title: 'Google Destekleri', intro: 'STK’lar için:', items: ['Google Workspace', 'Kurumsal e-posta altyapısı', 'Google Meet', '100 TB bulut depolama', 'Google Ads reklam desteği (10.000 USD/ay)'], foot: 'Dijital kapasiteyi artırma imkânı.' },
  { kind: 'list', title: 'Canva Destekleri', intro: 'STK’lar için:', items: ['Canva Pro', 'Tasarım araçları', 'Sunum hazırlama', 'Sosyal medya içerikleri'], foot: 'STK başına belirli sürelerle ücretsiz kullanım.' },
  { kind: 'list', title: 'Microsoft Destekleri', intro: 'STK’lar için:', items: ['Microsoft 365', 'Dijital çalışma araçları', 'Kurumsal yazılımlar'], foot: 'Uygunluk kriterlerine göre ücretsiz veya indirimli.' },
  { kind: 'flow', title: 'hangel', intro: 'Sosyal ticaret ve gönüllülük platformu.', steps: ['Kullanıcı', 'Marka alışverişi', 'Gelir oluşumu', 'STK desteği', 'Sosyal etki'] },
  { kind: 'body', title: 'AbilityPool', lines: ['STK’ların gönüllülük ilanı açabildiği, kurumsal şirket çalışanlarının gönüllülük yaparak sosyal projelere katılabildiği dijital platform.', 'Amaç: Yeteneği sosyal faydaya dönüştürmek.'] },
  { kind: 'body', title: 'HelpSteps', lines: ['Günlük hareketleri sosyal faydaya dönüştüren dijital sosyal etki modeli.'] },

  { kind: 'closing', title: 'Geleceğin\nSTK Modeli', lines: ['Sadece bağış bekleyen değil;', 'gelir üreten, teknoloji kullanan ve sürdürülebilir etki oluşturan STK’lar.'] },
];

export default function ConferenceDeckPage() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const touchX = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    setI((cur) => {
      const target = Math.max(0, Math.min(SLIDES.length - 1, next));
      setDir(target >= cur ? 1 : -1);
      return target;
    });
  }, []);

  const exit = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/gelir-modeli-konferanslari');
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); go(i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
      else if (e.key === 'Escape') exit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, go, exit]);

  const slide = SLIDES[i];
  const isCoral = slide.kind === 'title' || slide.kind === 'section' || slide.kind === 'closing';

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden select-none text-white ${isCoral ? '' : 'bg-black'}`}
      style={isCoral ? { background: `linear-gradient(135deg, ${CORAL} 0%, #c5391b 100%)` } : undefined}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <button aria-label="Önceki" onClick={() => go(i - 1)} className="absolute left-0 top-0 z-10 h-full w-1/4 cursor-default focus:outline-none" />
      <button aria-label="Sonraki" onClick={() => go(i + 1)} className="absolute right-0 top-0 z-10 h-full w-1/4 cursor-default focus:outline-none" />

      <button onClick={exit} aria-label="Kapat" className="absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
        <X className="h-5 w-5" />
      </button>
      <div className="absolute left-6 top-6 z-30 text-[13px] font-semibold tabular-nums text-white/45">{i + 1} / {SLIDES.length}</div>

      <div key={i} className={`flex h-full w-full items-center justify-center px-8 py-20 ${dir === 1 ? 'animate-in slide-in-from-right-6' : 'animate-in slide-in-from-left-6'} fade-in duration-500`}>
        <div className="mx-auto w-full max-w-4xl text-center">

          {slide.kind === 'title' && (
            <>
              <p className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-white/80">{slide.eyebrow}</p>
              <h1 className="whitespace-pre-line text-5xl font-black leading-[0.98] tracking-tighter sm:text-7xl lg:text-8xl">{slide.title}</h1>
              <p className="mt-6 text-xl font-bold tracking-tight text-white/90 sm:text-3xl">{slide.sub}</p>
            </>
          )}

          {slide.kind === 'section' && (
            <>
              <p className="text-7xl font-black leading-none tracking-tighter text-white/40 sm:text-9xl">BÖLÜM</p>
              <p className="my-2 text-8xl font-black leading-none tracking-tighter sm:text-[11rem]">{slide.num}</p>
              <p className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{slide.name}</p>
            </>
          )}

          {slide.kind === 'body' && (
            <>
              {slide.eyebrow && <p className="mb-5 text-sm font-bold uppercase tracking-[0.18em]" style={{ color: CORAL }}>{slide.eyebrow}</p>}
              <h2 className="whitespace-pre-line text-4xl font-black leading-[1.02] tracking-tighter sm:text-6xl">{slide.title}</h2>
              <div className="mx-auto mt-8 max-w-2xl space-y-4">
                {slide.lines.map((l, k) => <p key={k} className="text-lg font-medium leading-relaxed text-white/65 sm:text-2xl">{l}</p>)}
              </div>
            </>
          )}

          {slide.kind === 'stats' && (
            <>
              <h2 className="text-3xl font-black leading-tight tracking-tighter sm:text-5xl">{slide.title}</h2>
              {slide.intro && <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-white/55 sm:text-lg">{slide.intro}</p>}
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {slide.stats.map((s, k) => (
                  <div key={k} className="space-y-1">
                    <div className="text-6xl font-black leading-none tracking-tighter sm:text-7xl" style={{ color: CORAL }}>{s.big}</div>
                    <div className="text-sm font-medium leading-snug text-white/60">{s.label}</div>
                  </div>
                ))}
              </div>
              {slide.foot && <p className="mx-auto mt-10 max-w-2xl text-sm font-medium leading-relaxed text-white/45 sm:text-base">{slide.foot}</p>}
            </>
          )}

          {slide.kind === 'list' && (
            <>
              <h2 className="text-3xl font-black leading-tight tracking-tighter sm:text-5xl">{slide.title}</h2>
              {slide.intro && <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-white/55 sm:text-lg">{slide.intro}</p>}
              <div className={`mx-auto mt-9 max-w-2xl gap-x-8 gap-y-3 text-left ${slide.items.length > 6 ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col items-center'}`}>
                {slide.items.map((it, k) => (
                  <div key={k} className={`flex items-center gap-3 ${slide.items.length > 6 ? '' : 'w-full max-w-md'}`}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CORAL }} />
                    <span className="text-lg font-semibold text-white/90 sm:text-xl">{it}</span>
                  </div>
                ))}
              </div>
              {slide.foot && <p className="mx-auto mt-9 max-w-2xl text-sm font-medium text-white/45 sm:text-base">{slide.foot}</p>}
            </>
          )}

          {slide.kind === 'flow' && (
            <>
              <h2 className="text-3xl font-black leading-tight tracking-tighter sm:text-5xl">{slide.title}</h2>
              {slide.intro && <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-white/55 sm:text-lg">{slide.intro}</p>}
              <div className="mx-auto mt-9 flex w-full max-w-md flex-col items-center gap-2">
                {slide.steps.map((s, k) => (
                  <React.Fragment key={k}>
                    <div className={`w-full rounded-2xl px-5 py-3 text-base font-bold sm:text-xl ${k === slide.steps.length - 1 ? 'text-white' : 'bg-white/[0.06] text-white/90'}`} style={k === slide.steps.length - 1 ? { backgroundColor: CORAL } : undefined}>{s}</div>
                    {k < slide.steps.length - 1 && <ArrowDown className="h-5 w-5 text-white/35" />}
                  </React.Fragment>
                ))}
              </div>
            </>
          )}

          {slide.kind === 'research' && (
            <>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em]" style={{ color: CORAL }}>Araştırma {slide.n}</p>
              <h2 className="mx-auto max-w-3xl text-2xl font-bold italic leading-snug tracking-tight sm:text-4xl">“{slide.paper}”</h2>
              <p className="mt-5 text-base font-medium text-white/55 sm:text-lg">{slide.year} · {slide.authors.join(', ')}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {slide.unis.map((u, k) => (
                  <span key={k} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: `${CORAL}66`, color: '#ffd9ce' }}>{u}</span>
                ))}
              </div>
              <div className="mx-auto mt-9 max-w-2xl space-y-2 border-l-4 pl-5 text-left" style={{ borderColor: CORAL }}>
                <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">Çıktı</p>
                {slide.finding.map((f, k) => <p key={k} className="text-lg font-semibold leading-relaxed text-white/90 sm:text-2xl">{f}</p>)}
              </div>
            </>
          )}

          {slide.kind === 'closing' && (
            <>
              <h2 className="whitespace-pre-line text-5xl font-black leading-[0.95] tracking-tighter sm:text-8xl">{slide.title}</h2>
              <div className="mx-auto mt-7 max-w-2xl space-y-2">
                {slide.lines.map((l, k) => <p key={k} className="text-lg font-medium leading-relaxed text-white/90 sm:text-2xl">{l}</p>)}
              </div>
              <div className="mt-10">
                <button onClick={() => router.push('/gelir-modeli-konferanslari')} className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-[#c5391b] shadow-xl transition active:scale-95">
                  <Sparkles className="h-5 w-5" /> Şehrini Seç, Kayıt Ol
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* İlerleme çubuğu */}
      <div className="absolute inset-x-0 bottom-0 z-30 h-1 bg-white/10">
        <div className="h-full bg-white transition-all duration-500" style={{ width: `${((i + 1) / SLIDES.length) * 100}%` }} />
      </div>

      {i > 0 && (
        <button onClick={() => go(i - 1)} aria-label="Önceki" className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20 sm:block">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {i < SLIDES.length - 1 && (
        <button onClick={() => go(i + 1)} aria-label="Sonraki" className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20 sm:block">
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
