import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { Link } from "@/i18n/routing";
import { adminLogoutAction } from "@/actions/auth-actions";
import { LogOut, User } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentUser();

  // If user is not logged in, allow them to view login page directly
  // Route Handlers and children handle the login page; for other pages, enforce auth.
  // We can pass user info down via layout when authenticated.

  return (
    <div className="flex min-h-screen flex-col bg-muted/15">
      {user && (
        <header className="shadow-xs sticky top-0 z-30 border-b border-border bg-card">
          <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6">
            {/* Left brand & badge */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-sm font-black text-foreground"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
                  प्र
                </div>
                <span>कांगनहेड़ी प्रशासन (Admin Portal)</span>
              </Link>

              <span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                {user.role}
              </span>
            </div>

            {/* Admin Nav */}
            <nav className="hidden items-center gap-1 text-xs font-semibold md:flex">
              <Link
                href="/admin"
                className="rounded-md px-3 py-1.5 text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/complaints"
                className="rounded-md px-3 py-1.5 text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                Complaints
              </Link>
              <Link
                href="/admin/directory"
                className="rounded-md px-3 py-1.5 text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                Directory Approvals
              </Link>
              <Link
                href="/admin/notices"
                className="rounded-md px-3 py-1.5 text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                Notices
              </Link>
              <Link
                href="/admin/audit-log"
                className="rounded-md px-3 py-1.5 text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                Audit Trail
              </Link>
            </nav>

            {/* User profile & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-medium text-foreground">{user.displayName}</span>
              </div>

              <form action={adminLogoutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-danger-red hover:text-white"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </form>
            </div>
          </div>

          {/* Mobile Admin Quick Navigation Bar */}
          <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto border-t border-border/60 bg-muted/40 px-4 py-1.5 md:hidden">
            <Link
              href="/admin"
              className="whitespace-nowrap rounded-md border border-border/50 bg-background px-2.5 py-1 text-xs font-semibold text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/complaints"
              className="whitespace-nowrap rounded-md border border-border/50 bg-background px-2.5 py-1 text-xs font-semibold text-foreground"
            >
              Complaints
            </Link>
            <Link
              href="/admin/directory"
              className="whitespace-nowrap rounded-md border border-border/50 bg-background px-2.5 py-1 text-xs font-semibold text-foreground"
            >
              Directory
            </Link>
            <Link
              href="/admin/notices"
              className="whitespace-nowrap rounded-md border border-border/50 bg-background px-2.5 py-1 text-xs font-semibold text-foreground"
            >
              Notices
            </Link>
            <Link
              href="/admin/audit-log"
              className="whitespace-nowrap rounded-md border border-border/50 bg-background px-2.5 py-1 text-xs font-semibold text-foreground"
            >
              Audit Trail
            </Link>
          </div>
        </header>
      )}

      <main className="flex-1">{children}</main>
    </div>
  );
}
