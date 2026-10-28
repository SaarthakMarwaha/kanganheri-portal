"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DataRequestPage() {
  const t = useTranslations("privacy.dataRequest");
  const locale = useLocale();

  const [entityType, setEntityType] = useState<"complaint" | "business_listing">("complaint");
  const [identifier, setIdentifier] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/v1/privacy/erasure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          entityType,
          entityIdentifier: identifier.trim(),
          reason: reason.trim() || undefined,
          turnstileToken: "cf-turnstile-mock-token",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error?.message || "Failed to submit request.");
      } else {
        setSuccessMsg(json.data.message || t("successMessage"));
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-screen-md px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6">
        <Link
          href="/privacy"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{locale === "hi" ? "गोपनीयता नीति पर वापस जाएँ" : "Back to Privacy Policy"}</span>
        </Link>
      </div>

      <div className="card-base p-6 sm:p-10">
        <div className="mb-6 border-b border-border/70 pb-4">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-civic-green/10 px-3 py-1 text-xs font-bold text-civic-green">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>DPDP Act 2023 Self-Service</span>
          </div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t("pageDescription")}</p>
        </div>

        {successMsg ? (
          <div className="space-y-4 py-8 text-center animate-in fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-civic-green/10 text-civic-green">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {locale === "hi" ? "अनुरोध प्राप्त हुआ" : "Request Registered"}
            </h3>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              {successMsg}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-md border border-danger-red/30 bg-danger-red/10 p-3.5 text-xs text-danger-red">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Entity Type Selection */}
            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">
                {t("entityType")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEntityType("complaint")}
                  className={`rounded-lg border p-3 text-xs font-bold transition-colors ${
                    entityType === "complaint"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t("complaint")}
                </button>
                <button
                  type="button"
                  onClick={() => setEntityType("business_listing")}
                  className={`rounded-lg border p-3 text-xs font-bold transition-colors ${
                    entityType === "business_listing"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t("business")}
                </button>
              </div>
            </div>

            {/* Identifier input */}
            <div>
              <label
                htmlFor="identifier-input"
                className="mb-1.5 block text-xs font-bold text-foreground"
              >
                {t("identifier")} <span className="text-danger-red">*</span>
              </label>
              <Input
                id="identifier-input"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t("identifierPlaceholder")}
                className="font-mono"
              />
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor="reason-input"
                className="mb-1.5 block text-xs font-bold text-foreground"
              >
                {locale === "hi" ? "हटाने का कारण (वैकल्पिक)" : "Reason for Deletion (Optional)"}
              </label>
              <textarea
                id="reason-input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  locale === "hi"
                    ? "जैसे: समस्या का समाधान हो चुका है, या फोन नंबर हटाना चाहते हैं..."
                    : "e.g. Issue resolved, or want to withdraw phone number..."
                }
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-primary text-sm font-bold hover:bg-primary-700"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Processing...</span>
                </span>
              ) : (
                <span>{t("submit")}</span>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
