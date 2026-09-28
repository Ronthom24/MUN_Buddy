"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  Bell,
  BookOpen,
  CalendarClock,
  FileCheck2,
  FileText,
  Flag,
  Gavel,
  HelpCircle,
  Landmark,
  LogOut,
  NotebookPen,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useDelegateAuth } from "@/lib/delegate-auth-context";
import { NotificationBell } from "@/components/notification-bell";
import { LogoMark } from "@/components/logo";
import { WorkspaceMobileNav } from "@/components/workspace-mobile-nav";

const NAV_ITEMS = [
  { href: "/delegate", label: "Overview", icon: Landmark, exact: true },
  { href: "/delegate/committee", label: "My Committee", icon: Gavel },
  { href: "/delegate/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/delegate/payment", label: "Payment", icon: Wallet, disabled: true },
  { href: "/delegate/resources", label: "Resources", icon: BookOpen },
  { href: "/delegate/announcements", label: "Announcements", icon: Bell },
  { href: "/delegate/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/delegate/notes", label: "Notes", icon: NotebookPen },
  { href: "/delegate/documents", label: "Position Paper & Speech", icon: FileText },
  { href: "/delegate/resolutions", label: "Resolutions", icon: Flag },
  { href: "/delegate/results", label: "Results", icon: Award },
  { href: "/delegate/certificates", label: "Certificates", icon: FileCheck2 },
  { href: "/delegate/profile", label: "Profile", icon: User },
];

function DelegateShell({ children }: { children: React.ReactNode }) {
  const { delegate, loading, logout } = useDelegateAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !delegate) router.replace("/delegate/login");
  }, [loading, delegate, router]);

  if (loading || !delegate) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-70 shrink-0 bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <LogoMark size={32} />
          <div>
            <p className="text-sm font-semibold leading-none">MUN Buddy</p>
            <p className="text-xs text-sidebar-foreground/60">Delegate Workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map((item) => {
            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/40"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  <span className="ml-auto rounded-full bg-sidebar-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Soon
                  </span>
                </div>
              );
            }

            const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 truncate px-3 text-xs text-sidebar-foreground/60">{delegate.email}</div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b bg-background px-6 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <WorkspaceMobileNav
              subtitle="Delegate Workspace"
              items={NAV_ITEMS}
              pathname={pathname}
              footer={
                <>
                  <div className="mb-2 truncate px-3 text-xs text-sidebar-foreground/60">{delegate.email}</div>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </>
              }
            />
            <LogoMark size={32} />
            <p className="text-sm font-semibold">Delegate Workspace</p>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={logout} className="p-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="hidden h-[72px] items-center justify-end border-b border-border bg-card px-6 md:flex">
          <NotificationBell />
        </div>
        <main className="px-6 py-8 md:px-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DelegateLayout({ children }: { children: React.ReactNode }) {
  return <DelegateShell>{children}</DelegateShell>;
}
