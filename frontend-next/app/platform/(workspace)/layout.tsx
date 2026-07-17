"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarClock,
  FileClock,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sliders,
  User,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformAdminAuth } from "@/lib/platform-auth-context";
import { LogoMark } from "@/components/logo";

const NAV_ITEMS = [
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/platform/organizations", label: "Organizations", icon: Building2 },
  { href: "/platform/conferences", label: "Conferences", icon: CalendarClock },
  { href: "/platform/users", label: "Users", icon: Users2 },
  { href: "/platform/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/platform/audit-logs", label: "Audit Logs", icon: FileClock },
  { href: "/platform/security", label: "Security", icon: ShieldCheck },
  { href: "/platform/settings", label: "Settings", icon: Sliders },
  { href: "/platform/profile", label: "Profile", icon: User },
];

function PlatformShell({ children }: { children: React.ReactNode }) {
  const { admin, loading, logout } = usePlatformAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !admin) router.replace("/platform/login");
  }, [loading, admin, router]);

  if (loading || !admin) {
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
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">Platform Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map((item) => {
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
          <div className="mb-2 truncate px-3 text-xs text-sidebar-foreground/60">{admin.email}</div>
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
            <LogoMark size={32} />
            <p className="text-sm font-semibold">Platform Admin</p>
          </div>
          <button onClick={logout} className="p-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </header>
        <div className="hidden h-[72px] items-center border-b border-border bg-card px-6 md:flex">
          <p className="text-sm font-medium text-muted-foreground">Platform Administration</p>
        </div>
        <main className="px-6 py-8 md:px-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function PlatformWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
