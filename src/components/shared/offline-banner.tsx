"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { isNativeApp } from "@/lib/capacitor";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Only show in native app context
    if (!isNativeApp()) return;

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    setIsOffline(!navigator.onLine);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive px-4 py-2 text-center text-sm text-destructive-foreground pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>İnternet bağlantısı yok</span>
      </div>
    </div>
  );
}
