"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import type { PublicComplaint } from "@/types";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ThumbsUp,
  MapPin,
  Calendar,
  FileText,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ComplaintTrackerWidget() {
  const t = useTranslations("complaints");
  const locale = useLocale();

  const [trackingIdInput, setTrackingIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState<PublicComplaint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upvoting, setUpvoting] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = trackingIdInput.trim().toUpperCase();
    if (!id) return;

    setLoading(true);
    setError(null);
    setComplaint(null);

    try {
      const res = await fetch(`/api/v1/complaints/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || t("notFound"));
      } else {
        setComplaint(json.data);
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!complaint || upvoting) return;
    setUpvoting(true);

    try {
      const res = await fetch(`/api/v1/complaints/${complaint.trackingId}/upvote`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success && json.data) {
        setComplaint((prev) => (prev ? { ...prev, upvoteCount: json.data.upvoteCount } : prev));
      }
    } catch {
      // Ignored
    } finally {
      setUpvoting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            <span>{t(`status.${status}`)}</span>
          </Badge>
        );
      case "IN_PROGRESS":
      case "REVIEWING":
        return (
          <Badge variant="default" className="gap-1 bg-blue-600">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{t(`status.${status}`)}</span>
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            <span>{t(`status.${status}`)}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{t(`status.PENDING`)}</span>
          </Badge>
        );
    }
  };

  return (
    <div className="card-base bg-gradient-to-br from-card via-card to-amber-50/20 p-6 dark:to-amber-950/10">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border/60 pb-4 md:flex-row md:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="text-lg font-bold text-foreground">{t("trackTitle")}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {locale === "hi"
              ? "अपनी समस्या की स्थिति, समयरेखा एवं समुदाय समर्थन देखें"
              : "Check real-time complaint status, civic timeline & community upvotes"}
          </p>
        </div>

        <Link
          href="/complaints"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary-700"
        >
          <span>{locale === "hi" ? "+ नई शिकायत दर्ज करें" : "+ File New Complaint"}</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Tracker search form */}
      <form onSubmit={handleTrack} className="mb-6 flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder={t("trackPlaceholder")}
            value={trackingIdInput}
            onChange={(e) => setTrackingIdInput(e.target.value)}
            className="pl-9 font-mono text-sm uppercase"
            required
            aria-label="Complaint Tracking ID input"
          />
        </div>
        <Button type="submit" disabled={loading} className="shrink-0 text-xs font-semibold">
          {loading ? t("submitting") : t("trackButton")}
        </Button>
      </form>

      {/* Error message */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-danger-red/20 bg-danger-red/10 p-3 text-xs text-danger-red">
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Complaint details result */}
      {complaint && (
        <div className="rounded-lg border border-border bg-background p-4 duration-200 animate-in fade-in">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">
                {complaint.trackingId}
              </span>
              {getStatusBadge(complaint.status)}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUpvote}
              disabled={upvoting}
              className="h-8 gap-1.5 text-xs font-semibold"
              aria-label={`Upvote complaint. Current upvotes: ${complaint.upvoteCount}`}
            >
              <ThumbsUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>{t("upvote", { count: complaint.upvoteCount.toString() })}</span>
            </Button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>{complaint.streetTag}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
              </span>
            </div>

            <p className="pt-1 text-sm font-medium text-foreground">
              {locale === "hi"
                ? complaint.descriptionHi
                : complaint.descriptionEn || complaint.descriptionHi}
            </p>
          </div>

          {/* Timeline */}
          {complaint.statusHistory && complaint.statusHistory.length > 0 && (
            <div className="mt-4 border-t border-border/60 pt-3">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground">
                {t("timeline")}
              </h4>
              <ol className="ml-2 space-y-2 border-l border-primary/30 pl-3">
                {complaint.statusHistory.map((item, idx) => (
                  <li key={idx} className="relative text-xs">
                    <span
                      className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-foreground">
                      {t(`status.${item.toStatus}`)}
                    </span>
                    <span className="ml-2 text-[11px] text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {item.publicNote && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{item.publicNote}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
