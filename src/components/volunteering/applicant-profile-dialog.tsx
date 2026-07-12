'use client';

/**
 * Yönetici bir başvurana tıkladığında açılan Dialog: O İLANA dair başvuru
 * detayı + kullanıcının gönüllü profil özeti (canlı `users/{userId}` doc'undan).
 *
 * Apple-temiz, kartlı düzen. İsimler ASLA truncate edilmez (uzunsa break-words).
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, GraduationCap, Sparkles, Brain, Phone, Mail } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import type { User } from '@/lib/types';

interface ApplicationDetail {
  status?: string;
  date?: string;
  /** İlan başlığı. */
  title?: string;
  ngoNote?: string;
  rejectionReason?: string;
}

interface ApplicantProfileDialogProps {
  userId?: string;
  /** Başvuruda kayıtlı isim — canlı profil yoksa fallback. */
  userName?: string;
  application?: ApplicationDetail;
  /** Tıklanacak öğe; verilmezse "Profil" butonu. */
  trigger?: React.ReactNode;
}

/** Başvuru durumunu görünen etiket + renk sınıfına eşler. */
function statusBadge(status?: string): { label: string; className: string } {
  const s = (status || '').toLowerCase();
  if (s === 'approved' || s.includes('onay')) {
    return {
      label: 'Onaylandı',
      className:
        'bg-green-500/15 text-green-700 dark:text-green-400 border-transparent',
    };
  }
  if (s === 'rejected' || s.includes('red')) {
    return {
      label: 'Reddedildi',
      className:
        'bg-red-500/15 text-red-700 dark:text-red-400 border-transparent',
    };
  }
  return {
    label: 'Beklemede',
    className:
      'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent',
  };
}

function initial(name?: string): string {
  const n = (name || '').trim();
  return n ? n.charAt(0).toUpperCase() : 'G';
}

export function ApplicantProfileDialog({
  userId,
  userName,
  application,
  trigger,
}: ApplicantProfileDialogProps) {
  const db = useFirestore();
  const [open, setOpen] = useState(false);

  // Dialog açılınca (ve userId varsa) canlı profil dokümanını çek.
  const userRef = useMemoFirebase(
    () => (db && open && userId ? doc(db, COLLECTIONS.users, userId) : null),
    [db, open, userId],
  );
  const { data: profile, isLoading } = useDoc<User>(userRef);

  const displayName = profile?.name || userName || 'Gönüllü';
  const username = profile?.username;
  const city = profile?.personalInfo?.address?.city;
  // İletişim: yönetici başvuranla iletişime geçebilsin diye telefon + e-posta
  // gösterilir (KVKK: yalnız iletişim alanları; adres/doğum tarihi/cinsiyet
  // vb. paylaşılmaz). Bu dialog zaten sadece ilan sahibi STK yöneticisine /
  // super-admin'e açık (applications.list kuralı gereği).
  const phone = profile?.personalInfo?.phone?.trim();
  const email = profile?.personalInfo?.email?.trim();
  const telHref = phone ? `tel:${phone.replace(/[^0-9+]/g, '')}` : null;
  const skills = profile?.volunteerInfo?.skills || [];
  const interests = profile?.volunteerInfo?.interests || [];
  const firstEducation = profile?.volunteerInfo?.education?.[0];
  const badge = statusBadge(application?.status);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            Profil
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Başvuran profili</DialogTitle>
        </DialogHeader>

        {/* 1. Başlık — avatar + isim + @username + şehir */}
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 shrink-0">
            {profile?.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback>{initial(displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-tight break-words">
              {displayName}
            </h3>
            <p className="text-sm text-muted-foreground break-words">
              {username ? `@${username}` : ''}
              {username && city ? ' · ' : ''}
              {city || ''}
            </p>
          </div>
        </div>

        {/* 2. Bu başvuru kartı */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Bu başvuru
            </span>
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>
          {application?.title ? (
            <p className="font-medium break-words">{application.title}</p>
          ) : null}
          {application?.date ? (
            <p className="text-sm text-muted-foreground">
              Başvuru tarihi: {application.date}
            </p>
          ) : null}
          {application?.ngoNote ? (
            <p className="text-sm break-words">
              <span className="font-medium">Not:</span> {application.ngoNote}
            </p>
          ) : null}
          {application?.rejectionReason ? (
            <p className="text-sm text-red-600 dark:text-red-400 break-words">
              <span className="font-medium">Red gerekçesi:</span>{' '}
              {application.rejectionReason}
            </p>
          ) : null}
        </div>

        {/* 3. İletişim — telefon + e-posta (yönetici iletişime geçebilsin) */}
        {!isLoading && (phone || email) ? (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground">
              İletişim
            </span>
            {phone ? (
              <a
                href={telHref ?? undefined}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium tabular-nums break-all">{phone}</span>
              </a>
            ) : null}
            {email ? (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium break-all">{email}</span>
              </a>
            ) : null}
          </div>
        ) : null}

        {/* 4. Gönüllü profili özeti */}
        {isLoading && userId ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <span className="text-xs font-semibold text-muted-foreground">
              Gönüllü profili
            </span>

            <div className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">Etki puanı:</span>
              <span>{profile?.impactScore ?? 0}</span>
            </div>

            {skills.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Brain className="h-4 w-4 text-primary shrink-0" /> Yetenekler
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, i) => (
                    <Badge key={`skill-${i}`} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {interests.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" /> İlgi
                  alanları
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((s, i) => (
                    <Badge key={`interest-${i}`} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {firstEducation?.school ? (
              <div className="flex items-start gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="break-words">
                  {firstEducation.school}
                  {firstEducation.department
                    ? ` — ${firstEducation.department}`
                    : ''}
                </span>
              </div>
            ) : null}
          </div>
        )}

        {/* 5. Tam profil linki */}
        {userId ? (
          <Button asChild className="rounded-xl w-full">
            <Link href={`/profile/${userId}`}>Tam profili aç</Link>
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
