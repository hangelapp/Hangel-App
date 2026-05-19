'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart } from 'lucide-react';

const MOTIVATION_GROUPS = [
  {
    title: 'İnsanlara dokunmak',
    subtitle: 'Etki odaklı',
    items: [
      'Sahada aktif görev', 'Birebir insan teması', 'Hızlı sonuç beklentisi',
      'Somut fayda üretme', 'Duygusal bağlılık yüksek', 'Bürokrasiye düşük tolerans',
      'Hikaye ve sonuç odaklı projeler', 'Sosyal hassasiyet uyumu kritik',
      'Uzun vadeli bağlılık potansiyeli',
    ],
  },
  {
    title: 'Yeni şeyler öğrenmek',
    subtitle: 'Gelişim odaklı',
    items: [
      'Deneyim kazanma motivasyonu', 'Farklı alanlara açıklık', 'Yenilik ve keşif isteği',
      'Proje kurulum süreçlerine yatkınlık', 'Dinamik ortamlarda yüksek performans',
      'Tekrara düşük tolerans', 'Eğitim ve mentorluk ilgisi',
      'Çok yönlü beceri geliştirme', 'Gelecekte yön değiştirme eğilimi',
    ],
  },
  {
    title: 'Sosyal çevre edinmek',
    subtitle: 'Bağlantı odaklı',
    items: [
      'Ekip içinde çalışma isteği', 'İletişim gücü yüksek',
      'Etkinlik ve organizasyon ilgisi', 'Topluluk içinde motivasyon',
      'Yalnız çalışmaya düşük ilgi', 'Sosyal görünürlük isteği',
      'Network oluşturma hedefi', 'Grup enerjisiyle performans artışı',
      'Aidiyet duygusu önemli',
    ],
  },
  {
    title: 'Kariyer katkısı',
    subtitle: 'Stratejik odaklı',
    items: [
      'CV ve deneyim geliştirme', 'Profesyonel gönüllülük ilgisi', 'Networking hedefi',
      'Kurumsal projelere yatkınlık', 'Sonuç ve çıktı odaklı',
      'Planlı ve yapılandırılmış iş tercihi', 'Yetkinlik geliştirme motivasyonu',
      'Mentorluk ve danışmanlık ilgisi', 'Uzun vadeli kariyer entegrasyonu',
    ],
  },
];

export const MotivationsSection = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Bir Projede Seni Ne Motive Eder?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {MOTIVATION_GROUPS.map(group => (
          <div key={group.title} className="border rounded-xl p-4 bg-muted/20">
            <div className="mb-3">
              <p className="font-bold text-sm">{group.title}</p>
              <p className="text-xs text-muted-foreground">{group.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {group.items.map(item => (
                <label key={item} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/30 cursor-pointer">
                  <Checkbox
                    checked={value.includes(item)}
                    onCheckedChange={c => onChange(c ? [...value, item] : value.filter(x => x !== item))}
                  />
                  <span className="text-xs">{item}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
