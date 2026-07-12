'use client';

/**
 * EventPhotosDialog — her etkinlikte kullanılan, kendi kendine yeten foto merkezi.
 *
 * Sekmeler / yetenekler:
 *  1. Galeri: events/{eventId}/photos gerçek-zamanlı ızgara (yeniden eskiye). Foto'ya
 *     dokun → lightbox (İndir + Paylaş).
 *  2. Fotoğraf Yükle: çoklu görsel seç (her biri ≤10MB) → Storage
 *     event-photos/{eventId}/{photoId}.{ext} → foto belgesi yaz. Giriş gerektirir.
 *     Yükleme sırasında (mümkünse) yüz vektörleri hesaplanıp belgeye yazılır.
 *  3. Selfie ile Bul: ÖN kamera (facingMode 'user') ile selfie → galeride O KİŞİYİ
 *     içeren fotoğrafları yerel yüz eşleştirmeyle filtreler. Selfie SUNUCUYA
 *     YÜKLENMEZ (KVKK notu gösterilir). Kütüphane/modeller yoksa buton gizlenir.
 *  4. QR + Link: https://hangel.org/events/{eventId}?photos=1 için LogoQr + link kopya.
 *
 * Yükleme deseni ngo-admin/posts sayfasından, kamera yaşam döngüsü qr-scan-dialog'dan
 * uyarlanmıştır (ön kamera + temizlik). face-api tembel yüklenir.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NextImage from 'next/image';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  doc,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LogoQr } from '@/components/shared/logo-qr';
import { ShareButtons } from '@/components/shared/share-buttons';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import type { EventPhoto } from '@/lib/types';
import {
  ensureFaceModels,
  computeFaceDescriptors,
  computeSingleFaceDescriptor,
  descriptorFromUrl,
  descriptorsMatch,
} from '@/lib/face-match';
import {
  Images,
  Upload,
  Loader2,
  Download,
  ScanFace,
  Copy,
  Check,
  X,
  Camera,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';

// ---- yardımcılar ---------------------------------------------------------

/** Dosya adından uzantı çıkar (varsayılan jpg). */
function extOf(file: File): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(file.name);
  const ext = (m?.[1] || file.type.split('/')[1] || 'jpg').toLowerCase();
  return ext.replace(/[^a-z0-9]/g, '') || 'jpg';
}

/** Basit benzersiz id (photoId + belge id). */
function makeId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Bir URL'i indir (fetch → blob → a.download). CORS engellerse yeni sekmede aç. */
async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('fetch-failed');
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
  } catch {
    // CORS ile indirme başarısız → en azından yeni sekmede aç.
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/** Bir görsel URL'inden yüz-eşleşmesi için HTMLImageElement üret (crossOrigin). */
function loadImageEl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// ---- bileşen -------------------------------------------------------------

export function EventPhotosDialog({
  eventId,
  eventName,
  open,
  onOpenChange,
}: {
  eventId: string;
  eventName?: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  // lightbox
  const [lightbox, setLightbox] = useState<EventPhoto | null>(null);

  // link kopya
  const [copied, setCopied] = useState(false);

  // Selfie ile bul
  const [faceReady, setFaceReady] = useState<boolean | null>(null); // null = kontrol ediliyor
  const [selfieMode, setSelfieMode] = useState(false);
  const [selfieConsent, setSelfieConsent] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [matchIds, setMatchIds] = useState<string[] | null>(null); // null = filtre yok
  const [camError, setCamError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Profil fotoğrafı ile bul: kullanıcının profil foto vektörü (best-effort, cache)
  const profileDescRef = useRef<number[] | null>(null); // hesaplanan vektör
  const [profileScanning, setProfileScanning] = useState(false);

  // --- kullanıcı profil belgesi (avatar için) ---
  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, COLLECTIONS.users, user.uid) : null),
    [firestore, user],
  );
  const { data: userData } = useDoc<User>(userDocRef);
  // kanonik profil fotoğrafı: Firestore user.avatarUrl → authUser.photoURL yedek
  const profilePhotoUrl = userData?.avatarUrl || user?.photoURL || undefined;

  // --- galeri sorgusu (yeniden eskiye) ---
  const photosQuery = useMemoFirebase(
    () =>
      firestore && open
        ? query(
            collection(firestore, COLLECTIONS.events, eventId, COLLECTIONS.eventPhotos),
            orderBy('createdAt', 'desc'),
          )
        : null,
    [firestore, eventId, open],
  );
  const { data: photos, isLoading } = useCollection<EventPhoto>(photosQuery);

  const publicUrl = `https://hangel.org/events/${eventId}?photos=1`;

  // --- face-api uygunluğunu (kütüphane + modeller) dialog açılınca kontrol et ---
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFaceReady(null);
    ensureFaceModels()
      .then((ok) => {
        if (!cancelled) setFaceReady(ok);
      })
      .catch(() => {
        if (!cancelled) setFaceReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // --- profil fotoğrafı vektörünü bir kez, en iyi çabayla önceden hesapla ---
  // Kullanıcının profil fotoğrafı varsa +1 selfie olarak referans kabul edilir.
  useEffect(() => {
    if (!open || faceReady !== true || !profilePhotoUrl) {
      profileDescRef.current = null;
      return;
    }
    let cancelled = false;
    profileDescRef.current = null;
    descriptorFromUrl(profilePhotoUrl)
      .then((d) => {
        if (!cancelled) profileDescRef.current = d;
      })
      .catch(() => {
        if (!cancelled) profileDescRef.current = null;
      });
    return () => {
      cancelled = true;
    };
  }, [open, faceReady, profilePhotoUrl]);

  // --- kamera temizliği ---
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // dialog kapanınca her şeyi temizle
  useEffect(() => {
    if (open) return;
    stopCamera();
    setSelfieMode(false);
    setSelfieConsent(false);
    setScanning(false);
    setProfileScanning(false);
    setMatchIds(null);
    setCamError('');
    setLightbox(null);
  }, [open, stopCamera]);

  // --- fotoğraf yükleme ---
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (!user?.uid) {
        toast({ variant: 'destructive', title: 'Yüklemek için giriş yap' });
        return;
      }
      if (!firestore) return;

      const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (list.length === 0) {
        toast({ variant: 'destructive', title: 'Geçersiz dosya', description: 'Lütfen görsel seçin.' });
        return;
      }

      setUploading(true);
      setUploadProgress({ done: 0, total: list.length });
      const storage = getStorage();
      let ok = 0;
      let skippedBig = 0;

      // face-api hazırsa yükleme sırasında vektör çıkar (best-effort).
      const faceOk = await ensureFaceModels().catch(() => false);

      for (const file of list) {
        if (file.size > 10 * 1024 * 1024) {
          skippedBig++;
          setUploadProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
          continue;
        }
        try {
          const photoId = makeId();
          const ext = extOf(file);
          const path = `event-photos/${eventId}/${photoId}.${ext}`;
          const r = storageRef(storage, path);
          await uploadBytes(r, file);
          const url = await getDownloadURL(r);

          // Yüz vektörleri (best-effort). Modeller yoksa / yüz yoksa boş kalır.
          let faceDescriptors: number[][] = [];
          if (faceOk) {
            try {
              const objUrl = URL.createObjectURL(file);
              const imgEl = await loadImageEl(objUrl);
              faceDescriptors = await computeFaceDescriptors(imgEl);
              URL.revokeObjectURL(objUrl);
            } catch {
              faceDescriptors = [];
            }
          }

          const photoDoc: Record<string, unknown> = {
            id: photoId,
            url,
            uploaderUid: user.uid,
            uploaderName: user.displayName || user.email || '',
            createdAt: serverTimestamp(),
          };
          if (faceDescriptors.length > 0) photoDoc.faceDescriptors = faceDescriptors;

          await setDoc(
            doc(firestore, COLLECTIONS.events, eventId, COLLECTIONS.eventPhotos, photoId),
            photoDoc,
          );
          ok++;
        } catch (e) {
          const err = e as { code?: string; message?: string };
          toast({
            variant: 'destructive',
            title: 'Bir fotoğraf yüklenemedi',
            description:
              err?.code === 'storage/unauthorized'
                ? 'Yükleme izniniz yok.'
                : err?.message?.slice(0, 140) || 'Beklenmeyen hata.',
          });
        } finally {
          setUploadProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
        }
      }

      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (ok > 0) {
        toast({ title: `${ok} fotoğraf yüklendi`, description: 'Galeride görebilirsin.' });
      }
      if (skippedBig > 0) {
        toast({
          variant: 'destructive',
          title: `${skippedBig} fotoğraf atlandı`,
          description: 'Her fotoğraf en fazla 10MB olabilir.',
        });
      }
    },
    [user, firestore, eventId, toast],
  );

  const triggerFilePick = useCallback(() => {
    if (!user?.uid) {
      toast({ variant: 'destructive', title: 'Yüklemek için giriş yap' });
      return;
    }
    fileInputRef.current?.click();
  }, [user, toast]);

  // --- Selfie ile bul: kamera başlat (ÖN kamera) ---
  const startSelfieCamera = useCallback(async () => {
    setCamError('');
    setScanning(false);
    const tryGetStream = async (): Promise<MediaStream> => {
      const attempts: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: 'user' } } },
        { video: { facingMode: 'user' } },
        { video: true },
      ];
      let lastErr: unknown;
      for (const c of attempts) {
        try {
          return await navigator.mediaDevices.getUserMedia(c);
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr ?? new Error('no-stream');
    };
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-getusermedia');
      let stream: MediaStream;
      try {
        stream = await tryGetStream();
      } catch (e1) {
        // İzin diyaloğu yeni cevaplanmış olabilir → kısa bekleyip bir kez daha dene.
        const n = (e1 as { name?: string } | null)?.name;
        if (n === 'NotAllowedError' || n === 'NotReadableError' || n === 'AbortError') {
          await new Promise((r) => setTimeout(r, 800));
          stream = await tryGetStream();
        } else {
          throw e1;
        }
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          /* autoplay devralır */
        }
      }
    } catch (e) {
      const name = (e as { name?: string } | null)?.name;
      setCamError(
        name === 'NotAllowedError'
          ? 'Kamera izni reddedildi. Ayarlardan kamera iznini açıp tekrar dene.'
          : name === 'NotFoundError'
            ? 'Ön kamera bulunamadı.'
            : 'Kameraya erişilemedi. Tekrar dene.',
      );
    }
  }, []);

  // consent verilip selfie moduna geçilince kamerayı aç
  useEffect(() => {
    if (open && selfieMode && selfieConsent) {
      void startSelfieCamera();
    }
    // selfie modundan çıkınca kamerayı kapat
    if (!selfieMode) stopCamera();
  }, [open, selfieMode, selfieConsent, startSelfieCamera, stopCamera]);

  /**
   * Verilen referans vektör kümesiyle galeriyi filtrele.
   * Bir foto, depolanmış vektörlerinden herhangi biri, referanslardan HERHANGİ birine
   * eşik altında yakınsa eşleşir. Kaç selfie/referans kullanıldığını bildirmek için
   * bir bilgi metni de üretir.
   */
  const runMatch = useCallback(
    (references: number[][], opts: { usedSelfie: boolean; usedProfile: boolean }) => {
      const refs = references.filter((r) => r && r.length > 0);
      // Bir foto, depolanmış vektörlerinden biri referanslardan HERHANGİ birine yakınsa eşleşir.
      const matches = (photos || [])
        .filter((p) => refs.some((ref) => descriptorsMatch(ref, p.faceDescriptors)))
        .map((p) => p.id);

      setMatchIds(matches);

      const bothUsed = opts.usedSelfie && opts.usedProfile;
      toast({
        title: matches.length > 0 ? `${matches.length} fotoğraf bulundu` : 'Eşleşme yok',
        description:
          matches.length > 0
            ? bothUsed
              ? 'Selfie + profil fotoğrafınla eşleştiriliyor. İçinde olduğun fotoğraflar gösteriliyor.'
              : 'İçinde olduğun fotoğraflar gösteriliyor.'
            : 'Eşleşen fotoğraf bulunamadı.',
      });
    },
    [photos, toast],
  );

  // selfie çek → eşleşenleri bul (selfie + varsa profil fotoğrafı referansı)
  const captureAndMatch = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    setScanning(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no-ctx');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const selfieDesc = await computeSingleFaceDescriptor(canvas);
      // Selfie'yi bulundurma — kamerayı hemen kapat (sunucuya gitmez).
      stopCamera();

      // Referanslar: canlı selfie (varsa) + profil fotoğrafı vektörü (varsa).
      const profileDesc = profileDescRef.current;
      const references: number[][] = [];
      if (selfieDesc) references.push(selfieDesc);
      if (profileDesc) references.push(profileDesc);

      if (references.length === 0) {
        setScanning(false);
        toast({
          variant: 'destructive',
          title: 'Yüz bulunamadı',
          description: 'Yüzünü net gösterecek şekilde tekrar dene.',
        });
        return;
      }

      runMatch(references, { usedSelfie: !!selfieDesc, usedProfile: !!profileDesc });
      setSelfieMode(false);
      setScanning(false);
    } catch {
      setScanning(false);
      stopCamera();
      toast({ variant: 'destructive', title: 'Eşleştirme başarısız', description: 'Tekrar dene.' });
    }
  }, [runMatch, stopCamera, toast]);

  // Profil fotoğrafımla bul: kamera gerektirmez, yalnızca profil vektörüyle eşleştir.
  const matchWithProfile = useCallback(async () => {
    setProfileScanning(true);
    try {
      // Vektör henüz hazır değilse (önceden hesaplanmadıysa) burada dene.
      let profileDesc = profileDescRef.current;
      if (!profileDesc && profilePhotoUrl) {
        profileDesc = await descriptorFromUrl(profilePhotoUrl);
        profileDescRef.current = profileDesc;
      }
      if (!profileDesc) {
        setProfileScanning(false);
        toast({
          variant: 'destructive',
          title: 'Profil fotoğrafında yüz bulunamadı',
          description: 'Yüzün net göründüğü bir profil fotoğrafı deneyebilirsin.',
        });
        return;
      }
      runMatch([profileDesc], { usedSelfie: false, usedProfile: true });
      setProfileScanning(false);
    } catch {
      setProfileScanning(false);
      toast({ variant: 'destructive', title: 'Eşleştirme başarısız', description: 'Tekrar dene.' });
    }
  }, [profilePhotoUrl, runMatch, toast]);

  const cancelSelfie = useCallback(() => {
    stopCamera();
    setSelfieMode(false);
    setSelfieConsent(false);
    setCamError('');
    setScanning(false);
  }, [stopCamera]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ variant: 'destructive', title: 'Kopyalanamadı' });
    }
  }, [publicUrl, toast]);

  // filtre uygulanmış gösterilecek fotoğraflar
  const shownPhotos = useMemo(() => {
    if (!photos) return [];
    if (matchIds == null) return photos;
    const set = new Set(matchIds);
    return photos.filter((p) => set.has(p.id));
  }, [photos, matchIds]);

  const count = photos?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Images className="h-5 w-5" /> Etkinlik Fotoğrafları
          </DialogTitle>
          <DialogDescription className="text-xs">
            {eventName ? `${eventName} — ` : ''}Fotoğraf yükle, galeriyi gör, selfie ile kendi
            fotoğraflarını bul.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gallery">Galeri</TabsTrigger>
            <TabsTrigger value="share">QR & Link</TabsTrigger>
          </TabsList>

          {/* -------- GALERİ -------- */}
          <TabsContent value="gallery" className="space-y-3">
            {/* eylem çubuğu */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void handleFiles(e.target.files)}
              />
              <Button
                type="button"
                size="sm"
                className="rounded-xl"
                onClick={triggerFilePick}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    {uploadProgress
                      ? `Yükleniyor ${uploadProgress.done}/${uploadProgress.total}`
                      : 'Yükleniyor…'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1.5" /> Fotoğraf Yükle
                  </>
                )}
              </Button>

              {/* Selfie ile Bul — yalnızca face-api hazırsa */}
              {faceReady && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setMatchIds(null);
                    setSelfieMode(true);
                  }}
                  disabled={uploading || count === 0}
                >
                  <ScanFace className="h-4 w-4 mr-1.5" /> Selfie ile Bul
                </Button>
              )}

              {/* Profil fotoğrafımla Bul — face-api hazır ve profil fotoğrafı varsa */}
              {faceReady && !!profilePhotoUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setMatchIds(null);
                    void matchWithProfile();
                  }}
                  disabled={uploading || count === 0 || profileScanning}
                >
                  {profileScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Aranıyor…
                    </>
                  ) : (
                    <>
                      <UserCircle className="h-4 w-4 mr-1.5" /> Profil fotoğrafımla bul
                    </>
                  )}
                </Button>
              )}

              {/* filtre etkinse temizle */}
              {matchIds != null && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setMatchIds(null)}
                >
                  <X className="h-4 w-4 mr-1.5" /> Filtreyi temizle
                </Button>
              )}
            </div>

            {/* KVKK consent + kamera paneli */}
            {selfieMode && (
              <div className="rounded-xl border bg-muted/40 p-3 space-y-3">
                {!selfieConsent ? (
                  <>
                    <div className="flex items-start gap-2 text-sm">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                      <p className="text-muted-foreground">
                        Selfie&apos;niz yalnızca fotoğraflarınızı bulmak için cihazınızda işlenir,
                        sunucuya yüklenmez.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={() => setSelfieConsent(true)}>
                        <Camera className="h-4 w-4 mr-1.5" /> Kamerayı Aç
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={cancelSelfie}>
                        Vazgeç
                      </Button>
                    </div>
                  </>
                ) : camError ? (
                  <div className="space-y-2 text-center">
                    <p className="text-sm text-muted-foreground">{camError}</p>
                    <div className="flex justify-center gap-2">
                      <Button type="button" size="sm" onClick={() => void startSelfieCamera()}>
                        Tekrar Dene
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={cancelSelfie}>
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl bg-black">
                      {/* ön kamera → ayna görüntüsü */}
                      <video
                        ref={videoRef}
                        className="h-full w-full object-cover [transform:scaleX(-1)]"
                        autoPlay
                        playsInline
                        muted
                      />
                      {scanning && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    {!!profilePhotoUrl && (
                      <p className="text-center text-xs text-muted-foreground">
                        Selfie + profil fotoğrafınla eşleştiriliyor.
                      </p>
                    )}
                    <div className="flex justify-center gap-2">
                      <Button type="button" size="sm" onClick={() => void captureAndMatch()} disabled={scanning}>
                        <ScanFace className="h-4 w-4 mr-1.5" /> Selfie Çek & Bul
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={cancelSelfie} disabled={scanning}>
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ızgara */}
            {isLoading ? (
              <div className="py-12 flex justify-center items-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Yükleniyor…
              </div>
            ) : count === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Bu etkinlik için henüz fotoğraf yüklenmemiş. İlk yükleyen sen ol!
              </p>
            ) : shownPhotos.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Bu selfie ile eşleşen fotoğraf bulunamadı.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {matchIds != null
                    ? `${shownPhotos.length} eşleşen fotoğraf`
                    : `${count} fotoğraf`}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {shownPhotos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLightbox(p)}
                      className="relative aspect-square overflow-hidden rounded-xl border bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label="Fotoğrafı büyüt"
                    >
                      {p.url ? (
                        <NextImage
                          src={p.thumbUrl || p.url}
                          alt={`${p.uploaderName || 'Katılımcı'} tarafından yüklenen fotoğraf`}
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      ) : null}
                    </button>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* -------- QR & LINK -------- */}
          <TabsContent value="share" className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="rounded-2xl bg-white p-3">
                <LogoQr value={publicUrl} size={200} />
              </div>
              <p className="text-sm text-muted-foreground">
                Bu QR&apos;ı okutan herkes etkinliğin foto merkezini açar.
              </p>
              <code className="max-w-full break-all rounded-lg border bg-muted/50 px-2.5 py-1.5 text-xs">
                {publicUrl}
              </code>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={copyLink}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5" /> Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1.5" /> Linki Kopyala
                    </>
                  )}
                </Button>
                <ShareButtons url={publicUrl} title={`${eventName || 'Etkinlik'} — Fotoğraflar`} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* -------- LIGHTBOX (önizleme) -------- */}
        {lightbox && (
          <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
            <DialogContent className="sm:max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base">
                  {lightbox.uploaderName || 'Katılımcı'} tarafından
                </DialogTitle>
              </DialogHeader>
              <div className="relative w-full overflow-hidden rounded-xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- lightbox tam boy, unoptimized */}
                <img
                  src={lightbox.url}
                  alt="Etkinlik fotoğrafı"
                  className="max-h-[60vh] w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void downloadImage(lightbox.url, `hangel-${eventId}-${lightbox.id}.jpg`)
                  }
                >
                  <Download className="h-4 w-4 mr-1.5" /> İndir
                </Button>
                <ShareButtons url={lightbox.url} title={`${eventName || 'Etkinlik'} fotoğrafı`} />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
