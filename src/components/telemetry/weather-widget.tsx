import React from "react";
import type { WeatherData } from "@/types";
import { useTranslations, useLocale } from "next-intl";
import { CloudSun, Droplets, Wind, Sun, CloudRain, Thermometer } from "lucide-react";

interface WeatherWidgetProps {
  weather: WeatherData | null;
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  const t = useTranslations("weather");
  const locale = useLocale();

  if (!weather) {
    return (
      <div className="card-base flex min-h-[220px] flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <CloudSun className="mb-2 h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm">{t("error")}</p>
      </div>
    );
  }

  const description = locale === "hi" ? weather.weatherDescriptionHi : weather.weatherDescription;

  return (
    <div className="card-base flex flex-col justify-between bg-gradient-to-br from-card to-primary-50/30 p-5 dark:to-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <CloudSun className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 className="text-base font-bold text-foreground">{t("title")}</h3>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          {locale === "hi" ? "28.54°N, 76.98°E" : "Live Telemetry"}
        </span>
      </div>

      {/* Main Temp & Condition */}
      <div className="my-4 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              {weather.temperature}
            </span>
            <span className="text-2xl font-bold text-primary">°C</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <Thermometer className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-medium text-muted-foreground">
              {t("feelsLike")}: {weather.feelsLike}°C
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
            <span>{description}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {weather.isDay ? "☀️ Day" : "🌙 Night"}
          </p>
        </div>
      </div>

      {/* Grid of Micro-Metrics */}
      <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-xs sm:grid-cols-4">
        <div className="flex items-center gap-2 rounded-md bg-background/60 p-2">
          <Droplets className="h-4 w-4 shrink-0 text-cyan-500" aria-hidden="true" />
          <div>
            <span className="block text-[10px] font-semibold uppercase text-muted-foreground">
              {t("humidity")}
            </span>
            <span className="font-bold text-foreground">{weather.humidity}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-background/60 p-2">
          <Wind className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          <div>
            <span className="block text-[10px] font-semibold uppercase text-muted-foreground">
              {t("wind")}
            </span>
            <span className="font-bold text-foreground">{weather.windSpeed} km/h</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-background/60 p-2">
          <CloudRain className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
          <div>
            <span className="block text-[10px] font-semibold uppercase text-muted-foreground">
              {t("precipitation")}
            </span>
            <span className="font-bold text-foreground">{weather.precipitation} mm</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-background/60 p-2">
          <Sun className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
          <div>
            <span className="block text-[10px] font-semibold uppercase text-muted-foreground">
              {t("uv")}
            </span>
            <span className="font-bold text-foreground">{weather.uvIndex}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
