'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HangelLogo } from '@/components/icons';
import { IndividualForm } from './_components/IndividualForm';
import { CorporateForm } from './_components/CorporateForm';
import { getQrOnboard } from '@/lib/onboarding/qr-onboarding';

// P2-6c: God-page (1174 LoC) refactored into _components/.
// page.tsx is now a thin router. Auth-critical flows (handleCheckEmail,
// signInWithEmailAndPassword, createUserWithEmailAndPassword, initiateEmailVerification,
// applications submit) live verbatim inside IndividualForm / CorporateForm.

// Safe-redirect helper: only allow same-origin relative paths via ?next=…
// Prevents open-redirect to arbitrary external URLs.
const resolveNext = (raw: string | null): string => {
    if (!raw) return '/market';
    // Must start with single "/" and not be protocol-relative ("//host").
    if (!raw.startsWith('/') || raw.startsWith('//')) return '/market';
    return raw;
};

const FormRenderer = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tab = searchParams.get('tab') || 'individual';
    const entity = searchParams.get('entity') || 'NGO';
    const nextPath = resolveNext(searchParams.get('next'));

    // BUG-18: Logged-in kullanıcılar da /login/selection'da bireysel + kurumsal
    // kayıt başvuru formlarını her zaman açabilmeli. Önceki redirect (PDF-3)
    // sadece action=register olmadığında atıyordu → kullanıcılar başvuru
    // formuna ulaşamıyordu. Form içleri logged-in user'ı zaten handle ediyor
    // (CorporateForm authUser?.uid'i applications doc'una yazıyor).

    return (
        // Üst boşluk cihaza göre: status bar/notch yüksekliği (--sat) + sabit
        // 0.75rem. Çentikli telefonlarda kart status bar'ın (saat/pil) altına
        // girmez; çentiksiz modellerde eski sabit pt-8'in yarattığı gereksiz
        // büyük boşluk kalkar. Alt tarafta da home-indicator payı bırakılır.
        <div className="min-h-dvh bg-secondary flex items-start justify-center px-4 pt-[calc(var(--sat)+0.75rem)] pb-[calc(var(--sab)+1rem)]">
            <div className="w-full max-w-sm">
                <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-background">
                    <CardHeader className="text-center pt-8 pb-5">
                        <HangelLogo className="text-3xl mx-auto mb-2" />
                        <CardTitle className="text-3xl font-black tracking-tighter">Merhaba</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-6 sm:px-8 pb-10">
                        <Tabs value={tab} onValueChange={(val) => router.push(`/login/selection?tab=${val}&entity=${entity}`)}>
                            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
                                <TabsTrigger value="individual" className="rounded-lg font-bold">Bireysel</TabsTrigger>
                                <TabsTrigger value="corporate" className="rounded-lg font-bold">Kurumsal</TabsTrigger>
                            </TabsList>
                            <TabsContent value="individual" className="pt-4">
                                <IndividualForm onComplete={(isNewUser) => {
                                    // Yeni kayıt olan kullanıcılara "hoş geldin sıralı popart"ı (onboarding
                                    // turu) gösterme — kullanıcı isteği. Tur anahtarını 'done' işaretle.
                                    if (isNewUser) { try { localStorage.setItem('hangel_onboarding_v1_done', '1'); } catch { /* yut */ } }
                                    // QR-etkinlik akışı: kayıttan sonra ÖNCE etkinlik detayına git
                                    // (hoş geldin/welcome yerine). Marker yoksa mevcut davranış aynı.
                                    const qr = getQrOnboard();
                                    if (qr) { router.push(`/events/${qr.eventId}`); return; }
                                    router.push(isNewUser ? '/welcome' : nextPath);
                                }} />
                            </TabsContent>
                            <TabsContent value="corporate" className="pt-4">
                                <CorporateForm initialEntity={entity} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default function LoginSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <FormRenderer />
    </Suspense>
  );
}
