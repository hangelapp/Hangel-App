/**
 * Bergama sunumları — "Sosyal İnovasyon Yerleşkesi" ve "Pergamon İnovasyon
 * Mirası Forumu" için ayrı ayrı Apple Keynote tarzı slayt setleri.
 * conference-deck'teki Slide tipini yeniden kullanır; DeckViewer ile render edilir.
 */

import type { Slide } from './conference-deck';

const BERGAMA_URL = 'https://hangel.org/bergama';

/* ── Sosyal İnovasyon Yerleşkesi sunumu ──────────────────────────────────── */
export const YERLESKE_SLIDES: Slide[] = [
  { kind: 'title', eyebrow: 'bergama', title: 'Sosyal İnovasyon\nYerleşkesi', sub: 'Tarihi Bergama Bedesteni, sivil toplumun ortak evine dönüşüyor', foot: 'Kalıcı · paylaşımlı · kolektif akılla yönetilen bir mekân.' },

  { kind: 'section', num: '01', name: 'Vizyon' },
  { kind: 'body', eyebrow: 'Neden', title: 'Mirası dondurmak\ndeğil, yaşatmak', lines: ['Yüzyıllarca ticaretin ve buluşmanın kalbi olan Bergama Bedesteni; şimdi STK’ların, girişimcilerin, gönüllülerin ve öğrencilerin birlikte ürettiği bir sosyal inovasyon yerleşkesine dönüşüyor.'] },
  { kind: 'stats', title: 'Neden yerleşke, neden şimdi?', stats: [{ big: '100K+', label: 'Türkiye’de dernek' }, { big: '6.680', label: 'vakıf' }, { big: '1', label: 'ortak çatı' }], foot: 'Kurumlar çoğu zaman yalnız, kaynaklar dağınık. Yerleşke bunu ortak güce çevirir.', row: true },

  { kind: 'section', num: '02', name: 'Mekân' },
  { kind: 'list', title: 'Bedesten’de neler olacak?', intro: 'Tek yapıda, gün boyu yaşayan çok işlevli alanlar.', items: ['Ortak çalışma & atölye alanları', 'Miras kütüphanesi', 'Zanaat & tasarım atölyesi', 'Paylaşımlı depo & lojistik', 'Dijital altyapı & ofis', 'Topluluk kafesi & sergi'] },
  { kind: 'list', title: 'Koruma yaklaşımı', intro: 'Bir tarihi yapıyı yeniden işlevlendirmek, ona zarar vermek değil; onu yeniden sevmektir.', items: ['Koruma kurulu onayı + uzman restorasyon', 'Sürdürülebilir, düşük etkili yenileme', 'Herkes için erişilebilir tasarım'], reveal: true },

  { kind: 'section', num: '03', name: 'İşleyiş' },
  { kind: 'list', title: 'Kolektif akılla yönetim', intro: 'Bu yerleşke bir kurumun “sahip olduğu” değil, bir topluluğun “birlikte yaşattığı” bir mekân.', items: ['Kolektif bilinç — karar ve kaynak paylaşılır', 'Koru ve kullan — miras yaşatılır', 'Herkese açık — ayrım gözetmez'] },
  { kind: 'flow', title: 'Yerleşkede bir hafta', steps: ['Açık ofis & mentorluk', 'Eğitim atölyeleri', 'Kuluçka & üretim', 'Zanaat & tasarım', 'Topluluk & söyleşi'] },

  { kind: 'section', num: '04', name: 'Programlar' },
  { kind: 'list', title: 'Eğitim & üretim programları', items: ['Proje yazımı & fon bulma', 'Dijital okuryazarlık', 'Sivil liderlik', 'Sosyal girişim kuluçkası', 'Zanaat & miras atölyeleri'], foot: 'Çoğu ücretsiz · önce Bergamalı kurumlara açık.' },
  { kind: 'list', title: 'STK’lar için ortak kullanım', intro: 'Kira, aidat ve altyapı derdi olmadan büyümek.', items: ['Paylaşımlı adres & masa', 'Etkinlik & toplantı alanı', 'Ortak depo', 'Dijital altyapı', 'Ortak gönüllü havuzu', 'İş birliği & görünürlük'] },

  { kind: 'closing', title: 'Yerleşkenin\nbir taşı da\nsenin olsun', lines: ['Gönüllü ol, kurumunla ortak kullanıma katıl', 'ya da bireysel destekçi ol.'], qr: BERGAMA_URL, qrCaption: 'Telefonunla okut → başvuruda bulun' },
  { kind: 'thanks', title: 'Bergama', sub: 'Sosyal İnovasyon Yerleşkesi', qr: BERGAMA_URL, qrCaption: 'hangel.org/bergama' },
];

/* ── Pergamon İnovasyon Mirası Forumu sunumu ─────────────────────────────── */
export const FORUM_SLIDES: Slide[] = [
  { kind: 'title', eyebrow: 'yılda bir · uluslararası', title: 'Pergamon\nİnovasyon Mirası\nForumu', sub: 'Geçmiş, bugün ve gelecek; aynı sahnede', foot: 'Her yıl Eylül · Bergama, İzmir · TR / EN' },

  { kind: 'section', num: '01', name: 'Fikir' },
  { kind: 'body', eyebrow: 'Neden', title: 'Bilgiyi paylaşan\nbir uygarlık', lines: ['Binlerce yıl önce dünyanın bilgi başkentlerinden biri olan Pergamon’da; mirası, inovasyonu ve sivil toplumu buluşturan uluslararası bir forum.', 'Her yıl Bergama’da, insanlığın ortak geleceğini konuşmak için toplanıyoruz.'] },
  { kind: 'flow', title: 'Forumun ekseni', steps: ['Geçmiş — Miras', 'Bugün — İnovasyon', 'Gelecek — Vizyon'] },

  { kind: 'section', num: '02', name: 'Neden bu forum' },
  { kind: 'list', title: 'Konuşmaktan öte, birlikte üretmek', intro: 'Pergamon Forumu bir konferans değil; bir buluşma, bir tohum, bir ortak akıl atölyesi.', items: ['Uluslararası ölçek — çok ülkeden katılım', 'Fikir + eylem — somut iş birlikleri', 'Çift dilli — TR / EN eşzamanlı', 'Yaşayan miras sahnesi — tarihi dokuda'] },

  { kind: 'section', num: '03', name: 'Program' },
  { kind: 'list', title: '1. Gün — Geçmiş & Bugün', items: ['Ana konuşma: Pergamon’un mirası', 'Panel: Kültürel miras & inovasyon', 'Atölyeler: dijital miras, sosyal girişim', 'Panel: Bugünün sivil toplumu', 'Akşam: kültür-sanat & buluşma'] },
  { kind: 'list', title: '2. Gün — Gelecek & Eylem', items: ['Ana konuşma: İyiliğin ölçeklenmesi', 'Panel: Miras temelli kalkınma', 'Genç sesler sahnesi', 'Atölyeler: proje, fon, iş birliği', 'Ortak akıl: Bergama Bildirgesi', 'Kapanış & taahhütler'] },

  { kind: 'section', num: '04', name: 'Konuşmacılar' },
  { kind: 'list', title: 'Farklı disiplinler, tek sahne', intro: 'Forum; birbirini besleyen birçok disiplinin sahnesi.', items: ['Arkeologlar & tarihçiler', 'Bilim insanları', 'Sivil toplum liderleri', 'Tasarımcılar & sanatçılar', 'Sosyal girişimciler', 'Genç sesler'] },

  { kind: 'section', num: '05', name: 'Manifesto' },
  { kind: 'list', title: 'Neye inanıyoruz?', items: ['Miras, müzede değil hayatın içinde yaşamalı.', 'Bilgi biriktirilmez, paylaşılır; güç bölüşüldükçe büyür.', 'Sivil toplum yalnız değildir; ortak akıl ortak çözümdür.', 'Yerel olan, küresele ilham verebilir.', 'Konuşmak yetmez; her forum bir taahhütle biter.'] },
  { kind: 'body', title: 'Bergama’nın\nçağrısı', lines: ['“Bir zamanlar dünyaya bilgiyi paylaşmayı öğreten bu şehir; şimdi de iyiliği paylaşmayı öğretsin.”'] },

  { kind: 'closing', title: 'Eylül 2026’da\nBergama’da\nbuluşalım', lines: ['Katılımcı, konuşmacı, gönüllü', 'ya da kurumunla; foruma başvur.'], qr: BERGAMA_URL, qrCaption: 'Telefonunla okut → başvuruda bulun' },
  { kind: 'thanks', title: 'Pergamon', sub: 'İnovasyon Mirası Forumu', qr: BERGAMA_URL, qrCaption: 'hangel.org/bergama' },
];
