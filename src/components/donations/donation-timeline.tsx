'use client';

/**
 * Bağışının yolculuğu — "paran hangi aşamada" mini zaman çizelgesi.
 * Bağışlarım sayfasında bir işlemin detayında gösterilir; kullanıcıya bağışının
 * hangi aşamada olduğunu (alışveriş → marka onayı → hazırlık → STK'ya ödeme)
 * güven verecek şekilde anlatır.
 */
import { Check, ShoppingBag, BadgeCheck, HandHeart, Building2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = { isPaid: boolean; isRejected: boolean };

const STEPS = [
  { key: 'purchase', label: 'Alışverişin tamamlandı', icon: ShoppingBag },
  { key: 'confirmed', label: 'Marka bağışı onayladı', icon: BadgeCheck },
  { key: 'prepared', label: 'Bağışın hazırlandı', icon: HandHeart },
  { key: 'paid', label: "STK'na aktarıldı", icon: Building2 },
];

export function DonationTimeline({ isPaid, isRejected }: Props) {
  // Bağış kaydı zaten oluştuğu için ilk 3 adım tamamdır; 4. adım (STK'ya ödeme)
  // yalnız statü "ödendi" ise tamamdır, değilse "sürüyor".
  const doneCount = isPaid ? 4 : 3;

  if (isRejected) {
    // İlk 2 adım tamam, sonra iptal/iade dalı.
    const rejSteps = [
      { key: 'purchase', label: 'Alışverişin tamamlandı', icon: ShoppingBag, state: 'done' as const },
      { key: 'started', label: 'Bağış süreci başladı', icon: HandHeart, state: 'done' as const },
      { key: 'cancelled', label: 'Alışveriş iade/iptal edildi', icon: XCircle, state: 'rejected' as const },
    ];
    return (
      <TimelineShell>
        {rejSteps.map((s, i) => (
          <Row
            key={s.key}
            label={s.label}
            Icon={s.state === 'done' ? Check : s.icon}
            state={s.state}
            isLast={i === rejSteps.length - 1}
            note={s.state === 'rejected' ? 'Marka alışverişi onaylamadığı için bağış oluşmadı.' : undefined}
          />
        ))}
      </TimelineShell>
    );
  }

  return (
    <TimelineShell>
      {STEPS.map((s, i) => {
        const done = i < doneCount;
        const current = !isPaid && i === doneCount; // sıradaki (ödeme) adımı
        return (
          <Row
            key={s.key}
            label={s.label}
            Icon={done ? Check : s.icon}
            state={done ? 'done' : current ? 'current' : 'pending'}
            isLast={i === STEPS.length - 1}
            note={current ? 'Sürüyor — genelde kısa sürede tamamlanır.' : undefined}
          />
        );
      })}
    </TimelineShell>
  );
}

function TimelineShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border bg-background/60 p-3">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <HandHeart className="h-3.5 w-3.5 text-primary" /> Bağışının yolculuğu
      </p>
      <ol>{children}</ol>
    </div>
  );
}

function Row({
  label,
  Icon,
  state,
  isLast,
  note,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  state: 'done' | 'current' | 'pending' | 'rejected';
  isLast: boolean;
  note?: string;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
            state === 'done' && 'border-green-500 bg-green-500 text-white',
            state === 'current' && 'animate-pulse border-primary text-primary',
            state === 'pending' && 'border-muted-foreground/30 text-muted-foreground/40',
            state === 'rejected' && 'border-red-500 bg-red-500 text-white',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        {!isLast && (
          <div className={cn('min-h-[18px] w-0.5 flex-1', state === 'done' ? 'bg-green-500' : 'bg-muted-foreground/20')} />
        )}
      </div>
      <div className={cn('pb-4', isLast && 'pb-0')}>
        <p
          className={cn(
            'text-xs font-medium',
            state === 'done' && 'text-foreground',
            state === 'current' && 'text-primary',
            state === 'pending' && 'text-muted-foreground/60',
            state === 'rejected' && 'text-red-600 dark:text-red-400',
          )}
        >
          {label}
        </p>
        {note && <p className="mt-0.5 text-[10px] text-muted-foreground">{note}</p>}
      </div>
    </li>
  );
}
