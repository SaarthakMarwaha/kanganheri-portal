"use client";

import React, { useState, useTransition } from "react";
import { createNoticeAction, deleteNoticeAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Pin, Plus } from "lucide-react";

interface NoticeItem {
  id: string;
  titleEn: string;
  titleHi: string;
  isPinned: boolean;
  publishedAt: Date | null;
}

export function NoticeManagerClient({ notices }: { notices: NoticeItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [titleHi, setTitleHi] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [bodyHi, setBodyHi] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("titleHi", titleHi);
    formData.append("titleEn", titleEn);
    formData.append("bodyHi", bodyHi);
    formData.append("bodyEn", bodyEn);
    formData.append("isPinned", String(isPinned));

    startTransition(async () => {
      const res = await createNoticeAction(formData);
      if (res.success) {
        setTitleHi("");
        setTitleEn("");
        setBodyHi("");
        setBodyEn("");
        setIsPinned(false);
        setStatusMsg("Notice published successfully!");
        setTimeout(() => setStatusMsg(null), 3000);
      } else {
        setStatusMsg(res.message || "Failed to publish notice.");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    startTransition(async () => {
      await deleteNoticeAction(id);
    });
  };

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
      {/* Create form (5 cols) */}
      <form onSubmit={handleCreate} className="card-base space-y-4 p-6 lg:col-span-5">
        <h3 className="border-b border-border pb-2 text-base font-bold text-foreground">
          Publish New Chaupal Notice
        </h3>

        {statusMsg && (
          <div className="rounded-md border border-primary/20 bg-primary/10 p-3 text-xs font-semibold text-primary">
            {statusMsg}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-bold text-foreground">
            शीर्षक (हिंदी में) *
          </label>
          <Input
            required
            value={titleHi}
            onChange={(e) => setTitleHi(e.target.value)}
            placeholder="जैसे: चौपाल में स्वास्थ्य जाँच शिविर"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-foreground">Title (English) *</label>
          <Input
            required
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="e.g. Free Health Camp at Chaupal"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-foreground">
            विवरण (हिंदी में) *
          </label>
          <textarea
            required
            rows={3}
            value={bodyHi}
            onChange={(e) => setBodyHi(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
            placeholder="सूचना का पूरा विवरण..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-foreground">
            Description (English, optional)
          </label>
          <textarea
            rows={2}
            value={bodyEn}
            onChange={(e) => setBodyEn(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
            placeholder="Notice description in English..."
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            id="pinned-check"
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <label htmlFor="pinned-check" className="text-xs font-semibold text-foreground">
            Pin to top of Noticeboard
          </label>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="h-10 w-full gap-1.5 bg-primary text-xs font-bold hover:bg-primary-700"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          <span>Publish Notice</span>
        </Button>
      </form>

      {/* Existing notices list (7 cols) */}
      <div className="card-base p-6 lg:col-span-7">
        <h3 className="mb-4 border-b border-border pb-2 text-base font-bold text-foreground">
          Active Notices ({notices.length})
        </h3>

        <div className="space-y-3">
          {notices.map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3.5 text-xs"
            >
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  {n.isPinned && (
                    <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                      <Pin className="h-2.5 w-2.5" aria-hidden="true" />
                      Pinned
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{n.titleHi}</h4>
                <p className="text-[11px] text-muted-foreground">{n.titleEn}</p>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(n.id)}
                disabled={isPending}
                className="h-8 px-2.5"
                title="Delete notice"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
