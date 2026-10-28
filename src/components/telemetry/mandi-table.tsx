import React from "react";
import type { MandiData } from "@/types";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Store } from "lucide-react";

interface MandiTableProps {
  mandi: MandiData | null;
}

export function MandiTable({ mandi }: MandiTableProps) {
  const t = useTranslations("mandi");
  const locale = useLocale();

  if (!mandi || mandi.prices.length === 0) {
    return (
      <div className="card-base flex min-h-[220px] flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <Store className="mb-2 h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm">{t("error")}</p>
      </div>
    );
  }

  return (
    <div className="card-base flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/20 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-secondary" aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold leading-tight text-foreground">{t("title")}</h3>
            <span className="text-xs text-muted-foreground">{t("subtitle")}</span>
          </div>
        </div>
        <div className="text-right">
          <Badge variant="outline" className="bg-background text-[11px] font-semibold">
            {t("lastUpdated")}: {mandi.prices[0]?.date ?? "Today"}
          </Badge>
        </div>
      </div>

      {/* Table (Responsive scroll) */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <th className="px-3 py-2.5 sm:px-4">{t("commodity")}</th>
              <th className="px-3 py-2.5 sm:px-4">{t("mandi")}</th>
              <th className="px-3 py-2.5 text-right sm:px-4">{t("modalPrice")}</th>
              <th className="hidden px-3 py-2.5 text-right sm:table-cell sm:px-4">{t("msp")}</th>
              <th className="px-3 py-2.5 text-center sm:px-4">MSP Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {mandi.prices.map((row, idx) => {
              const commodityName = locale === "hi" ? row.commodityHi : row.commodity;
              const hasMsp = row.mspPrice !== null;
              const diff = hasMsp ? row.modalPrice - row.mspPrice! : 0;
              const isAbove = diff > 0;
              const isBelow = diff < 0;

              return (
                <tr
                  key={`${row.commodity}-${row.mandi}-${idx}`}
                  className="transition-colors hover:bg-muted/30"
                >
                  {/* Commodity */}
                  <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-foreground sm:px-4">
                    {commodityName}
                  </td>

                  {/* Mandi */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground sm:px-4">
                    {row.mandi}
                  </td>

                  {/* Modal Price */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-black text-foreground sm:px-4">
                    {formatCurrency(row.modalPrice, locale === "hi" ? "hi" : "en")}
                    <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">/Q</span>
                  </td>

                  {/* Official MSP */}
                  <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-muted-foreground sm:table-cell sm:px-4">
                    {hasMsp ? (
                      formatCurrency(row.mspPrice!, locale === "hi" ? "hi" : "en")
                    ) : (
                      <span>—</span>
                    )}
                  </td>

                  {/* MSP Status badge */}
                  <td className="whitespace-nowrap px-3 py-2.5 text-center sm:px-4">
                    {hasMsp ? (
                      isAbove ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-civic-green/10 px-2 py-0.5 text-[11px] font-bold text-civic-green">
                          <TrendingUp className="h-3 w-3" aria-hidden="true" />
                          <span>+₹{diff}</span>
                        </span>
                      ) : isBelow ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-red/10 px-2 py-0.5 text-[11px] font-bold text-danger-red">
                          <TrendingDown className="h-3 w-3" aria-hidden="true" />
                          <span>-₹{Math.abs(diff)}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning-amber/10 px-2 py-0.5 text-[11px] font-bold text-warning-amber">
                          <Minus className="h-3 w-3" aria-hidden="true" />
                          <span>{t("atMsp")}</span>
                        </span>
                      )
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer / source */}
      <div className="flex items-center justify-between border-t border-border bg-muted/20 p-3 text-[11px] text-muted-foreground">
        <span>
          {t("source")}: {mandi.source}
        </span>
        <span className="hidden sm:inline">Unit: Quintal (100 kg)</span>
      </div>
    </div>
  );
}
