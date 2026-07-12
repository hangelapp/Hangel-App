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
import { Award, GraduationCap, Sparkles, Brain, Phone, Mail, Languages, Car, Clock, Briefcase, Globe, BadgeCheck } from 'lucide-react';
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
  const badge = statusBadge(application?.status);

  // Yönetici karar verebilsin diye tam gönüllü profili. Bu dialog zaten yalnız
  // ilan sahibi STK yöneticisine / super-admin'e açık (applications.list kuralı),
  // bu yüzden KVKK gizleme gerekmez. Aşağıdaki bazı alanlar (certificates,
  // driverLicenses, signLanguages, availability, motivations) User tipinde
  // tanımlı değil ama settings/volunteer'da yazılıyor — widened tip ile okunur.
  const vi = (profile?.volunteerInfo ?? {}) as NonNullable<User['volunteerInfo']> &
    Partial<{
      sector: string | null;
      position: string | null;
      signLanguages: string[];
      certificates: string[];
      driverLicenses: string[];
      motivations: string[];
      availabilityDays: string[];
      availabilityTimes: string[];
      workModes: string[];
    }>;
  const educationList = (vi.education ?? []).filter((e) => e?.school || e?.level);
  const profession = (vi.profession ?? undefined) || undefined;
  const sector = (vi.sector ?? undefined) || undefined;
  const position = (vi.position ?? undefined) || undefined;
  const languages = vi.languages ?? [];
  const signLanguages = vi.signLanguages ?? [];
  const certificates = vi.certificates ?? [];
  const driverLicenses = vi.driverLicenses ?? [];
  const programs = vi.programs ?? [];
  const availabilityDays = vi.availabilityDays ?? [];
  const availabilityTimes = vi.availabilityTimes ?? [];
  const workModes = vi.workModes ?? [];
  const motivations = vi.motivations ?? [];

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

            {/* Meslek / sektör / pozisyon */}
            {(profession || sector || position) ? (
              <div className="space-y-1">
                {profession ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-primary shrink-0" />
                    <span className="break-words">{profession}</span>
                  </div>
                ) : null}
                {sector ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground">Sektör:</span>
                    <span className="break-words">{sector}</span>
                  </div>
                ) : null}
                {position ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground">Pozisyon:</span>
                    <span className="break-words">{position}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Tam eğitim listesi */}
            {educationList.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <GraduationCap className="h-4 w-4 text-primary shrink-0" /> Eğitim
                </div>
                <ul className="space-y-1">
                  {educationList.map((e, i) => (
                    <li key={`edu-${i}`} className="text-sm break-words">
                      {[e.level, e.school, e.department, e.grade, e.status, e.graduationYear]
                        .map((v) => v?.trim())
                        .filter(Boolean)
                        .join(' · ')}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Diller */}
            {(languages.length > 0 || signLanguages.length > 0) ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Languages className="h-4 w-4 text-primary shrink-0" /> Diller
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((l, i) => (
                    <Badge key={`lang-${i}`} variant="secondary">
                      {l}
                    </Badge>
                  ))}
                  {signLanguages.map((l, i) => (
                    <Badge key={`sign-${i}`} variant="secondary">
                      {l} (işaret dili)
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Sertifikalar */}
            {certificates.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <BadgeCheck className="h-4 w-4 text-primary shrink-0" /> Sertifikalar
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {certificates.map((c, i) => (
                    <Badge key={`cert-${i}`} variant="outline">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Program & yazılım */}
            {programs.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Globe className="h-4 w-4 text-primary shrink-0" /> Program & Yazılım
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {programs.map((p, i) => (
                    <Badge key={`prog-${i}`} variant="outline">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Ehliyet */}
            {driverLicenses.length > 0 ? (
              <div className="flex items-start gap-2 text-sm">
                <Car className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="break-words">
                  <span className="text-xs text-muted-foreground">Ehliyet: </span>
                  {driverLicenses.join(', ')}
                </span>
              </div>
            ) : null}

            {/* Uygunluk */}
            {(availabilityDays.length > 0 ||
              availabilityTimes.length > 0 ||
              workModes.length > 0) ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Clock className="h-4 w-4 text-primary shrink-0" /> Uygunluk
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availabilityDays.map((d, i) => (
                    <Badge key={`day-${i}`} variant="secondary">
                      {d}
                    </Badge>
                  ))}
                  {availabilityTimes.map((t, i) => (
                    <Badge key={`time-${i}`} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                  {workModes.map((w, i) => (
                    <Badge key={`mode-${i}`} variant="outline">
                      {w}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Motivasyon */}
            {motivations.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" /> Motivasyon
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {motivations.map((m, i) => (
                    <Badge key={`motiv-${i}`} variant="outline">
                      {m}
                    </Badge>
                  ))}
                </div>
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
