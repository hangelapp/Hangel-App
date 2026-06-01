"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { flushOfflineQueue, getOfflineQueueSize, installOfflineQueueListener } from "@/lib/offline-queue";

/**
 * OfflineBanner — uygulamanın üst kısmında sabit görünür.
 *
 * - Offline iken kırmızı bant (cihaz/native fark etmeksizin)
 * - Online'a dönüldüğünde, kuyrukta bekleyen request varsa "Senkronlanıyor..."
 *   bildirimi gösterir; flush bitince 2 sn sonra kaybolur.
 *
 * Eskiden sadece native app'te gösteriliyordu; yeni offline queue + Firestore
 * persistence ile her client için anlamlı.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncedToast, setShowSyncedToast] = useState(false);

  // Tek sefer: global listener kur — online event'inde kuyruğu otomatik flush.
  useEffect(() => {
    installOfflineQueueListener();
    setQueueSize(getOfflineQueueSize());
  }, []);

  // Online'a döndüğünde kuyruk varsa flush et + UI'ı güncelle.
  useEffect(() => {
    if (!isOnline) {
      setQueueSize(getOfflineQueueSize());
      setIsSyncing(false);
      return;
    }
    const pending = getOfflineQueueSize();
    if (pending === 0) return;
    setIsSyncing(true);
    setQueueSize(pending);
    void flushOfflineQueue().then(() => {
      setIsSyncing(false);
      setQueueSize(getOfflineQueueSize());
      setShowSyncedToast(true);
      const t = setTimeout(() => setShowSyncedToast(false), 2000);
      return () => clearTimeout(t);
    });
  }, [isOnline]);

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-destructive px-4 py-2 text-center text-sm text-destructive-foreground pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>İnternet bağlantısı yok</span>
          {queueSize > 0 && (
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {queueSize} bekliyor
            </span>
          )}
        </div>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm text-white pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Senkronlanıyor… ({queueSize})</span>
        </div>
      </div>
    );
  }

  if (showSyncedToast) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 px-4 py-2 text-center text-sm text-white pt-[env(safe-area-inset-top)]">
        Çevrimiçi olundu, bekleyen işlemler tamamlandı.
      </div>
    );
  }

  return null;
}
