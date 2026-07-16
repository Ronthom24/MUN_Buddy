"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft, Award, BarChart3, CalendarClock, ClipboardList, Gavel, LayoutDashboard, Megaphone, QrCode, UserCog, Users2, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { api, ApiRequestError } from "@/lib/api";
import type { Conference } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "@/components/notification-bell";

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

  useEffect(() => {
    if (!loading && !organizer) router.replace("/login");
  }, [loading, organizer, router]);

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
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to organization
            </Link>
            <NotificationBell />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <div>
              {conference ? (
                <>
                  <h1 className="text-lg font-semibold leading-tight">{conference.name}</h1>
                  <p className="text-xs text-muted-foreground">
                    {conference.conference_code} · {conference.status}
                  </p>
                </>
              ) : (
                <Skeleton className="h-6 w-48" />
              )}
            </div>
          </div>

          <nav className="mt-4 flex gap-1">
            {NAV_ITEMS.map((item) => {
              const href = `/conferences/${conferenceId}/${item.href}`;
              const isActive = pathname?.startsWith(href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">{children}</main>
    </div>
  );
}
