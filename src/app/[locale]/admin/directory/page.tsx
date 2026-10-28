import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { VerificationStatus } from "@prisma/client";
import { DirectoryModeratorRow } from "@/components/admin/directory-moderator-row";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

interface AdminListingItem {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  category: string;
  phone: string;
  streetTag: string | null;
  verificationStatus: VerificationStatus;
  createdAt: Date;
}

export default async function AdminDirectoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  let listings: AdminListingItem[] = [];
  try {
    listings = await db.businessListing.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameHi: true,
        category: true,
        phone: true,
        streetTag: true,
        verificationStatus: true,
        createdAt: true,
      },
      take: 100,
    });
  } catch (err) {
    console.warn("Notice: DB unreachable during AdminDirectoryPage fetch:", err);
  }

  return (
    <div className="container mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <Link
            href="/admin"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-foreground">
            Business Directory Moderation & Physical Verification
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Approve or reject shopkeeper and artisan registrations. Approvals immediately update
            sitemaps and public search.
          </p>
        </div>

        <span className="rounded bg-muted px-3 py-1 font-mono text-xs font-bold text-foreground">
          {listings.length} Listings
        </span>
      </div>

      {/* Table */}
      <div className="card-base overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground">
              <th className="p-4">Business Name / Slug</th>
              <th className="p-4">Category</th>
              <th className="p-4">Phone / Street</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Moderation Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((b) => (
              <DirectoryModeratorRow key={b.id} business={b} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
