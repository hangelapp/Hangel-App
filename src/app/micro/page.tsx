'use client';

/**
 * Mikro Gönüllülük listesi — Faz 3.
 *
 * 5-30 dk kısa görevleri konuma göre listeler. Görev tıklayınca detay +
 * "Tamamladım" akışı (proof foto + complete API).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Loader2, MapPin, Heart, Leaf, GraduationCap, PawPrint, Baby, Stethoscope } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCurrentPositionUnified } from '@/lib/native-geolocation';

interface MicroTask {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  category: string;
  ngoId?: string | null;
  location?: { latitude: number; longitude: number; radiusKm: number; cityLabel?: string };
  reward?: { points: number; badgeId?: string };
  distanceKm?: number;
}

const CATEGORY_META: Record<string, { label: string; icon: typeof Heart; color: string }> = {
  environment: { label: 'Çevre', icon: Leaf, color: 'text-emerald-600 bg-emerald-50' },
  elderly: { label: 'Yaşlı', icon: Heart, color: 'text-rose-600 bg-rose-50' },
  animals: { label: 'Hayvan', icon: PawPrint, color: 'text-amber-600 bg-amber-50' },
  children: { label: 'Çocuk', icon: Baby, color: 'text-blue-600 bg-blue-50' },
  health: { label: 'Sağlık', icon: Stethoscope, color: 'text-red-600 bg-red-50' },
  education: { label: 'Eğitim', icon: GraduationCap, color: 'text-violet-600 bg-violet-50' },
  other: { label: 'Diğer', icon: Heart, color: 'text-gray-600 bg-gray-100' },
};

export default function MicroVolunteeringPage() {
  const [tasks, setTasks] = useState<MicroTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const pos = await getCurrentPositionUnified();
      const params = new URLSearchParams();
      if (pos) {
        params.set('lat', String(pos.latitude));
        params.set('lng', String(pos.longitude));
        params.set('radiusKm', '15');
        setHasLocation(true);
      }
      if (selectedCategory) params.set('category', selectedCategory);
      const res = await fetch(`/api/micro-tasks?${params.toString()}`);
      const json = await res.json();
      setTasks((json.tasks ?? []) as MicroTask[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  return (
    <div className="min-h-dvh bg-secondary/40 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">

        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Mikro Gönüllülük</h1>
          <p className="text-sm text-muted-foreground">
            5-30 dakikalık küçük iyilikler. {hasLocation ? 'Yakındaki' : 'Tüm'} açık görevler.
          </p>
        </div>

        {/* Kategori filtresi */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <CategoryChip label="Tümü" active={selectedCategory === null} onClick={() => setSelectedCategory(null)} />
          {Object.entries(CATEGORY_META).map(([k, m]) => (
            <CategoryChip
              key={k}
              label={m.label}
              active={selectedCategory === k}
              onClick={() => setSelectedCategory(k)}
            />
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <Card className="border-dashed bg-background/60 rounded-2xl">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" />
              {selectedCategory ? 'Bu kategoride açık görev yok.' : 'Şu an aktif mikro görev yok.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map(t => {
              const meta = CATEGORY_META[t.category] ?? CATEGORY_META.other;
              const Icon = meta.icon;
              return (
                <Link key={t.id} href={`/micro/${t.id}`}>
                  <Card className="border-none shadow-sm bg-background rounded-2xl hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-bold text-sm leading-tight">{t.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {t.estimatedMinutes} dk</span>
                          {typeof t.distanceKm === 'number' && (
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.distanceKm} km</span>
                          )}
                          {t.reward?.points ? (
                            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 rounded-full">+{t.reward.points} puan</Badge>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={`rounded-full whitespace-nowrap text-xs h-8 ${active ? 'shadow-sm' : ''}`}
    >
      {label}
    </Button>
  );
}
