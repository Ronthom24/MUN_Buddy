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
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">MUN societies and institutions hosting conferences on MUN Buddy.</p>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search organizations..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : organizations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No organizations found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {organizations.map((o) => (
              <Link key={o.id} href={`/organizations/${o.slug}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="space-y-2 p-5">
                    <p className="font-medium">{o.name}</p>
                    {o.description && <p className="line-clamp-2 text-xs text-muted-foreground">{o.description}</p>}
                    <p className="text-xs text-muted-foreground">
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
