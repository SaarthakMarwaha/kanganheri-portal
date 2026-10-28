import React from "react";
import { Link } from "@/i18n/routing";
import { PhoneCall, ShieldAlert, Zap, Droplet, Flame } from "lucide-react";
import { useTranslations } from "next-intl";

export function EmergencyBar() {
  const t = useTranslations("emergency");

  return (
    <aside
      aria-label="Emergency quick contact numbers"
      className="select-none border-b border-red-700 bg-danger-red px-4 py-1.5 text-xs font-semibold text-white shadow-inner"
    >
      <div className="container mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-x-6 gap-y-1">
        {/* Left: Emergency SOS badge */}
        <div className="flex shrink-0 items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 animate-pulse text-yellow-300" aria-hidden="true" />
          <span className="font-bold uppercase tracking-wider text-yellow-300">
            {t("barTitle")}:
          </span>
        </div>

        {/* Center: Immediate one-tap civic lifelines */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a
            href="tel:100"
            className="inline-flex items-center gap-1 rounded text-white underline-offset-2 transition-colors hover:text-yellow-200 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            title="Police Emergency (100)"
          >
            <PhoneCall className="h-3 w-3 text-yellow-300" aria-hidden="true" />
            <span>{t("police")}</span>
          </a>

          <span className="hidden text-red-300 sm:inline" aria-hidden="true">
            •
          </span>

          <a
            href="tel:102"
            className="inline-flex items-center gap-1 rounded text-white underline-offset-2 transition-colors hover:text-yellow-200 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            title="Ambulance Emergency (102)"
          >
            <PhoneCall className="h-3 w-3 text-yellow-300" aria-hidden="true" />
            <span>{t("ambulance")}</span>
          </a>

          <span className="hidden text-red-300 sm:inline" aria-hidden="true">
            •
          </span>

          <a
            href="tel:101"
            className="inline-flex items-center gap-1 rounded text-white underline-offset-2 transition-colors hover:text-yellow-200 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            title="Fire Service (101)"
          >
            <Flame className="h-3 w-3 text-orange-300" aria-hidden="true" />
            <span>{t("fire")}</span>
          </a>

          <span className="hidden text-red-300 md:inline" aria-hidden="true">
            •
          </span>

          <a
            href="tel:19123"
            className="inline-flex items-center gap-1 rounded text-white underline-offset-2 transition-colors hover:text-yellow-200 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            title="BSES Rajdhani Electricity Outage Helpline (19123)"
          >
            <Zap className="h-3 w-3 text-amber-300" aria-hidden="true" />
            <span>{t("power")}</span>
          </a>

          <span className="hidden text-red-300 lg:inline" aria-hidden="true">
            •
          </span>

          <a
            href="tel:1916"
            className="inline-flex items-center gap-1 rounded text-white underline-offset-2 transition-colors hover:text-yellow-200 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            title="Delhi Jal Board Water Tanker & Pipeline Helpline (1916)"
          >
            <Droplet className="h-3 w-3 text-cyan-200" aria-hidden="true" />
            <span>{t("water")}</span>
          </a>
        </div>

        {/* Right: Full directory link */}
        <div className="shrink-0">
          <Link
            href="/emergency"
            className="font-bold text-yellow-300 underline underline-offset-2 transition-colors hover:text-white"
          >
            {t("barCta")}
          </Link>
        </div>
      </div>
    </aside>
  );
}
