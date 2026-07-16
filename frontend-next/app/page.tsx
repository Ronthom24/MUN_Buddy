"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav, PublicFooter } from "@/components/public-nav";
import { api } from "@/lib/api";
import type { PublicConference, PublicOrganization } from "@/lib/types";

export default function Home() {
  const [conferences, setConferences] = useState<PublicConference[]>([]);
  const [organizations, setOrganizations] = useState<PublicOrganization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ success: true; conferences: PublicConference[] }>("/public/conferences"),
      api.get<{ success: true; organizations: PublicOrganization[] }>("/public/organizations"),
    ])
      .then(([conferencesRes, organizationsRes]) => {
        setConferences(conferencesRes.conferences.slice(0, 3));
        setOrganizations(organizationsRes.organizations.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
          MB
        </div>
        <h1 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Manage, Organize and Experience Model United Nations Conferences from One Platform
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Registration, committees, payments, certificates, and communication — everything a conference needs,
          without Google Forms, Excel, or WhatsApp.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" render={<Link href="/discover" />} nativeButton={false}>
            Browse conferences
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/register" />} nativeButton={false}>
            Organize a conference
          </Button>
        </div>
        <Link href="/delegate/login" className="mt-4 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline">
          I'm a delegate — sign in to my workspace
        </Link>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Upcoming conferences</h2>
          <Link href="/discover" className="flex items-center gap-1 text-sm text-primary hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
        ) : conferences.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public conferences yet — check back soon.</p>
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
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Featured organizations</h2>
          <Link href="/organizations" className="flex items-center gap-1 text-sm text-primary hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : organizations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public organizations yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-4">
            {organizations.map((o) => (
              <Link key={o.id} href={`/organizations/${o.slug}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="space-y-1 p-5">
                    <p className="font-medium">{o.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.conference_count} conference{o.conference_count === 1 ? "" : "s"} hosted
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-auto">
        <PublicFooter />
      </div>
    </div>
  );
}
