"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardList,
  Gavel,
  Globe2,
  MapPin,
  Megaphone,
  ShieldCheck,
  Users2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoBadge } from "@/components/logo";
import { PublicNav, PublicFooter } from "@/components/public-nav";
import { api } from "@/lib/api";
import type { PublicConference, PublicOrganization, PublicStats } from "@/lib/types";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Registration & Assignment",
    text: "Custom registration forms, waitlists, bulk review, and conflict-checked committee/portfolio assignment.",
  },
  {
    icon: Gavel,
    title: "Committee Center",
    text: "Committees, portfolios, agendas, and a full multi-day schedule — general assemblies to crisis committees.",
  },
  {
    icon: Wallet,
    title: "Payments & Finance",
    text: "Fee structures, manual payment verification, refunds, discounts, and a live financial dashboard.",
  },
  {
    icon: Award,
    title: "Results & Certificates",
    text: "Awards, on-demand certificate PDFs, QR check-in, and public certificate verification.",
  },
  {
    icon: Megaphone,
    title: "Communication Center",
    text: "Announcements, resources, FAQs, in-app notifications, and email broadcasts — one inbox, not five apps.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Audit",
    text: "Live registration, committee, and financial analytics, plus an immutable audit trail of every action.",
  },
];

const JOURNEY = [
  { step: "01", title: "Create Organization", text: "Set up your organization once, then launch as many conferences under it as you need." },
  { step: "02", title: "Launch Conference", text: "Committees, portfolios, schedule, registration form, and fee structure — all in one workspace." },
  { step: "03", title: "Approve Delegates", text: "Review applications, manage waitlists, and approve delegates individually or in bulk." },
  { step: "04", title: "Assign Portfolios", text: "Conflict-checked committee and country/portfolio assignment, published in one click." },
  { step: "05", title: "Manage Sessions", text: "Run the multi-day schedule, attendance, and live communication from a single dashboard." },
  { step: "06", title: "Generate Certificates", text: "Publish results, issue awards, and generate verifiable certificates automatically." },
];

const TESTIMONIALS = [
  {
    quote: "MUN Buddy replaced four different tools for us — registration, payments, and certificates now run from one dashboard.",
    name: "Secretary-General",
    context: "University MUN Society",
  },
  {
    quote: "Delegate assignment used to take our team a full weekend. With conflict-checked assignment, it's down to an afternoon.",
    name: "Conference Organizer",
    context: "High School MUN Conference",
  },
  {
    quote: "As a delegate, having my schedule, position papers, and certificate all in one workspace made the whole conference feel effortless.",
    name: "Delegate",
    context: "Model United Nations Program",
  },
];

function StatTile({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="text-center">
      {loading ? (
        <Skeleton className="mx-auto h-9 w-16" />
      ) : (
        <p className="font-heading text-3xl font-bold text-white sm:text-4xl">{value.toLocaleString()}+</p>
      )}
      <p className="mt-1.5 text-sm text-white/60">{label}</p>
    </div>
  );
}

export default function Home() {
  const [conferences, setConferences] = useState<PublicConference[]>([]);
  const [organizations, setOrganizations] = useState<PublicOrganization[]>([]);
  const [stats, setStats] = useState<PublicStats>({ organizations: 0, conferences: 0, delegates: 0, countries: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ success: true; conferences: PublicConference[] }>("/public/conferences"),
      api.get<{ success: true; organizations: PublicOrganization[] }>("/public/organizations"),
      api.get<{ success: true; stats: PublicStats }>("/public/stats"),
    ])
      .then(([conferencesRes, organizationsRes, statsRes]) => {
        setConferences(conferencesRes.conferences.slice(0, 3));
        setOrganizations(organizationsRes.organizations.slice(0, 4));
        setStats(statsRes.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 15%, white 0, transparent 40%), radial-gradient(circle at 88% 8%, white 0, transparent 35%), radial-gradient(circle at 50% 100%, var(--brand-gold) 0, transparent 45%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-6 py-20 sm:py-24 lg:min-h-[min(90vh,760px)] lg:grid-cols-[1.15fr_0.85fr] lg:py-0">
          <div className="text-center lg:text-left">
            <Badge className="mb-5 border-brand-gold/40 bg-white/10 text-brand-gold-soft" variant="outline">
              The operating system for Model UN
            </Badge>
            <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:mx-0">
              Run, Discover, and Experience Model United Nations
              <span className="text-brand-gold"> — All in One Platform</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-white/70 lg:mx-0">
              Registration, committees, payments, certificates, and communication — everything a conference needs,
              without Google Forms, Excel, or WhatsApp.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Button size="lg" variant="accent" render={<Link href="/discover" />} nativeButton={false}>
                Explore Conferences <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                size="lg" variant="outline"
                className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                render={<Link href="/register" />} nativeButton={false}
              >
                Create Organization
              </Button>
            </div>
            <Link href="/delegate/login" className="mt-6 inline-block text-sm text-white/60 underline-offset-4 hover:text-brand-gold hover:underline">
              I&apos;m a delegate — sign in to my workspace
            </Link>
          </div>

          <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-8 rounded-full border border-brand-gold/20" />
            <div className="absolute inset-16 rounded-full border border-white/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-56 w-56 items-center justify-center rounded-full bg-white/[0.03] shadow-2xl ring-1 ring-white/10 backdrop-blur">
                <LogoBadge size={168} className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]" />
              </div>
            </div>
            {[
              { Icon: Globe2, pos: "left-2 top-6" },
              { Icon: Gavel, pos: "right-0 top-1/3" },
              { Icon: Award, pos: "left-0 bottom-10" },
              { Icon: Users2, pos: "right-6 bottom-2" },
            ].map(({ Icon, pos }, i) => (
              <div key={i} className={`absolute ${pos} flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-brand-gold ring-1 ring-white/15 backdrop-blur`}>
                <Icon className="h-5 w-5" />
              </div>
            ))}
          </div>
        </div>

        {/* Platform statistics */}
        <div className="relative border-t border-white/10 bg-black/10">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4">
            <StatTile label="Organizations" value={stats.organizations} loading={loading} />
            <StatTile label="Conferences" value={stats.conferences} loading={loading} />
            <StatTile label="Delegates" value={stats.delegates} loading={loading} />
            <StatTile label="Countries Represented" value={stats.countries} loading={loading} />
          </div>
        </div>
      </section>

      {/* Featured conferences */}
      <section className="mx-auto w-full max-w-[1440px] px-6 py-16 sm:py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Discover</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Featured conferences</h2>
          </div>
          <Link href="/discover" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 w-full" />)}
          </div>
        ) : conferences.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public conferences yet — check back soon.</p>
        ) : (
          <div className="-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
            {conferences.map((c) => (
              <Link key={c.id} href={`/discover/${c.slug}`} className="w-[85vw] shrink-0 snap-start sm:w-auto">
                <Card className="h-full overflow-hidden py-0 transition-shadow hover:shadow-md">
                  <div className="relative flex h-24 items-end bg-gradient-to-br from-brand-navy to-brand-navy-light p-4">
                    <div
                      className="pointer-events-none absolute inset-0 opacity-20"
                      style={{ backgroundImage: "radial-gradient(circle at 85% 0%, white 0, transparent 55%)" }}
                    />
                    <span className="relative rounded-md bg-white/15 px-2 py-1 text-xs font-medium text-white backdrop-blur">
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
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs font-medium text-brand-navy">
                        <Users2 className="h-3 w-3" /> {c.committee_count} committee{c.committee_count === 1 ? "" : "s"}
                      </span>
                      <span className="text-xs font-medium text-primary">Register →</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        <Link href="/discover" className="mt-6 flex items-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden">
          View all conferences <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* Why MUN Buddy */}
      <section id="features" className="bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Why MUN Buddy</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Every conference operation, one connected platform
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="border-border/70 bg-background transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-muted-foreground">{f.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="mx-auto w-full max-w-[1440px] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">How it works</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            From creating an organization to handing out certificates
          </h2>
        </div>
        <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-3">
          {JOURNEY.map((s, i) => (
            <div key={s.step} className="relative text-center">
              {i % 3 !== 2 && (
                <div className="absolute top-6 left-[calc(50%+28px)] hidden h-px w-[calc(100%-56px)] bg-border sm:block" />
              )}
              <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-gold bg-background font-heading text-lg font-bold text-brand-navy">
                {s.step}
              </div>
              <p className="font-semibold">{s.title}</p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured organizations */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Communities</p>
              <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Featured organizations</h2>
            </div>
            <Link href="/organizations" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public organizations yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-4">
              {organizations.map((o) => (
                <Link key={o.id} href={`/organizations/${o.slug}`}>
                  <Card className="h-full bg-background transition-shadow hover:shadow-md">
                    <CardContent className="space-y-2.5 p-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-navy text-sm font-bold text-brand-gold">
                        <Building2 className="h-4.5 w-4.5" />
                      </div>
                      <p className="font-medium leading-tight">{o.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.conference_count} conference{o.conference_count === 1 ? "" : "s"} hosted
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto w-full max-w-[1440px] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">Testimonials</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Trusted by organizers and delegates alike
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name + t.context} className="h-full border-border/70">
              <CardContent className="flex h-full flex-col gap-4 p-6">
                <p className="font-heading text-3xl leading-none text-brand-gold">&ldquo;</p>
                <p className="flex-1 text-sm text-foreground/80">{t.quote}</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.context}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-brand-navy py-16 text-center text-white sm:py-20">
        <div className="mx-auto max-w-2xl px-6">
          <ShieldCheck className="mx-auto mb-4 h-9 w-9 text-brand-gold" />
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Ready to run your own conference?</h2>
          <p className="mt-3 text-white/70">
            Set up your organization, launch a conference, and manage the entire lifecycle — for free.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="accent" render={<Link href="/register" />} nativeButton={false}>
              Create Your Organization <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              size="lg" variant="outline"
              className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              render={<Link href="/discover" />} nativeButton={false}
            >
              Browse Conferences
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
