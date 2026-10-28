"use client";

import React, { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { LandUnit } from "@/types";
import { Calculator, Copy, Check, Info, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";

// Standard Conversion factors normalized to 1 Square Foot
// In Delhi Revenue Jurisdiction (Najafgarh Tehsil):
// 1 Bigha = 20 Biswa = 1008 Sq. Yard (Gaj) = 9072 Sq. Ft.
const SQ_FT_PER_UNIT: Record<LandUnit, number> = {
  SQ_FT: 1,
  GAJ: 9, // 1 Sq Yard = 9 Sq Ft
  BISWA: 453.6, // 1 Biswa (Delhi) = 50.4 Gaj = 453.6 Sq Ft
  BIGHA: 9072, // 1 Bigha (Delhi) = 20 Biswa = 1008 Gaj = 9072 Sq Ft
  KANAL: 5445, // 1 Kanal = 605 Gaj = 5445 Sq Ft
  MARLA: 272.25, // 1 Marla = 1/20 Kanal = 30.25 Gaj = 272.25 Sq Ft
  ACRE: 43560, // 1 Acre = 4840 Gaj = 43560 Sq Ft
  HECTARE: 107639.1, // 1 Hectare = 10000 Sq Meter = 107639.1 Sq Ft
  SQ_METER: 10.7639, // 1 Sq Meter = 10.7639 Sq Ft
};

const ORDERED_UNITS: LandUnit[] = [
  "BIGHA",
  "BISWA",
  "ACRE",
  "GAJ",
  "KANAL",
  "MARLA",
  "SQ_FT",
  "SQ_METER",
  "HECTARE",
];

export function LandConverterWidget() {
  const t = useTranslations("tools.landConverter");
  const locale = useLocale();

  const [inputValue, setInputValue] = useState<string>("1");
  const [sourceUnit, setSourceUnit] = useState<LandUnit>("BIGHA");
  const [copiedUnit, setCopiedUnit] = useState<string | null>(null);

  const numericValue = parseFloat(inputValue) || 0;

  const conversions = useMemo(() => {
    const totalSqFt = numericValue * (SQ_FT_PER_UNIT[sourceUnit] ?? 1);

    const result: Partial<Record<LandUnit, number>> = {};
    for (const unit of ORDERED_UNITS) {
      const factor = SQ_FT_PER_UNIT[unit];
      result[unit] = totalSqFt / factor;
    }
    return result as Record<LandUnit, number>;
  }, [numericValue, sourceUnit]);

  const copyToClipboard = (unit: string, value: number) => {
    const text = `${value.toLocaleString(locale === "hi" ? "hi-IN" : "en-IN", {
      maximumFractionDigits: 4,
    })} ${t(`units.${unit as LandUnit}`)}`;

    navigator.clipboard.writeText(text);
    setCopiedUnit(unit);
    setTimeout(() => setCopiedUnit(null), 2000);
  };

  return (
    <div className="card-base bg-gradient-to-br from-card via-card to-emerald-50/20 p-6 dark:to-emerald-950/10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-secondary" aria-hidden="true" />
          <div>
            <h3 className="text-lg font-bold text-foreground">{t("pageTitle")}</h3>
            <span className="text-xs text-muted-foreground">
              {locale === "hi"
                ? "दिल्ली नजफगढ़ तहसील मानक (1 बीघा = 20 बिस्वा = 1,008 गज)"
                : "Delhi Najafgarh Standard (1 Bigha = 20 Biswa = 1,008 Gaj)"}
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
          <Info className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
          <span>{locale === "hi" ? "त्वरित गणना" : "Instant Live Calculation"}</span>
        </div>
      </div>

      {/* Input controls */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="land-value-input"
            className="mb-1.5 block text-xs font-bold text-foreground"
          >
            {t("enterValue")}
          </label>
          <Input
            id="land-value-input"
            type="number"
            min="0"
            step="any"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="text-base font-bold"
            placeholder="e.g. 2.5"
          />
        </div>

        <div>
          <label
            htmlFor="land-unit-select"
            className="mb-1.5 block text-xs font-bold text-foreground"
          >
            {t("selectUnit")}
          </label>
          <div className="relative">
            <select
              id="land-unit-select"
              value={sourceUnit}
              onChange={(e) => setSourceUnit(e.target.value as LandUnit)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {ORDERED_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {t(`units.${unit}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Results Grid */}
      <div className="rounded-lg border border-border/70 bg-background/50 p-4">
        <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
          <ArrowRightLeft className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>{t("results")}</span>
        </h4>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {ORDERED_UNITS.map((unit) => {
            const converted = conversions[unit] ?? 0;
            const isSelf = unit === sourceUnit;
            const formatted = converted.toLocaleString(locale === "hi" ? "hi-IN" : "en-IN", {
              maximumFractionDigits: 4,
              minimumFractionDigits: 0,
            });

            return (
              <div
                key={unit}
                className={`flex items-center justify-between rounded-md border p-3 transition-colors ${
                  isSelf
                    ? "border-primary/40 bg-primary/5 font-bold"
                    : "border-border bg-card hover:border-border/80"
                }`}
              >
                <div>
                  <span className="block text-[11px] font-medium text-muted-foreground">
                    {t(`units.${unit}`)}
                  </span>
                  <span className="text-sm font-bold tracking-tight text-foreground">
                    {formatted}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(unit, converted)}
                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  title="Copy value"
                  aria-label={`Copy value for ${t(`units.${unit}`)}`}
                >
                  {copiedUnit === unit ? (
                    <Check className="h-3.5 w-3.5 text-civic-green" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
