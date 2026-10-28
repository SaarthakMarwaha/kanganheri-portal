"use client";

import React, { useActionState } from "react";
import { adminLoginAction, type LoginFormState } from "@/actions/auth-actions";
import { useTranslations } from "next-intl";
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormStatus } from "react-dom";

const initialState: LoginFormState = {
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full bg-primary text-sm font-bold shadow-sm hover:bg-primary-700"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Signing in...</span>
        </span>
      ) : (
        <span>Sign In to Admin Portal</span>
      )}
    </Button>
  );
}

export default function AdminLoginPage() {
  const t = useTranslations("admin");
  const [state, formAction] = useActionState(adminLoginAction, initialState);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="card-base w-full max-w-md border border-border bg-card p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-amber-500 text-white shadow-md">
            <ShieldCheck className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-black text-foreground">{t("loginTitle")}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Village Kanganheri Civic Administration & Moderation Access
          </p>
        </div>

        {/* Error message */}
        {state.status === "error" && state.message && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-2 rounded-md border border-danger-red/30 bg-danger-red/10 p-3.5 text-xs text-danger-red"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-xs font-bold text-foreground">
              {t("email")}
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="admin-email"
                name="email"
                type="email"
                required
                placeholder="admin@kanganheri.com"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs font-bold text-foreground"
            >
              {t("password")}
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="admin-password"
                name="password"
                type="password"
                required
                placeholder="••••••••••••"
                className="pl-9"
              />
            </div>
          </div>

          <SubmitButton />

          <div className="pt-2 text-center">
            <span className="text-[11px] text-muted-foreground">
              Protected by Rate Limiting & Cryptographic Audit Logs
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
