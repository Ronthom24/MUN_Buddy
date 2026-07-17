"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav, PublicFooter } from "@/components/public-nav";
import { api } from "@/lib/api";
import type { PublicOrganization } from "@/lib/types";

export default function OrganizationsDirectoryPage() {
  const [organizations, setOrganizations] = useState<PublicOrganization[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      api
        .get<{ success: true; organizations: PublicOrganization[] }>(`/public/organizations?search=${encodeURIComponent(search)}`)
        .then((res) => setOrganizations(res.organizations))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <section className="border-b border-border/70 bg-muted/30">
        <div className="mx-auto max-w-[1440px] px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Organization Directory</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            MUN societies and institutions on MUN Buddy
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Explore the organizations running conferences on the platform.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-10">
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search organizations..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : organizations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No organizations found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((o) => (
              <Link key={o.id} href={`/organizations/${o.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-navy text-sm font-bold text-brand-gold">
                      <Building2 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{o.name}</p>
                      {o.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{o.description}</p>}
                    </div>
                    <p className="text-xs font-medium text-brand-navy">
                      {o.conference_count} conference{o.conference_count === 1 ? "" : "s"} ·{" "}
                      {o.upcoming_conference_count} upcoming
                    </p>
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
