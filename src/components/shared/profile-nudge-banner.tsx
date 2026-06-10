"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, X } from "lucide-react";
import { doc } from "firebase/firestore";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { COLLECTIONS } from "@/firebase/collections";
import type { User } from "@/lib/types";

const DISMISS_KEY = "profileNudgeDismissed";

/**
 * Kalıcı profil tamamlama uyarısı. Giriş yapmış ve onboarding'i tamamlamış
 * kullanıcının profili EKSİKSE üstte gösterilir.
 *
 * Eksiklik kriteri (herhangi biri):
 *   - personalInfo.email yok
 *   - personalInfo.birthDate yok
 *   - personalInfo.address.city yok
 *   - volunteerInfo.interests boş
 *
 * Kapatılabilir (localStorage 'profileNudgeDismissed'); ancak dismiss edilse de
 * eksiklik sürdükçe bir sonraki OTURUMDA tekrar gösterilir — bu yüzden dismiss
 * bilgisi sessionStorage'da değil component state'inde tutulur ve oturum başında
 * localStorage'dan okunur, eksiklik düzelince bayrak temizlenir.
 */
export function ProfileNudgeBanner() {
    const { user: authUser, isUserLoading } = useUser();
    const db = useFirestore();
    const [dismissed, setDismissed] = useState(false);

    const userDocRef = useMemoFirebase(
        () => (db && authUser ? doc(db, COLLECTIONS.users, authUser.uid) : null),
        [db, authUser?.uid],
    );
    const { data: userData, isLoading: userLoading } = useDoc<User>(userDocRef);

    const incomplete = (() => {
        if (!userData) return false;
        const personal = userData.personalInfo;
        const volunteer = userData.volunteerInfo;
        const noEmail = !personal?.email?.trim();
        const noBirthDate = !personal?.birthDate?.trim();
        const noCity = !personal?.address?.city?.trim();
        const noInterests = !Array.isArray(volunteer?.interests) || volunteer.interests.length === 0;
        return noEmail || noBirthDate || noCity || noInterests;
    })();

    // Onboarding henüz bitmemişse (zorunlu adımlar) nudge gösterme.
    const onboardingComplete = (userData as { onboardingComplete?: boolean } | null)?.onboardingComplete;
    const hasSupportedNgos = Array.isArray(userData?.supportedNgos) && userData.supportedNgos.length > 0;
    const hasVolunteerInfo = !!(userData as { volunteerInfo?: unknown } | null)?.volunteerInfo;
    // onboardingComplete açıkça true VEYA (eski kullanıcı: supportedNgos/volunteerInfo var) → tamamlanmış say.
    const onboardingDone = onboardingComplete === true || hasSupportedNgos || hasVolunteerInfo;

    // Dismiss bayrağını oturum başında localStorage'dan oku.
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
        } catch {
            // localStorage erişilemedi (private mode) — varsayılan false.
        }
    }, []);

    // Eksiklik düzeldiyse dismiss bayrağını temizle (bir dahaki eksiklikte tekrar gösterilebilsin).
    useEffect(() => {
        if (!incomplete && typeof window !== "undefined") {
            try {
                window.localStorage.removeItem(DISMISS_KEY);
            } catch {
                // yoksay
            }
        }
    }, [incomplete]);

    if (isUserLoading || userLoading || !authUser || !userData) return null;
    if (!onboardingDone) return null;
    if (!incomplete || dismissed) return null;

    const handleDismiss = () => {
        if (typeof window !== "undefined") {
            try {
                window.localStorage.setItem(DISMISS_KEY, "1");
            } catch {
                // yoksay
            }
        }
        setDismissed(true);
    };

    return (
        <div className="bg-primary/10 border-b border-primary/20 text-foreground">
            <div className="max-w-5xl mx-auto px-3 py-2 flex items-center gap-3 text-xs sm:text-sm">
                <UserPlus className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 leading-tight">
                    <span className="font-semibold">Profilini tamamla</span>
                    {" — "}
                    sana uygun STK ve gönüllülükleri önerebilmemiz için birkaç bilgi daha.
                </span>
                <Link
                    href="/settings/profile"
                    className="font-bold text-primary underline underline-offset-2 shrink-0"
                >
                    Tamamla
                </Link>
                <button
                    type="button"
                    className="p-1 rounded hover:bg-primary/15 shrink-0"
                    onClick={handleDismiss}
                    aria-label="Kapat"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
