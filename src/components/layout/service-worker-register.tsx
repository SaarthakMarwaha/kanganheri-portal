"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useLocale } from "next-intl";

export function ServiceWorkerRegister() {
  const locale = useLocale();
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration silent fallback
      });
    }

    // 2. Connectivity Listeners
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3500);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 duration-200 animate-in fade-in slide-in-from-bottom-2"
    >
      {isOffline ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur">
          <WifiOff className="h-4 w-4 shrink-0 animate-pulse text-amber-200" aria-hidden="true" />
          <span>
            {locale === "hi"
              ? "ऑफ़लाइन मोड सक्रिय — आपातकालीन नंबर एवं भूमि कनवर्टर उपलब्ध हैं"
              : "Offline mode active — Emergency lifelines & Land converter available"}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur">
          <Wifi className="h-4 w-4 shrink-0 text-emerald-200" aria-hidden="true" />
          <span>
            {locale === "hi"
              ? "इंटरनेट कनेक्शन पुनः स्थापित हो गया"
              : "Back online — connection restored"}
          </span>
        </div>
      )}
    </div>
  );
}
