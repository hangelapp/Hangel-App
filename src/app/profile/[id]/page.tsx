'use client';

import { useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { ArrowLeft, MapPin, GraduationCap, Briefcase, Star, Heart, Handshake, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';

type PublicUserData = {
  name?: string;
  username?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  impactScore?: number;
  personalInfo?: {
    address?: {
      city?: string;
      district?: string;
      country?: string;
    };
  };
  volunteerInfo?: {
    skills?: string[];
    interests?: string[];
    education?: Array<{ level?: string; school?: string }>;
    profession?: string | null;
    sector?: string | null;
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

  const userRef = useMemoFirebase(
    () => (db && id ? doc(db, 'users', id) : null),
    [db, id]
  );
  const { data: userData, isLoading } = useDoc<PublicUserData>(userRef);

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
          <Avatar className="h-20 w-20 shrink-0 bg-white border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatarUrl} alt={profile.name ?? 'Profil'} />
            <AvatarFallback>{(profile.name ?? '?').charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 pt-16">
            <h1 className="text-2xl font-bold font-headline">{profile.name ?? 'İsimsiz Kullanıcı'}</h1>
            {profile.username && <p className="text-muted-foreground text-sm">@{profile.username}</p>}
            {locationLine && (
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <MapPin className="h-3.5 w-3.5" />
                <span>{locationLine}</span>
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
