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
  const [copiedAll, setCopiedAll] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

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

  const copyAllSummary = () => {
    const lines = [
      `📐 ${numericValue} ${t(`units.${sourceUnit}`)} (Village Kanganheri Land Conversion):`,
      ...ORDERED_UNITS.map((unit) => {
        const val = (conversions[unit] ?? 0).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN", {
          maximumFractionDigits: 4,
        });
        return `• ${val} ${t(`units.${unit}`)}`;
      }),
      `🔗 Source: kanganheri.com/tools/land-converter (Najafgarh Tehsil Standard)`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const PRESETS: Array<{ label: string; value: string; unit: LandUnit }> = [
    { label: locale === "hi" ? "1 बीघा" : "1 Bigha", value: "1", unit: "BIGHA" },
    { label: locale === "hi" ? "1 बिस्वा" : "1 Biswa", value: "1", unit: "BISWA" },
    { label: locale === "hi" ? "100 गज" : "100 Gaj", value: "100", unit: "GAJ" },
    { label: locale === "hi" ? "1 एकड़" : "1 Acre", value: "1", unit: "ACRE" },
    { label: locale === "hi" ? "1 कनाल" : "1 Kanal", value: "1", unit: "KANAL" },
  ];

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
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      {/* Quick Presets Pills */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground">
          {locale === "hi" ? "त्वरित विकल्प:" : "Quick Presets:"}
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setInputValue(p.value);
              setSourceUnit(p.unit);
            }}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
              sourceUnit === p.unit && inputValue === p.value
                ? "shadow-xs bg-secondary text-white"
                : "border border-border bg-card text-foreground/80 hover:bg-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Dynamic Results Grid */}
      <div className="rounded-lg border border-border/70 bg-background/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            <ArrowRightLeft className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>{t("results")}</span>
          </h4>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyAllSummary}
              className="inline-flex items-center gap-1 rounded border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors hover:bg-muted"
              title="Copy all units"
            >
              {copiedAll ? (
                <>
                  <Check className="h-3 w-3 text-civic-green" aria-hidden="true" />
                  <span className="text-civic-green">
                    {locale === "hi" ? "प्रतिलिपि बनाई गई!" : "Copied!"}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  <span>{locale === "hi" ? "सभी कॉपी करें" : "Copy All"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowFormula((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded bg-muted/60 px-2.5 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Info className="h-3 w-3 text-secondary" aria-hidden="true" />
              <span>{locale === "hi" ? "तहसील मानक" : "Revenue Formula"}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Najafgarh Formula Reference */}
        {showFormula && (
          <div className="mb-4 rounded-md border border-secondary/20 bg-secondary/5 p-3 text-xs leading-relaxed text-foreground">
            <div className="mb-1 font-bold text-secondary">
              {locale === "hi"
                ? "नजफगढ़ तहसील (दिल्ली) भू-राजस्व माप मानक:"
                : "Najafgarh Tehsil (Delhi) Land Revenue Scale:"}
            </div>
            <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-muted-foreground">
              <li>
                <b>1 बीघा (Bigha)</b> = 20 बिस्वा = 1,008 वर्ग गज (Gaj) = 9,072 वर्ग फुट (Sq. Ft.) =
                842.8 वर्ग मीटर
              </li>
              <li>
                <b>1 बिस्वा (Biswa)</b> = 50.4 वर्ग गज = 453.6 वर्ग फुट
              </li>
              <li>
                <b>1 एकड़ (Acre)</b> = 4.8 बीघा = 4,840 वर्ग गज = 43,560 वर्ग फुट
              </li>
              <li>
                <b>1 कनाल (Kanal)</b> = 605 वर्ग गज = 5,445 वर्ग फुट (हरियाणा/पंजाब सीमावर्ती मानक)
              </li>
              <li>
                <b>1 मरला (Marla)</b> = 30.25 वर्ग गज = 272.25 वर्ग फुट
              </li>
            </ul>
          </div>
        )}

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
