"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { CalendarClock, Globe, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav, PublicFooter } from "@/components/public-nav";
import { api, ApiRequestError } from "@/lib/api";
import type { PublicConference, PublicOrganization } from "@/lib/types";

export default function OrganizationDetailPage() {
  const params = useParams<{ slug: string }>();
  const [organization, setOrganization] = useState<PublicOrganization | null>(null);
  const [conferences, setConferences] = useState<PublicConference[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api
      .get<{ success: true; organization: PublicOrganization; conferences: PublicConference[] }>(`/public/organizations/${params.slug}`)
      .then((res) => {
        setOrganization(res.organization);
        setConferences(res.conferences);
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) setMissing(true);
      })
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (missing) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      {loading ? (
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
          <Skeleton className="h-40 w-full" />
        </main>
      ) : organization ? (
        <>
          <section className="relative overflow-hidden bg-brand-navy text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: "radial-gradient(circle at 85% 0%, white 0, transparent 45%)" }}
            />
            <div className="relative mx-auto max-w-4xl px-6 py-14">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-lg font-bold text-brand-gold ring-1 ring-white/15">
                {organization.name.slice(0, 1)}
              </div>
              <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{organization.name}</h1>
              {organization.description && <p className="mt-2 max-w-2xl text-white/70">{organization.description}</p>}
              {organization.website && (
                <a href={organization.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-brand-gold-soft hover:text-brand-gold hover:underline">
                  <Globe className="h-3.5 w-3.5" /> {organization.website}
                </a>
              )}
              <div className="mt-4 flex gap-3 text-sm text-white/70">
                <span>{conferences.length} conference{conferences.length === 1 ? "" : "s"} hosted</span>
                <span>·</span>
                <span>
                  {conferences.filter((c) => new Date(c.start_date) >= new Date()).length} upcoming
                </span>
              </div>
            </div>
          </section>

          <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
            <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight">Conferences</h2>
            {conferences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No public conferences from this organization yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {conferences.map((c) => (
                  <Link key={c.id} href={`/discover/${c.slug}`}>
                    <Card className="h-full transition-colors hover:border-primary/40">
                      <CardContent className="space-y-2 p-5">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{c.name}</p>
                          <Badge variant={c.registration_status === "open" ? "default" : "outline"}>
                            {c.registration_status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {new Date(c.start_date).toLocaleDateString()}</span>
                          {c.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </>
      ) : null}
      <PublicFooter />
    </div>
  );
}
