"use client";

import React, { useEffect, useState } from "react";
import type { WeatherData, MandiData } from "@/types";
import { WeatherWidget } from "./weather-widget";
import { MandiTable } from "./mandi-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio } from "lucide-react";
import { useLocale } from "next-intl";

export function TelemetrySection() {
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [mandi, setMandi] = useState<MandiData | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTelemetry() {
      try {
        const res = await fetch("/api/v1/telemetry");
        if (!res.ok) throw new Error("Failed to fetch telemetry");
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setWeather(json.data.weather ?? null);
          setMandi(json.data.mandi ?? null);
        }
      } catch (err) {
        console.warn("Telemetry fetch failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTelemetry();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      aria-label="Live Rural Telemetry & Mandi Bhav"
      className="border-b border-border bg-muted/10 py-6 sm:py-8"
    >
      <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6">
        {/* Section title pill */}
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Radio className="h-3.5 w-3.5 animate-pulse text-primary" aria-hidden="true" />
            <span>
              {locale === "hi"
                ? "लाइव ग्रामीण टेलीमेट्री एवं दैनिक मंडी भाव"
                : "Live Rural Telemetry & Daily Mandi Bhav"}
            </span>
          </div>
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            {locale === "hi"
              ? "कांगनहेड़ी (दक्षिण पश्चिम दिल्ली) • ओपन-मेटियो एवं DAMB"
              : "Kanganheri (South West Delhi) • Open-Meteo & DAMB"}
          </span>
        </div>

        {/* Loading skeleton or widgets */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            <div className="flex flex-col lg:col-span-1">
              <WeatherWidget weather={weather} />
            </div>
            <div className="flex flex-col lg:col-span-2">
              <MandiTable mandi={mandi} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
