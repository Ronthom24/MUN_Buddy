"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, MapPin, Search, Users2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav, PublicFooter } from "@/components/public-nav";
import { api } from "@/lib/api";
import type { PublicConference } from "@/lib/types";

export default function ConferencesDirectoryPage() {
  const [conferences, setConferences] = useState<PublicConference[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      api
        .get<{ success: true; conferences: PublicConference[] }>(`/public/conferences?search=${encodeURIComponent(search)}`)
        .then((res) => setConferences(res.conferences))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Conferences</h1>
          <p className="text-muted-foreground">Discover Model United Nations conferences open for registration.</p>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search conferences..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
        ) : conferences.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No public conferences found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {conferences.map((c) => (
              <Link key={c.id} href={`/discover/${c.slug}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{c.name}</p>
                      <Badge variant={c.registration_status === "open" ? "default" : "outline"}>
                        {c.registration_status === "open" ? "Open" : c.registration_status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.organization_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {new Date(c.start_date).toLocaleDateString()}</span>
                      {c.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users2 className="h-3 w-3" /> {c.committee_count} committee{c.committee_count === 1 ? "" : "s"}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
