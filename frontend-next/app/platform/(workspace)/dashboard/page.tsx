"use client";

import { useEffect, useState } from "react";
import { Award, Building2, CalendarClock, IndianRupee, ShieldAlert, Users2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { platformApi } from "@/lib/platform-api";
import type { PlatformDashboardStats } from "@/lib/types";

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Building2; label: string; value: number; sub?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/80">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlatformDashboardPage() {
  const [stats, setStats] = useState<PlatformDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformApi
      .get<{ success: true; stats: PlatformDashboardStats }>("/platform/dashboard")
      .then((res) => setStats(res.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform Dashboard</h1>
        <p className="text-muted-foreground">Overview of every organization and conference on MUN Buddy.</p>
      </div>

      {loading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Building2} label="Organizations" value={stats.organizations.total} sub={`${stats.organizations.suspended} suspended`} />
          <StatCard icon={CalendarClock} label="Conferences" value={stats.conferences.total} sub={`${stats.conferences.published} published`} />
          <StatCard icon={Users2} label="Organizers" value={stats.organizers.total} sub={`${stats.organizers.suspended} suspended`} />
          <StatCard icon={Users2} label="Delegates" value={stats.delegates.total} sub={`${stats.delegates.suspended} suspended`} />
          <StatCard icon={Award} label="Certificates issued" value={stats.certificates.total} />
          <StatCard icon={IndianRupee} label="Verified payments" value={stats.payments.total} sub={`₹${stats.payments.totalAmount.toLocaleString()} total`} />
          {(stats.organizations.suspended > 0 || stats.organizers.suspended > 0 || stats.delegates.suspended > 0) && (
            <Card className="border-warning/40 bg-warning/5 sm:col-span-2 lg:col-span-4">
              <CardContent className="flex items-center gap-3 p-5">
                <ShieldAlert className="h-5 w-5 text-warning" />
                <p className="text-sm text-foreground/80">
                  Some organizations or users are currently suspended — review them on the Users and Organizations pages.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
