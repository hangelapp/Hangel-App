'use client';

import { useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { ArrowLeft, MapPin, GraduationCap, Briefcase, Star, Heart, Handshake, Loader2, AlertCircle, RefreshCw, Phone, Mail, Cake, Languages, Award, Car, Clock, Sparkles, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useIsNgoAdmin } from '@/hooks/use-is-ngo-admin';

type PublicUserData = {
  name?: string;
  username?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  impactScore?: number;
  personalInfo?: {
    // KVKK: telefon/e-posta/doğum tarihi/cinsiyet/tam adres yalnız STK
    // yöneticisi / super-admin görür. Diğer ziyaretçilere render EDİLMEZ.
    // users read kuralı ham dokümanı okumaya izin verdiği için gizleme
    // UI seviyesinde koşullu yapılır.
    phone?: string;
    email?: string;
    birthDate?: string;
    gender?: string;
    nationality?: string;
    address?: {
      city?: string;
      district?: string;
      country?: string;
      neighborhood?: string;
    };
  };
  volunteerInfo?: {
    skills?: string[];
    interests?: string[];
    education?: Array<{
      level?: string;
      school?: string;
      department?: string;
      status?: string;
      grade?: string;
      graduationYear?: string;
    }>;
    profession?: string | null;
    sector?: string | null;
    position?: string | null;
    // Yönetici görünümü ek alanları (settings/volunteer'da yazılır)
    languages?: string[];
    signLanguages?: string[];
    certificates?: string[];
    driverLicenses?: string[];
    programs?: string[];
    availabilityDays?: string[];
    availabilityTimes?: string[];
    workModes?: string[];
    motivations?: string[];
  };
  stats?: {
    totalDonation?: number;
    volunteerHours?: number;
    completedProjects?: number;
    supportedNgosCount?: number;
  };
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const db = useFirestore();
  // İletişim bilgisini yalnız STK yöneticisi / super-admin görebilir.
  const { isNgoAdmin } = useIsNgoAdmin();

  const userRef = useMemoFirebase(
    () => (db && id ? doc(db, COLLECTIONS.users, id) : null),
    [db, id]
  );
  const { data: userData, isLoading, error } = useDoc<PublicUserData>(userRef);

  const profile = useMemo(() => userData ?? null, [userData]);

  if (isLoading) {
    return (
      <div className="animate-in fade-in-0">
        <Skeleton className="h-48 w-full" />
        <div className="p-4 space-y-4">
          <div className="flex gap-4 items-center -mt-16">
            <Skeleton className="h-20 w-20 rounded-full border-4 border-background" />
            <div className="space-y-2 pt-16">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Başarısız fetch (izin/ağ hatası) ile gerçekten olmayan kullanıcıyı ayır:
  // hata → tekrar dene UI; hatasız + veri yok → notFound.
  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center text-center px-6 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive opacity-70" />
        <div className="space-y-1">
          <p className="font-bold text-lg">Profil yüklenemedi</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Bir bağlantı veya yetki sorunu oluştu. Lütfen tekrar dene.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Geri
          </Button>
          <Button onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    notFound();
  }

  const city = profile.personalInfo?.address?.city;
  const district = profile.personalInfo?.address?.district;
  const locationLine = [district, city].filter(Boolean).join(', ');
  const topEducation = profile.volunteerInfo?.education?.[0];
  const profession = profile.volunteerInfo?.profession;
  const skills = profile.volunteerInfo?.skills ?? [];
  const interests = profile.volunteerInfo?.interests ?? [];
  // İletişim — yalnız STK yöneticisi/super-admin için (KVKK: sadece telefon+e-posta).
  const phone = profile.personalInfo?.phone?.trim();
  const email = profile.personalInfo?.email?.trim();
  const showContact = isNgoAdmin && (phone || email);

  // ---- Yönetici görünümü (KVKK gevşetilmiş) — SADECE isNgoAdmin true iken render ----
  // Bu alanlar (doğum tarihi, cinsiyet, tam adres, tam eğitim listesi, diller,
  // sertifikalar, ehliyet, uygunluk vb.) normal ziyaretçiye ASLA gösterilmez.
  const vi = profile.volunteerInfo;
  const pi = profile.personalInfo;

  // Doğum tarihi + yaş (YYYY-MM-DD veya DD.MM.YYYY toleranslı).
  const birthDate = pi?.birthDate?.trim();
  const age = (() => {
    if (!birthDate) return null;
    const t = Date.parse(birthDate) || Date.parse(birthDate.split('.').reverse().join('-'));
    if (Number.isNaN(t)) return null;
    const d = new Date(t);
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    return a >= 0 && a < 130 ? a : null;
  })();
  const gender = pi?.gender?.trim();
  const nationality = pi?.nationality?.trim();
  // Tam konum: mahalle, ilçe, il, ülke (varsa) — yalnız yönetici.
  const fullLocation = [
    pi?.address?.neighborhood,
    pi?.address?.district,
    pi?.address?.city,
    pi?.address?.country,
  ]
    .map((v) => v?.trim())
    .filter(Boolean)
    .join(', ');
  const educationList = (vi?.education ?? []).filter((e) => e?.school || e?.level);
  const sector = vi?.sector?.trim?.() || undefined;
  const position = vi?.position?.trim?.() || undefined;
  const languages = vi?.languages ?? [];
  const signLanguages = vi?.signLanguages ?? [];
  const certificates = vi?.certificates ?? [];
  const driverLicenses = vi?.driverLicenses ?? [];
  const programs = vi?.programs ?? [];
  const availabilityDays = vi?.availabilityDays ?? [];
  const availabilityTimes = vi?.availabilityTimes ?? [];
  const workModes = vi?.workModes ?? [];
  const motivations = vi?.motivations ?? [];

  const hasManagerExtra =
    !!birthDate ||
    !!gender ||
    !!nationality ||
    !!fullLocation ||
    educationList.length > 1 ||
    !!sector ||
    !!position ||
    languages.length > 0 ||
    signLanguages.length > 0 ||
    certificates.length > 0 ||
    driverLicenses.length > 0 ||
    programs.length > 0 ||
    availabilityDays.length > 0 ||
    availabilityTimes.length > 0 ||
    workModes.length > 0 ||
    motivations.length > 0;
  const showManagerView = isNgoAdmin && hasManagerExtra;

  return (
    <div className="animate-in fade-in-0">
      <div
        className="relative h-48 w-full bg-muted bg-cover bg-center"
        style={profile.coverPhotoUrl ? { backgroundImage: `url(${profile.coverPhotoUrl})` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/0" />
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full"
          aria-label="Geri"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 bg-background">
        <div className="flex gap-4 items-center -mt-16">
          <Avatar className="h-20 w-20 shrink-0 bg-card border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatarUrl} alt={profile.name ?? 'Profil'} />
            <AvatarFallback>{(profile.name ?? '?').charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 pt-16 min-w-0">
            <h1 className="text-2xl font-bold font-headline break-words">{profile.name ?? 'İsimsiz Kullanıcı'}</h1>
            {profile.username && <p className="text-muted-foreground text-sm break-words">@{profile.username}</p>}
            {locationLine && (
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{locationLine}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <Card className="text-center">
            <CardContent className="p-3">
              <Star className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="font-bold text-lg">{(profile.impactScore ?? 0).toLocaleString('tr-TR')}</p>
              <p className="text-xs text-muted-foreground">Etki Puanı</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <Handshake className="h-5 w-5 mx-auto text-green-600 mb-1" />
              <p className="font-bold text-lg">{(profile.stats?.volunteerHours ?? 0).toLocaleString('tr-TR')}</p>
              <p className="text-xs text-muted-foreground">Gönüllü Saati</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-3">
              <Heart className="h-5 w-5 mx-auto text-red-500 mb-1" />
              <p className="font-bold text-lg">{(profile.stats?.completedProjects ?? 0).toLocaleString('tr-TR')}</p>
              <p className="text-xs text-muted-foreground">Proje</p>
            </CardContent>
          </Card>
        </div>

        {showContact && (
          <Card className="mt-4 border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">İletişim</CardTitle>
              <p className="text-xs text-muted-foreground">
                Bu bilgi yalnızca STK yöneticilerine gösterilir.
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {phone && (
                <a
                  href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium tabular-nums break-all">{phone}</span>
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium break-all">{email}</span>
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {showManagerView && (
          <Card className="mt-4 border-primary/30 bg-primary/[0.03]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Yönetici görünümü</CardTitle>
              <p className="text-xs text-muted-foreground">
                Bu bilgiler yalnızca STK yöneticilerine gösterilir.
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {/* Kimlik & konum */}
              {(birthDate || gender || nationality || fullLocation) && (
                <div className="space-y-2">
                  {birthDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Cake className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        {birthDate}
                        {age != null ? ` · ${age} yaş` : ''}
                      </span>
                    </div>
                  )}
                  {gender && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-muted-foreground">Cinsiyet:</span>
                      <span>{gender}</span>
                    </div>
                  )}
                  {nationality && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-muted-foreground">Uyruk:</span>
                      <span>{nationality}</span>
                    </div>
                  )}
                  {fullLocation && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="break-words">{fullLocation}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tam eğitim listesi */}
              {educationList.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <GraduationCap className="h-4 w-4 text-primary shrink-0" /> Eğitim
                  </div>
                  <ul className="space-y-1">
                    {educationList.map((e, i) => (
                      <li key={`edu-${i}`} className="text-sm break-words">
                        {[
                          e.level,
                          e.school,
                          e.department,
                          e.grade,
                          e.status,
                          e.graduationYear,
                        ]
                          .map((v) => v?.trim())
                          .filter(Boolean)
                          .join(' · ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meslek / sektör / pozisyon */}
              {(profession || sector || position) && (
                <div className="space-y-1.5">
                  {profession && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{profession}</span>
                    </div>
                  )}
                  {sector && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-muted-foreground">Sektör:</span>
                      <span>{sector}</span>
                    </div>
                  )}
                  {position && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-muted-foreground">Pozisyon:</span>
                      <span>{position}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Diller */}
              {(languages.length > 0 || signLanguages.length > 0) && (
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
              )}

              {/* Sertifikalar */}
              {certificates.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Award className="h-4 w-4 text-primary shrink-0" /> Sertifikalar
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {certificates.map((c, i) => (
                      <Badge key={`cert-${i}`} variant="outline">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Ehliyet */}
              {driverLicenses.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Car className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>
                    <span className="text-xs text-muted-foreground">Ehliyet: </span>
                    {driverLicenses.join(', ')}
                  </span>
                </div>
              )}

              {/* Programlar / yazılımlar */}
              {programs.length > 0 && (
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
              )}

              {/* Uygunluk (gün/saat/çalışma şekli) */}
              {(availabilityDays.length > 0 ||
                availabilityTimes.length > 0 ||
                workModes.length > 0) && (
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
              )}

              {/* Motivasyon */}
              {motivations.length > 0 && (
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
              )}
            </CardContent>
          </Card>
        )}

        {(topEducation?.school || profession) && (
          <Card className="mt-4">
            <CardContent className="p-4 space-y-2">
              {topEducation?.school && (
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {topEducation.level ? `${topEducation.level} · ` : ''}
                    {topEducation.school}
                  </span>
                </div>
              )}
              {profession && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{profession}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {skills.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Yetenekler</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        {interests.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">İlgi Alanları</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {interests.map((i) => (
                <Badge key={i} variant="outline">
                  {i}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        {!skills.length && !interests.length && !topEducation?.school && !profession && (
          <div className="mt-6 flex flex-col items-center text-center text-muted-foreground py-12">
            <Loader2 className="h-6 w-6 mb-2 opacity-30" />
            <p className="text-sm">Bu kullanıcı profilini henüz tamamlamamış.</p>
          </div>
        )}
      </div>
    </div>
  );
}
