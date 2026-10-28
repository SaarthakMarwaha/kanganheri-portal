"use client";

import React, { useState, useEffect, useActionState } from "react";
import { submitBusinessAction, type BusinessFormState } from "@/actions/directory-actions";
import { useTranslations, useLocale } from "next-intl";
import { BusinessCategory } from "@prisma/client";
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormStatus } from "react-dom";

const initialState: BusinessFormState = {
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("directory");

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full bg-secondary text-sm font-bold text-secondary-foreground shadow-sm hover:bg-secondary/90"
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

export function BusinessRegistrationForm() {
  const t = useTranslations("directory");
  const locale = useLocale();

  const [state, formAction] = useActionState(submitBusinessAction, initialState);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  if (state.status === "success") {
    return (
      <div className="card-base bg-card p-8 text-center duration-200 animate-in fade-in zoom-in-95">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-civic-green/10 text-civic-green">
          <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-foreground">{t("successTitle")}</h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">{t("successMessage")}</p>
        <button
          type="button"
          onClick={() => {
            setIdempotencyKey(crypto.randomUUID());
            window.location.reload();
          }}
          className="rounded-md bg-secondary px-6 py-2.5 text-xs font-bold text-secondary-foreground transition-colors hover:bg-secondary/90"
        >
          {locale === "hi" ? "एक और व्यवसाय जोड़ें" : "Register Another Business"}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="card-base space-y-5 p-6 sm:p-8">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="turnstileToken" value="cf-turnstile-mock-token" />

      <div className="border-b border-border/70 pb-4">
        <h3 className="text-xl font-bold text-foreground">{t("listFormTitle")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {locale === "hi"
            ? "कांगनहेड़ी गाँव के सभी स्थानीय दुकानदार, मिस्त्री एवं सेवा प्रदाता यहाँ निःशुल्क पंजीकरण कर सकते हैं।"
            : "All local shopkeepers, artisans, and service providers in Village Kanganheri can register for free."}
        </p>
      </div>

      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-danger-red/30 bg-danger-red/10 p-4 text-xs text-danger-red"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      )}

      {/* Bilingual Names */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nameHi" className="mb-1.5 block text-xs font-bold text-foreground">
            व्यवसाय का नाम (हिंदी में) <span className="text-danger-red">*</span>
          </label>
          <Input id="nameHi" name="nameHi" required placeholder="जैसे: शर्मा डेयरी भंडार" />
          {state.fieldErrors?.nameHi && (
            <p className="mt-1 text-[11px] text-danger-red">{state.fieldErrors.nameHi[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="nameEn" className="mb-1.5 block text-xs font-bold text-foreground">
            Business Name (English) <span className="text-danger-red">*</span>
          </label>
          <Input id="nameEn" name="nameEn" required placeholder="e.g. Sharma Dairy Farm" />
          {state.fieldErrors?.nameEn && (
            <p className="mt-1 text-[11px] text-danger-red">{state.fieldErrors.nameEn[0]}</p>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="business-category"
          className="mb-1.5 block text-xs font-bold text-foreground"
        >
          {t("filterCategory")} <span className="text-danger-red">*</span>
        </label>
        <select
          id="business-category"
          name="category"
          required
          defaultValue={BusinessCategory.ELECTRICIAN}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {Object.values(BusinessCategory).map((cat) => (
            <option key={cat} value={cat}>
              {t(`categories.${cat}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Phone Numbers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="biz-phone" className="mb-1.5 block text-xs font-bold text-foreground">
            मोबाइल नंबर (WhatsApp / कॉल) <span className="text-danger-red">*</span>
          </label>
          <Input
            id="biz-phone"
            name="phone"
            type="tel"
            required
            placeholder="9876543210"
            maxLength={10}
          />
          {state.fieldErrors?.phone && (
            <p className="mt-1 text-[11px] text-danger-red">{state.fieldErrors.phone[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="biz-phoneAlt" className="mb-1.5 block text-xs font-bold text-foreground">
            वैकल्पिक फोन (यदि कोई हो)
          </label>
          <Input
            id="biz-phoneAlt"
            name="phoneAlt"
            type="tel"
            placeholder="वैकल्पिक नंबर"
            maxLength={10}
          />
        </div>
      </div>

      {/* Street & Address */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="biz-addressHi" className="mb-1.5 block text-xs font-bold text-foreground">
            पता (गाँव कांगनहेड़ी में स्थान)
          </label>
          <Input id="biz-addressHi" name="addressHi" placeholder="जैसे: चौपाल के पास, गली नं. 2" />
        </div>

        <div>
          <label htmlFor="biz-streetTag" className="mb-1.5 block text-xs font-bold text-foreground">
            गली / मोहल्ला टैग
          </label>
          <Input id="biz-streetTag" name="streetTag" placeholder="जैसे: Main Chaupal Gali" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="biz-descHi" className="mb-1.5 block text-xs font-bold text-foreground">
          सेवा या उत्पादों का संक्षिप्त विवरण
        </label>
        <textarea
          id="biz-descHi"
          name="descriptionHi"
          rows={3}
          placeholder="जैसे: बिजली वायरिंग, इन्वर्टर रिपेयर, मोटर वाइंडिंग की उत्तम सेवा..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        />
      </div>

      {/* Photo */}
      <div>
        <label htmlFor="biz-photo" className="mb-1.5 block text-xs font-bold text-foreground">
          दुकान या सेवा की फोटो (वैकल्पिक, अधिकतम 5MB)
        </label>
        <Input id="biz-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      </div>

      <SubmitButton />

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-civic-green" aria-hidden="true" />
        <span>
          {locale === "hi"
            ? "सत्यापन उपरांत आपकी लिस्टिंग सीधे कांगनहेड़ी दर्पण पर प्रकाशित होगी।"
            : "Upon admin verification, your listing will be published live."}
        </span>
      </p>
    </form>
  );
}
