"use client";

import React, { useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";
import {
  Menu,
  X,
  ShieldCheck,
  FileText,
  Building2,
  PhoneCall,
  BellRing,
  Calculator,
  Landmark,
  ExternalLink,
} from "lucide-react";

export function Header() {
  const t = useTranslations("nav");
  const siteT = useTranslations("site");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/" as const, label: t("home"), icon: Landmark },
    { href: "/complaints" as const, label: t("complaints"), icon: FileText },
    { href: "/directory" as const, label: t("directory"), icon: Building2 },
    { href: "/emergency" as const, label: t("emergency"), icon: PhoneCall },
    { href: "/notices" as const, label: t("notices"), icon: BellRing },
    {
      href: "/tools/land-converter" as const,
      label: t("tools"),
      icon: Calculator,
    },
    { href: "/heritage" as const, label: t("heritage"), icon: Landmark },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`${siteT("name")} - Home`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-amber-500 text-white shadow-md transition-transform group-hover:scale-105">
            <span className="text-lg font-bold">क</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-lg">
              {siteT("name")}
            </span>
            <span className="text-[11px] font-medium leading-none text-muted-foreground">
              {locale === "hi"
                ? "गाँव कांगनहेड़ी (110071) • नजफगढ़"
                : "Village Kanganheri (110071) • Najafgarh"}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main Navigation" className="hidden items-center gap-1 xl:flex">
          {navLinks.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-primary/10 font-bold text-primary"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action controls (Language switcher + Admin + Mobile toggle) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <Link
            href="/admin"
            className="hidden items-center gap-1.5 rounded-md border border-primary/30 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-100 dark:bg-primary/10 dark:hover:bg-primary/20 sm:inline-flex"
            title="Admin Portal"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("admin")}</span>
          </Link>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary xl:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t("menuClose") : t("menuOpen")}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer menu */}
      {mobileMenuOpen && (
        <div className="space-y-1 border-b border-border bg-background px-4 pb-6 pt-2 shadow-lg duration-200 animate-in slide-in-from-top-2 xl:hidden">
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 font-bold text-primary"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="mt-2 border-t border-border pt-2">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-md bg-primary-50 px-3 py-2.5 text-sm font-semibold text-primary dark:bg-primary/10"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>{t("admin")}</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
