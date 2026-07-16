'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { languages, useTranslation } from '@/components/providers/language-provider';
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
    const { language, changeLanguage } = useTranslation();
    const tab = searchParams.get('tab') || 'individual';
    const entity = searchParams.get('entity') || 'NGO';
    const nextPath = resolveNext(searchParams.get('next'));

    // Etkinlik/gönüllülük katılımından gelen kullanıcı için Kurumsal tab'ini gizle
    // (yalnız bireysel kayıt — kurumsal sekmesi katılımcıyı karıştırıyordu). İki yol:
    //  (1) QR onboarding akışı (getQrOnboard marker'ı) — localStorage, mount sonrası.
    //  (2) "Katıl/Başvur" butonundan gelen requireAuth: next= /events/… ya da
    //      /volunteering/… detay sayfasına işaret eder (server'da da bilinir → SSR uyumlu).
    const nextIsParticipation = /^\/(events|volunteering)\//.test(nextPath);
    const [qrFlow, setQrFlow] = useState(false);
    useEffect(() => { setQrFlow(!!getQrOnboard()); }, []);
    // participationFlow: kurumsal sekmesi gizlenecek mi? next tabanlı kısım SSR'da
    // da bilindiği için hidrasyon uyuşmazlığı olmaz; qrFlow mount sonrası eklenir.
    const participationFlow = qrFlow || nextIsParticipation;
    const effectiveTab = participationFlow ? 'individual' : tab;

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
                {/* Dil seçici — giriş ekranında da dil değiştirilebilsin (Samara m.12) */}
                <div className="flex justify-end mb-2">
                    <Select value={language} onValueChange={changeLanguage}>
                        <SelectTrigger className="w-auto border-none bg-transparent gap-1 h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground focus:ring-0">
                            <Globe className="h-3.5 w-3.5" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {languages.map(lang => (
                                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-background">
                    <CardHeader className="text-center pt-8 pb-5">
                        <HangelLogo className="text-3xl mx-auto mb-2" />
                        <CardTitle className="text-3xl font-black tracking-tighter">Merhaba</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-6 sm:px-8 pb-10">
                        <Tabs value={effectiveTab} onValueChange={(val) => { if (participationFlow) return; router.push(`/login/selection?tab=${val}&entity=${entity}`); }}>
                            {/* Etkinlik/gönüllülük katılımından gelindiğinde Kurumsal tab gizli — yalnız bireysel kayıt. */}
                            {!participationFlow && (
                                <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
                                    <TabsTrigger value="individual" className="rounded-lg font-bold">Bireysel</TabsTrigger>
                                    <TabsTrigger value="corporate" className="rounded-lg font-bold">Kurumsal</TabsTrigger>
                                </TabsList>
                            )}
                            <TabsContent value="individual" className="pt-4">
                                <IndividualForm onComplete={(isNewUser) => {
                                    // Yeni kayıt olan kullanıcılara "hoş geldin sıralı popart"ı (onboarding
                                    // turu) gösterme — kullanıcı isteği. Tur anahtarını 'done' işaretle.
                                    if (isNewUser) { try { localStorage.setItem('hangel_onboarding_v1_done', '1'); } catch { /* yut */ } }
                                    // QR-etkinlik akışı: kayıttan sonra ÖNCE etkinlik detayına git
                                    // (hoş geldin/welcome yerine). Marker yoksa mevcut davranış aynı.
                                    const qr = getQrOnboard();
                                    if (qr) {
                                        // GARANTİLİ RSVP: `pendingRsvp` sessionStorage'da tutulduğu için auth
                                        // redirect'inde kaybolabiliyor (kullanıcı kaydoluyor ama etkinliğe
                                        // KAYDOLMUŞ görünmüyordu). qrOnboard.eventId localStorage'da güvenilir →
                                        // RSVP'yi burada doğrudan POST et (idempotent; etkinlik sayfası yedek).
                                        void (async () => {
                                            try {
                                                const { getAuth } = await import('firebase/auth');
                                                const u = getAuth().currentUser;
                                                if (u) {
                                                    const token = await u.getIdToken();
                                                    await fetch(`/api/events/${qr.eventId}/rsvp`, {
                                                        method: 'POST',
                                                        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
                                                        body: JSON.stringify({ action: 'going' }),
                                                    });
                                                }
                                            } catch { /* best-effort; etkinlik sayfasındaki pendingRsvp yedeği devrede */ }
                                        })();
                                        router.push(`/events/${qr.eventId}`);
                                        return;
                                    }
                                    router.push(isNewUser ? '/welcome' : nextPath);
                                }} />
                            </TabsContent>
                            {!participationFlow && (
                                <TabsContent value="corporate" className="pt-4">
                                    <CorporateForm initialEntity={entity} />
                                </TabsContent>
                            )}
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
