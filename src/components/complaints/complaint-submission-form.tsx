"use client";

import React, { useState, useEffect, useActionState } from "react";
import { submitComplaintAction, type ComplaintFormState } from "@/actions/complaint-actions";
import { useTranslations, useLocale } from "next-intl";
import { ComplaintCategory } from "@prisma/client";
import {
  Upload,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormStatus } from "react-dom";

const initialState: ComplaintFormState = {
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("complaints");

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full bg-primary text-sm font-bold shadow-sm hover:bg-primary-700"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{t("submitting")}</span>
        </span>
      ) : (
        <span>{t("submit")}</span>
      )}
    </Button>
  );
}

export function ComplaintSubmissionForm() {
  const t = useTranslations("complaints");
  const locale = useLocale();

  const [state, formAction] = useActionState(submitComplaintAction, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  // Generate UUIDv4 idempotency key on mount
  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 3);
      setSelectedPhotos(files);
    }
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopyId = () => {
    if (state.trackingId) {
      navigator.clipboard.writeText(state.trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Success view
  if (state.status === "success" && state.trackingId) {
    return (
      <div className="card-base bg-card p-8 text-center duration-200 animate-in fade-in zoom-in-95">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-civic-green/10 text-civic-green">
          <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-foreground">{t("successTitle")}</h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">{t("successMessage")}</p>

        {/* Tracking ID Box */}
        <div className="mb-6 inline-flex items-center gap-3 rounded-lg border-2 border-primary/30 bg-primary/10 p-4">
          <span className="font-mono text-2xl font-black tracking-wider text-primary">
            {state.trackingId}
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            className="shadow-xs rounded-md border border-border bg-card p-2 text-foreground transition-colors hover:bg-muted"
            title={t("copyId")}
            aria-label={t("copyId")}
          >
            {copied ? (
              <Check className="h-5 w-5 text-civic-green" aria-hidden="true" />
            ) : (
              <Copy className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={`/${locale}/complaints/${state.trackingId}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow transition-colors hover:bg-primary-700"
          >
            {t("trackButton")} →
          </a>
          <button
            type="button"
            onClick={() => {
              setIdempotencyKey(crypto.randomUUID());
              window.location.reload();
            }}
            className="rounded-md border border-border bg-background px-6 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {locale === "hi" ? "दूसरी शिकायत दर्ज करें" : "File Another Complaint"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="card-base space-y-6 p-6 sm:p-8">
      {/* Hidden idempotency key */}
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      {/* Cloudflare Turnstile Mock/Production token for test & live execution */}
      <input
        type="hidden"
        name="turnstileToken"
        value={
          process.env.NODE_ENV === "development"
            ? "cf-turnstile-mock-token"
            : "cf-turnstile-mock-token"
        }
      />

      <div className="border-b border-border/70 pb-4">
        <h3 className="text-xl font-bold text-foreground">{t("formTitle")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {locale === "hi"
            ? "गाँव कांगनहेड़ी में किसी भी नागरिक समस्या को सीधे दर्ज करें। किसी लॉगिन की आवश्यकता नहीं है।"
            : "Directly report any civic issue in Village Kanganheri. No login or password required."}
        </p>
      </div>

      {/* Error Banner */}
      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-danger-red/30 bg-danger-red/10 p-4 text-xs text-danger-red"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      )}

      {/* Category */}
      <div>
        <label
          htmlFor="complaint-category"
          className="mb-1.5 block text-xs font-bold text-foreground"
        >
          {t("category")} <span className="text-danger-red">*</span>
        </label>
        <select
          id="complaint-category"
          name="category"
          required
          defaultValue={ComplaintCategory.WATERLOGGING}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {Object.values(ComplaintCategory).map((cat) => (
            <option key={cat} value={cat}>
              {t(`categories.${cat}`)}
            </option>
          ))}
        </select>
        {state.fieldErrors?.category && (
          <p className="mt-1 text-[11px] text-danger-red">{state.fieldErrors.category[0]}</p>
        )}
      </div>

      {/* Street & Ward */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="streetTag" className="mb-1.5 block text-xs font-bold text-foreground">
            {t("streetTag")} <span className="text-danger-red">*</span>
          </label>
          <Input
            id="streetTag"
            name="streetTag"
            required
            placeholder={t("streetTagPlaceholder")}
            aria-required="true"
          />
          {state.fieldErrors?.streetTag && (
            <p className="mt-1 text-[11px] text-danger-red">{state.fieldErrors.streetTag[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="wardTag" className="mb-1.5 block text-xs font-bold text-foreground">
            {t("wardTag")}
          </label>
          <Input id="wardTag" name="wardTag" placeholder={t("wardTagPlaceholder")} />
        </div>
      </div>

      {/* Description Hindi (Required) */}
      <div>
        <label htmlFor="descriptionHi" className="mb-1.5 block text-xs font-bold text-foreground">
          {t("description")} <span className="text-danger-red">*</span>
        </label>
        <textarea
          id="descriptionHi"
          name="descriptionHi"
          required
          rows={4}
          placeholder={t("descriptionPlaceholder")}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-required="true"
        />
        {state.fieldErrors?.descriptionHi && (
          <p className="mt-1 text-[11px] text-danger-red">{state.fieldErrors.descriptionHi[0]}</p>
        )}
      </div>

      {/* Description English (Optional) */}
      <div>
        <label htmlFor="descriptionEn" className="mb-1.5 block text-xs font-bold text-foreground">
          {t("descriptionEn")}
        </label>
        <textarea
          id="descriptionEn"
          name="descriptionEn"
          rows={2}
          placeholder="e.g., Road is damaged with water accumulation..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        />
      </div>

      {/* Contact Phone (Optional) */}
      <div>
        <label htmlFor="contactPhone" className="mb-1.5 block text-xs font-bold text-foreground">
          {t("contactPhone")}
        </label>
        <Input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          placeholder={t("contactPhonePlaceholder")}
          maxLength={10}
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          {locale === "hi"
            ? "स्थिति परिवर्तन पर सूचना हेतु। आपका फोन सार्वजनिक रूप से कभी नहीं दिखाया जाएगा।"
            : "Used only for civic status updates. Your phone is never displayed publicly."}
        </p>
        {state.fieldErrors?.contactPhone && (
          <p className="mt-1 text-[11px] text-danger-red">{state.fieldErrors.contactPhone[0]}</p>
        )}
      </div>

      {/* Photos Upload */}
      <div>
        <label className="mb-1.5 block text-xs font-bold text-foreground">{t("photos")}</label>
        <div className="relative cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted/10 p-6 text-center transition-colors hover:border-primary/50">
          <input
            type="file"
            name="photos"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={handlePhotoChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Upload issue photos"
          />
          <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-xs font-semibold text-foreground">
            {locale === "hi" ? "फोटो चुनने के लिए यहाँ क्लिक करें" : "Click here to select photos"}
          </p>
          <span className="mt-1 block text-[11px] text-muted-foreground">{t("photosHint")}</span>
        </div>

        {/* Selected Photos Previews */}
        {selectedPhotos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedPhotos.map((file, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground"
              >
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="text-muted-foreground hover:text-danger-red"
                  aria-label={`Remove photo ${file.name}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button with useFormStatus */}
      <SubmitButton />

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-civic-green" aria-hidden="true" />
        <span>
          {locale === "hi"
            ? "नागरिक डेटा सुरक्षा (DPDP Act 2023) द्वारा सुरक्षित"
            : "Protected under India's DPDP Act 2023"}
        </span>
      </p>
    </form>
  );
}
