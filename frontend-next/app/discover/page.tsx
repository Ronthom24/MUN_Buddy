"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, MapPin, Search, SlidersHorizontal, Users2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicNav, PublicFooter } from "@/components/public-nav";
import { api } from "@/lib/api";
import type { PublicConference } from "@/lib/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_ITEMS = Object.fromEntries([["all", "Any month"], ...MONTHS.map((m, i) => [String(i + 1), m])]);
const STATUS_ITEMS = { all: "Any status", open: "Open", closed: "Closed", invite_only: "Invite only" };

export default function ConferencesDirectoryPage() {
  const [conferences, setConferences] = useState<PublicConference[]>([]);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [month, setMonth] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (country) params.set("country", country);
      if (month !== "all") params.set("month", month);
      if (status !== "all") params.set("registrationStatus", status);
      api
        .get<{ success: true; conferences: PublicConference[] }>(`/public/conferences?${params.toString()}`)
        .then((res) => setConferences(res.conferences))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, country, month, status]);

  const activeFilterCount = useMemo(
    () => [country, month !== "all", status !== "all"].filter(Boolean).length,
    [country, month, status]
  );

  const clearFilters = () => {
    setCountry("");
    setMonth("all");
    setStatus("all");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <section className="border-b border-border/70 bg-muted/30">
        <div className="mx-auto max-w-[1440px] px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Conference Directory</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Discover Model United Nations conferences
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Browse conferences open for registration — no account needed to explore.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, acronym, or organization..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)} className="gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            {activeFilterCount > 0 && <Badge className="ml-1 h-4 min-w-4 rounded-full px-1 text-[10px]">{activeFilterCount}</Badge>}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="mb-6 grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Country / City</label>
              <Input placeholder="e.g. Delhi, India" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Month</label>
              <Select items={MONTH_ITEMS} value={month} onValueChange={(v) => setMonth(String(v))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MONTH_ITEMS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Registration status</label>
              <Select items={STATUS_ITEMS} value={status} onValueChange={(v) => setStatus(String(v))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_ITEMS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : conferences.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-muted-foreground">No conferences match your filters.</p>
            {activeFilterCount > 0 && (
              <Button variant="link" onClick={clearFilters} className="mt-1">Clear filters</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {conferences.map((c) => (
              <Link key={c.id} href={`/discover/${c.slug}`}>
                <Card className="h-full overflow-hidden py-0 transition-shadow hover:shadow-md">
                  <div className="relative flex h-20 items-end bg-gradient-to-br from-brand-navy to-brand-navy-light p-4">
                    <span className="rounded-md bg-white/15 px-2 py-1 text-xs font-medium text-white backdrop-blur">
                      {c.organization_name}
                    </span>
                  </div>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-tight">{c.name}</p>
                      <Badge variant={c.registration_status === "open" ? "default" : "outline"} className="shrink-0">
                        {c.registration_status === "open" ? "Open" : c.registration_status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
