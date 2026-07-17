"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft, Award, BarChart3, CalendarClock, ChevronsLeft, ChevronsRight, ClipboardList,
  Gavel, Megaphone, QrCode, ShieldCheck, UserCog, Users2, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { api, ApiRequestError } from "@/lib/api";
import type { Conference } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/notification-bell";
import { LogoMark } from "@/components/logo";
import { WorkspaceMobileNav } from "@/components/workspace-mobile-nav";

const NAV_ITEMS = [
  { href: "registrations", label: "Registrations", icon: ClipboardList },
  { href: "assignments", label: "Assignments", icon: Users2 },
  { href: "committees", label: "Committees", icon: Gavel },
  { href: "schedule", label: "Schedule", icon: CalendarClock },
  { href: "payments", label: "Payments", icon: Wallet },
  { href: "attendance", label: "Attendance", icon: QrCode },
  { href: "results", label: "Results", icon: Award },
  { href: "communication", label: "Communication", icon: Megaphone },
  { href: "team", label: "Team", icon: UserCog },
  { href: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function ConferenceLayout({ children }: { children: React.ReactNode }) {
  const { organizer, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const conferenceId = params.id;

  const [conference, setConference] = useState<Conference | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [adminView, setAdminView] = useState(false);

  const mobileNavItems = NAV_ITEMS.map((item) => ({
    ...item,
    href: `/conferences/${conferenceId}/${item.href}`,
  }));

  useEffect(() => {
    if (!loading && !organizer) router.replace("/login");
  }, [loading, organizer, router]);

  // Platform Administration bridge (spec ch.9): a platform admin who minted
  // an admin-view token for this conference gets a visible banner instead of
  // a silent, unlabeled elevated session. See lib/platform-api.ts.
  useEffect(() => {
    setAdminView(window.localStorage.getItem("mb_admin_view") === conferenceId);
  }, [conferenceId]);

  function exitAdminView() {
    window.localStorage.removeItem("mb_admin_view_token");
    window.localStorage.removeItem("mb_admin_view");
    window.localStorage.removeItem("mb_organizer");
    window.location.href = "/platform/conferences";
  }

  useEffect(() => {
    if (!organizer) return;
    (async () => {
      try {
        const res = await api.get<{ success: true; conference: Conference }>(`/conferences/${conferenceId}`);
        setConference(res.conference);
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 404) router.replace("/dashboard");
      }
    })();
  }, [organizer, conferenceId, router]);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "hidden shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out md:flex",
          collapsed ? "w-20" : "w-70"
        )}
      >
        <div className={cn("flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4", collapsed && "justify-center px-0")}>
          <LogoMark size={34} />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none">MUN Buddy</p>
              <p className="text-xs text-sidebar-foreground/60">Organizer Workspace</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const href = `/conferences/${conferenceId}/${item.href}`;
            const isActive = pathname?.startsWith(href);
            return (
              <Link
                key={item.href}
                href={href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "border-l-brand-gold bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : (<><ChevronsLeft className="h-4 w-4" /> Collapse</>)}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {adminView && (
          <div className="flex shrink-0 items-center justify-between bg-brand-gold px-6 py-1.5 text-sm font-medium text-brand-navy">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Viewing as Platform Administrator
            </span>
            <button onClick={exitAdminView} className="underline underline-offset-2 hover:no-underline">
              Exit to Platform Dashboard
            </button>
          </div>
        )}
        <header className="flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-6">
          <div className="flex min-w-0 items-center gap-2">
            <WorkspaceMobileNav subtitle="Organizer Workspace" items={mobileNavItems} pathname={pathname} />
            <div className="min-w-0">
              <Link href="/dashboard" className="mb-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3 w-3" /> Back to organization
              </Link>
              {conference ? (
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-base font-semibold leading-tight">{conference.name}</h1>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {conference.conference_code} · {conference.status}
                  </span>
                </div>
              ) : (
                <Skeleton className="h-5 w-48" />
              )}
            </div>
          </div>
          <NotificationBell />
        </header>

        <main className="flex-1 space-y-6 px-6 py-8 md:px-8">
          <div className="mx-auto w-full max-w-[1440px] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
