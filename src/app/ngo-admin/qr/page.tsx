'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Twitter, Linkedin, ShieldAlert, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';

type EntityKind = 'ngo' | 'brand' | 'club';
type ManagedEntity = { kind: EntityKind; id: string; name: string };

interface EntityDoc {
  id: string;
  name?: string;
  adminUserId?: string;
}
interface UserDocData {
  id: string;
  managedNgoId?: string;
  managedBrandId?: string;
  managedClubId?: string;
}

export default function QrPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const adminNgosQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, 'ngos'), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const adminBrandsQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, 'brands'), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );
  const adminClubsQ = useMemoFirebase(
    () => (firestore && authUser?.uid ? query(collection(firestore, 'clubs'), where('adminUserId', '==', authUser.uid)) : null),
    [firestore, authUser?.uid],
  );

  const { data: adminNgos, isLoading: ngosLoading } = useCollection<EntityDoc>(adminNgosQ);
  const { data: adminBrands, isLoading: brandsLoading } = useCollection<EntityDoc>(adminBrandsQ);
  const { data: adminClubs, isLoading: clubsLoading } = useCollection<EntityDoc>(adminClubsQ);

  // Fallback: user doc'taki managed*Id (duplicate doc edge case'i için)
  const userDocRef = useMemoFirebase(
    () => (firestore && authUser?.uid ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser?.uid],
  );
  const { data: userData } = useDoc<UserDocData>(userDocRef);

  const fallbackNgoRef = useMemoFirebase(
    () => (firestore && userData?.managedNgoId ? doc(firestore, 'ngos', userData.managedNgoId) : null),
    [firestore, userData?.managedNgoId],
  );
  const fallbackBrandRef = useMemoFirebase(
    () => (firestore && userData?.managedBrandId ? doc(firestore, 'brands', userData.managedBrandId) : null),
    [firestore, userData?.managedBrandId],
  );
  const fallbackClubRef = useMemoFirebase(
    () => (firestore && userData?.managedClubId ? doc(firestore, 'clubs', userData.managedClubId) : null),
    [firestore, userData?.managedClubId],
  );
  const { data: fallbackNgo } = useDoc<EntityDoc>(fallbackNgoRef);
  const { data: fallbackBrand } = useDoc<EntityDoc>(fallbackBrandRef);
  const { data: fallbackClub } = useDoc<EntityDoc>(fallbackClubRef);

  const activeEntity = useMemo<ManagedEntity | null>(() => {
    const ngo = (adminNgos && adminNgos[0]) || fallbackNgo;
    if (ngo?.id) return { kind: 'ngo', id: ngo.id, name: ngo.name || 'STK' };
    const brand = (adminBrands && adminBrands[0]) || fallbackBrand;
    if (brand?.id) return { kind: 'brand', id: brand.id, name: brand.name || 'Marka' };
    const club = (adminClubs && adminClubs[0]) || fallbackClub;
    if (club?.id) return { kind: 'club', id: club.id, name: club.name || 'Kulüp' };
    return null;
  }, [adminNgos, adminBrands, adminClubs, fallbackNgo, fallbackBrand, fallbackClub]);

  const isLoading = ngosLoading || brandsLoading || clubsLoading;

  const profilePath = useMemo(() => {
    if (!activeEntity) return '';
    if (activeEntity.kind === 'ngo') return `/ngos/${activeEntity.id}`;
    if (activeEntity.kind === 'brand') return `/market/${activeEntity.id}`;
    return `/clubs/profile/${activeEntity.id}`;
  }, [activeEntity]);

  const profileUrl = origin && profilePath ? `${origin}${profilePath}` : '';
  const qrCodeUrl = profileUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`
    : '';
  const shareText = activeEntity ? `Hangel'de ${activeEntity.name} profilini incele!` : '';
  const entityTypeLabel = activeEntity?.kind === 'ngo' ? 'STK' : activeEntity?.kind === 'brand' ? 'Marka' : activeEntity?.kind === 'club' ? 'Kulüp' : '';

  const copyToClipboard = () => {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl);
    toast({ title: 'Profil linki kopyalandı!' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!activeEntity) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Profil QR Kodu</h1>
          <p className="text-muted-foreground">Yönettiğiniz varlığın profil bağlantısı ve QR kodu burada görünür.</p>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">Yönetici olduğunuz bir varlık bulunamadı.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Lütfen sistem yöneticinize danışın.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col items-center text-center">
      <div>
        <h1 className="text-2xl font-bold">Profil QR Kodu</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Bu QR kodu okutarak veya linki paylaşarak profilini kolayca paylaş.
        </p>
      </div>

      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle>{activeEntity.name}</CardTitle>
          <CardDescription>{entityTypeLabel} Profil QR Kodu</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {qrCodeUrl && (
            <div className="bg-white p-4 rounded-lg">
              <Image src={qrCodeUrl} alt={`${activeEntity.name} QR Kodu`} width={200} height={200} unoptimized />
            </div>
          )}

          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-muted w-full">
            <p className="text-sm text-foreground font-mono break-all">{profileUrl}</p>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-full space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" asChild disabled={!qrCodeUrl}>
                <a href={qrCodeUrl} download={`${activeEntity.id}-qr-kodu.png`}>
                  <Download className="mr-2 h-4 w-4" />
                  QR Kodu İndir
                </a>
              </Button>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <Button asChild variant="outline" size="icon">
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-5 w-5" />
                </a>
              </Button>
              <Button asChild variant="outline" size="icon">
                <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
