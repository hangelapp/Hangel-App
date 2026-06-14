"use client";

import { useEffect, useState } from "react";
import { MailWarning, X } from "lucide-react";
import { useUser } from "@/firebase";
import { initiateEmailVerification } from "@/firebase/non-blocking-login";
import { useToast } from "@/hooks/use-toast";

const DISMISS_KEY = "hangel:verify-email-banner:dismissed";

export function VerifyEmailBanner() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [dismissed, setDismissed] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    }, []);

    if (isUserLoading || !user || user.emailVerified || dismissed) return null;

    // Yalnızca e-posta/şifre ile kayıt olan kullanıcıya göster. Telefon/WhatsApp
    // ile gelenlerin (providerId 'phone' / custom token) e-postası yoktur ya da
    // pseudo-email'dir → banner gösterilmez.
    const isPasswordUser = user.providerData?.some((p) => p?.providerId === "password");
    if (!isPasswordUser) return null;

    // Eski telefon pseudo-email hesaplar için banner göstermeye gerek yok.
    if (user.email?.endsWith("@hangel.app") || user.email?.endsWith("@hangel.org")) return null;

    const handleResend = async () => {
        setSending(true);
        try {
            await initiateEmailVerification(user);
            toast({ title: "Gönderildi", description: "Doğrulama e-postası tekrar gönderildi." });
        } catch (err: unknown) {
            const code = (err as { code?: string } | undefined)?.code;
            const msg =
                code === "auth/too-many-requests"
                    ? "Çok fazla deneme. Biraz sonra tekrar deneyin."
                    : "E-posta gönderilemedi.";
            toast({ variant: "destructive", title: "Hata", description: msg });
        } finally {
            setSending(false);
        }
    };

    const handleDismiss = () => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem(DISMISS_KEY, "1");
        }
        setDismissed(true);
    };

    // Banner, fixed header'ın (h-12 + safe-area-top) hemen ALTINA konumlanır.
    // - `fixed` + safe-area offset: iOS WebView'da status bar / notch altında kalmaz.
    // - z-40: header (z-30) üzerinde, modal/sheet (z-50) altında.
    // - Görünmez bir spacer (h-9) normal akışta yer kaplayıp main içeriği aşağı iter.
    return (
        <>
            <div
                className="fixed left-0 right-0 z-40 lg:left-64 bg-amber-50 border-b border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-100 shadow-sm"
                style={{ top: "calc(3rem + env(safe-area-inset-top))" }}
            >
                <div className="max-w-5xl mx-auto px-3 h-9 flex items-center gap-2 text-xs sm:text-sm">
                    <MailWarning className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 leading-tight truncate">
                        E-postanızı doğrulayın. Bazı özellikler için gerekli olabilir.
                    </span>
                    <button
                        type="button"
                        className="font-bold underline underline-offset-2 disabled:opacity-50 shrink-0"
                        onClick={handleResend}
                        disabled={sending}
                    >
                        {sending ? "Gönderiliyor..." : "Tekrar gönder"}
                    </button>
                    <button
                        type="button"
                        className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 shrink-0"
                        onClick={handleDismiss}
                        aria-label="Kapat"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            {/* Spacer: banner fixed olduğu için normal akışta yer tutarak
                AppShell'in <main> içeriğini banner kadar aşağı kaydırır. */}
            <div aria-hidden="true" className="h-9 shrink-0" />
        </>
    );
}
