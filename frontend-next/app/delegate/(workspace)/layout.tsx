"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarClock,
  FileText,
  Flag,
  Gavel,
  Landmark,
  LogOut,
  NotebookPen,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useDelegateAuth } from "@/lib/delegate-auth-context";

const NAV_ITEMS = [
  { href: "/delegate", label: "Overview", icon: Landmark, exact: true },
  { href: "/delegate/committee", label: "My Committee", icon: Gavel },
  { href: "/delegate/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/delegate/resources", label: "Resources", icon: BookOpen },
  { href: "/delegate/announcements", label: "Announcements", icon: Bell },
  { href: "/delegate/notes", label: "Notes", icon: NotebookPen },
  { href: "/delegate/documents", label: "Position Paper & Speech", icon: FileText },
  { href: "/delegate/resolutions", label: "Resolutions", icon: Flag },
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
      <aside className="hidden w-64 shrink-0 border-r bg-muted/20 md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            MB
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">MUN Buddy</p>
            <p className="text-xs text-muted-foreground">Delegate Workspace</p>
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
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <div className="mb-2 truncate px-3 text-xs text-muted-foreground">{delegate.email}</div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b bg-background px-6 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              MB
            </div>
            <p className="text-sm font-semibold">Delegate Workspace</p>
          </div>
          <button onClick={logout} className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

export default function DelegateLayout({ children }: { children: React.ReactNode }) {
  return <DelegateShell>{children}</DelegateShell>;
}
