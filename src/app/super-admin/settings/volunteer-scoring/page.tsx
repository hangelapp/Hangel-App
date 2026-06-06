'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Plus, Pencil, Trash2, Loader2, ShieldCheck, Database, Search,
  Download, Upload, RotateCcw, Percent, Save, Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { COLLECTIONS } from '@/firebase/collections';

// ---------------------------------------------------------------------------
// Existing iş kalemleri (TASK TYPES) — değiştirilmedi, mevcut hesap mantığı korunur.
// ---------------------------------------------------------------------------

type ScoringItem = {
  id: string;
  taskType: string;            // "Öğretmenlik", "Boyama" gibi iş kalemi
  pointsPerHour: number;       // Bir saatlik gönüllülük için kazandırılan etki puanı
  manHourCost: number;         // Bir saat bu işin piyasa adam-saat maliyeti (TL)
  description?: string;
  isActive: boolean;
  order: number;
};

type FormData = Omit<ScoringItem, 'id'>;

const SEED_DATA: FormData[] = [
  // ── Eğitim & Mentorluk ─────────────────────────────────────────────────
  { taskType: 'Öğretmenlik / Eğitim Verme', pointsPerHour: 100, manHourCost: 200, isActive: true, order: 1, description: 'Çocuklara/yetişkinlere ders, atölye, kurs verme.' },
  { taskType: 'Akademik Ders Desteği (LGS/YKS/KPSS)', pointsPerHour: 110, manHourCost: 220, isActive: true, order: 2, description: 'Sınav hazırlık dersleri ve bireysel destek.' },
  { taskType: 'Yabancı Dil Eğitimi', pointsPerHour: 90, manHourCost: 180, isActive: true, order: 3, description: 'İngilizce/Almanca/Arapça vb. dil dersleri.' },
  { taskType: 'Okuma-Yazma Öğretimi', pointsPerHour: 90, manHourCost: 150, isActive: true, order: 4, description: 'Yetişkin okuryazarlık ve göçmen okuryazarlık desteği.' },
  { taskType: 'Mentorluk / Koçluk', pointsPerHour: 80, manHourCost: 200, isActive: true, order: 5, description: 'Genç/girişimci mentorluğu, kariyer koçluğu.' },
  { taskType: 'Atölye / Workshop Yürütücülüğü', pointsPerHour: 70, manHourCost: 150, isActive: true, order: 6, description: 'Sanat, kodlama, müzik, drama atölyeleri.' },
  { taskType: 'Sahne Sanatları Eğitimi', pointsPerHour: 60, manHourCost: 130, isActive: true, order: 7, description: 'Drama, müzik, dans eğitimi.' },

  // ── Sağlık & Psikososyal Destek ────────────────────────────────────────
  { taskType: 'Sağlık Desteği / Saha Hemşireliği', pointsPerHour: 90, manHourCost: 220, isActive: true, order: 10, description: 'Sağlık taramaları, ilk yardım, hemşirelik desteği.' },
  { taskType: 'Doktor Konsültasyonu (Pro-bono)', pointsPerHour: 130, manHourCost: 600, isActive: true, order: 11, description: 'Mülteci, evsiz, kırsal bölge için ücretsiz doktor desteği.' },
  { taskType: 'Diş Hekimi Tarama (Pro-bono)', pointsPerHour: 120, manHourCost: 500, isActive: true, order: 12, description: 'Pro-bono diş sağlığı tarama ve tedavi.' },
  { taskType: 'Psikolojik Destek / Görüşme', pointsPerHour: 100, manHourCost: 320, isActive: true, order: 13, description: 'Travma sonrası, kriz, aile danışmanlığı.' },
  { taskType: 'Psikososyal Destek (Çocuk/Genç)', pointsPerHour: 90, manHourCost: 200, isActive: true, order: 14, description: 'Yetiştirme yurdu, hastane, sığınma evi çocuk-genç programları.' },
  { taskType: 'Bağımlılıkla Mücadele Desteği', pointsPerHour: 80, manHourCost: 180, isActive: true, order: 15, description: 'Madde, alkol, kumar bağımlılığında rehberlik ve destek.' },
  { taskType: 'Beslenme Danışmanlığı', pointsPerHour: 70, manHourCost: 220, isActive: true, order: 16, description: 'Diyetisyen pro-bono danışmanlık.' },
  { taskType: 'Fizyoterapi / Rehabilitasyon Desteği', pointsPerHour: 90, manHourCost: 280, isActive: true, order: 17, description: 'Engelli, yaşlı, post-trauma rehabilitasyon.' },

  // ── Uzman Danışmanlık ─────────────────────────────────────────────────
  { taskType: 'Genel Mesleki Danışmanlık', pointsPerHour: 80, manHourCost: 250, isActive: true, order: 20, description: 'STK proje, iş geliştirme, strateji.' },
  { taskType: 'Hukuki Destek (Pro-bono)', pointsPerHour: 110, manHourCost: 400, isActive: true, order: 21, description: 'Pro-bono hukuki danışmanlık ve süreç yönetimi.' },
  { taskType: 'Mali Müşavirlik / Muhasebe', pointsPerHour: 90, manHourCost: 300, isActive: true, order: 22, description: 'STK muhasebe, vergi, denetim desteği.' },
  { taskType: 'İK / Personel Danışmanlığı', pointsPerHour: 70, manHourCost: 220, isActive: true, order: 23, description: 'İşe alım, performans, organizasyon yapısı.' },
  { taskType: 'Strateji ve Yönetim Danışmanlığı', pointsPerHour: 90, manHourCost: 350, isActive: true, order: 24, description: 'STK iş planı, kurumsal kapasite gelişimi.' },
  { taskType: 'Fon Geliştirme / Fundraising', pointsPerHour: 90, manHourCost: 280, isActive: true, order: 25, description: 'Hibe yazımı, bağışçı ilişkileri, kampanya.' },

  // ── Dijital & Yaratıcı ───────────────────────────────────────────────
  { taskType: 'Web / Yazılım Geliştirme', pointsPerHour: 100, manHourCost: 350, isActive: true, order: 30, description: 'STK web sitesi, dijital araç ve sistem geliştirme.' },
  { taskType: 'Mobil Uygulama Geliştirme', pointsPerHour: 110, manHourCost: 380, isActive: true, order: 31, description: 'iOS/Android STK uygulamaları.' },
  { taskType: 'UX / UI Tasarım', pointsPerHour: 90, manHourCost: 280, isActive: true, order: 32, description: 'Kullanıcı arayüzü ve deneyim tasarımı.' },
  { taskType: 'Grafik Tasarım / Görsel İletişim', pointsPerHour: 70, manHourCost: 180, isActive: true, order: 33, description: 'Logo, afiş, broşür, sosyal medya görselleri.' },
  { taskType: 'Video Prodüksiyon / Editing', pointsPerHour: 80, manHourCost: 220, isActive: true, order: 34, description: 'Tanıtım filmi, sosyal medya videosu, belgesel.' },
  { taskType: 'Fotoğrafçılık', pointsPerHour: 70, manHourCost: 180, isActive: true, order: 35, description: 'Etkinlik, portre, kampanya fotoğrafları.' },
  { taskType: 'Veri Bilimi / Analiz', pointsPerHour: 100, manHourCost: 350, isActive: true, order: 36, description: 'STK için veri görselleştirme, ML modeli, dashboard.' },
  { taskType: 'Siber Güvenlik Denetimi', pointsPerHour: 120, manHourCost: 450, isActive: true, order: 37, description: 'STK altyapı güvenlik analizi.' },
  { taskType: 'IT Destek / Sistem Yönetimi', pointsPerHour: 70, manHourCost: 200, isActive: true, order: 38, description: 'Bilgisayar bakım, ağ kurulumu, kullanıcı desteği.' },

  // ── İletişim & Medya ─────────────────────────────────────────────────
  { taskType: 'Sosyal Medya / Topluluk Yönetimi', pointsPerHour: 50, manHourCost: 120, isActive: true, order: 40, description: 'İçerik üretimi, hesap yönetimi, paylaşım planlama.' },
  { taskType: 'İçerik Üreticiliği / Yazı', pointsPerHour: 60, manHourCost: 150, isActive: true, order: 41, description: 'Blog, basın bülteni, e-bülten yazımı.' },
  { taskType: 'Halkla İlişkiler / Basın', pointsPerHour: 80, manHourCost: 220, isActive: true, order: 42, description: 'Basın bülteni, gazeteci ilişkileri, kampanya iletişimi.' },
  { taskType: 'Tercümanlık (Yazılı)', pointsPerHour: 70, manHourCost: 180, isActive: true, order: 43, description: 'Yazılı çeviri — rapor, sözleşme, web içeriği.' },
  { taskType: 'Tercümanlık (Sözlü / Eşzamanlı)', pointsPerHour: 90, manHourCost: 280, isActive: true, order: 44, description: 'Toplantı, konferans, mülteci hizmetlerinde sözlü çeviri.' },
  { taskType: 'Podcast / Radyo Prodüksiyon', pointsPerHour: 70, manHourCost: 200, isActive: true, order: 45, description: 'STK temalı podcast, radyo programı hazırlama.' },

  // ── Saha & Operasyon ────────────────────────────────────────────────
  { taskType: 'Etkinlik Organizasyonu', pointsPerHour: 50, manHourCost: 130, isActive: true, order: 50, description: 'Etkinlik koordinasyonu, lojistik, saha düzeni.' },
  { taskType: 'Fuar / Stant Görevi', pointsPerHour: 40, manHourCost: 100, isActive: true, order: 51, description: 'STK tanıtım stantında görevlilik.' },
  { taskType: 'Kayıt / Karşılama / Misafir Yönlendirme', pointsPerHour: 35, manHourCost: 80, isActive: true, order: 52, description: 'Etkinliklerde kayıt masası, karşılama, yönlendirme.' },
  { taskType: 'Saha Koordinasyonu', pointsPerHour: 60, manHourCost: 150, isActive: true, order: 53, description: 'Saha ekibi sevk-yönetim, lojistik koordinasyon.' },
  { taskType: 'Yardım Dağıtımı', pointsPerHour: 30, manHourCost: 80, isActive: true, order: 54, description: 'Gıda, giysi, kit dağıtımı saha çalışması.' },
  { taskType: 'Saha Görevlisi (Genel)', pointsPerHour: 30, manHourCost: 80, isActive: true, order: 55, description: 'Genel saha desteği, görev rotasyonu.' },
  { taskType: 'Ulaşım / Şoförlük', pointsPerHour: 40, manHourCost: 110, isActive: true, order: 56, description: 'Yardım malzemesi/gönüllü taşıma.' },

  // ── Afet & Acil Durum ───────────────────────────────────────────────
  { taskType: 'Anlık Müdahale (Afet)', pointsPerHour: 120, manHourCost: 280, isActive: true, order: 60, description: 'Afet bölgesinde acil müdahale, arama-kurtarma desteği.' },
  { taskType: 'Arama-Kurtarma (Eğitimli)', pointsPerHour: 130, manHourCost: 350, isActive: true, order: 61, description: 'AKUT, AFAD eğitimli arama-kurtarma.' },
  { taskType: 'Acil Sağlık Desteği', pointsPerHour: 110, manHourCost: 250, isActive: true, order: 62, description: 'Paramedik, ilk yardım eğitimli müdahale.' },
  { taskType: 'Lojistik Depo Yönetimi (Acil)', pointsPerHour: 60, manHourCost: 130, isActive: true, order: 63, description: 'Afet bölgesi depo ve lojistik koordinasyon.' },

  // ── Bakım & Refakat ─────────────────────────────────────────────────
  { taskType: 'Yaşlı Bakım & Refakat', pointsPerHour: 50, manHourCost: 110, isActive: true, order: 70, description: 'Refakat, sosyal aktivite, evde destek.' },
  { taskType: 'Çocuk Bakımı / Refakat', pointsPerHour: 55, manHourCost: 110, isActive: true, order: 71, description: 'Çocuk refakatı, hastane, etkinlik desteği.' },
  { taskType: 'Engelli Bakım & Refakat', pointsPerHour: 60, manHourCost: 130, isActive: true, order: 72, description: 'Engelli birey eşliği, sosyalleşme, gezi.' },
  { taskType: 'Hayvan Bakımı (Barınak)', pointsPerHour: 40, manHourCost: 90, isActive: true, order: 73, description: 'Sokak/barınak hayvanlarına bakım, mama dağıtımı.' },
  { taskType: 'Sokak Hayvanı Beslenme/Tedavi', pointsPerHour: 45, manHourCost: 100, isActive: true, order: 74, description: 'Mama dağıtımı, basit yara müdahalesi, kısırlaştırma takibi.' },

  // ── Çevre & Sürdürülebilirlik ───────────────────────────────────────
  { taskType: 'Doğa / Çevre Çalışması', pointsPerHour: 40, manHourCost: 80, isActive: true, order: 80, description: 'Ağaçlandırma, sahil temizliği, biyoçeşitlilik.' },
  { taskType: 'Ağaçlandırma & Fidan Dikimi', pointsPerHour: 50, manHourCost: 100, isActive: true, order: 81, description: 'Toplu fidan dikim etkinlikleri.' },
  { taskType: 'Geri Dönüşüm / Atık Toplama', pointsPerHour: 35, manHourCost: 70, isActive: true, order: 82, description: 'Şehir, sahil, doğa alanı temizlik kampanyaları.' },
  { taskType: 'Biyoçeşitlilik İzleme', pointsPerHour: 60, manHourCost: 140, isActive: true, order: 83, description: 'Sayım, gözlem, raporlama (kuşlar, denizler, vd.).' },

  // ── Fiziksel İş & Tadilat ──────────────────────────────────────────
  { taskType: 'Boyama / Tadilat', pointsPerHour: 50, manHourCost: 110, isActive: true, order: 90, description: 'Okul, barınak vb. mekan boyama, küçük tadilat.' },
  { taskType: 'Marangoz / Mobilya Onarımı', pointsPerHour: 60, manHourCost: 150, isActive: true, order: 91, description: 'Okul/yurt mobilya onarım, basit ahşap işleri.' },
  { taskType: 'Elektrik / Tesisat Onarımı', pointsPerHour: 70, manHourCost: 170, isActive: true, order: 92, description: 'Basit elektrik tesisat, su tesisat onarımı.' },
  { taskType: 'Bahçıvanlık / Peyzaj', pointsPerHour: 40, manHourCost: 90, isActive: true, order: 93, description: 'Okul, hastane, park bakım.' },
  { taskType: 'Temizlik', pointsPerHour: 30, manHourCost: 70, isActive: true, order: 94, description: 'Mekan temizliği veya çevre temizliği.' },
  { taskType: 'İnşaat Saha Yardımı', pointsPerHour: 45, manHourCost: 110, isActive: true, order: 95, description: 'Habitat for Humanity tipi ev yapım yardımı.' },

  // ── Spor & Sağlıklı Yaşam ──────────────────────────────────────────
  { taskType: 'Spor Eğitmenliği / Antrenörlük', pointsPerHour: 60, manHourCost: 150, isActive: true, order: 100, description: 'Çocuk-genç-engelli spor antrenmanları.' },
  { taskType: 'Yoga / Pilates / Hareket Eğitimi', pointsPerHour: 60, manHourCost: 160, isActive: true, order: 101, description: 'Yetiştirme yurdu, kadın sığınma evi gibi yerlerde.' },

  // ── Veri & Arşiv ──────────────────────────────────────────────────
  { taskType: 'Veri Girişi / Arşivleme', pointsPerHour: 25, manHourCost: 60, isActive: true, order: 110, description: 'Form girişi, veri tabanı düzenleme, arşivleme.' },
  { taskType: 'Anket Saha Görevlisi', pointsPerHour: 30, manHourCost: 80, isActive: true, order: 111, description: 'Saha anketi, veri toplama.' },
  { taskType: 'Araştırma / Literatür Tarama', pointsPerHour: 60, manHourCost: 150, isActive: true, order: 112, description: 'STK projesi için akademik araştırma desteği.' },
  { taskType: 'Çağrı Merkezi Desteği', pointsPerHour: 35, manHourCost: 80, isActive: true, order: 113, description: 'Yardım hattı, bilgilendirme hattı görevlisi.' },

  // ── Mutfak & İkram ──────────────────────────────────────────────
  { taskType: 'Aşçılık / Mutfak Yardımı', pointsPerHour: 45, manHourCost: 110, isActive: true, order: 120, description: 'Aşevi, hayır mutfağı yemek hazırlığı.' },
  { taskType: 'Gıda Bankası Sıralama', pointsPerHour: 30, manHourCost: 70, isActive: true, order: 121, description: 'Gıda bankasında toplama, sıralama, paketleme.' },
];

// ---------------------------------------------------------------------------
// Profession catalog (ISCO-08) — `src/lib/volunteer/professions.ts`'ten alınır
// ve bu sayfanın local Profession type'ına map edilir.
// ---------------------------------------------------------------------------
import { PROFESSIONS as CATALOG_PROFESSIONS } from '@/lib/volunteer/professions';

type ProfessionCategory =
  | 'managers'
  | 'professionals'
  | 'technicians'
  | 'clerical'
  | 'services'
  | 'agriculture'
  | 'craft'
  | 'plant'
  | 'elementary'
  | 'military'
  | 'other';

type Profession = {
  id: string;
  nameTr: string;
  nameEn: string;
  iscoCode: string;
  category: ProfessionCategory;
  defaultRate: number;
  /** Saat başı Sosyal Etki Puanı — yeni alan. */
  defaultPoints: number;
};

const CATEGORY_LABELS: Record<ProfessionCategory, { tr: string; en: string }> = {
  managers:      { tr: 'Yöneticiler',                     en: 'Managers' },
  professionals: { tr: 'Profesyoneller',                  en: 'Professionals' },
  technicians:   { tr: 'Teknisyenler / Yardımcılar',      en: 'Technicians' },
  clerical:      { tr: 'Büro Çalışanları',                en: 'Clerical' },
  services:      { tr: 'Hizmet ve Satış',                 en: 'Services & Sales' },
  agriculture:   { tr: 'Tarım, Ormancılık, Balıkçılık',   en: 'Agriculture' },
  craft:         { tr: 'Sanatkârlar / Zanaatkârlar',      en: 'Craft & Trades' },
  plant:         { tr: 'Operatör / Montajcı',             en: 'Plant & Machine Operators' },
  elementary:    { tr: 'Nitelik Gerektirmeyen Meslekler', en: 'Elementary Occupations' },
  military:      { tr: 'Silahlı Kuvvetler',               en: 'Armed Forces' },
  other:         { tr: 'Diğer',                           en: 'Other' },
};

// ---------------------------------------------------------------------------
// Override doc shape: volunteerScoring/professions
//   { rates: { [professionId]: number }, points: { [professionId]: number }, updatedAt: Timestamp }
// ---------------------------------------------------------------------------
type ProfessionOverridesDoc = {
  rates?: Record<string, number>;
  /** Saat başı puan override'ları — Sosyal Etki Puanı hesabı için. */
  points?: Record<string, number>;
};

// Catalog → page-local Profession map.
// C1 categories: manager/professional/technician/.../armed/special
// Bu sayfa categories: managers/professionals/technicians/.../military/other
const CATEGORY_MAP: Record<string, ProfessionCategory> = {
  manager: 'managers',
  professional: 'professionals',
  technician: 'technicians',
  clerical: 'clerical',
  service: 'services',
  sales: 'services',
  agriculture: 'agriculture',
  craft: 'craft',
  plant: 'plant',
  elementary: 'elementary',
  armed: 'military',
  special: 'other',
};

const PROFESSIONS: Profession[] = CATALOG_PROFESSIONS.map((p) => ({
  id: p.id,
  nameTr: p.name,
  nameEn: p.nameEn || p.name,
  iscoCode: p.isco,
  category: CATEGORY_MAP[p.category] || 'other',
  defaultRate: p.hourlyRateTRY,
  defaultPoints: p.pointsPerHour,
}));

// ---------------------------------------------------------------------------
// Editor for task-type catalog (mevcut, dokunulmadı)
// ---------------------------------------------------------------------------
const Editor = ({ initial, onSave, trigger }: {
  initial?: ScoringItem;
  onSave: (data: FormData, id?: string) => Promise<void>;
  trigger: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<FormData>(initial || {
    taskType: '', pointsPerHour: 0, manHourCost: 0, description: '', isActive: true, order: 999,
  });
  const [saving, setSaving] = useState(false);

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) {
      setData(initial || { taskType: '', pointsPerHour: 0, manHourCost: 0, description: '', isActive: true, order: 999 });
    }
  };

  const handleSave = async () => {
    if (!data.taskType.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...data, taskType: data.taskType.trim() }, initial?.id);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Kalemi Düzenle' : 'Yeni İş Kalemi Ekle'}</DialogTitle>
          <DialogDescription>
            Gönüllülük ilanlarında seçilebilen iş kalemi; etki puanı ve adam-saat maliyetini buradan yönet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>İş Kalemi Adı *</Label>
            <Input value={data.taskType} onChange={e => setData({ ...data, taskType: e.target.value })} placeholder="Örn: Öğretmenlik" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Saat Başı Etki Puanı *</Label>
              <Input
                type="number"
                min={0}
                value={data.pointsPerHour}
                onChange={e => setData({ ...data, pointsPerHour: Number(e.target.value) || 0 })}
                placeholder="Örn: 80"
              />
              <p className="text-[10px] text-muted-foreground">Bir saatlik gönüllülük için kazandırılır.</p>
            </div>
            <div className="space-y-2">
              <Label>Adam-Saat Maliyeti (₺) *</Label>
              <Input
                type="number"
                min={0}
                value={data.manHourCost}
                onChange={e => setData({ ...data, manHourCost: Number(e.target.value) || 0 })}
                placeholder="Örn: 200"
              />
              <p className="text-[10px] text-muted-foreground">Sosyal etki mali değer hesaplamasında kullanılır.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Açıklama (opsiyonel)</Label>
            <Input
              value={data.description || ''}
              onChange={e => setData({ ...data, description: e.target.value })}
              placeholder="Bu kalem hangi tür işleri kapsar?"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sıra</Label>
              <Input
                type="number"
                value={data.order}
                onChange={e => setData({ ...data, order: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-end justify-between gap-3 p-3 border rounded-lg">
              <Label className="font-medium">Aktif</Label>
              <Switch checked={data.isActive} onCheckedChange={(v) => setData({ ...data, isActive: v })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
          <Button onClick={handleSave} disabled={saving || !data.taskType.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Helpers — CSV
// ---------------------------------------------------------------------------
const csvEscape = (s: string): string => {
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const buildProfessionsCsv = (
  rows: Profession[],
  effectiveRate: (id: string) => number,
  effectivePoints: (id: string) => number,
  overrideRateOf: (id: string) => number | undefined,
  overridePointsOf: (id: string) => number | undefined,
): string => {
  const head = [
    'id', 'isco', 'nameTr', 'nameEn', 'category',
    'defaultRate', 'overrideRate', 'effectiveRate',
    'defaultPoints', 'overridePoints', 'effectivePoints',
  ];
  const lines = [head.join(',')];
  for (const p of rows) {
    const ovR = overrideRateOf(p.id);
    const ovP = overridePointsOf(p.id);
    lines.push([
      csvEscape(p.id),
      csvEscape(p.iscoCode),
      csvEscape(p.nameTr),
      csvEscape(p.nameEn),
      csvEscape(p.category),
      String(p.defaultRate),
      ovR === undefined ? '' : String(ovR),
      String(effectiveRate(p.id)),
      String(p.defaultPoints),
      ovP === undefined ? '' : String(ovP),
      String(effectivePoints(p.id)),
    ].join(','));
  }
  return lines.join('\n');
};

const parseProfessionsCsv = (csv: string): { rates: Record<string, number>; points: Record<string, number> } => {
  // Beklenen kolonlar: id, overrideRate, overridePoints (header'a göre dinamik bulunur).
  const outRates: Record<string, number> = {};
  const outPoints: Record<string, number> = {};
  const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { rates: outRates, points: outPoints };
  const splitLine = (line: string): string[] => {
    const cells: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQ = false; }
        else cur += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === ',') { cells.push(cur); cur = ''; }
        else cur += ch;
      }
    }
    cells.push(cur);
    return cells;
  };
  const header = splitLine(lines[0]).map(c => c.trim());
  const idIdx = header.indexOf('id');
  const ovRateIdx = header.indexOf('overrideRate');
  const ovPointsIdx = header.indexOf('overridePoints');
  if (idIdx === -1) throw new Error('CSV "id" sütunu eksik.');
  if (ovRateIdx === -1 && ovPointsIdx === -1) {
    throw new Error('CSV "overrideRate" veya "overridePoints" sütunu eksik.');
  }
  for (let r = 1; r < lines.length; r++) {
    const cells = splitLine(lines[r]);
    const id = (cells[idIdx] || '').trim();
    if (!id) continue;
    if (ovRateIdx !== -1) {
      const raw = (cells[ovRateIdx] || '').trim();
      if (raw !== '') {
        const num = Number(raw.replace(',', '.'));
        if (Number.isFinite(num) && num >= 0) outRates[id] = Math.round(num * 100) / 100;
      }
    }
    if (ovPointsIdx !== -1) {
      const raw = (cells[ovPointsIdx] || '').trim();
      if (raw !== '') {
        const num = Number(raw.replace(',', '.'));
        if (Number.isFinite(num) && num >= 0) outPoints[id] = Math.round(num * 100) / 100;
      }
    }
  }
  return { rates: outRates, points: outPoints };
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const PAGE_SIZE = 20;

export default function VolunteerScoringPage() {
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);

  // --- Task type catalog (mevcut) ---
  const itemsQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.volunteerScoring), orderBy('order', 'asc')) : null),
    [db],
  );
  const { data: items, isLoading } = useCollection<ScoringItem>(itemsQuery);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(i => i.taskType.toLowerCase().includes(q));
  }, [items, search]);

  const handleSave = async (data: FormData, id?: string) => {
    try {
      if (id) {
        await updateDoc(doc(db, COLLECTIONS.volunteerScoring, id), { ...data, updatedAt: serverTimestamp() });
        toast({ title: 'Güncellendi', description: `${data.taskType} kaydedildi.` });
      } else {
        await addDoc(collection(db, COLLECTIONS.volunteerScoring), {
          ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        toast({ title: 'Eklendi', description: `${data.taskType} kataloğa eklendi.` });
      }
    } catch (e) {
      const err = e as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: 'Kaydedilemedi',
        description: err.code === 'permission-denied'
          ? 'Bu işlem için süper-admin yetkisi gerekli.'
          : (err.message || 'Beklenmeyen bir hata oluştu.'),
      });
    }
  };

  const handleDelete = async (item: ScoringItem) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.volunteerScoring, item.id));
      toast({ title: 'Silindi', description: `${item.taskType} kataloğdan kaldırıldı.` });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: 'Silinemedi',
        description: err.code === 'permission-denied'
          ? 'Bu işlem için süper-admin yetkisi gerekli.'
          : (err.message || 'Beklenmeyen hata.'),
      });
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      if ((items?.length || 0) > 0) {
        toast({ variant: 'destructive', title: 'Zaten veri var', description: 'Önce mevcut katalogu temizleyin ya da elle ekleyin.' });
        return;
      }
      for (const it of SEED_DATA) {
        const ref = doc(collection(db, COLLECTIONS.volunteerScoring));
        await setDoc(ref, { ...it, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      toast({ title: 'Katalog dolduruldu', description: `${SEED_DATA.length} varsayılan iş kalemi eklendi.` });
    } catch (e) {
      const err = e as { message?: string };
      toast({ variant: 'destructive', title: 'Seed hatası', description: err.message || 'Beklenmeyen hata.' });
    } finally {
      setSeeding(false);
    }
  };

  // --- Profession catalog (yeni) ---
  const overridesRef = useMemoFirebase(
    () => (db ? doc(db, COLLECTIONS.volunteerScoring, 'professions') : null),
    [db],
  );
  const { data: overridesDoc, isLoading: overridesLoading } = useDoc<ProfessionOverridesDoc>(overridesRef);

  // Eğer fallback boşsa kullanıcıyı uyaralım (yumuşak).
  useEffect(() => {
    if (PROFESSIONS.length === 0) {
      // eslint-disable-next-line no-console
      console.error('[volunteer-scoring] PROFESSIONS fallback boş — src/lib/volunteer/professions.ts henüz hazır değil.');
    }
  }, []);

  const persistedOverrides = useMemo<Record<string, number>>(
    () => (overridesDoc?.rates && typeof overridesDoc.rates === 'object' ? { ...overridesDoc.rates } : {}),
    [overridesDoc],
  );
  const persistedPointOverrides = useMemo<Record<string, number>>(
    () => (overridesDoc?.points && typeof overridesDoc.points === 'object' ? { ...overridesDoc.points } : {}),
    [overridesDoc],
  );

  // Local draft overrides (kullanıcı edit eder, "Tümünü kaydet" ile flush edilir).
  const [draftOverrides, setDraftOverrides] = useState<Record<string, number | undefined>>({});
  const [draftPointOverrides, setDraftPointOverrides] = useState<Record<string, number | undefined>>({});
  const [savingOverrides, setSavingOverrides] = useState(false);

  // Persisted → draft senkronizasyonu.
  useEffect(() => {
    setDraftOverrides({});
  }, [persistedOverrides]);
  useEffect(() => {
    setDraftPointOverrides({});
  }, [persistedPointOverrides]);

  const effectiveRate = (p: Profession): number => {
    const draft = draftOverrides[p.id];
    if (draft !== undefined) return draft;
    const ov = persistedOverrides[p.id];
    return typeof ov === 'number' ? ov : p.defaultRate;
  };

  const effectivePoints = (p: Profession): number => {
    const draft = draftPointOverrides[p.id];
    if (draft !== undefined) return draft;
    const ov = persistedPointOverrides[p.id];
    return typeof ov === 'number' ? ov : p.defaultPoints;
  };

  const overrideOf = (p: Profession): number | undefined => {
    const draft = draftOverrides[p.id];
    if (draft !== undefined) return draft;
    return typeof persistedOverrides[p.id] === 'number' ? persistedOverrides[p.id] : undefined;
  };

  const overridePointsOf = (p: Profession): number | undefined => {
    const draft = draftPointOverrides[p.id];
    if (draft !== undefined) return draft;
    return typeof persistedPointOverrides[p.id] === 'number' ? persistedPointOverrides[p.id] : undefined;
  };

  const isDirty = (p: Profession): boolean => {
    const rateChanged = (p.id in draftOverrides) && draftOverrides[p.id] !== persistedOverrides[p.id];
    const pointChanged = (p.id in draftPointOverrides) && draftPointOverrides[p.id] !== persistedPointOverrides[p.id];
    return rateChanged || pointChanged;
  };

  const dirtyCount = useMemo(
    () => PROFESSIONS.filter((p) => isDirty(p)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draftOverrides, draftPointOverrides, persistedOverrides, persistedPointOverrides],
  );

  // Profession filters & paging
  const [profSearch, setProfSearch] = useState('');
  const [profCategory, setProfCategory] = useState<ProfessionCategory | 'all'>('all');
  const [profPage, setProfPage] = useState(1);

  useEffect(() => { setProfPage(1); }, [profSearch, profCategory]);

  const filteredProfessions = useMemo(() => {
    const q = profSearch.toLowerCase().trim();
    return PROFESSIONS.filter((p) => {
      if (profCategory !== 'all' && p.category !== profCategory) return false;
      if (!q) return true;
      return (
        p.nameTr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.iscoCode.includes(q) ||
        p.id.includes(q)
      );
    });
  }, [profSearch, profCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProfessions.length / PAGE_SIZE));
  const pageRows = filteredProfessions.slice((profPage - 1) * PAGE_SIZE, profPage * PAGE_SIZE);

  const setRowRate = (id: string, raw: string) => {
    const v = raw.trim();
    if (v === '') {
      setDraftOverrides((d) => ({ ...d, [id]: undefined }));
      return;
    }
    const num = Number(v.replace(',', '.'));
    if (!Number.isFinite(num) || num < 0) return;
    setDraftOverrides((d) => ({ ...d, [id]: Math.round(num * 100) / 100 }));
  };

  const setRowPoints = (id: string, raw: string) => {
    const v = raw.trim();
    if (v === '') {
      setDraftPointOverrides((d) => ({ ...d, [id]: undefined }));
      return;
    }
    const num = Number(v.replace(',', '.'));
    if (!Number.isFinite(num) || num < 0) return;
    setDraftPointOverrides((d) => ({ ...d, [id]: Math.round(num * 100) / 100 }));
  };

  const resetRow = (p: Profession) => {
    setDraftOverrides((d) => {
      const next = { ...d };
      if (p.id in persistedOverrides) next[p.id] = undefined;
      else delete next[p.id];
      return next;
    });
    setDraftPointOverrides((d) => {
      const next = { ...d };
      if (p.id in persistedPointOverrides) next[p.id] = undefined;
      else delete next[p.id];
      return next;
    });
  };

  const persistOverrides = async (nextRates: Record<string, number>, nextPoints: Record<string, number>) => {
    if (!db) return;
    if (!overridesRef) return;
    setSavingOverrides(true);
    try {
      await setDoc(
        overridesRef,
        { rates: nextRates, points: nextPoints, updatedAt: serverTimestamp() },
        { merge: true },
      );
      const rateCount = Object.keys(nextRates).length;
      const pointCount = Object.keys(nextPoints).length;
      toast({
        title: 'Override\'lar kaydedildi',
        description: `${rateCount} ücret + ${pointCount} puan override aktif.`,
      });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: 'Kaydedilemedi',
        description: err.code === 'permission-denied'
          ? 'Bu işlem için süper-admin yetkisi gerekli.'
          : (err.message || 'Beklenmeyen hata.'),
      });
    } finally {
      setSavingOverrides(false);
    }
  };

  const handleSaveAll = async () => {
    const mergedRates: Record<string, number> = { ...persistedOverrides };
    for (const [id, val] of Object.entries(draftOverrides)) {
      if (val === undefined) delete mergedRates[id];
      else mergedRates[id] = val;
    }
    const mergedPoints: Record<string, number> = { ...persistedPointOverrides };
    for (const [id, val] of Object.entries(draftPointOverrides)) {
      if (val === undefined) delete mergedPoints[id];
      else mergedPoints[id] = val;
    }
    await persistOverrides(mergedRates, mergedPoints);
  };

  const handleResetAllToDefault = async () => {
    await persistOverrides({}, {});
  };

  // Bulk adjust (% inflation)
  const [bulkPct, setBulkPct] = useState<string>('10');
  const [bulkOpen, setBulkOpen] = useState(false);
  const applyBulkPct = () => {
    const pct = Number(bulkPct.replace(',', '.'));
    if (!Number.isFinite(pct)) {
      toast({ variant: 'destructive', title: 'Geçersiz yüzde', description: 'Sayı girin (örn: 10 veya -5).' });
      return;
    }
    const factor = 1 + pct / 100;
    const draft: Record<string, number | undefined> = { ...draftOverrides };
    for (const p of PROFESSIONS) {
      const base = effectiveRate(p);
      draft[p.id] = Math.round(base * factor * 100) / 100;
    }
    setDraftOverrides(draft);
    setBulkOpen(false);
    toast({
      title: 'Yüzdelik uygulandı',
      description: `${PROFESSIONS.length} kalem ${pct >= 0 ? '+' : ''}${pct}% güncellendi. "Tüm değişiklikleri kaydet" ile yaz.`,
    });
  };

  // CSV
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleExportCsv = () => {
    const csv = buildProfessionsCsv(
      PROFESSIONS,
      (id) => {
        const p = PROFESSIONS.find((x) => x.id === id);
        return p ? effectiveRate(p) : 0;
      },
      (id) => {
        const p = PROFESSIONS.find((x) => x.id === id);
        return p ? effectivePoints(p) : 0;
      },
      (id) => {
        const draft = draftOverrides[id];
        if (draft !== undefined) return draft;
        return typeof persistedOverrides[id] === 'number' ? persistedOverrides[id] : undefined;
      },
      (id) => {
        const draft = draftPointOverrides[id];
        if (draft !== undefined) return draft;
        return typeof persistedPointOverrides[id] === 'number' ? persistedPointOverrides[id] : undefined;
      },
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volunteer-professions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseProfessionsCsv(text);
      const draftR: Record<string, number | undefined> = { ...draftOverrides };
      const draftP: Record<string, number | undefined> = { ...draftPointOverrides };
      let touchedR = 0;
      let touchedP = 0;
      for (const [id, val] of Object.entries(parsed.rates)) {
        if (PROFESSIONS.some((p) => p.id === id)) {
          draftR[id] = val;
          touchedR++;
        }
      }
      for (const [id, val] of Object.entries(parsed.points)) {
        if (PROFESSIONS.some((p) => p.id === id)) {
          draftP[id] = val;
          touchedP++;
        }
      }
      setDraftOverrides(draftR);
      setDraftPointOverrides(draftP);
      toast({
        title: 'CSV içe aktarıldı',
        description: `${touchedR} ücret + ${touchedP} puan değişti. Kaydetmeyi unutmayın.`,
      });
    } catch (e) {
      const err = e as { message?: string };
      toast({ variant: 'destructive', title: 'CSV okunamadı', description: err.message || 'Beklenmeyen hata.' });
    }
  };

  const categoryEntries = useMemo(
    () => (Object.keys(CATEGORY_LABELS) as ProfessionCategory[]),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button onClick={() => router.back()} variant="ghost" size="icon" aria-label="Geri">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">Gönüllülük Puantajı</h1>
          <p className="text-sm text-muted-foreground">
            STK gönüllülük ilanlarının saat başı etki puanı + adam-saat maliyeti ve meslek bazlı saatlik ücret katalogu burada yönetilir.
          </p>
        </div>
      </div>

      <Card className="bg-amber-50/40 border-amber-200">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-bold">Süper-Admin Politikası</p>
            <p className="text-muted-foreground">
              STK yöneticileri ilan açarken artık puan giremez; bu kataloğdan iş kalemi seçer.
              Puan = saat başı puan × tahmini gönüllülük süresi (saat).
              Adam-saat maliyeti, kullanıcının &quot;Sosyal Etki Mali Değeri&quot; hesabında kullanılır.
              Meslek bazlı saatlik ücretler ise gönüllünün mesleğine göre kişisel etki mali değerini hesaplamak için kullanılır.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">İş Kalemleri</TabsTrigger>
          <TabsTrigger value="professions">
            Meslek Saatlik Ücretleri ({PROFESSIONS.length})
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------ */}
        {/* TAB 1: İş Kalemleri (mevcut, değiştirilmedi) */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>İş Kalemleri Kataloğu</CardTitle>
                <CardDescription>
                  Süper-admin yeni kalem ekleyebilir, mevcut kalemlerin puan ve adam-saat maliyetini değiştirebilir.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {(!items || items.length === 0) && (
                  <Button variant="outline" onClick={handleSeed} disabled={seeding}>
                    {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                    Varsayılanları Yükle ({SEED_DATA.length})
                  </Button>
                )}
                <Editor
                  onSave={handleSave}
                  trigger={
                    <Button><Plus className="mr-2 h-4 w-4" /> Yeni Kalem Ekle</Button>
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="İş kalemi adı ile ara..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Kayıtlı iş kalemi yok. &quot;Varsayılanları Yükle&quot; ile başlayabilirsin.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>İş Kalemi</TableHead>
                        <TableHead className="text-right">Saat / Puan</TableHead>
                        <TableHead className="text-right">Adam-Saat (₺)</TableHead>
                        <TableHead className="text-center w-20">Durum</TableHead>
                        <TableHead className="text-right w-32">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium">{item.taskType}</div>
                            {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums">
                            {item.pointsPerHour.toLocaleString('tr-TR')}
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums">
                            {item.manHourCost.toLocaleString('tr-TR')} ₺
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={item.isActive ? 'default' : 'outline'} className="text-[10px]">
                              {item.isActive ? 'Aktif' : 'Pasif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex gap-1">
                              <Editor
                                initial={item}
                                onSave={handleSave}
                                trigger={
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>İş kalemini silmek istediğine emin misin?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      <span className="font-bold">{item.taskType}</span> kataloğdan kaldırılacak. STK yöneticileri bu kalemi yeni ilanlarda seçemez. Eski ilanlardaki kayıtlı puan değişmez.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                    <AlertDialogAction
                                      className={cn(buttonVariants({ variant: 'destructive' }))}
                                      onClick={() => handleDelete(item)}>
                                      Sil
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* TAB 2: Meslek Saatlik Ücretleri (YENİ) */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="professions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>Meslek Saatlik Ücretleri (ISCO-08)</CardTitle>
                <CardDescription>
                  Her meslek için varsayılan saatlik ücret <code>professions.ts</code> kaynağından gelir.
                  Buradan override yazıldığında Firestore <code>volunteerScoring/professions</code> dokümanı güncellenir.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={PROFESSIONS.length === 0}>
                  <Download className="mr-2 h-4 w-4" /> CSV indir
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImportCsv(f);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={PROFESSIONS.length === 0}
                >
                  <Upload className="mr-2 h-4 w-4" /> CSV yükle
                </Button>
                <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={PROFESSIONS.length === 0}>
                      <Percent className="mr-2 h-4 w-4" /> Toplu %
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Toplu yüzdelik ayarı</DialogTitle>
                      <DialogDescription>
                        Tüm rate&apos;ler bu yüzde kadar arttırılır/azaltılır. Negatif değer indirim demektir. Kayıt değil draft uygulanır.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                      <Label>Yüzde</Label>
                      <Input
                        type="number"
                        value={bulkPct}
                        onChange={(e) => setBulkPct(e.target.value)}
                        placeholder="Örn: 10 (= +%10)"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBulkOpen(false)}>İptal</Button>
                      <Button onClick={applyBulkPct}>Uygula</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={Object.keys(persistedOverrides).length === 0}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Default&apos;a sıfırla
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tüm override&apos;ları silmek istediğine emin misin?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Firestore&apos;daki tüm meslek override&apos;ları silinir, herkes <code>professions.ts</code>&apos;teki default değere döner.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetAllToDefault}>Sıfırla</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button onClick={handleSaveAll} disabled={savingOverrides || dirtyCount === 0}>
                  {savingOverrides ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Tüm değişiklikleri kaydet{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtreler */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Meslek adı, ISCO kodu veya id ile ara..."
                    value={profSearch}
                    onChange={(e) => setProfSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={profCategory}
                  onValueChange={(v) => setProfCategory(v as ProfessionCategory | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm Kategoriler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    {categoryEntries.map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORY_LABELS[c].tr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tablo */}
              {PROFESSIONS.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg space-y-2">
                  <p className="font-medium">Meslek veri kaynağı eksik.</p>
                  <p className="text-sm text-muted-foreground">
                    <code>src/lib/volunteer/professions.ts</code> dosyası henüz oluşturulmamış. Ajan C1 üretiyor.
                  </p>
                </div>
              ) : overridesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProfessions.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Filtreyle eşleşen meslek yok.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Meslek</TableHead>
                          <TableHead className="w-20">ISCO</TableHead>
                          <TableHead className="w-32">Kategori</TableHead>
                          <TableHead className="text-right w-24">Default (₺/sa)</TableHead>
                          <TableHead className="text-right w-32">Override (₺/sa)</TableHead>
                          <TableHead className="text-right w-24">Default (Puan/sa)</TableHead>
                          <TableHead className="text-right w-32">Override (Puan/sa)</TableHead>
                          <TableHead className="text-center w-20">Durum</TableHead>
                          <TableHead className="text-right w-16">Sıfırla</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageRows.map((p, idx) => {
                          const ov = overrideOf(p);
                          const ovP = overridePointsOf(p);
                          const dirty = isDirty(p);
                          const overridden = ov !== undefined || ovP !== undefined;
                          return (
                            <TableRow key={p.id} className={dirty ? 'bg-amber-50/60' : undefined}>
                              <TableCell className="text-muted-foreground tabular-nums">
                                {(profPage - 1) * PAGE_SIZE + idx + 1}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{p.nameTr}</div>
                                <div className="text-xs text-muted-foreground">{p.nameEn}</div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{p.iscoCode}</TableCell>
                              <TableCell className="text-xs">{CATEGORY_LABELS[p.category].tr}</TableCell>
                              <TableCell className="text-right tabular-nums text-muted-foreground">
                                {p.defaultRate.toLocaleString('tr-TR')}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  className="h-8 text-right tabular-nums"
                                  value={ov === undefined ? '' : String(ov)}
                                  placeholder={p.defaultRate.toLocaleString('tr-TR')}
                                  onChange={(e) => setRowRate(p.id, e.target.value)}
                                />
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-muted-foreground">
                                {p.defaultPoints.toLocaleString('tr-TR')}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min={0}
                                  step="1"
                                  className="h-8 text-right tabular-nums"
                                  value={ovP === undefined ? '' : String(ovP)}
                                  placeholder={p.defaultPoints.toLocaleString('tr-TR')}
                                  onChange={(e) => setRowPoints(p.id, e.target.value)}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                {dirty ? (
                                  <Badge variant="secondary" className="text-[10px]">Bekliyor</Badge>
                                ) : overridden ? (
                                  <Badge className="text-[10px]">Override</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">Default</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={!overridden && !dirty}
                                  onClick={() => resetRow(p)}
                                  aria-label="Bu satırı default'a döndür"
                                  title="Default'a döndür"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                    <div className="text-xs text-muted-foreground">
                      Toplam {filteredProfessions.length} meslek, sayfa {profPage}/{totalPages}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={profPage <= 1}
                        onClick={() => setProfPage((p) => Math.max(1, p - 1))}
                      >
                        Önceki
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={profPage >= totalPages}
                        onClick={() => setProfPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Sonraki
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Yardım kartı */}
          <Card className="bg-sky-50/40 border-sky-200">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-sky-600 mt-0.5 shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-bold">Adam-saat hesabı nasıl çalışır?</p>
                <p className="text-muted-foreground">
                  Gönüllülük süresi × meslek saatlik ücreti = Sosyal Etki Mali Değeri.
                  Default değerler TÜİK İşgücü Anketi 2024 verisi baz alınarak ve 2026 enflasyon ayarı uygulanarak hesaplanmıştır.
                  Override yazılan meslekler için Firestore&apos;daki değer kullanılır; boş bırakılırsa default geçerlidir.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground">
        <Link href="/super-admin/settings" className="hover:underline">← Panel Ayarları&apos;na dön</Link>
      </div>
    </div>
  );
}
